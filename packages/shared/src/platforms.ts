/**
 * Centralized platform capability registry.
 *
 * IMPORTANT – honesty rules:
 *  - `baseStatus` describes what the adapter can technically do *when the platform is enabled*.
 *  - `policy: 'restricted'` platforms have Terms of Service that limit downloading outside official
 *    features. They are implemented technically but stay DISABLED (effective status `restricted`)
 *    until the operator explicitly opts in via `ENABLED_RESTRICTED_PLATFORMS` after legal review.
 *    Even then, users must confirm they own the content or have permission.
 *  - `lastVerified` is the date a human/agent actually ran the adapter against a real URL.
 *    `null` means "never verified" and the UI must say so.
 */

export type PlatformStatus =
  | 'available'
  | 'limited'
  | 'auth_required'
  | 'restricted'
  | 'unavailable'
  | 'planned';

export type PlatformCategory = 'archive' | 'social' | 'video' | 'messaging' | 'music' | 'image';
export type PlatformMediaType = 'video' | 'audio' | 'image' | 'subtitles' | 'thumbnail';
export type PlatformOperation =
  | 'inspect'
  | 'download_video'
  | 'download_audio'
  | 'download_subtitles'
  | 'download_thumbnail';
export type PlatformPolicy = 'open' | 'restricted' | 'not_applicable';
export type PlatformAuth = 'none' | 'sometimes' | 'required';
export type AdapterId = 'ytdlp' | 'none';

export interface PlatformDefinition {
  id: string;
  name: string;
  category: PlatformCategory;
  /** Registrable domains. Sub-domains match automatically (m.youtube.com matches youtube.com). */
  domains: string[];
  adapter: AdapterId;
  /** yt-dlp extractor names passed to --use-extractors so the generic extractor is never used. */
  extractors: string[];
  mediaTypes: PlatformMediaType[];
  operations: PlatformOperation[];
  auth: PlatformAuth;
  policy: PlatformPolicy;
  /** Technical status when enabled. */
  baseStatus: PlatformStatus;
  /** Short, user-facing limitations. */
  limitations: string[];
  /** Short note about the platform's terms, shown to operators and users. */
  termsNote: string;
  /** ISO date of the last real end-to-end verification, or null if never verified. */
  lastVerified: string | null;
  /** Openly licensed URL used by the automated health check (only for `open` platforms). */
  healthCheckUrl?: string;
  /** Accent colour for the UI chip. */
  color: string;
}

const VIDEO_OPS: PlatformOperation[] = [
  'inspect',
  'download_video',
  'download_audio',
  'download_subtitles',
  'download_thumbnail',
];
const AUDIO_OPS: PlatformOperation[] = ['inspect', 'download_audio', 'download_thumbnail'];

const RESTRICTED_TERMS =
  'The platform terms generally prohibit downloading outside official features. Disabled until the operator completes a legal review; users must own the content or have permission.';

