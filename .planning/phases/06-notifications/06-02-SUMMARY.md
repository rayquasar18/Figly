---
phase: 06-notifications
plan: 02
subsystem: ui
tags: [react, zustand, tanstack-query, sse, pwa, push-notifications, intersection-observer, service-worker]

# Dependency graph
requires:
  - phase: 06-notifications
    provides: NotificationsModule SSE stream, REST API, push service, shared types
  - phase: 01-foundation-auth
    provides: useMe, apiClient, auth-store pattern
  - phase: 03-content-feed
    provides: post-queries infinite scroll pattern, bottom-nav, app layout
provides:
  - Zustand notification store for unread count and SSE state
  - SSE real-time hook with auto-reconnect and 30s polling fallback
  - TanStack Query hooks for all notification endpoints with optimistic updates
  - Push permission hook with session counting (2+ sessions gate)
  - NotificationBell with unread count badge
  - NotificationList with infinite scroll, mark-all-read, push banner
  - NotificationItem with stacked avatars, auto-mark-as-read, navigation
  - Instagram 5-tab BottomNav (Home, Search, Create, Heart, Profile)
  - Top header bar with Figly logo, bell, and avatar
  - PWA manifest.json and service worker for push notifications
  - /notifications page route
affects: [messaging, stories]

# Tech tracking
tech-stack:
  added: [date-fns]
  patterns: [SSE EventSource with withCredentials, IntersectionObserver auto-read, push permission session gating, PWA service worker push handler]

key-files:
  created:
    - frontend/src/stores/notification-store.ts
    - frontend/src/hooks/use-sse.ts
    - frontend/src/hooks/use-push-permission.ts
    - frontend/src/hooks/queries/notification-queries.ts
    - frontend/src/components/notification/notification-bell.tsx
    - frontend/src/components/notification/notification-list.tsx
    - frontend/src/components/notification/notification-item.tsx
    - frontend/src/components/notification/notification-empty.tsx
    - frontend/src/app/(app)/notifications/page.tsx
    - frontend/public/manifest.json
    - frontend/public/sw.js
    - frontend/public/icons/icon-192.png
    - frontend/public/icons/icon-512.png
  modified:
    - frontend/src/components/layout/bottom-nav.tsx
    - frontend/src/app/(app)/layout.tsx
    - frontend/src/app/layout.tsx

key-decisions:
  - "Instagram 5-tab BottomNav: Home, Search, Create, Heart (notifications), Profile -- Collection accessible from profile/search"
  - "Top header bar with Figly logo, notification bell, and user avatar for Instagram-style navigation"
  - "Auto-mark-as-read via IntersectionObserver threshold 0.5 on NotificationItem"
  - "Push permission gated behind 2+ sessions via localStorage counter"
  - "User avatar in header uses initial letter fallback since PublicUser lacks avatarUrl field"

patterns-established:
  - "SSE hook pattern: EventSource with withCredentials, useRef for instance, 30s reconnect on error"
  - "Notification store pattern: Zustand for real-time unread count synced from both SSE and query"
  - "Auto-mark-as-read pattern: IntersectionObserver on item, disconnect after trigger, optimistic cache update"
  - "Push permission flow: session count in localStorage, Notification.requestPermission, VAPID subscribe, backend sync"

requirements-completed: [NOTF-01, NOTF-02, NOTF-03]

# Metrics
duration: 5min
completed: 2026-03-15
---

# Phase 6 Plan 2: Notification Frontend UI Summary

**Real-time notification UI with SSE bell badge, Instagram-style notification history with auto-read IntersectionObserver, PWA push support, and 5-tab bottom navigation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-15T03:45:16Z
- **Completed:** 2026-03-15T03:50:11Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Zustand notification store with SSE hook providing real-time unread count updates
- Full notification UI: bell badge, item list with stacked avatars, infinite scroll, auto-mark-as-read
- PWA manifest, service worker, and push permission flow with session counting
- Instagram-style app layout with top header (logo, bell, avatar) and 5-tab bottom nav
- TanStack Query hooks with optimistic updates for all notification CRUD operations

