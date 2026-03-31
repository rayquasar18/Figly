---
phase: 02-profiles-social-graph
plan: 02
subsystem: api, backend
tags: [nestjs, profiles, social-graph, follow, cursor-pagination, username-cooldown, presigned-url]

# Dependency graph
requires:
  - phase: 02-profiles-social-graph/01
    provides: Prisma User model with username/bio/avatarId/usernameChangedAt, Follow model, shared ProfileResponse/UserListItem/PaginatedResponse types, USERNAME_RULES/RESERVED_USERNAMES constants
  - phase: 01-foundation-auth/02
    provides: AuthService, JwtAuthGuard, EmailVerifiedGuard
  - phase: 01-foundation-auth/03
    provides: MediaModule with StorageService (presigned URL generation)
provides:
  - ProfilesService with getProfile, updateProfile, isUsernameAvailable methods
  - SocialService with follow, unfollow, getFollowers, getFollowing, removeFollower methods
  - ProfilesController with GET /profiles/:username, PATCH /profiles/me, GET /profiles/check/:username
  - SocialController with POST/DELETE /social/follow/:userId, GET /social/:username/followers|following, DELETE /social/followers/:userId
  - ProfilesModule and SocialModule registered in AppModule
  - 32 unit tests covering all profile and social service methods
affects: [02-03, 02-04, 03-content, 04-collections]

# Tech tracking
tech-stack:
  added: []
  patterns: [cursor-pagination-take-plus-one, batch-follow-status-check, prisma-error-idempotency, username-cooldown-enforcement]

key-files:
  created:
    - backend/src/profiles/profiles.service.ts
    - backend/src/profiles/profiles.controller.ts
    - backend/src/profiles/profiles.module.ts
    - backend/src/profiles/dto/update-profile.dto.ts
    - backend/src/profiles/__tests__/profiles.service.spec.ts
    - backend/src/social/social.service.ts
    - backend/src/social/social.controller.ts
    - backend/src/social/social.module.ts
    - backend/src/social/__tests__/social.service.spec.ts
  modified:
    - backend/src/app.module.ts

key-decisions:
  - "ProfilesModule imports MediaModule for StorageService access to resolve avatar presigned URLs"
  - "Cursor pagination uses take+1 pattern: fetch one extra record to determine hasMore without a separate count query"
  - "Follow/unfollow operations are idempotent via P2002/P2025 Prisma error catching -- no error thrown on duplicate follow or non-existent unfollow"
  - "Batch follow-status check: single query with IN clause for all user IDs in list, then Set for O(1) lookup per item"

patterns-established:
  - "Cursor pagination pattern: take+1 fetch, slice to take, last item ID as nextCursor, hasMore from overflow detection"
  - "Prisma error idempotency: catch P2002 (unique violation) on create and P2025 (not found) on delete, return success instead of error"
  - "Batch relationship check: query all relationships in one findMany with IN clause, build Set for O(1) per-item lookup"
  - "Username cooldown: compare usernameChangedAt + cooldownDays against current date before allowing change"

requirements-completed: [PROF-03, SOCL-01, SOCL-02]

# Metrics
duration: 6min
completed: 2026-03-14
---

# Phase 2 Plan 2: Profiles & Social Modules Summary

**NestJS profiles and social modules with profile retrieval (avatar presigned URLs, follower counts, relationship flags), username update with 14-day cooldown, follow/unfollow with idempotency, and cursor-paginated follower/following lists with search and batch follow-status checking**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-13T21:00:59Z
- **Completed:** 2026-03-13T21:06:41Z
- **Tasks:** 2 (both TDD: RED + GREEN)
- **Files modified:** 10

## Accomplishments
- Built ProfilesService with getProfile (returns ProfileResponse with _count, isFollowing, isFollowedBy, avatar presigned URL), updateProfile (username cooldown, uniqueness, reserved name enforcement), and isUsernameAvailable
- Built SocialService with follow (self-follow prevention, P2002 idempotency), unfollow (P2025 idempotency), getFollowers/getFollowing (cursor pagination, search filter, batch follow-status), and removeFollower
- Created UpdateProfileDto with class-validator decorators and Vietnamese error messages
- Registered ProfilesModule and SocialModule in AppModule
- 32 unit tests passing (18 profiles + 14 social), 99 total unit tests passing, all 3 workspaces build

