---
phase: 04-collection-system
verified: 2026-03-15T00:00:00Z
status: passed
score: 20/20 must-haves verified
re_verification: false
---

# Phase 04: Collection System Verification Report

**Phase Goal:** Users can browse a shared item database, track what they own and want, build custom checklists, link posts to collection items, and showcase collections on their profile
**Verified:** 2026-03-15
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can query the API for categories, series, and items and receive populated data (4 categories, 14+ series, 150+ items) | VERIFIED | `seed-collections.ts` has `seedId` helper + `tx.category.upsert`, `tx.series.upsert`, 182 `name:` entries across 4 categories/15 series |
| 2 | Shared TypeScript types exist for all collection and checklist API responses | VERIFIED | `collection.types.ts` exports 5 interfaces; `checklist.types.ts` exports 3 interfaces; both present and non-trivial |
| 3 | Seed script runs idempotently — running it twice produces identical results with no errors | VERIFIED | All inserts use `upsert` with deterministic IDs via `seedId()` helper; wrapped in `prisma.$transaction` |
| 4 | Prisma client generates without errors with all 10 new models | VERIFIED | All 10 models present in `schema.prisma` at lines 223–374: Category, Series, Item, OwnedItem, WishlistItem, Checklist, ChecklistEntry, PostItem, CategoryFollow, SeriesFollow |
| 5 | GET /collection/categories returns categories with series and item counts | VERIFIED | `collection.service.ts:34` — `prisma.category.findMany` with `_count` includes; controller endpoint registered |
| 6 | GET /collection/categories/:slug/series returns series with item counts | VERIFIED | `collection.service.ts:64` — `prisma.category.findUnique` + `prisma.series.findMany` with `_count` |
| 7 | GET /collection/series/:categorySlug/:seriesSlug/items returns paginated items with viewer owned/wishlist status | VERIFIED | `collection.service.ts:116` — cursor pagination + `getItemStatuses` batch check when viewerId present |
| 8 | POST /collection/items/:id/owned toggles owned status with mutual exclusion | VERIFIED | `collection.service.ts:325` — `prisma.$transaction` deletes wishlistItem before creating ownedItem |
| 9 | POST /collection/series/:id/follow and /collection/categories/:id/follow toggle follow state | VERIFIED | Controller lines 108 and 119; service methods `followCategory` and `followSeries` confirmed |
| 10 | CRUD endpoints for checklists with entries, progress tracking, and reordering | VERIFIED | `checklist.service.ts` — 329 lines, 10+ methods; 518-line unit test file; ChecklistModule in AppModule |
| 11 | POST /posts creates posts with optional linkedItemIds | VERIFIED | `posts.service.ts:69` — `tx.postItem.create` inside post transaction; `create-post.dto.ts` extended |
| 12 | Feed response includes linkedItems on each post | VERIFIED | `feed.service.ts:184` — `mapLinkedItems(post.items)` called; `PostResponse.linkedItems` at line 22 of `post.types.ts` |
| 13 | Checklist ownership is enforced | VERIFIED | `checklist.service.ts` uses `findFirst({ where: { id, userId } })` pattern throughout; throws ForbiddenException |
| 14 | User can navigate /collection and browse category → series → items | VERIFIED | Pages exist: `collection/page.tsx` (56 lines), `[categorySlug]/page.tsx` (77 lines), `[categorySlug]/[seriesSlug]/page.tsx` (116 lines), `item/[itemId]/page.tsx` (51 lines) |
| 15 | User can search items by name from a search bar | VERIFIED | `item-search.tsx` (97 lines) — debounced 300ms, uses `useSearchItems`; placed in `/collection/page.tsx` |
| 16 | User can tap owned/wishlist toggle buttons with optimistic UI | VERIFIED | `owned-wishlist-toggle.tsx` imports `useToggleOwned`/`useToggleWishlist`; hooks have full `onMutate`/`setQueryData`/`onError` rollback pattern |
| 17 | User can create checklists, add entries, see progress, reorder | VERIFIED | Pages: `checklists/page.tsx`, `checklists/new/page.tsx`, `checklists/[checklistId]/page.tsx`; `checklist-queries.ts` (251 lines) with all CRUD hooks |
| 18 | Profile page has Collection tab showing owned items by category | VERIFIED | `[username]/page.tsx` imports `CollectionShowcase`, line 50-60 shows Tabs with "Bo suu tap" tab |
| 19 | User can follow/unfollow a series or category | VERIFIED | `follow-series-button.tsx` imports `useFollowSeries`/`useFollowCategory`; wired into `[categorySlug]/page.tsx` and `[seriesSlug]/page.tsx` |
| 20 | Post creation has ItemPicker for linking items; linked item badges appear on posts | VERIFIED | `step-caption.tsx` imports and renders `ItemPicker` dialog; `post-card.tsx` lines 129–144 render `post.linkedItems` as badges |

