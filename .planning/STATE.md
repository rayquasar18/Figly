---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Phase 10 context gathered
last_updated: "2026-03-20T10:56:45.589Z"
last_activity: 2026-03-20 -- Completed 09-02 Stories Frontend
progress:
  total_phases: 12
  completed_phases: 11
  total_plans: 31
  completed_plans: 31
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-13)

**Core value:** Collectors can share, showcase, and manage their collections in a community of shared passion -- combining social media with collection tracking.
**Current focus:** Phase 9: Stories (Complete)

## Current Position

Phase: 9
Plan: 2 of 2 in current phase
Status: Phase 09 Complete
Last activity: 2026-03-20 -- Completed 09-02 Stories Frontend

Progress: [██████████] 100% (Phase 9: 2/2 plans)

## Performance Metrics

**Velocity:**

- Total plans completed: 23
- Average duration: 9 min
- Total execution time: 3.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-auth | 3 | 37 min | 12 min |
| 02-profiles-social-graph | 4 | 23 min | 6 min |
| 03-content-feed | 4 | 38 min | 10 min |
| 03.1-public-viewing-mode | 1 | 7 min | 7 min |
| 04-collection-system | 4 | 20 min | 5 min |
| 05-search-discovery | 2 | 12 min | 6 min |
| 06-notifications | 1 | 21 min | 21 min |
| 07-moderation-safety | 1 | 31 min | 31 min |

| 08-direct-messaging | 3 | 17 min | 6 min |
| 07.1-docker-split | 1 | 6 min | 6 min |

**Recent Trend:**

