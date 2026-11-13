import { createWriteStream } from 'node:fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { AppError } from '@pd/shared';
import { validateUrlSsrfSafe } from './ssrf-guard';

export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

export interface SafeFetchOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
  maxRedirects?: number;
  signal?: AbortSignal;
}

/**
 * Fetches a URL after validating it (and every redirect target) against SSRF rules.
 */
export async function safeFetch(rawUrl: string, opts: SafeFetchOptions = {}): Promise<Response> {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 20_000,
    maxRedirects = 5,
    signal,
  } = opts;

  let currentUrl = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const { safeUrl } = await validateUrlSsrfSafe(currentUrl);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onAbort = () => controller.abort();
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        throw new AppError('PROCESSING_FAILED', 'Request aborted');
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }

    try {
      const resp = await fetch(safeUrl.toString(), {
        method: hop === 0 ? method : 'GET',
        headers: {
          'user-agent': DEFAULT_USER_AGENT,
          'accept-language': 'en-US,en;q=0.9',
          ...headers,
        },
        body: hop === 0 ? body : undefined,
        redirect: 'manual',
        signal: controller.signal,
      });

      if (resp.status >= 300 && resp.status < 400) {
        const loc = resp.headers.get('location');
        if (!loc) {
          return resp;
        }
        await resp.body?.cancel().catch(() => {});
        currentUrl = new URL(loc, safeUrl).toString();
        continue;
      }

      return resp;
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new AppError('PROCESSING_TIMEOUT', 'Remote fetch timed out');
      }
      if (err instanceof AppError) throw err;
      throw new AppError('CONTENT_UNAVAILABLE', `Remote request failed: ${err?.message || 'network error'}`);
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort', onAbort);
    }
  }

  throw new AppError('CONTENT_UNAVAILABLE', 'Too many redirects while fetching remote media');
}

export async function safeFetchText(
  rawUrl: string,
  opts: SafeFetchOptions = {},
): Promise<{ status: number; url: string; contentType: string; text: string }> {
  const resp = await safeFetch(rawUrl, opts);
  const text = await resp.text();
  return {
    status: resp.status,
    url: resp.url || rawUrl,
    contentType: resp.headers.get('content-type') || '',
    text,
  };
}

export async function safeFetchJson<T = any>(
  rawUrl: string,
  opts: SafeFetchOptions = {},
): Promise<{ status: number; url: string; data: T }> {
  const resp = await safeFetch(rawUrl, {
    ...opts,
    headers: {
      accept: 'application/json, text/plain, */*',
      ...(opts.headers || {}),
    },
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new AppError('CONTENT_UNAVAILABLE', `Upstream returned HTTP ${resp.status}`);
  }
  try {
    return { status: resp.status, url: resp.url || rawUrl, data: JSON.parse(text) as T };
  } catch {
    throw new AppError('PROCESSING_FAILED', 'Upstream returned invalid JSON');
  }
}

/**
 * Streams a remote media URL directly to a local file path, checking SSRF and size limits.
 */
export async function safeDownloadToFile(
  rawUrl: string,
  destPath: string,
  opts: SafeFetchOptions & { maxBytes?: number } = {},
): Promise<{ contentType: string; bytesWritten: number }> {
  const { maxBytes = 500 * 1024 * 1024, ...fetchOpts } = opts;
  const resp = await safeFetch(rawUrl, fetchOpts);

  if (!resp.ok || !resp.body) {
    throw new AppError('CONTENT_UNAVAILABLE', `Failed to download media stream (HTTP ${resp.status})`);
  }

  const contentLength = Number(resp.headers.get('content-length') || 0);
  if (contentLength > maxBytes) {
    await resp.body.cancel().catch(() => {});
    throw new AppError('FILE_TOO_LARGE', 'Remote media exceeds the maximum allowed size');
  }

  let bytesWritten = 0;
  const limiter = new Transform({
    transform(chunk, _encoding, callback) {
      bytesWritten += chunk.length;
      if (bytesWritten > maxBytes) {
        callback(new AppError('FILE_TOO_LARGE', 'Remote media exceeds the maximum allowed size'));
        return;
      }
      callback(null, chunk);
    },
  });

  const { Readable } = await import('node:stream');
  const nodeReadable = Readable.fromWeb(resp.body as any);
  await pipeline(nodeReadable, limiter, createWriteStream(destPath));

  return {
    contentType: (resp.headers.get('content-type') || '').split(';')[0]?.trim().toLowerCase() || '',
    bytesWritten,
  };
}
