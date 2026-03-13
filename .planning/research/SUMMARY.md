# Project Research Summary

**Project:** Figly -- Instagram-like social platform for collectors
**Domain:** Social media + collection tracking (figurines, Gundam, sneakers, trading cards)
**Researched:** 2026-03-13
**Confidence:** MEDIUM-HIGH

## Executive Summary

Figly is a social media platform that combines Instagram-style photo/video sharing with structured collection tracking for hobbyist collectors. The recommended approach uses Next.js 16 (App Router with Server Components) for the frontend and NestJS 11 as a separate backend API server, connected by REST endpoints and Socket.IO WebSockets. PostgreSQL serves as the primary relational database (social graphs, collection catalogs, and user data are inherently relational), with Redis handling caching, feed timelines, job queues, sessions, and WebSocket pub/sub. Media is stored in S3 with Sharp/FFmpeg processing via BullMQ workers, served through CloudFront CDN. This stack is well-documented, TypeScript end-to-end, and has strong ecosystem support.

The critical strategic decision is to resist building "Instagram first, collections second." The collection tracking system -- specifically the shared item database, owned/wishlist tracking, and post-to-item linking -- is Figly's reason for existing. Research consistently flags that teams building collector social platforms get trapped cloning Instagram features while deferring the collection differentiator. The recommended phasing puts collection infrastructure alongside core social features in the earliest phases, not after them. Stories, reels, and algorithmic feeds are explicitly deferred to later phases; they are expensive to build and are not what makes Figly worth switching to.

The top risks are: (1) synchronous media processing blocking the API -- must use async BullMQ workers from day one, (2) naive feed queries degrading at scale -- design the feed service behind an interface with fan-out-on-write from the start, (3) collection catalog data integrity -- the shared item database must use stable UUIDs, soft deletes, and versioning so catalog updates never break user checklists, and (4) JWT auth without proper token lifecycle -- implement short-lived access tokens with refresh token rotation immediately. All four of these are Phase 1 concerns that become expensive to retrofit.

## Key Findings

### Recommended Stack

The stack is TypeScript end-to-end with pre-decided frameworks (Next.js 16, NestJS 11). All supporting technology choices have been verified against npm registry with current stable versions. The stack avoids unnecessary complexity -- BullMQ over RabbitMQ (reuses Redis), Prisma over TypeORM (better migrations and type safety), Meilisearch over Elasticsearch (simpler ops for the search needs), and S3+Sharp over Cloudinary (cost control at social media scale).

**Core technologies:**
- **Next.js 16 + React Server Components:** SSR/SSG frontend with App Router, optimized image handling, file-based routing
- **NestJS 11:** TypeScript-first backend with modular architecture, built-in DI, first-class support for WebSockets/queues/auth
- **PostgreSQL 16+ via Prisma 7.5:** Relational database for social graph, collection catalog, posts; JSONB for flexible collection metadata
- **Redis (ioredis 5.10):** Caching, BullMQ backend, Socket.IO adapter, feed timelines, sessions, rate limiting
- **AWS S3 + CloudFront + Sharp:** Media storage, CDN delivery, server-side image processing to WebP/AVIF
- **BullMQ 5.71:** Async job processing for media, feed fan-out, notifications, search sync
- **Socket.IO 4.8 + Redis adapter:** Real-time notifications and DM with horizontal scaling support
- **Meilisearch:** Full-text search with typo tolerance (defer to Phase 2+; use PostgreSQL tsvector for MVP)
- **TanStack Query + Zustand:** Client-side data fetching/caching and lightweight UI state
- **Tailwind CSS 4.2 + Framer Motion:** Rapid responsive UI development with smooth animations

**Critical version note:** All versions verified via npm registry on 2026-03-13. Use lockfiles to pin exact versions.

### Expected Features

**Must have (table stakes -- P1 for launch):**
- User auth (email/password + Google OAuth), profiles, follow/unfollow system
- Photo posts (single + multi-image carousel) with captions, hashtags, mentions
- Likes, comments, bookmarks/saves
- Chronological feed from followed users
- Basic search (users, hashtags)
- In-app notifications (likes, comments, follows, mentions)
- Shared item database seeded for 2-3 categories (Gundam, figurines, sneakers)
- Owned/wishlist tracking per item
- Post-to-item linking (the core differentiator)
- Collection view on user profiles
- Report/block/mute
- Responsive web design (mobile-first)

