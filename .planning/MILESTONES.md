# Milestones

## v1.0 MVP (Shipped: 2026-03-20)

**Phases completed:** 6 phases (1, 2, 3, 3.1, 4, 10), 21 plans
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

**Known gaps (deferred to v1.1+):**

- DISC-01, DISC-02, DISC-03: Search & Discovery (Phase 5)
- NOTF-01, NOTF-02, NOTF-03: Notifications (Phase 6)
- MODR-01, MODR-02, MODR-03, MODR-04: Moderation & Safety (Phase 7)
- MESG-01, MESG-02, MESG-03, MESG-04: Direct Messaging (Phase 8)
- CONT-08, CONT-09: Stories (Phase 9)
- Docker dual-container setup (Phase 7.1)

**Git range:** feat(01-01) → feat(10-02)

---
