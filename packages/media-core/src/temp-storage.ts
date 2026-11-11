import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { AppError } from '@pd/shared';

export interface TempFileOptions {
  prefix?: string;
  extension?: string;
  ttlMs?: number;
}

export interface ManagedTempFile {
  id: string;
  path: string;
  fileName: string;
  createdAt: number;
  expiresAt: number;
  cleanup: () => Promise<void>;
}

export class TempStorageManager {
  private baseDir: string;
  private defaultTtlMs: number;
  private registry = new Map<string, ManagedTempFile>();
  private sweepTimer?: NodeJS.Timeout;

  constructor(baseDir?: string, defaultTtlMs = 15 * 60 * 1000) {
    this.baseDir = path.resolve(baseDir ?? path.join(process.cwd(), '.tmp', 'media'));
    this.defaultTtlMs = defaultTtlMs;
  }

  async init(): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    // Run an initial sweep of any orphaned files from previous runs
    await this.sweepDisk();
    // Schedule periodic sweeps every 2 minutes
    this.sweepTimer = setInterval(() => {
      this.sweepDisk().catch(() => {});
    }, 2 * 60 * 1000);
    this.sweepTimer.unref();
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  /**
   * Allocate a safe, random temporary file path inside the managed sandbox.
   * Enforces that the resulting path is strictly contained inside `baseDir`.
   */
  async createTempFile(opts: TempFileOptions = {}): Promise<ManagedTempFile> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const id = randomUUID();
    const prefix = opts.prefix ? opts.prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) : 'pd';
    let ext = opts.extension ? opts.extension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() : 'tmp';
    if (!ext) ext = 'tmp';
    const fileName = `${prefix}_${id}.${ext}`;
    const filePath = path.resolve(this.baseDir, fileName);

    // Path traversal defense check
    if (!filePath.startsWith(this.baseDir + path.sep) && filePath !== this.baseDir) {
      throw new AppError('INTERNAL_ERROR', 'Illegal file path resolution outside temp base');
    }

    const now = Date.now();
    const ttl = opts.ttlMs ?? this.defaultTtlMs;
    const expiresAt = now + ttl;

    const managed: ManagedTempFile = {
      id,
      path: filePath,
      fileName,
      createdAt: now,
      expiresAt,
      cleanup: async () => {
        this.registry.delete(id);
        try {
          await fs.unlink(filePath);
        } catch {
          // file may already have been cleaned up or not created yet
        }
      },
    };

    this.registry.set(id, managed);
    return managed;
  }

  /**
   * Allocate a dedicated temporary sub-directory for multi-file operations (e.g. frame extractions)
   */
  async createTempDir(prefix = 'dir'): Promise<{ id: string; path: string; cleanup: () => Promise<void> }> {
    const id = randomUUID();
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16);
    const dirPath = path.resolve(this.baseDir, `${cleanPrefix}_${id}`);

    if (!dirPath.startsWith(this.baseDir + path.sep)) {
      throw new AppError('INTERNAL_ERROR', 'Illegal directory path resolution');
    }

    await fs.mkdir(dirPath, { recursive: true });

    return {
      id,
      path: dirPath,
      cleanup: async () => {
        try {
          await fs.rm(dirPath, { recursive: true, force: true });
        } catch {
          // ignore
        }
      },
    };
  }

  /**
   * Delete files whose TTL has elapsed
   */
  async sweepDisk(): Promise<void> {
    const now = Date.now();
    try {
      const entries = await fs.readdir(this.baseDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(this.baseDir, entry.name);
        try {
          const stat = await fs.stat(fullPath);
          const ageMs = now - stat.mtimeMs;
          if (ageMs > this.defaultTtlMs) {
            if (entry.isDirectory()) {
              await fs.rm(fullPath, { recursive: true, force: true });
            } else {
              await fs.unlink(fullPath);
            }
          }
        } catch {
          // ignore concurrent unlinks
        }
      }
    } catch {
      // directory might not exist yet
    }
  }

  async close(): Promise<void> {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
    // Cleanup active files
    const cleanups = Array.from(this.registry.values()).map((f) => f.cleanup());
    await Promise.allSettled(cleanups);
    this.registry.clear();
  }
}