**Should have (differentiators -- P2 post-launch):**
- Direct messaging (1-on-1)
- Stories (24h ephemeral content)
- Custom checklists with progress tracking
- Collection statistics and progress bars
- Explore/discovery page organized by collection category
- Item pages with aggregated community content
- Item release calendar
- Collection sharing cards (viral loop mechanic)

**Defer (v2+):**
- Reels (short-form video) -- expensive, validate with photos first
- Group chats, story highlights, follow collections/series
- PWA with push notifications
- Algorithmic feed -- chronological is better than bad algorithmic on a small platform
- Any marketplace/e-commerce functionality (explicitly excluded)
- AI-powered recommendations, price tracking, native mobile app

### Architecture Approach

The architecture follows a clean three-layer pattern: Next.js client layer (SSR + client components), NestJS API layer (REST controllers + WebSocket gateways + auth guards), and infrastructure layer (PostgreSQL, Redis, S3, BullMQ workers). NestJS modules are organized by domain (auth, users, posts, feed, media, collections, chat, notifications, search, social, explore) with event-driven decoupling for cross-cutting concerns. The monorepo uses Turborepo with pnpm workspaces and a shared TypeScript types package.

**Major components:**
1. **Auth Module** -- JWT with refresh token rotation, Passport strategies (local + OAuth), guards applied globally
2. **Media Pipeline** -- Upload to S3, async processing via BullMQ workers (Sharp for images, FFmpeg for video), CDN serving
3. **Feed Service** -- Fan-out-on-write to Redis sorted sets, cursor-based pagination, hybrid approach for high-follower accounts
4. **Collection Module** -- Catalog management (categories, series, items with JSONB metadata), user checklists, post-item tagging
5. **Social Graph** -- Follow/unfollow with adjacency list, denormalized counters, block system
6. **Real-time Layer** -- Socket.IO gateways for DM and notifications, Redis adapter for multi-instance scaling
7. **Notification Service** -- Event-driven (EventEmitter2), aggregation ("A and 47 others liked"), BullMQ delivery

**Key architectural decisions:**
- REST-first API (GraphQL deferred to Phase 2+ for feed/explore if needed)
- Polymorphic content model with `type` discriminator on posts table (supports post/reel/story without separate tables)
- Denormalized counters (user_stats, post_stats) to avoid expensive COUNT queries
- UUID primary keys everywhere (prevents enumeration, supports distributed systems)
- Auth tokens in httpOnly cookies (not localStorage -- prevents XSS)
- Presigned S3 upload URLs at scale (bypass API server for large files)

### Critical Pitfalls

1. **Synchronous media processing** -- Never process images/video in the request handler. Use BullMQ workers from day one. Return 202 Accepted with a processing status. A single video transcode can block the event loop for minutes. Recovery cost: MEDIUM but requires rewriting every upload endpoint.

2. **Naive feed queries (fan-out-on-read JOINs)** -- The "get posts from everyone I follow" query is the single most common failure in Instagram clones. Design the feed service behind an interface and implement fan-out-on-write with Redis from the start. Recovery cost: HIGH (2-4 weeks with data migration risk).

3. **Collection catalog data integrity** -- The shared item database must use stable UUIDs, soft deletes, and a version/redirect system. Direct foreign keys with CASCADE DELETE from user checklists to catalog items will destroy user data when the catalog is updated. Recovery cost: HIGH (some user data may be unrecoverable).

4. **JWT without proper token lifecycle** -- Short-lived access tokens (15min) + refresh token rotation (7-day, stored hashed in Redis). Without this, compromised accounts cannot be revoked and users get forced re-logins. Recovery cost: HIGH (requires client rewrite, forced re-login for all users).

5. **Building Instagram before collections** -- Teams spend 6 months on a pixel-perfect Instagram clone and bolt on collection tracking as an afterthought. The result is a mediocre copy of something users already have. Build collection features as a first-class citizen alongside core social features. Recovery cost: strategic -- cannot be recovered, only prevented.

## Implications for Roadmap

Based on combined research, the following phase structure addresses dependencies, groups related features, and mitigates critical pitfalls.

### Phase 1: Foundation and Infrastructure
**Rationale:** Everything depends on auth, database schema, media pipeline, and monorepo structure. These must be correct from the start because they are the most expensive to change later. Three of the five critical pitfalls (media processing, JWT lifecycle, catalog data model) must be addressed in this phase.
**Delivers:** Working monorepo with Next.js + NestJS, Docker dev environment, auth system, media upload/processing pipeline, database schema with migrations, shared type package.
**Addresses:** User authentication (P1), media upload infrastructure, database foundation for all subsequent features.
**Avoids:** Synchronous media processing (Pitfall 1), JWT without refresh tokens (Pitfall 6), wrong data model for collections (Pitfall 7).

