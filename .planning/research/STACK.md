# Technology Stack

**Project:** Figly -- Instagram-like social platform for collectors
**Researched:** 2026-03-13

## Recommended Stack

### Core Framework (Pre-decided)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | ^16.1 | Frontend framework | User decision. SSR/SSG, App Router with Server Components, optimized image handling via `next/image`, file-based routing. Version 16 is current stable. | HIGH (npm verified: 16.1.6) |
| NestJS | ^11.1 | Backend framework | User decision. TypeScript-first, modular architecture with decorators, built-in DI container, excellent ecosystem for WebSockets/queues/auth. Version 11 is current stable. | HIGH (npm verified: 11.1.16) |
| TypeScript | ^5.7 | Shared language | Full-stack type safety. Shared types between Next.js and NestJS. Non-negotiable for a project this size. | HIGH |

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PostgreSQL | 16+ | Primary database | Social media data is deeply relational: users follow users, posts have comments, comments have likes, collections reference items across categories. PostgreSQL handles complex joins, ACID transactions, and has JSONB for semi-structured collection metadata. MongoDB would require denormalization gymnastics for the follower graph, feed generation, and collection cross-references. | HIGH |
| Prisma ORM | ^7.5 | Database access layer | Best TypeScript ORM for NestJS. Auto-generated types from schema, declarative migrations, excellent relation handling. NestJS has first-class Prisma support. Chose over TypeORM because: Prisma has better type safety, simpler migration workflow, and more active development. TypeORM's decorator-based approach has known issues with complex relations and migration reliability. | HIGH (npm verified: 7.5.0) |

