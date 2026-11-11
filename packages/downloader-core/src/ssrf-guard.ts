import * as dns from 'node:dns/promises';
import type { LookupAddress } from 'node:dns';
import ipaddr from 'ipaddr.js';
import { AppError, normalizeUrl } from '@pd/shared';

// Prohibited hostnames (cloud metadata, internal DNS, local names)
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'instance-data',
  'metadata',
]);

/**
 * Checks whether an IP address belongs to private, loopback, link-local, or cloud metadata ranges.
 */
export function isPrivateOrReservedIp(ipStr: string): boolean {
  try {
    const addr = ipaddr.parse(ipStr);
    const range = addr.range();

    // ipaddr.js range classification
    // For IPv4: 'unicast', 'unspecified', 'broadcast', 'linkLocal', 'loopback', 'private', 'carrierGradeNat', 'reserved'
    // For IPv6: 'unicast', 'unspecified', 'linkLocal', 'multicast', 'loopback', 'uniqueLocal', 'ipv4Mapped', 'rfc6145', 'rfc6052', '6to4', 'teredo', 'reserved'
    const dangerousRanges = new Set([
      'unspecified',
      'broadcast',
      'linkLocal',
      'loopback',
      'private',
      'carrierGradeNat',
      'reserved',
      'uniqueLocal',
    ]);

    if (dangerousRanges.has(range)) {
      return true;
    }

    // Additional explicit check for AWS/GCP/Azure link-local metadata 169.254.169.254
    if (addr.kind() === 'ipv4' && addr.toString() === '169.254.169.254') {
      return true;
    }

    return false;
  } catch {
    // If not parseable as IP, treat as unsafe
    return true;
  }
}

/**
 * Validates that a URL is syntactically safe, not targeting prohibited hostnames,
 * and resolves ONLY to public IP addresses (protecting against SSRF and DNS rebinding).
 */
export async function validateUrlSsrfSafe(rawUrl: string | URL): Promise<{ safeUrl: URL; resolvedIps: string[] }> {
  const safeUrl = typeof rawUrl === 'string' ? normalizeUrl(rawUrl) : rawUrl;
  const host = safeUrl.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.internal') || host.endsWith('.local') || host.endsWith('.localhost')) {
    throw new AppError('INVALID_URL', 'The specified host is restricted');
  }

  // Resolve hostname via DNS to verify IP addresses
  let addresses: LookupAddress[];
  try {
    addresses = await dns.lookup(host, { all: true, verbatim: true });
  } catch (err: any) {
    throw new AppError('CONTENT_UNAVAILABLE', `Could not resolve host: ${err.message}`);
  }

  if (!addresses || addresses.length === 0) {
    throw new AppError('CONTENT_UNAVAILABLE', 'Host did not resolve to any IP addresses');
  }

  const resolvedIps: string[] = [];
  for (const record of addresses) {
    const ip = record.address;
    resolvedIps.push(ip);
    if (isPrivateOrReservedIp(ip)) {
      throw new AppError('DOWNLOAD_NOT_PERMITTED', 'The requested host resolves to a restricted private or internal network address');
    }
  }

  return { safeUrl, resolvedIps };
}
