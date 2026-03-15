---
phase: 03-content-feed
plan: 02
subsystem: api
tags: [nestjs, prisma, posts, comments, feed, like, bookmark, hashtag, cursor-pagination]

requires:
  - phase: 01-foundation-auth
    provides: JwtAuthGuard, EmailVerifiedGuard, PrismaService, StorageService, MediaModule
  - phase: 02-profiles-social-graph
    provides: Follow model for feed query, ProfilesService for search endpoint, cursor pagination pattern
  - phase: 03-content-feed plan 01
    provides: Post, PostMedia, Like, Comment, Bookmark, Hashtag, PostHashtag Prisma models; shared DTOs/types/constants
provides:
  - PostsModule with CRUD, like/bookmark toggle, saved posts, user posts, hashtag search
  - CommentsModule with threaded comments (1-level depth), cursor pagination
  - FeedModule with chronological feed from followed users + own posts
  - Profile search endpoint for @mention autocomplete
affects: [03-03-frontend-creation, 03-04-frontend-feed, 04-collections]

tech-stack:
  added: []
  patterns:
    - "Batch presigned URL resolution via Promise.all with deduplication to avoid N+1"
    - "mapPostResponse helper for consistent PostResponse mapping across endpoints"
    - "Reply-to-reply flattening: if parent.parentId is not null, use parent.parentId"
    - "Separate HashtagsController for /hashtags prefix (different from /posts prefix)"

key-files:
  created:
    - backend/src/posts/posts.service.ts
    - backend/src/posts/posts.controller.ts
    - backend/src/posts/hashtags.controller.ts
    - backend/src/posts/posts.module.ts
    - backend/src/posts/dto/create-post.dto.ts
    - backend/src/posts/dto/update-post.dto.ts
    - backend/src/posts/__tests__/posts.service.spec.ts
    - backend/src/comments/comments.service.ts
    - backend/src/comments/comments.controller.ts
    - backend/src/comments/comments.module.ts
    - backend/src/comments/dto/create-comment.dto.ts
    - backend/src/comments/__tests__/comments.service.spec.ts
    - backend/src/feed/feed.service.ts
    - backend/src/feed/feed.controller.ts
    - backend/src/feed/feed.module.ts
    - backend/src/feed/__tests__/feed.service.spec.ts
  modified:
    - backend/src/profiles/profiles.service.ts
    - backend/src/profiles/profiles.controller.ts
    - backend/src/app.module.ts

key-decisions:
  - "HashtagsController as separate controller in PostsModule for /hashtags route prefix"
  - "CommentsController uses no-prefix @Controller() to handle both /posts/:postId/comments and /comments/:id routes"
  - "FeedService uses read-time query with Follow subquery (not fan-out-on-write) for simplicity at current scale"

patterns-established:
  - "Batch presigned URL resolution: collect all storage keys, deduplicate, Promise.all, build Map for O(1) lookup"
  - "P2002/P2025 idempotent toggle pattern reused from social follow/unfollow for like and bookmark"
  - "Comment reply-to-reply flattening enforced at service layer, not database constraint"
  - "Static routes (saved, user/:username, search) declared before parameterized :id routes in controllers"

requirements-completed: [CONT-01, CONT-02, CONT-04, CONT-05, CONT-06, INTR-01, INTR-02, INTR-03, INTR-04, INTR-05, SOCL-03]

duration: 10min
completed: 2026-03-14
---

# Phase 3 Plan 2: Backend API Summary

**Three NestJS modules (PostsModule, CommentsModule, FeedModule) with 14 REST endpoints for post CRUD, like/bookmark toggle, threaded comments, chronological feed, and autocomplete search**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-14T09:33:51Z
- **Completed:** 2026-03-14T09:43:44Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- PostsModule: full post CRUD, like/bookmark toggle with P2002/P2025 idempotency, saved posts, user posts, hashtag extraction and search
- CommentsModule: threaded comments with 1-level-deep reply flattening, cursor-paginated listing with eager-loaded replies
- FeedModule: chronological feed from followed users + own posts with batch like/bookmark status check
- Profile search endpoint added for @mention autocomplete
- Batch presigned URL resolution pattern (collect + deduplicate + Promise.all) avoids N+1 per-post per-image URL generation
- All 136 unit tests pass (42 new + 94 existing), all 3 workspaces build

## Task Commits

Each task was committed atomically (TDD RED -> GREEN):

1. **Task 1 RED: PostsService failing tests** - `33904cf` (test)
2. **Task 1 GREEN: PostsModule implementation** - `2069b57` (feat)
3. **Task 2 RED: CommentsService + FeedService failing tests** - `c9f5d2c` (test)
4. **Task 2 GREEN: CommentsModule, FeedModule, profile search** - `51f4136` (feat)

