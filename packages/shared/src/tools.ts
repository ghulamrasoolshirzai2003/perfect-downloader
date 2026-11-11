import { z } from 'zod';

/**
 * Declarative tool catalog. Each tool definition drives:
 *   - API option validation (zod schema generated from `fields` + optional `refine`)
 *   - capability filtering (options that need an encoder the server lacks are hidden/rejected)
 *   - the generic tool form in the web app (and future native apps)
 *
 * Labels here are the English source strings, keyed by stable ids (`tool.id` / `field.name`)
 * so they can be swapped for translations without touching processing code.
 */

export type ToolCategory = 'video' | 'audio' | 'image' | 'gif' | 'pdf';
export type FileKind = 'video' | 'audio' | 'image' | 'gif' | 'pdf';

/** Server capabilities a tool or option may depend on (reported by GET /api/v1/capabilities). */
export type Capability =
  | 'ffmpeg'
  | 'sharp'
  | 'pdf'
  | 'pdfRender'
  | 'qpdf'
  | 'gifsicle'
  | 'ytdlp'
  | `enc:${string}`
  | `img:${string}`;

export interface SelectOption {
  value: string;
  label: string;
  requires?: Capability;
}

interface FieldBase {
  name: string;
  label: string;
  help?: string;
  /** Show this field only when another field has one of the given values. */
  visibleWhen?: { field: string; equals: string[] };
}

export type ToolField =
  | (FieldBase & { type: 'select'; options: SelectOption[]; default: string })
  | (FieldBase & { type: 'number'; min: number; max: number; step?: number; default: number; unit?: string })
  | (FieldBase & { type: 'text'; maxLength: number; default: string; placeholder?: string; pattern?: string; optional?: boolean })
  | (FieldBase & { type: 'time'; default: string; optional?: boolean; placeholder?: string })
  | (FieldBase & { type: 'toggle'; default: boolean });

export interface ToolDefinition {
  id: string;
  category: ToolCategory;
  /** URL action: POST /api/v1/tools/{category}/{action} */
  action: string;
  name: string;
  summary: string;
  accepts: FileKind[];
  minFiles: number;
  maxFiles: number;
  /** 'file' → downloadable result; 'data' → JSON result shown in UI (e.g. metadata). */
  output: 'file' | 'data';
  /** 'server' tools are processed by workers; 'client' tools run fully in the browser. */
  execution: 'server' | 'client';
  requires: Capability[];
  fields: ToolField[];
  refine?: (opts: Record<string, unknown>) => string | null;
  /** Whether a determinate progress percentage can be reported (FFmpeg with known duration). */
  reportsProgress: boolean;
}

// ── time helpers ─────────────────────────────────────────────────────────────
const TIME_RE = /^(?:(\d{1,2}):)?(?:(\d{1,2}):)?(\d{1,5})(?:\.(\d{1,3}))?$/;

/** Parse "SS", "MM:SS", "HH:MM:SS" (optionally with .mmm) into seconds. Returns null if invalid. */
export function parseTimecode(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const m = TIME_RE.exec(v);
  if (!m) return null;
  const parts = v.split('.')[0]!.split(':').map((n) => Number(n));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  let seconds = 0;
  for (const p of parts) seconds = seconds * 60 + p;
  if (parts.length > 1 && parts.slice(1).some((p) => p >= 60)) return null;
  const ms = m[4] ? Number(m[4].padEnd(3, '0')) / 1000 : 0;
  return seconds + ms;
}

/** Parse page ranges like "1-3, 5, 8-" against a page count. Returns 1-based sorted unique page numbers. */
export function parsePageRanges(spec: string, pageCount: number): number[] | null {
  const s = spec.trim().toLowerCase();
  if (s === '' || s === 'all') return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages = new Set<number>();
  for (const part of s.split(',')) {
    const p = part.trim();
    if (!p) continue;
    const m = /^(\d{1,5})?\s*(-)?\s*(\d{1,5})?$/.exec(p);
    if (!m || (!m[1] && !m[3])) return null;
    const start = m[1] ? Number(m[1]) : 1;
    const end = m[2] ? (m[3] ? Number(m[3]) : pageCount) : start;
    if (start < 1 || end < start || end > pageCount) return null;
    for (let i = start; i <= end; i++) pages.add(i);
  }
  return pages.size ? [...pages].sort((a, b) => a - b) : null;
}