## Task Commits

Each task was committed atomically (TDD):

1. **Task 1: Profiles module with get/update profile and username check**
   - `7b40b25` (test) - TDD RED: failing tests for profiles service (18 tests)
   - `9df127a` (feat) - TDD GREEN: implement profiles service, controller, module, DTO

2. **Task 2: Social module with follow/unfollow and follower/following lists**
   - `dab208b` (test) - TDD RED: failing tests for social service (14 tests)
   - `6213693` (feat) - TDD GREEN: implement social service, controller, module, register in app.module

## Files Created/Modified
- `backend/src/profiles/profiles.service.ts` - Profile CRUD with username cooldown, avatar URL resolution, isUsernameAvailable
- `backend/src/profiles/profiles.controller.ts` - GET /profiles/:username, PATCH /profiles/me, GET /profiles/check/:username
- `backend/src/profiles/profiles.module.ts` - Imports MediaModule for StorageService and AuthModule for guards
- `backend/src/profiles/dto/update-profile.dto.ts` - class-validator DTO with Vietnamese error messages
- `backend/src/profiles/__tests__/profiles.service.spec.ts` - 18 unit tests for ProfilesService
- `backend/src/social/social.service.ts` - Follow/unfollow with idempotency, cursor pagination, batch follow-status
- `backend/src/social/social.controller.ts` - POST/DELETE /social/follow/:userId, GET followers/following, DELETE /social/followers/:userId
- `backend/src/social/social.module.ts` - Imports AuthModule for guards
- `backend/src/social/__tests__/social.service.spec.ts` - 14 unit tests for SocialService
- `backend/src/app.module.ts` - Added ProfilesModule and SocialModule imports

## Decisions Made
- **ProfilesModule imports MediaModule:** StorageService is exported by MediaModule, so ProfilesModule imports it to resolve avatar presigned URLs. PrismaModule is global so no import needed.
- **Cursor pagination with take+1:** Fetches one extra record beyond the requested page size to determine if more results exist, avoiding an expensive separate COUNT query. The extra record is sliced off before returning.
- **Idempotent follow/unfollow:** Following an already-followed user or unfollowing a non-followed user both return success instead of throwing errors. This prevents race conditions in optimistic UI and simplifies frontend error handling.
- **Batch follow-status check:** Instead of N+1 queries to check if the viewer follows each user in a list, a single findMany with IN clause retrieves all relationships, then a Set provides O(1) per-item lookup.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- E2E tests (auth-e2e.spec.ts) fail at runtime because the database schema hasn't been pushed (same pre-existing issue from 02-01). This is expected -- Docker must be running for `prisma db push`. All unit tests pass (99/99).

## User Setup Required

None - no external service configuration required. Database migration from 02-01 still applies.

## Next Phase Readiness
- ProfilesService ready for frontend profile page consumption (Plan 02-03)
- SocialService ready for frontend follow button and follower/following list pages (Plan 02-04)
- GET /profiles/check/:username is public (no auth) for use in signup form username validation
- All API endpoints use JwtAuthGuard; write operations additionally require EmailVerifiedGuard
- Avatar URL resolution works through StorageService presigned URLs
- postCount is hardcoded to 0, will be updated in Phase 3 when posts are implemented

## Self-Check: PASSED

- All 10 plan files exist on disk
- Commit 7b40b25 (Task 1 RED) verified in git log
- Commit 9df127a (Task 1 GREEN) verified in git log
- Commit dab208b (Task 2 RED) verified in git log
- Commit 6213693 (Task 2 GREEN) verified in git log
- All 32 profile+social unit tests pass
- All 99 unit tests pass (full suite)
- `pnpm turbo build` passes for all 3 workspaces

---
*Phase: 02-profiles-social-graph*
*Completed: 2026-03-14*
