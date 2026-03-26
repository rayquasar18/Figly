---
phase: 18-frontend-regression-restore
plan: 01
subsystem: ui
tags: [react, nextjs, imports, barrel-exports, typescript]

# Dependency graph
requires:
  - phase: 14-frontend-restructure
    provides: features/ directory structure with barrel exports
  - phase: 11-bugfixes-ux-flow
    provides: simplified signup DTO (email + password only)
provides:
  - 10 stale imports fixed across 6 feature component files
  - useSignupMutation type aligned with Phase 11 backend SignupDto
affects: [18-frontend-regression-restore]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cross-feature imports use barrel (@/features/auth), within-feature use relative (../hooks/)"
    - "Auth store accessed via @/features/auth barrel from outside auth feature"

key-files:
  created: []
  modified:
    - frontend/src/features/auth/hooks/auth-queries.ts
    - frontend/src/features/post/components/post-card.tsx
    - frontend/src/features/post/components/post-detail-modal.tsx
    - frontend/src/features/collection/components/owned-wishlist-toggle.tsx
    - frontend/src/features/profile/components/profile-edit-modal.tsx
    - frontend/src/features/social/components/follow-button.tsx

key-decisions:
  - "All within-feature imports use relative paths (../hooks/, ../stores/)"
  - "All cross-feature imports use barrel paths (@/features/auth, @/features/comment)"

patterns-established:
  - "Import convention: relative for same feature, barrel for cross-feature"

requirements-completed: [FRNT-01]

# Metrics
duration: 2min
completed: 2026-03-27
---

# Phase 18 Plan 01: Stale Import Fix Summary

**Replaced 10 deprecated imports across 6 feature files and simplified useSignupMutation to email+password type**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-26T21:32:16Z
- **Completed:** 2026-03-26T21:34:17Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Replaced all @/stores/*, @/hooks/queries/*, @/components/[domain]/* imports with correct @/features/* barrel or relative paths
- Simplified useSignupMutation type from {email, password, name, username} to {email, password} matching Phase 11 backend
- Zero stale imports remaining in features/ directory

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix stale imports in 6 features/ component files** - `6a57437` (fix)
2. **Task 2: Fix useSignupMutation type to match Phase 11 simplified signup** - `4da7891` (fix)

## Files Created/Modified
- `frontend/src/features/auth/hooks/auth-queries.ts` - Fixed auth store import path, simplified signup type
- `frontend/src/features/post/components/post-card.tsx` - Fixed auth store and like mutation imports
- `frontend/src/features/post/components/post-detail-modal.tsx` - Fixed post detail and comment list imports
- `frontend/src/features/collection/components/owned-wishlist-toggle.tsx` - Fixed auth store and collection query imports
- `frontend/src/features/profile/components/profile-edit-modal.tsx` - Fixed profile query imports
- `frontend/src/features/social/components/follow-button.tsx` - Fixed auth store and social query imports

## Decisions Made
None - followed plan as specified. All barrel exports already existed in the target index.ts files.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All features/ files now use correct import paths
- Ready for Plan 18-02 (TypeScript compilation fixes)

## Self-Check: PASSED

All 6 modified files exist. Both task commits (6a57437, 4da7891) verified in git log.

---
*Phase: 18-frontend-regression-restore*
*Completed: 2026-03-27*
