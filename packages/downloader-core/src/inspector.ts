import {
  AppError,
  detectPlatform,
  resolvePlatformStatus,
  type InspectResult,
  type MediaStreamFormat,
  type SubtitleTrack,
  type PlatformRuntimeContext,
} from '@pd/shared';
import { validateUrlSsrfSafe } from './ssrf-guard';
import { runYtDlpInspect } from './ytdlp-runner';

export interface InspectUrlOptions {
  url: string;
  runtimeContext: PlatformRuntimeContext;
  signal?: AbortSignal;
}

/**
 * Validates, checks SSRF, matches platform rules, runs safe inspection,
 * and formats clean, real streams for the user.
 */
export async function inspectUrl(opts: InspectUrlOptions): Promise<InspectResult> {
  const { url: rawUrl, runtimeContext, signal } = opts;

  // 1. Syntactic normalisation and platform matching
  const detection = detectPlatform(rawUrl);
  const platform = detection.platform;

  if (!platform) {
    throw new AppError('UNSUPPORTED_PLATFORM', 'This URL does not match any supported media platform');
  }

  // 2. Check platform policy & availability in current deployment
  const effectiveStatus = resolvePlatformStatus(platform, runtimeContext);

  if (effectiveStatus === 'unavailable') {
    throw new AppError('PLATFORM_TEMPORARILY_UNAVAILABLE', `${platform.name} is temporarily disabled on this server`);
  }

  if (effectiveStatus === 'restricted') {
    throw new AppError(
      'DOWNLOAD_NOT_PERMITTED',
      `${platform.name} downloads are disabled on this instance due to platform terms of service`,
      { details: { platformId: platform.id, termsNote: platform.termsNote } },
    );
  }

  if (effectiveStatus === 'planned') {
    throw new AppError('UNSUPPORTED_PLATFORM', `${platform.name} support is planned but not yet released`);
  }

  // 3. SSRF & DNS rebinding protection
  const { safeUrl } = await validateUrlSsrfSafe(detection.url);

  // 4. Run extractor inspection
  const rawMeta = await runYtDlpInspect({
    url: safeUrl.toString(),
    extractors: platform.extractors,
    signal,
  });

  // 5. Parse and normalize formats
  const rawFormats: any[] = Array.isArray(rawMeta.formats) ? rawMeta.formats : [];
  const normalizedFormats: MediaStreamFormat[] = [];

  for (const f of rawFormats) {
    if (!f.format_id) continue;

    // Filter out m3u8 playlists that don't have direct segments or unsupported protocols
    const protocol = f.protocol || '';
    const vcodec = f.vcodec && f.vcodec !== 'none' ? f.vcodec : undefined;
    const acodec = f.acodec && f.acodec !== 'none' ? f.acodec : undefined;

    const hasVideo = Boolean(vcodec);
    const hasAudio = Boolean(acodec);

    if (!hasVideo && !hasAudio) continue;

    const height = f.height ? Number(f.height) : undefined;
    const width = f.width ? Number(f.width) : undefined;
    const fps = f.fps ? Number(f.fps) : undefined;

    let qualityLabel = '';
    if (height) qualityLabel = `${height}p${fps && fps > 30 ? fps : ''}`;
    else if (f.format_note) qualityLabel = f.format_note;
    else if (hasAudio && !hasVideo) qualityLabel = `${f.abr || 128} kbps`;

    normalizedFormats.push({
      formatId: f.format_id,
      ext: f.ext || (hasVideo ? 'mp4' : 'm4a'),
      resolution: f.resolution || (height && width ? `${width}x${height}` : undefined),
      width,
      height,
      vcodec,
      acodec,
      fps,
      filesize: f.filesize ? Number(f.filesize) : undefined,
      filesizeApprox: f.filesize_approx ? Number(f.filesize_approx) : undefined,
      qualityLabel,
      hasVideo,
      hasAudio,
      isAudioOnly: !hasVideo && hasAudio,
      isVideoOnly: hasVideo && !hasAudio,
      protocol,
    });
  }

  // Sort formats logically: video with audio first (highest resolution down), then video-only, then audio-only
  normalizedFormats.sort((a, b) => {
    if (a.hasVideo && a.hasAudio && !(b.hasVideo && b.hasAudio)) return -1;
    if (!(a.hasVideo && a.hasAudio) && b.hasVideo && b.hasAudio) return 1;
    if (a.hasVideo && b.hasVideo) {
      return (b.height || 0) - (a.height || 0);
    }
    if (a.isAudioOnly && b.isAudioOnly) {
      return (b.filesize || 0) - (a.filesize || 0);
    }
    return 0;
  });

  // Pick best progressive or pre-muxed video format
  const bestVideo = normalizedFormats.find((f) => f.hasVideo && f.hasAudio) || normalizedFormats.find((f) => f.hasVideo);
  const bestAudio = normalizedFormats.find((f) => f.isAudioOnly) || normalizedFormats.find((f) => f.hasAudio);

  // Subtitles
  const subtitles: SubtitleTrack[] = [];
  if (rawMeta.subtitles && typeof rawMeta.subtitles === 'object') {
    for (const [lang, tracks] of Object.entries<any>(rawMeta.subtitles)) {
      if (Array.isArray(tracks) && tracks.length > 0) {
        const t0 = tracks[0];
        subtitles.push({
          lang,
          name: t0.name || lang,
          ext: t0.ext || 'vtt',
          url: t0.url,
        });
      }
    }
  }

  return {
    url: rawUrl,
    canonicalUrl: rawMeta.webpage_url || safeUrl.toString(),
    platform: {
      id: platform.id,
      name: platform.name,
      category: platform.category,
      status: effectiveStatus,
      policy: platform.policy,
      requiresAttestation: platform.policy === 'restricted',
    },
    title: rawMeta.title || 'Media File',
    description: rawMeta.description ? rawMeta.description.slice(0, 500) : undefined,
    duration: rawMeta.duration ? Number(rawMeta.duration) : undefined,
    thumbnail: rawMeta.thumbnail,
    uploader: rawMeta.uploader || rawMeta.channel,
    uploaderUrl: rawMeta.uploader_url || rawMeta.channel_url,
    uploadDate: rawMeta.upload_date,
    formats: normalizedFormats,
    subtitles,
    bestVideo,
    bestAudio,
    inspectedAt: new Date().toISOString(),
  };
}
