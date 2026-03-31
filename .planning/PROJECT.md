# Figly

## What This Is

Figly là một mạng xã hội dành cho người sưu tập (collectors), lấy cảm hứng từ Instagram. Đã ship v2.0 với production-ready architecture: React 19, Next.js 16, NestJS 11, SSR/SEO, structured logging, Docker dual-container, CI/CD. Core features: feed, posts, profiles, follow, likes/comments/bookmarks, collection system, public viewing mode, reels.

## Core Value

Người sưu tập có thể chia sẻ, khoe và quản lý bộ sưu tập của mình trong một cộng đồng cùng đam mê — kết hợp social media với collection tracking.

## Requirements

### Validated

- ✓ User authentication (email/password + Google/Apple OAuth) — v1.0
- ✓ User profiles with display name, avatar, bio, post grid — v1.0
- ✓ Follow/unfollow system with follower/following lists — v1.0
- ✓ Single/multi-image posts with captions, hashtags, @mentions — v1.0
- ✓ Image crop/rotate before posting — v1.0
- ✓ Like, comment (threaded), bookmark interactions — v1.0
- ✓ Chronological feed from followed users — v1.0
- ✓ Public viewing mode for non-authenticated users — v1.0
- ✓ Collection database browsing by category — v1.0
- ✓ Owned/wishlist tracking — v1.0
- ✓ Custom checklists with progress tracking — v1.0
- ✓ Post-to-item linking — v1.0
- ✓ Collection showcase on profile — v1.0
- ✓ Short-form video reels with vertical scroll feed — v1.0
- ✓ Media upload (photos/videos) with async processing — v1.0
- ✓ Framework upgrades (React 19, Next.js 16, NestJS 11) — v2.0
- ✓ Frontend restructure to features/ pattern — v2.0
- ✓ SSR/SEO with Server Components and generateMetadata — v2.0
- ✓ Backend hardening (env validation, exception filter, Pino logging, health checks) — v2.0
- ✓ Unified DTO validation with nestjs-zod — v2.0
- ✓ Redis-backed rate limiter — v2.0
- ✓ ESLint/Prettier/Husky + GitHub Actions CI/CD — v2.0
- ✓ Docker dual-container split — v2.0
- ✓ Shared package cleanup (schemas/, no dist/) — v2.0
- ✓ Auth middleware for server-side redirects — v2.0
- ✓ Dark mode support (ThemeProvider) — v2.0

### Active

**Deferred features (v2.1+):**

- [ ] Search for users, hashtags, and collection items (DISC-01, DISC-02, DISC-03)
- [ ] Real-time in-app notifications + push notifications via PWA (NOTF-01, NOTF-02, NOTF-03)
- [ ] Report/block/mute users + admin moderation queue (MODR-01, MODR-02, MODR-03, MODR-04)
- [ ] Direct messaging — 1-on-1 + group chats (MESG-01, MESG-02, MESG-03, MESG-04)
- [ ] Stories — 24h ephemeral photo/video content (CONT-08, CONT-09)

### Out of Scope

- Mobile native app — web-first approach, PWA covers mobile needs
- E-commerce/marketplace — không bán hàng, chỉ chia sẻ và track
- AI-powered recommendations — insufficient data at launch
- NFT / digital collectibles — market crashed, alienates users
- Auction system — full auction logic is an entire product
- Offline mode — real-time is core value

## Current State

**v2.0 shipped 2026-03-31**

- 23,321 LOC TypeScript
- 14 phases completed (v1.0: 6, v2.0: 8), 46 plans executed
- NestJS 11 backend + Next.js 16 frontend monorepo
- PostgreSQL (Prisma), MinIO media storage, BullMQ async processing, Redis
- Docker: figly-frontend + figly-backend containers
- CI/CD: GitHub Actions (lint, typecheck, build, test)

**Tech debt:**

- Swagger setup in main.ts needs restoration (~10 lines)
- app.useLogger() for bootstrap logs not wired to Pino
- Some plan checkboxes in ROADMAP unchecked due to worktree merge (plans actually executed)

## Constraints

- **Tech stack**: Next.js 16 (frontend) + NestJS 11 (backend)
- **Platform**: Web only, responsive design
- **Monorepo**: frontend + backend + shared packages
- **Media storage**: MinIO (S3-compatible)
- **Database**: PostgreSQL with Prisma ORM
- **Async processing**: BullMQ with Redis
- **Video transcoding**: ffmpeg via BullMQ workers

## Key Decisions

| Decision                        | Rationale                                                      | Outcome                  |
| ------------------------------- | -------------------------------------------------------------- | ------------------------ |
| Next.js frontend                | SSR, routing, React ecosystem                                  | ✓ Good                   |
| NestJS backend                  | TypeScript, modular architecture, scalable                     | ✓ Good                   |
| Web only                        | Focus resources, mobile later                                  | ✓ Good                   |
| PostgreSQL + Prisma             | Relational data, type-safe ORM                                 | ✓ Good                   |
| MinIO for media                 | S3-compatible, self-hosted, cost-effective                     | ✓ Good                   |
| BullMQ + Redis                  | Async media processing, job queues                             | ✓ Good                   |
| Source-only shared package      | TypeScript source imported directly by workspace tooling       | ✓ Good                   |
| Fan-out-on-read feed            | Simple query with Follow subquery, sufficient at current scale | ⚠ Revisit at scale       |
| Argon2 for passwords            | Strongest password hashing                                     | ✓ Good                   |
| Vietnamese UI messages          | User preference for Vietnamese error/validation messages       | ✓ Good                   |
| v2.0 Architecture milestone     | Audit revealed 15+ production gaps; fix before adding features | ✓ Good — all gaps closed |
| nestjs-zod over class-validator | Single validation source (shared Zod schemas)                  | ✓ Good                   |
| features/ directory pattern     | Domain-grouped frontend code                                   | ✓ Good                   |
| Docker dual-container           | Independent scaling, cleaner deployment                        | ✓ Good                   |
| ESLint 9 flat config            | Modern config format, workspace-aware                          | ✓ Good                   |

---

_Last updated: 2026-03-31 after v2.0 milestone_
