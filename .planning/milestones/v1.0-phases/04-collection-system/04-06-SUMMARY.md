---
phase: 04-collection-system
plan: 06
subsystem: ui
tags: [next.js, react, tanstack-query, tailwind, shadcn-ui, item-picker, post-linking, checklist]

# Dependency graph
requires:
  - phase: 04-03
    provides: PostsModule with linkedItemIds in createPost, PostResponse with linkedItems field
  - phase: 04-04
    provides: useSearchItems hook, collection-queries.ts with item search and infinite scroll
  - phase: 04-05
    provides: Checklist detail page with entry management, collection showcase
provides:
  - "ItemPicker dialog component with single/multi select modes and debounced search"
  - "Post creation flow extended with item linking (linkedItemIds sent to API)"
  - "PostCard shows linked item badges (max 3 + overflow)"
  - "PostDetailModal shows all linked items between caption and comments"
  - "Checklist detail uses ItemPicker in single-select mode for adding database items"
  - "Badge UI component (shadcn pattern)"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ItemPicker reusable dialog with mode prop for single vs multi select behavior"
    - "LinkedItemResponse tracked in create-post store alongside IDs for display"
    - "Post linked items displayed as tappable Badge components with Package icon"

key-files:
  created:
    - frontend/src/components/collection/item-picker.tsx
    - frontend/src/components/ui/badge.tsx
  modified:
    - frontend/src/stores/create-post-store.ts
    - frontend/src/components/create-post/step-caption.tsx
    - frontend/src/components/create-post/create-post-flow.tsx
    - frontend/src/components/post/post-card.tsx
    - frontend/src/components/post/post-detail-modal.tsx
    - frontend/src/app/(app)/checklists/[checklistId]/page.tsx
    - frontend/src/hooks/queries/post-queries.ts

key-decisions:
  - "ItemPicker onSelect returns both IDs and LinkedItemResponse objects for store hydration"
  - "Create-post store tracks both linkedItemIds (for API) and linkedItems (for display) in parallel arrays"
  - "PostCard shows max 3 linked item badges with +N overflow count for compact display"
  - "Checklist detail replaces manual ID input with ItemPicker in single-select mode"

patterns-established:
  - "ItemPicker reusable pattern: mode='single' auto-closes on select, mode='multi' has done button"
  - "Linked items displayed as Badge components with Package icon prefix and navigation to /item/:id"

requirements-completed: [CONT-07]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 4 Plan 6: Item Picker and Post-Item Linking Frontend Summary

**ItemPicker dialog with single/multi select, post creation item linking, linked item badges on post cards/detail, and checklist ItemPicker integration**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-15T00:14:13Z
- **Completed:** 2026-03-15T00:19:51Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Built ItemPicker dialog component supporting single-select (checklists) and multi-select (posts) modes with debounced search and infinite scroll
- Extended create-post flow with "Lien ket vat pham" button, selected item chips, and linkedItemIds in API call
- PostCard displays linked item badges (max 3 with overflow count), PostDetailModal shows all linked items
- Checklist detail page upgraded from manual ID input to proper ItemPicker search dialog

## Task Commits

Each task was committed atomically:

1. **Task 1: ItemPicker dialog and create-post store extension** - `7ad850d` (feat)
2. **Task 2: Wire item linking into post creation, display, and checklists** - `3f58434` (feat)

## Files Created/Modified
- `frontend/src/components/collection/item-picker.tsx` - Reusable ItemPicker dialog with search, single/multi select, infinite scroll
- `frontend/src/components/ui/badge.tsx` - shadcn Badge component (was missing dependency)
- `frontend/src/stores/create-post-store.ts` - Extended with linkedItemIds, linkedItems, add/remove/setLinkedItems actions
- `frontend/src/components/create-post/step-caption.tsx` - Added item linking button and selected item chips below caption
- `frontend/src/components/create-post/create-post-flow.tsx` - Sends linkedItemIds in createPost API call
- `frontend/src/components/post/post-card.tsx` - Shows linked item badges with Package icon (max 3 + overflow)
- `frontend/src/components/post/post-detail-modal.tsx` - Shows all linked items between caption and comments
- `frontend/src/app/(app)/checklists/[checklistId]/page.tsx` - Replaced manual ID input with ItemPicker in single-select mode
- `frontend/src/hooks/queries/post-queries.ts` - Updated useCreatePost mutation type to accept linkedItemIds

## Decisions Made
- ItemPicker onSelect callback returns both IDs array and LinkedItemResponse array so the store can be hydrated without extra API calls
- Create-post store tracks linkedItemIds (for API submission) and linkedItems (for UI display) as parallel arrays with synchronized add/remove
- PostCard shows max 3 linked item badges to avoid layout bloat on feed, with "+N khac" overflow indicator
- Checklist detail completely replaced the placeholder manual ID input with a proper ItemPicker dialog in single-select mode

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing Badge UI component**
- **Found during:** Task 1 (ItemPicker implementation)
- **Issue:** Badge component referenced in plan but not present in UI components directory
- **Fix:** Created Badge component following shadcn/ui pattern with class-variance-authority variants
- **Files modified:** frontend/src/components/ui/badge.tsx
- **Verification:** TypeScript compiles, component renders correctly
- **Committed in:** 7ad850d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential dependency for ItemPicker and post card badge display. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 (Collection System) fully complete: all 6 plans executed
- Post-item linking end-to-end: create post with linked items, display on feed/detail
- ItemPicker reusable for any future item selection needs
- Ready for Phase 5

---
*Phase: 04-collection-system*
*Completed: 2026-03-15*

## Self-Check: PASSED

All 9 created/modified files verified present. Both task commits (7ad850d, 3f58434) verified in git log.
