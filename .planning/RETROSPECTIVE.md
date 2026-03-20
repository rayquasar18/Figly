# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-20
**Phases:** 6 | **Plans:** 21 | **Timeline:** 8 days (2026-03-13 → 2026-03-20)

### What Was Built
- Complete authentication system (email/password, Google OAuth, Apple Sign-In, JWT, email verification)
- User profiles with avatars, bios, follow/unfollow, follower/following lists
- Instagram-style content: multi-image carousel posts, crop/rotate, hashtags, @mentions
- Full interaction layer: likes, threaded comments, bookmarks, chronological feed
- Public viewing mode for non-authenticated users with login CTAs
- Collection system: shared database (4 categories, 15 series), owned/wishlist, custom checklists, post-to-item linking
- Short-form video reels with ffmpeg transcoding and vertical scroll feed

### What Worked
- Phase-based execution with wave parallelization kept momentum high
- Source-only shared package pattern eliminated build step overhead
- Prisma schema-first approach provided type safety across the entire stack
- BullMQ async processing pattern established early (Phase 1) paid dividends for media and video
- Vietnamese error messages decision made early avoided consistency issues later
- Collection system placement at Phase 4 validated the core differentiator before building engagement features

### What Was Inefficient
- Phases 5-9 (Search, Notifications, Moderation, DM, Stories) were planned in ROADMAP but not executed — Progress table showed them as "Complete" when they weren't built
- REQUIREMENTS.md traceability table fell behind actual execution state
- Phase 10 (Reels) was built before Phases 5-9, creating dependency gaps
- Docker dual-container setup (Phase 7.1) started but not completed

### Patterns Established
- OptionalJwtAuthGuard pattern for public/private content coexistence
- Cross-query optimistic update helpers (updatePostInQueries, updateItemInQueries)
- Toggle endpoint pattern returning { success, isFlagged } for like/bookmark/owned/wishlist
- Cursor pagination with take+1 pattern across all list endpoints
- Auth-aware toggle using useAuthStore.getState().user for synchronous gating
- Purpose-based media upload with per-purpose size limits

### Key Lessons
1. Execute phases in order — skipping ahead (Phase 10 before 5-9) creates tracking inconsistencies
2. Keep REQUIREMENTS.md traceability in sync after each phase execution, not just at roadmap creation
3. Collection system early was the right call — it's the core differentiator and benefits from testing throughout
4. Public viewing mode (Phase 3.1) was a high-value insertion — enables social sharing and organic growth

### Cost Observations
- Model mix: ~70% opus (executors), ~20% sonnet (verifiers), ~10% haiku (research)
- 21 plans across 6 phases in 8 days
- Average plan execution: ~9 minutes
- Notable: Later phases executed faster as patterns were established (Phase 4 avg 5 min/plan)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Timeline | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 8 days | 6 | Initial GSD setup, wave-based execution established |

### Top Lessons (Verified Across Milestones)

1. Schema-first development with Prisma provides type safety that cascades through the entire stack
2. Async processing patterns (BullMQ) should be established in Phase 1, not retrofitted
3. Keep execution order sequential to maintain tracking accuracy