/** Parse range groups for splitting: "1-3, 4-6" → [[1,2,3],[4,5,6]]. */
export function parseRangeGroups(spec: string, pageCount: number): number[][] | null {
  const groups: number[][] = [];
  for (const part of spec.split(',')) {
    if (!part.trim()) continue;
    const g = parsePageRanges(part, pageCount);
    if (!g) return null;
    groups.push(g);
  }
  return groups.length ? groups : null;
}

// ── field shorthands ─────────────────────────────────────────────────────────
const VIDEO_FORMATS: SelectOption[] = [
  { value: 'mp4', label: 'MP4 (H.264)', requires: 'enc:libx264' },
  { value: 'webm', label: 'WebM (VP9)', requires: 'enc:libvpx-vp9' },
  { value: 'mov', label: 'MOV (H.264)', requires: 'enc:libx264' },
  { value: 'mkv', label: 'MKV (H.264)', requires: 'enc:libx264' },
];

export const AUDIO_FORMATS: SelectOption[] = [
  { value: 'mp3', label: 'MP3', requires: 'enc:libmp3lame' },
  { value: 'm4a', label: 'M4A (AAC)', requires: 'enc:aac' },
  { value: 'wav', label: 'WAV (lossless)', requires: 'enc:pcm_s16le' },
  { value: 'flac', label: 'FLAC (lossless)', requires: 'enc:flac' },
  { value: 'ogg', label: 'OGG (Vorbis)', requires: 'enc:libvorbis' },
  { value: 'opus', label: 'Opus', requires: 'enc:libopus' },
];

const BITRATES: SelectOption[] = ['64', '96', '128', '192', '256', '320'].map((b) => ({ value: b, label: `${b} kbps` }));

export const IMAGE_FORMATS: SelectOption[] = [
  { value: 'jpg', label: 'JPG', requires: 'img:jpeg' },
  { value: 'png', label: 'PNG', requires: 'img:png' },
  { value: 'webp', label: 'WebP', requires: 'img:webp' },
  { value: 'avif', label: 'AVIF', requires: 'img:heif' },
  { value: 'gif', label: 'GIF', requires: 'img:gif' },
  { value: 'tiff', label: 'TIFF', requires: 'img:tiff' },
];

const sel = (name: string, label: string, options: SelectOption[], def: string, extra: Partial<FieldBase> = {}): ToolField => ({
  type: 'select',
  name,
  label,
  options,
  default: def,
  ...extra,
});
const num = (
  name: string,
  label: string,
  min: number,
  max: number,
  def: number,
  extra: Partial<FieldBase> & { step?: number; unit?: string } = {},
): ToolField => ({ type: 'number', name, label, min, max, default: def, ...extra });
const time = (name: string, label: string, def: string, extra: Partial<FieldBase> & { optional?: boolean; placeholder?: string } = {}): ToolField => ({
  type: 'time',
  name,
  label,
  default: def,
  ...extra,
});
const toggle = (name: string, label: string, def: boolean, extra: Partial<FieldBase> = {}): ToolField => ({
  type: 'toggle',
  name,
  label,
  default: def,
  ...extra,
});
const text = (
  name: string,
  label: string,
  maxLength: number,
  def = '',
  extra: Partial<FieldBase> & { placeholder?: string; pattern?: string; optional?: boolean } = {},
): ToolField => ({ type: 'text', name, label, maxLength, default: def, ...extra });

const trimRefine = (o: Record<string, unknown>): string | null => {
  const start = parseTimecode(String(o.start ?? '0')) ?? 0;
  const endRaw = String(o.end ?? '').trim();
  if (!endRaw) return null;
  const end = parseTimecode(endRaw);
  if (end === null) return 'End time is invalid';
  return end > start ? null : 'End time must be after the start time';
};

const PAGES_PATTERN = '^\\s*(all|[0-9\\s,\\-]+)\\s*$';

function tool(def: Omit<ToolDefinition, 'execution' | 'reportsProgress' | 'output'> & Partial<Pick<ToolDefinition, 'execution' | 'reportsProgress' | 'output'>>): ToolDefinition {
  return { execution: 'server', reportsProgress: false, output: 'file', ...def };
}