### Phase 2: Core Social + Collection Foundation
**Rationale:** Social features and collection tracking must be built in parallel, not sequentially. This phase delivers the minimum social experience AND the collection differentiator together, so the product can be tested as a unified concept. The feed architecture (Pitfall 2) and N+1 query patterns (Pitfall 3) must be addressed here.
**Delivers:** User profiles, follow system, photo posts (single + carousel), likes, comments, chronological feed, hashtags, bookmarks. Simultaneously: shared item database (seeded for 2-3 categories), owned/wishlist tracking, post-to-item linking, collection view on profiles.
**Uses:** Prisma for database access, BullMQ for feed fan-out, Redis for feed caching, Sharp for image variants.
**Implements:** Feed Service (fan-out-on-write), Social Graph, Post Service, Collection Module.
**Avoids:** Naive feed queries (Pitfall 2), N+1 queries (Pitfall 3), Instagram-first trap (Pitfall 8), monolithic content model (Pitfall 9).

### Phase 3: Search, Notifications, and Moderation
**Rationale:** Search and notifications are cross-cutting infrastructure that enhance every feature built in Phase 2. Content moderation must ship before any public release. These features complete the MVP.
**Delivers:** In-app notifications (aggregated, real-time via WebSocket), basic search (users, hashtags, collection items via PostgreSQL full-text), report/block/mute, admin moderation queue, hashtag pages.
**Uses:** Socket.IO + Redis adapter for real-time notifications, PostgreSQL tsvector for search.
**Implements:** Notification Service, Search Module, Moderation/Admin tools.
**Avoids:** No content moderation at launch (Pitfall 10), WebSocket without Redis adapter (Pitfall 5).

### Phase 4: Messaging and Enhanced Social
**Rationale:** DMs are high-value but high-complexity. They require the WebSocket infrastructure established in Phase 3 (notifications) and benefit from the moderation tools already in place. Explore page requires sufficient content to curate.
**Delivers:** 1-on-1 direct messaging with real-time delivery, read receipts, media sharing. Explore/discovery page organized by collection category. Custom checklists with progress tracking. Collection statistics.
**Uses:** Socket.IO ChatGateway, Redis pub/sub for multi-instance DM delivery.
**Implements:** Chat Module, Explore Module, enhanced Collection features.

### Phase 5: Rich Media and Engagement
**Rationale:** Stories and reels are engagement multipliers, not core differentiators. They should only be built after the collection + social foundation is validated with real users. Video processing (FFmpeg + HLS) is a significant infrastructure addition.
**Delivers:** Stories (24h ephemeral, viewer list, highlights), video upload support, item pages with community content, item release calendar, collection sharing cards.
**Uses:** FFmpeg for video transcoding, HLS for adaptive playback, BullMQ for cleanup jobs.
**Implements:** Story Service, Video Pipeline, Item Pages.

### Phase 6: Scale and Polish
**Rationale:** Performance optimization, advanced search (Meilisearch migration), CDN fine-tuning, and advanced features only matter with real user load. Reels and group chats are deferred here or beyond.
**Delivers:** Meilisearch integration, CDN optimization, rate limiting, analytics/trending, PWA support. Optionally: reels, group chats, follow collections.
**Implements:** Advanced Search, Analytics Module, CDN strategy, scaling infrastructure.

### Phase Ordering Rationale

