# Security Model & Threat Assessment

**Classification:** High-Risk Web & Subprocess Architecture  
**Scope:** Processing Untrusted User-Supplied URLs and Media Files

---

## 1. Threat Vectors & Mitigations

### 1.1 Server-Side Request Forgery (SSRF) & DNS Rebinding
- **Threat:** Malicious users submit URLs pointing to internal services (e.g. `http://169.254.169.254/latest/meta-data/` or `http://127.0.0.1:4000/internal`), attempting to turn the server into an unrestricted proxy or extract cloud IAM credentials.
- **Mitigation:**
  - Strict syntactic URL validation: only `http:` and `https:`, no embedded credentials, standard ports 80/443 only.
  - IP address literals and local hostnames (`localhost`, `*.internal`, `*.local`) are rejected immediately.
  - All hostnames are pre-resolved via DNS. Every returned IP address is inspected using `ipaddr.js` to ensure it does not fall into loopback, private RFC1918, link-local, carrier-grade NAT, or cloud metadata ranges.
  - Strict yt-dlp arguments: `--use-extractors` is always specified using only the platform's allowlisted extractor names. The generic extractor is never permitted to follow arbitrary redirects.

### 1.2 Shell Command Injection
- **Threat:** User input (filenames, URLs, transcoding options) passed to system shells allowing arbitrary command execution.
- **Mitigation:**
  - Neither FFmpeg nor yt-dlp is ever invoked through shell interpreters (`cmd.exe`, `sh`, `bash`).
  - All executions strictly use parameterized argument arrays via Node.js `child_process.spawn`.
  - Flags like `--exec`, `--netrc-cmd`, and external downloaders are explicitly disabled in yt-dlp.
  - Transcoding options are validated against a strict Zod schema; unrecognized fields are stripped or rejected.

### 1.3 Path Traversal & Arbitrary File Writes
- **Threat:** Filenames with `../` or absolute paths overwriting sensitive server files.
- **Mitigation:**
  - Original filenames supplied by users are never used for filesystem operations.
  - The `TempStorageManager` generates cryptographically random UUIDs for all temporary files and directories.
  - Absolute paths are validated to ensure they reside strictly within the designated sandboxed `.tmp/media` root.

### 1.4 Decompression Bombs & Resource Exhaustion (DoS)
- **Threat:** Enormously nested archives or high-resolution images exhausting RAM and crashing workers.
- **Mitigation:**
  - Strict upload file size limits (default 200MB).
  - Maximum upload file counts enforced per tool (1 for single tools, up to 20 for batch operations).
  - Sharp restricts input image dimensions to safe pixel thresholds.
  - Hard timeouts enforced on all subprocesses:
    - Metadata inspection: 25 seconds.
    - Media conversions: 120 seconds.
    - Media downloads: 300 seconds.
  - Global API rate limiting (120 requests/minute per IP).

---

## 2. Process & Container Isolation

In production environments (see `Dockerfile` and `docker-compose.yml`):
- Workers execute under an unprivileged `appuser` (UID 10001).
- The root filesystem is mounted read-only, except for the dedicated ephemeral temp volume.
- No cloud credentials or secrets are accessible in the worker environment.