export const PLATFORMS: PlatformDefinition[] = [
  // ── Openly licensed archives (enabled by default) ────────────────────────────────
  {
    id: 'archive',
    name: 'Internet Archive',
    category: 'archive',
    domains: ['archive.org'],
    adapter: 'ytdlp',
    extractors: ['archive.org'],
    mediaTypes: ['video', 'audio', 'thumbnail'],
    operations: ['inspect', 'download_video', 'download_audio', 'download_thumbnail'],
    auth: 'none',
    policy: 'open',
    baseStatus: 'available',
    limitations: [
      'Collections with many files expose the first media item only.',
      'Codec details are often missing, so files are offered as published.',
    ],
    termsNote:
      'Many items are public domain or Creative Commons. Check the licence shown on the item page before reusing.',
    lastVerified: '2026-11-12',
    healthCheckUrl: 'https://archive.org/details/BigBuckBunny_124',
    color: '#9ca3af',
  },
  {
    id: 'wikimedia',
    name: 'Wikimedia Commons',
    category: 'archive',
    domains: ['commons.wikimedia.org'],
    adapter: 'ytdlp',
    extractors: ['wikimedia.org'],
    mediaTypes: ['video', 'audio', 'subtitles', 'thumbnail'],
    operations: VIDEO_OPS,
    auth: 'none',
    policy: 'open',
    baseStatus: 'available',
    limitations: ['Only individual File: pages are supported, not categories.'],
    termsNote: 'Files are freely licensed. Attribution requirements on the file page still apply.',
    lastVerified: '2026-11-12',
    healthCheckUrl: 'https://commons.wikimedia.org/wiki/File:Big_Buck_Bunny_4K.webm',
    color: '#3b82f6',
  },
  {
    id: 'peertube',
    name: 'PeerTube',
    category: 'video',
    domains: ['video.blender.org', 'framatube.org', 'tilvids.com', 'peertube.tv'],
    adapter: 'ytdlp',
    extractors: ['PeerTube'],
    mediaTypes: ['video', 'audio', 'subtitles', 'thumbnail'],
    operations: VIDEO_OPS,
    auth: 'none',
    policy: 'open',
    baseStatus: 'limited',
    limitations: [
      'Only an allow-listed set of PeerTube instances is supported.',
      'Instances and creators can disable downloads for a video.',
    ],
    termsNote: 'Each instance sets its own rules; many videos are Creative Commons licensed.',
    lastVerified: null,
    color: '#f97316',
  },

  // ── Social networks (restricted: operator opt-in) ────────────────────────────────
  ytdlpRestricted('youtube', 'YouTube', 'video', ['youtube.com', 'youtu.be', 'youtube-nocookie.com'], ['youtube', 'youtube:clip'], {
    limitations: [
      'Requires a JavaScript runtime on the server for signature handling.',
      'Age-restricted, private and members-only videos are not supported.',
      'Live streams are not supported.',
    ],
    color: '#ef4444',
  }),
  ytdlpRestricted('tiktok', 'TikTok', 'social', ['tiktok.com'], ['TikTok', 'vm.tiktok'], {
    limitations: ['Private videos and photo slideshows are not supported.', 'Delivered files may contain the platform watermark.'],
    color: '#14b8a6',
  }),
  ytdlpRestricted('instagram', 'Instagram', 'social', ['instagram.com'], ['Instagram'], {
    auth: 'sometimes',
    limitations: ['Many posts require a logged-in session, which this service never uses.', 'Stories and private accounts are not supported.'],
    color: '#ec4899',
  }),
  ytdlpRestricted('facebook', 'Facebook', 'social', ['facebook.com', 'fb.watch'], ['facebook', 'facebook:reel'], {
    auth: 'sometimes',
    limitations: ['Only public videos and reels. Private groups and profiles are not supported.'],
    color: '#2563eb',
  }),
  ytdlpRestricted('x', 'X (Twitter)', 'social', ['x.com', 'twitter.com'], ['twitter'], {
    auth: 'sometimes',
    limitations: ['Some posts require login and cannot be inspected.', 'Spaces and broadcasts are not supported.'],
    color: '#e5e7eb',
  }),
  ytdlpRestricted('reddit', 'Reddit', 'social', ['reddit.com', 'redd.it'], ['Reddit'], {
    limitations: ['Only hosted videos (v.redd.it). Image galleries are planned.'],
    color: '#f97316',
  }),
  ytdlpRestricted('pinterest', 'Pinterest', 'social', ['pinterest.com', 'pin.it'], ['Pinterest'], {
    limitations: ['Video pins only. Image pins are planned.'],
    color: '#dc2626',
  }),
  ytdlpRestricted('bluesky', 'Bluesky', 'social', ['bsky.app'], ['Bluesky'], {
    limitations: ['Video posts only.'],
    color: '#0ea5e9',
  }),
  ytdlpRestricted('tumblr', 'Tumblr', 'social', ['tumblr.com'], ['Tumblr'], {
    limitations: ['Video posts only.'],
    color: '#6366f1',
  }),
  ytdlpRestricted('linkedin', 'LinkedIn', 'social', ['linkedin.com'], ['LinkedIn'], {
    baseStatus: 'limited',
    auth: 'sometimes',
    limitations: ['Only public video posts. Most content requires login.'],
    color: '#0a66c2',
  }),
  ytdlpRestricted('vk', 'VK', 'social', ['vk.com', 'vkvideo.ru'], ['vk', 'vk:wallpost'], {
    baseStatus: 'limited',
    limitations: ['Availability varies by region.'],
    color: '#2787f5',
  }),
  ytdlpRestricted('weibo', 'Weibo', 'social', ['weibo.com', 'weibo.cn'], ['Weibo', 'WeiboVideo'], {
    baseStatus: 'limited',
    limitations: ['Availability varies by region.'],
    color: '#e6162d',
  }),
  ytdlpRestricted('snapchat', 'Snapchat', 'social', ['snapchat.com'], ['SnapchatSpotlight'], {
    baseStatus: 'limited',
    limitations: ['Public Spotlight videos only. Stories and chats are private and unsupported.'],
    color: '#facc15',
  }),
  planned('threads', 'Threads', 'social', ['threads.net', 'threads.com'], 'No maintained open-source extractor is available yet.', '#a3a3a3'),

  // ── Video & streaming ────────────────────────────────────────────────────────────
  ytdlpRestricted('vimeo', 'Vimeo', 'video', ['vimeo.com'], ['vimeo'], {
    limitations: ['Private, password-protected and on-demand videos are not supported.'],
    termsNote: 'Vimeo permits downloads only where the creator enabled them.',
    color: '#1ab7ea',
  }),
  ytdlpRestricted('dailymotion', 'Dailymotion', 'video', ['dailymotion.com', 'dai.ly'], ['dailymotion'], {
    color: '#0066dc',
  }),
  ytdlpRestricted('twitch', 'Twitch', 'video', ['twitch.tv'], ['twitch:clips', 'twitch:vod'], {
    limitations: ['Clips and past broadcasts only. Live streams are not supported.'],
    color: '#9146ff',
  }),
  ytdlpRestricted('rumble', 'Rumble', 'video', ['rumble.com'], ['Rumble', 'RumbleEmbed'], { color: '#85c742' }),
  ytdlpRestricted('bilibili', 'Bilibili', 'video', ['bilibili.com', 'b23.tv'], ['BiliBili'], {
    baseStatus: 'limited',
    limitations: ['Higher qualities require a logged-in session and are not offered.'],
    color: '#00a1d6',
  }),
  ytdlpRestricted('odysee', 'Odysee', 'video', ['odysee.com'], ['lbry'], { color: '#e50054' }),
  ytdlpRestricted('likee', 'Likee', 'video', ['likee.video'], ['likee'], { baseStatus: 'limited', color: '#ff4f81' }),
  ytdlpRestricted('streamable', 'Streamable', 'video', ['streamable.com'], ['Streamable'], { color: '#0f90fa' }),
  planned('triller', 'Triller', 'video', ['triller.co'], 'Adapter not yet verified.', '#ff0050'),
  planned('kuaishou', 'Kuaishou', 'video', ['kuaishou.com'], 'No maintained open-source extractor is available yet.', '#ff5000'),
  unavailable('dtube', 'DTube', 'video', ['d.tube'], 'The service is no longer operational.', '#ef4444'),

  // ── Messaging (private by design) ───────────────────────────────────────────────
  ytdlpRestricted('telegram', 'Telegram', 'messaging', ['t.me'], ['telegram:embed'], {
    baseStatus: 'limited',
    mediaTypes: ['video', 'thumbnail'],
    operations: ['inspect', 'download_video', 'download_thumbnail'],
    limitations: ['Public channel posts only. Private chats are never accessible.'],
    color: '#229ed9',
  }),
  unavailable('discord', 'Discord', 'messaging', ['discord.com', 'discord.gg'], 'Messages are private; there are no public media pages to download from.', '#5865f2'),
  unavailable('whatsapp', 'WhatsApp', 'messaging', ['whatsapp.com', 'wa.me'], 'End-to-end encrypted. Save media from the WhatsApp app instead.', '#25d366'),
  unavailable('line', 'LINE', 'messaging', ['line.me'], 'Messages are private; no public media pages exist.', '#06c755'),
  unavailable('wechat', 'WeChat', 'messaging', ['wechat.com', 'weixin.qq.com'], 'Messages are private; no public media pages exist.', '#07c160'),

  // ── Music ───────────────────────────────────────────────────────────────────────
  ytdlpRestricted('soundcloud', 'SoundCloud', 'music', ['soundcloud.com'], ['soundcloud'], {
    mediaTypes: ['audio', 'thumbnail'],
    operations: AUDIO_OPS,
    limitations: ['Single tracks only. Go+ and private tracks are not supported.'],
    termsNote: 'Downloads are permitted only for tracks where the artist enabled downloads.',
    color: '#ff5500',
  }),
  ytdlpRestricted('bandcamp', 'Bandcamp', 'music', ['bandcamp.com'], ['Bandcamp'], {
    mediaTypes: ['audio', 'thumbnail'],
    operations: AUDIO_OPS,
    limitations: ['Only the public 128 kbps preview stream. Purchase on Bandcamp for full-quality files.'],
    termsNote: 'Support artists by purchasing or using official free-download links.',
    color: '#629aa9',
  }),
  ytdlpRestricted('mixcloud', 'Mixcloud', 'music', ['mixcloud.com'], ['mixcloud'], {
    mediaTypes: ['audio', 'thumbnail'],
    operations: AUDIO_OPS,
    color: '#5000ff',
  }),
  ytdlpRestricted('audiomack', 'Audiomack', 'music', ['audiomack.com'], ['audiomack'], {
    mediaTypes: ['audio', 'thumbnail'],
    operations: AUDIO_OPS,
    color: '#ffa200',
  }),

  // ── Image & creative ────────────────────────────────────────────────────────────
  ytdlpRestricted('flickr', 'Flickr', 'image', ['flickr.com', 'flic.kr'], ['Flickr'], {
    baseStatus: 'limited',
    mediaTypes: ['video', 'thumbnail'],
    operations: ['inspect', 'download_video', 'download_thumbnail'],
    limitations: ['Videos only. Photo downloads are planned.'],
    termsNote: 'Download rights depend on the owner settings and licence of each item.',
    color: '#ff0084',
  }),
  ytdlpRestricted('imgur', 'Imgur', 'image', ['imgur.com'], ['Imgur'], {
    baseStatus: 'limited',
    mediaTypes: ['video', 'thumbnail'],
    operations: ['inspect', 'download_video', 'download_thumbnail'],
    limitations: ['Single video/GIF posts only. Albums are planned.'],
    color: '#1bb76e',
  }),
  planned('500px', '500px', 'image', ['500px.com'], 'Planned via an image-gallery adapter after licence review.', '#0099e5'),
  planned('deviantart', 'DeviantArt', 'image', ['deviantart.com'], 'Planned via an image-gallery adapter after licence review.', '#05cc47'),
  planned('giphy', 'Giphy', 'image', ['giphy.com'], 'Planned via the official Giphy API (requires an API key).', '#a855f7'),
  planned('tenor', 'Tenor', 'image', ['tenor.com'], 'Planned via the official Tenor API (requires an API key).', '#3b82f6'),
];

