# Known Limitations & Honest Disclosure

In accordance with our core product principles, we document verified boundaries rather than making exaggerated claims.

---

## 1. Platform Limitations

1. **Private, Password-Protected & DRM Content:**
   - Perfect Downloader does not bypass DRM (Widevine, FairPlay, PlayReady) or access password-protected / members-only streams.
   - Private Instagram accounts, private Facebook groups, members-only YouTube videos, and paid Vimeo On-Demand videos are not accessible.

2. **Live Streams:**
   - Real-time live streams (Twitch live, YouTube live, TikTok live) require unbounded streaming pipes and are excluded from standard download workflows. Past broadcasts (VODs) and clips are supported.

3. **Encrypted Messaging Platforms (WhatsApp, Discord, Signal, LINE, WeChat):**
   - End-to-end encrypted messaging systems do not expose public web media pages. These platforms are explicitly marked **Unavailable** in the registry.

4. **Platform Watermarks:**
   - If a source platform embeds a permanent burned-in watermark into the video bitstream (e.g. TikTok standard video feed), we do not automatically modify or crop the author's work without permission.

---

## 2. Technical & Hardware Limits

1. **Upload Size Threshold:**
   - Free guest uploads for media tools are capped at 200MB per file to prevent worker memory exhaustion.
2. **Subprocess Concurrency:**
   - Video encoding is CPU intensive. When multiple concurrent conversions exceed available cores, jobs queue until worker slots become available.
3. **Temporary Retention:**
   - All job results expire 15 minutes after completion. Users must download their files within this window.
