# Privacy & Zero-Retention Policy

## 1. Core Commitment

Perfect Downloader is architected as an **ephemeral utility service**. We do not operate a media library, user database, or content index.

---

## 2. Retention Architecture

| Data Type | Storage Location | Retention Lifetime | Destruction Method |
|---|---|---|---|
| **Downloaded Media** | Temporary disk cache (`.tmp/media/dl_*`) | Maximum 15 minutes | Automated unlinks via `TempStorageManager.sweepDisk()` |
| **Processed Tool Files** | Temporary disk cache (`.tmp/media/conv_*`) | Maximum 15 minutes | Automated unlinks via `TempStorageManager.sweepDisk()` |
| **Uploaded User Files** | Temporary disk cache (`.tmp/media/upload_*`) | Immediate post-processing (under 60s) | Unlinked as soon as processing completes |
| **Job Metadata** | In-memory `JobStore` | 15 minutes | Evicted and garbage collected on sweep |
| **URL Parameters** | None (logged as hostname only) | Ephemeral / not persisted | Full URLs with tokens or private keys are never logged |
| **User Accounts** | None required | N/A | Guest access is default; no accounts are collected |

---

## 3. Logging & Telemetry Principles

- **No Full URL Logging:** The server logs only the target hostname (e.g. `archive.org` or `commons.wikimedia.org`). Private query parameters, signed tokens, and personal identifiers are stripped prior to log emission.
- **No IP Address Archiving:** Operational rate limits use in-memory sliding windows with 1-minute TTLs. No persistent historical IP logs are kept.
- **No Third-Party Analytics:** The frontend contains no third-party trackers, ad cookies, or behavioral beacons.