- Last 5 plans: 31, 8, 8, 6, 4 min
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
| Phase 04 P05 | 9 | 2 tasks | 18 files |
| Phase 04 P06 | 5 | 2 tasks | 9 files |
| Phase 05 P01 | 6 | 2 tasks | 14 files |
| Phase 05 P02 | 6 | 2 tasks | 9 files |
| Phase 06 P01 | 21 | 2 tasks | 28 files |
| Phase 06 P02 | 5 | 2 tasks | 16 files |
| Phase 07 P01 | 31 | 3 tasks | 55 files |
| Phase 07 P02 | 14 | 2 tasks | 18 files |
| Phase 08 P01 | 8 | 2 tasks | 22 files |
| Phase 08 P02 | 8 | 3 tasks | 14 files |
| Phase 08 P03 | 1 | 1 tasks | 2 files |
| Phase 07.1 P01 | 6 | 2 tasks | 1 files |
| Phase 09 P01 | 8 | 2 tasks | 14 files |
| Phase 09 P02 | 4 | 2 tasks | 10 files |

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
- [Phase 04]: ChecklistEntry reorder uses full array swap and sends complete entryIds list
- [Phase 04]: FollowSeriesButton reuses same auth-gate pattern as user FollowButton
- [Phase 04]: CollectionShowcase uses inline useQuery for owned items endpoint
- [Phase 04]: ItemPicker onSelect returns both IDs and LinkedItemResponse for store hydration without extra API calls
- [Phase 04]: PostCard shows max 3 linked item badges with overflow count for compact feed display
- [Phase 04]: Checklist detail replaced manual ID input with ItemPicker in single-select mode
- [05-01]: SearchService uses PrismaService directly for hashtag _count aggregation instead of PostsService.searchHashtags
- [05-01]: Explore feed is public with no guard and empty liked/bookmarked sets
- [05-01]: Hashtag posts endpoint placed before :id param route to avoid route conflict
- [05-02]: useSearchItemsGlobal named to avoid collision with existing useSearchItems in collection-queries.ts
- [05-02]: Explore page uses useExploreFeed for category sections and usePublicFeed for "Moi nhat" chronological fallback
- [05-02]: ExploreCategorySectionComponent accesses post.media[0].url for thumbnail display with gradient placeholder
- [06-01]: NotificationsGateway as injectable service with per-user Subject map (not WebSocket gateway) for SSE
- [06-01]: Notification grouping via groupKey pattern (type:targetId) with 5-min window
- [06-01]: Vietnamese notification messages composed in service with actor count-aware text
- [06-01]: Push service graceful degradation when VAPID keys not configured
- [06-01]: BullModule.registerQueue added to PostsModule, CommentsModule, SocialModule for notification enqueuing
- [06-01]: @mention detection uses /@(\w+)/g regex with batch username resolution and deduplication
- [Phase 06]: Instagram 5-tab BottomNav: Home, Search, Create, Heart (notifications), Profile
- [Phase 06]: Top header bar with Figly logo, notification bell, and user avatar
- [Phase 06]: Auto-mark-as-read via IntersectionObserver on NotificationItem
- [Phase 06]: Push permission gated behind 2+ sessions via localStorage counter
- [07-01]: Block is bidirectional: both blocker and blocked are hidden from each other
- [07-01]: Ban check added to JwtStrategy validate for per-request enforcement
- [07-01]: Block transaction includes follow cleanup in both directions
- [07-01]: Banned user content hidden globally (feed, search, profiles) not just per-viewer
- [07-01]: Mute is one-directional: only affects muter's feed/notifications
- [07-01]: Report is unique per (reporter, target, targetType) with P2002 upsert
- [Phase 07]: PublicUser role field pulled forward to Task 1 for admin UI gating compile-time correctness
- [Phase 07]: Admin actions in PostMenu and UserActionMenu share admin-queries hooks for consistency
- [08-01]: Socket.IO with NestJS 10 compat (@nestjs/websockets@^10) for peer dependency alignment
- [08-01]: WebSocket JWT auth via cookie parsing (access_token) matching existing auth flow
- [08-01]: userSockets Map<userId, Set<socketId>> for multi-device connection tracking
- [08-01]: Room-based broadcast (conv:{conversationId}) for efficient message delivery
- [08-01]: 1-on-1 duplicate prevention via findFirst with AND participant queries
- [08-02]: Socket.IO connection at app layout level for app-wide real-time messaging
- [08-02]: DM icon (MessageCircle) before NotificationBell in header per Instagram pattern
- [08-02]: Bottom nav unchanged at 5 tabs -- DMs from header only
- [08-02]: Read receipts via lastReadAt with Check/CheckCheck icons
- [08-02]: Media upload via existing /media/upload before socket sendMessage
- [Phase 08-03]: No frontend changes needed -- frontend already expects wrapped { message, conversationId } payload shape
- [07.1-01]: Removed legacy single-container Dockerfile to prevent confusion with split setup
- [07.1-01]: Backend entrypoint made executable locally for developer consistency
- [09-01]: Video upload marks COMPLETED immediately (no Sharp processing); ffmpeg thumbnail generation deferred
- [09-01]: Story cleanup via BullMQ repeatable job every 15 min (not cron)
- [09-01]: Story feed grouped by user with unviewed-first sort, own stories separated as myStories
- [09-01]: Self-views not tracked to avoid inflating view counts
- [09-01]: Presigned URLs for story media use 24h expiry matching story TTL
- [09-01]: class-validator DTO pattern (not nestjs-zod) following existing project convention
- [09-02]: apiClient from @/lib/api-client used instead of plan's api from @/lib/api to match project convention
- [09-02]: Progress bar auto-advance via CSS animation onAnimationEnd for images, onEnded for video
- [09-02]: Touch zone split: left 40% previous, right 60% next for story viewer navigation
- [09-02]: Delete confirmation uses shadcn AlertDialog with Vietnamese copy

### Pending Todos

None yet.

### Roadmap Evolution

- Phase 3.1 inserted after Phase 3: Public Viewing Mode (URGENT)
- Phase 7.1 inserted after Phase 7: Docker Split — tách figly-app thành 2 container riêng figly-frontend + figly-backend (URGENT)

### Blockers/Concerns

- [Research]: Video processing cost analysis (self-hosted FFmpeg vs AWS MediaConvert) needed before Phase 10

## Session Continuity

Last session: 2026-03-20T10:56:45.586Z
Stopped at: Phase 10 context gathered
Resume file: .planning/phases/10-reels/10-CONTEXT.md
