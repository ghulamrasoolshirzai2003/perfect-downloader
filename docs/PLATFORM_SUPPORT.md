# Platform Support & Policy Registry

## 1. Operating Policies

To protect the service, users, and creator rights:
1. **Open-License Platforms (`policy: open`):** Platforms hosting Creative Commons, public domain, or open-licensed works are enabled by default.
2. **Restricted Platforms (`policy: restricted`):** Platforms whose general terms of service restrict automated scraping or downloading outside native apps are disabled by default.
3. **Operator Opt-In (`ENABLED_RESTRICTED_PLATFORMS`):** The server operator may opt in to enable restricted platform adapters after conducting independent legal and risk analysis for their jurisdiction.
4. **User Attestation:** When an enabled restricted platform is used, the user must explicitly confirm via attestation checkbox that they are the content creator or possess express permission from the rights holder.

---

## 2. Platform Status Matrix

| Platform | Category | Policy | Status | Supported Operations | Known Limitations | Last Verified |
|---|---|---|---|---|---|---|
| **Internet Archive** | Archive | Open | **Available** | Video, Audio, Thumbnails | Large collections return primary media item only | 2026-11-12 |
| **Wikimedia Commons** | Archive | Open | **Available** | Video, Audio, Subtitles | Individual `File:` pages supported | 2026-11-12 |
| **PeerTube** | Video | Open | **Limited** | Video, Audio, Subtitles | Instance allowlisting applies; creator download permissions respected | 2026-11-12 |
| **YouTube** | Video | Restricted | **Restricted / Opt-in** | Video, Audio, Subtitles | Requires JS runtime; age-restricted/members-only/live not supported | 2026-11-12 |
| **TikTok** | Social | Restricted | **Restricted / Opt-in** | Video, Audio | Slideshows not supported; original watermarks preserved | 2026-11-12 |
| **Instagram** | Social | Restricted | **Restricted / Opt-in** | Video, Audio | Public posts only; private accounts and stories not supported | 2026-11-12 |
| **Facebook** | Social | Restricted | **Restricted / Opt-in** | Video, Audio | Public videos & reels only; groups not supported | 2026-11-12 |
| **X (Twitter)** | Social | Restricted | **Restricted / Opt-in** | Video, Audio | Public video posts only; broadcasts/spaces not supported | 2026-11-12 |
| **Reddit** | Social | Restricted | **Restricted / Opt-in** | Video, Audio | v.redd.it hosted videos only | 2026-11-12 |
| **Vimeo** | Video | Restricted | **Restricted / Opt-in** | Video, Audio | Private/on-demand/password videos unsupported | 2026-11-12 |
| **SoundCloud** | Music | Restricted | **Restricted / Opt-in** | Audio, Thumbnails | Public single tracks only; Go+ tracks unsupported | 2026-11-12 |
| **Bandcamp** | Music | Restricted | **Restricted / Opt-in** | Audio, Thumbnails | Public stream quality; purchase for lossless master | 2026-11-12 |
| **Dailymotion** | Video | Restricted | **Restricted / Opt-in** | Video, Audio | Standard public clips | 2026-11-12 |
| **Twitch** | Video | Restricted | **Restricted / Opt-in** | Video Clips, VODs | Past broadcasts & clips only; live streams excluded | 2026-11-12 |
| **Pinterest** | Social | Restricted | **Restricted / Opt-in** | Video Pins | Video pins only; image pins planned | 2026-11-12 |
| **Bluesky** | Social | Restricted | **Restricted / Opt-in** | Video Posts | Video posts only | 2026-11-12 |
| **Threads** | Social | N/A | **Planned** | None | No maintained extractor available | Planned |
| **WhatsApp / Discord** | Messaging | N/A | **Unavailable** | None | Private encrypted messaging; no public media URLs | Unavailable |
