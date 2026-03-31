---
phase: 14-frontend-restructure
plan: 03
subsystem: ui
tags: [nextjs, server-components, seo, open-graph, twitter-cards, metadata, ssr]

# Dependency graph
requires:
  - phase: 14-01
    provides: fetchApi server-fetch utility, dark mode config
  - phase: 14-02
    provides: feature barrel exports, features/ directory structure
provides:
  - 9 public route pages converted to async Server Components
  - generateMetadata with Open Graph + Twitter Card tags on all public pages
  - Dynamic og:image with absolute URL resolution for profile, post, item, series pages
  - Client component extractions (*-client.tsx) for interactive parts
affects: [14-04, seo, social-sharing]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-component-with-client-extraction, generate-metadata-pattern, absolute-url-resolution-for-og-images]

key-files:
  created:
    - frontend/src/app/(public)/[username]/profile-page-client.tsx
    - frontend/src/app/(public)/[username]/followers/followers-page-client.tsx
    - frontend/src/app/(public)/[username]/following/following-page-client.tsx
    - frontend/src/app/(public)/post/[postId]/post-detail-page-client.tsx
    - frontend/src/app/(public)/explore/explore-page-client.tsx
    - frontend/src/app/(public)/item/[itemId]/item-detail-page-client.tsx
    - frontend/src/app/(public)/collection/collection-page-client.tsx
    - frontend/src/app/(public)/collection/[categorySlug]/category-series-page-client.tsx
    - frontend/src/app/(public)/collection/[categorySlug]/[seriesSlug]/series-items-page-client.tsx
  modified:
    - frontend/src/app/(public)/[username]/page.tsx
    - frontend/src/app/(public)/[username]/followers/page.tsx
    - frontend/src/app/(public)/[username]/following/page.tsx
    - frontend/src/app/(public)/post/[postId]/page.tsx
    - frontend/src/app/(public)/explore/page.tsx
    - frontend/src/app/(public)/item/[itemId]/page.tsx
    - frontend/src/app/(public)/collection/page.tsx
    - frontend/src/app/(public)/collection/[categorySlug]/page.tsx
    - frontend/src/app/(public)/collection/[categorySlug]/[seriesSlug]/page.tsx

key-decisions:
  - "toAbsoluteUrl helper defined per-page for og:image URL resolution (not shared utility)"
  - "Profile and post pages pass initialData to client components for server-side hydration"
  - "Explore and collection pages delegate all data fetching to client components (React Query)"

patterns-established:
  - "Server Component page pattern: async page.tsx with generateMetadata -> *-client.tsx with 'use client'"
  - "Absolute URL resolution: toAbsoluteUrl helper converts relative backend URLs to absolute for Open Graph"
  - "Next.js 16 async params: params typed as Promise<T>, extracted with await"

requirements-completed: [FRNT-03]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 14 Plan 03: SSR/SEO Public Pages Summary

**All 9 public route pages converted to async Server Components with generateMetadata for full Open Graph + Twitter Card SEO, with absolute URL resolution for dynamic og:image tags**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T11:31:57Z
- **Completed:** 2026-03-25T11:36:13Z
- **Tasks:** 2
- **Files modified:** 18 (9 page.tsx converted + 9 *-client.tsx created)

## Accomplishments
- All 9 public pages are async Server Components with zero 'use client' directives
- Profile page has generateMetadata with og:image = user avatar as absolute URL
- Post detail page has generateMetadata with og:image = first media image as absolute URL
- Collection item and series pages have generateMetadata with dynamic og:image
- Explore and collection browse pages have static metadata exports
- All interactive logic (useState, useEffect, hooks) extracted to *-client.tsx files

## Task Commits

Each task was committed atomically:

1. **Task 1: Convert profile and post pages** - `32ea893` (feat)
2. **Task 2: Convert collection, explore, item pages** - `efb4688` (feat)

## Files Created/Modified

**Created (client components):**
- `frontend/src/app/(public)/[username]/profile-page-client.tsx` - Profile interactive UI with tabs, edit modal
- `frontend/src/app/(public)/[username]/followers/followers-page-client.tsx` - Followers list with back navigation
- `frontend/src/app/(public)/[username]/following/following-page-client.tsx` - Following list with back navigation
- `frontend/src/app/(public)/post/[postId]/post-detail-page-client.tsx` - Post detail with actions, comments, carousel
- `frontend/src/app/(public)/explore/explore-page-client.tsx` - Explore feed with infinite scroll, modal
- `frontend/src/app/(public)/item/[itemId]/item-detail-page-client.tsx` - Item detail with back button
- `frontend/src/app/(public)/collection/collection-page-client.tsx` - Category grid with search
- `frontend/src/app/(public)/collection/[categorySlug]/category-series-page-client.tsx` - Series grid with breadcrumb
- `frontend/src/app/(public)/collection/[categorySlug]/[seriesSlug]/series-items-page-client.tsx` - Items grid with infinite scroll

**Modified (page.tsx to Server Components):**
- `frontend/src/app/(public)/[username]/page.tsx` - Server Component with generateMetadata (og:image = avatar)
- `frontend/src/app/(public)/[username]/followers/page.tsx` - Server Component with generateMetadata
- `frontend/src/app/(public)/[username]/following/page.tsx` - Server Component with generateMetadata
- `frontend/src/app/(public)/post/[postId]/page.tsx` - Server Component with generateMetadata (og:image = first media)
- `frontend/src/app/(public)/explore/page.tsx` - Server Component with static metadata
- `frontend/src/app/(public)/item/[itemId]/page.tsx` - Server Component with generateMetadata (og:image = item image)
- `frontend/src/app/(public)/collection/page.tsx` - Server Component with static metadata
- `frontend/src/app/(public)/collection/[categorySlug]/page.tsx` - Server Component with generateMetadata
- `frontend/src/app/(public)/collection/[categorySlug]/[seriesSlug]/page.tsx` - Server Component with generateMetadata (og:image = series image)

## Decisions Made
- toAbsoluteUrl helper defined inline per-page (not extracted to shared utility) to keep each page self-contained
- Profile and post pages fetch data server-side and pass as initialData props for immediate rendering
- Explore/collection pages delegate data fetching entirely to client components since their data is paginated/infinite

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 9 public pages are Server Components with full SEO metadata
- Plan 14-04 (authenticated page conversions) can proceed
- Social sharing link previews will show proper titles, descriptions, and images

---
*Phase: 14-frontend-restructure*
*Completed: 2026-03-25*

## Self-Check: PASSED
