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
import { safeProbeUrl } from './http-safe';
import { runYtDlpInspect } from './ytdlp-runner';
import {
  extractWithFallback,
  extractGenericFallback,
  hasFallbackAdapter,
  toPublicMediaFormats,
} from './fallback-extractors';

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
  const isUnknownPlatform = !detection.platform;
  const platform = detection.platform || {
    id: 'generic',
    name: detection.url.hostname.replace(/^www\./i, ''),
    category: 'video' as const,
    domains: [detection.url.hostname],
    adapter: 'ytdlp' as const,
    extractors: [],
    mediaTypes: ['video', 'audio', 'image', 'thumbnail'] as const,
    operations: ['inspect', 'download_video', 'download_audio', 'download_thumbnail'] as const,
    auth: 'none' as const,
    policy: 'open' as const,
    baseStatus: 'available' as const,
    limitations: [],
    termsNote: '',
    lastVerified: null,
    color: '#64748b',
  };

  // 2. Check platform policy & availability in current deployment
  const effectiveStatus = isUnknownPlatform
    ? 'available'
    : resolvePlatformStatus(platform, runtimeContext);

  if (effectiveStatus === 'unavailable') {
    throw new AppError('PLATFORM_TEMPORARILY_UNAVAILABLE', `${platform.name} is not supported because its content is private or discontinued.`);
  }

  if (effectiveStatus === 'restricted') {
    throw new AppError(
      'DOWNLOAD_NOT_PERMITTED',
      `${platform.name} downloads are disabled on this instance due to platform terms of service`,
      { details: { platformId: platform.id, termsNote: platform.termsNote } },
    );
  }

  // 3. SSRF & DNS rebinding protection
  let safeUrl: URL;
  try {
    ({ safeUrl } = await validateUrlSsrfSafe(detection.url));
  } catch (ssrfErr) {
    if (isUnknownPlatform && ssrfErr instanceof AppError && ssrfErr.code === 'CONTENT_UNAVAILABLE') {
      throw new AppError('UNSUPPORTED_PLATFORM', 'This URL could not be reached or is not a supported media page.');
    }
    throw ssrfErr;
  }

  const toInspectResultFromFallback = async (
    fb: Awaited<ReturnType<typeof extractWithFallback>>,
    platId: string,
  ): Promise<InspectResult | null> => {
    if (!fb || fb.formats.length === 0) return null;
    const formatsToProbe = fb.formats.filter((f) => !f.filesize && !f.isHls && f.directUrl).slice(0, 4);
    if (formatsToProbe.length > 0) {
      await Promise.allSettled(
        formatsToProbe.map(async (f) => {
          const probe = await safeProbeUrl(f.directUrl, { timeoutMs: 2500, headers: f.headers, signal });
          if (probe.contentLength && probe.contentLength > 1024 && !/html/i.test(probe.contentType)) {
            f.filesize = probe.contentLength;
          }
        }),
      );
    }
    const formats = toPublicMediaFormats(fb.formats);
    const bestVideo = formats.find((f) => f.hasVideo) || formats[0];
    const bestAudio = formats.find((f) => f.isAudioOnly) || formats.find((f) => f.hasAudio);
    return {
      url: rawUrl,
      canonicalUrl: fb.canonicalUrl || safeUrl.toString(),
      platform: {
        id: platId,
        name: platform.name,
        category: platform.category,
        status: effectiveStatus,
        policy: platform.policy,
        requiresAttestation: platform.policy === 'restricted',
      },
      title: fb.title || 'Media File',
      description: fb.description ? fb.description.slice(0, 1200) : undefined,
      duration: fb.duration,
      thumbnail: fb.thumbnail,
      uploader: fb.uploader,
      uploaderUrl: fb.uploaderUrl,
      viewCount: fb.viewCount,
      likeCount: fb.likeCount,
      formats,
      subtitles: [],
      bestVideo,
      bestAudio,
      inspectedAt: new Date().toISOString(),
    };
  };

  const buildFallbackResult = async () => {
    if (!hasFallbackAdapter(platform.id)) return null;
    const fb = await extractWithFallback(platform.id, safeUrl.toString(), signal);
    return await toInspectResultFromFallback(fb, platform.id);
  };

  // Helper to run yt-dlp and unwrap channel / playlist entries up to 2 hops
  const inspectYtDlpPlayable = async (targetUrl: string, extractors: string[]): Promise<any> => {
    const isPlaylistLikeUrl =
      /[?&]list=|\/(?:playlist|channel\/|c\/|user\/)|\/@[^/]+(?:\/(?:videos|shorts|streams|playlists))?\/?$/i.test(
        targetUrl,
      ) && !/\/(?:video|photo)\//i.test(targetUrl);

    let meta = await runYtDlpInspect({
      url: targetUrl,
      extractors,
      allowPlaylistFirst: isPlaylistLikeUrl,
      signal,
    });

    const isUnplayablePlaylist =
      meta &&
      (meta._type === 'playlist' || Array.isArray(meta.entries)) &&
      (!Array.isArray(meta.formats) || meta.formats.length === 0);

    if (isUnplayablePlaylist && !isPlaylistLikeUrl) {
      meta = await runYtDlpInspect({
        url: targetUrl,
        extractors,
        allowPlaylistFirst: true,
        signal,
      });
    }

    let current = meta;
    for (let hop = 0; hop < 2; hop++) {
      if (
        current &&
        (current._type === 'playlist' || Array.isArray(current.entries)) &&
        (!Array.isArray(current.formats) || current.formats.length === 0)
      ) {
        const firstEntry = Array.isArray(current.entries) ? current.entries.find(Boolean) : undefined;
        if (!firstEntry) break;
        if (Array.isArray(firstEntry.formats) && firstEntry.formats.length > 0) {
          current = {
            ...firstEntry,
            uploader: firstEntry.uploader || current.uploader || current.channel,
            uploader_url: firstEntry.uploader_url || current.uploader_url || current.channel_url,
          };
          break;
        }
        const hopUrl = firstEntry.webpage_url || firstEntry.url;
        if (typeof hopUrl === 'string' && /^https?:\/\//i.test(hopUrl)) {
          await validateUrlSsrfSafe(hopUrl);
          current = await runYtDlpInspect({
            url: hopUrl,
            extractors,
            allowPlaylistFirst: true,
            signal,
          });
          continue;
        }
      }
      break;
    }

    if (
      current &&
      (current._type === 'playlist' || Array.isArray(current.entries)) &&
      (!Array.isArray(current.formats) || current.formats.length === 0) &&
      !current.url
    ) {
      throw new AppError('CONTENT_UNAVAILABLE', 'No playable video or audio item was found in that feed.');
    }
    return current;
  };

  // Fast path: TikTok @user profiles fail in yt-dlp `tiktok:user`, so resolve directly via TikTok embed/TikWM
  const isTikTokProfile =
    platform.id === 'tiktok' &&
    /\/@[A-Za-z0-9_.-]+\/?$/i.test(safeUrl.pathname) &&
    !/\/(?:video|photo)\//i.test(safeUrl.pathname);

  if (isTikTokProfile) {
    const ttProfileRes = await buildFallbackResult();
    if (ttProfileRes) return ttProfileRes;
  }

  // 4. Multi-layer inspection cascade:
  //    (a) platform adapter fallback when platform.extractors === [] (or after scoped yt-dlp fails)
  //    (b) scoped yt-dlp -> (c) unscoped yt-dlp (all 1000+ extractors) -> (d) generic HTML/direct media fallback
  let rawMeta: any = null;
  let lastErr: unknown = null;

  if (platform.extractors.length === 0 && hasFallbackAdapter(platform.id)) {
    const fbResult = await buildFallbackResult();
    if (fbResult) return fbResult;
  }

  if (platform.extractors.length > 0) {
    try {
      rawMeta = await inspectYtDlpPlayable(safeUrl.toString(), [...platform.extractors]);
    } catch (err) {
      lastErr = err;
    }
  }

  if (!rawMeta && platform.extractors.length > 0 && hasFallbackAdapter(platform.id)) {
    const fbResult = await buildFallbackResult();
    if (fbResult) return fbResult;
  }

  if (!rawMeta) {
    try {
      rawMeta = await inspectYtDlpPlayable(safeUrl.toString(), []);
    } catch (err) {
      if (!lastErr) lastErr = err;
    }
  }

  if (!rawMeta) {
    const genericFb = await extractGenericFallback(safeUrl.toString(), signal);
    const genericRes = await toInspectResultFromFallback(genericFb, platform.id);
    if (genericRes) return genericRes;

    if (isUnknownPlatform) {
      throw new AppError('UNSUPPORTED_PLATFORM', 'No downloadable video, audio, or image was found at this link.');
    }
    if (lastErr instanceof AppError) throw lastErr;
    throw new AppError('CONTENT_UNAVAILABLE', `Could not find downloadable media at this ${platform.name} link.`);
  }

  // 5. Parse and normalize formats
  const rawFormats: any[] = Array.isArray(rawMeta.formats) ? rawMeta.formats : [];
  const normalizedFormats: MediaStreamFormat[] = [];
  const seenResolutions = new Set<string>();

  for (const f of rawFormats) {
    if (!f.format_id) continue;
    if (
      f.ext === 'mhtml' ||
      f.vcodec === 'images' ||
      /^sb\d+$/i.test(String(f.format_id)) ||
      /scrubber/i.test(String(f.format_id)) ||
      /storyboard/i.test(String(f.format_note || ''))
    ) {
      continue;
    }

    const protocol = f.protocol || '';
    const vcodec = f.vcodec && f.vcodec !== 'none' ? f.vcodec : undefined;
    const acodec = f.acodec && f.acodec !== 'none' ? f.acodec : undefined;
    const ext = (f.ext || '').toLowerCase();
    const normExt = ext === 'jpeg' ? 'jpg' : ext;
    const isAudioExt = ['mp3', 'm4a', 'wav', 'aac', 'flac', 'ogg', 'opus'].includes(ext);
    const isVideoExt = ['mp4', 'webm', 'mkv', 'mov', 'avi', 'flv', 'ogv'].includes(ext);
    const isImageExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'svg'].includes(ext);

    const isMusicPlatform = !platform.mediaTypes.includes('video');
    const isExplicitAudioNote =
      f.vcodec === 'none' ||
      String(f.resolution || '').toLowerCase() === 'audio only' ||
      /audio[_-]?only/i.test(String(f.format_id)) ||
      /audio[_-]?only/i.test(String(f.format_note || ''));
    let hasVideo = !isImageExt && !isExplicitAudioNote && (Boolean(vcodec) || (Boolean(f.height) && f.height > 0) || (isVideoExt && !isMusicPlatform));
    let hasAudio = !isImageExt && (Boolean(acodec) || isAudioExt || isMusicPlatform || isExplicitAudioNote);

    // If codecs are unknown but container is recognized
    if (!vcodec && !acodec) {
      if (isImageExt) {
        hasVideo = false;
        hasAudio = false;
      } else if (isAudioExt || isMusicPlatform || isExplicitAudioNote) {
        hasVideo = false;
        hasAudio = true;
      } else {
        hasVideo = true;
        hasAudio = true;
      }
    }

    if (!hasVideo && !hasAudio && !isImageExt) continue;

    const height = f.height ? Number(f.height) : undefined;
    const width = f.width ? Number(f.width) : undefined;
    const fps = f.fps ? Number(f.fps) : undefined;

    let qualityLabel = '';
    if (isImageExt) {
      qualityLabel = width && height ? `${width}x${height} ${normExt.toUpperCase()}` : `Original ${normExt.toUpperCase()}`;
    } else if (height) qualityLabel = `${height}p${fps && fps > 30 ? fps : ''}`;
    else if (f.format_note) qualityLabel = f.format_note;
    else if (hasAudio && !hasVideo) qualityLabel = `${f.abr || 128} kbps`;
    else qualityLabel = normExt.toUpperCase();

    // Deduplicate duplicate resolution representations (prefer mp4 over webm for mainstream compatibility)
    const isAudioOnly = !hasVideo && hasAudio;
    const isVideoOnly = hasVideo && !hasAudio;

    // If video-only, formatId should merge with best audio on download
    const effectiveFormatId = isVideoOnly ? `${f.format_id}+bestaudio/best` : String(f.format_id);

    const outExt = isImageExt
      ? normExt
      : isAudioOnly
        ? (normExt || 'm4a')
        : (!isVideoOnly && normExt === 'webm' ? 'webm' : 'mp4');

    normalizedFormats.push({
      formatId: effectiveFormatId,
      ext: outExt,
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
      hasAudio: isVideoOnly ? true : hasAudio, // Output file will contain audio when paired
      isAudioOnly,
      isVideoOnly,
      protocol,
    });
  }

  // Fallback: If no sub-formats returned, use root media info
  if (normalizedFormats.length === 0) {
    const ext = (rawMeta.ext || 'mp4').toLowerCase();
    const normExt = ext === 'jpeg' ? 'jpg' : ext;
    const isAudio = ['mp3', 'm4a', 'wav', 'aac', 'flac', 'ogg'].includes(ext);
    const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'avif', 'svg'].includes(ext);
    normalizedFormats.push({
      formatId: rawMeta.format_id ? String(rawMeta.format_id) : 'best',
      ext: isImage ? normExt : isAudio ? normExt : (normExt === 'webm' ? 'webm' : 'mp4'),
      resolution: rawMeta.resolution || (rawMeta.height ? `${rawMeta.width}x${rawMeta.height}` : undefined),
      width: rawMeta.width,
      height: rawMeta.height,
      filesize: rawMeta.filesize ? Number(rawMeta.filesize) : undefined,
      filesizeApprox: rawMeta.filesize_approx ? Number(rawMeta.filesize_approx) : undefined,
      qualityLabel: isImage ? `Original ${normExt.toUpperCase()}` : rawMeta.height ? `${rawMeta.height}p` : (isAudio ? 'Audio' : 'Standard'),
      hasVideo: !isAudio && !isImage,
      hasAudio: !isImage,
      isAudioOnly: isAudio,
      isVideoOnly: false,
    protocol: rawMeta.protocol || 'https',
    });
  }

  if (normalizedFormats.length === 0 && hasFallbackAdapter(platform.id)) {
    const fbResult = await buildFallbackResult();
    if (fbResult) return fbResult;
  }

  // Sort formats: highest resolution first, then audio
  normalizedFormats.sort((a, b) => {
    if (a.hasVideo && !b.hasVideo) return -1;
    if (!a.hasVideo && b.hasVideo) return 1;
    if (a.hasVideo && b.hasVideo) {
      return (b.height || 0) - (a.height || 0);
    }
    if (a.isAudioOnly && b.isAudioOnly) {
      return (b.filesize || 0) - (a.filesize || 0);
    }
    return 0;
  });

  // Pick best progressive or paired video format
  const bestVideo = normalizedFormats.find((f) => f.hasVideo);
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
    uploader: rawMeta.uploader || rawMeta.channel || rawMeta.uploader_id,
    uploaderUrl: rawMeta.uploader_url || rawMeta.channel_url,
    channel: rawMeta.channel || rawMeta.uploader,
    uploadDate: rawMeta.upload_date,
    viewCount: typeof rawMeta.view_count === 'number' && Number.isFinite(rawMeta.view_count) ? rawMeta.view_count : undefined,
    likeCount: typeof rawMeta.like_count === 'number' && Number.isFinite(rawMeta.like_count) ? rawMeta.like_count : undefined,
    formats: normalizedFormats,
    subtitles,
    bestVideo,
    bestAudio,
    inspectedAt: new Date().toISOString(),
  };
}
