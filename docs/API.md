# REST API Specification — Perfect Downloader v0.1.0

Base URL: `http://localhost:4000` (or `/api/v1` when proxied through Next.js)  
Interactive OpenAPI UI: `http://localhost:4000/docs`

---

## 1. System Endpoints

### `GET /health`
Returns service availability status.
```json
{
  "status": "ok",
  "timestamp": "2026-11-12T01:45:00.000Z"
}
```

### `GET /api/v1/capabilities`
Returns active hardware capabilities, installed FFmpeg encoders, Sharp image formats, and PDF capabilities.

### `GET /api/v1/platforms`
Returns the public platform capability registry with active statuses, policies, and attestation flags.

### `GET /api/v1/stats`
Returns active and completed job counts, service uptime, and storage location.

---

## 2. Downloader Endpoints

### `POST /api/v1/inspect`
Inspects a media URL safely and returns stream formats, resolutions, duration, and metadata.

**Request:**
```json
{
  "url": "https://archive.org/details/BigBuckBunny_124"
}
```

**Response (200 OK):**
```json
{
  "data": {
    "url": "https://archive.org/details/BigBuckBunny_124",
    "canonicalUrl": "https://archive.org/details/BigBuckBunny_124",
    "platform": {
      "id": "archive",
      "name": "Internet Archive",
      "category": "archive",
      "status": "available",
      "policy": "open",
      "requiresAttestation": false
    },
    "title": "Big Buck Bunny",
    "duration": 596,
    "thumbnail": "https://archive.org/services/img/BigBuckBunny_124",
    "formats": [
      {
        "formatId": "1",
        "ext": "mp4",
        "resolution": "640x360",
        "qualityLabel": "360p",
        "filesize": 61878609,
        "hasVideo": true,
        "hasAudio": true,
        "isAudioOnly": false
      }
    ],
    "subtitles": []
  }
}
```

### `POST /api/v1/download`
Enqueues a background media download or stream job.

**Request:**
```json
{
  "url": "https://archive.org/details/BigBuckBunny_124",
  "formatId": "1",
  "attestation": true,
  "targetFormat": "original"
}
```

**Response (202 Accepted):**
```json
{
  "job": {
    "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "type": "download",
    "status": "queued",
    "createdAt": "2026-11-12T01:45:00.000Z",
    "updatedAt": "2026-11-12T01:45:00.000Z",
    "expiresAt": "2026-11-12T02:00:00.000Z"
  }
}
```

### `GET /api/v1/jobs/:id`
Polls job status and progress percentage.

### `GET /api/v1/jobs/:id/download`
Streams the finished media file with `Content-Disposition: attachment; filename="..."`.

---

## 3. Media Toolkit Endpoints

### `POST /api/v1/tools/:category/:action`
Executes a file-based media tool via `multipart/form-data`.

**Route Examples:**
- `POST /api/v1/tools/video/convert`
- `POST /api/v1/tools/video/compress`
- `POST /api/v1/tools/audio/convert`
- `POST /api/v1/tools/image/compress`
- `POST /api/v1/tools/pdf/merge`
- `POST /api/v1/tools/pdf/split`

**Form Parts:**
- `files`: One or more files matching `tool.accepts` (max 200MB).
- `[optionName]`: Form parameters defined in the tool's field catalog.
