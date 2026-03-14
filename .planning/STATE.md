---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 04-04-PLAN.md
last_updated: "2026-03-14T23:50:56Z"
last_activity: 2026-03-15 -- Completed 04-04 Collection Frontend Pages
progress:
  total_phases: 11
  completed_phases: 4
  total_plans: 19
  completed_plans: 16
  percent: 84
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Collectors can share, showcase, and manage their collections in a community of shared passion -- combining social media with collection tracking.
**Current focus:** Phase 4 (Collection System -- IN PROGRESS, 4/6 plans)

## Current Position

Phase: 4 of 10 (Collection System)
Plan: 4 of 6 in current phase
Status: Executing
Last activity: 2026-03-15 -- Completed 04-04 Collection Frontend Pages

Progress: [████████░░] 84% (Phase 4: 4/6 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 16
- Average duration: 7 min
- Total execution time: 2.1 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-auth | 3 | 37 min | 12 min |
| 02-profiles-social-graph | 4 | 23 min | 6 min |
| 03-content-feed | 4 | 38 min | 10 min |
| 03.1-public-viewing-mode | 1 | 7 min | 7 min |
| 04-collection-system | 3 | 15 min | 5 min |

**Recent Trend:**
- Last 5 plans: 7, 7, 4, 5, 6 min
- Trend: improving

*Updated after each plan completion*
| Phase 03 P01 | 3 | 2 tasks | 8 files |
| Phase 03 P02 | 10 | 2 tasks | 19 files |
| Phase 03 P03 | 13 | 2 tasks | 12 files |
| Phase 03 P04 | 12 | 2 tasks | 21 files |
| Phase 03.1 P01 | 7 | 2 tasks | 13 files |
| Phase 03.1 P02 | 7 | 2 tasks | 14 files |
| Phase 04 P01 | 4 | 2 tasks | 10 files |
| Phase 04 P02 | 5 | 1 task | 6 files |
| Phase 04 P03 | 13 | 2 tasks | 12 files |
| Phase 04 P04 | 6 | 2 tasks | 12 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Collection system (Phase 4) placed early, before search/notifications/messaging, to validate the core differentiator
- [Roadmap]: Stories and Reels deferred to Phases 9-10 as engagement multipliers, not core value
- [Research]: Fan-out-on-write feed architecture from day one to avoid naive query degradation
- [Research]: Async media processing via BullMQ workers mandatory from Phase 1
- [01-01]: Source-only shared package -- TypeScript source imported directly by consuming workspace tooling
- [01-01]: Vietnamese error messages in Zod schemas per user decision
- [01-01]: Dual .env loading for monorepo Prisma CLI compatibility
- [01-01]: Named throttle profiles (short: 100/min, login: 5/min)
- [01-02]: Argon2 for passwords/refresh tokens, SHA-256 for single-use verification/reset tokens
- [01-02]: HTML email templates as TypeScript functions (not React Email JSX) for NestJS compatibility
- [01-02]: OAuth account linking: match by provider ID, then email, then create new
- [01-02]: Refresh token rotation with stolen token detection (invalidate all on mismatch)
- [Phase 01-03]: Removed EmailVerifiedGuard from /me so frontend can distinguish unverified from unauthenticated
- [Phase 01-03]: /me returns full PublicUser object for frontend display
- [Phase 01-03]: Queue pattern for concurrent 401 refresh: only one refresh in flight
- [02-01]: Username nullable on User model to support existing OAuth users without usernames
- [02-01]: Reserved username check in AuthService (not Zod schema) to separate validation from business logic
- [02-01]: P2002 catch on signup for username race condition handling
- [02-01]: avatarId @unique for Prisma one-to-one relation requirement
- [02-02]: ProfilesModule imports MediaModule for StorageService avatar presigned URL resolution
- [02-02]: Cursor pagination uses take+1 pattern to avoid separate COUNT query
- [02-02]: Follow/unfollow idempotent via P2002/P2025 error catching
- [02-02]: Batch follow-status check with IN clause + Set for O(1) lookup
- [02-03]: ProfileEditModal uses shadcn Dialog per user decision for modal overlay
- [02-03]: Username availability check debounced 300ms, only when differs from current
- [02-03]: Shared signupSchema updated to include username field (was missing vs backend DTO)
- [02-03]: App layout gates all routes behind username: redirects to /complete-profile if null
- [02-03]: Follow button rendered as placeholder with data-follow-placeholder for Plan 02-04
- [02-04]: FollowButton hover shows destructive styling for visual unfollow confirmation cue
- [02-04]: IntersectionObserver infinite scroll with sentinel div for follower/following lists
- [02-04]: Debounced search (300ms) on follower/following lists passed to query hooks
- [Phase 02]: ProfileEditModal uses shadcn Dialog per user decision for modal overlay
- [Phase 02]: App layout gates all routes behind username: redirects to /complete-profile if null
- [03-01]: ToggleResponse with single boolean success field for like/bookmark toggle simplicity
- [03-02]: HashtagsController as separate controller in PostsModule for /hashtags route prefix
- [03-02]: CommentsController uses no-prefix @Controller() for mixed /posts/:postId/comments and /comments/:id routes
- [03-02]: FeedService uses read-time query with Follow subquery (not fan-out-on-write) for simplicity at current scale
- [03-03]: Upload orchestration in CreatePostFlow component for store interaction during sequential uploads
- [03-03]: NavLink sub-component in BottomNav for type-safe route rendering
- [03-04]: Cross-query-key optimistic updates via updatePostInQueries helper for feed/userPosts/savedPosts/post detail consistency
- [03-04]: Desktop modal vs mobile full-page routing via window.innerWidth >= 768 check at click time
- [03-04]: post-queries.ts created in Plan 03-04 since Plan 03-03 runs in same wave (parallel execution)
- [03.1-01]: OptionalJwtAuthGuard overrides handleRequest to return user||null for unauthenticated access
- [03.1-01]: Skip like/bookmark/follow queries entirely when viewerId is null for performance
- [03.1-01]: GET /feed/public has no guard -- viewer identity never used for public feed
- [03.1-01]: Extracted mapPostResponse helper in FeedService for reuse between personal and public feed
- [Phase 03.1]: Moved [username] and post routes from (app) to (public) to avoid Next.js route conflicts
- [Phase 03.1]: requireAuth pattern wraps click handlers to redirect unauthenticated users to /login
- [Phase 03.1]: API client interceptor skips redirect only for /auth/me 401 -- public endpoints never return 401
- [Phase 03.1]: CommentInput renders login CTA link instead of form for unauthenticated users
- [04-01]: Deterministic seed IDs using category+series+item slug pattern for idempotent upserts
- [04-01]: 15 series across 4 categories (Gundam 4, Figurines 4, Sneakers 4, Trading Cards 3)
- [04-01]: No imageKey/releaseDate in seed data -- placeholder icons for initial UI
- [04-02]: Vietnamese error messages in NotFoundException for collection endpoints consistency
- [04-02]: Toggle endpoints return { success, isOwned/isWishlisted } for frontend state updates
- [04-02]: Batch status check uses Promise.all for parallel owned + wishlist queries
- [04-03]: Ownership enforcement via findFirst(id, userId) pattern for checklist write operations
- [04-03]: Entry position managed via aggregate _max + 1 for append, $transaction for reorder
- [04-03]: mapLinkedItems helper duplicated in PostsService and FeedService for module independence
- [04-03]: PostResponse.linkedItems optional field to avoid breaking existing frontend code
- [04-04]: Cross-query optimistic updates via updateItemInQueries helper for items/searchItems/itemDetail consistency
- [04-04]: Auth-aware toggle uses useAuthStore.getState().user for synchronous auth gating before mutations
- [04-04]: Category/series names from slug with dash-to-space since series API lacks parent name field

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 3.1 inserted after Phase 3: Public Viewing Mode (URGENT)

### Blockers/Concerns

- [Research]: Video processing cost analysis (self-hosted FFmpeg vs AWS MediaConvert) needed before Phase 10

## Session Continuity

Last session: 2026-03-14T23:50:56Z
Stopped at: Completed 04-04-PLAN.md
Resume file: .planning/phases/04-collection-system/04-04-SUMMARY.md
