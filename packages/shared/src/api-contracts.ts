import { z } from 'zod';
import { type ErrorCode } from './errors';
import { type PlatformStatus, type PlatformCategory, type PlatformMediaType, type PublicPlatform } from './platforms';
import { type Capability, type ToolCategory, type FileKind } from './tools';

/** Formats extracted from a URL inspection */
export interface MediaStreamFormat {
  formatId: string;
  ext: string;
  resolution?: string;
  width?: number;
  height?: number;
  vcodec?: string;
  acodec?: string;
  fps?: number;
  filesize?: number;
  filesizeApprox?: number;
  qualityLabel?: string;
  hasVideo: boolean;
  hasAudio: boolean;
  isAudioOnly: boolean;
  isVideoOnly: boolean;
  protocol?: string;
}

export interface SubtitleTrack {
  lang: string;
  name: string;
  ext: string;
  url?: string;
}

export interface InspectResult {
  url: string;
  canonicalUrl: string;
  platform: {
    id: string;
    name: string;
    category: PlatformCategory;
    status: PlatformStatus;
    policy: 'open' | 'restricted' | 'not_applicable';
    requiresAttestation: boolean;
  };
  title: string;
  description?: string;
  duration?: number; // in seconds
  thumbnail?: string;
  uploader?: string;
  uploaderUrl?: string;
  uploadDate?: string;
  formats: MediaStreamFormat[];
  subtitles: SubtitleTrack[];
  bestVideo?: MediaStreamFormat;
  bestAudio?: MediaStreamFormat;
  inspectedAt: string;
}

export const InspectRequestSchema = z.object({
  url: z.string().min(1).max(2048),
  /** When true, forces fresh network inspection bypassing any short-lived cached metadata */
  refresh: z.boolean().optional(),
});
export type InspectRequest = z.infer<typeof InspectRequestSchema>;

export interface InspectResponse {
  data: InspectResult;
}

export const DownloadRequestSchema = z.object({
  url: z.string().min(1).max(2048),
  formatId: z.string().min(1).max(128),
  /** If the platform is restricted, the user must explicitly attest they own or have permission */
  attestation: z.boolean().optional(),
  /** Optional conversion to run after download (e.g. convert to mp3, mp4, etc.) */
  targetFormat: z.string().max(16).optional(),
  /** Optional media title for nice filename output */
  title: z.string().max(256).optional(),
});
export type DownloadRequest = z.infer<typeof DownloadRequestSchema>;


export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'expired';

export interface JobProgress {
  percent?: number;
  speed?: string;
  eta?: string;
  stage?: string;
}

export interface JobState {
  id: string;
  type: 'download' | 'tool';
  status: JobStatus;
  progress?: JobProgress;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  outputFileName?: string;
  outputFileSize?: number;
  outputMimeType?: string;
  downloadUrl?: string;
  error?: {
    code: ErrorCode;
    message: string;
  };
  resultData?: Record<string, unknown>;
}

export interface JobResponse {
  job: JobState;
}

export interface SystemCapabilitiesResponse {
  capabilities: Capability[];
  version: string;
  uptime: number;
  system: {
    cpuCores: number;
    platform: string;
  };
  toolsCount: number;
  platformsCount: number;
}

export interface PlatformsResponse {
  platforms: PublicPlatform[];
}

export interface OperationalStats {
  totalJobsProcessed: number;
  activeJobs: number;
  successfulJobs: number;
  failedJobs: number;
  popularTools: Record<string, number>;
  popularPlatforms: Record<string, number>;
  uptimeSeconds: number;
}
