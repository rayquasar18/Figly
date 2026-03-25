---
phase: 16-shared-package-cleanup
plan: 01
subsystem: shared
tags: [zod, schemas, barrel-exports, refactoring, monorepo]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    provides: Original shared package with dto/ directory
  - phase: 10-reels
    provides: reel.dto.ts and reel.constants.ts files
provides:
  - Renamed schemas/ directory with 7 .schema.ts files
  - Fixed barrel exports for createReelSchema, CreateReelInput, REEL_LIMITS
  - Updated STRUCTURE.md documentation
affects: [16-02-shared-package-cleanup, all-future-shared-package-work]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Schema files named {domain}.schema.ts in schemas/ directory"
    - "All shared exports via barrel in index.ts -- no deep imports"

key-files:
  created: []
  modified:
    - packages/shared/src/index.ts
    - packages/shared/src/constants/index.ts
    - packages/shared/src/schemas/auth.schema.ts
    - packages/shared/src/schemas/post.schema.ts
    - packages/shared/src/schemas/profile.schema.ts
    - packages/shared/src/schemas/comment.schema.ts
    - packages/shared/src/schemas/collection.schema.ts
    - packages/shared/src/schemas/checklist.schema.ts
    - packages/shared/src/schemas/reel.schema.ts
    - .planning/codebase/STRUCTURE.md

key-decisions:
  - "Removed stale dist/dto/ alongside src rename to keep dist consistent"
  - "Kept backend dto/ references in STRUCTURE.md since those are NestJS-internal DTOs, not shared package"

patterns-established:
  - "Shared package Zod schemas live in packages/shared/src/schemas/{domain}.schema.ts"

requirements-completed: [SHRD-01]

# Metrics
duration: 4min
completed: 2026-03-26
---

# Phase 16 Plan 01: Rename dto/ to schemas/ Summary

**Renamed shared package dto/ to schemas/ with 7 files, updated barrel imports, and fixed missing reel + REEL_LIMITS barrel exports**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T23:45:29Z
- **Completed:** 2026-03-25T23:49:45Z
- **Tasks:** 2
- **Files modified:** 31

## Accomplishments
- Renamed all 7 DTO files from `*.dto.ts` to `*.schema.ts` in new `schemas/` directory using `git mv` for history preservation
- Updated all 12 barrel import lines in `index.ts` from `./dto/*.dto` to `./schemas/*.schema`
- Fixed latent bug: added missing `createReelSchema` and `CreateReelInput` exports to barrel (reduced backend build errors from 17 to 4)
- Fixed latent bug: added `REEL_LIMITS` to constants barrel re-export
- Updated STRUCTURE.md documentation to reflect the rename

## Task Commits

Each task was committed atomically:

1. **Task 1: Rename dto/ to schemas/ and update barrel imports** - `ce7ae77` (refactor)
2. **Task 2: Update STRUCTURE.md documentation** - `85d5713` (docs)

## Files Created/Modified
- `packages/shared/src/schemas/*.schema.ts` (7 files) - Renamed from dto/*.dto.ts
- `packages/shared/src/index.ts` - Updated barrel imports to schemas/ paths + added reel exports
- `packages/shared/src/constants/index.ts` - Added REEL_LIMITS re-export
- `packages/shared/dist/schemas/` - Rebuilt dist with new paths
- `.planning/codebase/STRUCTURE.md` - Updated documentation to reflect rename

## Decisions Made
- Removed stale `dist/dto/` directory alongside the source rename to keep the dist output consistent with source structure
- Backend module `dto/` references in STRUCTURE.md kept as-is since those describe NestJS-internal DTOs, not the shared package

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed stale dist/dto/ directory**
- **Found during:** Task 1 (after build)
- **Issue:** `tsc` does not clean old output files; `dist/dto/` remained after rename creating inconsistency
- **Fix:** `git rm -r packages/shared/dist/dto/` to remove stale compiled files
- **Files modified:** packages/shared/dist/dto/ (18 files removed)
- **Verification:** Only dist/schemas/ exists after rebuild
- **Committed in:** ce7ae77 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary cleanup to keep dist/ consistent with source. No scope creep.

## Issues Encountered
- Backend build has 4 pre-existing TypeScript errors (3x missing class-validator module, 1x user.name null type) that exist on the base branch and are unrelated to the shared package rename. The rename actually resolved 13 additional backend errors by fixing the missing reel barrel exports.

## Known Stubs
None -- all files are fully wired with no placeholder data.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Shared package now uses clean `schemas/` naming aligned with content (Zod schemas)
- Ready for Plan 16-02: remove dist/ from git tracking and update .gitignore
- All barrel exports verified working including the previously missing reel exports

---
*Phase: 16-shared-package-cleanup*
*Completed: 2026-03-26*

## Self-Check: PASSED

- All 7 schema files exist in packages/shared/src/schemas/
- packages/shared/src/dto/ directory confirmed removed
- Barrel file (index.ts) and constants barrel updated
- Commit ce7ae77 (Task 1) found
- Commit 85d5713 (Task 2) found
