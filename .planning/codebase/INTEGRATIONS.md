# External Integrations

**Analysis Date:** 2026-03-20

## APIs & External Services

**Email Delivery:**
- Resend - Transactional email (email verification, password reset)
  - SDK/Client: `resend` npm package, used in `backend/src/email/email.service.ts`
  - Auth: `RESEND_API_KEY` env var
  - From address: `Figly <onboarding@resend.dev>`
  - Templates: React Email components rendered at `backend/src/email/templates/`

**OAuth Providers:**
- Google OAuth 2.0 - Social login
  - SDK/Client: `passport-google-oauth20` via `@nestjs/passport`
  - Strategy: `backend/src/auth/strategies/google.strategy.ts`
  - Auth vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Callback URL: `GOOGLE_CALLBACK_URL` (default: `http://localhost:4000/api/auth/google/callback`)
  - Scopes: `email`, `profile`

- Apple Sign-In - Social login
  - SDK/Client: `passport-apple` via `@nestjs/passport`
  - Strategy: `backend/src/auth/strategies/apple.strategy.ts`
  - Auth vars: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
  - Callback URL: `APPLE_CALLBACK_URL` (default: `http://localhost:4000/api/auth/apple/callback`)
  - Scopes: `name`, `email`
  - Note: Apple only provides user name on first login

## Data Storage

**Databases:**
- PostgreSQL 16 (Alpine) - Primary relational database
  - Connection: `DATABASE_URL` env var (format: `postgresql://user:pass@host:port/db`)
  - Client: Prisma 6.4 (`@prisma/client`)
  - Schema: `backend/prisma/schema.prisma`
  - Migrations: `backend/prisma/migrations/`
  - Local dev: Docker container `figly-postgres` via `docker-compose.yml`

**File/Object Storage:**
- MinIO (dev) / AWS S3-compatible (prod) - Media files (images, videos, thumbnails)
  - SDK/Client: `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
  - Service: `backend/src/media/storage.service.ts`
  - Config vars: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
  - Default bucket: `figly-media`
  - Uses `forcePathStyle: true` for MinIO compatibility
  - Presigned URLs supported for secure downloads
  - Bucket structure: `originals/`, `thumbnail/`, `medium/`, `large/`, `transcoded/`, `thumbnails/`
  - Local dev: Docker container `figly-minio` with admin console on port 9001

**Caching / Job Queue Broker:**
- Redis 7 (Alpine) - BullMQ job queue broker for async media processing
  - Connection: `REDIS_URL` env var (format: `redis://host:port`)
  - Client: `bullmq` + `@nestjs/bullmq`
  - Queue: `media-processing` queue defined in `backend/src/media/media.module.ts`
  - Local dev: Docker container `figly-redis`

## Authentication & Identity

**Auth Strategy:**
- JWT-based with HTTP-only cookie refresh tokens
  - Access token: short-lived JWT, `JWT_ACCESS_SECRET`
  - Refresh token: longer-lived JWT stored as HTTP-only cookie, `JWT_REFRESH_SECRET`
  - Strategies: `backend/src/auth/strategies/jwt.strategy.ts`, `backend/src/auth/strategies/jwt-refresh.strategy.ts`
  - Local strategy: `backend/src/auth/strategies/local.strategy.ts` (email + password)
  - Password hashing: argon2

- Frontend handles silent token refresh via Axios interceptor in `frontend/src/lib/api-client.ts`
  - On 401, automatically calls `/api/auth/refresh` before retrying original request
  - Queue pattern prevents duplicate refresh calls on concurrent 401s

**Session/State:**
- Refresh tokens stored hashed in `refresh_tokens` table (Prisma model)
- Auth store client-side state managed by Zustand at `frontend/src/stores/auth-store.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Datadog, or similar SDK found)

**Logs:**
- NestJS built-in `Logger` used throughout backend modules
- No structured logging library (e.g., winston, pino) detected
- Rate limiting: `@nestjs/throttler` - global guard, 100 req/min short, 5 req/min for login

## CI/CD & Deployment

**Hosting:**
- Docker-based deployment; single container `figly-app` built from root `Dockerfile`
- Runs both frontend (port 3000) and backend (port 4000) via `docker-entrypoint.sh`
- No cloud-specific deployment config detected (no Vercel, Railway, Fly.io configs at root)

**CI Pipeline:**
- Not detected (no `.github/workflows/`, `.gitlab-ci.yml`, or similar found)

## Media Processing Pipeline

**Image Processing:**
- `sharp` 0.34 - Resize to thumbnail/medium/large + convert to WebP (quality 80)
- Async via BullMQ: `backend/src/media/media.processor.ts`
- Queue: `media-processing`

**Video Processing (Reels):**
- `fluent-ffmpeg` 2.1 + `@ffprobe-installer/ffprobe` 2.1
- Transcode to H.264 baseline, AAC 128k, max 720p, MP4 with faststart
- Thumbnail extraction from first frame at 720px width
- Async via BullMQ same queue/processor
- Temp files written to `/tmp` during processing, cleaned up after

## Environment Configuration

**Required env vars (Backend):**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET` - Object storage
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - JWT signing secrets
- `RESEND_API_KEY` - Email delivery
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` - Google OAuth
- `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `APPLE_CALLBACK_URL` - Apple Sign-In
- `FRONTEND_URL` - CORS origin and email link base URL
- `PORT` - Backend HTTP port (default: 4000)

**Required env vars (Frontend):**
- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: `http://localhost:4000/api`)

**Secrets location:**
- Dev: `.env` at `backend/.env` and repo root `.env` (both present, not committed)
- Example templates: `.env.example` at repo root and `frontend/.env.example`

## Webhooks & Callbacks

**Incoming (OAuth Callbacks):**
- `GET/POST /api/auth/google/callback` - Google OAuth redirect
- `POST /api/auth/apple/callback` - Apple Sign-In redirect (POST per Apple spec)

**Outgoing:**
- None detected

---

*Integration audit: 2026-03-20*
