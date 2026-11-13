import { spawn } from 'node:child_process';
import { AppError } from '@pd/shared';

export interface YtDlpInspectOptions {
  url: string;
  extractors: string[];
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface YtDlpDownloadProgress {
  percent?: number;
  speed?: string;
  eta?: string;
  totalSize?: string;
}

export interface YtDlpDownloadOptions {
  url: string;
  formatId: string;
  outputPath: string;
  extractors: string[];
  mergeOutputFormat?: string;
  maxFileSizeMb?: number;
  onProgress?: (progress: YtDlpDownloadProgress) => void;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Runs `yt-dlp -J` safely to retrieve media metadata and format definitions
 */
export async function runYtDlpInspect(opts: YtDlpInspectOptions): Promise<any> {
  const { url, extractors, timeoutMs = 45_000, signal } = opts;

  return new Promise<any>((resolve, reject) => {
    // Construct hardened argument list
    const args = [
      '--ignore-config',
      '--no-update',
      '--no-plugin-dirs',
      '--no-exec',
      '--no-cache-dir',
      '--no-warnings',
      '--no-check-certificates',
      '--socket-timeout', '15',
      '--no-playlist',
      '--restrict-filenames',
      '-J',
    ];

    if (extractors.length > 0) {
      args.push('--use-extractors', extractors.join(','));
    }

    args.push(url);

    const proc = spawn('yt-dlp', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdoutAcc = '';
    let stderrAcc = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
      reject(new AppError('PROCESSING_TIMEOUT', 'Media inspection timed out after 45s'));
    }, timeoutMs);

    if (signal) {
      signal.addEventListener('abort', () => {
        killed = true;
        proc.kill('SIGKILL');
        reject(new AppError('PROCESSING_FAILED', 'Operation aborted by client'));
      });
    }

    proc.stdout.on('data', (chunk: Buffer) => {
      stdoutAcc += chunk.toString('utf-8');
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      stderrAcc += chunk.toString('utf-8');
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new AppError('INTERNAL_ERROR', `Failed to start yt-dlp: ${err.message}`));
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (killed) return;

      if (code !== 0) {
        const errLower = stderrAcc.toLowerCase();
        if (errLower.includes('private') || errLower.includes('members only') || errLower.includes('sign in')) {
          return reject(new AppError('AUTHORIZATION_REQUIRED', 'This content is private or requires authentication to view'));
        }
        if (errLower.includes('not found') || errLower.includes('404') || errLower.includes('removed') || errLower.includes('deleted')) {
          return reject(new AppError('CONTENT_UNAVAILABLE', 'The requested media could not be found or has been removed'));
        }
        if (errLower.includes('copyright') || errLower.includes('drm')) {
          return reject(new AppError('DOWNLOAD_NOT_PERMITTED', 'This media cannot be retrieved due to access or copyright restrictions'));
        }
        return reject(new AppError('PROCESSING_FAILED', `Media inspection failed: ${stderrAcc.slice(-300).trim() || 'Unknown extractor error'}`));
      }

      try {
        const jsonStart = stdoutAcc.indexOf('{');
        if (jsonStart === -1) {
          throw new Error('No JSON output returned');
        }
        const data = JSON.parse(stdoutAcc.slice(jsonStart));
        resolve(data);
      } catch (err: any) {
        reject(new AppError('PROCESSING_FAILED', `Failed to parse extractor JSON: ${err.message}`));
      }
    });
  });
}

/**
 * Runs yt-dlp to download a specific format into a designated temporary file path
 */
export async function runYtDlpDownload(opts: YtDlpDownloadOptions): Promise<void> {
  const { url, formatId, outputPath, extractors, mergeOutputFormat, maxFileSizeMb = 500, onProgress, timeoutMs = 300_000, signal } = opts;

  return new Promise<void>((resolve, reject) => {
    const args = [
      '--ignore-config',
      '--no-update',
      '--no-plugin-dirs',
      '--no-exec',
      '--no-cache-dir',
      '--no-warnings',
      '--no-check-certificates',
      '--socket-timeout', '20',
      '--no-playlist',
      '--restrict-filenames',
      '--newline',
      '--progress-template', 'download:[%(progress.downloaded_bytes)s/%(progress.total_bytes)s] [%(progress._percent_str)s] [%(progress._speed_str)s] [%(progress._eta_str)s]',
      '--max-filesize', `${maxFileSizeMb}M`,
      '-f', formatId,
      '-o', outputPath,
    ];

    if (mergeOutputFormat) {
      args.push('--merge-output-format', mergeOutputFormat);
    }

    if (extractors.length > 0) {
      args.push('--use-extractors', extractors.join(','));
    }

    args.push(url);

    const proc = spawn('yt-dlp', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stderrAcc = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
      reject(new AppError('PROCESSING_TIMEOUT', 'Download timed out'));
    }, timeoutMs);

    if (signal) {
      signal.addEventListener('abort', () => {
        killed = true;
        proc.kill('SIGKILL');
        reject(new AppError('PROCESSING_FAILED', 'Download was aborted by client'));
      });
    }

    let lineBuffer = '';

    const parseProgress = (text: string) => {
      if (!onProgress) return;
      const lines = text.split(/[\r\n]+/);
      for (const line of lines) {
        // Custom progress template: e.g. "download:[12345/67890] [ 45.2%] [ 2.4MiB/s] [ 00:15]"
        const customMatch = /download:\[([^\]]*)\]\s*\[\s*([0-9.]+)%\]\s*\[([^\]]*)\]\s*\[([^\]]*)\]/.exec(line);
        if (customMatch) {
          const percent = parseFloat(customMatch[2] ?? '0');
          const speed = customMatch[3]?.trim();
          const eta = customMatch[4]?.trim();
          onProgress({ percent, speed, eta });
          continue;
        }

        // Standard yt-dlp progress: e.g. "[download]   0.5% of  316.85MiB at    1.86MiB/s ETA 02:51"
        const stdMatch = /\[download\]\s+([0-9.]+)%\s+of\s+([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/.exec(line);
        if (stdMatch) {
          const percent = parseFloat(stdMatch[1] ?? '0');
          const totalSize = stdMatch[2]?.trim();
          const speed = stdMatch[3]?.trim();
          const eta = stdMatch[4]?.trim();
          onProgress({ percent, speed, eta, totalSize });
          continue;
        }

        // Simpler fallback percent match
        const simpleMatch = /\[download\]\s+([0-9.]+)%/.exec(line);
        if (simpleMatch) {
          const percent = parseFloat(simpleMatch[1] ?? '0');
          onProgress({ percent });
        }
      }
    };

    proc.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf-8');
      lineBuffer += text;
      const lines = lineBuffer.split(/[\r\n]+/);
      lineBuffer = lines.pop() ?? '';
      parseProgress(text);
    });

    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf-8');
      stderrAcc += text;
      parseProgress(text);
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new AppError('INTERNAL_ERROR', `Failed to start yt-dlp download: ${err.message}`));
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (killed) return;

      if (code === 0) {
        resolve();
      } else {
        const errLower = stderrAcc.toLowerCase();
        if (errLower.includes('filesize') && errLower.includes('max-filesize')) {
          return reject(new AppError('FILE_TOO_LARGE', `Media exceeds maximum permitted size of ${maxFileSizeMb}MB`));
        }
        reject(new AppError('PROCESSING_FAILED', `Download failed: ${stderrAcc.slice(-300).trim() || 'Process exited with error'}`));
      }
    });
  });
}
