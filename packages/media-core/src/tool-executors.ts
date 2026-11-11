import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { AppError, parseTimecode, type ToolDefinition } from '@pd/shared';
import { runFFmpeg, type FFmpegProgressCallback } from './ffmpeg-runner';
import { probeMedia } from './probe';
import { TempStorageManager, type ManagedTempFile } from './temp-storage';
import {
  convertImage,
  resizeImage,
  cropImage,
  rotateImage,
  inspectImage,
} from './sharp-runner';
import {
  mergePdfs,
  splitPdf,
  extractPdfPages,
  rotatePdfPages,
  compressPdf,
  imagesToPdf,
  inspectPdf,
} from './pdf-runner';
import { createZipArchive } from './zip-helper';

export interface ExecuteToolContext {
  tool: ToolDefinition;
  inputFiles: string[]; // Absolute paths to validated uploaded files
  options: Record<string, unknown>;
  tempManager: TempStorageManager;
  onProgress?: (progress: { percent?: number; stage?: string }) => void;
  signal?: AbortSignal;
}

export interface ExecuteToolResult {
  type: 'file' | 'data';
  outputFile?: ManagedTempFile;
  outputFileName?: string;
  outputMimeType?: string;
  data?: Record<string, unknown>;
}

export async function executeTool(ctx: ExecuteToolContext): Promise<ExecuteToolResult> {
  const { tool, inputFiles, options, tempManager, onProgress, signal } = ctx;
  const firstInput = inputFiles[0];

  if (!firstInput && tool.execution === 'server' && tool.minFiles > 0) {
    throw new AppError('INVALID_FILE', 'No input files provided');
  }

  // ── Video Tools ─────────────────────────────────────────────────────────────
  if (tool.id === 'video.convert') {
    const format = String(options.format || 'mp4');
    const quality = String(options.quality || 'balanced');
    const crf = quality === 'high' ? '18' : quality === 'small' ? '28' : '23';

    const probe = await probeMedia(firstInput!);
    const out = await tempManager.createTempFile({ prefix: 'video_convert', extension: format });

    let vcodec = 'libx264';
    let acodec = 'aac';
    if (format === 'webm') {
      vcodec = 'libvpx-vp9';
      acodec = 'libopus';
    }

    const args = [
      '-i', firstInput!,
      '-c:v', vcodec,
      '-crf', crf,
      '-preset', 'fast',
      '-c:a', acodec,
      '-b:a', '160k',
      '-pix_fmt', 'yuv420p',
      out.path,
    ];

    await runFFmpeg({
      args,
      totalDurationSeconds: probe.duration,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Converting video' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `converted.${format}`,
      outputMimeType: format === 'webm' ? 'video/webm' : 'video/mp4',
    };
  }

  if (tool.id === 'video.compress') {
    const level = String(options.level || 'balanced');
    const maxHeight = String(options.maxHeight || 'original');
    const crf = level === 'light' ? '24' : level === 'strong' ? '32' : '28';

    const probe = await probeMedia(firstInput!);
    const out = await tempManager.createTempFile({ prefix: 'video_compress', extension: 'mp4' });

    const filterArgs: string[] = [];
    if (maxHeight !== 'original' && probe.videoStream?.height && probe.videoStream.height > Number(maxHeight)) {
      filterArgs.push('-vf', `scale=-2:min(ih\\,${maxHeight})`);
    }

    const args = [
      '-i', firstInput!,
      ...filterArgs,
      '-c:v', 'libx264',
      '-crf', crf,
      '-preset', 'medium',
      '-c:a', 'aac',
      '-b:a', level === 'strong' ? '96k' : '128k',
      '-pix_fmt', 'yuv420p',
      out.path,
    ];

    await runFFmpeg({
      args,
      totalDurationSeconds: probe.duration,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Compressing video' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'compressed.mp4',
      outputMimeType: 'video/mp4',
    };
  }

  if (tool.id === 'video.trim') {
    const startSec = parseTimecode(String(options.start || '0')) ?? 0;
    const endRaw = String(options.end || '').trim();
    const endSec = endRaw ? parseTimecode(endRaw) : null;
    const mode = String(options.mode || 'precise');

    const probe = await probeMedia(firstInput!);
    const duration = (endSec !== null ? endSec : probe.duration) - startSec;
    const out = await tempManager.createTempFile({ prefix: 'video_trim', extension: 'mp4' });

    const timeArgs: string[] = ['-ss', startSec.toString()];
    if (endSec !== null) {
      timeArgs.push('-to', endSec.toString());
    }

    let codecArgs = ['-c:v', 'libx264', '-crf', '22', '-c:a', 'aac', '-pix_fmt', 'yuv420p'];
    if (mode === 'fast') {
      codecArgs = ['-c', 'copy'];
    }

    const args = [
      ...timeArgs,
      '-i', firstInput!,
      ...codecArgs,
      out.path,
    ];

    await runFFmpeg({
      args,
      totalDurationSeconds: duration > 0 ? duration : undefined,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Trimming video' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'trimmed.mp4',
      outputMimeType: 'video/mp4',
    };
  }

  if (tool.id === 'video.merge') {
    if (inputFiles.length < 2) {
      throw new AppError('INVALID_OPTIONS', 'At least 2 video files are required to merge');
    }

    const resolution = String(options.resolution || 'first');
    let targetH = 720;
    if (resolution === '1080') targetH = 1080;
    else if (resolution === '480') targetH = 480;
    else {
      const probe0 = await probeMedia(inputFiles[0]!);
      targetH = probe0.videoStream?.height ?? 720;
    }

    const out = await tempManager.createTempFile({ prefix: 'video_merged', extension: 'mp4' });

    // Scale and pad each video to standard 16:9 target or target height, then concat
    const inputArgs: string[] = [];
    const filterParts: string[] = [];
    let concatInputs = '';

    for (let i = 0; i < inputFiles.length; i++) {
      inputArgs.push('-i', inputFiles[i]!);
      filterParts.push(`[${i}:v]scale=-2:${targetH}:force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2:(ow-iw)/2:(oh-ih)/2,setsar=1[v${i}]`);
      concatInputs += `[v${i}][${i}:a]`;
    }

    const filterComplex = `${filterParts.join(';')};${concatInputs}concat=n=${inputFiles.length}:v=1:a=1[v][a]`;

    const args = [
      ...inputArgs,
      '-filter_complex', filterComplex,
      '-map', '[v]',
      '-map', '[a]',
      '-c:v', 'libx264',
      '-crf', '23',
      '-preset', 'fast',
      '-c:a', 'aac',
      '-b:a', '160k',
      '-pix_fmt', 'yuv420p',
      out.path,
    ];

    await runFFmpeg({
      args,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Merging videos' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'merged.mp4',
      outputMimeType: 'video/mp4',
    };
  }

  if (tool.id === 'video.to-audio' || tool.id === 'audio.convert') {
    const format = String(options.format || 'mp3');
    const bitrate = String(options.bitrate || '192');

    const probe = await probeMedia(firstInput!);
    const out = await tempManager.createTempFile({ prefix: 'audio_out', extension: format });

    let acodec = 'libmp3lame';
    if (format === 'm4a') acodec = 'aac';
    else if (format === 'wav') acodec = 'pcm_s16le';
    else if (format === 'flac') acodec = 'flac';
    else if (format === 'ogg') acodec = 'libvorbis';
    else if (format === 'opus') acodec = 'libopus';

    const codecArgs = format === 'wav' || format === 'flac'
      ? ['-c:a', acodec]
      : ['-c:a', acodec, '-b:a', `${bitrate}k`];

    const args = [
      '-i', firstInput!,
      '-vn',
      ...codecArgs,
      out.path,
    ];

    await runFFmpeg({
      args,
      totalDurationSeconds: probe.duration,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Extracting audio' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `audio.${format}`,
      outputMimeType: format === 'mp3' ? 'audio/mpeg' : format === 'wav' ? 'audio/wav' : 'audio/mp4',
    };
  }

  if (tool.id === 'video.to-gif') {
    const startSec = parseTimecode(String(options.start || '0')) ?? 0;
    const duration = Number(options.duration || 5);
    const fps = Number(options.fps || 12);
    const width = Number(options.width || 480);

    const out = await tempManager.createTempFile({ prefix: 'video_to_gif', extension: 'gif' });

    // High quality 2-pass palettegen/paletteuse
    const filter = `fps=${fps},scale=${width}:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer`;

    const args = [
      '-ss', startSec.toString(),
      '-t', duration.toString(),
      '-i', firstInput!,
      '-vf', filter,
      out.path,
    ];

    await runFFmpeg({
      args,
      totalDurationSeconds: duration,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Generating GIF' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'animation.gif',
      outputMimeType: 'image/gif',
    };
  }

  if (tool.id === 'video.thumbnail') {
    const mode = String(options.mode || 'single');
    const at = String(options.at || '0');
    const atSec = parseTimecode(at) ?? 0;
    const format = String(options.format || 'jpg');

    if (mode === 'single') {
      const out = await tempManager.createTempFile({ prefix: 'thumb', extension: format });
      const args = [
        '-ss', atSec.toString(),
        '-i', firstInput!,
        '-vframes', '1',
        '-q:v', '2',
        out.path,
      ];
      await runFFmpeg({ args, signal });
      return {
        type: 'file',
        outputFile: out,
        outputFileName: `thumbnail.${format}`,
        outputMimeType: format === 'png' ? 'image/png' : 'image/jpeg',
      };
    } else {
      const count = Math.min(12, Math.max(2, Number(options.count || 6)));
      const probe = await probeMedia(firstInput!);
      const dur = probe.duration > 0 ? probe.duration : 10;
      const step = dur / (count + 1);

      const tempDir = await tempManager.createTempDir('thumbs');
      const filesToZip: Array<{ sourcePath: string; nameInZip: string }> = [];

      for (let i = 1; i <= count; i++) {
        const timePos = Math.round(step * i * 10) / 10;
        const frameName = `frame_${i.toString().padStart(2, '0')}.${format}`;
        const framePath = path.join(tempDir.path, frameName);
        await runFFmpeg({
          args: ['-ss', timePos.toString(), '-i', firstInput!, '-vframes', '1', '-q:v', '2', framePath],
          signal,
        });
        filesToZip.push({ sourcePath: framePath, nameInZip: frameName });
      }

      const zipOut = await tempManager.createTempFile({ prefix: 'thumbnails', extension: 'zip' });
      await createZipArchive(filesToZip, zipOut.path);
      await tempDir.cleanup();

      return {
        type: 'file',
        outputFile: zipOut,
        outputFileName: 'thumbnails.zip',
        outputMimeType: 'application/zip',
      };
    }
  }

  if (tool.id === 'video.resize') {
    const height = String(options.height || '720');
    const probe = await probeMedia(firstInput!);
    const out = await tempManager.createTempFile({ prefix: 'video_resize', extension: 'mp4' });

    const args = [
      '-i', firstInput!,
      '-vf', `scale=-2:${height}`,
      '-c:v', 'libx264',
      '-crf', '23',
      '-c:a', 'copy',
      out.path,
    ];

    await runFFmpeg({
      args,
      totalDurationSeconds: probe.duration,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Resizing video' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `video_${height}p.mp4`,
      outputMimeType: 'video/mp4',
    };
  }

  if (tool.id === 'video.fps') {
    const fps = String(options.fps || '30');
    const probe = await probeMedia(firstInput!);
    const out = await tempManager.createTempFile({ prefix: 'video_fps', extension: 'mp4' });

    const args = [
      '-i', firstInput!,
      '-r', fps,
      '-c:v', 'libx264',
      '-crf', '23',
      '-c:a', 'copy',
      out.path,
    ];

    await runFFmpeg({
      args,
      totalDurationSeconds: probe.duration,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Changing FPS' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `video_${fps}fps.mp4`,
      outputMimeType: 'video/mp4',
    };
  }

  if (tool.id === 'video.mute') {
    const out = await tempManager.createTempFile({ prefix: 'video_mute', extension: 'mp4' });
    const args = ['-i', firstInput!, '-c:v', 'copy', '-an', out.path];
    await runFFmpeg({ args, signal });
    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'muted.mp4',
      outputMimeType: 'video/mp4',
    };
  }

  if (tool.id === 'video.audio-track') {
    const trackNum = Number(options.track || 1);
    const probe = await probeMedia(firstInput!);
    const audioStream = probe.audioStreams[trackNum - 1];
    const ext = audioStream?.codecName === 'aac' ? 'm4a' : audioStream?.codecName === 'mp3' ? 'mp3' : 'm4a';

    const out = await tempManager.createTempFile({ prefix: 'audio_track', extension: ext });
    const args = [
      '-i', firstInput!,
      '-map', `0:a:${trackNum - 1}`,
      '-c', 'copy',
      out.path,
    ];
    await runFFmpeg({ args, signal });
    return {
      type: 'file',
      outputFile: out,
      outputFileName: `audio_track_${trackNum}.${ext}`,
      outputMimeType: ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4',
    };
  }

  if (tool.id === 'video.subtitles') {
    const trackNum = Number(options.track || 1);
    const format = String(options.format || 'srt');
    const out = await tempManager.createTempFile({ prefix: 'subtitles', extension: format });
    const args = [
      '-i', firstInput!,
      '-map', `0:s:${trackNum - 1}`,
      '-c:s', format === 'srt' ? 'subrip' : format === 'vtt' ? 'webvtt' : 'ass',
      out.path,
    ];
    await runFFmpeg({ args, signal });
    return {
      type: 'file',
      outputFile: out,
      outputFileName: `subtitles_track_${trackNum}.${format}`,
      outputMimeType: 'text/plain',
    };
  }

  if (tool.id === 'video.metadata' || tool.id === 'audio.metadata') {
    const probe = await probeMedia(firstInput!);
    return {
      type: 'data',
      data: probe as unknown as Record<string, unknown>,
    };
  }

  // ── Audio Tools ─────────────────────────────────────────────────────────────
  if (tool.id === 'audio.compress') {
    const format = String(options.format || 'mp3');
    const bitrate = String(options.bitrate || '96');
    const mono = Boolean(options.mono);

    const probe = await probeMedia(firstInput!);
    const out = await tempManager.createTempFile({ prefix: 'audio_compress', extension: format });

    const channelArgs = mono ? ['-ac', '1'] : [];
    const args = [
      '-i', firstInput!,
      '-c:a', format === 'mp3' ? 'libmp3lame' : format === 'm4a' ? 'aac' : 'libopus',
      '-b:a', `${bitrate}k`,
      ...channelArgs,
      out.path,
    ];

    await runFFmpeg({
      args,
      totalDurationSeconds: probe.duration,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Compressing audio' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `compressed.${format}`,
      outputMimeType: format === 'mp3' ? 'audio/mpeg' : 'audio/mp4',
    };
  }

  if (tool.id === 'audio.trim') {
    const startSec = parseTimecode(String(options.start || '0')) ?? 0;
    const endRaw = String(options.end || '').trim();
    const endSec = endRaw ? parseTimecode(endRaw) : null;
    const fade = Boolean(options.fade);

    const probe = await probeMedia(firstInput!);
    const dur = (endSec !== null ? endSec : probe.duration) - startSec;
    const out = await tempManager.createTempFile({ prefix: 'audio_trim', extension: 'mp3' });

    const timeArgs: string[] = ['-ss', startSec.toString()];
    if (endSec !== null) {
      timeArgs.push('-to', endSec.toString());
    }

    const filterParts: string[] = [];
    if (fade && dur > 2) {
      filterParts.push(`afade=t=in:ss=0:d=1,afade=t=out:st=${Math.max(1, dur - 1)}:d=1`);
    }

    const filterArgs = filterParts.length ? ['-af', filterParts.join(',')] : [];

    const args = [
      ...timeArgs,
      '-i', firstInput!,
      ...filterArgs,
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      out.path,
    ];

    await runFFmpeg({
      args,
      totalDurationSeconds: dur > 0 ? dur : undefined,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Trimming audio' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'trimmed.mp3',
      outputMimeType: 'audio/mpeg',
    };
  }

  if (tool.id === 'audio.merge') {
    if (inputFiles.length < 2) {
      throw new AppError('INVALID_OPTIONS', 'At least 2 audio files are required to merge');
    }
    const format = String(options.format || 'mp3');
    const out = await tempManager.createTempFile({ prefix: 'audio_merged', extension: format });

    const inputArgs: string[] = [];
    let concatInputs = '';
    for (let i = 0; i < inputFiles.length; i++) {
      inputArgs.push('-i', inputFiles[i]!);
      concatInputs += `[${i}:a]`;
    }

    const filter = `${concatInputs}concat=n=${inputFiles.length}:v=0:a=1[a]`;

    const args = [
      ...inputArgs,
      '-filter_complex', filter,
      '-map', '[a]',
      '-c:a', format === 'mp3' ? 'libmp3lame' : format === 'm4a' ? 'aac' : 'pcm_s16le',
      '-b:a', '192k',
      out.path,
    ];

    await runFFmpeg({
      args,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Merging audio' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `merged.${format}`,
      outputMimeType: format === 'mp3' ? 'audio/mpeg' : 'audio/mp4',
    };
  }

  if (tool.id === 'audio.normalize') {
    const target = String(options.target || '-14');
    const format = String(options.format || 'mp3');
    const probe = await probeMedia(firstInput!);
    const out = await tempManager.createTempFile({ prefix: 'audio_norm', extension: format });

    const args = [
      '-i', firstInput!,
      '-af', `loudnorm=I=${target}:LRA=11:TP=-1.5`,
      '-c:a', format === 'mp3' ? 'libmp3lame' : format === 'm4a' ? 'aac' : 'pcm_s16le',
      '-b:a', '256k',
      out.path,
    ];

    await runFFmpeg({
      args,
      totalDurationSeconds: probe.duration,
      onProgress: (p) => onProgress?.({ percent: p.percent, stage: 'Normalizing loudness' }),
      signal,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `normalized.${format}`,
      outputMimeType: format === 'mp3' ? 'audio/mpeg' : 'audio/mp4',
    };
  }

  if (tool.id === 'audio.tags') {
    const out = await tempManager.createTempFile({ prefix: 'audio_tagged', extension: 'mp3' });
    const metadataArgs: string[] = [];

    const tagFields = ['title', 'artist', 'album', 'date', 'genre', 'track', 'comment'] as const;
    for (const f of tagFields) {
      if (options[f]) {
        metadataArgs.push('-metadata', `${f}=${String(options[f])}`);
      }
    }

    const args = [
      '-i', firstInput!,
      '-c', 'copy',
      ...metadataArgs,
      out.path,
    ];

    await runFFmpeg({ args, signal });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'tagged.mp3',
      outputMimeType: 'audio/mpeg',
    };
  }

  // ── Image Tools ─────────────────────────────────────────────────────────────
  if (tool.id === 'image.convert' || tool.id === 'image.compress') {
    const format = String(options.format || (tool.id === 'image.compress' ? 'keep' : 'webp'));
    const quality = Number(options.quality || (tool.id === 'image.compress' ? 75 : 82));
    const stripMetadata = Boolean(options.stripMetadata ?? true);

    if (inputFiles.length === 1) {
      let targetFmt = format;
      if (targetFmt === 'keep') {
        const meta = await inspectImage(firstInput!);
        targetFmt = meta.format === 'jpeg' ? 'jpg' : meta.format || 'jpg';
      }
      const out = await tempManager.createTempFile({ prefix: 'img_conv', extension: targetFmt });
      await convertImage(firstInput!, out.path, {
        format: targetFmt as any,
        quality,
        stripMetadata,
      });

      return {
        type: 'file',
        outputFile: out,
        outputFileName: `converted.${targetFmt}`,
        outputMimeType: `image/${targetFmt === 'jpg' ? 'jpeg' : targetFmt}`,
      };
    } else {
      // Bulk conversion into zip
      const tempDir = await tempManager.createTempDir('imgs');
      const filesToZip: Array<{ sourcePath: string; nameInZip: string }> = [];

      for (let i = 0; i < inputFiles.length; i++) {
        const inFile = inputFiles[i]!;
        let targetFmt = format;
        if (targetFmt === 'keep') {
          const meta = await inspectImage(inFile);
          targetFmt = meta.format === 'jpeg' ? 'jpg' : meta.format || 'jpg';
        }
        const baseName = path.parse(inFile).name || `image_${i + 1}`;
        const outFileName = `${baseName}_converted.${targetFmt}`;
        const outPath = path.join(tempDir.path, outFileName);

        await convertImage(inFile, outPath, {
          format: targetFmt as any,
          quality,
          stripMetadata,
        });

        filesToZip.push({ sourcePath: outPath, nameInZip: outFileName });
      }

      const zipOut = await tempManager.createTempFile({ prefix: 'converted_images', extension: 'zip' });
      await createZipArchive(filesToZip, zipOut.path);
      await tempDir.cleanup();

      return {
        type: 'file',
        outputFile: zipOut,
        outputFileName: 'converted_images.zip',
        outputMimeType: 'application/zip',
      };
    }
  }

  if (tool.id === 'image.resize') {
    const width = Number(options.width || 0);
    const height = Number(options.height || 0);
    const fit = String(options.fit || 'inside') as any;
    const withoutEnlargement = Boolean(options.withoutEnlargement ?? true);

    const meta = await inspectImage(firstInput!);
    const ext = meta.format === 'jpeg' ? 'jpg' : meta.format || 'jpg';
    const out = await tempManager.createTempFile({ prefix: 'img_resize', extension: ext });

    await resizeImage(firstInput!, out.path, {
      width,
      height,
      fit,
      withoutEnlargement,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `resized.${ext}`,
      outputMimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    };
  }

  if (tool.id === 'image.crop') {
    const mode = String(options.mode || 'aspect') as any;
    const aspect = String(options.aspect || '1:1');
    const position = String(options.position || 'center') as any;
    const left = Number(options.left || 0);
    const top = Number(options.top || 0);
    const width = Number(options.width || 100);
    const height = Number(options.height || 100);

    const meta = await inspectImage(firstInput!);
    const ext = meta.format === 'jpeg' ? 'jpg' : meta.format || 'jpg';
    const out = await tempManager.createTempFile({ prefix: 'img_crop', extension: ext });

    await cropImage(firstInput!, out.path, {
      mode,
      aspect,
      position,
      left,
      top,
      width,
      height,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `cropped.${ext}`,
      outputMimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    };
  }

  if (tool.id === 'image.rotate') {
    const angle = Number(options.angle || 0);
    const flip = String(options.flip || 'none') as any;

    const meta = await inspectImage(firstInput!);
    const ext = meta.format === 'jpeg' ? 'jpg' : meta.format || 'jpg';
    const out = await tempManager.createTempFile({ prefix: 'img_rotate', extension: ext });

    await rotateImage(firstInput!, out.path, { angle, flip });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `rotated.${ext}`,
      outputMimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    };
  }

  if (tool.id === 'image.metadata') {
    const meta = await inspectImage(firstInput!);
    return {
      type: 'data',
      data: meta as Record<string, unknown>,
    };
  }

  // ── GIF Tools ─────────────────────────────────────────────────────────────
  if (tool.id === 'gif.make') {
    if (inputFiles.length < 2) {
      throw new AppError('INVALID_OPTIONS', 'At least 2 images are required to make a GIF');
    }
    const delay = Number(options.delay || 500);
    const width = Number(options.width || 480);
    const fps = Math.max(1, Math.round(1000 / delay));

    const tempDir = await tempManager.createTempDir('gif_frames');
    // Normalize and resize all frames to uniform dimensions
    for (let i = 0; i < inputFiles.length; i++) {
      const framePath = path.join(tempDir.path, `frame_${i.toString().padStart(4, '0')}.png`);
      await resizeImage(inputFiles[i]!, framePath, {
        width,
        fit: 'inside',
        withoutEnlargement: false,
      });
    }

    const out = await tempManager.createTempFile({ prefix: 'gif_make', extension: 'gif' });
    const inputPattern = path.join(tempDir.path, 'frame_%04d.png');

    const filter = `fps=${fps},split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer`;
    const args = [
      '-framerate', fps.toString(),
      '-i', inputPattern,
      '-vf', filter,
      out.path,
    ];

    await runFFmpeg({ args, signal });
    await tempDir.cleanup();

    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'animation.gif',
      outputMimeType: 'image/gif',
    };
  }

  if (tool.id === 'gif.to-video') {
    const format = String(options.format || 'mp4');
    const out = await tempManager.createTempFile({ prefix: 'gif_to_video', extension: format });

    // Video encoders require even dimensions
    const filter = 'scale=trunc(iw/2)*2:trunc(ih/2)*2';
    const args = [
      '-i', firstInput!,
      '-vf', filter,
      '-c:v', format === 'mp4' ? 'libx264' : 'libvpx-vp9',
      '-pix_fmt', 'yuv420p',
      '-crf', '20',
      out.path,
    ];

    await runFFmpeg({ args, signal });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: `animation.${format}`,
      outputMimeType: format === 'mp4' ? 'video/mp4' : 'video/webm',
    };
  }

  if (tool.id === 'gif.compress') {
    const level = String(options.level || 'balanced');
    const colors = level === 'light' ? 128 : level === 'strong' ? 32 : 64;

    const out = await tempManager.createTempFile({ prefix: 'gif_comp', extension: 'gif' });
    const filter = `split[s0][s1];[s0]palettegen=max_colors=${colors}[p];[s1][p]paletteuse=dither=bayer`;

    const args = [
      '-i', firstInput!,
      '-vf', filter,
      out.path,
    ];

    await runFFmpeg({ args, signal });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'compressed.gif',
      outputMimeType: 'image/gif',
    };
  }

  if (tool.id === 'gif.resize') {
    const width = Number(options.width || 320);
    const out = await tempManager.createTempFile({ prefix: 'gif_resize', extension: 'gif' });

    await resizeImage(firstInput!, out.path, {
      width,
      fit: 'inside',
      withoutEnlargement: true,
    });

    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'resized.gif',
      outputMimeType: 'image/gif',
    };
  }

  if (tool.id === 'gif.frames') {
    const format = String(options.format || 'png');
    const tempDir = await tempManager.createTempDir('gif_frames');
    const pattern = path.join(tempDir.path, `frame_%04d.${format}`);

    const args = ['-i', firstInput!, pattern];
    await runFFmpeg({ args, signal });

    const dirFiles = await fs.readdir(tempDir.path);
    const filesToZip = dirFiles.map((f) => ({ sourcePath: path.join(tempDir.path, f), nameInZip: f }));

    const zipOut = await tempManager.createTempFile({ prefix: 'gif_frames', extension: 'zip' });
    await createZipArchive(filesToZip, zipOut.path);
    await tempDir.cleanup();

    return {
      type: 'file',
      outputFile: zipOut,
      outputFileName: 'frames.zip',
      outputMimeType: 'application/zip',
    };
  }

  // ── PDF Tools ─────────────────────────────────────────────────────────────
  if (tool.id === 'pdf.compress') {
    const out = await tempManager.createTempFile({ prefix: 'pdf_comp', extension: 'pdf' });
    await compressPdf(firstInput!, out.path);
    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'compressed.pdf',
      outputMimeType: 'application/pdf',
    };
  }

  if (tool.id === 'pdf.merge') {
    const out = await tempManager.createTempFile({ prefix: 'pdf_merged', extension: 'pdf' });
    await mergePdfs(inputFiles, out.path);
    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'merged.pdf',
      outputMimeType: 'application/pdf',
    };
  }

  if (tool.id === 'pdf.split') {
    const mode = String(options.mode || 'every') as 'every' | 'ranges';
    const ranges = String(options.ranges || '');

    const tempDir = await tempManager.createTempDir('pdf_split');
    const created = await splitPdf(firstInput!, tempDir.path, { mode, ranges });

    const filesToZip = created.map((f) => ({ sourcePath: f, nameInZip: path.basename(f) }));
    const zipOut = await tempManager.createTempFile({ prefix: 'split_pdf', extension: 'zip' });
    await createZipArchive(filesToZip, zipOut.path);
    await tempDir.cleanup();

    return {
      type: 'file',
      outputFile: zipOut,
      outputFileName: 'split_documents.zip',
      outputMimeType: 'application/zip',
    };
  }

  if (tool.id === 'pdf.extract') {
    const pages = String(options.pages || '1');
    const out = await tempManager.createTempFile({ prefix: 'pdf_extract', extension: 'pdf' });
    await extractPdfPages(firstInput!, out.path, pages);
    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'extracted_pages.pdf',
      outputMimeType: 'application/pdf',
    };
  }

  if (tool.id === 'pdf.rotate') {
    const angle = Number(options.angle || 90);
    const pages = String(options.pages || 'all');
    const out = await tempManager.createTempFile({ prefix: 'pdf_rotate', extension: 'pdf' });
    await rotatePdfPages(firstInput!, out.path, angle, pages);
    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'rotated.pdf',
      outputMimeType: 'application/pdf',
    };
  }

  if (tool.id === 'pdf.from-images') {
    const pageSize = String(options.pageSize || 'a4') as any;
    const margin = String(options.margin || 'small') as any;
    const out = await tempManager.createTempFile({ prefix: 'pdf_from_img', extension: 'pdf' });
    await imagesToPdf(inputFiles, out.path, pageSize, margin);
    return {
      type: 'file',
      outputFile: out,
      outputFileName: 'document.pdf',
      outputMimeType: 'application/pdf',
    };
  }

  if (tool.id === 'pdf.metadata') {
    const meta = await inspectPdf(firstInput!);
    return {
      type: 'data',
      data: meta as unknown as Record<string, unknown>,
    };
  }

  throw new AppError('UNSUPPORTED_FORMAT', `Tool ${tool.id} handler is not registered`);
}
