import { spawn } from 'node:child_process';
import { AppError } from '@pd/shared';

export interface FFmpegProgress {
  timeSeconds?: number;
  percent?: number;
  speed?: string;
  fps?: number;
}

export type FFmpegProgressCallback = (progress: FFmpegProgress) => void;

export interface FFmpegRunOptions {
  args: string[];
  totalDurationSeconds?: number;
  onProgress?: FFmpegProgressCallback;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface FFmpegRunResult {
  code: number;
  stderr: string;
}

/**
 * Runs FFmpeg safely using an argument array (preventing shell injection).
 * Parses stderr progress in real time when duration is provided.
 */
export async function runFFmpeg(opts: FFmpegRunOptions): Promise<FFmpegRunResult> {
  const { args, totalDurationSeconds, onProgress, timeoutMs = 120_000, signal } = opts;

  return new Promise<FFmpegRunResult>((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined;
    let killed = false;
    let stderrAcc = '';

    // Standard safety flags: overwrite without prompting (-y), avoid terminal interactivity (-nostdin)
    const finalArgs = ['-hide_banner', '-nostdin', '-y', ...args];

    const proc = spawn('ffmpeg', finalArgs, {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    });

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        killed = true;
        proc.kill('SIGKILL');
        reject(new AppError('PROCESSING_TIMEOUT', `FFmpeg execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }

    if (signal) {
      signal.addEventListener('abort', () => {
        killed = true;
        proc.kill('SIGKILL');
        reject(new AppError('PROCESSING_FAILED', 'Processing was aborted by client'));
      });
    }

    let lineBuffer = '';

    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf-8');
      stderrAcc += text;
      // Cap stored stderr to last 32KB to avoid memory bloat on verbose jobs
      if (stderrAcc.length > 32768) {
        stderrAcc = stderrAcc.slice(-32768);
      }

      lineBuffer += text;
      const lines = lineBuffer.split(/[\r\n]+/);
      lineBuffer = lines.pop() ?? '';

      if (onProgress) {
        for (const line of lines) {
          parseProgressLine(line, totalDurationSeconds, onProgress);
        }
      }
    });

    proc.on('error', (err) => {
      if (timer) clearTimeout(timer);
      reject(new AppError('INTERNAL_ERROR', `Failed to start FFmpeg: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (killed) return;

      if (code === 0) {
        resolve({ code, stderr: stderrAcc });
      } else {
        const errorLines = stderrAcc
          .split('\n')
          .filter((l) => l.toLowerCase().includes('error') || l.toLowerCase().includes('invalid') || l.toLowerCase().includes('failed'))
          .slice(-3)
          .join('; ');
        const message = errorLines ? `FFmpeg error: ${errorLines}` : `FFmpeg failed with exit code ${code}`;
        reject(new AppError('PROCESSING_FAILED', message, { details: { exitCode: code } }));
      }
    });
  });
}

/**
 * Extracts time=HH:MM:SS.dd from FFmpeg stderr and computes percent
 */
function parseProgressLine(line: string, totalDuration: number | undefined, cb: FFmpegProgressCallback) {
  // Example stderr: "frame=  120 fps= 60 q=28.0 size=    1024kB time=00:00:04.50 bitrate=1864.2kbits/s speed=2.15x"
  const timeMatch = /time=(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(line);
  if (!timeMatch) return;

  const hours = parseFloat(timeMatch[1] ?? '0');
  const minutes = parseFloat(timeMatch[2] ?? '0');
  const seconds = parseFloat(timeMatch[3] ?? '0');
  const currentSec = hours * 3600 + minutes * 60 + seconds;

  const speedMatch = /speed=\s*([\d.]+x)/.exec(line);
  const fpsMatch = /fps=\s*([\d.]+)/.exec(line);

  let percent: number | undefined;
  if (totalDuration && totalDuration > 0) {
    percent = Math.min(100, Math.max(0, Math.round((currentSec / totalDuration) * 100)));
  }

  cb({
    timeSeconds: currentSec,
    percent,
    speed: speedMatch?.[1],
    fps: fpsMatch ? parseFloat(fpsMatch[1] ?? '0') : undefined,
  });
}
