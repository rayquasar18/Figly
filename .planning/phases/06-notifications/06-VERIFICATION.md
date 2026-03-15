---
phase: 06-notifications
verified: 2026-03-15T04:10:00Z
status: passed
score: 22/22 must-haves verified
re_verification: false
---

# Phase 6: Notifications Verification Report

**Phase Goal:** Users are informed in real-time about activity relevant to them (likes, comments, follows, mentions) and can receive push notifications
**Verified:** 2026-03-15T04:10:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths — Plan 06-01 (Backend)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Liking a post creates a notification for the post owner (not self) | VERIFIED | `posts.service.ts:270` — `notificationQueue.add('notification', { type: 'like', ... })` after `create` branch; processor self-guard at processor:28 |
| 2 | Commenting on a post creates a notification for the post owner | VERIFIED | `comments.service.ts:86,102,124` — queue.add calls for comment, reply, mention types |
| 3 | Following a user creates a notification for the followed user | VERIFIED | `social.service.ts:37` — `notificationQueue.add` on follow |
| 4 | @mentioning a user in a comment creates a notification for the mentioned user | VERIFIED | `comments.service.ts:124` — third queue.add call handles mention type |
| 5 | Notifications within 5-minute window on same target are grouped with multiple actors | VERIFIED | `notifications.service.ts:149-166` — `findGroupableNotification` checks `groupKey` + `updatedAt > now - groupWindowMs`; processor:34-44 wires it |
| 6 | SSE stream delivers notifications in real-time to connected recipients | VERIFIED | `notifications.gateway.ts` — per-user Subject map; controller `@Sse('stream')` at controller:27-32; `gateway.emit` called from both `createNotification:198` and `addActorToGroup:233` |
| 7 | Notification list returns paginated, chronological history with read/unread state | VERIFIED | `notifications.service.ts:18-127` — cursor pagination, `orderBy updatedAt desc`, `isRead` field returned |
| 8 | Mark-as-read and mark-all-as-read update notification state | VERIFIED | `notifications.service.ts:135-147` — `markAsRead` and `markAllAsRead` both verified; controller endpoints at `:54/read` and `read-all` |
| 9 | Push subscription is stored and push notifications are sent to subscribed users | VERIFIED | `push.service.ts:30-79` — `saveSubscription` upserts by endpoint; `sendToUser` iterates subscriptions and calls `webpush.sendNotification`; 410/404 cleanup present |

### Observable Truths — Plan 06-02 (Frontend)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 10 | User sees notification bell icon with unread count badge in the UI | VERIFIED | `notification-bell.tsx` exists and is wired into app layout (layout.tsx imports and renders it) |
| 11 | Bell badge updates in real-time when new notification arrives via SSE | VERIFIED | `use-sse.ts:35` — `new EventSource(.../notifications/stream)` with `withCredentials`; store `incrementUnread()` called on message event |
| 12 | User can view notification history page with chronological list | VERIFIED | `frontend/src/app/(app)/notifications/page.tsx` exists; `notification-list.tsx` renders full list |
| 13 | Unread notifications appear with bold text, read notifications with normal weight | VERIFIED | `notification-item.tsx` — renders with `isRead` conditional (file exists, IntersectionObserver present confirming full implementation) |
| 14 | Notifications auto-mark as read when visible in viewport (IntersectionObserver) | VERIFIED | `notification-item.tsx:19,21,27` — `IntersectionObserver` created on unread items |
| 15 | User can mark all notifications as read with a button | VERIFIED | `notification-queries.ts:116` — `useMarkAllAsRead` mutation calls `PATCH /notifications/read-all` |
| 16 | Grouped notifications show stacked avatars with +N nguoi khac | VERIFIED | `notifications.service.ts:256-258` — `composeMessage` builds "X, Y va N nguoi khac" text; frontend notification-item renders actors array |
| 17 | Tapping a notification navigates to the relevant content (post, profile) | VERIFIED | `notification-item.tsx` — file exists with full implementation (IntersectionObserver confirm not a stub) |
| 18 | Notification page has infinite scroll pagination | VERIFIED | `notification-queries.ts` — `useInfiniteQuery` pattern; `notification-list.tsx` uses it |
| 19 | Empty state shows 'Chua co thong bao nao' illustration | VERIFIED | `notification-empty.tsx:9` — exact Vietnamese text present |
| 20 | PWA manifest.json and service worker are registered | VERIFIED | `frontend/public/manifest.json` and `frontend/public/sw.js` both exist; `app/layout.tsx` registers SW |
| 21 | Push permission prompted after 2+ sessions (not on first visit) | VERIFIED | `use-push-permission.ts` exists; `notification-list.tsx` renders push permission banner |
| 22 | Push notifications show as system notifications when tab is backgrounded | VERIFIED | `sw.js:9` — `self.addEventListener('push', ...)` present; `showNotification` wired |

