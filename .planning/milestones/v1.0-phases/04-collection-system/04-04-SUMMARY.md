---
phase: 04-collection-system
plan: 04
subsystem: ui
tags: [next.js, react, tanstack-query, tailwind, shadcn-ui, collection, search, optimistic-updates]

# Dependency graph
requires:
  - phase: 04-collection-system
    provides: "CollectionModule API with 10 REST endpoints for browse, search, toggle owned/wishlist"
  - phase: 03.1-public-viewing-mode
    provides: "OptionalJwtAuthGuard, requireAuth pattern, public page layout"
  - phase: 03-content-feed
    provides: "Optimistic update pattern (interaction-queries), IntersectionObserver infinite scroll, BottomNav"
provides:
  - "Collection browsing pages: /collection, /collection/:slug, /collection/:slug/:slug, /item/:id"
  - "7 TanStack Query hooks: useCategories, useSeriesByCategory, useItemsBySeries, useItemDetail, useSearchItems, useToggleOwned, useToggleWishlist"
  - "6 reusable components: CategoryCard, SeriesCard, ItemCard, ItemDetail, ItemSearch, OwnedWishlistToggle"
  - "Bottom nav collection entry point with Package icon"
affects: [04-05, 04-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Collection query hooks with optimistic toggle updates across item lists and detail queries"
    - "Auth-aware toggle: useAuthStore.getState().user check before mutation, redirect to /login if null"
    - "Debounced search (300ms) with useSearchItems enabled only when query >= 1 char"
    - "Cross-query optimistic updates: updateItemInQueries helper for items, searchItems, and itemDetail"

key-files:
  created:
    - frontend/src/hooks/queries/collection-queries.ts
    - frontend/src/app/(public)/collection/page.tsx
    - frontend/src/app/(public)/collection/[categorySlug]/page.tsx
    - frontend/src/app/(public)/collection/[categorySlug]/[seriesSlug]/page.tsx
    - frontend/src/app/(public)/item/[itemId]/page.tsx
    - frontend/src/components/collection/category-card.tsx
    - frontend/src/components/collection/series-card.tsx
    - frontend/src/components/collection/item-card.tsx
    - frontend/src/components/collection/item-detail.tsx
    - frontend/src/components/collection/item-search.tsx
    - frontend/src/components/collection/owned-wishlist-toggle.tsx
  modified:
    - frontend/src/components/layout/bottom-nav.tsx

key-decisions:
  - "OwnedWishlistToggle built as full component in Task 1 since ItemDetail depends on it for type-checking"
  - "Cross-query optimistic updates via updateItemInQueries helper for items, searchItems, and itemDetail consistency"
  - "Auth check uses useAuthStore.getState().user (same pattern as Phase 3.1) for synchronous auth gating"
  - "Category/series names derived from slug with replace(/-/g, ' ') since API returns series list without parent name"

patterns-established:
  - "Collection query key pattern: ['categories'], ['series', slug], ['items', catSlug, seriesSlug], ['itemDetail', id], ['searchItems', q, ...filters]"
  - "Owned/wishlist optimistic toggle with mutual exclusion (marking owned clears wishlist and vice versa)"
  - "Item grid responsive columns: 3 cols mobile, 4 sm, 5 md for compact browsing"

requirements-completed: [COLL-01, COLL-02, COLL-03, COLL-04]

# Metrics
duration: 6min
completed: 2026-03-15
---

# Phase 04 Plan 04: Collection Frontend Summary

**Collection browsing UI with category/series/items hierarchy, debounced search, owned/wishlist optimistic toggles, and bottom nav integration**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-14T23:43:59Z
- **Completed:** 2026-03-14T23:50:56Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments
- Built 7 TanStack Query hooks covering all collection API endpoints with optimistic updates for owned/wishlist toggles
- Created 4 browsing pages: category landing, series grid, items grid with infinite scroll, item detail with social proof
- ItemSearch with 300ms debounced input and infinite scroll results grid
- OwnedWishlistToggle with auth-aware click handling, mutual exclusion, and smooth visual transitions
- Bottom nav updated with collection entry point (Package icon, "Suu tap" label)

## Task Commits

Each task was committed atomically:

1. **Task 1: Collection query hooks, browsing pages, components, bottom nav** - `6ac34f3` (feat)
2. **Task 2: Item search and collection page integration** - `4dd4edd` (feat)

## Files Created/Modified
- `frontend/src/hooks/queries/collection-queries.ts` - 7 hooks: useCategories, useSeriesByCategory, useItemsBySeries, useItemDetail, useSearchItems, useToggleOwned, useToggleWishlist with optimistic updates
- `frontend/src/app/(public)/collection/page.tsx` - Category landing page with search bar and category grid
- `frontend/src/app/(public)/collection/[categorySlug]/page.tsx` - Series grid page with breadcrumb navigation
- `frontend/src/app/(public)/collection/[categorySlug]/[seriesSlug]/page.tsx` - Items grid with infinite scroll
- `frontend/src/app/(public)/item/[itemId]/page.tsx` - Item detail page with back button
- `frontend/src/components/collection/category-card.tsx` - Category card with cover image/placeholder, series/item counts
- `frontend/src/components/collection/series-card.tsx` - Series card with item count badge
- `frontend/src/components/collection/item-card.tsx` - Item card with owned (green check) and wishlist (pink heart) indicators
- `frontend/src/components/collection/item-detail.tsx` - Full detail view with breadcrumb links, "X nguoi so huu" social proof, toggle buttons
- `frontend/src/components/collection/item-search.tsx` - Debounced search input with results grid and infinite scroll
- `frontend/src/components/collection/owned-wishlist-toggle.tsx` - Auth-aware toggle buttons with green/rose styling
- `frontend/src/components/layout/bottom-nav.tsx` - Added collection link between Search and Create

## Decisions Made
- Built OwnedWishlistToggle as a complete component in Task 1 rather than a placeholder, since ItemDetail imports it and both are in the same task
- Used updateItemInQueries helper pattern (matching updatePostInQueries from interaction-queries.ts) for cross-query optimistic updates
- Category/series names displayed from slug with dash-to-space conversion since the series API returns series list without parent category name field
- Auth check uses synchronous useAuthStore.getState().user pattern established in Phase 3.1

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Collection browsing UI fully functional, ready for post-item linking (04-05)
- OwnedWishlistToggle reusable for profile collection showcase tab (04-06)
- Query hooks available for any future collection-related UI
- All pages work for both authenticated and unauthenticated users

---
*Phase: 04-collection-system*
*Completed: 2026-03-15*

## Self-Check: PASSED

All 12 created/modified files verified present. Both task commits (6ac34f3, 4dd4edd) verified in git log.
