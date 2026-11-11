# SEO Strategy & International Discovery

## 1. Information Architecture

Search engines prioritize crawlable, genuinely unique content over thin keyword-stuffed templates.

### 1.1 URL Hierarchy
- **Homepage (`/`):** High authority target for "Universal Media Downloader" and "Online Media Toolkit".
- **Platform Landing Pages (`/downloaders/[slug]`):** Dedicated landing pages for individual supported platforms:
  - `/downloaders/archive` (Internet Archive Downloader)
  - `/downloaders/wikimedia` (Wikimedia Commons Downloader)
  - `/downloaders/youtube` (YouTube Downloader)
  - `/downloaders/tiktok` (TikTok Downloader)
  - `/downloaders/vimeo` (Vimeo Downloader)
  - `/downloaders/soundcloud` (SoundCloud Downloader)
- **Tool Landing Pages (`/tools/[category]/[tool]`):** Deep search capture for specific conversion queries:
  - `/tools/video/convert` (Online Video Converter)
  - `/tools/video/compress` (Video Compressor)
  - `/tools/audio/convert` (MP3 Converter)
  - `/tools/image/compress` (Online Image Compressor)
  - `/tools/pdf/merge` (PDF Merger)
  - `/tools/pdf/split` (PDF Splitter)

---

## 2. Technical SEO Implementation

1. **Static Pre-Rendering (SSG):** All 89 platform and tool routes are pre-rendered at build time with Next.js App Router for instant TTFB (<50ms).
2. **Canonical Links:** Every page specifies an explicit canonical tag matching its canonical production URL.
3. **Structured Data:** Built-in schema metadata for tools and applications.
4. **Dynamic Sitemap (`/sitemap.xml`):** Automatically indexes active platforms and catalog tools.
5. **Strict Robots Exclusion (`/robots.txt`):** Private and temporary routes (`/api/*`, `/jobs/*`) are excluded from crawler indexing to protect user privacy and avoid duplicate crawl budget waste.
