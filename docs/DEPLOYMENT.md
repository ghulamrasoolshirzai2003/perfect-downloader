# Deployment & Infrastructure Guide

## 1. Quick Start (Local Development)

### Prerequisites
- Node.js ≥ 22.12
- Python ≥ 3.10 with `yt-dlp` installed (`pip install -U yt-dlp`)
- FFmpeg and ffprobe binaries on the system `$PATH`

### Starting the Monorepo Services
```bash
# 1. Install dependencies
npm install

# 2. Generate local test media fixtures
node scripts/generate-fixtures.mjs

# 3. Run automated tests
npm test

# 4. Start both API (port 4000) and Web (port 3000) in parallel
npm run dev
```

---

## 2. Production Docker Deployment

```bash
# Build and run containerized services
docker compose up -d --build

# View container logs
docker compose logs -f app
```

---

## 3. Production Environment Checklist

1. **Firewall / SSRF Protection:** Ensure the host or container network cannot access internal cloud VPC metadata endpoints (`169.254.169.254`) or private internal databases directly.
2. **Reverse Proxy:** Terminate TLS using Caddy, NGINX, or Cloudflare with HTTP/2 and gzip/brotli compression.
3. **Storage Mount:** Mount an SSD volume for `.tmp/media` with `noexec` flags to prevent any downloaded file from being executed.
4. **Subprocess Quotas:** Set cgroups CPU and memory limits (e.g. 4 CPUs, 4GB RAM) to prevent heavy conversions from exhausting host resources.
