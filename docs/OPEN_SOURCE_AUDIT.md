# Open-Source Audit & Dependency Review

**Audit Date:** November 2026  
**Auditor:** Perfect Downloader Engineering Team  
**Review Standard:** Commercial Self-Hosted Distribution & Copyleft Compliance

---

## 1. Summary of Open-Source Adoption Decisions

When distributing self-hosted software, binaries bundled in containers or installers fall under the legal definition of **distribution**.
- Spawning separate command-line binaries (yt-dlp, FFmpeg, qpdf) via safe argument arrays constitutes **mere aggregation** under GPL jurisprudence; it does not infect the proprietary or permissive application codebase.
- Permissive (MIT / Apache-2.0 / BSD) libraries are adopted directly.
- Open-core or AGPL projects with commercial restrictions (Cobalt web, Stirling-PDF proprietary modules) are referenced for architecture but rejected for commercial distribution.

---

## 2. Comprehensive Project Audit Table

| Project | Official Repository | Verified License | Maintenance Status | Purpose in Product | Integration Method | Runtime Dependencies | Commercial Suitability | Security Considerations | Decision | Rationale |
|---|---|---|---|---|---|---|---|---|---|---|
| **yt-dlp** | https://github.com/yt-dlp/yt-dlp | Unlicense (Public Domain) | Highly Active (`2026.10.26`) | URL media extraction for 1000+ sites | CLI subprocess (`-J` JSON) | Python ≥3.10, ffmpeg | Approved. Unlicense is public domain. | SSRF via generic extractor; argument injection via `--exec`. **Mitigation:** strict `--use-extractors`, `--no-exec`, DNS firewall. | **Adopt** | Industry standard media extractor. |
| **cobalt** | https://github.com/imputnet/cobalt | API: AGPL-3.0<br>Web: CC-BY-NC-SA-4.0 | Active (`v11.7.1`) | Downloader API and UI reference | None | Node.js, libav.js | Web UI is Non-Commercial (CC-BY-NC-SA). API requires source disclosure under AGPL. | Untrusted remote fetch. | **Reference Only** | Incompatible licenses for closed/commercial self-hosting. |
| **gallery-dl** | https://github.com/mikf/gallery-dl | GPL-2.0-only | Active (`v1.32.19`) | Image gallery extraction | CLI subprocess | Python ≥3.8 | Allowed as separate CLI aggregate with source offer. | Command injection if user input passed to arguments. | **Adopt (CLI only)** | Best multi-image and gallery crawler. |
| **streamlink** | https://github.com/streamlink/streamlink | BSD-2-Clause | Active (`8.6.3`) | HLS/DASH live stream pipe | CLI subprocess | Python ≥3.10, ffmpeg | Permissive BSD-2. Free for commercial use. | High CPU/network exhaustion. | **Test** | Reserved for future live-stream add-on. |
| **FFmpeg** | https://github.com/FFmpeg/FFmpeg | LGPL-2.1+ (core)<br>GPL-3.0 (with libx264) | Active (`8.1` / `9.0.2`) | Video/audio transcode, GIF, thumbs | CLI subprocess | Static binary | Adopt as CLI aggregate. Windows gyan.dev full_build is GPL-3.0. | Malformed codecs / heap overflows. **Mitigation:** subprocess timeout, sandboxed temp dir. | **Adopt** | Unrivalled multimedia transcode engine. |
| **sharp** | https://github.com/lovell/sharp | Apache-2.0 | Active (`v0.35.5`) | High-speed image conversion & resizing | Node.js native library | libvips (LGPL-3.0 prebuilt) | Allowed. Dynamic linking with LGPL libvips is compliant. | Memory exhaustion on decompression bombs. Sharp has input pixel caps. | **Adopt** | 4-5x faster than ImageMagick; native WebP/AVIF. |
| **libvips** | https://github.com/libvips/libvips | LGPL-2.1 | Active (`v8.18.7`) | Core C image processing engine | Bundled with Sharp | C/C++ runtime | Adopted via Sharp. | Input parsing CVEs. | **Adopt** | Best performance & memory footprint. |
| **ImageMagick** | https://github.com/ImageMagick/ImageMagick | ImageMagick License (Apache-2-like) | Active (`7.1.2-35`) | General image manipulation | CLI subprocess | Ghostscript, libpng, etc. | Permissive license. | Severe CVE history (ImageTragick, Ghostscript RCE). | **Reject for V1** | Sharp fulfills all image needs safely. |
| **gifsicle** | https://github.com/kohler/gifsicle | GPL-2.0 | Maintained (`v1.98`) | GIF lossy optimization & frame slicing | CLI subprocess | Static binary | Allowed as separate CLI aggregate with source offer. | Buffer overflows on crafted GIFs. | **Adopt (CLI only)** | Excellent for lossy GIF optimization. |
| **Stirling-PDF** | https://github.com/Stirling-Tools/Stirling-PDF | Split: MIT + Proprietary | Active (`v3.3.0`) | PDF web tools | API service | Java runtime, LibreOffice | Open-core: `app/proprietary` requires paid enterprise license. | Heavy resource footprint (Java + LibreOffice). | **Reject for V1** | Built on lightweight `@cantoo/pdf-lib` instead. |
| **qpdf** | https://github.com/qpdf/qpdf | Apache-2.0 | Active (`v12.4.2`) | PDF structural linearization & encryption | CLI subprocess | C++ static binary | Permissive Apache-2.0. | Memory limits on crafted PDFs. | **Adopt** | Fast, reliable PDF manipulation. |
| **pdf.js** | https://github.com/mozilla/pdf.js | Apache-2.0 | Active (`v6.5.438`) | In-browser client-side PDF preview | Client JS library | Web browser | Fully permissive. | CVE-2024-4367 font script injection. **Mitigation:** `isEvalSupported: false`. | **Adopt** | Safe client-side PDF viewing. |
| **@cantoo/pdf-lib** | https://github.com/cantoo-scribe/pdf-lib | MIT | Active (`2.11.1`) | PDF merge, split, extract, rotate, images | Node.js library | Pure JS / WASM | Permissive MIT. Actively maintained fork of unmaintained pdf-lib. | Recursion depth limits on nested objects. | **Adopt** | Fast, cross-platform pure JS PDF manipulation. |
| **fastify** | https://github.com/fastify/fastify | MIT | Active (`v5.2.1`) | High-throughput REST API | Node.js framework | Node.js | Fully permissive MIT. | Standard HTTP vulnerabilities. | **Adopt** | 2-3x lower overhead than Express. |
| **next.js** | https://github.com/vercel/next.js | MIT | Active (`v15.5`) | Web frontend & PWA | React framework | Node.js | Fully permissive MIT. | Standard web vulnerabilities. | **Adopt** | Industry leading App Router & SSR. |
