# Perfect Downloader

> **Universal Media Downloader & Online Media Processing Toolkit**  
> Fast, privacy-conscious media platform built with Next.js 15, Fastify, FFmpeg, Sharp, and @cantoo/pdf-lib.  
> 100% Guest-accessible. Zero permanent media storage.

---

## Key Highlights

- **Universal URL Media Downloader:** Paste links from Internet Archive, Wikimedia Commons, PeerTube, and supported social/video platforms. Inspects real stream resolutions, codecs, audio tracks, subtitles, and accurate file sizes.
- **Complete Online Media Toolkit (39 Tools):**
  - **Video Tools:** Converter (MP4, WebM, MOV, MKV), Compressor, Trimmer, Merger, Audio Extractor, Video-to-GIF (2-pass palettegen), Thumbnail Extractor, Resolution Changer, FPS Converter, Audio Remover, Subtitle Extractor, Metadata Inspector.
  - **Audio Tools:** Converter (MP3, M4A, WAV, FLAC, OGG, Opus), Compressor, Trimmer, Merger, Loudness Normalizer (EBU R128), Tag Editor, Metadata Inspector.
  - **Image Tools:** Converter (WebP, AVIF, JPEG, PNG, TIFF), Compressor, Resizer, Smart Cropper, Rotator & Flipper, EXIF Inspector.
  - **GIF Tools:** GIF Maker from images, GIF to MP4/WebM Video, GIF Optimizer, GIF Resizer, Frame Extractor.
  - **PDF Tools:** Compressor, Merger, Splitter, Page Extractor, Page Rotator, Image-to-PDF, Metadata Inspector.
- **Zero-Retention Privacy Guarantee:** No user accounts required. Uploads and converted files are processed in ephemeral sandboxes and automatically deleted within 15 minutes.
- **Enterprise-Grade Security:** Hardened SSRF firewall blocking loopback, private RFC1918, link-local, carrier-grade NAT, and cloud metadata (`169.254.169.254`) ranges. Parameterized argument execution without shell string injection.
- **Progressive Web App (PWA):** Installable on Android, iOS, Windows, and macOS with mobile-first responsive design.
- **SEO Architecture:** 89 pre-rendered static routes (SSG) with dynamic XML sitemaps, canonicals, and OpenGraph metadata.

---

## Architecture Overview

```
perfect-downloader/
├── apps/
│   ├── api/                     # Fastify REST API (Port 4000)
│   └── web/                     # Next.js 15 + React 19 + Tailwind CSS PWA (Port 3000)
├── packages/
│   ├── shared/                  # Typed error codes, platform registry, tools catalog
│   ├── media-core/              # Native FFmpeg runner, Sharp runner, PDF-Lib runner
│   └── downloader-core/         # SSRF firewall, hardened yt-dlp runner, format normalizer
├── tests/                       # Vitest automated test suites & local media fixtures
└── docs/                        # Complete technical and compliance documentation
```

---

## Quick Start

### 1. Prerequisites
- Node.js ≥ 22.12
- Python ≥ 3.10 with `yt-dlp` (`pip install -U yt-dlp`)
- FFmpeg and ffprobe installed on system `$PATH`

### 2. Installation & Fixtures
```bash
# Clone and install dependencies across all workspaces
npm install

# Generate local test media fixtures (video, audio, image, PDF)
node scripts/generate-fixtures.mjs

# Run test suites (25 unit, integration, and security tests)
npm test
```

### 3. Running Development Servers
```bash
# Start API (port 4000)
npm run dev:api

# Start Web Frontend (port 3000)
npm run dev:web
```
Visit `http://localhost:3000` to access the application, or `http://localhost:4000/docs` for the interactive OpenAPI documentation.

### 4. Running with Docker Compose
```bash
docker compose up -d --build
```

---

## Documentation Index

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Open-Source Audit & Compliance](docs/OPEN_SOURCE_AUDIT.md)
- [Third-Party Notices](docs/THIRD_PARTY_NOTICES.md)
- [Platform Support Registry](docs/PLATFORM_SUPPORT.md)
- [REST API Specification](docs/API.md)
- [Security Model & Threat Assessment](docs/SECURITY.md)
- [Privacy & Zero-Retention Policy](docs/PRIVACY_AND_RETENTION.md)
- [Deployment & Infrastructure](docs/DEPLOYMENT.md)
- [Testing Strategy & Test Suites](docs/TESTING.md)
- [Cost Model & Resource Economics](docs/COST_MODEL.md)
- [SEO Strategy & Information Architecture](docs/SEO.md)
- [Known Limitations & Honest Boundaries](docs/KNOWN_LIMITATIONS.md)
- [Operations & Emergency Playbook](docs/OPERATIONS.md)
- [Implementation Plan & Roadmap](docs/IMPLEMENTATION_PLAN.md)

---

## License

All custom code in this repository is proprietary and confidential. Open-source dependencies and CLI aggregates remain under their respective verified licenses (see [THIRD_PARTY_NOTICES.md](docs/THIRD_PARTY_NOTICES.md)).
