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

**v1.0 MVP shipped 2026-03-20**
- 23,289 LOC TypeScript + 782 LOC Prisma
- 6 phases completed (1, 2, 3, 3.1, 4, 10), 21 plans executed
- NestJS backend + Next.js frontend monorepo
- PostgreSQL (Prisma), MinIO media storage, BullMQ async processing
- ffmpeg video transcoding for reels

**Known gaps from v1.0:**
- Phases 5-9 (Search, Notifications, Moderation, DM, Stories) not yet built
- Docker dual-container setup incomplete (Phase 7.1)

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

---
*Last updated: 2026-03-20 after v1.0 milestone*
