import { describe, it, expect } from 'vitest';
import { normalizeUrl, detectPlatform, AppError, isIpLiteral, DownloadRequestSchema } from '@pd/shared';
import { isPrivateOrReservedIp, validateUrlSsrfSafe, humanizeYtDlpError } from '@pd/downloader-core';

describe('URL Normalization and Detection', () => {
  it('normalizes bare URLs by prepending https:', () => {
    const url = normalizeUrl('archive.org/details/test');
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe('archive.org');
    expect(url.pathname).toBe('/details/test');
  });

  it('rejects URLs with credentials', () => {
    expect(() => normalizeUrl('https://user:pass@archive.org/item')).toThrowError(AppError);
  });

  it('rejects non-standard ports', () => {
    expect(() => normalizeUrl('https://archive.org:8443/item')).toThrowError(AppError);
  });

  it('detects IP address literals and rejects them', () => {
    expect(isIpLiteral('127.0.0.1')).toBe(true);
    expect(isIpLiteral('192.168.1.50')).toBe(true);
    expect(isIpLiteral('::1')).toBe(true);
    expect(isIpLiteral('example.com')).toBe(false);

    expect(() => normalizeUrl('http://127.0.0.1/video')).toThrowError(AppError);
  });

  it('rejects localhost and .local hostnames', () => {
    expect(() => normalizeUrl('http://localhost:80/video')).toThrowError(AppError);
    expect(() => normalizeUrl('http://internal.local/video')).toThrowError(AppError);
  });

  it('correctly matches supported platforms', () => {
    const r1 = detectPlatform('https://archive.org/details/BigBuckBunny_124');
    expect(r1.platform?.id).toBe('archive');
    expect(r1.platform?.policy).toBe('open');

    const r2 = detectPlatform('https://commons.wikimedia.org/wiki/File:Test.webm');
    expect(r2.platform?.id).toBe('wikimedia');
    expect(r2.platform?.policy).toBe('open');

    const r3 = detectPlatform('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(r3.platform?.id).toBe('youtube');
    expect(r3.platform?.policy).toBe('restricted');

    expect(detectPlatform('https://freemusicarchive.org/music/Broke_For_Free/Directionless_EP/Night_Owl/').platform?.id).toBe('freemusicarchive');
    expect(detectPlatform('https://video.blender.org/w/4zVdRZG3PTkESq1emx1Pxi').platform?.id).toBe('peertube');
    expect(detectPlatform('https://www.flickr.com/photos/scottspencer2012/55649328537/').platform?.id).toBe('flickr');
    expect(detectPlatform('https://imgur.com/A61SaA1').platform?.id).toBe('imgur');
    expect(detectPlatform('https://t.me/europa_press/613').platform?.id).toBe('telegram');
    expect(detectPlatform('https://www.threads.net/@zuck/post/123').platform?.id).toBe('threads');
    expect(detectPlatform('https://giphy.com/gifs/JIX9t2j0ZTN9S').platform?.id).toBe('giphy');
    expect(detectPlatform('https://tenor.com/view/cat-typing-gif-15368542').platform?.id).toBe('tenor');
  });

  it('humanizes raw yt-dlp extractor stderr errors without leaking CLI jargon', () => {
    const ttMsg = humanizeYtDlpError(
      'ERROR: [tiktok:user] bollywood2334: Unable to extract secondary user ID. try using "tiktokuser:channel_id"',
    );
    expect(ttMsg).not.toContain('tiktokuser:channel_id');
    expect(ttMsg).not.toContain('ERROR:');
    expect(humanizeYtDlpError('ERROR: Private video. Sign in if you have been granted access')).toMatch(/private|signing in/i);
    expect(humanizeYtDlpError('HTTP Error 404: Not Found')).toMatch(/not be found|deleted/i);
  });

  it('accepts long social captions (>256 up to 1024 chars) and fallback formatIds in DownloadRequestSchema', () => {
    const parsed = DownloadRequestSchema.parse({
      url: 'https://x.com/user/status/123',
      formatId: 'fb:v0',
      title: 'A'.repeat(400),
      targetFormat: 'mp4',
      attestation: true,
    });
    expect(parsed.title?.length).toBe(400);

    expect(() =>
      DownloadRequestSchema.parse({
        url: 'https://x.com/user/status/123',
        formatId: 'x'.repeat(600),
        title: 'ok',
      }),
    ).toThrow();
  });
});

describe('SSRF Protection Guard', () => {
  it('flags private and reserved IPv4 ranges as unsafe', () => {
    expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
    expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true);
    expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true); // AWS/cloud metadata
    expect(isPrivateOrReservedIp('0.0.0.0')).toBe(true);
    expect(isPrivateOrReservedIp('100.64.0.1')).toBe(true); // CG-NAT
  });

  it('flags private and reserved IPv6 ranges as unsafe', () => {
    expect(isPrivateOrReservedIp('::1')).toBe(true);
    expect(isPrivateOrReservedIp('fc00::1')).toBe(true); // Unique local
    expect(isPrivateOrReservedIp('fe80::1')).toBe(true); // Link local
  });

  it('allows public IP addresses', () => {
    expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
    expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false);
    expect(isPrivateOrReservedIp('208.80.154.224')).toBe(false); // Wikimedia
  });

  it('validates public hostnames successfully', async () => {
    const { safeUrl, resolvedIps } = await validateUrlSsrfSafe('https://commons.wikimedia.org/wiki/File:Test.webm');
    expect(safeUrl.hostname).toBe('commons.wikimedia.org');
    expect(resolvedIps.length).toBeGreaterThan(0);
  });
});
