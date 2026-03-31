---
phase: 04-collection-system
plan: 01
subsystem: database
tags: [prisma, postgresql, seed-data, typescript, zod, collection-system]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    provides: "Prisma schema with User model, shared package export patterns"
  - phase: 03-content-feed
    provides: "Post model for PostItem relation"
provides:
  - "10 new Prisma models for collection system (Category, Series, Item, OwnedItem, WishlistItem, Checklist, ChecklistEntry, PostItem, CategoryFollow, SeriesFollow)"
  - "Shared TypeScript types for all collection and checklist API responses"
  - "Shared DTOs with Zod validators and Vietnamese error messages"
  - "COLLECTION_LIMITS constant for frontend/backend consistency"
  - "Idempotent seed data: 4 categories, 15 series, 154 items"
affects: [04-02, 04-03, 04-04, 04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Deterministic seed IDs via seedId() helper for idempotent upserts"
    - "prisma.$transaction for atomic seed operations"
    - "@@map directives on all models for PostgreSQL table naming"
    - "Composite unique constraints for natural keys (categoryId_slug)"

key-files:
  created:
    - backend/prisma/seed-collections.ts
    - backend/prisma/seed.ts
    - packages/shared/src/types/collection.types.ts
    - packages/shared/src/types/checklist.types.ts
    - packages/shared/src/dto/collection.dto.ts
    - packages/shared/src/dto/checklist.dto.ts
  modified:
    - backend/prisma/schema.prisma
    - backend/package.json
    - packages/shared/src/constants/index.ts
    - packages/shared/src/index.ts

key-decisions:
  - "Deterministic seed IDs using category+series+item slug pattern for idempotent upserts without requiring unique name constraints"
  - "15 series across 4 categories (Gundam 4, Figurines 4, Sneakers 4, Trading Cards 3) covering diverse collector domains"
  - "No imageKey or releaseDate in seed data -- placeholder icons recommended per research for initial UI"

patterns-established:
  - "Seed ID pattern: seedId(category, series, item) for deterministic, collision-free IDs"
  - "Collection type pattern: Response interfaces mirror Prisma model shape with computed fields (counts, status booleans)"
  - "DTO pattern: Zod schemas with Vietnamese validation messages exported alongside inferred types"

requirements-completed: [COLL-01, COLL-02, COLL-03, COLL-04, COLL-05, COLL-06, COLL-07, CONT-07, SOCL-04]

# Metrics
duration: 4min
completed: 2026-03-15
---

# Phase 04 Plan 01: Collection Data Foundation Summary

**Prisma schema with 10 collection models, shared types/DTOs with Vietnamese validation, and idempotent seed data (4 categories, 15 series, 154 items)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T23:24:42Z
- **Completed:** 2026-03-14T23:29:11Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Extended Prisma schema with 10 new models covering categories, series, items, ownership, wishlists, checklists, post-item links, and follows
- Created shared TypeScript types for all collection and checklist API responses (8 interfaces)
- Created Zod DTOs with Vietnamese error messages for search, checklist CRUD, and entry reordering
- Built idempotent seed script with 154 real-world items across Gundam, Figurines, Sneakers, and Trading Cards

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend Prisma schema with collection models and shared types/DTOs/constants** - `91ad509` (feat)
2. **Task 2: Create idempotent collection seed script with 4 categories** - `007e7c0` (feat)

## Files Created/Modified
- `backend/prisma/schema.prisma` - Added 10 new models with relations, indexes, and @@map directives; added 5 relations to User and 1 to Post
- `backend/prisma/seed-collections.ts` - Idempotent seed script with 4 categories, 15 series, 154 items using deterministic IDs
- `backend/prisma/seed.ts` - Seed entry point importing seedCollections
- `backend/package.json` - Added prisma.seed configuration for ts-node execution
- `packages/shared/src/types/collection.types.ts` - CategoryResponse, SeriesResponse, ItemResponse, ItemDetailResponse, LinkedItemResponse
- `packages/shared/src/types/checklist.types.ts` - ChecklistResponse, ChecklistEntryResponse, ChecklistDetailResponse
- `packages/shared/src/dto/collection.dto.ts` - searchItemsSchema with SearchItemsDto
- `packages/shared/src/dto/checklist.dto.ts` - createChecklistSchema, updateChecklistSchema, addChecklistEntrySchema, reorderEntriesSchema with types
- `packages/shared/src/constants/index.ts` - Added COLLECTION_LIMITS constant
- `packages/shared/src/index.ts` - Added exports for all new types, DTOs, and constants

## Decisions Made
- Used deterministic seed IDs (seedId helper) based on category+series+item slug for idempotent upserts without requiring unique name constraints on the Item model
- 15 series across 4 categories providing broad collector domain coverage
- No imageKey or releaseDate in seed data -- kept simple per research recommendation for placeholder icons in initial UI

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Schema foundation complete with all 10 models, ready for backend API development (04-02)
- Shared types available for type-safe frontend development (04-03 through 04-06)
- Seed data provides 154 items for immediate testing of collection browsing and search
- All collection/checklist DTOs ready for controller validation

---
*Phase: 04-collection-system*
*Completed: 2026-03-15*

## Self-Check: PASSED

All 10 files verified present. Both task commits (91ad509, 007e7c0) verified in git log.