- **Phase 1 before everything:** Auth, database schema, and media pipeline are foundational. Every other feature depends on them, and they are the costliest to redesign.
- **Collections in Phase 2 (not Phase 5):** The ARCHITECTURE.md suggested collections in Phase 5, but both FEATURES.md and PITFALLS.md strongly argue that the collection system is the differentiator and must be validated early. Deferring collections to Phase 5 risks building an inferior Instagram clone. The roadmapper should override the architecture build order on this point.
- **Notifications in Phase 3 (not Phase 4):** Notifications are cross-cutting infrastructure. Moving them earlier means every Phase 2 feature (likes, comments, follows) can trigger notifications as soon as Phase 3 ships, rather than retroactively wiring them up.
- **DMs in Phase 4 (not Phase 2):** DMs are high-complexity and require WebSocket infrastructure. Building them after notifications means the real-time layer is already proven.
- **Stories/Reels in Phase 5+:** These are expensive to build and not what makes Figly unique. Users will not choose Figly over Instagram for stories. They will choose Figly for collection tracking.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Collection Foundation):** Catalog data model design needs careful research -- how to structure JSONB metadata schemas per category, seed data sourcing, and the owned/wishlist/custom status state machine. The merge/redirect system for duplicate catalog items is non-trivial.
- **Phase 4 (Messaging):** DM architecture needs research on message ordering guarantees, read receipt implementation, and conversation list pagination. Encryption-at-rest decisions also need resolution.
- **Phase 5 (Rich Media -- Video):** FFmpeg integration, HLS segment generation, adaptive bitrate strategy, and video duration/size enforcement need deeper technical research. Consider whether to use AWS MediaConvert instead of self-hosted FFmpeg at scale.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Monorepo setup, NestJS scaffolding, Prisma setup, JWT auth, S3 media upload -- all extremely well-documented with official guides and templates.
- **Phase 3 (Search, Notifications, Moderation):** PostgreSQL full-text search, Socket.IO notifications, report/block systems -- standard patterns with extensive documentation.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm registry. Next.js + NestJS + PostgreSQL + Redis is a battle-tested combination. No exotic or untested dependencies. |
| Features | MEDIUM | Based on training data knowledge of Instagram, MyFigureCollection, Discogs, TCGPlayer. Web search tools were unavailable during research, so competitor features post-mid-2025 could not be verified. Feature priorities are sound but should be validated with target collector communities. |
| Architecture | MEDIUM-HIGH | Social media architecture is one of the most extensively documented system design topics. Patterns (fan-out, media pipeline, WebSocket scaling) are well-established. Specific to Figly, the collection module architecture is the least documented area since it is a novel combination. |
| Pitfalls | HIGH | Instagram clones are among the most common project types with extensive post-mortems. The pitfalls identified are consistently documented across multiple sources. High confidence that addressing these prevents the most common failures. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Seed data strategy:** Where to source initial catalog data for Gundam, figurines, and sneakers categories. Community-contributed vs. admin-curated vs. API integrations (MyFigureCollection, StockX). This needs resolution before Phase 2 collection work begins.
- **Competitor feature verification:** Feature research was based on training data (cutoff mid-2025). Instagram, MyFigureCollection, and Discogs may have launched or deprecated features since then. Verify before finalizing feature priorities.
- **Video processing infrastructure costs:** The trade-off between self-hosted FFmpeg workers vs. AWS MediaConvert was flagged but not resolved. Needs cost analysis based on expected video volume before Phase 5.
- **Mobile PWA viability:** The decision to be web-only with PWA potential needs validation -- can service workers deliver acceptable push notification and offline behavior for a social media app? This affects whether native mobile becomes necessary sooner than planned.
- **Collection category scalability:** The JSONB metadata approach works for a few categories but may need a more structured solution if dozens of categories with distinct attributes are added. Research needed if category count exceeds 10.
- **GDPR/privacy compliance:** DM encryption-at-rest, account deletion cascading, and data export requirements were mentioned in pitfalls but not fully specified in architecture. Needs legal review before public launch.

## Sources

### Primary (HIGH confidence)
- npm registry -- direct version verification for all stack dependencies (2026-03-13)
- NestJS official documentation (docs.nestjs.com) -- modules, guards, WebSocket gateways, BullMQ integration
- Next.js official documentation (nextjs.org/docs) -- App Router, Server Components, Image Optimization
- PostgreSQL official documentation -- JSONB, full-text search, indexing strategies
- Prisma official documentation (prisma.io/docs) -- schema design, migrations, relation handling
- Socket.IO official documentation (socket.io/docs/v4/) -- Redis adapter, rooms, scaling
- AWS S3 documentation -- presigned URLs, lifecycle policies, pricing
- OWASP JWT Security Cheat Sheet -- token lifecycle, refresh rotation patterns

### Secondary (MEDIUM confidence)
- Instagram Engineering Blog (historical posts) -- feed architecture, media pipeline, scaling patterns
- BullMQ/Sharp/Meilisearch official documentation -- queue patterns, image processing, search configuration
- TanStack Query / Zustand / Tailwind CSS documentation -- client-side patterns
- "Designing Data-Intensive Applications" (Kleppmann) -- fan-out patterns, caching strategies

### Tertiary (LOW confidence)
- Training data knowledge of MyFigureCollection, Discogs, TCGPlayer, PriceCharting feature sets -- needs verification
- Community post-mortems from Hacker News, Reddit r/webdev, dev.to -- aggregate patterns are reliable, individual details less so
- hobbyDB, Whatnot platform knowledge -- limited coverage in training data

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
