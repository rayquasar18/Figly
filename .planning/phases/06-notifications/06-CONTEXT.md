# Phase 6: Notifications - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning
**Source:** User reference: "same with Instagram"

<domain>
## Phase Boundary

Users are informed in real-time about activity relevant to them (likes, comments, follows, mentions) and can receive push notifications via PWA service worker. This phase delivers in-app notifications, notification history, and push notifications.

</domain>

<decisions>
## Implementation Decisions

### Real-time Delivery
- SSE (Server-Sent Events) for real-time in-app notifications — simpler than WebSocket, sufficient for one-way server-to-client notification stream
- Notifications delivered instantly when action occurs (like, comment, follow, mention)
- SSE connection established on app load for authenticated users
- Fallback: polling every 30s if SSE connection fails
- BullMQ job queue for async notification creation (decouple from request path)

### Notification Types & Throttling (Instagram-style)
- **Types:** like, comment, reply, follow, mention
- **Grouping:** Multiple likes on same post grouped — "userA, userB va 3 nguoi khac da thich bai viet cua ban" (Instagram-style aggregation)
- **Throttling:** Group same-type notifications on same target within 5-minute window into single notification
- **No per-type mute setting** for v1 — all notifications on (keep simple, add granular settings later)

### Notification List UX (Instagram Activity tab)
- Chronological list, newest first
- Each notification shows: actor avatar, actor name, action text, target thumbnail (if post), relative timestamp
- Grouped notifications show stacked avatars (up to 3) + "+N nguoi khac"
- **Read/unread:** Bold text for unread, normal weight for read
- **Mark as read:** Auto-mark when notification becomes visible in viewport (IntersectionObserver) — no manual tap/swipe needed
- **"Mark all as read"** button at top of notification list
- Notification bell icon in header with unread count badge (red dot with number, max "99+")
- Tapping notification navigates to relevant content (post detail, profile, comment)
- Infinite scroll pagination for notification history
- Empty state: "Chua co thong bao nao" with illustration

### Push Notification Flow (PWA)
- PWA manifest.json with app name, icons, theme color
- Service worker registered on first app load
- Push permission prompt shown after user has been active for at least 1 session (not on first visit — avoid permission fatigue)
- When backgrounded/tab closed: show system push notification with actor name + action
- Push notification tap opens app to relevant content
- web-push library for VAPID-based push from backend
- PushSubscription stored in database, associated with user

### Claude's Discretion
- SSE vs WebSocket implementation details
- Notification database schema design
- Service worker caching strategy
- Exact aggregation algorithm for grouping
- Push notification icon and badge design
- Error handling for failed push deliveries

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- **BullMQ (@nestjs/bullmq):** Already installed — use for async notification job processing
- **PostsService (like/comment/mention):** Action entry points where notification triggers will be added
- **SocialService (follow):** Follow action entry point for follow notifications
- **mapPostResponse helper:** Can provide post thumbnail data for notification display
- **OptionalJwtAuthGuard:** Pattern for auth-aware endpoints
- **IntersectionObserver pattern:** Already used in feed/explore/followers for infinite scroll — reuse for read-on-visible

### Established Patterns
- **Cursor pagination (take+1):** Use for notification list pagination
- **Debounced search (300ms):** UI input pattern available
- **TanStack Query hooks:** Data fetching pattern for notification queries
- **Vietnamese error messages:** All user-facing strings in Vietnamese

### Integration Points
- **Header/TopNav:** Add notification bell icon with unread badge
- **PostsController (like/comment):** Trigger notification on like/comment actions
- **SocialController (follow):** Trigger notification on follow
- **PostsService (createPost with mentions):** Trigger notification on @mention
- **BottomNav:** Add notification tab (heart/bell icon like Instagram)
- **App layout:** SSE connection setup on authenticated app load

</code_context>

<specifics>
## Specific Ideas

- Instagram Activity tab as primary reference — chronological notification list with grouped similar actions
- Avatar stacking for grouped notifications (like Instagram's "userA, userB and 3 others liked your post")
- Red dot badge on notification icon showing unread count
- Auto-read on scroll (not tap-to-read) for frictionless UX
- Push notifications should feel native — use system notification styling, not custom toast

</specifics>

<deferred>
## Deferred Ideas

- Per-type notification mute settings — future enhancement
- Email notification digest — future phase
- In-app notification sound effects — future enhancement
- Rich push notifications with image preview — v2

</deferred>

---

*Phase: 06-notifications*
*Context gathered: 2026-03-15*