export const TOOLS: ToolDefinition[] = [
  // ── Video ──────────────────────────────────────────────────────────────────
  tool({
    id: 'video.convert', category: 'video', action: 'convert', name: 'Video Converter',
    summary: 'Convert videos between MP4, WebM, MOV and MKV.',
    accepts: ['video', 'gif'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], reportsProgress: true,
    fields: [
      sel('format', 'Output format', VIDEO_FORMATS, 'mp4'),
      sel('quality', 'Quality', [
        { value: 'high', label: 'High (larger file)' },
        { value: 'balanced', label: 'Balanced' },
        { value: 'small', label: 'Small (lower quality)' },
      ], 'balanced'),
    ],
  }),
  tool({
    id: 'video.compress', category: 'video', action: 'compress', name: 'Video Compressor',
    summary: 'Reduce video file size while keeping good visual quality.',
    accepts: ['video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg', 'enc:libx264'], reportsProgress: true,
    fields: [
      sel('level', 'Compression', [
        { value: 'light', label: 'Light — best quality' },
        { value: 'balanced', label: 'Balanced — recommended' },
        { value: 'strong', label: 'Strong — smallest file' },
      ], 'balanced'),
      sel('maxHeight', 'Maximum resolution', [
        { value: 'original', label: 'Keep original' },
        { value: '1080', label: '1080p' },
        { value: '720', label: '720p' },
        { value: '480', label: '480p' },
        { value: '360', label: '360p' },
      ], 'original'),
    ],
  }),
  tool({
    id: 'video.trim', category: 'video', action: 'trim', name: 'Video Trimmer',
    summary: 'Cut a clip out of a longer video.',
    accepts: ['video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], reportsProgress: true,
    fields: [
      time('start', 'Start time', '0', { placeholder: '0:00', help: 'Format: SS, MM:SS or HH:MM:SS' }),
      time('end', 'End time', '', { optional: true, placeholder: 'End of video' }),
      sel('mode', 'Cutting mode', [
        { value: 'precise', label: 'Precise (re-encode)' },
        { value: 'fast', label: 'Fast (no re-encode, cuts at keyframes)' },
      ], 'precise'),
    ],
    refine: trimRefine,
  }),
  tool({
    id: 'video.merge', category: 'video', action: 'merge', name: 'Video Merger',
    summary: 'Join several videos into a single MP4, in the order you choose.',
    accepts: ['video'], minFiles: 2, maxFiles: 10, requires: ['ffmpeg', 'enc:libx264', 'enc:aac'], reportsProgress: true,
    fields: [
      sel('resolution', 'Output resolution', [
        { value: 'first', label: 'Match first video' },
        { value: '1080', label: '1080p' },
        { value: '720', label: '720p' },
        { value: '480', label: '480p' },
      ], 'first'),
    ],
  }),
  tool({
    id: 'video.to-audio', category: 'video', action: 'to-audio', name: 'Video to Audio',
    summary: 'Extract the soundtrack of a video as MP3, M4A, WAV and more.',
    accepts: ['video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], reportsProgress: true,
    fields: [
      sel('format', 'Audio format', AUDIO_FORMATS, 'mp3'),
      sel('bitrate', 'Bitrate', BITRATES, '192', { visibleWhen: { field: 'format', equals: ['mp3', 'm4a', 'ogg', 'opus'] } }),
    ],
  }),
  tool({
    id: 'video.to-gif', category: 'video', action: 'to-gif', name: 'Video to GIF',
    summary: 'Turn a section of a video into a high-quality animated GIF.',
    accepts: ['video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], reportsProgress: true,
    fields: [
      time('start', 'Start time', '0', { placeholder: '0:00' }),
      num('duration', 'Duration', 1, 30, 5, { unit: 's' }),
      num('fps', 'Frame rate', 5, 25, 12, { unit: 'fps' }),
      num('width', 'Width', 160, 800, 480, { unit: 'px', step: 10 }),
    ],
  }),
  tool({
    id: 'video.thumbnail', category: 'video', action: 'thumbnail', name: 'Video Thumbnail Extractor',
    summary: 'Grab still frames from a video as JPG, PNG or WebP.',
    accepts: ['video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'],
    fields: [
      sel('mode', 'Frames', [
        { value: 'single', label: 'One frame at a time position' },
        { value: 'spread', label: 'Several frames spread across the video' },
      ], 'single'),
      time('at', 'Time position', '0', { placeholder: '0:00', visibleWhen: { field: 'mode', equals: ['single'] } }),
      num('count', 'Number of frames', 2, 12, 6, { visibleWhen: { field: 'mode', equals: ['spread'] } }),
      sel('format', 'Image format', [
        { value: 'jpg', label: 'JPG' },
        { value: 'png', label: 'PNG' },
        { value: 'webp', label: 'WebP', requires: 'enc:libwebp' },
      ], 'jpg'),
    ],
  }),
  tool({
    id: 'video.resize', category: 'video', action: 'resize', name: 'Video Resolution Changer',
    summary: 'Scale a video to 4K, 1080p, 720p, 480p or smaller.',
    accepts: ['video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg', 'enc:libx264'], reportsProgress: true,
    fields: [
      sel('height', 'Resolution', ['2160', '1440', '1080', '720', '480', '360', '240'].map((h) => ({ value: h, label: `${h}p` })), '720'),
    ],
  }),
  tool({
    id: 'video.fps', category: 'video', action: 'fps', name: 'Frame Rate Converter',
    summary: 'Change the frame rate of a video (e.g. 60 → 30 fps).',
    accepts: ['video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg', 'enc:libx264'], reportsProgress: true,
    fields: [sel('fps', 'Frame rate', ['15', '24', '25', '30', '50', '60'].map((f) => ({ value: f, label: `${f} fps` })), '30')],
  }),
  tool({
    id: 'video.mute', category: 'video', action: 'mute', name: 'Remove Audio from Video',
    summary: 'Strip the audio track from a video without re-encoding the picture.',
    accepts: ['video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], fields: [],
  }),
  tool({
    id: 'video.audio-track', category: 'video', action: 'audio-track', name: 'Audio Track Extractor',
    summary: 'Copy an original audio track out of a video without re-encoding.',
    accepts: ['video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'],
    fields: [num('track', 'Audio track number', 1, 16, 1)],
  }),
  tool({
    id: 'video.subtitles', category: 'video', action: 'subtitles', name: 'Subtitle Extractor',
    summary: 'Extract embedded text subtitles from MKV/MP4 files as SRT or WebVTT.',
    accepts: ['video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'],
    fields: [
      num('track', 'Subtitle track number', 1, 32, 1),
      sel('format', 'Subtitle format', [
        { value: 'srt', label: 'SRT' },
        { value: 'vtt', label: 'WebVTT' },
        { value: 'ass', label: 'ASS' },
      ], 'srt'),
    ],
  }),
  tool({
    id: 'video.metadata', category: 'video', action: 'metadata', name: 'Video Metadata Inspector',
    summary: 'See codecs, resolution, bitrate, duration and streams of any video.',
    accepts: ['video', 'audio'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], output: 'data', fields: [],
  }),

  // ── Audio ──────────────────────────────────────────────────────────────────
  tool({
    id: 'audio.convert', category: 'audio', action: 'convert', name: 'Audio Converter',
    summary: 'Convert audio between MP3, M4A, WAV, FLAC, OGG and Opus.',
    accepts: ['audio', 'video'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], reportsProgress: true,
    fields: [
      sel('format', 'Output format', AUDIO_FORMATS, 'mp3'),
      sel('bitrate', 'Bitrate', BITRATES, '192', { visibleWhen: { field: 'format', equals: ['mp3', 'm4a', 'ogg', 'opus'] } }),
    ],
  }),
  tool({
    id: 'audio.compress', category: 'audio', action: 'compress', name: 'Audio Compressor',
    summary: 'Shrink audio files by lowering bitrate or converting to mono.',
    accepts: ['audio'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], reportsProgress: true,
    fields: [
      sel('format', 'Output format', AUDIO_FORMATS.filter((f) => ['mp3', 'm4a', 'opus'].includes(f.value)), 'mp3'),
      sel('bitrate', 'Bitrate', BITRATES.filter((b) => Number(b.value) <= 192), '96'),
      toggle('mono', 'Convert to mono', false),
    ],
  }),
  tool({
    id: 'audio.trim', category: 'audio', action: 'trim', name: 'Audio Trimmer',
    summary: 'Cut a section of an audio file, with optional fades.',
    accepts: ['audio'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], reportsProgress: true,
    fields: [
      time('start', 'Start time', '0', { placeholder: '0:00' }),
      time('end', 'End time', '', { optional: true, placeholder: 'End of file' }),
      toggle('fade', 'Fade in and out (1s)', false),
    ],
    refine: trimRefine,
  }),
  tool({
    id: 'audio.merge', category: 'audio', action: 'merge', name: 'Audio Merger',
    summary: 'Join multiple audio files into one track.',
    accepts: ['audio'], minFiles: 2, maxFiles: 20, requires: ['ffmpeg'], reportsProgress: true,
    fields: [
      sel('format', 'Output format', AUDIO_FORMATS.filter((f) => ['mp3', 'm4a', 'wav', 'flac'].includes(f.value)), 'mp3'),
    ],
  }),
  tool({
    id: 'audio.normalize', category: 'audio', action: 'normalize', name: 'Audio Normalizer',
    summary: 'Even out loudness to streaming, podcast or broadcast standards (EBU R128).',
    accepts: ['audio'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], reportsProgress: true,
    fields: [
      sel('target', 'Loudness target', [
        { value: '-14', label: '−14 LUFS · Streaming (Spotify, YouTube)' },
        { value: '-16', label: '−16 LUFS · Podcasts (Apple)' },
        { value: '-23', label: '−23 LUFS · Broadcast (EBU R128)' },
      ], '-14'),
      sel('format', 'Output format', AUDIO_FORMATS.filter((f) => ['mp3', 'm4a', 'wav', 'flac'].includes(f.value)), 'mp3'),
    ],
  }),
  tool({
    id: 'audio.tags', category: 'audio', action: 'tags', name: 'Audio Tag Editor',
    summary: 'Edit title, artist, album and other tags without re-encoding.',
    accepts: ['audio'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'],
    fields: [
      text('title', 'Title', 200, '', { optional: true }),
      text('artist', 'Artist', 200, '', { optional: true }),
      text('album', 'Album', 200, '', { optional: true }),
      text('date', 'Year', 10, '', { optional: true, pattern: '^[0-9\\-]{0,10}$' }),
      text('genre', 'Genre', 100, '', { optional: true }),
      text('track', 'Track number', 10, '', { optional: true, pattern: '^[0-9/]{0,10}$' }),
      text('comment', 'Comment', 500, '', { optional: true }),
    ],
  }),
  tool({
    id: 'audio.metadata', category: 'audio', action: 'metadata', name: 'Audio Metadata Viewer',
    summary: 'View codec, bitrate, sample rate, channels and tags.',
    accepts: ['audio'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'], output: 'data', fields: [],
  }),

  // ── Image ──────────────────────────────────────────────────────────────────
  tool({
    id: 'image.convert', category: 'image', action: 'convert', name: 'Image Converter',
    summary: 'Convert images between JPG, PNG, WebP, AVIF, GIF and TIFF — in bulk.',
    accepts: ['image', 'gif'], minFiles: 1, maxFiles: 20, requires: ['sharp'],
    fields: [
      sel('format', 'Output format', IMAGE_FORMATS, 'webp'),
      num('quality', 'Quality', 1, 100, 82, { visibleWhen: { field: 'format', equals: ['jpg', 'webp', 'avif', 'tiff'] } }),
      toggle('stripMetadata', 'Remove metadata (EXIF, GPS)', true),
    ],
  }),
  tool({
    id: 'image.compress', category: 'image', action: 'compress', name: 'Image Compressor',
    summary: 'Make images smaller with smart, visually lossless compression.',
    accepts: ['image'], minFiles: 1, maxFiles: 20, requires: ['sharp'],
    fields: [
      num('quality', 'Quality', 30, 95, 75),
      sel('format', 'Output format', [{ value: 'keep', label: 'Keep original format' }, ...IMAGE_FORMATS.filter((f) => ['jpg', 'webp', 'avif'].includes(f.value))], 'keep'),
      toggle('stripMetadata', 'Remove metadata (EXIF, GPS)', true),
    ],
  }),
  tool({
    id: 'image.resize', category: 'image', action: 'resize', name: 'Image Resizer',
    summary: 'Resize images to exact pixel dimensions or fit within a box.',
    accepts: ['image', 'gif'], minFiles: 1, maxFiles: 20, requires: ['sharp'],
    fields: [
      num('width', 'Width', 0, 8000, 1280, { unit: 'px', help: '0 = automatic' }),
      num('height', 'Height', 0, 8000, 0, { unit: 'px', help: '0 = automatic' }),
      sel('fit', 'Fit', [
        { value: 'inside', label: 'Fit inside (keep aspect ratio)' },
        { value: 'cover', label: 'Fill and crop' },
        { value: 'contain', label: 'Letterbox' },
        { value: 'fill', label: 'Stretch' },
      ], 'inside'),
      toggle('withoutEnlargement', 'Never upscale', true),
    ],
    refine: (o) => (Number(o.width) === 0 && Number(o.height) === 0 ? 'Set a width or a height' : null),
  }),
  tool({
    id: 'image.crop', category: 'image', action: 'crop', name: 'Image Cropper',
    summary: 'Crop images to a preset aspect ratio or an exact rectangle.',
    accepts: ['image'], minFiles: 1, maxFiles: 20, requires: ['sharp'],
    fields: [
      sel('mode', 'Crop mode', [
        { value: 'aspect', label: 'Aspect ratio' },
        { value: 'custom', label: 'Exact rectangle (pixels)' },
      ], 'aspect'),
      sel('aspect', 'Aspect ratio', ['1:1', '4:5', '3:2', '4:3', '16:9', '9:16'].map((a) => ({ value: a, label: a })), '1:1', { visibleWhen: { field: 'mode', equals: ['aspect'] } }),
      sel('position', 'Focus', [
        { value: 'center', label: 'Center' },
        { value: 'attention', label: 'Smart (most interesting area)' },
        { value: 'top', label: 'Top' },
        { value: 'bottom', label: 'Bottom' },
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ], 'center', { visibleWhen: { field: 'mode', equals: ['aspect'] } }),
      num('left', 'Left', 0, 20000, 0, { unit: 'px', visibleWhen: { field: 'mode', equals: ['custom'] } }),
      num('top', 'Top', 0, 20000, 0, { unit: 'px', visibleWhen: { field: 'mode', equals: ['custom'] } }),
      num('width', 'Width', 1, 20000, 500, { unit: 'px', visibleWhen: { field: 'mode', equals: ['custom'] } }),
      num('height', 'Height', 1, 20000, 500, { unit: 'px', visibleWhen: { field: 'mode', equals: ['custom'] } }),
    ],
  }),
  tool({
    id: 'image.rotate', category: 'image', action: 'rotate', name: 'Rotate & Flip Image',
    summary: 'Rotate images by 90° steps or mirror them.',
    accepts: ['image'], minFiles: 1, maxFiles: 20, requires: ['sharp'],
    fields: [
      sel('angle', 'Rotation', [
        { value: '0', label: 'None' },
        { value: '90', label: '90° clockwise' },
        { value: '180', label: '180°' },
        { value: '270', label: '90° counter-clockwise' },
      ], '90'),
      sel('flip', 'Mirror', [
        { value: 'none', label: 'None' },
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' },
      ], 'none'),
    ],
  }),
  tool({
    id: 'image.metadata', category: 'image', action: 'metadata', name: 'Image Metadata Inspector',
    summary: 'Detect the real image format and view dimensions, colour space and EXIF data.',
    accepts: ['image', 'gif'], minFiles: 1, maxFiles: 1, requires: ['sharp'], output: 'data', fields: [],
  }),

  // ── GIF ────────────────────────────────────────────────────────────────────
  tool({
    id: 'gif.make', category: 'gif', action: 'make', name: 'GIF Maker',
    summary: 'Combine images into an animated GIF.',
    accepts: ['image'], minFiles: 2, maxFiles: 60, requires: ['ffmpeg', 'sharp'],
    fields: [
      num('delay', 'Frame duration', 20, 5000, 500, { unit: 'ms', step: 10 }),
      num('width', 'Width', 80, 800, 480, { unit: 'px', step: 10 }),
      toggle('loop', 'Loop forever', true),
    ],
  }),
  tool({
    id: 'gif.to-video', category: 'gif', action: 'to-video', name: 'GIF to Video',
    summary: 'Convert animated GIFs into MP4 or WebM — usually 5–10× smaller.',
    accepts: ['gif'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'],
    fields: [sel('format', 'Output format', VIDEO_FORMATS.filter((f) => ['mp4', 'webm'].includes(f.value)), 'mp4')],
  }),
  tool({
    id: 'gif.compress', category: 'gif', action: 'compress', name: 'GIF Compressor',
    summary: 'Optimize animated GIFs by reducing colours and redundant data.',
    accepts: ['gif'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'],
    fields: [
      sel('level', 'Compression', [
        { value: 'light', label: 'Light' },
        { value: 'balanced', label: 'Balanced' },
        { value: 'strong', label: 'Strong' },
      ], 'balanced'),
    ],
  }),
  tool({
    id: 'gif.resize', category: 'gif', action: 'resize', name: 'GIF Resizer',
    summary: 'Resize animated GIFs while keeping every frame and timing.',
    accepts: ['gif'], minFiles: 1, maxFiles: 1, requires: ['sharp'],
    fields: [num('width', 'Width', 16, 1600, 320, { unit: 'px' })],
  }),
  tool({
    id: 'gif.frames', category: 'gif', action: 'frames', name: 'GIF Frame Extractor',
    summary: 'Split an animated GIF into individual PNG or JPG frames.',
    accepts: ['gif'], minFiles: 1, maxFiles: 1, requires: ['ffmpeg'],
    fields: [
      sel('format', 'Frame format', [
        { value: 'png', label: 'PNG' },
        { value: 'jpg', label: 'JPG' },
      ], 'png'),
    ],
  }),

  // ── PDF ────────────────────────────────────────────────────────────────────
  tool({
    id: 'pdf.compress', category: 'pdf', action: 'compress', name: 'PDF Compressor',
    summary: 'Losslessly optimize PDF structure and streams to reduce size.',
    accepts: ['pdf'], minFiles: 1, maxFiles: 1, requires: ['pdf'], fields: [],
  }),
  tool({
    id: 'pdf.merge', category: 'pdf', action: 'merge', name: 'PDF Merger',
    summary: 'Combine multiple PDFs into one document in your chosen order.',
    accepts: ['pdf'], minFiles: 2, maxFiles: 20, requires: ['pdf'], fields: [],
  }),
  tool({
    id: 'pdf.split', category: 'pdf', action: 'split', name: 'PDF Splitter',
    summary: 'Split a PDF into single pages or custom page ranges.',
    accepts: ['pdf'], minFiles: 1, maxFiles: 1, requires: ['pdf'],
    fields: [
      sel('mode', 'Split mode', [
        { value: 'every', label: 'Every page as its own PDF' },
        { value: 'ranges', label: 'Custom ranges' },
      ], 'every'),
      text('ranges', 'Ranges', 200, '1-2, 3-4', { placeholder: 'e.g. 1-3, 4-6, 7', pattern: '^[0-9\\s,\\-]+$', visibleWhen: { field: 'mode', equals: ['ranges'] } }),
    ],
  }),
  tool({
    id: 'pdf.extract', category: 'pdf', action: 'extract', name: 'Extract PDF Pages',
    summary: 'Pull selected pages out of a PDF into a new document.',
    accepts: ['pdf'], minFiles: 1, maxFiles: 1, requires: ['pdf'],
    fields: [text('pages', 'Pages', 200, '1', { placeholder: 'e.g. 1, 3, 5-7', pattern: '^[0-9\\s,\\-]+$' })],
  }),
  tool({
    id: 'pdf.rotate', category: 'pdf', action: 'rotate', name: 'Rotate PDF',
    summary: 'Rotate all or selected pages of a PDF.',
    accepts: ['pdf'], minFiles: 1, maxFiles: 1, requires: ['pdf'],
    fields: [
      sel('angle', 'Rotation', [
        { value: '90', label: '90° clockwise' },
        { value: '180', label: '180°' },
        { value: '270', label: '90° counter-clockwise' },
      ], '90'),
      text('pages', 'Pages', 200, 'all', { placeholder: 'all, or e.g. 1-3, 5', pattern: PAGES_PATTERN }),
    ],
  }),
  tool({
    id: 'pdf.to-image', category: 'pdf', action: 'to-image', name: 'PDF to Image',
    summary: 'Render PDF pages as high-quality PNG or JPG images.',
    accepts: ['pdf'], minFiles: 1, maxFiles: 1, requires: ['pdfRender'],
    fields: [
      sel('format', 'Image format', [
        { value: 'png', label: 'PNG' },
        { value: 'jpg', label: 'JPG' },
      ], 'png'),
      sel('dpi', 'Resolution', [
        { value: '72', label: '72 DPI (screen)' },
        { value: '150', label: '150 DPI (standard)' },
        { value: '300', label: '300 DPI (print)' },
      ], '150'),
      text('pages', 'Pages', 200, 'all', { placeholder: 'all, or e.g. 1-3, 5', pattern: PAGES_PATTERN }),
    ],
  }),
  tool({
    id: 'pdf.from-images', category: 'pdf', action: 'from-images', name: 'Image to PDF',
    summary: 'Turn JPG, PNG, WebP and other images into a PDF document.',
    accepts: ['image'], minFiles: 1, maxFiles: 50, requires: ['pdf', 'sharp'],
    fields: [
      sel('pageSize', 'Page size', [
        { value: 'fit', label: 'Fit to image' },
        { value: 'a4', label: 'A4' },
        { value: 'letter', label: 'US Letter' },
      ], 'a4'),
      sel('margin', 'Margin', [
        { value: 'none', label: 'None' },
        { value: 'small', label: 'Small' },
        { value: 'large', label: 'Large' },
      ], 'small', { visibleWhen: { field: 'pageSize', equals: ['a4', 'letter'] } }),
    ],
  }),
  tool({
    id: 'pdf.metadata', category: 'pdf', action: 'metadata', name: 'PDF Metadata Inspector',
    summary: 'View page count, page sizes, title, author and producer of a PDF.',
    accepts: ['pdf'], minFiles: 1, maxFiles: 1, requires: ['pdf'], output: 'data', fields: [],
  }),
  tool({
    id: 'pdf.preview', category: 'pdf', action: 'preview', name: 'PDF Viewer',
    summary: 'Preview PDF pages privately in your browser — nothing is uploaded.',
    accepts: ['pdf'], minFiles: 1, maxFiles: 1, requires: [], execution: 'client', fields: [],
  }),
];

const TOOL_BY_ID = new Map(TOOLS.map((t) => [t.id, t]));
export function getTool(id: string): ToolDefinition | undefined {
  return TOOL_BY_ID.get(id);
}
export function getToolByRoute(category: string, action: string): ToolDefinition | undefined {
  return TOOL_BY_ID.get(`${category}.${action}`);
}

/** Field visibility given current option values. */
export function isFieldVisible(field: ToolField, values: Record<string, unknown>): boolean {
  if (!field.visibleWhen) return true;
  return field.visibleWhen.equals.includes(String(values[field.visibleWhen.field]));
}

export function defaultOptions(t: ToolDefinition): Record<string, unknown> {
  return Object.fromEntries(t.fields.map((f) => [f.name, f.default]));
}

/**
 * Build a strict zod schema for a tool's options. Unknown keys are rejected so nothing unexpected can
 * reach the processing layer. Select fields are restricted to options the server can actually produce.
 */
export function buildOptionsSchema(t: ToolDefinition, caps?: ReadonlySet<string>) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of t.fields) {
    switch (f.type) {
      case 'select': {
        const values = f.options.filter((o) => !o.requires || !caps || caps.has(o.requires)).map((o) => o.value);
        shape[f.name] = values.length
          ? z.enum(values as [string, ...string[]]).default(f.default)
          : z.never();
        break;
      }
      case 'number':
        shape[f.name] = z.coerce.number().finite().min(f.min).max(f.max).default(f.default);
        break;
      case 'toggle':
        shape[f.name] = z.boolean().default(f.default);
        break;
      case 'time':
        shape[f.name] = z
          .string()
          .max(16)
          .default(f.default)
          .refine((v) => (f.optional && v.trim() === '') || parseTimecode(v) !== null, { message: `${f.label} is not a valid time` });
        break;
      case 'text': {
        let s = z.string().max(f.maxLength);
        if (f.pattern) {
          const re = new RegExp(f.pattern);
          s = s.refine((v) => (f.optional && v === '') || re.test(v), { message: `${f.label} has an invalid format` }) as unknown as z.ZodString;
        }
        shape[f.name] = s.default(f.default);
        break;
      }
    }
  }
  const base = z.object(shape).strict();
  return t.refine
    ? base.superRefine((val, ctx) => {
        const msg = t.refine!(val as Record<string, unknown>);
        if (msg) ctx.addIssue({ code: 'custom', message: msg });
      })
    : base;
}

/** Capabilities missing for a tool to run on this server. */
export function missingCapabilities(t: ToolDefinition, caps: ReadonlySet<string>): Capability[] {
  return t.requires.filter((c) => !caps.has(c));
}

export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  video: 'Video tools',
  audio: 'Audio tools',
  image: 'Image tools',
  gif: 'GIF tools',
  pdf: 'PDF tools',
};

export const FILE_KIND_LABELS: Record<FileKind, string> = {
  video: 'video',
  audio: 'audio',
  image: 'image',
  gif: 'GIF',
  pdf: 'PDF',
};
