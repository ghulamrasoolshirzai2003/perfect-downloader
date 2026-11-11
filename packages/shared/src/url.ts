import { AppError } from './errors';
import { PLATFORMS, type PlatformDefinition } from './platforms';

export const MAX_URL_LENGTH = 2048;

/**
 * Parse and normalise user input into a safe, canonical http(s) URL.
 * Purely syntactic (isomorphic). DNS/IP checks happen server-side in the SSRF guard.
 */
export function normalizeUrl(input: string): URL {
  if (typeof input !== 'string') throw new AppError('INVALID_URL', 'URL must be a string');
  let raw = input.trim();
  if (raw.length === 0) throw new AppError('INVALID_URL', 'URL is empty');
  if (raw.length > MAX_URL_LENGTH) throw new AppError('INVALID_URL', 'URL is too long');
  // Reject control characters and whitespace inside the URL (common smuggling vectors).
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\s\\]/.test(raw)) throw new AppError('INVALID_URL', 'URL contains invalid characters');
  // Allow pasting without a scheme: "youtube.com/watch?v=..."
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError('INVALID_URL', 'URL could not be parsed');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new AppError('INVALID_URL', 'Only http and https URLs are supported');
  }
  if (url.username || url.password) {
    throw new AppError('INVALID_URL', 'URLs containing credentials are not allowed');
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    throw new AppError('INVALID_URL', 'Non-standard ports are not allowed');
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host || !host.includes('.')) throw new AppError('INVALID_URL', 'URL must contain a public hostname');
  if (isIpLiteral(host)) throw new AppError('INVALID_URL', 'IP address URLs are not allowed');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new AppError('INVALID_URL', 'Local hostnames are not allowed');
  }
  url.hostname = host;
  url.hash = '';
  // Upgrade http to https for known platforms; leave the scheme otherwise.
  if (url.protocol === 'http:') url.protocol = 'https:';
  url.port = '';
  return url;
}

/** Detects IPv4 (including exotic forms like 0x7f.1 or 2130706433 which URL normalizes) and IPv6 literals. */
export function isIpLiteral(host: string): boolean {
  if (host.startsWith('[') || host.includes(':')) return true;
  // WHATWG URL already normalizes decimal/hex/octal IPv4 into dotted quads.
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

export function hostMatchesDomain(host: string, domain: string): boolean {
  const h = host.toLowerCase();
  const d = domain.toLowerCase();
  return h === d || h.endsWith(`.${d}`);
}

export function findPlatformForHost(host: string): PlatformDefinition | undefined {
  // Prefer the most specific (longest) matching domain, e.g. commons.wikimedia.org.
  let best: { p: PlatformDefinition; len: number } | undefined;
  for (const p of PLATFORMS) {
    for (const d of p.domains) {
      if (hostMatchesDomain(host, d) && (!best || d.length > best.len)) best = { p, len: d.length };
    }
  }
  return best?.p;
}

export interface DetectionResult {
  url: URL;
  platform: PlatformDefinition | undefined;
}

/** Normalise + detect. Throws INVALID_URL for malformed input; returns platform undefined when unknown. */
export function detectPlatform(input: string): DetectionResult {
  const url = normalizeUrl(input);
  return { url, platform: findPlatformForHost(url.hostname) };
}

/**
 * Stable, privacy-preserving label for logs: hostname only. Never log full URLs, which may contain
 * private tokens in query strings.
 */
export function redactUrlForLogs(url: URL | string): string {
  try {
    const u = typeof url === 'string' ? new URL(url) : url;
    return u.hostname;
  } catch {
    return 'invalid-url';
  }
}
