import { spawnSync } from 'node:child_process';
import os from 'node:os';
import sharp from 'sharp';
import { type Capability, type SystemCapabilitiesResponse, PLATFORMS, TOOLS } from '@pd/shared';

let cachedCapabilities: Capability[] | undefined;

export function detectSystemCapabilities(): Capability[] {
  if (cachedCapabilities) return cachedCapabilities;

  const caps = new Set<Capability>();

  // Check Sharp
  caps.add('sharp');
  caps.add('img:jpeg');
  caps.add('img:png');
  caps.add('img:webp');
  caps.add('img:gif');
  caps.add('img:tiff');
  if (sharp.versions.heif) {
    caps.add('img:heif');
  }

  // Check PDF
  caps.add('pdf');

  // Check FFmpeg
  try {
    const ffprobeRes = spawnSync('ffprobe', ['-version'], { stdio: 'pipe' });
    const ffmpegRes = spawnSync('ffmpeg', ['-version'], { stdio: 'pipe' });

    if (ffmpegRes.status === 0 && ffprobeRes.status === 0) {
      caps.add('ffmpeg');

      const encRes = spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { stdio: 'pipe' });
      const encText = encRes.stdout?.toString('utf-8') || '';

      const targetEncoders = [
        'libx264',
        'libx265',
        'libvpx-vp9',
        'libmp3lame',
        'aac',
        'libopus',
        'libvorbis',
        'flac',
        'pcm_s16le',
        'libwebp',
        'gif',
      ];

      for (const enc of targetEncoders) {
        if (new RegExp(`\\s${enc}\\s`).test(encText)) {
          caps.add(`enc:${enc}` as Capability);
        }
      }
    }
  } catch {
    // FFmpeg not present
  }

  // Check yt-dlp
  try {
    const ytdlpRes = spawnSync('yt-dlp', ['--version'], { stdio: 'pipe' });
    if (ytdlpRes.status === 0) {
      caps.add('ytdlp');
    }
  } catch {
    // yt-dlp not present
  }

  cachedCapabilities = Array.from(caps);
  return cachedCapabilities;
}

export function getSystemCapabilitiesInfo(startTime: number): SystemCapabilitiesResponse {
  const capabilities = detectSystemCapabilities();

  return {
    capabilities,
    version: '0.1.0',
    uptime: Math.round((Date.now() - startTime) / 1000),
    system: {
      cpuCores: os.cpus().length,
      platform: os.platform(),
    },
    toolsCount: TOOLS.length,
    platformsCount: PLATFORMS.length,
  };
}