function ytdlpRestricted(
  id: string,
  name: string,
  category: PlatformCategory,
  domains: string[],
  extractors: string[],
  overrides: Partial<PlatformDefinition> = {},
): PlatformDefinition {
  return {
    id,
    name,
    category,
    domains,
    adapter: 'ytdlp',
    extractors,
    mediaTypes: ['video', 'audio', 'thumbnail'],
    operations: ['inspect', 'download_video', 'download_audio', 'download_thumbnail'],
    auth: 'none',
    policy: 'restricted',
    baseStatus: 'available',
    limitations: [],
    termsNote: RESTRICTED_TERMS,
    lastVerified: null,
    color: '#64748b',
    ...overrides,
  };
}

function planned(
  id: string,
  name: string,
  category: PlatformCategory,
  domains: string[],
  reason: string,
  color: string,
): PlatformDefinition {
  return {
    id,
    name,
    category,
    domains,
    adapter: 'none',
    extractors: [],
    mediaTypes: [],
    operations: [],
    auth: 'none',
    policy: 'not_applicable',
    baseStatus: 'planned',
    limitations: [reason],
    termsNote: '',
    lastVerified: null,
    color,
  };
}

function unavailable(
  id: string,
  name: string,
  category: PlatformCategory,
  domains: string[],
  reason: string,
  color: string,
): PlatformDefinition {
  return { ...planned(id, name, category, domains, reason, color), baseStatus: 'unavailable' };
}

