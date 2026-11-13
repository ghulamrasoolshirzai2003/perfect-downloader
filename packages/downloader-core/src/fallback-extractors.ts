import type { MediaStreamFormat } from '@pd/shared';
import { safeFetch, safeFetchJson, safeFetchText, safeProbeUrl } from './http-safe';

export interface FallbackFormat {
  formatId: string;
  ext: string;
  directUrl: string;
  headers?: Record<string, string>;
  isHls?: boolean;
  resolution?: string;
  width?: number;
  height?: number;
  filesize?: number;
  qualityLabel: string;
  hasVideo: boolean;
  hasAudio: boolean;
  isAudioOnly: boolean;
  isVideoOnly: boolean;
}

export interface FallbackExtractResult {
  canonicalUrl?: string;
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  uploader?: string;
  uploaderUrl?: string;
  viewCount?: number;
  likeCount?: number;
  formats: FallbackFormat[];
}

export function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

export function extractMetaTags(html: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const metaRe = /<meta\s+([^>]+?)\/?>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaRe.exec(html)) !== null) {
    const attrs = match[1] || '';
    const keyMatch = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(attrs);
    const valMatch = /content\s*=\s*["']([^"']*)["']/i.exec(attrs);
    if (keyMatch?.[1] && valMatch?.[1]) {
      const k = keyMatch[1].toLowerCase();
      if (!result[k]) result[k] = [];
      result[k]!.push(decodeHtmlEntities(valMatch[1]));
    }
  }
  return result;
}

export function extractHtmlTitle(html: string): string | undefined {
  const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return m?.[1] ? decodeHtmlEntities(m[1]).trim() : undefined;
}

export function toPublicMediaFormats(formats: FallbackFormat[]): MediaStreamFormat[] {
  return formats.map((f) => ({
    formatId: f.formatId,
    ext: f.ext,
    resolution: f.resolution,
    width: f.width,
    height: f.height,
    filesize: f.filesize,
    qualityLabel: f.qualityLabel,
    hasVideo: f.hasVideo,
    hasAudio: f.hasAudio,
    isAudioOnly: f.isAudioOnly,
    isVideoOnly: f.isVideoOnly,
    protocol: 'https',
  }));
}

type FallbackAdapter = (url: string, signal?: AbortSignal) => Promise<FallbackExtractResult | null>;

async function tryTikWmSingle(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { data } = await safeFetchJson<any>(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
        { signal, timeoutMs: 15_000 },
      );
      if (data?.code === -1 && attempt === 0) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      if (data?.code === 0 && data?.data) {
        const d = data.data;
        const formats: FallbackFormat[] = [];
        const addVideo = (u: string | undefined, label: string, size?: number) => {
          if (!u || typeof u !== 'string') return;
          const abs = u.startsWith('http') ? u : `https://www.tikwm.com${u}`;
          formats.push({
            formatId: `fb:v${formats.length}`,
            ext: 'mp4',
            directUrl: abs,
            filesize: size ? Number(size) : undefined,
            qualityLabel: label,
            hasVideo: true,
            hasAudio: true,
            isAudioOnly: false,
            isVideoOnly: false,
          });
        };
        addVideo(d.hdplay, '1080p HD (No Watermark)', d.hd_size);
        addVideo(d.play, '720p (No Watermark)', d.size);
        addVideo(d.wmplay, 'Standard (Watermark)', d.wm_size);

        if (Array.isArray(d.images)) {
          d.images.forEach((imgUrl: string, idx: number) => {
            formats.push({
              formatId: `fb:img${idx}`,
              ext: 'jpg',
              directUrl: imgUrl,
              qualityLabel: `Photo ${idx + 1}`,
              hasVideo: false,
              hasAudio: false,
              isAudioOnly: false,
              isVideoOnly: false,
            });
          });
        }

        if (d.music_info?.play || d.music) {
          const musicUrl = d.music_info?.play || d.music;
          if (typeof musicUrl === 'string') {
            formats.push({
              formatId: `fb:a${formats.length}`,
              ext: 'mp3',
              directUrl: musicUrl.startsWith('http') ? musicUrl : `https://www.tikwm.com${musicUrl}`,
              qualityLabel: 'Original Audio MP3',
              hasVideo: false,
              hasAudio: true,
              isAudioOnly: true,
              isVideoOnly: false,
            });
          }
        }

        if (formats.length > 0) {
          return {
            canonicalUrl: url,
            title: d.title || d.author?.nickname || 'TikTok Media',
            duration: d.duration ? Number(d.duration) : undefined,
            thumbnail: d.origin_cover || d.cover,
            uploader: d.author?.nickname || d.author?.unique_id,
            uploaderUrl: d.author?.unique_id ? `https://www.tiktok.com/@${d.author.unique_id}` : undefined,
            formats,
          };
        }
      }
      break;
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 700));
        continue;
      }
    }
  }
  return null;
}

/**
 * TikTok fallback: handles single videos, photo slideshows, short links, and @user profiles via TikWM + TikTok Embed state.
 */
async function extractTikTokFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  let workUrl = url;
  try {
    const parsed = new URL(url);
    if (/^(?:vm|vt)\.tiktok\.com$/i.test(parsed.hostname) || /^\/t\//i.test(parsed.pathname)) {
      const probed = await safeProbeUrl(url, { signal, timeoutMs: 10_000 });
      if (probed.finalUrl) workUrl = probed.finalUrl;
    }
  } catch {
    // keep original
  }

  // Profile / user URL e.g. https://www.tiktok.com/@bollywood2334
  const userMatch = /tiktok\.com\/(?:embed\/)?@([A-Za-z0-9_.-]+)(?:\/?(?:\?.*)?$)/i.exec(workUrl);
  if (userMatch?.[1] && !/\/(?:video|photo)\//i.test(workUrl)) {
    const username = userMatch[1];
    try {
      const { text } = await safeFetchText(`https://www.tiktok.com/embed/@${encodeURIComponent(username)}`, {
        signal,
        timeoutMs: 15_000,
      });
      const stateMatch = /<script id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/i.exec(text);
      if (stateMatch?.[1]) {
        const state = JSON.parse(stateMatch[1]);
        const sd = state?.source?.data || {};
        const routeKey = Object.keys(sd).find((k) => Array.isArray(sd[k]?.videoList) && sd[k].videoList.length > 0);
        const profile = routeKey ? sd[routeKey] : null;
        const videoList: any[] = profile?.videoList || [];
        const userInfo = profile?.userInfo || {};

        if (videoList.length > 0) {
          const v0 = videoList[0];
          const firstPostUrl = `https://www.tiktok.com/@${v0.authorUniqueId || username}/video/${v0.id}`;
          const twFirst = await tryTikWmSingle(firstPostUrl, signal);
          const formats: FallbackFormat[] = [];

          if (twFirst?.formats?.length) {
            formats.push(...twFirst.formats);
          }

          videoList.slice(0, 6).forEach((v, idx) => {
            if (!v?.playAddr || typeof v.playAddr !== 'string') return;
            const res = v.width && v.height ? `${v.width}x${v.height}` : undefined;
            const label = twFirst?.formats?.length && idx === 0
              ? `Direct Stream (${v.ratio || 'MP4'})`
              : `Video #${idx + 1}${v.ratio ? ` (${v.ratio})` : ''}${v.desc ? ` - ${String(v.desc).replace(/\s+/g, ' ').trim().slice(0, 28)}` : ''}`;
            formats.push({
              formatId: `fb:v_post${idx}`,
              ext: 'mp4',
              directUrl: v.playAddr,
              headers: { referer: 'https://www.tiktok.com/' },
              resolution: res,
              width: v.width ? Number(v.width) : undefined,
              height: v.height ? Number(v.height) : undefined,
              qualityLabel: label,
              hasVideo: true,
              hasAudio: true,
              isAudioOnly: false,
              isVideoOnly: false,
            });
          });

          if (formats.length > 0) {
            return {
              canonicalUrl: firstPostUrl,
              title: twFirst?.title || v0.desc || `${userInfo.nickname || username} - TikTok Video`,
              thumbnail: twFirst?.thumbnail || v0.originCoverUrl || v0.coverUrl || userInfo.avatarLarger,
              uploader: userInfo.nickname || username,
              uploaderUrl: `https://www.tiktok.com/@${username}`,
              duration: twFirst?.duration,
              formats,
            };
          }
        }
      }
    } catch {
      // fall through
    }
  }

  // Single TikTok video / photo slideshow via TikWM
  const tw = await tryTikWmSingle(workUrl, signal);
  if (tw) return tw;

  // Backup: TikTok embed/v2/{id}
  const vidMatch = /\/(?:video|photo)\/(\d+)/i.exec(workUrl);
  if (vidMatch?.[1]) {
    try {
      const { text } = await safeFetchText(`https://www.tiktok.com/embed/v2/${vidMatch[1]}`, {
        signal,
        timeoutMs: 12_000,
      });
      const playMatch = /"playAddr":"([^"]+)"/.exec(text);
      if (playMatch?.[1]) {
        const directUrl = unescapeJsonUrl(playMatch[1]);
        const meta = extractMetaTags(text);
        return {
          canonicalUrl: workUrl,
          title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'TikTok Video',
          thumbnail: meta['og:image']?.[0],
          formats: [
            {
              formatId: 'fb:v0',
              ext: 'mp4',
              directUrl,
              headers: { referer: 'https://www.tiktok.com/' },
              qualityLabel: 'HD MP4',
              hasVideo: true,
              hasAudio: true,
              isAudioOnly: false,
              isVideoOnly: false,
            },
          ],
        };
      }
    } catch {
      // ignore
    }
  }

  // Secondary HTML OpenGraph check
  try {
    const { text, url: finalUrl } = await safeFetchText(workUrl, { signal, timeoutMs: 12_000 });
    const meta = extractMetaTags(text);
    const ogVideo = meta['og:video:secure_url']?.[0] || meta['og:video']?.[0];
    if (ogVideo) {
      return {
        canonicalUrl: finalUrl,
        title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'TikTok Video',
        description: meta['og:description']?.[0],
        thumbnail: meta['og:image']?.[0],
        formats: [
          {
            formatId: 'fb:v0',
            ext: 'mp4',
            directUrl: ogVideo,
            qualityLabel: 'HD MP4',
            hasVideo: true,
            hasAudio: true,
            isAudioOnly: false,
            isVideoOnly: false,
          },
        ],
      };
    }
  } catch {
    // ignore
  }
  return null;
}