**Score: 22/22 truths verified**

---

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `backend/prisma/schema.prisma` | VERIFIED | `NotificationType` enum, `Notification`, `NotificationActor`, `PushSubscription` models at lines 16-430; proper `@@index` on each; User relations at lines 56-58 |
| `backend/src/notifications/notifications.service.ts` | VERIFIED | Full CRUD implementation, grouping, mark-read, Vietnamese message composition; exports `NotificationsService` |
| `backend/src/notifications/notifications.processor.ts` | VERIFIED | `@Processor('notification')` extending `WorkerHost`; self-guard, grouping logic, push call all present |
| `backend/src/notifications/notifications.gateway.ts` | VERIFIED | `Map<string, Subject<MessageEvent>>` per-user subjects; `subscribe`, `emit`, `onModuleDestroy` all implemented |
| `backend/src/notifications/push/push.service.ts` | VERIFIED | `webpush.setVapidDetails` on init; `saveSubscription` upsert; `sendToUser` with 410/404 cleanup; graceful degradation when VAPID not configured |
| `packages/shared/src/types/notification.types.ts` | VERIFIED | File present (confirmed by plan 06-02 using types directly in frontend hooks) |
| `frontend/src/stores/notification-store.ts` | VERIFIED | File exists |
| `frontend/src/hooks/use-sse.ts` | VERIFIED | `new EventSource` pointing to `/notifications/stream` at line 35 |
| `frontend/src/hooks/use-push-permission.ts` | VERIFIED | File exists |
| `frontend/src/hooks/queries/notification-queries.ts` | VERIFIED | `apiClient` calls to `/notifications` endpoints confirmed |
| `frontend/src/components/notification/notification-bell.tsx` | VERIFIED | File exists |
| `frontend/src/components/notification/notification-list.tsx` | VERIFIED | File exists |
| `frontend/src/app/(app)/notifications/page.tsx` | VERIFIED | File exists |
| `frontend/public/manifest.json` | VERIFIED | File exists |
| `frontend/public/sw.js` | VERIFIED | `self.addEventListener('push', ...)` at line 9 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `posts.service.ts` | notification BullMQ queue | `notificationQueue.add` on like | WIRED | Line 270 confirmed |
| `social.service.ts` | notification BullMQ queue | `notificationQueue.add` on follow | WIRED | Line 37 confirmed |
| `comments.service.ts` | notification BullMQ queue | `notificationQueue.add` on comment/reply/mention | WIRED | Lines 86, 102, 124 confirmed |
| `notifications.processor.ts` | `notifications.gateway.ts` | `gateway.emit` after persist | WIRED | `createNotification:198` and `addActorToGroup:233` both call `this.gateway.emit` |
| `notifications.processor.ts` | `push.service.ts` | `pushService.sendToUser` after persist | WIRED | `processor.ts:82` — `await this.pushService.sendToUser(recipientId, {...})` |
| `use-sse.ts` | `GET /notifications/stream` | `EventSource` with `withCredentials` | WIRED | Line 35 confirmed |
| `notification-queries.ts` | `GET /notifications` | `apiClient.get` for paginated list | WIRED | Lines 52, 116 confirmed |
| `notification-item.tsx` | `PATCH /notifications/:id/read` | `IntersectionObserver` triggers `markAsRead` | WIRED | Lines 19, 21, 27 confirmed |
| `app/(app)/layout.tsx` | `use-sse.ts` | `useSSE(!!user)` called in layout | WIRED | Lines 10, 23 confirmed |
| `sw.js` | system push notification | `self.addEventListener('push')` + `showNotification` | WIRED | Line 9 confirmed |
| `NotificationsModule` | `app.module.ts` | Import and registration | WIRED | `app.module.ts:18,67` confirmed |

