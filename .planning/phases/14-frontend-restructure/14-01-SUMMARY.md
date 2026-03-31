---
phase: 14-frontend-restructure
plan: 01
subsystem: ui, infra
tags: [next-themes, jose, jwt, proxy, dark-mode, server-components, tailwind]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    provides: JWT cookie-based auth (access_token, refresh_token)
provides:
  - proxy.ts for server-side auth redirects on protected routes
  - server-fetch.ts utility for Server Component data fetching
  - ThemeProvider with dark mode support (light/dark/system)
  - Sidebar with user avatar dropdown containing theme toggle
  - Tailwind config updated with features/ content path
affects: [14-02, 14-03, 14-04]

# Tech tracking
tech-stack:
  added: [jose]
  patterns: [proxy.ts Next.js 16 convention, server-side cookie forwarding, ThemeProvider with class strategy]

key-files:
  created:
    - frontend/src/proxy.ts
    - frontend/src/lib/server-fetch.ts
    - frontend/src/components/layout/sidebar.tsx
  modified:
    - frontend/src/app/providers.tsx
    - frontend/src/app/layout.tsx
    - frontend/tailwind.config.ts
    - frontend/package.json

key-decisions:
  - "Next.js 16 proxy.ts convention used instead of deprecated middleware.ts"
  - "ThemeProvider wraps QueryClientProvider as outermost provider"
  - "Theme toggle placed inside user avatar DropdownMenu per D-21"
  - "proxy.ts uses blacklist strategy for protected routes per D-10"

patterns-established:
  - "proxy.ts: Next.js 16 server-side auth with JWT cookie decode, no backend API calls"
  - "fetchApi: Server Component utility forwarding access_token cookie for authenticated SSR"
  - "ThemeProvider: class-based dark mode with system default and localStorage persistence"

requirements-completed: [FRNT-02, FRNT-04]

# Metrics
duration: 5min
completed: 2026-03-25
---

# Phase 14 Plan 01: Foundation Utilities Summary

**Auth proxy with JWT cookie decode for server-side redirects, fetchApi utility for SSR, and dark mode via next-themes with user avatar theme toggle**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25T11:09:43Z
- **Completed:** 2026-03-25T11:14:38Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Server-side auth redirect via proxy.ts using JWT cookie decode (jose) for protected routes
- Server-side fetch utility (fetchApi) for Server Components with cookie forwarding
- Dark mode with next-themes ThemeProvider supporting light/dark/system modes
- Sidebar component with user avatar dropdown containing theme toggle
- Tailwind config updated to scan features/ directory for class names

## Task Commits

Each task was committed atomically:

1. **Task 1: Create proxy.ts, server-fetch.ts, and update Tailwind config** - `f8f349f` (feat)
2. **Task 2: Configure dark mode with next-themes and add theme toggle to sidebar** - `b63780c` (feat)

## Files Created/Modified
- `frontend/src/proxy.ts` - Server-side auth redirect proxy using JWT cookie decode with jose
- `frontend/src/lib/server-fetch.ts` - fetchApi utility for Server Components with cookie forwarding
- `frontend/src/components/layout/sidebar.tsx` - Desktop sidebar with nav links and user avatar dropdown (theme toggle)
- `frontend/src/app/providers.tsx` - Added ThemeProvider wrapping QueryClientProvider
- `frontend/src/app/layout.tsx` - Added suppressHydrationWarning to html element
- `frontend/tailwind.config.ts` - Added features/ content path for class scanning
- `frontend/package.json` - Added jose dependency

## Decisions Made
- Used Next.js 16 proxy.ts convention (replaces deprecated middleware.ts) for server-side auth redirects
- ThemeProvider is outermost provider wrapping QueryClientProvider for correct theme context propagation
- Theme toggle placed inside user avatar DropdownMenu (not standalone sidebar nav item) per D-21
- proxy.ts uses blacklist strategy: only explicitly listed routes are protected per D-10
- proxy.ts does NOT call backend API -- purely cookie + JWT decode for speed per D-12
- fetchApi returns null on error for graceful Server Component fallback

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created sidebar.tsx from scratch**
- **Found during:** Task 2
- **Issue:** sidebar.tsx did not exist in this worktree's base commit (0805296). It was introduced in later phases (11+) on the feature branch
- **Fix:** Created sidebar.tsx based on the feature branch version with theme dropdown additions
- **Files modified:** frontend/src/components/layout/sidebar.tsx
- **Verification:** File exists with all required imports and theme toggle functionality
- **Committed in:** b63780c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Sidebar creation was necessary since the worktree lacked this file. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- proxy.ts ready for all protected route redirects
- server-fetch.ts ready for Server Component data fetching in Plans 03/04
- ThemeProvider configured and dark mode CSS variables already in globals.css
- Tailwind features/ path ready for Plan 02 directory restructure

## Self-Check: PASSED

All 7 files verified present on disk. Both task commits (f8f349f, b63780c) verified in git log. No stubs found.

---
*Phase: 14-frontend-restructure*
*Completed: 2026-03-25*
