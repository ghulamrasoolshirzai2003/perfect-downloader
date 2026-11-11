import { spawn } from 'node:child_process';
import { AppError } from '@pd/shared';

export interface MediaStreamInfo {
  index: number;
  codecType: 'video' | 'audio' | 'subtitle' | 'data' | 'attachment';
  codecName?: string;
  width?: number;
  height?: number;
  duration?: number;
  bitrate?: number;
  fps?: number;
  channels?: number;
  sampleRate?: number;
  tags?: Record<string, string>;
}

export interface MediaProbeResult {
  formatName: string;
  duration: number;
  size: number;
  bitrate?: number;
  tags?: Record<string, string>;
  streams: MediaStreamInfo[];
  videoStream?: MediaStreamInfo;
  audioStreams: MediaStreamInfo[];
  subtitleStreams: MediaStreamInfo[];
}

/**
 * Runs ffprobe on a file to inspect real container, video, audio, and subtitle streams.
 */
export async function probeMedia(filePath: string, timeoutMs = 15_000): Promise<MediaProbeResult> {
  return new Promise<MediaProbeResult>((resolve, reject) => {
    const args = [
      '-hide_banner',
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath,
    ];

    const proc = spawn('ffprobe', args, {
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
    });

    let stdoutAcc = '';
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new AppError('PROCESSING_TIMEOUT', 'ffprobe timed out'));
    }, timeoutMs);

    proc.stdout.on('data', (chunk: Buffer) => {
      stdoutAcc += chunk.toString('utf-8');
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new AppError('INTERNAL_ERROR', `Failed to start ffprobe: ${err.message}`));
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        return reject(new AppError('INVALID_FILE', 'The provided file is not a supported or valid media stream'));
      }

      try {
        const raw = JSON.parse(stdoutAcc);
        const format = raw.format || {};
        const streams = (raw.streams || []).map((s: any): MediaStreamInfo => {
          let fps: number | undefined;
          if (s.r_frame_rate && s.r_frame_rate.includes('/')) {
            const [num, den] = s.r_frame_rate.split('/').map(Number);
            if (num && den && den !== 0) fps = Math.round((num / den) * 100) / 100;
          }
          return {
            index: s.index,
            codecType: s.codec_type,
            codecName: s.codec_name,
            width: s.width,
            height: s.height,
            duration: s.duration ? parseFloat(s.duration) : undefined,
            bitrate: s.bit_rate ? parseInt(s.bit_rate, 10) : undefined,
            fps,
            channels: s.channels,
            sampleRate: s.sample_rate ? parseInt(s.sample_rate, 10) : undefined,
            tags: s.tags,
          };
        });

        const videoStream = streams.find((s: MediaStreamInfo) => s.codecType === 'video');
        const audioStreams = streams.filter((s: MediaStreamInfo) => s.codecType === 'audio');
        const subtitleStreams = streams.filter((s: MediaStreamInfo) => s.codecType === 'subtitle');

        const duration = parseFloat(format.duration || videoStream?.duration || audioStreams[0]?.duration || '0');
        const size = parseInt(format.size || '0', 10);
        const bitrate = format.bit_rate ? parseInt(format.bit_rate, 10) : undefined;

        resolve({
          formatName: format.format_name || 'unknown',
          duration,
          size,
          bitrate,
          tags: format.tags,
          streams,
          videoStream,
          audioStreams,
          subtitleStreams,
        });
      } catch (e: any) {
        reject(new AppError('PROCESSING_FAILED', `Failed to parse ffprobe metadata: ${e.message}`));
      }
    });
  });
}