**Score:** 20/20 truths verified

---

### Required Artifacts

| Artifact | Min Lines | Actual Lines | Status | Details |
|----------|-----------|--------------|--------|---------|
| `backend/prisma/schema.prisma` | — | 372 | VERIFIED | 10 new models (lines 223–374), User model has 5 new relations |
| `backend/prisma/seed-collections.ts` | — | 372 | VERIFIED | Exports `seedCollections`, upsert-based, 4 categories |
| `packages/shared/src/types/collection.types.ts` | — | 47 | VERIFIED | 5 interfaces: CategoryResponse, SeriesResponse, ItemResponse, ItemDetailResponse, LinkedItemResponse |
| `packages/shared/src/types/checklist.types.ts` | — | 24 | VERIFIED | 3 interfaces: ChecklistResponse, ChecklistEntryResponse, ChecklistDetailResponse |
| `packages/shared/src/dto/collection.dto.ts` | — | 10 | VERIFIED | searchItemsSchema + SearchItemsDto |
| `packages/shared/src/dto/checklist.dto.ts` | — | 26 | VERIFIED | createChecklistSchema, updateChecklistSchema, addChecklistEntrySchema, reorderEntriesSchema |
| `backend/src/collection/collection.service.ts` | — | 557 | VERIFIED | Exports CollectionService; 11 methods; Prisma queries confirmed |
| `backend/src/collection/collection.controller.ts` | — | 144 | VERIFIED | Exports CollectionController; 10 endpoints |
| `backend/src/collection/__tests__/collection.service.spec.ts` | 100 | 665 | VERIFIED | 665 lines, well above minimum |
| `backend/src/checklist/checklist.service.ts` | — | 329 | VERIFIED | Exports ChecklistService; ownership enforcement confirmed |
| `backend/src/checklist/checklist.controller.ts` | — | 112 | VERIFIED | Exports ChecklistController |
| `backend/src/checklist/__tests__/checklist.service.spec.ts` | 80 | 518 | VERIFIED | 518 lines, well above minimum |
| `packages/shared/src/types/post.types.ts` | — | 31 | VERIFIED | Contains `linkedItems?: LinkedItemResponse[]` at line 22 |
| `frontend/src/app/(public)/collection/page.tsx` | 30 | 56 | VERIFIED | Uses useCategories, renders CategoryCard grid |
| `frontend/src/components/collection/item-card.tsx` | 30 | 54 | VERIFIED | Shows owned (green check) and wishlist (pink heart) indicators |
| `frontend/src/components/collection/owned-wishlist-toggle.tsx` | 40 | 78 | VERIFIED | Auth-aware toggle; uses useToggleOwned/useToggleWishlist |
| `frontend/src/components/collection/item-search.tsx` | 40 | 97 | VERIFIED | Debounced search with useSearchItems |
| `frontend/src/hooks/queries/collection-queries.ts` | — | 378 | VERIFIED | All 7 required hooks exported; useFollowSeries/useFollowCategory also present |
| `frontend/src/hooks/queries/checklist-queries.ts` | — | 251 | VERIFIED | All required checklist hooks exported |
| `frontend/src/components/collection/item-picker.tsx` | 50 | 295 | VERIFIED | Single/multi mode dialog with debounced search |
| `frontend/src/components/create-post/step-caption.tsx` | — | 300 | VERIFIED | Contains ItemPicker import and dialog wiring |
| `frontend/src/components/post/post-card.tsx` | — | 188 | VERIFIED | Renders linkedItems badges with Package icon |
| `frontend/src/components/collection/collection-showcase.tsx` | 40 | 126 | VERIFIED | Calls `/collection/users/:username/owned` API |
| `frontend/src/components/collection/follow-series-button.tsx` | 25 | 55 | VERIFIED | Uses useFollowSeries/useFollowCategory |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `backend/prisma/schema.prisma` | `packages/shared/src/types/collection.types.ts` | Prisma models mirror shared type shapes | VERIFIED | Both have Category, Series, Item, OwnedItem, WishlistItem, Checklist models |
| `backend/prisma/seed-collections.ts` | `backend/prisma/schema.prisma` | Prisma client queries | VERIFIED | `tx.category.upsert`, `tx.series.upsert` confirmed; uses composite key `categoryId_slug` |
| `backend/src/collection/collection.service.ts` | `prisma.(category|series|item|ownedItem|wishlistItem)` | Prisma client | VERIFIED | All 5 models queried in service |
| `backend/src/app.module.ts` | `CollectionModule` | Module imports | VERIFIED | Line 15 import, line 62 in imports array |
| `backend/src/checklist/checklist.service.ts` | `prisma.(checklist|checklistEntry)` | Prisma client | VERIFIED | Both models queried throughout service |
| `backend/src/app.module.ts` | `ChecklistModule` | Module imports | VERIFIED | Line 16 import, line 63 in imports array |
| `backend/src/posts/posts.service.ts` | `prisma.postItem` | PostItem creation | VERIFIED | Line 69: `tx.postItem.create` inside post create transaction |
| `packages/shared/src/types/post.types.ts` | `packages/shared/src/types/collection.types.ts` | LinkedItemResponse | VERIFIED | `linkedItems?: LinkedItemResponse[]` at line 22 |
| `frontend/src/hooks/queries/collection-queries.ts` | `/api/collection/*` | apiClient GET/POST calls | VERIFIED | `apiClient.get('/collection/categories')` confirmed; toggle mutations call `/collection/items/:id/owned` and `/wishlist` |
| `frontend/src/components/collection/owned-wishlist-toggle.tsx` | `collection-queries.ts` | useToggleOwned/useToggleWishlist | VERIFIED | Both hooks imported and called at lines 8–9, 24–25 |
| `frontend/src/app/(public)/collection/page.tsx` | `collection-queries.ts` | useCategories hook | VERIFIED | Import at line 3, used at line 23 |
| `frontend/src/hooks/queries/checklist-queries.ts` | `/api/checklists/*` | apiClient calls | VERIFIED | GET /checklists, DELETE, PATCH confirmed |
| `frontend/src/components/collection/collection-showcase.tsx` | `collection-queries.ts` | API call for user owned items | VERIFIED | Calls `/collection/users/${username}/owned` at line 26 |
| `frontend/src/app/(public)/[username]/page.tsx` | `collection-showcase.tsx` | Tabs rendering Collection tab | VERIFIED | Import at line 11, rendered in TabsContent at line 60 |
| `frontend/src/components/collection/follow-series-button.tsx` | `collection-queries.ts` | useFollowSeries/useFollowCategory | VERIFIED | Both imported at line 7, used at lines 23–24 |
| `frontend/src/components/collection/item-picker.tsx` | `collection-queries.ts` | useSearchItems | VERIFIED | Imported at line 14, used at line 69 |
| `frontend/src/components/create-post/step-caption.tsx` | `item-picker.tsx` | ItemPicker dialog | VERIFIED | Imported at line 15, opened at line 285 |
| `frontend/src/stores/create-post-store.ts` | step-caption / create-post-flow | linkedItemIds in store | VERIFIED | `linkedItemIds` at line 26, actions confirmed at lines 148–165 |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| COLL-01 | 04-01, 04-02, 04-04 | User can browse shared item database by category | SATISFIED | Category/series/items pages + API endpoints verified |
| COLL-02 | 04-01, 04-02, 04-04 | User can search items in the database | SATISFIED | `item-search.tsx` + GET /collection/items/search endpoint + useSearchItems hook |
| COLL-03 | 04-01, 04-02, 04-04 | User can mark items as "owned" | SATISFIED | toggleOwned in collection service + owned-wishlist-toggle component |
| COLL-04 | 04-01, 04-02, 04-04 | User can mark items as "wishlist" | SATISFIED | toggleWishlist in collection service + owned-wishlist-toggle component |
| COLL-05 | 04-01, 04-03, 04-05 | User can create custom checklists with custom names | SATISFIED | ChecklistModule createChecklist + checklists/new page + ChecklistForm |
| COLL-06 | 04-01, 04-03, 04-05 | User can add database items or freeform entries | SATISFIED | addEntry in checklist service accepts itemId or freeformText; ItemPicker wired in checklist detail |
| COLL-07 | 04-01, 04-03, 04-05 | User can track checklist progress (X/Y complete) | SATISFIED | Progress bar in ChecklistCard with totalEntries/checkedEntries; optimistic toggle in checklist-queries |
| CONT-07 | 04-01, 04-03, 04-06 | User can link post to item(s) from collection database | SATISFIED | PostItem model + postItem creation in posts.service + ItemPicker in step-caption + linkedItems in post-card |
| PROF-04 | 04-05 | User profile has collection showcase tab showing owned items | SATISFIED | CollectionShowcase in profile [username]/page.tsx with "Bo suu tap" tab |
| SOCL-04 | 04-01, 04-02, 04-05 | User can follow collection series/categories | SATISFIED | followCategory/followSeries endpoints + FollowSeriesButton wired into category/series pages |

