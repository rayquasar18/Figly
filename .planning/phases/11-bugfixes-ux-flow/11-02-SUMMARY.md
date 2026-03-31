---
phase: 11-bugfixes-ux-flow
plan: 02
subsystem: ui, api
tags: [react-query, zod, prisma, next.js, nestjs, typescript]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: Auth system with useMe() hook and username gate in (app)/layout.tsx
provides:
  - Complete-profile form with required displayName and auth cache invalidation
  - Public feed and reels feed filtering out null-username authors
  - PostAuthor.username typed as string | null for type safety
affects: [11-bugfixes-ux-flow, 12-framework-upgrades]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Invalidate React Query cache after profile mutation to sync auth state"
    - "Backend where-clause filtering for data integrity (null-username exclusion)"

key-files:
  created: []
  modified:
    - frontend/src/components/profile/complete-profile-form.tsx
    - packages/shared/src/types/post.types.ts
    - backend/src/feed/feed.service.ts
    - backend/src/feed/__tests__/public-feed.spec.ts
    - frontend/src/components/post/post-card.tsx
    - frontend/src/components/post/post-detail-modal.tsx
    - frontend/src/components/reel/reel-author-info.tsx
    - frontend/src/components/reel/reel-feed.tsx
    - frontend/src/app/(public)/post/[postId]/page.tsx

key-decisions:
  - "Made displayName required on complete-profile form (removed .optional())"
  - "Invalidate ['auth', 'me'] cache after profile update to prevent redirect loop"
  - "PostAuthor.username typed as string | null to reflect database reality"
  - "Filter null-username users at backend query level (not frontend)"

patterns-established:
  - "Cache invalidation pattern: invalidate auth queries after profile mutations that affect auth state"
  - "Data integrity pattern: filter incomplete profiles at query level rather than frontend guards"

requirements-completed: [BUGF-03, BUGF-04]

# Metrics
duration: 6min
completed: 2026-03-24
---

# Phase 11 Plan 02: Profile Redirect Fix & Explore Page Summary

**Fixed complete-profile redirect loop via React Query cache invalidation, made displayName required, and fixed explore page by filtering null-username authors from public/reels feeds with PostAuthor type correction**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-24T01:11:45Z
- **Completed:** 2026-03-24T01:18:17Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Complete-profile form now requires both username AND displayName (no .optional())
- Auth cache invalidated after profile update prevents redirect loop (layout username gate sees fresh data)
- Public feed and reels feed exclude posts from users without usernames
- PostAuthor.username typed as `string | null` with null-safety guards across all components

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix complete-profile redirect loop and make displayName required** - `6111661` (fix)
2. **Task 2: Fix explore page by filtering null-username authors and correcting PostAuthor type** - `4d13bfb` (fix)

## Files Created/Modified
- `frontend/src/components/profile/complete-profile-form.tsx` - Removed .optional() from displayName, added useQueryClient + cache invalidation
- `packages/shared/src/types/post.types.ts` - PostAuthor.username changed to string | null
- `backend/src/feed/feed.service.ts` - Added username not-null filter to getPublicFeed and getReelsFeed
- `backend/src/feed/__tests__/public-feed.spec.ts` - Updated test to expect username filter
- `frontend/src/components/post/post-card.tsx` - Null-safety guards for author.username
- `frontend/src/components/post/post-detail-modal.tsx` - Null-safety guards for author.username
- `frontend/src/components/reel/reel-author-info.tsx` - Null-safety guards for author.username
- `frontend/src/components/reel/reel-feed.tsx` - Null-safety guard for aria-label
- `frontend/src/app/(public)/post/[postId]/page.tsx` - Null-safety guards for author.username

## Decisions Made
- Made displayName required per D-11, D-12 decisions
- Invalidate auth cache before redirect per D-14, D-15 decisions
- Filter null-username users at backend query level (not frontend) for data integrity
- Added null-safety with `?? ''` fallback in all frontend components using PostAuthor.username

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript errors in additional components**
- **Found during:** Task 2 (PostAuthor type change)
- **Issue:** Changing PostAuthor.username to `string | null` caused TypeScript errors in post-detail-modal.tsx, reel-author-info.tsx, reel-feed.tsx, and post/[postId]/page.tsx (not listed in plan's files_modified)
- **Fix:** Added `?? ''` null-safety guards for all username usages in Link hrefs, alt text, aria-labels, and CaptionDisplay props
- **Files modified:** post-detail-modal.tsx, reel-author-info.tsx, reel-feed.tsx, post/[postId]/page.tsx
- **Verification:** `npx tsc --noEmit` passes with no source errors
- **Committed in:** 4d13bfb (Task 2 commit)

**2. [Rule 1 - Bug] Updated public-feed test to match new filter**
- **Found during:** Task 2 (backend where clause change)
- **Issue:** Test expected `where` to be undefined, but now includes username filter
- **Fix:** Updated test assertion to expect `{ postType: 'POST', user: { username: { not: null } } }`
- **Files modified:** backend/src/feed/__tests__/public-feed.spec.ts
- **Verification:** All 8 tests in public-feed.spec.ts pass
- **Committed in:** 4d13bfb (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for TypeScript compilation and test correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete-profile flow works end-to-end without redirect loop
- Explore page loads without errors from null-username authors
- Ready for Plan 03 (sidebar navigation)

---
*Phase: 11-bugfixes-ux-flow*
*Completed: 2026-03-24*

## Self-Check: PASSED
- All 9 modified files verified on disk
- Both task commits (6111661, 4d13bfb) found in git history
- SUMMARY.md created at expected path