## Files Created/Modified
- `backend/src/posts/posts.service.ts` - Post CRUD, like/bookmark toggle, saved posts, user posts, hashtag search
- `backend/src/posts/posts.controller.ts` - REST endpoints for posts and interactions
- `backend/src/posts/hashtags.controller.ts` - GET /hashtags/search endpoint
- `backend/src/posts/posts.module.ts` - PostsModule importing MediaModule and AuthModule
- `backend/src/posts/dto/create-post.dto.ts` - class-validator DTO for post creation
- `backend/src/posts/dto/update-post.dto.ts` - class-validator DTO for caption update
- `backend/src/posts/__tests__/posts.service.spec.ts` - 27 unit tests for PostsService
- `backend/src/comments/comments.service.ts` - Comment CRUD with reply-to-reply flattening
- `backend/src/comments/comments.controller.ts` - REST endpoints for comments
- `backend/src/comments/comments.module.ts` - CommentsModule importing MediaModule and AuthModule
- `backend/src/comments/dto/create-comment.dto.ts` - class-validator DTO for comment creation
- `backend/src/comments/__tests__/comments.service.spec.ts` - 10 unit tests for CommentsService
- `backend/src/feed/feed.service.ts` - Chronological feed query with batch like/bookmark check
- `backend/src/feed/feed.controller.ts` - GET /feed endpoint
- `backend/src/feed/feed.module.ts` - FeedModule importing MediaModule and AuthModule
- `backend/src/feed/__tests__/feed.service.spec.ts` - 5 unit tests for FeedService
- `backend/src/profiles/profiles.service.ts` - Added searchProfiles method
- `backend/src/profiles/profiles.controller.ts` - Added GET /profiles/search endpoint
- `backend/src/app.module.ts` - Registered PostsModule, CommentsModule, FeedModule

## Decisions Made
- HashtagsController as separate controller within PostsModule since /hashtags has a different route prefix than /posts
- CommentsController uses no-prefix @Controller() to handle both /posts/:postId/comments and /comments/:id routes cleanly
- FeedService uses read-time query with Follow subquery rather than fan-out-on-write -- simpler and correct at current scale, API contract stays the same if backend implementation changes later
- Profile search placed before :username route in ProfilesController to avoid NestJS routing conflicts

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DTO definite assignment for strict TypeScript**
- **Found during:** Task 2 (full test suite verification)
- **Issue:** class-validator DTOs with required properties (mediaIds, content) needed `!` definite assignment assertion for strict TypeScript mode used by e2e test compilation
- **Fix:** Added `!` to `mediaIds!: string[]` in CreatePostDto and `content!: string` in CreateCommentDto
- **Files modified:** backend/src/posts/dto/create-post.dto.ts, backend/src/comments/dto/create-comment.dto.ts
- **Verification:** All 136 unit tests pass, all workspaces build
- **Committed in:** 51f4136 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed literal type widening for CommentsService.getComments take parameter**
- **Found during:** Task 2 (full test suite verification)
- **Issue:** POST_LIMITS.commentsPageSize returns literal type `20` from `as const`, but controller passes `number | undefined` which is not assignable to `20 | undefined`
- **Fix:** Explicitly typed parameter as `take: number = POST_LIMITS.commentsPageSize`
- **Files modified:** backend/src/comments/comments.service.ts
- **Verification:** Build succeeds, all tests pass
- **Committed in:** 51f4136 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes required for TypeScript strict mode compilation. No scope creep.

## Issues Encountered
- Pre-existing e2e test (auth-e2e.spec.ts) fails due to database schema mismatch -- requires `prisma db push` when Docker database is available. Not caused by this plan's changes, not in scope.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All backend API endpoints ready for frontend consumption in Plans 03-03 and 03-04
- POST /posts, GET /posts/:id, PATCH/DELETE /posts/:id, like/bookmark toggles all implemented
- GET /posts/:postId/comments and POST /posts/:postId/comments for comment UI
- GET /feed for feed page
- GET /hashtags/search and GET /profiles/search for autocomplete
- Schema migration (prisma db push) still needed before e2e testing

---
*Phase: 03-content-feed*
*Completed: 2026-03-14*

## Self-Check: PASSED

- All 17 created files verified present on disk
- Commit 33904cf (Task 1 RED) verified in git log
- Commit 2069b57 (Task 1 GREEN) verified in git log
- Commit c9f5d2c (Task 2 RED) verified in git log
- Commit 51f4136 (Task 2 GREEN) verified in git log
