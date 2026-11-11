# Operations & Site Reliability Guide

## 1. Health Checks & Monitoring

- **Liveness Endpoint:** `GET /health` returns HTTP 200 with service timestamp.
- **Capabilities & Hardware Telemetry:** `GET /api/v1/capabilities` reports active encoders, CPU count, and platform OS.
- **Operational Metrics:** `GET /api/v1/stats` returns active jobs, total jobs processed, and storage base directory.
- **Public Health Dashboard:** Hosted directly at `/status` on the web application.

---

## 2. Emergency Operational Playbook

### 2.1 Disabling a Problematic Platform Adapter
If an external platform changes its API or anti-bot defenses, or if legal notice is received:
1. Set the environment variable:
   ```bash
   DISABLED_PLATFORMS=platform_id
   ```
2. Restart the API service or trigger a rolling reload. The platform will immediately report `status: 'unavailable'` and reject inspection or download attempts without crashing the rest of the application.

### 2.2 Enabling Restricted Platforms (Operator Opt-in)
To enable restricted platforms after legal review:
```bash
ENABLED_RESTRICTED_PLATFORMS=youtube,tiktok,instagram,vimeo
```

### 2.3 Clearing Stale Disk Cache Manually
If disk space on the temp volume falls below safe thresholds (e.g. under 10GB free):
```bash
# In the container or host
find .tmp/media -type f -mmin +15 -delete
```
Note: The built-in `TempStorageManager` already performs this sweep automatically every 2 minutes.