const PLATFORM_BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]));

export function getPlatform(id: string): PlatformDefinition | undefined {
  return PLATFORM_BY_ID.get(id);
}

export interface PlatformRuntimeContext {
  /** Restricted platform ids the operator has explicitly enabled after legal review. */
  enabledRestricted: ReadonlySet<string>;
  /** Platform ids disabled at runtime (admin kill-switch or failing health checks). */
  disabled?: ReadonlySet<string>;
}

/** Effective, user-visible status for a platform in the current deployment. */
export function resolvePlatformStatus(p: PlatformDefinition, ctx: PlatformRuntimeContext): PlatformStatus {
  if (p.adapter === 'none') return p.baseStatus;
  if (ctx.disabled?.has(p.id)) return 'unavailable';
  if (p.policy === 'restricted' && !ctx.enabledRestricted.has(p.id)) return 'restricted';
  return p.baseStatus;
}

/** Whether downloads may be executed for this platform right now. */
export function isPlatformUsable(status: PlatformStatus): boolean {
  return status === 'available' || status === 'limited' || status === 'auth_required';
}

export function parsePlatformList(value: string | undefined | null): Set<string> {
  if (!value) return new Set();
  const items = value
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (items.includes('all') || items.includes('*')) {
    return new Set(PLATFORMS.map((p) => p.id));
  }
  return new Set(items.filter((s) => PLATFORM_BY_ID.has(s)));
}


/** Serializable public view returned by GET /api/v1/platforms. */
export interface PublicPlatform {
  id: string;
  name: string;
  category: PlatformCategory;
  domains: string[];
  status: PlatformStatus;
  policy: PlatformPolicy;
  mediaTypes: PlatformMediaType[];
  operations: PlatformOperation[];
  auth: PlatformAuth;
  limitations: string[];
  termsNote: string;
  lastVerified: string | null;
  requiresAttestation: boolean;
  color: string;
}

export function toPublicPlatform(p: PlatformDefinition, ctx: PlatformRuntimeContext): PublicPlatform {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    domains: p.domains,
    status: resolvePlatformStatus(p, ctx),
    policy: p.policy,
    mediaTypes: p.mediaTypes,
    operations: p.operations,
    auth: p.auth,
    limitations: p.limitations,
    termsNote: p.termsNote,
    lastVerified: p.lastVerified,
    requiresAttestation: p.policy === 'restricted',
    color: p.color,
  };
}
