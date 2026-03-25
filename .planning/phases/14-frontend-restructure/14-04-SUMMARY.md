---
phase: 14-frontend-restructure
plan: 04
subsystem: ui
tags: [next.js, server-components, ssr, seo, metadata, react-query]

# Dependency graph
requires:
  - phase: 14-01
    provides: fetchApi server-fetch utility, proxy.ts, dark mode foundation
  - phase: 14-02
    provides: features/ barrel exports, directory restructure
provides:
  - All 12 (app) + (auth) pages converted to Server Components
  - Static SEO metadata on all auth pages
  - Server-side data fetching via fetchApi on authenticated pages
  - Client component extractions for all interactive logic
affects: [14-03, verification, build]

# Tech tracking
tech-stack:
  added: []
  patterns: [Server Component page with client component extraction, fetchApi for SSR data, Suspense boundary for useSearchParams]

key-files:
  created:
    - frontend/src/app/(app)/feed-page-client.tsx
    - frontend/src/app/(app)/reels/reels-page-client.tsx
    - frontend/src/app/(app)/saved/saved-page-client.tsx
    - frontend/src/app/(app)/complete-profile/complete-profile-page-client.tsx
    - frontend/src/app/(app)/checklists/checklists-page-client.tsx
    - frontend/src/app/(app)/checklists/new/new-checklist-page-client.tsx
    - frontend/src/app/(app)/checklists/[checklistId]/checklist-detail-page-client.tsx
    - frontend/src/app/(auth)/verify-email/verify-email-page-client.tsx
    - frontend/src/app/(auth)/forgot-password/forgot-password-page-client.tsx
    - frontend/src/app/(auth)/reset-password/reset-password-page-client.tsx
  modified:
    - frontend/src/app/(app)/page.tsx
    - frontend/src/app/(app)/saved/page.tsx
    - frontend/src/app/(app)/complete-profile/page.tsx
    - frontend/src/app/(app)/checklists/page.tsx
    - frontend/src/app/(app)/checklists/new/page.tsx
    - frontend/src/app/(app)/checklists/[checklistId]/page.tsx
    - frontend/src/app/(auth)/verify-email/page.tsx
    - frontend/src/app/(auth)/forgot-password/page.tsx
    - frontend/src/app/(auth)/reset-password/page.tsx

key-decisions:
  - "Suspense boundary for useSearchParams: verify-email and reset-password pages wrap client component in Suspense since useSearchParams requires it when rendered from Server Component"
  - "fetchApi pre-fetch without passing data: pages call fetchApi for cache warming but pass no initialData prop since FeedList/etc already use React Query internally"
  - "Login and signup already converted by plan 14-03 -- only verify-email, forgot-password, reset-password needed conversion"

patterns-established:
  - "Page conversion pattern: remove 'use client', add Metadata export, make async, call fetchApi, render *PageClient"
  - "Suspense boundary for client components using useSearchParams or usePathname from Server Component parent"

requirements-completed: [FRNT-03]

# Metrics
duration: 7min
completed: 2026-03-25
---

# Phase 14 Plan 04: App + Auth Page Server Component Conversion Summary

**Converted 12 page.tsx files (7 app + 5 auth) to async Server Components with fetchApi SSR data fetching and SEO metadata**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-25T11:31:59Z
- **Completed:** 2026-03-25T11:39:32Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- All 7 authenticated (app) pages converted to Server Components with fetchApi pre-fetching
- All 5 auth pages converted to Server Components with static SEO metadata
- 10 new client component files created with all interactive logic preserved
- Checklist detail page (299 lines) fully extracted including all mutation hooks, state, and handlers

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert authenticated (app) pages to Server Components** - `2685bf3` (feat)
2. **Task 2: Convert auth pages to Server Components** - `8327087` (feat)

## Files Created/Modified

### Created (10 client component files)
- `frontend/src/app/(app)/feed-page-client.tsx` - Client wrapper for FeedList
- `frontend/src/app/(app)/reels/reels-page-client.tsx` - Client wrapper for ReelFeed with Suspense
- `frontend/src/app/(app)/saved/saved-page-client.tsx` - Saved posts grid with infinite scroll, PostDetailModal
- `frontend/src/app/(app)/complete-profile/complete-profile-page-client.tsx` - CompleteProfileForm wrapper
- `frontend/src/app/(app)/checklists/checklists-page-client.tsx` - Checklist list with loading skeleton
- `frontend/src/app/(app)/checklists/new/new-checklist-page-client.tsx` - New checklist form with router
- `frontend/src/app/(app)/checklists/[checklistId]/checklist-detail-page-client.tsx` - Full checklist detail with all CRUD operations
- `frontend/src/app/(auth)/verify-email/verify-email-page-client.tsx` - Email verification with auto-verify effect
- `frontend/src/app/(auth)/forgot-password/forgot-password-page-client.tsx` - Forgot password form
- `frontend/src/app/(auth)/reset-password/reset-password-page-client.tsx` - Reset password form with token validation

### Modified (9 page.tsx files converted)
- `frontend/src/app/(app)/page.tsx` - Server Component with fetchApi, metadata
- `frontend/src/app/(app)/saved/page.tsx` - Server Component with fetchApi, metadata
- `frontend/src/app/(app)/complete-profile/page.tsx` - Server Component with metadata
- `frontend/src/app/(app)/checklists/page.tsx` - Server Component with fetchApi, metadata
- `frontend/src/app/(app)/checklists/new/page.tsx` - Server Component with metadata
- `frontend/src/app/(app)/checklists/[checklistId]/page.tsx` - Server Component with fetchApi, await params, metadata
- `frontend/src/app/(auth)/verify-email/page.tsx` - Server Component with metadata, Suspense
- `frontend/src/app/(auth)/forgot-password/page.tsx` - Server Component with metadata
- `frontend/src/app/(auth)/reset-password/page.tsx` - Server Component with metadata, Suspense

## Decisions Made
- **Suspense for useSearchParams:** verify-email and reset-password client components use useSearchParams which requires Suspense boundary when rendered from a Server Component in Next.js App Router
- **fetchApi without initialData prop:** Pages call fetchApi for server-side cache warming but don't pass the result as props; React Query hooks in client components re-fetch on mount (consistent with how FeedList already works internally)
- **Login/signup already done:** Plans 14-03 had already converted login and signup pages; only 3 auth pages needed conversion here

## Deviations from Plan

None - plan executed exactly as written. Login and signup were already converted by plan 14-03 as expected.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All (app) and (auth) page.tsx files are Server Components
- 9 (public) pages remain with 'use client' -- handled by plan 14-03
- Auth layout retains 'use client' for defense-in-depth redirect (per D-11)
- After plan 14-03 completes, zero page.tsx files will have 'use client' across the entire app

## Self-Check: PASSED

- All 10 client component files: FOUND
- Commit 2685bf3 (Task 1): FOUND
- Commit 8327087 (Task 2): FOUND

---
*Phase: 14-frontend-restructure*
*Completed: 2026-03-25*
