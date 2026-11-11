# Testing Strategy & Quality Assurance

## 1. Test Architecture

The test suite runs entirely offline and hermetically using locally generated test media fixtures. No private, copyrighted, or flaky external networks are queried during CI test runs.

---

## 2. Test Suites

### 2.1 URL Parsing & SSRF Defense (`tests/url-and-ssrf.test.ts`)
- Normalization of scheme-less URLs.
- Rejection of embedded credentials (`user:pass@host`).
- Rejection of non-standard ports.
- Detection and blocking of IPv4 and IPv6 literals.
- Detection and blocking of `localhost`, `.local`, `.internal` hostnames.
- Verification of `isPrivateOrReservedIp` across:
  - Loopback (`127.0.0.1`, `::1`)
  - RFC1918 (`10.0.0.1`, `172.16.0.1`, `192.168.1.1`, `fc00::1`)
  - Cloud metadata (`169.254.169.254`)
  - CG-NAT (`100.64.0.1`)
- Public DNS verification against open archives (`archive.org`, `commons.wikimedia.org`).

### 2.2 Media Processing Core (`tests/media-processing.test.ts`)
- `ffprobe` stream and container extraction on MP4 and MP3 files.
- `sharp` image inspection, conversion (WebP, AVIF, JPEG), resizing, cropping, and rotation.
- `@cantoo/pdf-lib` PDF inspection, merging, splitting, page extraction, page rotation, and image-to-PDF generation.
- Full catalog tool dispatcher execution for `video.convert` and `video.to-audio`.

### 2.3 Fastify API Server (`tests/api-server.test.ts`)
- Server startup and graceful shutdown.
- `GET /health` reachability.
- `GET /api/v1/capabilities` validation of hardware encoders and tools.
- `GET /api/v1/platforms` validation of registered platform statuses.
- Error handling on invalid URL inputs (HTTP 400).
- Error handling on unsupported platform domains (HTTP 422).
- Operational statistics reporting.

---

## 3. Running the Test Suite

```bash
# Generate local media fixtures
node scripts/generate-fixtures.mjs

# Run all test suites
npm test
```