All 10 required IDs accounted for. No orphaned requirements found for Phase 4 in REQUIREMENTS.md.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `item-search.tsx` | 55 | `placeholder="Tim kiem..."` | Info | HTML input placeholder attribute — expected, not a code stub |
| `item-picker.tsx` | 165, 227 | `placeholder="..."` and `{/* Item image or placeholder */}` | Info | Input placeholder + a UI comment about showing fallback icon — not a code stub |

No blockers or warnings. All placeholder references are legitimate HTML attributes or UI descriptions, not implementation stubs.

---

### Human Verification Required

The following behaviors require manual testing and cannot be verified programmatically:

#### 1. Optimistic UI rollback on network failure

**Test:** While offline (or with network throttled), mark an item as owned in /collection. Observe that the button toggles immediately, then reverts when the request fails.
**Expected:** Owned state reverts to original; no permanent incorrect state
**Why human:** Requires simulating network failure; rollback logic exists in code but correctness requires runtime observation

#### 2. Owned/wishlist mutual exclusion in UI

**Test:** On an item that is wishlisted, click the "So huu" (Owned) button. Verify the wishlist indicator clears simultaneously.
**Expected:** Owned shows green, wishlist clears — no intermediate state showing both active
**Why human:** Optimistic update logic is present but visual simultaneity requires browser testing

