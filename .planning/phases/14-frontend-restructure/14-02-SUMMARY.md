---
phase: 14-frontend-restructure
plan: 02
subsystem: frontend
tags: [restructure, features-pattern, barrel-exports, import-migration]
dependency_graph:
  requires: []
  provides: [features-directory-structure, barrel-exports, clean-imports]
  affects: [all-frontend-pages, all-feature-components, all-query-hooks, all-stores]
tech_stack:
  added: []
  patterns: [feature-sliced-architecture, barrel-file-re-exports, relative-internal-imports, cross-feature-barrel-imports]
key_files:
  created:
    - frontend/src/features/auth/index.ts
    - frontend/src/features/post/index.ts
    - frontend/src/features/feed/index.ts
    - frontend/src/features/profile/index.ts
    - frontend/src/features/social/index.ts
    - frontend/src/features/collection/index.ts
    - frontend/src/features/checklist/index.ts
    - frontend/src/features/comment/index.ts
    - frontend/src/features/create-post/index.ts
  modified:
    - frontend/src/app/(app)/layout.tsx
    - frontend/src/app/(app)/page.tsx
    - frontend/src/app/(app)/saved/page.tsx
    - frontend/src/app/(app)/complete-profile/page.tsx
    - frontend/src/app/(app)/checklists/page.tsx
    - frontend/src/app/(app)/checklists/new/page.tsx
    - frontend/src/app/(app)/checklists/[checklistId]/page.tsx
    - frontend/src/app/(auth)/login/page.tsx
    - frontend/src/app/(auth)/signup/page.tsx
    - frontend/src/app/(auth)/verify-email/page.tsx
    - frontend/src/app/(auth)/forgot-password/page.tsx
    - frontend/src/app/(auth)/reset-password/page.tsx
    - frontend/src/app/(auth)/layout.tsx
    - frontend/src/app/(public)/[username]/page.tsx
    - frontend/src/app/(public)/[username]/loading.tsx
    - frontend/src/app/(public)/[username]/followers/page.tsx
    - frontend/src/app/(public)/[username]/following/page.tsx
    - frontend/src/app/(public)/post/[postId]/page.tsx
    - frontend/src/app/(public)/explore/page.tsx
    - frontend/src/app/(public)/item/[itemId]/page.tsx
    - frontend/src/app/(public)/collection/page.tsx
    - frontend/src/app/(public)/collection/[categorySlug]/page.tsx
    - frontend/src/app/(public)/collection/[categorySlug]/[seriesSlug]/page.tsx
    - frontend/src/app/(public)/layout.tsx
    - frontend/src/hooks/use-auth.ts
    - frontend/src/components/layout/bottom-nav.tsx
    - frontend/src/features/auth/hooks/auth-queries.ts
    - frontend/src/features/auth/components/login-form.tsx
    - frontend/src/features/auth/components/signup-form.tsx
    - frontend/src/features/post/components/post-card.tsx
    - frontend/src/features/post/components/post-actions.tsx
    - frontend/src/features/post/components/post-detail-modal.tsx
    - frontend/src/features/post/components/post-menu.tsx
    - frontend/src/features/feed/components/feed-list.tsx
    - frontend/src/features/profile/components/profile-header.tsx
    - frontend/src/features/profile/components/profile-post-grid.tsx
    - frontend/src/features/profile/components/profile-edit-modal.tsx
    - frontend/src/features/profile/components/complete-profile-form.tsx
    - frontend/src/features/profile/hooks/profile-queries.ts
    - frontend/src/features/social/components/follow-button.tsx
    - frontend/src/features/social/components/follower-list.tsx
    - frontend/src/features/collection/components/collection-showcase.tsx
    - frontend/src/features/collection/components/follow-series-button.tsx
    - frontend/src/features/collection/components/item-picker.tsx
    - frontend/src/features/collection/components/item-search.tsx
    - frontend/src/features/collection/components/owned-wishlist-toggle.tsx
    - frontend/src/features/comment/components/comment-input.tsx
    - frontend/src/features/comment/components/comment-item.tsx
    - frontend/src/features/comment/components/comment-list.tsx
    - frontend/src/features/create-post/components/create-post-flow.tsx
    - frontend/src/features/create-post/components/step-caption.tsx
    - frontend/src/features/create-post/components/step-edit.tsx
    - frontend/src/features/create-post/components/step-gallery.tsx
