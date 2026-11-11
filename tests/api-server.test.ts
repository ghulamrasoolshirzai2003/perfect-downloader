import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { buildServer } from '../apps/api/src/server';

const fixturesDir = path.resolve('tests', 'fixtures');
const testImagePng = path.join(fixturesDir, 'test-image.png');
const testPdf = path.join(fixturesDir, 'test-document.pdf');

describe('API Server Endpoints', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeAll(async () => {
    server = await buildServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('GET /health returns ok', async () => {
    const res = await server.app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
  });

  it('GET /api/v1/capabilities returns system tools and encoders', async () => {
    const res = await server.app.inject({
      method: 'GET',
      url: '/api/v1/capabilities',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.capabilities).toContain('ffmpeg');
    expect(body.capabilities).toContain('sharp');
    expect(body.capabilities).toContain('pdf');
    expect(body.toolsCount).toBeGreaterThan(30);
  });

  it('GET /api/v1/platforms returns public platform registry', async () => {
    const res = await server.app.inject({
      method: 'GET',
      url: '/api/v1/platforms',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.platforms)).toBe(true);
    const archive = body.platforms.find((p: any) => p.id === 'archive');
    expect(archive).toBeDefined();
    expect(archive.status).toBe('available');
    expect(archive.policy).toBe('open');
  });

  it('POST /api/v1/inspect rejects invalid URLs with 400', async () => {
    const res = await server.app.inject({
      method: 'POST',
      url: '/api/v1/inspect',
      payload: { url: 'not-a-valid-url' },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('INVALID_URL');
  });

  it('POST /api/v1/inspect rejects unsupported platforms with 422', async () => {
    const res = await server.app.inject({
      method: 'POST',
      url: '/api/v1/inspect',
      payload: { url: 'https://unknown-random-domain-123456.com/video' },
    });
    expect(res.statusCode).toBe(422);
    const body = JSON.parse(res.body);
    expect(body.error.code).toBe('UNSUPPORTED_PLATFORM');
  });

  it('GET /api/v1/stats returns active job counts and uptime', async () => {
    const res = await server.app.inject({
      method: 'GET',
      url: '/api/v1/stats',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('uptimeSeconds');
  });
});
