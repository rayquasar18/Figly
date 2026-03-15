---
phase: 04-collection-system
plan: 05
subsystem: ui
tags: [react, tanstack-query, shadcn, checklist, collection, profile-tabs, follow]

# Dependency graph
requires:
  - phase: 04-03
    provides: Checklist backend API endpoints
  - phase: 04-04
    provides: Collection frontend pages, item cards, search items hooks
provides:
  - Checklist CRUD pages (list, create, detail with entries)
  - Checklist query hooks with optimistic updates
  - CollectionShowcase component for profile collection tab
  - FollowSeriesButton component for series/category follow
  - useFollowSeries and useFollowCategory mutations
  - Profile page Collection tab alongside Posts tab
affects: [06-item-picker, profile-enhancements]

# Tech tracking
tech-stack:
  added: [shadcn/ui checkbox, shadcn/ui progress, shadcn/ui switch]
  patterns: [optimistic-toggle-checklist, profile-tabs-pattern, auth-gate-follow-button]

key-files:
  created:
    - frontend/src/hooks/queries/checklist-queries.ts
    - frontend/src/components/checklist/checklist-card.tsx
    - frontend/src/components/checklist/checklist-entry.tsx
    - frontend/src/components/checklist/checklist-form.tsx
    - frontend/src/app/(app)/checklists/page.tsx
    - frontend/src/app/(app)/checklists/new/page.tsx
    - frontend/src/app/(app)/checklists/[checklistId]/page.tsx
    - frontend/src/components/collection/collection-showcase.tsx
    - frontend/src/components/collection/follow-series-button.tsx
  modified:
    - frontend/src/hooks/queries/collection-queries.ts
    - frontend/src/app/(public)/[username]/page.tsx
    - frontend/src/app/(public)/collection/[categorySlug]/page.tsx
    - frontend/src/app/(public)/collection/[categorySlug]/[seriesSlug]/page.tsx

key-decisions:
  - "ChecklistEntry reorder uses full array swap and sends complete entryIds list"
  - "FollowSeriesButton reuses same pattern as user FollowButton (auth gate, optimistic toggle, hover destructive)"
  - "CollectionShowcase uses inline useQuery for /collection/users/:username/owned rather than a shared hook"
  - "Category follow button passes isFollowed=false since CategoryResponse lacks isFollowed field"

patterns-established:
  - "Profile tabs pattern: Tabs component in profile page with Posts and Collection tabs"
  - "Checklist optimistic pattern: toggle isChecked in cache, recompute checkedEntries count"

requirements-completed: [COLL-05, COLL-06, COLL-07, PROF-04, SOCL-04]

# Metrics
duration: 9min
completed: 2026-03-15
---

# Phase 4 Plan 5: Checklist Frontend and Collection Showcase Summary

**Checklist CRUD pages with progress bars, profile Collection tab with owned items by category, and follow/unfollow buttons on series and category pages**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-15T00:00:57Z
- **Completed:** 2026-03-15T00:09:35Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments
- Full checklist experience: create, add entries (database items + freeform), check/uncheck with optimistic toggle, reorder with up/down arrows, delete with confirmation dialog
- Profile page now has Collection tab showing owned items grouped by category, with "Xem checklist" link for profile owner
- Follow/unfollow buttons on series and category pages using the same auth-gate pattern as user FollowButton
- Installed shadcn/ui checkbox, progress, and switch components for checklist UI

## Task Commits

Each task was committed atomically:

1. **Task 1: Checklist pages with CRUD, entries, and progress tracking** - `f523cc6` (feat)
2. **Task 2: Profile collection tab, collection showcase, and follow buttons** - `3bb3424` (feat)

## Files Created/Modified

- `frontend/src/hooks/queries/checklist-queries.ts` - TanStack Query hooks for all checklist CRUD operations with optimistic updates
- `frontend/src/components/checklist/checklist-card.tsx` - Card with name, progress bar, relative time, public badge
- `frontend/src/components/checklist/checklist-entry.tsx` - Entry row with checkbox, item thumbnail, reorder arrows, delete
- `frontend/src/components/checklist/checklist-form.tsx` - Reusable form with name input and public toggle via react-hook-form + zod
- `frontend/src/app/(app)/checklists/page.tsx` - "Checklist cua toi" list page with grid of cards
- `frontend/src/app/(app)/checklists/new/page.tsx` - Create checklist page with form
- `frontend/src/app/(app)/checklists/[checklistId]/page.tsx` - Detail page with entries, inline edit, delete confirm, add sections
- `frontend/src/components/collection/collection-showcase.tsx` - Profile tab showing owned items by category with empty state
- `frontend/src/components/collection/follow-series-button.tsx` - Follow/unfollow toggle with auth gate and hover destructive styling
- `frontend/src/hooks/queries/collection-queries.ts` - Added useFollowSeries and useFollowCategory mutations
- `frontend/src/app/(public)/[username]/page.tsx` - Added Collection tab with CollectionShowcase
- `frontend/src/app/(public)/collection/[categorySlug]/page.tsx` - Added follow button for categories
- `frontend/src/app/(public)/collection/[categorySlug]/[seriesSlug]/page.tsx` - Added follow button for series
- `frontend/src/components/ui/checkbox.tsx` - shadcn/ui checkbox component
- `frontend/src/components/ui/progress.tsx` - shadcn/ui progress bar component
- `frontend/src/components/ui/switch.tsx` - shadcn/ui switch toggle component

## Decisions Made

- ChecklistEntry reorder uses full array swap and sends complete entryIds list via useReorderEntries
- FollowSeriesButton follows the exact same pattern as the user FollowButton (auth-gate via useAuthStore.getState(), optimistic toggle, hover shows destructive "Bo theo doi" styling)
- CollectionShowcase uses an inline useQuery for owned items rather than a shared hook, since it's only used in one place
- Category follow button hardcodes isFollowed=false since CategoryResponse type doesn't include an isFollowed field (backend enhancement deferred)
- Add entry from database uses simple text input for itemId; will be replaced with ItemPicker in Plan 06

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed mutation variable types for useToggleEntry and useRemoveEntry**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** mutationFn declared narrower type `{ entryId: string }` but onMutate/onSuccess expected `{ entryId: string; checklistId: string }`
- **Fix:** Added checklistId to the mutationFn parameter destructuring type
- **Files modified:** frontend/src/hooks/queries/checklist-queries.ts
- **Verification:** TypeScript compiles without errors
- **Committed in:** f523cc6 (Task 1 commit)

**2. [Rule 3 - Blocking] Installed missing shadcn/ui components**
- **Found during:** Task 1 (setup)
- **Issue:** checkbox, progress, and switch components not yet installed
- **Fix:** Ran `npx shadcn@latest add progress switch checkbox`
- **Files modified:** frontend/src/components/ui/{checkbox,progress,switch}.tsx, package.json, pnpm-lock.yaml
- **Verification:** Components import and compile successfully
- **Committed in:** f523cc6 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Checklist frontend complete, ready for ItemPicker integration in Plan 06
- Collection showcase ready; will benefit from real data once users start marking items as owned
- Follow buttons wired up; category isFollowed status requires backend enhancement for true optimistic state

---
*Phase: 04-collection-system*
*Completed: 2026-03-15*

## Self-Check: PASSED

All 12 created files verified. Both task commits (f523cc6, 3bb3424) verified in git log.