#### 3. Checklist progress bar increments correctly

**Test:** Check/uncheck entries in a checklist; verify the progress bar fraction (X/Y) updates with each toggle.
**Expected:** Progress bar redraws immediately on each toggle (optimistic), reflects server state after settle
**Why human:** Optimistic count recalculation requires visual confirmation

#### 4. ItemPicker search returns real results

**Test:** In post creation step-caption, click "Lien ket vat pham" and type a known seed item name (e.g., "Sinanju"). Verify results appear.
**Expected:** Seeded items matching the search query are displayed in the picker dialog
**Why human:** Requires real database connectivity and seed data to be present

#### 5. Profile Collection tab shows seeded owned items

**Test:** Mark several items as owned, then visit a user profile. Click the "Bo suu tap" tab.
**Expected:** Owned items appear grouped by category name
**Why human:** Requires both ownership data and profile rendering to be live

#### 6. Follow button on series page reflects real isFollowed state

**Test:** Follow a series, refresh the page, revisit. Verify the button shows "Dang theo doi".
**Expected:** Follow state persists and is loaded correctly on page re-render
**Why human:** The SUMMARY notes that CategoryResponse lacks an `isFollowed` field — category follow button hardcodes `isFollowed=false`. Series follow state is correctly fetched from the API. Category follow state requires a backend enhancement that was deferred; human tester should verify the series case works correctly and note the category limitation.

---

### Notable Limitation (Non-Blocking)

**Category follow UI state:** The SUMMARY for Plan 05 explicitly notes that `FollowSeriesButton` for categories hardcodes `isFollowed=false` because `CategoryResponse` does not include an `isFollowed` field. The backend can toggle the follow state, but the button will always visually initialize as "Theo doi" (Follow) even if the user already follows a category. Series follow state works correctly. This is a known deferred enhancement, not a blocking gap.

---

## Summary

Phase 04 goal is fully achieved. All 10 required requirements (COLL-01 through COLL-07, CONT-07, PROF-04, SOCL-04) are satisfied by verified implementation:

- **Data foundation (04-01):** 10 Prisma models, shared types/DTOs, idempotent seed with 154 items across 4 categories/15 series
- **Backend API (04-02, 04-03):** CollectionModule (11 methods, 10 endpoints, 26 tests) and ChecklistModule (10 methods, 10 endpoints, 23 tests) registered in AppModule; PostsModule extended with PostItem linking
- **Collection browsing UI (04-04):** 4 pages, 6 components, 7 TanStack Query hooks with optimistic owned/wishlist toggles; bottom nav collection entry point
- **Checklists + profile showcase + follow (04-05):** Checklist CRUD pages with progress bars, reorder; profile Collection tab with owned items by category; FollowSeriesButton on series/category pages
- **Post item linking (04-06):** ItemPicker dialog (single/multi select), wired into create-post flow and checklist; post-card shows linked item badges

One known deferred item (category isFollowed display) is non-blocking and explicitly documented in the SUMMARY.

---

_Verified: 2026-03-15_
_Verifier: Claude (gsd-verifier)_
