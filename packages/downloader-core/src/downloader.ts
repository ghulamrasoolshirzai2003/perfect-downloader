import {
  AppError,
  detectPlatform,
  resolvePlatformStatus,
  type PlatformRuntimeContext,
} from '@pd/shared';
import { TempStorageManager, type ManagedTempFile, runFFmpeg } from '@pd/media-core';
import { validateUrlSsrfSafe } from './ssrf-guard';
import { runYtDlpDownload, type YtDlpDownloadProgress } from './ytdlp-runner';
import { extractWithFallback, hasFallbackAdapter } from './fallback-extractors';
import { safeDownloadToFile } from './http-safe';

export interface ExecuteDownloadOptions {
  url: string;
  formatId: string;
  attestation?: boolean;
  title?: string;
  targetFormat?: string;
  clipStart?: string;
  clipEnd?: string;
  runtimeContext: PlatformRuntimeContext;
  tempManager: TempStorageManager;
  onProgress?: (progress: YtDlpDownloadProgress) => void;
  signal?: AbortSignal;
}

export interface ExecuteDownloadResult {
  file: ManagedTempFile;
  fileName: string;
  mimeType: string;
}

export async function executeDownload(opts: ExecuteDownloadOptions): Promise<ExecuteDownloadResult> {
  const { url: rawUrl, formatId, title, attestation, targetFormat, clipStart, clipEnd, runtimeContext, tempManager, onProgress, signal } = opts;

  const detection = detectPlatform(rawUrl);
  const platform = detection.platform;

  if (!platform) {
    throw new AppError('UNSUPPORTED_PLATFORM', 'This URL is not supported');
  }

  const effectiveStatus = resolvePlatformStatus(platform, runtimeContext);

  if (effectiveStatus === 'unavailable') {
    throw new AppError('PLATFORM_TEMPORARILY_UNAVAILABLE', `${platform.name} is currently unavailable`);
  }

  if (effectiveStatus === 'restricted') {
    throw new AppError('DOWNLOAD_NOT_PERMITTED', `${platform.name} downloads are disabled on this instance`);
  }

  // If platform is restricted policy, user must have attested ownership / permission
  if (platform.policy === 'restricted' && !attestation) {
    throw new AppError(
      'ATTESTATION_REQUIRED',
      'You must confirm that you are the content owner or have permission to download this media',
    );
  }

  // SSRF check
  const { safeUrl } = await validateUrlSsrfSafe(detection.url);

  // Allocate temporary output destination
  let downloadTemp = await tempManager.createTempFile({
    prefix: 'dl',
    extension: targetFormat === 'mp3' ? 'm4a' : (targetFormat || 'mp4'),
  });

  const effectiveFormat = (formatId === 'best' || formatId.includes('+') || formatId.includes('/') || targetFormat === 'mp3')
    ? (targetFormat === 'mp3' ? 'bestaudio/best' : formatId)
    : `${formatId}+bestaudio/${formatId}/best`;

  const MIME_BY_EXT: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    opus: 'audio/opus',
    wav: 'audio/wav',
    flac: 'audio/flac',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  };

  let fallbackPickedExt: string | undefined;

  const runFallbackDownload = async () => {
    const fb = await extractWithFallback(platform.id, safeUrl.toString(), signal);
    if (!fb || fb.formats.length === 0) {
      throw new AppError('CONTENT_UNAVAILABLE', `Unable to extract downloadable media from ${platform.name}`);
    }
    const picked =
      fb.formats.find((f) => f.formatId === formatId) ||
      (targetFormat === 'mp3'
        ? fb.formats.find((f) => f.isAudioOnly) || fb.formats.find((f) => f.hasVideo) || fb.formats[0]
        : fb.formats.find((f) => f.hasVideo) || fb.formats[0])!;

    const ext = (picked.ext || 'mp4').toLowerCase();
    fallbackPickedExt = ext;
    const nextTemp = await tempManager.createTempFile({ prefix: 'dlfb', extension: ext });
    await downloadTemp.cleanup().catch(() => {});
    downloadTemp = nextTemp;

    if (picked.isHls || /\.m3u8(?:$|\?)/i.test(picked.directUrl)) {
      await validateUrlSsrfSafe(picked.directUrl);
      onProgress?.({ percent: 25, stage: 'Downloading HLS stream' });
      await runFFmpeg({
        args: ['-y', '-i', picked.directUrl, '-c', 'copy', '-movflags', '+faststart', downloadTemp.path],
        signal,
      });
      onProgress?.({ percent: 100, stage: 'Downloaded' });
    } else {
      onProgress?.({ percent: 10, stage: 'Downloading media stream' });
      const dlRes = await safeDownloadToFile(picked.directUrl, downloadTemp.path, {
        headers: picked.headers,
        signal,
      });
      if (dlRes.contentType.includes('image/png')) fallbackPickedExt = 'png';
      else if (dlRes.contentType.includes('image/webp')) fallbackPickedExt = 'webp';
      else if (dlRes.contentType.includes('image/gif')) fallbackPickedExt = 'gif';
      else if (dlRes.contentType.includes('image/jpeg')) fallbackPickedExt = 'jpg';
      else if (dlRes.contentType.includes('audio/mpeg')) fallbackPickedExt = 'mp3';
      onProgress?.({ percent: 100, stage: 'Downloaded' });
    }
  };

  try {
    const VIDEO_MERGE_CONTAINERS = new Set(['mp4', 'mkv', 'webm', 'ogg', 'flv', 'avi']);
    const normTarget = targetFormat?.toLowerCase();
    const mergeFormat = normTarget
      ? (VIDEO_MERGE_CONTAINERS.has(normTarget) ? normTarget : undefined)
      : 'mp4';

    if (formatId.startsWith('fb:') || platform.extractors.length === 0) {
      await runFallbackDownload();
    } else {
      try {
        await runYtDlpDownload({
          url: safeUrl.toString(),
          formatId: effectiveFormat,
          outputPath: downloadTemp.path,
          extractors: platform.extractors,
          mergeOutputFormat: mergeFormat,
          onProgress,
          signal,
        });
      } catch (ytErr) {
        if (hasFallbackAdapter(platform.id)) {
          await runFallbackDownload();
        } else {
          throw ytErr;
        }
      }
    }

    const fsPromises = (await import('node:fs')).promises;
    const pathMod = await import('node:path');
    let realPath = downloadTemp.path;
    try {
      await fsPromises.stat(realPath);
    } catch {
      // yt-dlp might have saved with container extension e.g. .mp4, .webm, or .mkv
      const dir = pathMod.dirname(downloadTemp.path);
      const base = pathMod.basename(downloadTemp.path);
      const entries = await fsPromises.readdir(dir);
      const found = entries.find((e) => e.startsWith(base));
      if (found) {
        realPath = pathMod.join(dir, found);
        downloadTemp.path = realPath;
      }
    }

    const detectedExt = fallbackPickedExt || pathMod.extname(realPath).slice(1).toLowerCase();
    const isImageFile = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(detectedExt);

    let finalFile = downloadTemp;
    let finalExt = detectedExt || targetFormat || 'mp4';
    let mimeType = MIME_BY_EXT[finalExt] || 'application/octet-stream';

    // If conversion requested (e.g. download as MP3) and input is audio/video (not already mp3 or an image)
    if (targetFormat && targetFormat === 'mp3' && !isImageFile && finalExt !== 'mp3') {
      const convertedTemp = await tempManager.createTempFile({ prefix: 'conv', extension: 'mp3' });
      await runFFmpeg({
        args: ['-i', downloadTemp.path, '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', convertedTemp.path],
        signal,
      });
      await downloadTemp.cleanup();
      finalFile = convertedTemp;
      finalExt = 'mp3';
      mimeType = 'audio/mpeg';
    }

    // If clipping is requested (start and/or end time)
    if (clipStart || clipEnd) {
      const clipTemp = await tempManager.createTempFile({ prefix: 'clip', extension: finalExt });
      const args: string[] = ['-i', finalFile.path];
      if (clipStart) args.push('-ss', clipStart);
      if (clipEnd) args.push('-to', clipEnd);
      if (finalExt === 'mp3') {
        args.push('-c:a', 'libmp3lame', '-b:a', '192k');
      } else {
        args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac');
      }
      args.push(clipTemp.path);
      await runFFmpeg({ args, signal });
      await finalFile.cleanup();
      finalFile = clipTemp;
    }

    const cleanTitle = (title ? title.replace(/[/\\?%*:|"<>]/g, '_').trim().slice(0, 100) : 'media') || 'download';

    return {
      file: finalFile,
      fileName: `${cleanTitle}.${finalExt}`,
      mimeType,
    };
  } catch (err) {
    await downloadTemp.cleanup().catch(() => {});
    throw err;
  }
}

