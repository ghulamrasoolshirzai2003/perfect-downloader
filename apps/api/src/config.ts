import * as path from 'node:path';
import { parsePlatformList } from '@pd/shared';

export interface AppConfig {
  port: number;
  host: string;
  corsOrigin: string;
  enabledRestrictedPlatforms: Set<string>;
  disabledPlatforms: Set<string>;
  maxUploadSizeMb: number;
  tempMediaDir: string;
  jobTtlMs: number;
}

export function loadConfig(): AppConfig {
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
  const enabledRestrictedPlatforms = parsePlatformList(process.env.ENABLED_RESTRICTED_PLATFORMS);
  const disabledPlatforms = parsePlatformList(process.env.DISABLED_PLATFORMS);
  const maxUploadSizeMb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '200', 10);
  const tempMediaDir = path.resolve(process.env.TEMP_MEDIA_DIR || path.join(process.cwd(), '.tmp', 'media'));
  const jobTtlMs = parseInt(process.env.JOB_TTL_MS || '900000', 10); // 15 mins default

  return {
    port,
    host,
    corsOrigin,
    enabledRestrictedPlatforms,
    disabledPlatforms,
    maxUploadSizeMb,
    tempMediaDir,
    jobTtlMs,
  };
}
