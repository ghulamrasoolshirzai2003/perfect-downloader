# System Architecture — Perfect Downloader

## 1. Overview & Architectural Principles

Perfect Downloader is structured as a privacy-first, high-throughput monorepo combining a Fastify REST API, native media processing workers (FFmpeg, Sharp, PDF-Lib), and an SEO-optimized Next.js 15 PWA frontend.

```
                           +---------------------------+
                           |  Next.js 15 Frontend PWA  |
                           |    (Client & SSR / SSG)   |
                           +-------------+-------------+
                                         |
                                         | REST / JSON / Multipart
                                         v
                           +---------------------------+
                           |     Fastify REST API      |
                           |  - CORS & Rate Limiting   |
                           |  - OpenAPI Documentation  |
                           |  - Ephemeral Job Store    |
                           +----+------------------+---+
                                |                  |
                 +--------------+                  +---------------+
                 v                                                 v
  +-------------------------------+              +---------------------------------+
  |     @pd/downloader-core       |              |        @pd/media-core           |
  |  - SSRF & DNS Rebinding Guard |              |  - FFmpeg & ffprobe Processors  |
  |  - Strict yt-dlp Subprocesses |              |  - Sharp Image Processing       |
  |  - Policy & Attestation Engine|              |  - @cantoo/pdf-lib Document Ops |
  +---------------+---------------+              |  - Ephemeral Temp Storage (TTL) |
                  |                              +----------------+----------------+
                  v                                               v
          Extracted Streams                              Transcoded Media
```

---

## 2. Monorepo Layout

```
perfect-downloader/
├── apps/
│   ├── api/                     # Fastify REST API server (port 4000)
│   │   ├── src/
│   │   │   ├── server.ts        # API endpoints, Swagger, multipart, rate limiting
│   │   │   ├── config.ts        # Environment configuration
│   │   │   ├── job-store.ts     # In-memory ephemeral job tracker
│   │   │   └── capabilities.ts  # Hardware & encoder detection
│   │   └── package.json
│   └── web/                     # Next.js 15 + React 19 + Tailwind CSS PWA (port 3000)
│       ├── public/              # Manifest, Service Worker, robots.txt, icons
│       ├── src/
│       │   ├── app/             # App Router pages (Home, /status, /downloaders, /tools)
│       │   └── components/      # UniversalDownloader, ToolkitSection, PlatformGrid
│       └── package.json
├── packages/
│   ├── shared/                  # Isomorphic contracts, error codes, platform registry, tools catalog
│   ├── media-core/              # FFmpeg runner, ffprobe inspector, Sharp image tools, PDF runner
│   └── downloader-core/         # SSRF firewall, yt-dlp safe runner, format parser, download orchestrator
├── tests/                       # Automated Vitest test suites & media fixtures
├── docs/                        # Complete technical & compliance documentation
├── scripts/                     # Fixture generation and environment doctor scripts
├── docker-compose.yml           # Multi-service container orchestration
├── Dockerfile                   # Production multi-stage Docker build
└── package.json                 # Monorepo root workspaces
```

---

## 3. Core Subsystems

### 3.1 Platform Capability & Policy Registry (`@pd/shared`)
Every supported platform is registered with:
- Registrable domain patterns.
- Allowed yt-dlp extractor names (passed to `--use-extractors` to prevent generic extractor fallback).
- Policy classification:
  - `open`: Open-license platforms (Internet Archive, Wikimedia Commons, PeerTube). Active by default.
  - `restricted`: Platforms whose ToS prohibit automated downloads (YouTube, TikTok, Instagram, X). Disabled by default; operators can enable via `ENABLED_RESTRICTED_PLATFORMS` after legal review; users must confirm copyright attestation.
- Real verification timestamps (`lastVerified`).

### 3.2 SSRF & DNS Rebinding Firewall (`@pd/downloader-core`)
Before any network connection or subprocess is initiated:
1. Normalizes the URL and rejects credentials, IP literals, non-standard ports, and local hostnames.
2. Resolves DNS records via `dns.promises.lookup({ all: true })`.
3. Verifies every returned IP address with `ipaddr.js` against prohibited ranges:
   - Loopback (`127.0.0.0/8`, `::1`)
   - Private RFC1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `fc00::/7`)
   - Link-local & cloud metadata (`169.254.169.254`, `fe80::/10`)
   - Carrier-grade NAT (`100.64.0.0/10`)
   - Broadcast & Unspecified (`0.0.0.0`, `255.255.255.255`)

### 3.3 Ephemeral Storage Manager (`@pd/media-core`)
- Enforces strict filesystem path containment to prevent path traversal attacks.
- Allocates randomized UUID filenames (`prefix_uuid.ext`).
- Enforces a 15-minute Time-To-Live (TTL).
- Runs automated background sweeps every 2 minutes to remove expired files.

### 3.4 Processing Workers
- **Video & Audio**: Spawns `ffmpeg` and `ffprobe` with parameterized argument arrays (no shell concatenation). Parses stderr progress lines in real time to stream percentage, speed, and ETA to the user.
- **Image**: Executes `sharp` natively using compiled `libvips` bindings for fast, low-memory format transcoding and cropping.
- **Documents**: Executes `@cantoo/pdf-lib` for pure JS/WASM PDF manipulation without requiring heavy Java runtimes or Ghostscript.