## Task Commits

Each task was committed atomically:

1. **Task 1: Notification store, SSE hook, query hooks, push permission, PWA** - `b16cf95` (feat)
2. **Task 2: Notification UI components, page, and layout integration** - `0a5d9c6` (feat)

## Files Created/Modified

### Created
- `frontend/src/stores/notification-store.ts` - Zustand store for unread count and SSE connection state
- `frontend/src/hooks/use-sse.ts` - SSE connection hook with auto-reconnect and 30s polling fallback
- `frontend/src/hooks/use-push-permission.ts` - Push permission with session counting and VAPID subscribe
- `frontend/src/hooks/queries/notification-queries.ts` - TanStack Query hooks for all notification endpoints
- `frontend/src/components/notification/notification-bell.tsx` - Bell icon with red unread count badge
- `frontend/src/components/notification/notification-list.tsx` - Full notification history with infinite scroll
- `frontend/src/components/notification/notification-item.tsx` - Notification row with stacked avatars and auto-read
- `frontend/src/components/notification/notification-empty.tsx` - Vietnamese empty state with BellOff icon
- `frontend/src/app/(app)/notifications/page.tsx` - Notifications page route
- `frontend/public/manifest.json` - PWA manifest for installability and push
- `frontend/public/sw.js` - Service worker for push event handling and notification click
- `frontend/public/icons/icon-192.png` - Placeholder PWA icon 192x192
- `frontend/public/icons/icon-512.png` - Placeholder PWA icon 512x512

### Modified
- `frontend/src/components/layout/bottom-nav.tsx` - Updated to Instagram 5-tab layout with Heart for notifications
- `frontend/src/app/(app)/layout.tsx` - Added top header bar, SSE hook, push permission hook
- `frontend/src/app/layout.tsx` - Added manifest link, theme-color meta, service worker registration

## Decisions Made
- Instagram 5-tab BottomNav: Home, Search, Create, Heart (notifications), Profile -- removed Collection from bottom nav (accessible from profile/search)
- Top header bar with Figly logo, notification bell, and user avatar for Instagram-style navigation
- Auto-mark-as-read via IntersectionObserver with threshold 0.5 on each NotificationItem
- Push permission gated behind 2+ sessions via localStorage counter to avoid annoying first-time users
- User avatar in header uses initial letter fallback since PublicUser type lacks avatarUrl field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Uint8Array type incompatibility in push permission hook**
- **Found during:** Task 1 (build verification)
- **Issue:** `urlBase64ToUint8Array` returned `Uint8Array` which TypeScript rejected for `applicationServerKey` parameter due to `ArrayBufferLike` vs `ArrayBuffer` incompatibility
- **Fix:** Changed return type to `ArrayBuffer` by returning `arr.buffer as ArrayBuffer`
- **Files modified:** frontend/src/hooks/use-push-permission.ts
- **Verification:** Frontend build passes cleanly
- **Committed in:** b16cf95 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed PublicUser type missing avatarUrl/displayName fields**
- **Found during:** Task 2 (build verification)
- **Issue:** App layout referenced `user.avatarUrl` and `user.displayName` which don't exist on PublicUser type
- **Fix:** Used `user.name` for initial letter fallback and removed avatar image conditional
- **Files modified:** frontend/src/app/(app)/layout.tsx
- **Verification:** Frontend build passes cleanly
- **Committed in:** 0a5d9c6 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for TypeScript compilation correctness. No scope creep.

## Issues Encountered
None - both build errors caught during verification and resolved immediately.

## User Setup Required
None - VAPID public key is optional (push features degrade gracefully without it).

## Next Phase Readiness
- Complete notification frontend integrated with backend SSE stream and REST API
- All notification flows wired end-to-end: real-time bell updates, browsable history, push notifications
- Ready for Phase 7 (Messaging) or any subsequent phases

---
*Phase: 06-notifications*
*Completed: 2026-03-15*
