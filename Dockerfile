FROM node:22-bookworm-slim AS base

# Install system runtime dependencies: ffmpeg, python3, yt-dlp, ca-certificates
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install / update yt-dlp via pip
RUN pip3 install --break-system-packages --no-cache-dir -U yt-dlp

WORKDIR /app

# Copy dependency manifests
COPY package.json tsconfig.base.json vitest.config.ts ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/media-core/package.json ./packages/media-core/
COPY packages/downloader-core/package.json ./packages/downloader-core/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install npm dependencies
RUN npm install --no-audit --no-fund

# Copy source trees
COPY packages/ ./packages/
COPY apps/ ./apps/
COPY docs/ ./docs/
COPY tests/ ./tests/
COPY scripts/ ./scripts/

# Build core packages & web app
RUN npx tsc -b packages/shared packages/media-core packages/downloader-core apps/api apps/web
RUN npm run build -w @pd/web

# Create non-privileged user and temp directory
RUN useradd -m -u 10001 appuser && \
    mkdir -p /app/.tmp/media && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 3000 4000

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

CMD ["sh", "-c", "node apps/api/src/server.ts & npm run start -w @pd/web"]