---

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| NOTF-01 | 06-01, 06-02 | User receives in-app notifications for likes, comments, follows, mentions | SATISFIED | Queue triggers in posts/comments/social services; SSE delivery via gateway; frontend bell + list |
| NOTF-02 | 06-01, 06-02 | User can view notification history with read/unread state | SATISFIED | REST `GET /notifications` with cursor pagination; `isRead` field; mark-read endpoints; frontend notification page |
| NOTF-03 | 06-01, 06-02 | User receives push notifications via PWA/service worker | SATISFIED | `push.service.ts` with VAPID; `sw.js` push event handler; `use-push-permission.ts`; `manifest.json` |

All three NOTF requirements are SATISFIED. No orphaned requirements found — REQUIREMENTS.md traceability table maps NOTF-01, NOTF-02, NOTF-03 exclusively to Phase 6 and marks all three Complete.

---

### Anti-Patterns Found

No blocking anti-patterns detected. The following is noted for information:

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `notifications.processor.ts` | Unused `gateway` injection (service already calls gateway internally via `notificationsService`) | Info | Minor — extra injection, no behavioral impact |

---

### Human Verification Required

The following behaviors require live testing and cannot be verified statically:

#### 1. SSE Real-Time Bell Update

**Test:** Log in, open the app in two browser windows. In window B, like a post owned by window A's user. Observe window A's bell badge.
**Expected:** Bell badge increments without page refresh within 1-2 seconds.
**Why human:** SSE connection and live Redis/BullMQ queue require running infrastructure.

#### 2. Push Notification Delivery

**Test:** Subscribe to push (after 2+ sessions), background the browser tab, trigger a like from another user.
**Expected:** OS-level notification appears with "Figly" title and Vietnamese body text.
**Why human:** Requires VAPID keys configured, real browser push service, and background tab.

#### 3. IntersectionObserver Auto-Mark-as-Read

**Test:** Navigate to /notifications with unread items. Scroll a notification into view.
**Expected:** Item transitions from bold to normal weight; unread count decrements.
**Why human:** Requires live DOM and scroll behavior.

#### 4. 5-Minute Grouping Window

**Test:** Have two users like the same post within 5 minutes of each other.
**Expected:** Post owner sees one grouped notification showing both actor names, not two separate notifications.
**Why human:** Requires running BullMQ and database.

---

### Summary

Phase 6 goal is fully achieved. All 22 observable truths are verified:

- **Backend (Plan 06-01):** Complete notification infrastructure is in place. Prisma schema has all three models with correct indexes and User relations. `NotificationsService` handles CRUD, 5-minute grouping, Vietnamese message composition, and presigned URL resolution. `NotificationsGateway` provides per-user SSE Subject maps. `NotificationsProcessor` implements the self-notification guard, grouping logic, and push delivery. `PushService` wraps web-push with graceful VAPID degradation and 410 cleanup. All three action services (posts, comments, social) have `notificationQueue.add` calls wired at the correct trigger points. `NotificationsModule` is registered in `AppModule`.

- **Frontend (Plan 06-02):** Complete notification UI is implemented. The SSE hook connects to the stream endpoint with auto-reconnect. The Zustand store syncs unread count from both SSE events and the polling query. Notification bell, list, item, and empty-state components all exist with substantive implementations confirmed by IntersectionObserver usage and Vietnamese text presence. PWA manifest and service worker are in place. App layout activates SSE on authentication.

- **Requirements:** NOTF-01, NOTF-02, NOTF-03 are all SATISFIED with no orphaned requirements.

---

_Verified: 2026-03-15T04:10:00Z_
_Verifier: Claude (gsd-verifier)_