decisions:
  - "9 feature barrels (no reel feature in develop branch -- reel exists on feature/phase-10-reels)"
  - "Feature-internal imports use relative paths, cross-feature imports use barrel paths"
  - "Multiple imports from same barrel consolidated into single import statement"
metrics:
  duration: 10 min
  completed: "2026-03-25T11:20:00Z"
  tasks: 2
  files: 62
---

# Phase 14 Plan 02: Feature Directory Move and Barrel Exports Summary

Move 53 domain files (43 components, 8 query hooks, 2 stores) into features/ directory structure, create 9 barrel index.ts files, and update all 60+ import paths to use @/features/{domain} barrel pattern with zero broken imports.

## What Was Done

### Task 1: Move all domain files to features/ directory structure
- Created 9 feature directories with appropriate subdirectories (components/, hooks/, stores/)
- Moved 43 component files from `components/{domain}/` to `features/{domain}/components/` via `git mv`
- Moved 8 query hook files from `hooks/queries/` to `features/{domain}/hooks/` via `git mv`
- Moved 2 store files from `stores/` to `features/{domain}/stores/` via `git mv`
- Removed all emptied old directories (components/{domain}/, hooks/queries/, stores/)
- Preserved shared `components/ui/` and `components/layout/` untouched
- **Commit:** b3083a7

### Task 2: Create barrel files and update all imports
- Created 9 barrel `index.ts` files re-exporting each feature's public API
- Updated 24 app page/layout files to import from `@/features/{domain}` barrels
- Updated 23 feature-internal component/hook files to use relative paths within same feature
- Updated 2 shared files (`hooks/use-auth.ts`, `components/layout/bottom-nav.tsx`) to use barrel imports
- Consolidated multiple imports from same barrel into single import statements
- **Commit:** 05dec9e

## Feature Barrel Summary

| Feature | Components | Hooks | Stores | Total Exports |
|---------|-----------|-------|--------|---------------|
| auth | 3 | 7 | 1 | 11 |
| post | 6 | 12 | 0 | 18 |
| feed | 3 | 0 | 0 | 3 |
| profile | 6 | 3 | 0 | 9 |
| social | 3 | 5 | 0 | 8 |
| collection | 9 | 10 | 0 | 19 |
| checklist | 3 | 9 | 0 | 12 |
| comment | 3 | 3 | 0 | 6 |
| create-post | 5 | 0 | 1 | 6 |

## Deviations from Plan

### Scope Adjustments

**1. No reel feature (expected)**
- The `develop` branch does not contain reel components/hooks/stores (added in phase 10 on `feature/phase-10-reels` branch)
- 9 features created instead of 10 planned. Reel barrel will be created when phase 10 merges.

**2. No sidebar.tsx or header-search.tsx**
- These layout components referenced in the plan don't exist in the develop branch
- Only `bottom-nav.tsx` and `public-nav.tsx` exist in `components/layout/`

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript `tsc --noEmit` | PASS (zero errors) |
| Stale `@/components/{domain}/` imports | 0 found (PASS) |
| Stale `@/hooks/queries/` imports | 0 found (PASS) |
| Stale `@/stores/` imports | 0 found (PASS) |
| Barrel files exist (9/9) | PASS |
| `ui/` and `layout/` untouched | PASS |

## Known Stubs

None -- all barrel files export real implementations, no placeholders.

## Self-Check: PASSED

- All 9 barrel index.ts files exist on disk
- Commit b3083a7 (Task 1 - file moves) verified in git log
- Commit 05dec9e (Task 2 - barrels + imports) verified in git log
