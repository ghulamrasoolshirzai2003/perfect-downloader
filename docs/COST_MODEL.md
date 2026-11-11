# Operational Cost Model & Resource Consumption

## 1. Cost Realities of Online Media Platforms

Although Perfect Downloader operates under a **zero-permanent-storage** model, processing video, audio, and images incurs real compute and bandwidth costs:

1. **Inbound & Outbound Bandwidth:**
   - 1080p video downloads average 20MB - 120MB per minute of video.
   - 10,000 daily video downloads at an average of 50MB consume ~500 GB bandwidth/day (~15 TB/month).
   - Direct-stream delivery (when permitted by the source) bypasses backend bandwidth entirely.

2. **Compute (CPU / RAM):**
   - Stream inspection (`yt-dlp -J`): Low CPU, ~30MB RAM, duration ~1-3 seconds.
   - Video re-encoding (e.g. H.264 / VP9): High CPU (100% of 2-4 cores), duration ~0.2x to 0.5x real time.
   - Streamcopy / muxing (e.g. video trimming or audio track extraction without re-encode): Very low CPU, purely I/O bound.
   - Image conversion (Sharp/libvips): Very fast (~20-100ms per image), ~50MB RAM.
   - PDF operations (@cantoo/pdf-lib): Pure JS/WASM, ~30-100MB RAM, ~100-300ms per document.

---

## 2. Infrastructure Sizing Guidelines

| Monthly Active Users (MAU) | Daily Jobs | Recommended CPU | Recommended RAM | Bandwidth Provisioning |
|---|---|---|---|---|
| **Tier 1 (Bootstrapped)** | 1,000 | 2 vCPU | 4 GB | 500 GB / month |
| **Tier 2 (Growth)** | 10,000 | 4 - 8 vCPU | 8 - 16 GB | 5 TB / month |
| **Tier 3 (Production Scale)** | 100,000+ | Auto-scaling worker pool | 32 GB+ cluster | CDN edge offload |

---

## 3. Cost-Optimization Tactics

1. **Prefer Direct Delivery:** When the source platform provides a signed, direct CDN URL, deliver that directly rather than relaying the stream through the backend.
2. **Streamcopy Defaults:** When users trim video or extract audio, default to streamcopy (`-c copy`) whenever keyframe alignment allows, reducing CPU usage by 95%.
3. **Aggressive Ephemeral Cleanup:** Sweep temporary files every 2 minutes with a 15-minute TTL to keep NVMe SSD usage bounded and prevent disk exhaustion.
