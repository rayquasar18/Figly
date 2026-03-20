---
phase: 04-collection-system
plan: 02
subsystem: api
tags: [nestjs, prisma, collection, rest-api, pagination, typescript]

# Dependency graph
requires:
  - phase: 04-collection-system
    provides: "Prisma schema with 10 collection models, shared types/DTOs, seed data"
  - phase: 01-foundation-auth
    provides: "JwtAuthGuard, OptionalJwtAuthGuard, PrismaModule"
  - phase: 03.1-public-viewing-mode
    provides: "OptionalJwtAuthGuard for unauthenticated read access"
provides:
  - "CollectionService with 11 methods for browse, search, owned/wishlist toggle, follow, batch status"
  - "CollectionController with 10 REST endpoints"
  - "CollectionModule registered in AppModule"
  - "26 unit tests covering all service methods"
affects: [04-03, 04-04, 04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Owned/wishlist toggle with $transaction for mutual exclusion and P2002 idempotency"
    - "Batch item status check (IN clause + Set) for viewer-aware collection responses"
    - "Category -> Series -> Items hierarchical browsing with slug-based lookup"
    - "Composite unique key lookup (categoryId_slug) for series resolution"

key-files:
  created:
    - backend/src/collection/collection.service.ts
    - backend/src/collection/collection.controller.ts
    - backend/src/collection/collection.module.ts
    - backend/src/collection/dto/collection.dto.ts
    - backend/src/collection/__tests__/collection.service.spec.ts
  modified:
    - backend/src/app.module.ts

key-decisions:
  - "Vietnamese error messages in NotFoundException for consistency with project convention"
  - "Toggle endpoints return { success: true, isOwned/isWishlisted: boolean } for frontend state updates"
  - "Batch status check uses Promise.all for parallel owned + wishlist queries"

patterns-established:
  - "Collection toggle pattern: $transaction with findUnique->delete OR deleteMany-opposite->create with P2002 catch"
  - "Hierarchical slug resolution: category by slug, then series by composite categoryId_slug"
  - "Viewer-aware list responses: batch status check only when viewerId is non-null"

requirements-completed: [COLL-01, COLL-02, COLL-03, COLL-04, SOCL-04]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 04 Plan 02: Collection Module API Summary

**CollectionModule with 10 REST endpoints for browsing categories/series/items, search, owned/wishlist toggle with mutual exclusion, follow categories/series, and batch viewer status checks**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-14T23:34:17Z
- **Completed:** 2026-03-14T23:39:17Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 6

## Accomplishments
- Built CollectionService with 11 methods: getCategories, getSeriesByCategory, getItemsBySeries, getItemDetail, searchItems, toggleOwned, toggleWishlist, followCategory, followSeries, getItemStatuses, getUserOwnedItems
- CollectionController with 10 endpoints -- OptionalJwtAuthGuard on reads, JwtAuthGuard on writes
- Owned/wishlist toggle with $transaction for mutual exclusion (adding owned removes wishlist, and vice versa) with P2002 idempotency handling
- Batch status check pattern (IN clause + Set) for O(1) viewer-aware responses
- 26 unit tests covering all service methods pass

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests for CollectionService** - `d1d40ee` (test)
2. **Task 1 (GREEN): Implement CollectionModule** - `ce0d65c` (feat)

## Files Created/Modified
- `backend/src/collection/collection.service.ts` - 11 methods: browse, search, toggle owned/wishlist, follow, batch status check, user owned items
- `backend/src/collection/collection.controller.ts` - 10 REST endpoints with proper guards
- `backend/src/collection/collection.module.ts` - Standard NestJS module exporting CollectionService
- `backend/src/collection/dto/collection.dto.ts` - Re-exports searchItemsSchema from shared package
- `backend/src/collection/__tests__/collection.service.spec.ts` - 26 unit tests with mocked PrismaService
- `backend/src/app.module.ts` - Added CollectionModule to imports

## Decisions Made
- Vietnamese error messages in NotFoundException ("Danh muc khong ton tai", "Bo suu tap khong ton tai", "Vat pham khong ton tai", "Nguoi dung khong ton tai") for consistency with project convention
- Toggle endpoints return `{ success: true, isOwned/isWishlisted: boolean }` for direct frontend state updates
- Batch status check uses `Promise.all` for parallel owned + wishlist queries, minimizing latency
- Follow toggle uses findUnique + create/delete pattern (same as SocialService) with P2002/P2025 idempotency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed import paths for shared package**
- **Found during:** Task 1 GREEN (implementation)
- **Issue:** Initial import `@figly/shared/types/collection.types` not supported by project's source-only shared package pattern -- all imports must use `@figly/shared` (package root)
- **Fix:** Changed to `import type { ... } from '@figly/shared'` and DTO re-exports from `@figly/shared`
- **Files modified:** collection.service.ts, dto/collection.dto.ts
- **Verification:** All 26 tests pass
- **Committed in:** ce0d65c (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Import path fix was necessary for TypeScript resolution. No scope creep.

## Issues Encountered
None beyond the import path correction documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CollectionModule API fully functional, ready for frontend consumption (04-04)
- CollectionService exported for use by checklist module (04-03) and post-item linking (04-05)
- All 10+ endpoints match the route structure specified in the plan
- Viewer-aware responses ready for authenticated and unauthenticated browsing

---
*Phase: 04-collection-system*
*Completed: 2026-03-15*

## Self-Check: PASSED

All 5 created files verified present. Both task commits (d1d40ee, ce0d65c) verified in git log.
