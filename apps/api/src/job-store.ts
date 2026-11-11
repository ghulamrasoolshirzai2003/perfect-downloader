import { randomUUID } from 'node:crypto';
import { type JobState, type JobStatus, type JobProgress, AppError } from '@pd/shared';
import { type ManagedTempFile } from '@pd/media-core';

export interface InternalJobRecord {
  state: JobState;
  tempFile?: ManagedTempFile;
  inputFilesToClean?: ManagedTempFile[];
  abortController?: AbortController;
}

export class JobStore {
  private jobs = new Map<string, InternalJobRecord>();
  private sweepInterval: NodeJS.Timeout;

  constructor(private ttlMs = 15 * 60 * 1000) {
    this.sweepInterval = setInterval(() => this.sweep(), 60 * 1000);
    this.sweepInterval.unref();
  }

  createJob(type: 'download' | 'tool'): InternalJobRecord {
    const id = randomUUID();
    const now = Date.now();
    const expiresAt = now + this.ttlMs;

    const state: JobState = {
      id,
      type,
      status: 'queued',
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
    };

    const record: InternalJobRecord = {
      state,
      abortController: new AbortController(),
    };

    this.jobs.set(id, record);
    return record;
  }

  getJob(id: string): InternalJobRecord | undefined {
    return this.jobs.get(id);
  }

  updateProgress(id: string, progress: JobProgress): void {
    const record = this.jobs.get(id);
    if (!record) return;
    record.state.status = 'processing';
    record.state.progress = { ...record.state.progress, ...progress };
    record.state.updatedAt = new Date().toISOString();
  }

  completeJob(
    id: string,
    file?: ManagedTempFile,
    meta?: { fileName?: string; mimeType?: string; fileSize?: number; resultData?: Record<string, unknown> },
  ): void {
    const record = this.jobs.get(id);
    if (!record) return;
    record.state.status = 'completed';
    record.state.progress = { percent: 100 };
    record.state.updatedAt = new Date().toISOString();
    if (file) {
      record.tempFile = file;
      record.state.outputFileName = meta?.fileName || file.fileName;
      record.state.outputMimeType = meta?.mimeType;
      record.state.outputFileSize = meta?.fileSize;
      record.state.downloadUrl = `/api/v1/jobs/${id}/download`;
    }
    if (meta?.resultData) {
      record.state.resultData = meta.resultData;
    }
  }

  failJob(id: string, err: unknown): void {
    const record = this.jobs.get(id);
    if (!record) return;
    record.state.status = 'failed';
    record.state.updatedAt = new Date().toISOString();
    if (err instanceof AppError) {
      record.state.error = { code: err.code, message: err.message };
    } else {
      record.state.error = { code: 'INTERNAL_ERROR', message: (err as any)?.message || 'An error occurred' };
    }
  }

  async cleanupJob(id: string): Promise<void> {
    const record = this.jobs.get(id);
    if (!record) return;
    if (record.abortController && !record.abortController.signal.aborted) {
      record.abortController.abort();
    }
    if (record.tempFile) {
      await record.tempFile.cleanup().catch(() => {});
    }
    if (record.inputFilesToClean) {
      for (const f of record.inputFilesToClean) {
        await f.cleanup().catch(() => {});
      }
    }
    this.jobs.delete(id);
  }

  async sweep(): Promise<void> {
    const now = Date.now();
    for (const [id, record] of this.jobs.entries()) {
      const expires = new Date(record.state.expiresAt).getTime();
      if (now > expires) {
        await this.cleanupJob(id);
      }
    }
  }

  async close(): Promise<void> {
    clearInterval(this.sweepInterval);
    for (const id of this.jobs.keys()) {
      await this.cleanupJob(id);
    }
  }

  getActiveCount(): number {
    return Array.from(this.jobs.values()).filter(
      (j) => j.state.status === 'processing' || j.state.status === 'queued',
    ).length;
  }

  getTotalCount(): number {
    return this.jobs.size;
  }
}
