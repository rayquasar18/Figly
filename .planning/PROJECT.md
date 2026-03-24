# Figly

## What This Is

Figly là một mạng xã hội dành cho người sưu tập (collectors), lấy cảm hứng từ Instagram. Hiện tại đã ship v1.0 MVP với core social features (feed, posts, profiles, follow, likes/comments/bookmarks), collection system (shared database, owned/wishlist tracking, custom checklists), public viewing mode, và reels. Hỗ trợ nhiều loại sưu tập: Gundam, figurine, sneakers, trading cards.

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

### Active

**v2.0 — Architecture & Production Hardening:**
- [ ] Tai cau truc thu muc frontend/backend theo chuan best practice
- [ ] Cap nhat framework len phien ban moi nhat (React 19, Next.js 15, NestJS 11)
- [ ] Don file thua, tai cau truc shared package
- [ ] Env validation, global exception filter, structured logging
- [ ] Next.js middleware, SSR/SEO cho trang cong khai
- [ ] Swagger/OpenAPI, ESLint/Prettier/Husky, CI/CD
- [ ] Docker split 2 container, Redis-backed rate limiter
- [ ] Thong nhat DTO validation, response serialization, health check
- [ ] ThemeProvider dark mode

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

## Current Milestone: v2.0 Architecture & Production Hardening

**Goal:** Nang cap kien truc, cau truc thu muc, cap nhat framework len phien ban moi nhat, bo sung cac thanh phan production-ready, va don dep code thua — truoc khi xay tinh nang moi.

**Target features:**
- Tai cau truc thu muc frontend va backend theo chuan best practice
- Cap nhat Next.js, React, NestJS len phien ban moi nhat (React 19, Next.js 15, NestJS 11)
- Don file thua, sua shared package cho kien truc doc lap
- Env validation, global exception filter, structured logging (Pino)
- Next.js middleware cho auth redirect (xoa flash of content)
- SSR/SEO cho cac trang cong khai voi generateMetadata()
- Swagger/OpenAPI documentation
- ESLint + Prettier + Husky/lint-staged
- CI/CD pipeline (GitHub Actions)
- Docker split thanh 2 container rieng biet
- Thong nhat DTO validation (nestjs-zod thay class-validator trung lap)
- Health check endpoint
- Redis-backed rate limiter
- Response serialization layer
- ThemeProvider cho dark mode

## Current State

**v1.0 MVP shipped 2026-03-20**
- 23,289 LOC TypeScript + 782 LOC Prisma
- 7 phases completed (1, 2, 3, 3.1, 4, 10, 11), 24 plans executed
- NestJS backend + Next.js frontend monorepo
- PostgreSQL (Prisma), MinIO media storage, BullMQ async processing
- ffmpeg video transcoding for reels

**Phase 11 complete (2026-03-24):**
- Signup simplified to email+password only (name/username deferred to complete-profile)
- Profile redirect loop fixed (auth cache invalidation)
- Explore page null-username filter added
- Instagram-style desktop sidebar navigation (220px fixed left sidebar)

**Known gaps from v1.0:**
- Phases 5-9 (Search, Notifications, Moderation, DM, Stories) not yet built
- Docker dual-container setup incomplete (Phase 7.1)

**Architecture audit findings (v2.0 trigger):**
- Tat ca trang frontend la 'use client' — khong SSR, khong SEO
- Khong co env validation — JWT secret fallback ve gia tri mac dinh (lo hong bao mat)
- Khong co global exception filter — lo Prisma error ra client
- Khong co structured logging — chi NestJS Logger co ban
- Khong co middleware.ts — auth redirect phia client gay nhap nhay
- Khong co Swagger/OpenAPI
- Khong co ESLint/Prettier/Husky config
- Khong co CI/CD
- Docker la 1 container ket hop (can tach 2)
- DTO validation trung lap giua class-validator va Zod
- Rate limiter dung bo nho trong tien trinh (khong Redis)
- ThemeProvider thieu (dark mode la ma chet)
- Thu muc frontend/backend chua theo chuan best practice
- Shared package can tai cau truc cho doc lap hon

## Constraints

- **Tech stack**: Next.js (frontend) + NestJS (backend) — validated
- **Platform**: Web only, responsive design
- **Monorepo**: frontend + backend + shared packages
- **Media storage**: MinIO (S3-compatible) — decided
- **Database**: PostgreSQL with Prisma ORM — decided
- **Async processing**: BullMQ with Redis — decided
- **Video transcoding**: ffmpeg via BullMQ workers — decided

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js frontend | SSR, routing, React ecosystem | ✓ Good |
| NestJS backend | TypeScript, modular architecture, scalable | ✓ Good |
| Web only | Focus resources, mobile later | ✓ Good |
| PostgreSQL + Prisma | Relational data, type-safe ORM | ✓ Good |
| MinIO for media | S3-compatible, self-hosted, cost-effective | ✓ Good |
| BullMQ + Redis | Async media processing, job queues | ✓ Good |
| Source-only shared package | TypeScript source imported directly by workspace tooling | ✓ Good |
| Fan-out-on-read feed | Simple query with Follow subquery, sufficient at current scale | ⚠ Revisit at scale |
| Argon2 for passwords | Strongest password hashing | ✓ Good |
| Vietnamese UI messages | User preference for Vietnamese error/validation messages | ✓ Good |
| Collection system early (Phase 4) | Core differentiator validated early | ✓ Good |
| Reels before Stories | Reels infrastructure enables Stories implementation | ✓ Good |
| ffmpeg self-hosted | Cost-effective for MVP, consider MediaConvert later | ⚠ Revisit at scale |

| v2.0 Architecture milestone | Audit revealed 15+ production gaps; fix before adding features | — Pending |

---
*Last updated: 2026-03-24 after Phase 11 completion*