**Why NOT MongoDB:**
- Collection tracking requires relational integrity (an item belongs to a category, a user's checklist references shared items, completion status links user + item)
- Social graph (followers/following) is inherently relational with many-to-many joins
- Feed generation with complex ordering (followed users, engagement, recency) needs efficient SQL joins
- PostgreSQL JSONB handles the semi-structured parts (collection item metadata varies by category) without sacrificing relational integrity
- MongoDB would require application-level joins and denormalization that creates consistency headaches

**Why NOT TypeORM:**
- TypeORM migration system is unreliable -- known for generating incorrect migration diffs
- Decorator-based entity definitions have weaker type inference than Prisma's generated client
- Prisma's schema-first approach is cleaner for a greenfield project
- Community momentum and maintenance velocity favor Prisma

### Media Storage & CDN

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| AWS S3 (or S3-compatible: MinIO for dev) | SDK ^3.1008 | Object storage for media files | Industry standard for media storage. Stores original uploads (photos, videos). Cheaper than Cloudinary at scale for a media-heavy social platform. Pay-per-GB vs Cloudinary's transformation-based pricing balloons with social media volume. | HIGH (npm verified: @aws-sdk/client-s3 3.1008.0) |
| CloudFront (AWS CDN) | -- | CDN for media delivery | Same-vendor integration with S3. Edge caching globally. Signed URLs for access control. Alternative: Cloudflare R2 + Cloudflare CDN for lower egress costs. | HIGH |
| Sharp | ^0.34 | Server-side image processing | Fastest Node.js image processor (uses libvips). Generate thumbnails, resize for responsive sizes, strip EXIF data, convert to WebP/AVIF. Process on upload via BullMQ job. | HIGH (npm verified: 0.34.5) |

**Why NOT Cloudinary as primary:**
- Cloudinary's pricing model charges per transformation. For an Instagram-like app with thousands of images daily, costs escalate rapidly
- S3 storage is ~$0.023/GB/month. Cloudinary free tier caps at 25K transformations/month -- one viral user could exhaust this
- S3 + Sharp gives full control over processing pipeline and output formats
- Cloudinary is excellent for prototypes but becomes expensive at production social-media scale

**Media processing pipeline:**
1. User uploads to presigned S3 URL (bypasses backend for large files)
2. S3 event triggers BullMQ job
3. Sharp processes image: generate thumbnail (150x150), medium (640x640), large (1080x1080), all in WebP + AVIF
4. Processed variants stored back in S3 with predictable key pattern
5. CloudFront serves with cache headers

### Video Processing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| FFmpeg (via fluent-ffmpeg) | ^2.1 | Video transcoding for reels/stories | Industry standard video processor. Transcode to HLS for adaptive streaming, generate video thumbnails, extract first frame for previews, enforce duration limits (stories: 15s, reels: 90s). | MEDIUM (npm verified: fluent-ffmpeg 2.1.3; FFmpeg itself must be installed on server) |

**Video pipeline:**
1. Upload original to S3
2. BullMQ job picks up, downloads to temp storage
3. FFmpeg transcodes to multiple qualities (480p, 720p, 1080p) in HLS format
4. HLS segments + manifest uploaded to S3
5. CloudFront serves HLS for adaptive playback
6. `hls.js` on frontend for playback in browser

**Note:** Video processing is CPU-intensive. Consider dedicated worker instances or offloading to AWS MediaConvert for production scale. Flag for deeper research in video-heavy phase.

### Real-time Communication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Socket.IO (via @nestjs/platform-socket.io) | ^4.8 / ^11.1 | WebSocket transport for notifications, DM, presence | NestJS has first-class Socket.IO support via `@nestjs/websockets` + `@nestjs/platform-socket.io`. Socket.IO provides automatic fallback to long-polling, room-based broadcasting (per-user notification channels, DM rooms), reconnection handling, and binary support. | HIGH (npm verified: socket.io 4.8.3, @nestjs/platform-socket.io 11.1.16) |
| Redis adapter (@socket.io/redis-adapter) | latest | Multi-instance Socket.IO scaling | When running multiple NestJS instances behind a load balancer, Redis adapter ensures WebSocket events reach the correct server. Required for horizontal scaling. | HIGH |

**Why NOT raw WebSocket (ws):**
- NestJS Gateway decorators work seamlessly with Socket.IO
- Socket.IO handles reconnection, fallback, and room management out of the box
- Raw `ws` requires building all this infrastructure manually
- The abstraction cost of Socket.IO is negligible for this use case

**What uses real-time:**
- Notifications (new follower, like, comment) -- push to user's notification channel
- Direct messaging -- real-time chat in DM rooms
- Online presence indicators -- who's active now
- Story views -- real-time view count updates

### Search

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Meilisearch | v1.x (server) / ^0.55 (JS client) | Full-text search for users, posts, collections, items | Faster setup than Elasticsearch, typo-tolerant out of the box, excellent for user-facing search. Simpler to operate (single binary) vs Elasticsearch cluster. Built-in faceting perfect for filtering collections by category, brand, year. Sub-50ms search responses. | MEDIUM (npm verified: meilisearch 0.55.0) |

**Why NOT Elasticsearch:**
- Elasticsearch is overkill for this use case. Figly needs user search, post search, and collection item search -- not log aggregation or complex analytics
- Elasticsearch requires JVM, cluster management, and significantly more ops overhead
- Meilisearch's typo tolerance and instant search are perfect for "search as you type" in Explore
- Meilisearch uses less memory and is easier to self-host

**Why NOT PostgreSQL full-text search:**
- PostgreSQL `tsvector` works for basic search but lacks typo tolerance, relevance tuning, and faceted filtering
- For a product where search is a core feature (Explore page, collection item lookup), dedicated search is worth it
- Start with PostgreSQL LIKE/tsvector for MVP, migrate to Meilisearch when search becomes a priority feature

**Search sync strategy:**
- Prisma middleware or database triggers push changes to Meilisearch
- Alternatively, BullMQ job syncs on create/update/delete

### Caching

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Redis (via ioredis) | ^5.10 | Caching, session store, rate limiting, pub/sub, BullMQ backend | Swiss army knife. Single Redis instance serves caching, Socket.IO adapter, BullMQ job queue, rate limiting counters, and session storage. ioredis is the most reliable Node.js Redis client with cluster support. | HIGH (npm verified: ioredis 5.10.0) |
| @nestjs/cache-manager | ^3.1 | NestJS cache integration | Decorator-based caching (`@CacheInterceptor`) for API responses. Uses cache-manager under the hood with Redis store. | HIGH (npm verified: 3.1.0) |

**Cache strategy:**
- **Feed cache:** Cache computed feed per user (invalidate on new post from followed user)
- **User profile cache:** Cache follower/following counts, recent posts
- **Collection items:** Cache shared collection databases (rarely change)
- **Session data:** Store JWT refresh tokens, active sessions
- **Rate limiting:** Track API calls per user with Redis counters + TTL

### Authentication & Authorization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| @nestjs/passport | ^11.0 | Auth strategy framework | NestJS's official auth integration. Passport.js strategies for local (email/password) and OAuth (Google, Facebook, Apple). | HIGH (npm verified: 11.0.5) |
| @nestjs/jwt | ^11.0 | JWT token generation/validation | Stateless auth tokens for API access. Access token (short-lived, 15min) + Refresh token (long-lived, 7d, stored in Redis). | HIGH (npm verified: 11.0.2) |
| passport-jwt | ^4.0 | JWT strategy for Passport | Validates JWT tokens on protected routes. | HIGH (npm verified: 4.0.1) |
| argon2 | ^0.44 | Password hashing | More secure than bcrypt. Resistant to GPU/ASIC attacks. Winner of Password Hashing Competition. Slightly harder to install (native addon) but worth the security improvement. | HIGH (npm verified: 0.44.0) |

**Auth flow:**
1. **Registration:** Email + password (hashed with argon2) or OAuth (Google/Facebook)
2. **Login:** Returns access_token (JWT, 15min TTL) + refresh_token (opaque, stored in Redis, 7d TTL)
3. **API calls:** Bearer token in Authorization header, validated by Passport JWT guard
4. **Token refresh:** POST /auth/refresh with refresh_token cookie, returns new access_token
5. **Logout:** Invalidate refresh_token in Redis

**Why NOT NextAuth/Auth.js on frontend:**
- Auth logic belongs in NestJS backend for this architecture. NextAuth is designed for Next.js API routes, but Figly's backend is a separate NestJS service
- NestJS handles all API auth, OAuth callbacks, and session management
- Next.js frontend simply stores and sends JWT tokens
- Mixing Auth.js + NestJS JWT creates unnecessary complexity

**Why argon2 over bcrypt:**
- argon2 is the recommended modern password hashing algorithm (PHC winner)
- Memory-hard: resistant to GPU cracking attacks that bcrypt is vulnerable to
- Configurable memory/time/parallelism parameters

### Message Queue

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| BullMQ | ^5.71 | Async job processing | NestJS has official `@nestjs/bullmq` integration. Uses Redis as backend (already in stack). Handles: image processing, video transcoding, notification delivery, search index sync, email sending. | HIGH (npm verified: 5.71.0) |
| @nestjs/bullmq | ^11.0 | NestJS BullMQ integration | Decorator-based processors (`@Processor`), queue injection, built-in scheduling for recurring jobs. | HIGH (npm verified: 11.0.4) |

**Queue design:**
- `image-processing` -- thumbnail generation, format conversion (Sharp)
- `video-processing` -- transcoding, HLS generation (FFmpeg)
- `notifications` -- push notification delivery, email notifications
- `search-sync` -- sync data changes to Meilisearch
- `feed-generation` -- compute/invalidate user feeds
- `cleanup` -- scheduled job for expired stories, temp files

**Why NOT RabbitMQ:**
- BullMQ uses Redis which is already in the stack (no additional infrastructure)
- NestJS has first-class BullMQ support with decorators
- RabbitMQ adds operational complexity (Erlang runtime, management UI, clustering)
- BullMQ handles all Figly's needs: delayed jobs, retries, rate limiting, scheduled jobs

### Frontend Supporting Libraries

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| Tailwind CSS | ^4.2 | Utility-first styling | Rapid UI development, consistent design system, excellent for responsive design. v4 has significant improvements in performance and configuration. | HIGH (npm verified: 4.2.1) |
| TanStack Query | ^5.90 | Server state management | Handles API data fetching, caching, background refetching, optimistic updates. Perfect for feed pagination, infinite scroll. Replaces manual useEffect + useState patterns. | HIGH (npm verified: 5.90.21) |
| Zustand | ^5.0 | Client state management | Lightweight (1KB), simple API for client-only state (UI state, modals, camera state). Not for server data -- that's TanStack Query's job. | HIGH (npm verified: 5.0.11) |
| Framer Motion | ^12.36 | Animations and gestures | Page transitions, story/reel swiping, like animations (heart pop), modal transitions. Instagram-level UX requires smooth animations. | HIGH (npm verified: 12.36.0) |
| Swiper | ^12.1 | Carousel/slider component | Stories carousel, image gallery swipe. Touch-optimized, performant. | HIGH (npm verified: 12.1.2) |
| next/image | built-in | Image optimization | Automatic WebP/AVIF conversion, lazy loading, responsive srcsets. Use for all user-facing images. | HIGH |
| hls.js | latest | HLS video playback | Plays HLS adaptive streams in browsers that don't natively support it. Required for reel/story video playback. | MEDIUM |

### Backend Supporting Libraries

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| class-validator | ^0.15 | Request validation | Decorator-based DTO validation. Integrates with NestJS pipes for automatic request validation. | HIGH (npm verified: 0.15.1) |
| class-transformer | ^0.5 | Object transformation | Transform plain objects to class instances. Works with class-validator for DTO transformation. | HIGH (npm verified: 0.5.1) |
| @nestjs/swagger | ^11.2 | API documentation | Auto-generated OpenAPI docs from decorators. Essential for frontend-backend contract. | HIGH (npm verified: 11.2.6) |
| @nestjs/throttler | ^6.5 | Rate limiting | Protect API endpoints from abuse. Configurable per-route limits. Uses Redis for distributed rate limiting. | HIGH (npm verified: 6.5.0) |
| helmet | ^8.1 | HTTP security headers | Sets security headers (CSP, HSTS, etc.). One-line middleware setup. | HIGH (npm verified: 8.1.0) |
| multer | ^2.1 | File upload handling | NestJS uses multer under the hood for multipart form data. For large files, prefer presigned S3 URLs instead. | HIGH (npm verified: 2.1.1) |
| @nestjs/config | ^4.0 | Environment configuration | Typed configuration with validation. Loads from .env files. | HIGH (npm verified: 4.0.3) |

### Infrastructure & Deployment

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Docker + Docker Compose | Containerization | Consistent dev/staging/prod environments. Compose for local dev with PostgreSQL, Redis, Meilisearch. | HIGH |
| AWS ECS Fargate (or Railway/Render for MVP) | Container orchestration | Serverless containers, auto-scaling. Start with Railway/Render for simplicity, migrate to ECS for production scale. | MEDIUM |
| AWS S3 + CloudFront | Media storage + CDN | As discussed above. Alternative: Cloudflare R2 + Cloudflare CDN for lower egress costs. | HIGH |
| AWS RDS PostgreSQL | Managed database | Automated backups, read replicas, point-in-time recovery. Alternative: Supabase or Neon for managed PostgreSQL with generous free tiers. | MEDIUM |
| Redis Cloud (or AWS ElastiCache) | Managed Redis | For production. Development uses Docker Redis. | MEDIUM |
| Meilisearch Cloud (or self-hosted) | Managed search | Meilisearch Cloud removes ops burden. Self-host on same VPC for cost savings. | MEDIUM |
| GitHub Actions | CI/CD | Lint, test, build, deploy pipeline. Widely used, free for public repos. | HIGH |
| Turborepo | Monorepo build system | Optimized builds for monorepo with shared packages. Caches builds, parallel execution. | MEDIUM |

### Development & Quality

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| ESLint + Prettier | Code quality | Consistent formatting and linting across monorepo. | HIGH |
| Vitest | Unit/integration testing | Faster than Jest, ESM-native, compatible with Jest API. Works with both Next.js and NestJS. | MEDIUM |
| Playwright | E2E testing | Cross-browser testing for critical user flows. | MEDIUM |
| Husky + lint-staged | Git hooks | Pre-commit linting and formatting. Catches issues before CI. | HIGH |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Database | PostgreSQL + Prisma | MongoDB + Mongoose | Relational data model (social graph, collections) fits PostgreSQL. MongoDB would need denormalization and application-level joins. |
| ORM | Prisma | TypeORM | TypeORM has unreliable migrations and weaker type inference. Prisma's schema-first approach is cleaner. |
| ORM | Prisma | Drizzle | Drizzle is good but less mature ecosystem. Prisma has better NestJS integration documentation and larger community. |
| Media Storage | AWS S3 | Cloudinary | Cloudinary too expensive at social-media scale (per-transformation pricing). S3 gives cost control. |
| Media Storage | AWS S3 | Cloudflare R2 | R2 is viable (zero egress fees). Consider if cost is primary concern. S3 has more ecosystem tooling. |
| Image Processing | Sharp | Cloudinary transforms | Sharp runs locally, no per-image cost. Full control over output. |
| Search | Meilisearch | Elasticsearch | Elasticsearch is overkill operationally. Meilisearch is simpler to run with better typo tolerance for user search. |
| Search | Meilisearch | Algolia | Algolia is expensive SaaS. Meilisearch is open-source with similar instant-search UX. |
| WebSocket | Socket.IO | ws (raw) | Socket.IO provides reconnection, rooms, fallback. NestJS has official adapter. Raw ws needs manual implementation. |
| Queue | BullMQ | RabbitMQ | BullMQ uses existing Redis. RabbitMQ adds infrastructure. BullMQ has first-class NestJS support. |
| Queue | BullMQ | AWS SQS | SQS adds AWS coupling and latency. BullMQ is simpler for single-region deployment. |
| Auth | Passport + JWT | Auth.js/NextAuth | Auth belongs in NestJS backend, not Next.js. Passport.js is NestJS-native. Mixing auth systems creates complexity. |
| Password hash | argon2 | bcrypt | argon2 is PHC winner, memory-hard, more resistant to GPU attacks. |
| State mgmt | Zustand | Redux Toolkit | Zustand is simpler for this scale. Redux adds boilerplate without benefit here. |
| State mgmt | TanStack Query | SWR | TanStack Query has richer feature set: mutations, optimistic updates, infinite queries, devtools. |
| CSS | Tailwind CSS | CSS Modules / styled-components | Tailwind is faster for rapid development, produces smaller bundles with purging, and has excellent responsive utilities. |
| Testing | Vitest | Jest | Vitest is faster, ESM-native, and API-compatible with Jest. |
| Deployment | Docker + ECS/Railway | Vercel + serverless | Separate Next.js and NestJS need different hosting. Vercel is great for Next.js but NestJS needs a container host. Unified Docker approach is simpler. |

## Installation

```bash
# ============================================
# BACKEND (NestJS)
# ============================================

# Core NestJS (should already be scaffolded)
npm install @nestjs/core @nestjs/common @nestjs/platform-express rxjs reflect-metadata

# Database
npm install prisma @prisma/client
npm install -D prisma

# Authentication
npm install @nestjs/passport @nestjs/jwt passport passport-jwt passport-local passport-google-oauth20 argon2
npm install -D @types/passport-jwt @types/passport-local @types/passport-google-oauth20

# Validation
npm install class-validator class-transformer

# WebSocket
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install -D @types/socket.io

# Queue
npm install @nestjs/bullmq bullmq

# Caching
npm install @nestjs/cache-manager cache-manager cache-manager-ioredis-yet ioredis

# Media processing
npm install sharp fluent-ffmpeg @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install -D @types/fluent-ffmpeg

# Search
npm install meilisearch

# API docs
npm install @nestjs/swagger

# Configuration
npm install @nestjs/config

# Security
npm install helmet @nestjs/throttler

# File upload
npm install multer
npm install -D @types/multer

# ============================================
# FRONTEND (Next.js)
# ============================================

# State management
npm install @tanstack/react-query zustand

# UI & Styling
npm install tailwindcss @tailwindcss/postcss

# Animation
npm install framer-motion

# Carousel
npm install swiper

# Video playback
npm install hls.js

# WebSocket client
npm install socket.io-client

# ============================================
# SHARED / MONOREPO
# ============================================

# Monorepo tooling
npm install -D turbo

# Code quality
npm install -D eslint prettier husky lint-staged

# Testing
npm install -D vitest @vitest/coverage-v8 playwright @playwright/test
```

## Version Verification Method

All versions verified via `npm view [package] version` on 2026-03-13. Actual installed versions may vary based on semver range resolution. Pin exact versions in production with a lockfile.

| Package | Verified Version | Method |
|---------|-----------------|--------|
| next | 16.1.6 | npm registry |
| @nestjs/core | 11.1.16 | npm registry |
| prisma / @prisma/client | 7.5.0 | npm registry |
| socket.io | 4.8.3 | npm registry |
| bullmq | 5.71.0 | npm registry |
| sharp | 0.34.5 | npm registry |
| ioredis | 5.10.0 | npm registry |
| meilisearch (JS client) | 0.55.0 | npm registry |
| tailwindcss | 4.2.1 | npm registry |
| @tanstack/react-query | 5.90.21 | npm registry |
| zustand | 5.0.11 | npm registry |
| framer-motion | 12.36.0 | npm registry |
| argon2 | 0.44.0 | npm registry |
| @nestjs/swagger | 11.2.6 | npm registry |
| @nestjs/throttler | 6.5.0 | npm registry |

## Architecture Fit Summary

```
[Browser] --> [Next.js 16 (SSR + Client)] --> [NestJS 11 REST API + WebSocket Gateway]
                                                        |
                                    +-------------------+-------------------+
                                    |                   |                   |
                              [PostgreSQL 16+]    [Redis 7+]         [Meilisearch]
                              (via Prisma 7.5)    (cache, queue,     (search index)
                                                   sessions, pubsub)
                                    |
                              [AWS S3 + CloudFront]
                              (media storage + CDN)
                                    |
                              [BullMQ Workers]
                              (Sharp, FFmpeg processing)
```

## Sources

- npm registry (direct version verification via `npm view`)
- NestJS official documentation: https://docs.nestjs.com
- Prisma official documentation: https://www.prisma.io/docs
- Socket.IO official documentation: https://socket.io/docs/v4/
- Meilisearch official documentation: https://docs.meilisearch.com
- BullMQ official documentation: https://docs.bullmq.io
- Sharp official documentation: https://sharp.pixelplumbing.com
- TanStack Query documentation: https://tanstack.com/query
- Tailwind CSS documentation: https://tailwindcss.com/docs