function unescapeJsonUrl(raw: string): string {
  return decodeHtmlEntities(
    raw
      .replace(/\\\\\//g, '/')
      .replace(/\\\//g, '/')
      .replace(/\\u0026/gi, '&')
      .replace(/\\u003d/gi, '=')
      .replace(/\\u0025/gi, '%'),
  );
}

/**
 * Instagram fallback via public /embed/captioned/ endpoint + OpenGraph HTML (handles Reels, video posts, & photo posts)
 */
async function extractInstagramFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const scMatch = /instagram\.com\/(?:[^/]+\/)?(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i.exec(url)
    || /instagr\.am\/(?:p|reel)\/([A-Za-z0-9_-]+)/i.exec(url);

  const candidates = scMatch?.[1]
    ? [`https://www.instagram.com/p/${scMatch[1]}/embed/captioned/`, url]
    : [url];

  for (const target of candidates) {
    try {
      const { text, url: finalUrl } = await safeFetchText(target, {
        signal,
        timeoutMs: 15_000,
        headers: { 'user-agent': 'facebookexternalhit/1.1' },
      });
      const formats: FallbackFormat[] = [];
      const seenUrls = new Set<string>();

      const addFmt = (directUrl: string, kind: 'video' | 'image', label: string, ext: string) => {
        const clean = unescapeJsonUrl(directUrl);
        if (!clean.startsWith('http') || seenUrls.has(clean)) return;
        seenUrls.add(clean);
        formats.push({
          formatId: `fb:${kind === 'video' ? 'v' : 'img'}${formats.length}`,
          ext,
          directUrl: clean,
          qualityLabel: label,
          hasVideo: kind === 'video',
          hasAudio: kind === 'video',
          isAudioOnly: false,
          isVideoOnly: false,
        });
      };

      // Extract embedded MP4 URLs (inside TimeSliceImpl / JSON payloads, including https:\\\/\\\/ escapes)
      const mp4Regex = /https?:(?:\\*\/)+[^"'\s<>]+?\.mp4[^"'\s<>]*/gi;
      for (const m of text.matchAll(mp4Regex)) {
        const raw = m[0].replace(/\\+$/, '');
        addFmt(raw, 'video', formats.length === 0 ? 'HD MP4' : `MP4 (${formats.length + 1})`, 'mp4');
      }

      // OpenGraph video
      const meta = extractMetaTags(text);
      const ogVideo = meta['og:video:secure_url']?.[0] || meta['og:video']?.[0];
      if (ogVideo) addFmt(ogVideo, 'video', 'HD MP4', 'mp4');

      // Embedded image if no video (or as photo option)
      const embImg = /class="EmbeddedMediaImage"[^>]+src="([^"]+)"/i.exec(text)?.[1];
      if (embImg && formats.length === 0) {
        addFmt(embImg, 'image', 'Original Photo JPG', 'jpg');
      }
      const ogImg = meta['og:image']?.[0];
      if (ogImg && formats.length === 0) {
        addFmt(ogImg, 'image', 'Original Photo JPG', 'jpg');
      }

      if (formats.length > 0) {
        const userMatch = /class="UsernameText"[^>]*>([^<]+)</i.exec(text)?.[1]?.trim();
        const capMatch = /class="Caption"[^>]*>([\s\S]*?)<\/div>/i
          .exec(text)?.[1]
          ?.replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const title =
          meta['og:title']?.[0] ||
          (capMatch ? capMatch.slice(0, 120) : undefined) ||
          (userMatch ? `Instagram post by @${userMatch}` : 'Instagram Media');
        return {
          canonicalUrl: finalUrl,
          title,
          thumbnail: embImg ? decodeHtmlEntities(embImg) : ogImg,
          uploader: userMatch,
          uploaderUrl: userMatch ? `https://www.instagram.com/${userMatch}/` : undefined,
          formats,
        };
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

/**
 * Facebook fallback via page HTML JSON fields (browser_native_hd_url, playable_url_quality_hd, hd_src) + OpenGraph
 */
async function extractFacebookFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  for (const ua of [
    'facebookexternalhit/1.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  ]) {
    try {
      const { text, url: finalUrl } = await safeFetchText(url, {
        signal,
        timeoutMs: 15_000,
        headers: {
          'user-agent': ua,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      const formats: FallbackFormat[] = [];
      const seenUrls = new Set<string>();
      const addVid = (rawUrl: string | undefined, label: string) => {
        if (!rawUrl) return;
        const clean = unescapeJsonUrl(rawUrl).replace(/\\+$/, '');
        if (!clean.startsWith('http') || seenUrls.has(clean)) return;
        seenUrls.add(clean);
        formats.push({
          formatId: `fb:v${formats.length}`,
          ext: 'mp4',
          directUrl: clean,
          qualityLabel: label,
          hasVideo: true,
          hasAudio: true,
          isAudioOnly: false,
          isVideoOnly: false,
        });
      };

      for (const [pattern, label] of [
        [/"browser_native_hd_url"\s*:\s*"([^"]+)"/g, '1080p HD MP4'],
        [/"playable_url_quality_hd"\s*:\s*"([^"]+)"/g, 'HD MP4'],
        [/"hd_src(?:_no_ratelimit)?"\s*:\s*"([^"]+)"/g, 'HD MP4'],
        [/"browser_native_sd_url"\s*:\s*"([^"]+)"/g, 'SD MP4'],
        [/"playable_url"\s*:\s*"([^"]+)"/g, 'SD MP4'],
        [/"sd_src(?:_no_ratelimit)?"\s*:\s*"([^"]+)"/g, 'SD MP4'],
      ] as Array<[RegExp, string]>) {
        for (const m of text.matchAll(pattern)) {
          addVid(m[1], label);
        }
      }

      const meta = extractMetaTags(text);
      const ogVid = meta['og:video:secure_url']?.[0] || meta['og:video']?.[0];
      if (ogVid) addVid(ogVid, 'HD MP4');

      const ogImg = meta['og:image']?.[0];
      if (ogImg && formats.length === 0 && !ogImg.includes('static.xx.fbcdn.net')) {
        formats.push({
          formatId: 'fb:img0',
          ext: 'jpg',
          directUrl: decodeHtmlEntities(ogImg),
          qualityLabel: 'Original Image JPG',
          hasVideo: false,
          hasAudio: false,
          isAudioOnly: false,
          isVideoOnly: false,
        });
      }

      if (formats.length > 0) {
        const rawOgTitle = (meta['og:title']?.[0] || extractHtmlTitle(text) || '').trim();
        const rawOgDesc = (meta['og:description']?.[0] || '').trim();
        const parseCountStr = (s?: string): number | undefined => {
          if (!s) return undefined;
          const m = /^([\d,.]+)\s*([KMB])?$/i.exec(s.trim());
          if (!m?.[1]) return undefined;
          const base = Number(m[1].replace(/,/g, ''));
          if (!Number.isFinite(base)) return undefined;
          const mult = m[2]?.toUpperCase() === 'B' ? 1e9 : m[2]?.toUpperCase() === 'M' ? 1e6 : m[2]?.toUpperCase() === 'K' ? 1e3 : 1;
          return Math.round(base * mult);
        };

        const viewMatch = /\b([\d.,]+[KMB]?)\s+views?\b/i.exec(rawOgTitle) || /\b([\d.,]+[KMB]?)\s+views?\b/i.exec(rawOgDesc);
        const likeMatch = /\b([\d.,]+[KMB]?)\s+(?:reactions?|likes?)\b/i.exec(rawOgTitle) || /\b([\d.,]+[KMB]?)\s+(?:reactions?|likes?)\b/i.exec(rawOgDesc);
        const durMsMatch = /"playable_duration_in_ms"\s*:\s*(\d+)/.exec(text);
        const ownerMatch = /"owning_profile"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/.exec(text) || /"owner"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/.exec(text);
        const vidW = Number(meta['og:video:width']?.[0] || 0) || undefined;
        const vidH = Number(meta['og:video:height']?.[0] || 0) || undefined;
        if (vidW && vidH) {
          for (const f of formats) {
            if (f.hasVideo && !f.width && !f.height) {
              f.width = vidW;
              f.height = vidH;
            }
          }
        }

        const decodeUnicodeEscapes = (s: string) =>
          s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

        let cleanedBody = rawOgTitle.replace(/^\s*(?:[\d.,]+[KMB]?\s+(?:views?|reactions?|likes?)(?:\s*[·•,]\s*)?)+\s*\|\s*/i, '').trim();
        let parsedUploader: string | undefined = ownerMatch?.[1] ? decodeUnicodeEscapes(ownerMatch[1]) : undefined;
        const pipeParts = cleanedBody.split(/\s+\|\s+/).map((x) => x.trim()).filter(Boolean);
        if (pipeParts.length >= 2) {
          const tail = pipeParts[pipeParts.length - 1]!;
          if (tail.length <= 60 && !/^facebook$/i.test(tail)) {
            if (!parsedUploader) parsedUploader = tail;
            cleanedBody = pipeParts.slice(0, -1).join(' | ');
          }
        }
        cleanedBody = cleanedBody.replace(/\s*\|\s*Facebook\s*$/i, '').trim();
        const fullDesc = rawOgDesc && rawOgDesc.length > cleanedBody.length ? rawOgDesc : cleanedBody;
        const firstSentence = (cleanedBody || rawOgTitle || 'Facebook Media').split(/(?<=[.!?])\s+|\n+/)[0]?.trim() || '';
        const conciseTitle = (firstSentence.length >= 12 ? firstSentence : cleanedBody || rawOgTitle || 'Facebook Media').slice(0, 120);

        return {
          canonicalUrl: finalUrl,
          title: conciseTitle || 'Facebook Media',
          description: fullDesc || undefined,
          duration: durMsMatch?.[1] ? Math.round(Number(durMsMatch[1]) / 1000) : undefined,
          thumbnail: ogImg ? decodeHtmlEntities(ogImg) : undefined,
          uploader: parsedUploader,
          viewCount: parseCountStr(viewMatch?.[1]),
          likeCount: parseCountStr(likeMatch?.[1]),
          formats,
        };
      }
    } catch {
      // try next UA
    }
  }
  return null;
}

/**
 * X (Twitter) fallback via public FxTwitter & VxTwitter JSON APIs (handles videos, GIFs, & photos even when login-gated)
 */
async function extractTwitterFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const m = /(?:x|twitter|fxtwitter|vxtwitter|fixupx)\.com\/([^/?#]+)\/status\/(\d+)/i.exec(url);
  if (!m?.[1] || !m?.[2]) return null;
  const user = m[1] === 'i' ? 'i' : m[1];
  const tweetId = m[2];

  // Try FxTwitter first
  try {
    const { data } = await safeFetchJson<any>(`https://api.fxtwitter.com/${user}/status/${tweetId}`, {
      signal,
      timeoutMs: 12_000,
    });
    const tw = data?.tweet;
    if (tw) {
      const formats: FallbackFormat[] = [];
      const seen = new Set<string>();
      const pushFmt = (fmt: Omit<FallbackFormat, 'formatId'>, prefix: string) => {
        if (!fmt.directUrl || seen.has(fmt.directUrl)) return;
        seen.add(fmt.directUrl);
        formats.push({ ...fmt, formatId: `fb:${prefix}${formats.length}` });
      };

      const mediaItems: any[] = Array.isArray(tw.media?.all)
        ? tw.media.all
        : [...(tw.media?.videos || []), ...(tw.media?.photos || [])];

      for (const item of mediaItems) {
        if (item.type === 'video' || item.type === 'gif') {
          if (Array.isArray(item.variants)) {
            const mp4s = item.variants
              .filter((v: any) => v.content_type === 'video/mp4' && v.url)
              .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));
            for (const v of mp4s) {
              const kbps = v.bitrate ? `${Math.round(v.bitrate / 1000)}kbps` : 'MP4';
              pushFmt(
                {
                  ext: 'mp4',
                  directUrl: v.url,
                  width: item.width,
                  height: item.height,
                  qualityLabel: item.type === 'gif' ? `GIF MP4 (${kbps})` : `HD MP4 (${kbps})`,
                  hasVideo: true,
                  hasAudio: item.type !== 'gif',
                  isAudioOnly: false,
                  isVideoOnly: false,
                },
                'v',
              );
            }
          }
          if (item.url) {
            pushFmt(
              {
                ext: 'mp4',
                directUrl: item.url,
                width: item.width,
                height: item.height,
                qualityLabel: item.type === 'gif' ? 'GIF MP4' : 'HD MP4',
                hasVideo: true,
                hasAudio: item.type !== 'gif',
                isAudioOnly: false,
                isVideoOnly: false,
              },
              'v',
            );
          }
        } else if (item.type === 'photo' && item.url) {
          pushFmt(
            {
              ext: item.url.includes('.png') ? 'png' : 'jpg',
              directUrl: item.url,
              width: item.width,
              height: item.height,
              qualityLabel: `Original Photo (${item.width || ''}x${item.height || ''})`.replace(' (x)', ''),
              hasVideo: false,
              hasAudio: false,
              isAudioOnly: false,
              isVideoOnly: false,
            },
            'img',
          );
        }
      }

      if (formats.length > 0) {
        return {
          canonicalUrl: tw.url || url,
          title: tw.text ? tw.text.replace(/\s+/g, ' ').slice(0, 120) : `Post by @${tw.author?.screen_name || user}`,
          duration: tw.media?.videos?.[0]?.duration ? Number(tw.media.videos[0].duration) : undefined,
          thumbnail: tw.media?.videos?.[0]?.thumbnail_url || tw.media?.photos?.[0]?.url,
          uploader: tw.author?.screen_name ? `@${tw.author.screen_name}` : tw.author?.name,
          uploaderUrl: tw.author?.screen_name ? `https://x.com/${tw.author.screen_name}` : undefined,
          formats,
        };
      }
    }
  } catch {
    // fallback to vxtwitter
  }

  try {
    const { data } = await safeFetchJson<any>(`https://api.vxtwitter.com/${user}/status/${tweetId}`, {
      signal,
      timeoutMs: 12_000,
    });
    const formats: FallbackFormat[] = [];
    if (Array.isArray(data?.media_extended)) {
      for (const m of data.media_extended) {
        if ((m.type === 'video' || m.type === 'gif') && m.url) {
          formats.push({
            formatId: `fb:v${formats.length}`,
            ext: 'mp4',
            directUrl: m.url,
            width: m.size?.width,
            height: m.size?.height,
            qualityLabel: m.type === 'gif' ? 'GIF MP4' : 'HD MP4',
            hasVideo: true,
            hasAudio: m.type !== 'gif',
            isAudioOnly: false,
            isVideoOnly: false,
          });
        } else if (m.type === 'image' && m.url) {
          formats.push({
            formatId: `fb:img${formats.length}`,
            ext: 'jpg',
            directUrl: m.url,
            qualityLabel: 'Original Photo JPG',
            hasVideo: false,
            hasAudio: false,
            isAudioOnly: false,
            isVideoOnly: false,
          });
        }
      }
    }
    if (formats.length > 0) {
      return {
        canonicalUrl: data.tweetURL || url,
        title: data.text ? data.text.replace(/\s+/g, ' ').slice(0, 120) : 'X Media',
        thumbnail: data.media_extended?.[0]?.thumbnail_url || data.mediaURLs?.[0],
        uploader: data.user_screen_name ? `@${data.user_screen_name}` : data.user_name,
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Reddit fallback via vxreddit.com OpenGraph + gallery component JSON, plus direct v.redd.it / i.redd.it links
 */
async function extractRedditFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  // Direct image link on i.redd.it
  if (/^https?:\/\/i\.redd\.it\//i.test(url)) {
    const extMatch = /\.([a-z0-9]{3,4})(?:[?#]|$)/i.exec(url);
    const ext = extMatch?.[1]?.toLowerCase() || 'jpg';
    return {
      canonicalUrl: url,
      title: 'Reddit Image',
      thumbnail: url,
      formats: [
        {
          formatId: 'fb:img0',
          ext,
          directUrl: url,
          qualityLabel: `Original ${ext.toUpperCase()}`,
          hasVideo: false,
          hasAudio: false,
          isAudioOnly: false,
          isVideoOnly: false,
        },
      ],
    };
  }

  // Extract post ID for reddit.com / redd.it / share links (/r/sub/s/...)
  let targetUrl: string | undefined;
  const idMatch = /(?:comments|redd\.it)\/([a-z0-9]{5,10})/i.exec(url);
  if (idMatch?.[1]) {
    targetUrl = `https://vxreddit.com/comments/${idMatch[1]}`;
  } else {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes('reddit.com') || parsed.hostname.includes('vxreddit.com') || parsed.hostname.includes('rxddit.com')) {
        parsed.hostname = 'vxreddit.com';
        targetUrl = parsed.toString();
      }
    } catch {
      // ignore
    }
  }

  if (!targetUrl) return null;

  try {
    const { text, url: finalUrl } = await safeFetchText(targetUrl, {
      signal,
      timeoutMs: 15_000,
      headers: { 'user-agent': 'Discordbot/2.0' },
    });

    const meta = extractMetaTags(text);
    const formats: FallbackFormat[] = [];
    const seen = new Set<string>();

    const ogVid = meta['og:video:secure_url']?.[0] || meta['og:video:url']?.[0] || meta['og:video']?.[0];
    if (ogVid && ogVid.startsWith('http')) {
      seen.add(ogVid);
      formats.push({
        formatId: 'fb:v0',
        ext: 'mp4',
        directUrl: ogVid,
        qualityLabel: 'HD MP4',
        hasVideo: true,
        hasAudio: true,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    }

    // Extract gallery or GIF/image URLs from Discord component embed script
    const compMatch = /<script[^>]+id="discord:component-embed"[^>]*>([\s\S]*?)<\/script>/i.exec(text);
    if (compMatch?.[1] && formats.length === 0) {
      try {
        const parsed = JSON.parse(compMatch[1]);
        const stack: any[] = [parsed];
        while (stack.length > 0) {
          const cur = stack.pop();
          if (!cur || typeof cur !== 'object') continue;
          if (typeof cur.url === 'string' && cur.url.startsWith('http') && !seen.has(cur.url)) {
            seen.add(cur.url);
            const extMatch = /\.([a-z0-9]{3,4})(?:[?#]|$)/i.exec(cur.url);
            const ext = extMatch?.[1]?.toLowerCase() || 'jpg';
            const isVid = ext === 'mp4' || ext === 'webm';
            formats.push({
              formatId: `fb:${isVid ? 'v' : 'img'}${formats.length}`,
              ext,
              directUrl: cur.url,
              qualityLabel: isVid ? 'HD MP4' : `Original ${ext.toUpperCase()}${formats.length > 0 ? ` (${formats.length + 1})` : ''}`,
              hasVideo: isVid,
              hasAudio: isVid,
              isAudioOnly: false,
              isVideoOnly: false,
            });
          }
          for (const val of Object.values(cur)) {
            if (val && typeof val === 'object') stack.push(val);
          }
        }
      } catch {
        // ignore JSON parse errors
      }
    }

    const ogImg = meta['og:image']?.[0];
    if (ogImg && ogImg.startsWith('http') && formats.length === 0) {
      const extMatch = /\.([a-z0-9]{3,4})(?:[?#]|$)/i.exec(ogImg);
      const ext = extMatch?.[1]?.toLowerCase() || 'jpg';
      formats.push({
        formatId: 'fb:img0',
        ext,
        directUrl: ogImg,
        qualityLabel: `Original ${ext.toUpperCase()}`,
        hasVideo: false,
        hasAudio: false,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    }

    if (formats.length > 0) {
      return {
        canonicalUrl: meta['og:url']?.[0] || finalUrl,
        title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'Reddit Media',
        thumbnail: ogImg,
        uploader: meta['og:site_name']?.[0],
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Pinterest fallback via Widgets JSON API (image pins, video pins, pin.it shortlinks) + HTML video_list
 */
async function extractPinterestFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  let resolvedUrl = url;
  if (/pin\.it\//i.test(url)) {
    try {
      const resp = await safeFetch(url, { method: 'GET', signal, timeoutMs: 12_000 });
      resolvedUrl = resp.url || url;
      await resp.body?.cancel().catch(() => {});
    } catch {
      // ignore
    }
  }

  const idMatch = /\/pin\/(?:[^/]+--)?(\d+)/i.exec(resolvedUrl) || /pin_id=(\d+)/i.exec(resolvedUrl);
  if (!idMatch?.[1]) return null;
  const pinId = idMatch[1];

  try {
    const { data } = await safeFetchJson<any>(
      `https://widgets.pinterest.com/v3/pidgets/pins/info/?pin_ids=${encodeURIComponent(pinId)}`,
      { signal, timeoutMs: 12_000 },
    );
    const pin = data?.data?.[0];
    if (pin) {
      const formats: FallbackFormat[] = [];
      const seen = new Set<string>();

      const videoList = pin.videos?.video_list;
      if (videoList && typeof videoList === 'object') {
        const variants = Object.values<any>(videoList)
          .filter((v) => v?.url)
          .sort((a, b) => (b.height || 0) - (a.height || 0));
        for (const v of variants) {
          const u = String(v.url);
          if (seen.has(u)) continue;
          seen.add(u);
          const isHls = /\.m3u8(?:$|\?)/i.test(u);
          formats.push({
            formatId: `fb:v${formats.length}`,
            ext: 'mp4',
            directUrl: u,
            isHls,
            width: v.width,
            height: v.height,
            qualityLabel: v.height ? `${v.height}p MP4${isHls ? ' (HLS)' : ''}` : 'HD MP4',
            hasVideo: true,
            hasAudio: true,
            isAudioOnly: false,
            isVideoOnly: false,
          });
        }
      }

      // Check HTML for video_list or MP4 if marked is_video without widget video_list
      if (formats.length === 0 && pin.is_video) {
        try {
          const { text } = await safeFetchText(`https://www.pinterest.com/pin/${pinId}/`, { signal, timeoutMs: 12_000 });
          for (const m of text.matchAll(/https:\/\/v\d*\.pinimg\.com\/videos\/[^"'\s<>\\]+?\.mp4/gi)) {
            const u = unescapeJsonUrl(m[0]);
            if (seen.has(u)) continue;
            seen.add(u);
            formats.push({
              formatId: `fb:v${formats.length}`,
              ext: 'mp4',
              directUrl: u,
              qualityLabel: 'HD MP4',
              hasVideo: true,
              hasAudio: true,
              isAudioOnly: false,
              isVideoOnly: false,
            });
          }
        } catch {
          // ignore
        }
      }

      // Extract highest-resolution image (probe /originals/ first)
      const imgEntries = pin.images && typeof pin.images === 'object' ? Object.values<any>(pin.images) : [];
      const largestImg = imgEntries
        .filter((img) => img?.url)
        .sort((a, b) => (b.width || 0) - (a.width || 0))[0];

      if (largestImg?.url && formats.length === 0) {
        const origCandidate = String(largestImg.url).replace(/\/\d+x\//, '/originals/');
        let chosenUrl = String(largestImg.url);
        try {
          const headResp = await safeFetch(origCandidate, { method: 'HEAD', signal, timeoutMs: 6_000 });
          await headResp.body?.cancel().catch(() => {});
          if (headResp.ok) chosenUrl = origCandidate;
        } catch {
          // fallback to largestImg.url
        }
        const ext = /\.([a-z0-9]{3,4})(?:[?#]|$)/i.exec(chosenUrl)?.[1]?.toLowerCase() || 'jpg';
        formats.push({
          formatId: 'fb:img0',
          ext,
          directUrl: chosenUrl,
          width: largestImg.width,
          height: largestImg.height,
          qualityLabel: `Original Image ${ext.toUpperCase()}`,
          hasVideo: false,
          hasAudio: false,
          isAudioOnly: false,
          isVideoOnly: false,
        });
      }

      if (formats.length > 0) {
        return {
          canonicalUrl: `https://www.pinterest.com/pin/${pinId}/`,
          title: pin.rich_metadata?.title || pin.description?.slice(0, 120) || 'Pinterest Pin',
          description: pin.description,
          thumbnail: largestImg?.url,
          uploader: pin.pinner?.full_name || pin.pinner?.username,
          uploaderUrl: pin.pinner?.username ? `https://www.pinterest.com/${pin.pinner.username}/` : undefined,
          formats,
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Bluesky fallback via public ATProto AppView getPostThread (videos via HLS + images)
 */
async function extractBlueskyFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const m = /bsky\.app\/profile\/([^/?#]+)\/post\/([a-z0-9]+)/i.exec(url);
  if (!m?.[1] || !m?.[2]) return null;
  const actor = m[1];
  const rkey = m[2];
  const atUri = `at://${actor}/app.bsky.feed.post/${rkey}`;

  try {
    const { data } = await safeFetchJson<any>(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?depth=0&uri=${encodeURIComponent(atUri)}`,
      { signal, timeoutMs: 12_000 },
    );
    const post = data?.thread?.post;
    if (!post) return null;

    const embed = post.embed?.$type === 'app.bsky.embed.recordWithMedia#view' ? post.embed.media : post.embed;
    const formats: FallbackFormat[] = [];

    if (embed?.$type === 'app.bsky.embed.video#view' && embed.playlist) {
      formats.push({
        formatId: 'fb:v0',
        ext: 'mp4',
        directUrl: String(embed.playlist),
        isHls: true,
        width: embed.aspectRatio?.width,
        height: embed.aspectRatio?.height,
        qualityLabel: 'HD MP4 (HLS)',
        hasVideo: true,
        hasAudio: true,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    } else if (embed?.$type === 'app.bsky.embed.images#view' && Array.isArray(embed.images)) {
      embed.images.forEach((img: any, idx: number) => {
        if (!img?.fullsize) return;
        formats.push({
          formatId: `fb:img${idx}`,
          ext: 'jpg',
          directUrl: String(img.fullsize),
          width: img.aspectRatio?.width,
          height: img.aspectRatio?.height,
          qualityLabel: embed.images.length > 1 ? `Photo ${idx + 1}` : 'Original Photo JPG',
          hasVideo: false,
          hasAudio: false,
          isAudioOnly: false,
          isVideoOnly: false,
        });
      });
    }

    if (formats.length > 0) {
      const textContent = typeof post.record?.text === 'string' ? post.record.text.replace(/\s+/g, ' ').trim() : '';
      return {
        canonicalUrl: `https://bsky.app/profile/${post.author?.handle || actor}/post/${rkey}`,
        title: textContent ? textContent.slice(0, 120) : `Bluesky post by ${post.author?.handle || actor}`,
        thumbnail: embed?.thumbnail || embed?.images?.[0]?.thumb,
        uploader: post.author?.displayName || post.author?.handle,
        uploaderUrl: post.author?.handle ? `https://bsky.app/profile/${post.author.handle}` : undefined,
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Tumblr fallback via legacy public /api/read/json + OpenGraph (covers videos, GIFs, & photo galleries)
 */
async function extractTumblrFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const subMatch = /^https?:\/\/([a-z0-9-]+)\.tumblr\.com\/(?:post|video)\/(\d+)/i.exec(url);
  const pathMatch = /^https?:\/\/(?:www\.)?tumblr\.com\/([a-z0-9-]+)\/(\d+)/i.exec(url);
  const blog = subMatch?.[1] || pathMatch?.[1];
  const postId = subMatch?.[2] || pathMatch?.[2];

  if (blog && postId && blog !== 'www' && blog !== 'assets') {
    try {
      const { text } = await safeFetchText(`https://${blog}.tumblr.com/api/read/json?id=${postId}`, {
        signal,
        timeoutMs: 12_000,
      });
      const jsonStr = text.replace(/^\s*var\s+tumblr_api_read\s*=\s*/, '').replace(/;\s*$/, '');
      const data = JSON.parse(jsonStr);
      const post = data?.posts?.[0];
      if (post) {
        const formats: FallbackFormat[] = [];
        const seen = new Set<string>();
        const pushFmt = (fmt: Omit<FallbackFormat, 'formatId'>, prefix: string) => {
          if (!fmt.directUrl || seen.has(fmt.directUrl)) return;
          seen.add(fmt.directUrl);
          formats.push({ ...fmt, formatId: `fb:${prefix}${formats.length}` });
        };

        const rawHtml = [post['video-player'], post['regular-body'], post['photo-caption'], post['quote-text']]
          .filter(Boolean)
          .join('\n');

        for (const m of rawHtml.matchAll(/<(?:source|video)[^>]+src=["']([^"']+)["']/gi)) {
          const u = unescapeJsonUrl(m[1] || '');
          if (u.startsWith('http')) {
            pushFmt({ ext: 'mp4', directUrl: u, qualityLabel: 'HD MP4', hasVideo: true, hasAudio: true, isAudioOnly: false, isVideoOnly: false }, 'v');
          }
        }
        for (const m of rawHtml.matchAll(/https:\/\/va\.media\.tumblr\.com\/[^\s"'<>]+?\.mp4/gi)) {
          pushFmt({ ext: 'mp4', directUrl: unescapeJsonUrl(m[0]), qualityLabel: 'HD MP4', hasVideo: true, hasAudio: true, isAudioOnly: false, isVideoOnly: false }, 'v');
        }

        if (Array.isArray(post.photos) && post.photos.length > 0 && formats.length === 0) {
          post.photos.forEach((ph: any, idx: number) => {
            const imgUrl = ph['photo-url-1280'] || ph['photo-url-500'] || ph['photo-url-400'];
            if (imgUrl) {
              const ext = /\.([a-z0-9]{3,4})(?:[?#]|$)/i.exec(imgUrl)?.[1]?.toLowerCase() || 'jpg';
              pushFmt({ ext, directUrl: imgUrl, qualityLabel: `Photo ${idx + 1} (${ext.toUpperCase()})`, hasVideo: false, hasAudio: false, isAudioOnly: false, isVideoOnly: false }, 'img');
            }
          });
        }

        if (formats.length === 0) {
          const singlePhoto = post['photo-url-1280'] || post['photo-url-500'];
          if (singlePhoto) {
            const ext = /\.([a-z0-9]{3,4})(?:[?#]|$)/i.exec(singlePhoto)?.[1]?.toLowerCase() || 'jpg';
            pushFmt({ ext, directUrl: singlePhoto, qualityLabel: `Original ${ext.toUpperCase()}`, hasVideo: false, hasAudio: false, isAudioOnly: false, isVideoOnly: false }, 'img');
          } else {
            for (const m of rawHtml.matchAll(/<img[^>]+src=["'](https:\/\/[^"']+)["']/gi)) {
              const u = decodeHtmlEntities(m[1] || '');
              const ext = /\.([a-z0-9]{3,4})(?:[?#]|$)/i.exec(u)?.[1]?.toLowerCase() || 'jpg';
              pushFmt({ ext, directUrl: u, qualityLabel: `Image ${ext.toUpperCase()}`, hasVideo: false, hasAudio: false, isAudioOnly: false, isVideoOnly: false }, 'img');
            }
          }
        }

        if (formats.length > 0) {
          const rawTitle = post['regular-title'] || post['slug']?.replace(/-/g, ' ') || post['photo-caption']?.replace(/<[^>]+>/g, ' ').trim();
          return {
            canonicalUrl: post['url-with-slug'] || post.url || url,
            title: rawTitle ? String(rawTitle).slice(0, 120) : `Tumblr post by ${blog}`,
            thumbnail: post['photo-url-500'],
            uploader: data?.tumblelog?.title || blog,
            uploaderUrl: `https://${blog}.tumblr.com/`,
            formats,
          };
        }
      }
    } catch {
      // fall through to HTML
    }
  }

  try {
    const { text, url: finalUrl } = await safeFetchText(url, { signal, timeoutMs: 12_000 });
    const meta = extractMetaTags(text);
    const ogVid = meta['og:video:secure_url']?.[0] || meta['og:video']?.[0];
    const ogImg = meta['og:image']?.[0];
    if (ogVid || ogImg) {
      const target = ogVid || ogImg!;
      const isVid = Boolean(ogVid);
      return {
        canonicalUrl: finalUrl,
        title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'Tumblr Media',
        thumbnail: ogImg,
        formats: [
          {
            formatId: isVid ? 'fb:v0' : 'fb:img0',
            ext: isVid ? 'mp4' : /\.([a-z0-9]{3,4})(?:[?#]|$)/i.exec(target)?.[1]?.toLowerCase() || 'jpg',
            directUrl: target,
            qualityLabel: isVid ? 'HD MP4' : 'Original Image',
            hasVideo: isVid,
            hasAudio: isVid,
            isAudioOnly: false,
            isVideoOnly: false,
          },
        ],
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * LinkedIn fallback via public post HTML data-sources + OpenGraph tags
 */
async function extractLinkedInFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  try {
    const { text, url: finalUrl } = await safeFetchText(url, {
      signal,
      timeoutMs: 15_000,
      headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    });
    const formats: FallbackFormat[] = [];
    const seen = new Set<string>();
    const addUrl = (u: string, isVid: boolean, label: string) => {
      const clean = unescapeJsonUrl(u);
      if (!clean.startsWith('http') || seen.has(clean)) return;
      seen.add(clean);
      const ext = isVid ? 'mp4' : /\.([a-z0-9]{3,4})(?:[?#]|$)/i.exec(clean)?.[1]?.toLowerCase() || 'jpg';
      formats.push({
        formatId: `fb:${isVid ? 'v' : 'img'}${formats.length}`,
        ext,
        directUrl: clean,
        qualityLabel: label,
        hasVideo: isVid,
        hasAudio: isVid,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    };

    // Extract video data-sources JSON embedded in public LinkedIn pages
    for (const m of text.matchAll(/data-sources=["'](\[\{[^"']+\}\])["']/gi)) {
      try {
        const arr = JSON.parse(decodeHtmlEntities(m[1] || '[]'));
        if (Array.isArray(arr)) {
          arr
            .filter((s: any) => typeof s?.src === 'string')
            .sort((a: any, b: any) => Number(b['data-bitrate'] || 0) - Number(a['data-bitrate'] || 0))
            .forEach((s: any) => {
              const kbps = s['data-bitrate'] ? `${Math.round(Number(s['data-bitrate']) / 1000)}kbps` : 'HD';
              addUrl(s.src, true, `MP4 (${kbps})`);
            });
        }
      } catch {
        // ignore JSON parse failure
      }
    }

    for (const m of text.matchAll(/https:\/\/(?:dms|media)\.licdn\.com\/(?:dms\/)?playlist\/vid\/[^\s"'<>\\]+/gi)) {
      addUrl(m[0], true, 'HD MP4');
    }

    const meta = extractMetaTags(text);
    const ogVid = meta['og:video:secure_url']?.[0] || meta['og:video']?.[0];
    if (ogVid) addUrl(ogVid, true, 'HD MP4');

    const ogImg = meta['og:image']?.[0];
    if (ogImg && formats.length === 0 && !ogImg.includes('static.licdn.com')) {
      addUrl(ogImg, false, 'Original Image');
    }
    if (formats.length === 0) {
      for (const m of text.matchAll(/https:\/\/media\.licdn\.com\/dms\/image\/[^\s"'<>\\]+/gi)) {
        if (!m[0].includes('profile-display')) addUrl(m[0], false, 'Post Image');
      }
    }

    if (formats.length > 0) {
      return {
        canonicalUrl: finalUrl,
        title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'LinkedIn Media',
        description: meta['og:description']?.[0],
        thumbnail: ogImg,
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Snapchat Spotlight & shared story fallback via JSON-LD contentUrl + OpenGraph metadata
 */
async function extractSnapchatFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  try {
    const { text, url: finalUrl } = await safeFetchText(url, {
      signal,
      timeoutMs: 15_000,
      headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    });
    const formats: FallbackFormat[] = [];
    const seen = new Set<string>();
    const addVid = (rawUrl: string | undefined, label: string) => {
      if (!rawUrl) return;
      const clean = unescapeJsonUrl(rawUrl);
      if (!clean.startsWith('http') || seen.has(clean)) return;
      seen.add(clean);
      formats.push({
        formatId: `fb:v${formats.length}`,
        ext: 'mp4',
        directUrl: clean,
        qualityLabel: label,
        hasVideo: true,
        hasAudio: true,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    };

    const meta = extractMetaTags(text);
    for (const m of text.matchAll(/"contentUrl"\s*:\s*"([^"]+)"/gi)) {
      addVid(m[1], 'Spotlight HD MP4');
    }
    for (const m of text.matchAll(/"snapUrls"\s*:\s*\{\s*"mediaUrl"\s*:\s*"([^"]+)"/gi)) {
      addVid(m[1], 'Story HD MP4');
    }
    const ogVid = meta['og:video:secure_url']?.[0] || meta['og:video']?.[0];
    if (ogVid) addVid(ogVid, 'HD MP4');

    const ogImg = meta['og:image']?.[0];
    if (ogImg && formats.length === 0) {
      formats.push({
        formatId: 'fb:img0',
        ext: 'jpg',
        directUrl: decodeHtmlEntities(ogImg),
        qualityLabel: 'Original Image JPG',
        hasVideo: false,
        hasAudio: false,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    }

    if (formats.length > 0) {
      return {
        canonicalUrl: finalUrl,
        title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'Snapchat Spotlight',
        description: meta['og:description']?.[0],
        thumbnail: ogImg,
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * VK / VKVideo fallback via video_ext / OpenGraph HTML parsing
 */
async function extractVkFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const idMatch = /video(-?\d+)_(\d+)/i.exec(url);
  const targets = idMatch
    ? [`https://vk.com/video_ext.php?oid=${idMatch[1]}&id=${idMatch[2]}`, url]
    : [url];

  for (const t of targets) {
    try {
      const { text, url: finalUrl } = await safeFetchText(t, { signal, timeoutMs: 12_000 });
      const formats: FallbackFormat[] = [];
      const seen = new Set<string>();
      const pushVid = (u: string, label: string, isHls = false) => {
        const clean = unescapeJsonUrl(u);
        if (!clean.startsWith('http') || seen.has(clean)) return;
        seen.add(clean);
        formats.push({
          formatId: `fb:v${formats.length}`,
          ext: 'mp4',
          directUrl: clean,
          isHls,
          qualityLabel: label,
          hasVideo: true,
          hasAudio: true,
          isAudioOnly: false,
          isVideoOnly: false,
        });
      };

      for (const q of ['1080', '720', '480', '360', '240']) {
        const m = new RegExp(`"url${q}"\\s*:\\s*"([^"]+)"`).exec(text);
        if (m?.[1]) pushVid(m[1], `${q}p MP4`);
      }
      const hls = /"hls"\s*:\s*"([^"]+)"/.exec(text)?.[1];
      if (hls && formats.length === 0) pushVid(hls, 'HD MP4 (HLS)', true);

      const meta = extractMetaTags(text);
      const ogVid = meta['og:video:secure_url']?.[0] || meta['og:video']?.[0];
      if (ogVid && formats.length === 0) pushVid(ogVid, 'HD MP4');

      if (formats.length > 0) {
        return {
          canonicalUrl: finalUrl,
          title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'VK Video',
          thumbnail: meta['og:image']?.[0],
          formats,
        };
      }
    } catch {
      // try next
    }
  }
  return null;
}

let cachedWeiboSub: { value: string; expiresAt: number } | null = null;

async function getWeiboGuestSub(signal?: AbortSignal): Promise<string | null> {
  if (cachedWeiboSub && cachedWeiboSub.expiresAt > Date.now()) {
    return cachedWeiboSub.value;
  }
  try {
    const gvText = await safeFetchText('https://passport.weibo.com/visitor/genvisitor', {
      method: 'POST',
      signal,
      timeoutMs: 10_000,
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body:
        'cb=gen_callback&fp=' +
        encodeURIComponent(
          JSON.stringify({
            os: '1',
            browser: 'Chrome131,0,0,0',
            fonts: 'undefined',
            screenInfo: '1920*1080*24',
            plugins: '',
          }),
        ),
    });
    const tid = /"tid"\s*:\s*"([^"]+)"/.exec(gvText.text)?.[1];
    if (!tid) return null;
    const inc = await safeFetchText(
      `https://passport.weibo.com/visitor/visitor?a=incarnate&t=${encodeURIComponent(tid)}&w=2&c=095&gc=&cb=cross_domain&from=weibo&_rand=0.1`,
      { signal, timeoutMs: 10_000 },
    );
    const sub = /"sub"\s*:\s*"([^"]+)"/.exec(inc.text)?.[1];
    if (sub) {
      cachedWeiboSub = { value: sub, expiresAt: Date.now() + 25 * 60 * 1000 };
      return sub;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Weibo fallback using anonymous Sina visitor cookie (video.weibo.com + m.weibo.cn / weibo.com ajax API)
 */
async function extractWeiboFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const sub = await getWeiboGuestSub(signal);
  const headers: Record<string, string> = {
    referer: 'https://weibo.com/',
    ...(sub ? { cookie: `SUB=${sub}` } : {}),
  };

  // 1. Video show link (/show/<oid> or fid=<oid>)
  const oidMatch = /(?:show\/|fid=)(\d+:\d+)/i.exec(url);
  if (oidMatch?.[1]) {
    const oid = oidMatch[1];
    try {
      const { data } = await safeFetchJson<any>(`https://h5.video.weibo.com/api/component?page=/show/${oid}`, {
        method: 'POST',
        signal,
        timeoutMs: 12_000,
        headers: {
          ...headers,
          'content-type': 'application/x-www-form-urlencoded',
          'page-referer': `/show/${oid}`,
        },
        body: 'data=' + encodeURIComponent(JSON.stringify({ Component_Play_Playinfo: { oid } })),
      });
      const playinfo = data?.data?.Component_Play_Playinfo;
      const urlsObj = playinfo?.urls;
      if (urlsObj && typeof urlsObj === 'object') {
        const formats: FallbackFormat[] = [];
        for (const [label, rawStreamUrl] of Object.entries<any>(urlsObj)) {
          if (typeof rawStreamUrl !== 'string' || !rawStreamUrl) continue;
          const absUrl = rawStreamUrl.startsWith('//') ? `https:${rawStreamUrl}` : rawStreamUrl;
          formats.push({
            formatId: `fb:v${formats.length}`,
            ext: 'mp4',
            directUrl: absUrl,
            headers: { referer: 'https://weibo.com/' },
            qualityLabel: String(label),
            hasVideo: true,
            hasAudio: true,
            isAudioOnly: false,
            isVideoOnly: false,
          });
        }
        if (formats.length > 0) {
          return {
            canonicalUrl: url,
            title: playinfo.title || playinfo.text || 'Weibo Video',
            duration: playinfo.duration ? Number(playinfo.duration) : undefined,
            thumbnail: playinfo.cover_image?.startsWith('//') ? `https:${playinfo.cover_image}` : playinfo.cover_image,
            uploader: playinfo.author || playinfo.nickname,
            formats,
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Status post URL (weibo.com/<uid>/<mid> or m.weibo.cn/detail/<mid> or m.weibo.cn/status/<mid>)
  const midMatch = /weibo\.(?:com|cn)\/(?:detail\/|status\/|\d+\/)([A-Za-z0-9]+)/i.exec(url);
  if (midMatch?.[1]) {
    const mid = midMatch[1];
    try {
      const { data } = await safeFetchJson<any>(`https://weibo.com/ajax/statuses/show?id=${encodeURIComponent(mid)}`, {
        signal,
        timeoutMs: 12_000,
        headers,
      });
      const media = data?.page_info?.media_info;
      const formats: FallbackFormat[] = [];
      const seen = new Set<string>();
      const addVid = (rawU: string | undefined, label: string) => {
        if (!rawU) return;
        const abs = rawU.startsWith('//') ? `https:${rawU}` : rawU;
        if (!abs.startsWith('http') || seen.has(abs)) return;
        seen.add(abs);
        formats.push({
          formatId: `fb:v${formats.length}`,
          ext: 'mp4',
          directUrl: abs,
          headers: { referer: 'https://weibo.com/' },
          qualityLabel: label,
          hasVideo: true,
          hasAudio: true,
          isAudioOnly: false,
          isVideoOnly: false,
        });
      };

      if (media) {
        if (Array.isArray(media.playback_list)) {
          for (const item of media.playback_list) {
            addVid(item?.play_info?.url, item?.meta?.label || 'MP4');
          }
        }
        addVid(media.mp4_1080p_mp4, '1080p MP4');
        addVid(media.mp4_720p_mp4, '720p MP4');
        addVid(media.stream_url_hd, 'HD MP4');
        addVid(media.mp4_sd_url || media.stream_url, 'SD MP4');
      }

      if (formats.length === 0 && Array.isArray(data?.pic_ids) && data?.pic_infos) {
        data.pic_ids.forEach((pid: string, idx: number) => {
          const info = data.pic_infos[pid];
          const picUrl = info?.original?.url || info?.largest?.url || info?.large?.url;
          if (picUrl) {
            formats.push({
              formatId: `fb:img${idx}`,
              ext: 'jpg',
              directUrl: picUrl,
              headers: { referer: 'https://weibo.com/' },
              qualityLabel: `Photo ${idx + 1}`,
              hasVideo: false,
              hasAudio: false,
              isAudioOnly: false,
              isVideoOnly: false,
            });
          }
        });
      }

      if (formats.length > 0) {
        return {
          canonicalUrl: url,
          title: (data.text_raw || 'Weibo Media').replace(/\s+/g, ' ').slice(0, 120),
          thumbnail: data.page_info?.page_pic?.url,
          uploader: data.user?.screen_name,
          formats,
        };
      }
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Vimeo fallback via player.vimeo.com config JSON (works without logged-in web session)
 */
async function extractVimeoFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const m = /vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)/i.exec(url);
  if (!m?.[1]) return null;
  const videoId = m[1];

  const formats: FallbackFormat[] = [];
  const seen = new Set<string>();
  let title = `Vimeo Video ${videoId}`;
  let duration: number | undefined;
  let thumbnail: string | undefined;
  let uploader: string | undefined;
  let uploaderUrl: string | undefined;
  let canonicalUrl = `https://vimeo.com/${videoId}`;

  const collectConfig = (cfg: any) => {
    if (!cfg) return;
    if (cfg.video?.title) title = String(cfg.video.title);
    if (cfg.video?.duration) duration = Number(cfg.video.duration);
    if (cfg.video?.url) canonicalUrl = String(cfg.video.url);
    thumbnail = thumbnail || cfg.video?.thumbs?.['1280'] || cfg.video?.thumbs?.['640'] || cfg.video?.thumbs?.base;
    uploader = uploader || cfg.video?.owner?.name;
    uploaderUrl = uploaderUrl || cfg.video?.owner?.url;

    const prog = Array.isArray(cfg?.request?.files?.progressive) ? cfg.request.files.progressive : [];
    prog
      .filter((f: any) => f?.url)
      .sort((a: any, b: any) => (b.height || 0) - (a.height || 0))
      .forEach((f: any) => {
        if (seen.has(f.url)) return;
        seen.add(f.url);
        formats.push({
          formatId: `fb:v${formats.length}`,
          ext: 'mp4',
          directUrl: String(f.url),
          width: f.width,
          height: f.height,
          qualityLabel: f.quality || (f.height ? `${f.height}p MP4` : 'MP4'),
          hasVideo: true,
          hasAudio: true,
          isAudioOnly: false,
          isVideoOnly: false,
        });
      });

    const hlsObj = cfg?.request?.files?.hls;
    if (hlsObj?.cdns) {
      const cdnEntries = Object.entries<any>(hlsObj.cdns);
      // Prefer default_cdn first, then any non-DRM CDN
      cdnEntries.sort(([kA], [kB]) => (kA === hlsObj.default_cdn ? -1 : kB === hlsObj.default_cdn ? 1 : 0));
      for (const [, cdn] of cdnEntries) {
        const hlsUrl = cdn?.avc_url || cdn?.url;
        if (!hlsUrl || typeof hlsUrl !== 'string') continue;
        // Skip Widevine/FairPlay cbcs DRM playlists that ffmpeg/clients cannot decrypt
        if (/\/drm\/|cbcs/i.test(hlsUrl)) continue;
        if (seen.has(hlsUrl)) continue;
        seen.add(hlsUrl);
        formats.push({
          formatId: `fb:v${formats.length}`,
          ext: 'mp4',
          directUrl: hlsUrl,
          isHls: true,
          width: cfg?.video?.width,
          height: cfg?.video?.height,
          qualityLabel: cfg?.video?.height ? `${cfg.video.height}p MP4 (HLS)` : 'HD MP4 (HLS)',
          hasVideo: true,
          hasAudio: true,
          isAudioOnly: false,
          isVideoOnly: false,
        });
        break;
      }
    }
  };

  // Strategy 1: Public /_next/viewer JWT -> signed player_embed_url
  try {
    const { data: viewer } = await safeFetchJson<any>('https://vimeo.com/_next/viewer', {
      signal,
      timeoutMs: 10_000,
    });
    if (viewer?.jwt && viewer?.apiUrl) {
      const { data: meta } = await safeFetchJson<any>(
        `https://${viewer.apiUrl}/videos/${videoId}?fields=name,link,duration,player_embed_url,pictures.sizes`,
        {
          signal,
          timeoutMs: 10_000,
          headers: { authorization: `jwt ${viewer.jwt}` },
        },
      );
      if (meta?.name) title = String(meta.name);
      if (meta?.duration) duration = Number(meta.duration);
      if (meta?.link) canonicalUrl = String(meta.link);
      const pics = meta?.pictures?.sizes;
      if (Array.isArray(pics) && pics.length > 0) {
        thumbnail = pics[pics.length - 1]?.link || thumbnail;
      }
      if (meta?.player_embed_url) {
        const { text: playerHtml } = await safeFetchText(meta.player_embed_url, {
          signal,
          timeoutMs: 12_000,
          headers: { referer: 'https://vimeo.com/' },
        });
        const cfgMatch = /window\.playerConfig\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>/.exec(playerHtml);
        if (cfgMatch?.[1]) {
          try {
            collectConfig(JSON.parse(cfgMatch[1]));
          } catch {
            // ignore JSON parse error
          }
        }
      }
    }
  } catch {
    // ignore and try direct player config
  }

  // Strategy 2: Direct player config fallback
  if (formats.length === 0) {
    try {
      const { data } = await safeFetchJson<any>(`https://player.vimeo.com/video/${videoId}/config`, {
        signal,
        timeoutMs: 12_000,
        headers: { referer: 'https://vimeo.com/' },
      });
      collectConfig(data);
    } catch {
      // ignore
    }
  }

  if (formats.length > 0) {
    return {
      canonicalUrl,
      title,
      duration,
      thumbnail,
      uploader,
      uploaderUrl,
      formats,
    };
  }
  return null;
}

/**
 * Dailymotion fallback via public /player/metadata/video/ API (bypasses web extractor issues)
 */
async function extractDailymotionFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  let idMatch = /dailymotion\.com\/(?:embed\/)?video\/([a-z0-9]+)/i.exec(url) || /dai\.ly\/([a-z0-9]+)/i.exec(url);
  if (!idMatch?.[1]) return null;
  const videoId = idMatch[1];

  try {
    const { data } = await safeFetchJson<any>(`https://www.dailymotion.com/player/metadata/video/${encodeURIComponent(videoId)}`, {
      signal,
      timeoutMs: 12_000,
    });
    const formats: FallbackFormat[] = [];
    const seen = new Set<string>();
    const qualities = data?.qualities;
    if (qualities && typeof qualities === 'object') {
      const order = ['2160', '1440', '1080', '720', '480', '380', '240', 'auto'];
      for (const q of order) {
        const list = qualities[q];
        if (!Array.isArray(list)) continue;
        for (const item of list) {
          if (!item?.url || seen.has(item.url)) continue;
          seen.add(item.url);
          const isHls = item.type?.includes('mpegURL') || /\.m3u8/i.test(item.url);
          formats.push({
            formatId: `fb:v${formats.length}`,
            ext: 'mp4',
            directUrl: String(item.url),
            isHls,
            height: q !== 'auto' ? Number(q) : undefined,
            qualityLabel: q === 'auto' ? 'HD MP4 (HLS)' : `${q}p MP4${isHls ? ' (HLS)' : ''}`,
            hasVideo: true,
            hasAudio: true,
            isAudioOnly: false,
            isVideoOnly: false,
          });
        }
      }
    }
    if (formats.length > 0) {
      return {
        canonicalUrl: data.url || `https://www.dailymotion.com/video/${videoId}`,
        title: data.title || `Dailymotion Video ${videoId}`,
        duration: data.duration ? Number(data.duration) : undefined,
        thumbnail: data.posters?.['720'] || data.posters?.['480'] || data.poster_url,
        uploader: data.owner?.screenname || data.owner?.username,
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Rumble fallback via embedJS JSON API + HTML metadata
 */
async function extractRumbleFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  let embedId = /rumble\.com\/embed\/([a-z0-9]+)/i.exec(url)?.[1];
  let fallbackTitle: string | undefined;
  let oembedMeta: any = null;

  if (!embedId) {
    try {
      const { data } = await safeFetchJson<any>(
        `https://rumble.com/api/Media/oembed.json?url=${encodeURIComponent(url)}`,
        { signal, timeoutMs: 10_000, headers: { 'user-agent': 'PerfectDownloader/1.0' } },
      );
      oembedMeta = data;
      const iframeSrc = typeof data?.html === 'string' ? data.html : '';
      embedId = /rumble\.com\/embed\/([a-z0-9]+)/i.exec(iframeSrc)?.[1];
    } catch {
      // fall through to HTML fetch
    }
  }

  if (!embedId) {
    try {
      const { text } = await safeFetchText(url, {
        signal,
        timeoutMs: 12_000,
        headers: { 'user-agent': 'PerfectDownloader/1.0' },
      });
      embedId = /"video":"([a-z0-9]+)"/i.exec(text)?.[1]
        || /rumble\.com\/embed\/([a-z0-9]+)/i.exec(text)?.[1];
      fallbackTitle = extractHtmlTitle(text);
    } catch {
      // ignore
    }
  }

  if (!embedId) return null;

  try {
    const { data } = await safeFetchJson<any>(
      `https://rumble.com/embedJS/u3/?request=video&ver=2&v=${encodeURIComponent(embedId)}`,
      {
        signal,
        timeoutMs: 12_000,
        headers: { 'user-agent': 'PerfectDownloader/1.0', referer: 'https://rumble.com/' },
      },
    );
    const formats: FallbackFormat[] = [];
    const uaObj = data?.ua?.mp4 || data?.u?.mp4 || {};
    const entries = Object.entries<any>(uaObj).sort((a, b) => Number(b[0]) - Number(a[0]));
    for (const [resKey, val] of entries) {
      const directUrl = val?.url || (typeof val === 'string' ? val : undefined);
      if (!directUrl) continue;
      formats.push({
        formatId: `fb:v${formats.length}`,
        ext: 'mp4',
        directUrl: String(directUrl),
        headers: { 'user-agent': 'PerfectDownloader/1.0', referer: 'https://rumble.com/' },
        height: Number(resKey) || undefined,
        qualityLabel: Number(resKey) ? `${resKey}p MP4` : 'MP4',
        hasVideo: true,
        hasAudio: true,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    }
    if (formats.length > 0) {
      return {
        canonicalUrl: data.l || url,
        title: data.title || oembedMeta?.title || fallbackTitle || 'Rumble Video',
        duration: data.duration ? Number(data.duration) : (oembedMeta?.duration ? Number(oembedMeta.duration) : undefined),
        thumbnail: data.i || oembedMeta?.thumbnail_url,
        uploader: data.author?.name || oembedMeta?.author_name,
        uploaderUrl: data.author?.url || oembedMeta?.author_url,
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Odysee fallback via LBRY JSON-RPC (resolve + get)
 */
async function extractOdyseeFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
    if (segments.length === 0) return null;
    const lbryUri = 'lbry://' + segments.map((s) => decodeURIComponent(s).replace(/:/g, '#')).join('/');
    const { data: resData } = await safeFetchJson<any>('https://api.na-backend.odysee.com/api/v1/proxy', {
      method: 'POST',
      signal,
      timeoutMs: 12_000,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'resolve', params: { urls: [lbryUri] }, id: 1 }),
    });
    const claim = Object.values<any>(resData?.result || {})[0];
    if (!claim || claim.error) return null;

    const { data: getData } = await safeFetchJson<any>('https://api.na-backend.odysee.com/api/v1/proxy', {
      method: 'POST',
      signal,
      timeoutMs: 12_000,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'get', params: { uri: claim.canonical_url || lbryUri }, id: 2 }),
    });
    const streamUrl = getData?.result?.streaming_url;
    if (!streamUrl) return null;

    const mime = claim.value?.source?.media_type || '';
    const isAudio = mime.startsWith('audio/');
    const ext = mime.includes('webm') ? 'webm' : isAudio ? 'mp3' : 'mp4';
    return {
      canonicalUrl: url,
      title: claim.value?.title || claim.name || 'Odysee Media',
      description: claim.value?.description,
      duration: claim.value?.video?.duration ? Number(claim.value.video.duration) : undefined,
      thumbnail: claim.value?.thumbnail?.url,
      uploader: claim.signing_channel?.value?.title || claim.signing_channel?.name,
      formats: [
        {
          formatId: `fb:${isAudio ? 'a' : 'v'}0`,
          ext,
          directUrl: String(streamUrl),
          width: claim.value?.video?.width,
          height: claim.value?.video?.height,
          filesize: claim.value?.source?.size ? Number(claim.value.source.size) : undefined,
          qualityLabel: claim.value?.video?.height ? `${claim.value.video.height}p ${ext.toUpperCase()}` : `Original ${ext.toUpperCase()}`,
          hasVideo: !isAudio,
          hasAudio: true,
          isAudioOnly: isAudio,
          isVideoOnly: false,
        },
      ],
    };
  } catch {
    return null;
  }
}

/**
 * Likee fallback via embedded JSON / OpenGraph tags
 */
async function extractLikeeFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  try {
    const { text, url: finalUrl } = await safeFetchText(url, { signal, timeoutMs: 12_000 });
    const meta = extractMetaTags(text);
    const vidMatch = /"video_url"\s*:\s*"([^"]+)"/i.exec(text)?.[1]
      || meta['og:video:secure_url']?.[0]
      || meta['og:video']?.[0];
    if (vidMatch) {
      const clean = unescapeJsonUrl(vidMatch);
      return {
        canonicalUrl: finalUrl,
        title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'Likee Video',
        thumbnail: meta['og:image']?.[0],
        formats: [
          {
            formatId: 'fb:v0',
            ext: 'mp4',
            directUrl: clean,
            qualityLabel: 'HD MP4',
            hasVideo: true,
            hasAudio: true,
            isAudioOnly: false,
            isVideoOnly: false,
          },
        ],
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Free Music Archive fallback via embedded data-track-info JSON on track pages
 */
async function extractFmaFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  if (/^https?:\/\/files\.freemusicarchive\.org\//i.test(url)) {
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'mp3';
    return {
      canonicalUrl: url,
      title: decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'FMA Track').replace(/\.[^.]+$/, ''),
      formats: [
        {
          formatId: 'fb:a0',
          ext,
          directUrl: url,
          qualityLabel: `Original ${ext.toUpperCase()}`,
          hasVideo: false,
          hasAudio: true,
          isAudioOnly: true,
          isVideoOnly: false,
        },
      ],
    };
  }
  try {
    const { text, url: finalUrl } = await safeFetchText(url, { signal, timeoutMs: 12_000 });
    const singleM = /data-track-info='([^']+)'/i.exec(text)?.[1];
    const doubleM = /data-track-info="([^"]+)"/i.exec(text)?.[1];
    const rawJson = singleM ? decodeHtmlEntities(singleM) : doubleM ? decodeHtmlEntities(doubleM) : null;
    if (rawJson) {
      const info = JSON.parse(rawJson);
      const audioUrl = info.fileUrl || info.downloadUrl;
      if (audioUrl && typeof audioUrl === 'string') {
        const cleanAudio = audioUrl.replace(/\\\//g, '/');
        const ext = cleanAudio.split('.').pop()?.split('?')[0]?.toLowerCase() || 'mp3';
        return {
          canonicalUrl: finalUrl,
          title: info.title || extractHtmlTitle(text) || 'Free Music Archive Track',
          uploader: info.artistName,
          uploaderUrl: info.artistUrl,
          thumbnail: info.albumImage || info.imageUrl,
          formats: [
            {
              formatId: 'fb:a0',
              ext,
              directUrl: cleanAudio,
              qualityLabel: `320kbps ${ext.toUpperCase()}`,
              hasVideo: false,
              hasAudio: true,
              isAudioOnly: true,
              isVideoOnly: false,
            },
          ],
        };
      }
    }
    // Fallback regex for files.freemusicarchive.org URLs inside HTML
    const mp3Match = /https?:\/\/files\.freemusicarchive\.org\/[^"'\s\\<>]+\.(?:mp3|ogg|flac|wav)/i.exec(text);
    if (mp3Match) {
      return {
        canonicalUrl: finalUrl,
        title: extractHtmlTitle(text) || 'Free Music Archive Track',
        formats: [
          {
            formatId: 'fb:a0',
            ext: 'mp3',
            directUrl: mp3Match[0],
            qualityLabel: 'MP3 Audio',
            hasVideo: false,
            hasAudio: true,
            isAudioOnly: true,
            isVideoOnly: false,
          },
        ],
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Wikimedia Commons fallback via official MediaWiki imageinfo API (supports images, audio & video)
 */
async function extractWikimediaFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  if (/^https?:\/\/upload\.wikimedia\.org\//i.test(url)) {
    const rawExt = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const isAudio = ['ogg', 'oga', 'opus', 'mp3', 'flac', 'wav'].includes(rawExt);
    const isVideo = ['webm', 'ogv', 'mp4'].includes(rawExt);
    return {
      canonicalUrl: url,
      title: decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'Wikimedia File').replace(/\.[^.]+$/, ''),
      formats: [
        {
          formatId: isVideo ? 'fb:v0' : isAudio ? 'fb:a0' : 'fb:img0',
          ext: rawExt,
          directUrl: url,
          qualityLabel: `Original ${rawExt.toUpperCase()}`,
          hasVideo: isVideo,
          hasAudio: isAudio || isVideo,
          isAudioOnly: isAudio,
          isVideoOnly: false,
        },
      ],
    };
  }

  const fileMatch = /commons\.wikimedia\.org\/wiki\/(File:[^?#]+)/i.exec(url);
  if (!fileMatch?.[1]) return null;
  const fileTitle = decodeURIComponent(fileMatch[1]).replace(/ /g, '_');

  try {
    const apiUrl =
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}` +
      '&prop=imageinfo&iiprop=url|mime|size|extmetadata&format=json';
    const { data } = await safeFetchJson<any>(apiUrl, { signal, timeoutMs: 10_000 });
    const pages = Object.values<any>(data?.query?.pages || {});
    const page = pages[0];
    const info = page?.imageinfo?.[0];
    if (!info?.url) return null;

    const directUrl = String(info.url);
    const mime = String(info.mime || '');
    const ext = directUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    const isVideo = mime.startsWith('video/');
    const isAudio = mime.startsWith('audio/');
    return {
      canonicalUrl: url,
      title: (page.title || fileTitle).replace(/^File:/i, '').replace(/\.[^.]+$/, ''),
      thumbnail: !isVideo && !isAudio ? directUrl : undefined,
      formats: [
        {
          formatId: isVideo ? 'fb:v0' : isAudio ? 'fb:a0' : 'fb:img0',
          ext,
          directUrl,
          width: info.width ? Number(info.width) : undefined,
          height: info.height ? Number(info.height) : undefined,
          filesize: info.size ? Number(info.size) : undefined,
          qualityLabel:
            info.width && info.height
              ? `${info.width}x${info.height} ${ext.toUpperCase()}`
              : `Original ${ext.toUpperCase()}`,
          hasVideo: isVideo,
          hasAudio: isAudio || isVideo,
          isAudioOnly: isAudio,
          isVideoOnly: false,
        },
      ],
    };
  } catch {
    return null;
  }
}

/**
 * PeerTube fallback via standard PeerTube REST API (/api/v1/videos/:id)
 */
async function extractPeerTubeFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  try {
    const parsed = new URL(url);
    const idMatch = /\/(?:w|videos\/watch|videos\/embed)\/([A-Za-z0-9_-]+)/i.exec(parsed.pathname);
    if (!idMatch?.[1]) return null;
    const videoId = idMatch[1];

    const { data } = await safeFetchJson<any>(`https://${parsed.hostname}/api/v1/videos/${videoId}`, {
      signal,
      timeoutMs: 12_000,
    });
    const formats: FallbackFormat[] = [];
    const seen = new Set<string>();
    const rawFiles: any[] = [
      ...(Array.isArray(data?.files) ? data.files : []),
      ...(Array.isArray(data?.streamingPlaylists) ? data.streamingPlaylists.flatMap((p: any) => p.files || []) : []),
    ];
    rawFiles
      .filter((f) => f?.fileDownloadUrl || f?.fileUrl)
      .sort((a, b) => (b.resolution?.id || 0) - (a.resolution?.id || 0))
      .forEach((f) => {
        const directUrl = String(f.fileDownloadUrl || f.fileUrl);
        if (seen.has(directUrl)) return;
        seen.add(directUrl);
        const h = Number(f.resolution?.id) || undefined;
        formats.push({
          formatId: `fb:v${formats.length}`,
          ext: 'mp4',
          directUrl,
          height: h,
          filesize: f.size ? Number(f.size) : undefined,
          qualityLabel: f.resolution?.label || (h ? `${h}p MP4` : 'MP4'),
          hasVideo: true,
          hasAudio: true,
          isAudioOnly: false,
          isVideoOnly: false,
        });
      });

    if (formats.length > 0) {
      const thumb = data.previewPath || data.thumbnailPath;
      return {
        canonicalUrl: data.url || url,
        title: data.name || 'PeerTube Video',
        description: data.description,
        duration: data.duration ? Number(data.duration) : undefined,
        thumbnail: thumb ? (thumb.startsWith('http') ? thumb : `https://${parsed.hostname}${thumb}`) : undefined,
        uploader: data.channel?.displayName || data.account?.displayName,
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Flickr fallback via page HTML / OpenGraph / staticflickr image URLs (supports both photos and videos)
 */
async function extractFlickrFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const flickrDlHeaders = { referer: 'https://www.flickr.com/', 'user-agent': 'PerfectDownloader/1.0' };
  if (/^https?:\/\/live\.staticflickr\.com\//i.test(url)) {
    const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
    return {
      canonicalUrl: url,
      title: 'Flickr Photo',
      thumbnail: url,
      formats: [
        {
          formatId: 'fb:img0',
          ext,
          directUrl: url,
          headers: flickrDlHeaders,
          qualityLabel: `Original ${ext.toUpperCase()}`,
          hasVideo: false,
          hasAudio: false,
          isAudioOnly: false,
          isVideoOnly: false,
        },
      ],
    };
  }

  try {
    const { text, url: finalUrl } = await safeFetchText(url, { signal, timeoutMs: 12_000 });
    const meta = extractMetaTags(text);
    const formats: FallbackFormat[] = [];
    const seen = new Set<string>();

    const pushImg = (raw: string | undefined, label: string) => {
      if (!raw) return;
      const clean = unescapeJsonUrl(raw).replace(/^\/\//, 'https://');
      if (!/^https?:\/\//i.test(clean) || seen.has(clean)) return;
      seen.add(clean);
      const ext = clean.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      formats.push({
        formatId: `fb:img${formats.length}`,
        ext: ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? (ext === 'jpeg' ? 'jpg' : ext) : 'jpg',
        directUrl: clean,
        headers: flickrDlHeaders,
        qualityLabel: label,
        hasVideo: false,
        hasAudio: false,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    };

    const videoUrl = meta['og:video:secure_url']?.[0] || meta['og:video']?.[0];
    if (videoUrl && /\.mp4/i.test(videoUrl)) {
      formats.push({
        formatId: 'fb:v0',
        ext: 'mp4',
        directUrl: unescapeJsonUrl(videoUrl),
        headers: flickrDlHeaders,
        qualityLabel: 'HD MP4',
        hasVideo: true,
        hasAudio: true,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    }

    // Look for largest staticflickr sizes (_k, _h, _b, _c) in embedded JSON or meta tags
    const staticMatches = text.match(/(?:https?:)?\/\/live\.staticflickr\.com\/\d+\/\d+_[a-z0-9]+_[khbczomn]\.(?:jpg|png)/gi) || [];
    const rankScore = (u: string) => {
      if (/_o\./i.test(u)) return 6;
      if (/_k\./i.test(u)) return 5;
      if (/_h\./i.test(u)) return 4;
      if (/_b\./i.test(u)) return 3;
      if (/_c\./i.test(u)) return 2;
      return 1;
    };
    const sortedImgs = [...new Set(staticMatches.map((u) => (u.startsWith('//') ? `https:${u}` : u)))].sort(
      (a, b) => rankScore(b) - rankScore(a),
    );
    if (sortedImgs[0]) {
      pushImg(sortedImgs[0], 'High-Res JPG');
    }
    pushImg(meta['og:image']?.[0], 'JPG Photo');

    if (formats.length > 0) {
      const cleanTitle = (meta['og:title']?.[0]?.trim() || extractHtmlTitle(text)?.trim() || 'Flickr Photo').replace(/\s*\|\s*Flickr$/i, '').trim() || 'Flickr Photo';
      return {
        canonicalUrl: finalUrl,
        title: cleanTitle,
        thumbnail: formats.find((f) => f.formatId.startsWith('fb:img'))?.directUrl,
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Imgur fallback supporting direct i.imgur.com files, .gifv -> .mp4, single posts, and albums
 */
async function extractImgurFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const directM = /^https?:\/\/i\.imgur\.com\/([A-Za-z0-9]+)\.([a-z0-9]+)/i.exec(url);
  if (directM) {
    const extRaw = directM[2].toLowerCase();
    const isGifv = extRaw === 'gifv';
    const ext = isGifv ? 'mp4' : extRaw === 'jpeg' ? 'jpg' : extRaw;
    const finalUrl = isGifv ? `https://i.imgur.com/${directM[1]}.mp4` : url;
    const isVideo = ['mp4', 'webm'].includes(ext);
    return {
      canonicalUrl: url,
      title: `Imgur ${directM[1]}`,
      formats: [
        {
          formatId: isVideo ? 'fb:v0' : 'fb:img0',
          ext,
          directUrl: finalUrl,
          qualityLabel: isVideo ? 'HD MP4' : `Original ${ext.toUpperCase()}`,
          hasVideo: isVideo,
          hasAudio: isVideo,
          isAudioOnly: false,
          isVideoOnly: false,
        },
      ],
    };
  }

  const albumM = /imgur\.com\/(?:a|gallery)\/(?:[^/]+-)?([A-Za-z0-9]+)/i.exec(url);
  const singleM = /imgur\.com\/(?:[^/]+-)?([A-Za-z0-9]+)/i.exec(url);
  const itemId = albumM?.[1] || singleM?.[1];
  const isAlbum = Boolean(albumM);

  const clientIds = ['546c25a59c58ad7'];
  if (itemId) {
    for (const cid of clientIds) {
      try {
        const endpoint = isAlbum
          ? `https://api.imgur.com/post/v1/albums/${itemId}?client_id=${cid}&include=media`
          : `https://api.imgur.com/post/v1/posts/${itemId}?client_id=${cid}&include=media`;
        const { data } = await safeFetchJson<any>(endpoint, { signal, timeoutMs: 10_000 });
        const mediaList: any[] = Array.isArray(data?.media) ? data.media : [];
        const formats: FallbackFormat[] = [];
        for (const m of mediaList) {
          const mediaUrl = m?.url;
          if (!mediaUrl || typeof mediaUrl !== 'string') continue;
          const mime = String(m.mime_type || '');
          const ext = (m.ext || mediaUrl.split('.').pop()?.split('?')[0] || 'jpg').toLowerCase();
          const isVideo = mime.startsWith('video/') || ['mp4', 'webm'].includes(ext);
          formats.push({
            formatId: `fb:${isVideo ? 'v' : 'img'}${formats.length}`,
            ext: ext === 'jpeg' ? 'jpg' : ext,
            directUrl: mediaUrl,
            width: m.width ? Number(m.width) : undefined,
            height: m.height ? Number(m.height) : undefined,
            filesize: m.size ? Number(m.size) : undefined,
            qualityLabel: isVideo
              ? `${m.height || 'HD'}p ${ext.toUpperCase()}`
              : `${m.width || '?'}x${m.height || '?'} ${ext.toUpperCase()}`,
            hasVideo: isVideo,
            hasAudio: isVideo && Boolean(m.has_sound),
            isAudioOnly: false,
            isVideoOnly: false,
          });
        }
        if (formats.length > 0) {
          return {
            canonicalUrl: data?.url || url,
            title: data?.title || `Imgur ${itemId}`,
            uploader: data?.account?.username,
            thumbnail: formats.find((f) => !f.hasVideo)?.directUrl || data?.cover?.url,
            formats,
          };
        }
      } catch {
        // fallback below
      }
    }
  }

  // OpenGraph HTML fallback
  try {
    const { text, url: finalUrl } = await safeFetchText(url, { signal, timeoutMs: 12_000 });
    const meta = extractMetaTags(text);
    const formats: FallbackFormat[] = [];
    const vid = meta['og:video:secure_url']?.[0] || meta['og:video']?.[0];
    if (vid) {
      formats.push({
        formatId: 'fb:v0',
        ext: 'mp4',
        directUrl: unescapeJsonUrl(vid),
        qualityLabel: 'HD MP4',
        hasVideo: true,
        hasAudio: true,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    }
    const img = meta['og:image']?.[0];
    if (img) {
      const ext = img.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      formats.push({
        formatId: `fb:img${formats.length}`,
        ext: ['jpg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg',
        directUrl: unescapeJsonUrl(img),
        qualityLabel: 'Image',
        hasVideo: false,
        hasAudio: false,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    }
    if (formats.length > 0) {
      return {
        canonicalUrl: finalUrl,
        title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'Imgur Post',
        thumbnail: img,
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Telegram fallback for public channel posts (?embed=1&mode=tme -> <video src> & photo wrap)
 */
async function extractTelegramFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const m = /(?:t\.me|telegram\.me|telegram\.dog)\/(?:s\/)?([^/?#]+)\/(\d+)/i.exec(url);
  if (!m) return null;
  const [, channel, msgId] = m;
  const embedUrl = `https://t.me/${channel}/${msgId}?embed=1&mode=tme`;

  try {
    const { text } = await safeFetchText(embedUrl, { signal, timeoutMs: 12_000 });
    const formats: FallbackFormat[] = [];
    const seen = new Set<string>();

    const videoMatches = [...text.matchAll(/<video[^>]+src="([^"]+)"/gi)];
    for (const vm of videoMatches) {
      const clean = decodeHtmlEntities(vm[1]);
      if (!/^https?:\/\//i.test(clean) || seen.has(clean)) continue;
      seen.add(clean);
      formats.push({
        formatId: `fb:v${formats.length}`,
        ext: 'mp4',
        directUrl: clean,
        qualityLabel: 'HD MP4',
        hasVideo: true,
        hasAudio: true,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    }

    const photoMatches = [
      ...text.matchAll(/class="[^"]*tgme_widget_message_photo_wrap[^"]*"[^>]+style="[^"]*url\('([^']+)'\)/gi),
    ];
    for (const pm of photoMatches) {
      const clean = decodeHtmlEntities(pm[1]);
      if (!/^https?:\/\//i.test(clean) || seen.has(clean)) continue;
      seen.add(clean);
      const ext = clean.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
      formats.push({
        formatId: `fb:img${formats.length}`,
        ext: ['jpg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg',
        directUrl: clean,
        qualityLabel: 'Telegram Photo',
        hasVideo: false,
        hasAudio: false,
        isAudioOnly: false,
        isVideoOnly: false,
      });
    }

    if (formats.length > 0) {
      const authorM = /class="tgme_widget_message_author_name"[^>]*>([^<]+)</i.exec(text)?.[1];
      const msgM = /class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i.exec(text)?.[1];
      const cleanMsg = msgM ? decodeHtmlEntities(msgM.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim() : '';
      return {
        canonicalUrl: `https://t.me/${channel}/${msgId}`,
        title: (cleanMsg ? cleanMsg.slice(0, 80) : '') || `${channel} post #${msgId}`,
        uploader: authorM ? decodeHtmlEntities(authorM).trim() : channel,
        thumbnail: formats.find((f) => f.formatId.startsWith('fb:img'))?.directUrl,
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Bandcamp fallback via non-browser UA + embedded data-tralbum JSON (bypasses browser JS challenge)
 */
async function extractBandcampFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  try {
    const { text, url: finalUrl } = await safeFetchText(url, {
      signal,
      timeoutMs: 12_000,
      headers: { 'user-agent': 'PerfectDownloader/1.0' },
    });
    const rawAttr = /data-tralbum="([^"]+)"/i.exec(text)?.[1];
    if (!rawAttr) return null;

    const tralbum = JSON.parse(decodeHtmlEntities(rawAttr));
    const tracks: any[] = Array.isArray(tralbum?.trackinfo) ? tralbum.trackinfo : [];
    const formats: FallbackFormat[] = [];
    for (const track of tracks) {
      const fileObj = track?.file;
      if (!fileObj || typeof fileObj !== 'object') continue;
      for (const [codecKey, streamUrl] of Object.entries<any>(fileObj)) {
        if (typeof streamUrl !== 'string' || !/^https?:\/\//i.test(streamUrl)) continue;
        const ext = codecKey.split('-')[0] || 'mp3';
        formats.push({
          formatId: `fb:a${formats.length}`,
          ext,
          directUrl: streamUrl,
          qualityLabel: tracks.length > 1 && track.title
            ? `${track.title} (${codecKey})`
            : `${codecKey.toUpperCase()} Audio`,
          hasVideo: false,
          hasAudio: true,
          isAudioOnly: true,
          isVideoOnly: false,
        });
      }
    }

    if (formats.length > 0) {
      const meta = extractMetaTags(text);
      return {
        canonicalUrl: tralbum.url || finalUrl,
        title: tralbum.current?.title || meta['og:title']?.[0] || extractHtmlTitle(text) || 'Bandcamp Track',
        uploader: tralbum.artist,
        duration: tracks[0]?.duration ? Math.round(Number(tracks[0].duration)) : undefined,
        thumbnail: meta['og:image']?.[0],
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Threads (threads.net / threads.com) public post fallback extractor
 */
async function extractThreadsFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  const userAgents = [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'facebookexternalhit/1.1',
  ];
  for (const ua of userAgents) {
    try {
      const { text, url: finalUrl } = await safeFetchText(url, {
        signal,
        timeoutMs: 15_000,
        headers: { 'user-agent': ua },
      });
      const formats: FallbackFormat[] = [];
      const seen = new Set<string>();
      const pushFmt = (rawUrl: string, kind: 'video' | 'image', label: string, ext: string) => {
        const clean = unescapeJsonUrl(rawUrl);
        if (!clean.startsWith('http') || seen.has(clean)) return;
        seen.add(clean);
        formats.push({
          formatId: `fb:${kind === 'video' ? 'v' : 'img'}${formats.length}`,
          ext,
          directUrl: clean,
          qualityLabel: label,
          hasVideo: kind === 'video',
          hasAudio: kind === 'video',
          isAudioOnly: false,
          isVideoOnly: false,
        });
      };

      const meta = extractMetaTags(text);
      for (const v of [...(meta['og:video:secure_url'] || []), ...(meta['og:video'] || [])]) {
        pushFmt(v, 'video', 'HD MP4', 'mp4');
      }

      const vidRe = /"video_versions"\s*:\s*\[([^\]]+)\]/g;
      let m: RegExpExecArray | null;
      while ((m = vidRe.exec(text)) !== null) {
        const block = m[1] || '';
        const urlM = /"url"\s*:\s*"([^"]+)"/.exec(block);
        if (urlM?.[1]) pushFmt(urlM[1], 'video', 'HD MP4', 'mp4');
      }

      const candRe = /"candidates"\s*:\s*\[([^\]]+)\]/g;
      while ((m = candRe.exec(text)) !== null) {
        const block = m[1] || '';
        const urlM = /"url"\s*:\s*"([^"]+)"/.exec(block);
        if (urlM?.[1] && !/150x150|s150x150/i.test(urlM[1])) {
          pushFmt(urlM[1], 'image', 'Original Image', 'jpg');
        }
      }

      if (formats.length === 0) {
        for (const img of [...(meta['og:image:secure_url'] || []), ...(meta['og:image'] || [])]) {
          if (!/static\.cdninstagram|rsrc\.php/i.test(img)) {
            pushFmt(img, 'image', 'Original Image', 'jpg');
          }
        }
      }

      if (formats.length > 0) {
        return {
          canonicalUrl: finalUrl,
          title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'Threads Post',
          description: meta['og:description']?.[0],
          thumbnail: meta['og:image']?.[0],
          formats,
        };
      }
    } catch {
      // try next UA
    }
  }
  return null;
}

/**
 * Universal fallback extractor for direct media files (.mp4, .mp3, .jpg, .m3u8) and any HTML page
 * exposing OpenGraph, JSON-LD VideoObject/AudioObject/ImageObject, or HTML5 <video>/<audio> tags.
 */
export async function extractGenericFallback(url: string, signal?: AbortSignal): Promise<FallbackExtractResult | null> {
  // 1. Direct media / CDN file check via HEAD / 1-byte probe
  try {
    const probe = await safeProbeUrl(url, { signal, timeoutMs: 12_000 });
    const ct = probe.contentType || '';
    const finalUrl = probe.finalUrl || url;
    const isMediaCt =
      ct.startsWith('video/') ||
      ct.startsWith('audio/') ||
      ct.startsWith('image/') ||
      ct === 'application/vnd.apple.mpegurl' ||
      ct === 'application/x-mpegurl';
    if (probe.status >= 200 && probe.status < 400 && isMediaCt) {
      const extFromCt =
        ct === 'image/jpeg' ? 'jpg' :
        ct === 'image/png' ? 'png' :
        ct === 'image/webp' ? 'webp' :
        ct === 'image/gif' ? 'gif' :
        ct === 'audio/mpeg' ? 'mp3' :
        ct === 'audio/mp4' ? 'm4a' :
        ct === 'audio/ogg' ? 'ogg' :
        ct === 'audio/wav' ? 'wav' :
        ct === 'video/webm' ? 'webm' :
        ct.includes('mpegurl') ? 'mp4' :
        'mp4';
      const isVideo = ct.startsWith('video/') || ct.includes('mpegurl');
      const isAudio = ct.startsWith('audio/');
      const isHls = ct.includes('mpegurl') || /\.m3u8(?:$|\?)/i.test(finalUrl);
      const urlName = decodeURIComponent(new URL(finalUrl).pathname.split('/').pop() || 'Media File').replace(/\.[^.]+$/, '');
      return {
        canonicalUrl: finalUrl,
        title: urlName || 'Direct Media File',
        formats: [
          {
            formatId: 'fb:direct0',
            ext: extFromCt,
            directUrl: finalUrl,
            isHls,
            filesize: probe.contentLength,
            qualityLabel: isAudio ? `Original ${extFromCt.toUpperCase()}` : isVideo ? `Original ${extFromCt.toUpperCase()}` : `Original ${extFromCt.toUpperCase()}`,
            hasVideo: isVideo,
            hasAudio: isVideo || isAudio,
            isAudioOnly: isAudio,
            isVideoOnly: false,
          },
        ],
      };
    }
  } catch {
    // proceed to HTML parse
  }

  // 2. HTML page scrape (OpenGraph + JSON-LD + <video>/<audio>/<source> + embedded .mp4/.m3u8 links)
  try {
    const { status, text, url: finalUrl, contentType } = await safeFetchText(url, { signal, timeoutMs: 15_000 });
    if (status >= 400 || !contentType.toLowerCase().includes('html')) return null;

    const formats: FallbackFormat[] = [];
    const seen = new Set<string>();
    const addFmt = (rawSrc: string, kind: 'video' | 'audio' | 'image', label: string, extOverride?: string) => {
      let abs = decodeHtmlEntities(rawSrc.trim());
      if (!abs) return;
      try {
        abs = new URL(abs, finalUrl).toString();
      } catch {
        return;
      }
      if (!/^https?:\/\//i.test(abs) || seen.has(abs)) return;
      seen.add(abs);
      const isHls = /\.m3u8(?:$|\?)/i.test(abs);
      const extMatch = /\.([a-z0-9]{2,5})(?:$|\?|#)/i.exec(abs);
      const guessedExt = extOverride || (isHls ? 'mp4' : (extMatch?.[1]?.toLowerCase() === 'jpeg' ? 'jpg' : extMatch?.[1]?.toLowerCase()) || (kind === 'audio' ? 'mp3' : kind === 'image' ? 'jpg' : 'mp4'));
      formats.push({
        formatId: `fb:${kind === 'video' ? 'v' : kind === 'audio' ? 'a' : 'img'}${formats.length}`,
        ext: guessedExt,
        directUrl: abs,
        headers: { referer: finalUrl },
        isHls,
        qualityLabel: label,
        hasVideo: kind === 'video',
        hasAudio: kind === 'video' || kind === 'audio',
        isAudioOnly: kind === 'audio',
        isVideoOnly: false,
      });
    };

    const meta = extractMetaTags(text);
    for (const v of [
      ...(meta['og:video:secure_url'] || []),
      ...(meta['og:video:url'] || []),
      ...(meta['og:video'] || []),
      ...(meta['twitter:player:stream'] || []),
    ]) {
      if (/\.(?:mp4|webm|m3u8|mov)(?:$|\?)/i.test(v) || /video/i.test(meta['og:video:type']?.[0] || '')) {
        addFmt(v, 'video', 'HD MP4');
      }
    }

    for (const a of [...(meta['og:audio:secure_url'] || []), ...(meta['og:audio'] || [])]) {
      addFmt(a, 'audio', 'Original Audio');
    }

    const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let ldM: RegExpExecArray | null;
    while ((ldM = ldRe.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(ldM[1] || '{}');
        const nodes = Array.isArray(parsed) ? parsed : [parsed];
        for (const n of nodes) {
          const t = String(n?.['@type'] || '').toLowerCase();
          if (typeof n?.contentUrl === 'string') {
            addFmt(n.contentUrl, t.includes('audio') ? 'audio' : t.includes('image') ? 'image' : 'video', t.includes('audio') ? 'Audio' : t.includes('image') ? 'Image' : 'HD Video');
          }
        }
      } catch {
        // ignore invalid JSON-LD
      }
    }

    const tagMediaRe = /<(?:video|source|audio)[^>]+src=["']([^"']+)["']/gi;
    let tm: RegExpExecArray | null;
    while ((tm = tagMediaRe.exec(text)) !== null) {
      if (tm[1]) {
        const isAud = /\.(?:mp3|m4a|ogg|wav|opus)(?:$|\?)/i.test(tm[1]);
        addFmt(tm[1], isAud ? 'audio' : 'video', isAud ? 'Audio Stream' : 'Video Stream');
      }
    }

    if (formats.length === 0) {
      const jsonVideoRe = /"(?:contentUrl|videoUrl|video_url|mp4Url|playbackUrl|playAddr|src)"\s*:\s*"(https?:\\?\/\\?\/[^"]+\.(?:mp4|m3u8)[^"]*)"/gi;
      let jm: RegExpExecArray | null;
      while ((jm = jsonVideoRe.exec(text)) !== null) {
        if (jm[1]) addFmt(unescapeJsonUrl(jm[1]), 'video', 'HD MP4');
      }
    }

    if (formats.length === 0) {
      for (const img of [...(meta['og:image:secure_url'] || []), ...(meta['og:image'] || []), ...(meta['twitter:image'] || [])]) {
        if (!/logo|favicon|icon|avatar/i.test(img)) {
          addFmt(img, 'image', 'Original Image');
        }
      }
    }

    if (formats.length > 0) {
      return {
        canonicalUrl: finalUrl,
        title: meta['og:title']?.[0] || extractHtmlTitle(text) || 'Media File',
        description: meta['og:description']?.[0],
        thumbnail: meta['og:image']?.[0],
        formats,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

const FALLBACK_ADAPTERS: Record<string, FallbackAdapter> = {
  tiktok: extractTikTokFallback,
  instagram: extractInstagramFallback,
  facebook: extractFacebookFallback,
  x: extractTwitterFallback,
  reddit: extractRedditFallback,
  pinterest: extractPinterestFallback,
  bluesky: extractBlueskyFallback,
  tumblr: extractTumblrFallback,
  linkedin: extractLinkedInFallback,
  snapchat: extractSnapchatFallback,
  vk: extractVkFallback,
  weibo: extractWeiboFallback,
  threads: extractThreadsFallback,
  vimeo: extractVimeoFallback,
  dailymotion: extractDailymotionFallback,
  rumble: extractRumbleFallback,
  odysee: extractOdyseeFallback,
  likee: extractLikeeFallback,
  freemusicarchive: extractFmaFallback,
  wikimedia: extractWikimediaFallback,
  peertube: extractPeerTubeFallback,
  flickr: extractFlickrFallback,
  imgur: extractImgurFallback,
  telegram: extractTelegramFallback,
  bandcamp: extractBandcampFallback,
  giphy: extractGenericFallback,
  tenor: extractGenericFallback,
  triller: extractGenericFallback,
  '500px': extractGenericFallback,
  deviantart: extractGenericFallback,
  generic: extractGenericFallback,
};

const FALLBACK_CACHE = new Map<string, { expiresAt: number; result: FallbackExtractResult }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export function hasFallbackAdapter(platformId: string): boolean {
  return Boolean(FALLBACK_ADAPTERS[platformId]);
}

export async function extractWithFallback(
  platformId: string,
  url: string,
  signal?: AbortSignal,
): Promise<FallbackExtractResult | null> {
  const adapter = FALLBACK_ADAPTERS[platformId];
  if (!adapter) return null;

  const cacheKey = `${platformId}:${url}`;
  const cached = FALLBACK_CACHE.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result;
  }

  const res = await adapter(url, signal);
  if (res && res.formats.length > 0) {
    if (FALLBACK_CACHE.size > 200) {
      const oldestKey = FALLBACK_CACHE.keys().next().value;
      if (oldestKey) FALLBACK_CACHE.delete(oldestKey);
    }
    FALLBACK_CACHE.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, result: res });
  }
  return res;
}
