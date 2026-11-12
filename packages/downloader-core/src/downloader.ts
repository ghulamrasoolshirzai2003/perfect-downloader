import {
  AppError,
  detectPlatform,
  resolvePlatformStatus,
  type PlatformRuntimeContext,
} from '@pd/shared';
import { TempStorageManager, type ManagedTempFile, runFFmpeg } from '@pd/media-core';
import { validateUrlSsrfSafe } from './ssrf-guard';
import { runYtDlpDownload, type YtDlpDownloadProgress } from './ytdlp-runner';

export interface ExecuteDownloadOptions {
  url: string;
  formatId: string;
  attestation?: boolean;
  title?: string;
  targetFormat?: string;
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
  const { url: rawUrl, formatId, title, attestation, targetFormat, runtimeContext, tempManager, onProgress, signal } = opts;

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
  const downloadTemp = await tempManager.createTempFile({
    prefix: 'dl',
    extension: targetFormat === 'mp3' ? 'm4a' : (targetFormat || 'mp4'),
  });

  const effectiveFormat = (formatId === 'best' || formatId.includes('+') || formatId.includes('/') || targetFormat === 'mp3')
    ? (targetFormat === 'mp3' ? 'bestaudio/best' : formatId)
    : `${formatId}+bestaudio/best`;

  try {
    await runYtDlpDownload({
      url: safeUrl.toString(),
      formatId: effectiveFormat,
      outputPath: downloadTemp.path,
      extractors: platform.extractors,
      onProgress,
      signal,
    });

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

    let finalFile = downloadTemp;
    let finalExt = targetFormat || 'mp4';
    let mimeType = 'video/mp4';

    // If conversion requested (e.g. download as MP3)
    if (targetFormat && targetFormat === 'mp3') {
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

