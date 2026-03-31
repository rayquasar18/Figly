# Technology Stack

**Analysis Date:** 2026-03-20

## Languages

**Primary:**
- TypeScript 5.7 - All frontend, backend, and shared package code

**Secondary:**
- CSS (Tailwind) - Frontend styling via utility classes

## Runtime

**Environment:**
- Node.js 20 (Alpine) - Docker image base; local version v25.8.0

**Package Manager:**
- pnpm 9.15.9
- Lockfile: `pnpm-lock.yaml` present at repo root

## Monorepo

**Orchestrator:**
- Turborepo 2.4 - Task orchestration, build caching, parallel execution
- Config: `turbo.json` at repo root
- Workspaces: `frontend`, `backend`, `packages/shared`

## Frameworks

**Frontend:**
- Next.js 14.2 - App Router, server components, TypeScript - `frontend/`
- React 18.3 - UI library

**Backend:**
- NestJS 10.4 - Modular Node.js framework - `backend/src/`
- Express platform via `@nestjs/platform-express`

**Shared Package:**
- `@figly/shared` - Internal workspace package with DTOs, types, constants - `packages/shared/`
- Built with TypeScript compiler; consumed by both frontend and backend

**Testing (Backend):**
- Jest 29.7 - Test runner
- ts-jest 29.2 - TypeScript transform for Jest
- `@nestjs/testing` - NestJS test utilities
- supertest 7.2 - HTTP integration testing
- Config: `backend/jest.config.ts`

**Build/Dev:**
- Turbo - Orchestrates `build`, `dev`, `lint`, `test` across workspaces
- NestJS CLI 10.4 - Backend build/watch via `nest build` / `nest start --watch`
- ts-node 10.9 - For Prisma seed scripts

## Key Dependencies

**Critical (Backend):**
- `@prisma/client` 6.4 + `prisma` 6.4 - Database ORM and schema management
- `@nestjs/jwt` 11.0 + `passport-jwt` 4.0 - JWT authentication
- `@nestjs/bullmq` 11.0 + `bullmq` 5.71 - Redis-backed job queue for async media processing
- `argon2` 0.44 - Password hashing
- `@aws-sdk/client-s3` 3.1008 + `@aws-sdk/s3-request-presigner` 3.1008 - S3-compatible object storage (MinIO in dev, AWS S3 in prod)
- `sharp` 0.34 - Server-side image processing (resize, WebP conversion)
- `fluent-ffmpeg` 2.1 + `@ffprobe-installer/ffprobe` 2.1 - Video transcoding (H.264, AAC)
- `resend` 6.9 - Transactional email delivery
- `@react-email/components` 1.0 - React-based email templates rendered server-side
- `@nestjs/throttler` 6.3 - Rate limiting
- `class-validator` 0.15 + `class-transformer` 0.5 - Request DTO validation
- `passport-google-oauth20` 2.0 + `passport-apple` 2.0 - OAuth strategies
- `multer` 2.1 - Multipart file upload handling
- `cookie-parser` 1.4 - HTTP cookie parsing (for JWT refresh token cookies)
- `zod` 3.24 - Schema validation (shared DTOs)

**Critical (Frontend):**
- `@tanstack/react-query` 5.62 - Server state management and caching
- `zustand` 5.0 - Client-side state management (auth store, create-post/reel store)
- `axios` 1.7 - HTTP client with interceptors for silent JWT refresh
- `react-hook-form` 7.71 + `@hookform/resolvers` 3.10 - Form state and validation
- `zod` 3.25 - Schema validation shared with backend
- `@radix-ui/*` - Unstyled accessible UI primitives (alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, popover, progress, scroll-area, separator, slot, switch, tabs, toast)
- `tailwindcss` 3.4 + `tailwindcss-animate` 1.0 - Utility-first styling
- `class-variance-authority` 0.7 + `clsx` 2.1 + `tailwind-merge` 2.6 - Component variant utilities
- `lucide-react` 0.468 - Icon library
- `next-themes` 0.4 - Dark/light mode support
- `sonner` 2.0 - Toast notification system
- `embla-carousel-react` 8.6 - Post/reel carousel
- `react-easy-crop` 5.5 - In-browser image cropping
- `date-fns` 4.1 - Date formatting

## Configuration

**Environment (Backend):**
- Config module at `backend/src/config/configuration.ts` - loads from `.env`
- `.env.example` at repo root documents all required variables
- Key required vars: `DATABASE_URL`, `REDIS_URL`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `FRONTEND_URL`, `PORT`
- `.env` present at `backend/.env` and repo root `.env`

**Environment (Frontend):**
- `.env.local` at `frontend/.env.local`
- `.env.example` at `frontend/.env.example`
- Only one public variable: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:4000/api`)

**Build:**
- Backend: `backend/tsconfig.json` + `backend/tsconfig.build.json` + `backend/nest-cli.json`
- Frontend: `frontend/tsconfig.json` + `frontend/next.config.js` + `frontend/tailwind.config.ts` + `frontend/postcss.config.js`
- Shared: `packages/shared/tsconfig.json`, outputs to `packages/shared/dist/`

## Platform Requirements

**Development:**
- Docker + Docker Compose for local Postgres 16, Redis 7, MinIO services
- `docker-compose.yml` at repo root spins up: `figly-postgres`, `figly-redis`, `figly-minio` + bucket init
- pnpm 9.15.9 (enforced via `packageManager` field)
- Node.js 20

**Production:**
- Docker single-container build via root `Dockerfile` (builds both frontend + backend, exposes ports 3000 and 4000)
- `docker-entrypoint.sh` starts both processes
- PostgreSQL, Redis, MinIO (or AWS S3) required as external services

---

*Stack analysis: 2026-03-20*
