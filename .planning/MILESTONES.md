# Milestones

## v2.0 Architecture & Production Hardening (Shipped: 2026-03-31)

**Phases:** 8 (11-18) | **Plans:** 25 | **Tasks:** 46
**Timeline:** 2026-03-24 → 2026-03-27 (4 days)
**Git range:** feat(11-01) → fix(18)
**Files changed:** 747 | **LOC:** 23,321 TypeScript

**Key accomplishments:**

1. Framework upgrades: React 18→19, Next.js 14→16, NestJS 10→11
2. Backend hardening: Zod env validation, global exception filter, Pino structured logging, health checks, Redis rate limiter, Swagger/OpenAPI, nestjs-zod DTOs
3. Frontend restructure: features/ directory pattern, auth middleware, SSR/SEO with generateMetadata on all 21 pages, dark mode support
4. DevOps: ESLint 9 + Prettier + Husky pre-commit, GitHub Actions CI/CD (4 parallel jobs), Docker dual-container split
5. Shared package cleanup: dto/ → schemas/, dist/ removed from git
6. Regression restore: backend app.module.ts wiring + frontend Server Components + React 19 ref-as-prop

**Known gaps (tech debt):**

- BACK-05: Swagger setup in main.ts needs restoration (~10 lines)
- BACK-03 partial: app.useLogger() for bootstrap logs not wired to Pino
- ThemeProvider dark mode toggle UI incomplete (FRNT-04 functional but no toggle)

---

## v1.0 MVP (Shipped: 2026-03-20)

**Phases:** 6 (1, 2, 3, 3.1, 4, 10) | **Plans:** 21
**Timeline:** 2026-03-13 → 2026-03-20 (8 days)
**Codebase:** 23,289 LOC TypeScript + 782 LOC Prisma

**Key accomplishments:**

1. Full authentication system with email/password, Google OAuth, Apple Sign-In, JWT sessions, and email verification
2. User profiles with avatars, bios, follow/unfollow system, follower/following lists
3. Instagram-style content creation with multi-image carousel posts, image crop/rotate, hashtags, @mentions
4. Interactions: likes, threaded comments, bookmarks, chronological feed with infinite scroll
5. Public viewing mode enabling non-authenticated users to browse content with login CTAs
6. Collection system: shared database (4 categories, 15 series), owned/wishlist tracking, custom checklists, post-to-item linking
7. Short-form video reels with ffmpeg transcoding, vertical scroll feed, auto-play, create reel flow

**Known gaps (deferred to v2.1+):**

- DISC-01, DISC-02, DISC-03: Search & Discovery
- NOTF-01, NOTF-02, NOTF-03: Notifications
- MODR-01, MODR-02, MODR-03, MODR-04: Moderation & Safety
- MESG-01, MESG-02, MESG-03, MESG-04: Direct Messaging
- CONT-08, CONT-09: Stories

**Git range:** feat(01-01) → feat(10-02)

---
