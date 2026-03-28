# Phase 6: Notifications - Research

**Researched:** 2026-03-15
**Domain:** Real-time notifications (SSE), notification persistence, PWA push notifications
**Confidence:** HIGH

## Summary

Phase 6 implements a full notification system for Figly: in-app real-time notifications via Server-Sent Events (SSE), a notification history screen with Instagram-style grouping and read/unread states, and PWA push notifications via the Web Push API with VAPID authentication.

The backend architecture centers on a dedicated `NotificationsModule` with a BullMQ job queue (already in the project stack) that decouples notification creation from the request path. When a user likes, comments, follows, or mentions someone, the originating service emits a notification job. A processor creates the notification record and fans it out via SSE to the connected recipient. For push notifications, the `web-push` library sends VAPID-authenticated payloads to stored PushSubscription endpoints. The frontend receives SSE events, updates a Zustand notification store and TanStack Query cache in real-time, and renders an Instagram-style Activity tab with grouped notifications, auto-mark-as-read via IntersectionObserver, and a bell icon with unread badge.

**Primary recommendation:** Use NestJS built-in SSE support (rxjs Subject per user), BullMQ for async notification creation, `web-push` for VAPID push, and a service worker in `public/sw.js` for push event handling. No third-party notification service needed -- the existing Redis + BullMQ infrastructure handles everything.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- SSE (Server-Sent Events) for real-time in-app notifications -- simpler than WebSocket, sufficient for one-way server-to-client notification stream
- Notifications delivered instantly when action occurs (like, comment, follow, mention)
- SSE connection established on app load for authenticated users
- Fallback: polling every 30s if SSE connection fails
- BullMQ job queue for async notification creation (decouple from request path)
- **Types:** like, comment, reply, follow, mention
- **Grouping:** Multiple likes on same post grouped -- "userA, userB va 3 nguoi khac da thich bai viet cua ban" (Instagram-style aggregation)
- **Throttling:** Group same-type notifications on same target within 5-minute window into single notification
- **No per-type mute setting** for v1 -- all notifications on (keep simple)
- Chronological list, newest first
- Each notification shows: actor avatar, actor name, action text, target thumbnail (if post), relative timestamp
- Grouped notifications show stacked avatars (up to 3) + "+N nguoi khac"
- **Read/unread:** Bold text for unread, normal weight for read
- **Mark as read:** Auto-mark when notification becomes visible in viewport (IntersectionObserver) -- no manual tap/swipe needed
- **"Mark all as read"** button at top of notification list
- Notification bell icon in header with unread count badge (red dot with number, max "99+")
- Tapping notification navigates to relevant content (post detail, profile, comment)
- Infinite scroll pagination for notification history
- Empty state: "Chua co thong bao nao" with illustration
- PWA manifest.json with app name, icons, theme color
- Service worker registered on first app load
- Push permission prompt shown after user has been active for at least 1 session (not on first visit)
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

### Deferred Ideas (OUT OF SCOPE)
- Per-type notification mute settings -- future enhancement
- Email notification digest -- future phase
- In-app notification sound effects -- future enhancement
- Rich push notifications with image preview -- v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NOTF-01 | User receives in-app notifications for likes, comments, follows, mentions | SSE real-time delivery architecture, BullMQ notification job processing, notification triggers in PostsService/SocialService/CommentsService |
| NOTF-02 | User can view notification history with read/unread state | Notification database schema, cursor pagination, IntersectionObserver auto-read, notification grouping/aggregation algorithm |
| NOTF-03 | User receives push notifications via PWA/service worker | web-push VAPID library, PushSubscription storage, service worker registration, manifest.json, push event handling |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @nestjs/common (Sse) | ^10.4.0 | SSE endpoint via `@Sse()` decorator + rxjs Observable | Built into NestJS, no extra dependency, returns Observable of MessageEvent |
| rxjs (Subject) | ^7.8.1 | Per-user event stream for SSE fan-out | Already in NestJS core deps, Subject allows push-style emission |
| bullmq | ^5.71.0 | Async notification job queue | Already installed and used for media processing |
| @nestjs/bullmq | ^11.0.4 | NestJS BullMQ integration | Already installed, register new `notification` queue |
| web-push | ^3.6.7 | VAPID-based push notification sending | De facto standard for Web Push Protocol, used by most Node.js push implementations |
| @prisma/client | ^6.4.0 | Notification persistence | Already the project ORM |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Relative timestamps ("2 phut truoc") | Already installed in frontend, use `formatDistanceToNow` with Vietnamese locale |
| lucide-react | ^0.468.0 | Bell, Heart, MessageCircle, UserPlus icons | Already installed, use for notification type icons |
| zustand | ^5.0.0 | Client-side notification state (unread count, SSE connection) | Already installed, create notification-store.ts |

### New Dependencies Required
| Library | Version | Purpose | Install In |
|---------|---------|---------|------------|
| web-push | ^3.6.7 | VAPID push sending from backend | backend |
| @types/web-push | ^3.6.4 | TypeScript types for web-push | backend (devDependencies) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| SSE | WebSocket (socket.io) | WebSocket is bidirectional but overkill for one-way server-to-client notifications; SSE is simpler, auto-reconnects, works through HTTP proxies |
| Per-user rxjs Subject | Redis Pub/Sub | Redis Pub/Sub needed for multi-instance scaling; single-instance SSE with in-memory Subjects is sufficient for v1 |
| Custom service worker | next-pwa package | next-pwa adds complexity and is poorly maintained; manual service worker in public/ is simpler and more controllable |

**Installation:**
```bash
cd backend && pnpm add web-push && pnpm add -D @types/web-push
```

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
  notifications/
    notifications.module.ts        # Module with BullMQ queue registration
    notifications.controller.ts    # SSE endpoint + REST CRUD
    notifications.service.ts       # Create, query, aggregate, mark-read logic
    notifications.processor.ts     # BullMQ worker: persist notification + emit SSE + send push
    notifications.gateway.ts       # SSE connection manager (user -> Subject map)
    dto/
      notification-response.dto.ts # Response shape
    push/
      push.service.ts              # web-push wrapper, VAPID key management
      push-subscription.dto.ts     # PushSubscription save DTO

frontend/src/
  components/
    notification/
      notification-list.tsx        # Full-page notification history
      notification-item.tsx        # Single notification row (or grouped)
      notification-bell.tsx        # Bell icon with unread badge for header
      notification-empty.tsx       # Empty state illustration
  hooks/
    queries/
      notification-queries.ts      # TanStack Query hooks + SSE integration
    use-sse.ts                     # SSE connection hook with reconnect logic
    use-push-permission.ts         # Push permission prompt logic
  stores/
    notification-store.ts          # Zustand store for unread count, SSE state
  app/
    (app)/
      notifications/
        page.tsx                   # Notification history page

frontend/public/
  manifest.json                    # PWA manifest
  sw.js                            # Service worker for push events
  icons/                           # PWA icons (192x192, 512x512)
```

### Pattern 1: NestJS SSE with @Sse Decorator
**What:** NestJS provides a built-in `@Sse()` decorator that returns an `Observable<MessageEvent>` from a controller method. Clients connect via `EventSource` API.
**When to use:** One-way server-to-client real-time data streams.
**Example:**
```typescript
// notifications.controller.ts
import { Controller, Sse, Req, UseGuards } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly gateway: NotificationsGateway) {}

  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  sse(@Req() req: Request): Observable<MessageEvent> {
    const { userId } = req.user as any;
    // Return the per-user Observable; NestJS handles SSE formatting
    return this.gateway.subscribe(userId);
  }
}
```

### Pattern 2: Per-User Subject Map (SSE Gateway)
**What:** An injectable service that maintains a `Map<string, Subject<MessageEvent>>` for connected users. When a notification is created, it emits to the target user's Subject.
**When to use:** Fan-out notifications to specific connected users.
**Example:**
```typescript
// notifications.gateway.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable, finalize } from 'rxjs';

interface MessageEvent {
  data: string | object;
  id?: string;
  type?: string;
  retry?: number;
}

@Injectable()
export class NotificationsGateway implements OnModuleDestroy {
  private connections = new Map<string, Subject<MessageEvent>>();

  subscribe(userId: string): Observable<MessageEvent> {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Subject<MessageEvent>());
    }
    const subject = this.connections.get(userId)!;

    // Clean up when client disconnects
    return subject.asObservable().pipe(
      finalize(() => {
        // Only delete if no other subscribers
        if (subject.observed === false) {
          this.connections.delete(userId);
        }
      }),
    );
  }

  emit(userId: string, event: MessageEvent): void {
    const subject = this.connections.get(userId);
    if (subject) {
      subject.next(event);
    }
  }

  onModuleDestroy() {
    this.connections.forEach((subject) => subject.complete());
    this.connections.clear();
  }
}
```

### Pattern 3: BullMQ Notification Processor (Decoupled from Request)
**What:** Action endpoints (like, comment, follow, mention) enqueue a BullMQ job instead of creating notifications synchronously. A processor handles persistence, SSE emission, and push delivery.
**When to use:** Always -- decouples notification logic from the action response time.
**Example:**
```typescript
// In PostsService.toggleLike (after successful like creation):
await this.notificationQueue.add('notification', {
  type: 'like',
  actorId: userId,
  recipientId: postOwnerId,
  targetId: postId,
  targetType: 'post',
});

// notifications.processor.ts
@Processor('notification')
export class NotificationsProcessor extends WorkerHost {
  async process(job: Job<NotificationJobData>): Promise<void> {
    const { type, actorId, recipientId, targetId, targetType } = job.data;

    // Skip self-notifications
    if (actorId === recipientId) return;

    // Check for existing group window (5 minutes)
    const existing = await this.findGroupableNotification(type, targetId, recipientId);

    if (existing) {
      // Add actor to existing grouped notification
      await this.addActorToGroup(existing.id, actorId);
    } else {
      // Create new notification
      await this.createNotification(job.data);
    }

    // Emit SSE event to recipient
    this.gateway.emit(recipientId, { data: { ... } });

    // Send push notification if user has subscription
    await this.pushService.sendToUser(recipientId, { ... });
  }
}
```

### Pattern 4: Notification Aggregation/Grouping Algorithm
**What:** Within a 5-minute window, same-type notifications on the same target are grouped into a single notification with multiple actors.
**When to use:** Like aggregation ("A, B and 3 others liked your post").
**Design:**
```
Notification table stores:
- groupKey: `${type}:${targetId}` (e.g., "like:post_abc123")
- actors: array of actor IDs (stored in NotificationActor join table)
- When new like arrives within 5 min of last update on same groupKey:
  -> Add actor to existing notification's actor list
  -> Update notification's updatedAt timestamp
  -> Re-emit SSE with updated aggregation
- When 5 min window expired:
  -> Create new notification row with new groupKey instance
```

### Pattern 5: IntersectionObserver Auto-Read
**What:** Notification items become "read" when they scroll into the viewport, using the same IntersectionObserver pattern already in the project (used in feed/explore for infinite scroll).
**When to use:** Mark-as-read on visibility, not on tap.
**Example:**
```typescript
// notification-item.tsx
const ref = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!notification.isRead && ref.current) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          markAsRead(notification.id);
          observer.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }
}, [notification.isRead]);
```

### Pattern 6: Service Worker Push Handler
**What:** A service worker in `public/sw.js` listens for `push` events, displays system notifications, and handles `notificationclick` to open the relevant URL.
**When to use:** PWA push notifications when browser tab is closed/backgrounded.
**Example:**
```javascript
// public/sw.js
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Figly', {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});
```

### Anti-Patterns to Avoid
- **Synchronous notification creation in request handler:** Slows down like/comment/follow response. Always use BullMQ queue.
- **Global EventSource without cleanup:** Must close EventSource when user logs out, handle reconnection on auth refresh.
- **Polling as primary strategy:** SSE is the primary channel; polling is only fallback when SSE fails.
- **Storing full notification text in DB:** Store type + actor + target references; compose display text at query time for flexibility.
- **Requesting push permission on first visit:** Permission fatigue causes permanent denials. Wait until user has demonstrated engagement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE protocol formatting | Manual HTTP streaming with text/event-stream | NestJS @Sse decorator + rxjs Observable | NestJS handles keep-alive, event formatting, proper headers |
| Push notification sending | Raw HTTP to push service endpoints | `web-push` library | Handles VAPID signature generation, payload encryption (RFC 8291), endpoint validation |
| VAPID key generation | Manual ECDSA key pair creation | `web-push.generateVAPIDKeys()` | One command generates valid P-256 key pair |
| SSE reconnection | Manual reconnection with setTimeout | Browser EventSource auto-reconnect | EventSource spec includes automatic reconnection with configurable retry interval |
| Relative time formatting | Custom "X phut truoc" function | `date-fns/formatDistanceToNow` with `vi` locale | Handles all time ranges, Vietnamese locale support built in |

**Key insight:** The Web Push Protocol (RFC 8030) requires AEAD encryption of payloads. The `web-push` library handles this transparently -- building it manually would be error-prone and ~500 lines of crypto code.

## Common Pitfalls

### Pitfall 1: SSE Connection Leak on Auth Refresh
**What goes wrong:** When the JWT expires and the frontend refreshes the token, the SSE connection may drop. If not properly cleaned up, stale connections accumulate.
**Why it happens:** EventSource uses cookies/headers at connection time. Token refresh doesn't update an existing SSE connection.
**How to avoid:** Close and re-establish EventSource when the auth token is refreshed. Add connection heartbeat (NestJS sends `:` comment lines as keep-alive by default). Track active connections in the gateway with user cleanup on disconnect.
**Warning signs:** Memory growth on the server, SSE events stop arriving after ~15 minutes.

### Pitfall 2: Self-Notification
**What goes wrong:** User likes their own post and receives a notification for it.
**Why it happens:** Notification trigger fires for every like, regardless of actor == recipient.
**How to avoid:** Check `actorId !== recipientId` in the notification processor BEFORE creating the record. This is a processor-level guard, not an API-level guard.
**Warning signs:** Users reporting "I got a notification for my own action."

### Pitfall 3: Push Permission Prompt Timing
**What goes wrong:** Requesting push permission on first page load causes high denial rates. Once denied, the browser remembers and won't prompt again.
**Why it happens:** Users reflexively deny permissions they don't understand yet.
**How to avoid:** Track session count in localStorage. Only show a custom in-app prompt ("Bat thong bao de khong bo lo hoat dong?") after 2+ sessions. If the user accepts the in-app prompt, THEN call `Notification.requestPermission()`.
**Warning signs:** Very low push subscription rate.

### Pitfall 4: SSE Blocking in Single-Threaded Container
**What goes wrong:** Long-running SSE connections can exhaust connection limits in the Node.js server or reverse proxy.
**Why it happens:** Each SSE connection holds an HTTP connection open indefinitely.
**How to avoid:** Set a reasonable timeout (e.g., 30 minutes) after which the server closes the connection and the client reconnects. Configure nginx/proxy `proxy_read_timeout` and `proxy_buffering off` for the SSE endpoint. NestJS Express adapter handles this natively.
**Warning signs:** 502 errors on SSE endpoint, connection drops after ~60 seconds (default proxy timeout).

### Pitfall 5: Notification Grouping Race Condition
**What goes wrong:** Two likes arrive simultaneously for the same post, creating two separate grouped notifications instead of one.
**Why it happens:** BullMQ processes jobs concurrently. Both workers check for existing group, find none, and create new records.
**How to avoid:** Use a unique constraint on `groupKey` column with upsert semantics. Or set `concurrency: 1` on the notification processor (acceptable at v1 scale). Or use a Redis lock per groupKey.
**Warning signs:** Duplicate grouped notifications for the same action.

### Pitfall 6: Push Subscription Expiration
**What goes wrong:** Push subscriptions expire or become invalid over time. Sending to expired endpoints returns 410 Gone.
**Why it happens:** Browsers may revoke push subscriptions when the user clears data, reinstalls the browser, or after extended periods.
**How to avoid:** Handle 410/404 responses from push endpoints by deleting the subscription from the database. Re-subscribe the user on next app visit by checking `registration.pushManager.getSubscription()`.
**Warning signs:** Increasing push delivery failures in logs.

## Code Examples

### Database Schema (Prisma)
```prisma
enum NotificationType {
  LIKE
  COMMENT
  REPLY
  FOLLOW
  MENTION
}

model Notification {
  id          String           @id @default(cuid())
  recipientId String
  recipient   User             @relation("notificationRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  type        NotificationType
  groupKey    String           // e.g., "like:post_abc123" for aggregation
  targetId    String?          // Post ID, Comment ID, or null (for follow)
  targetType  String?          // "post", "comment", or null
  isRead      Boolean          @default(false)
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  actors NotificationActor[]

  @@index([recipientId, isRead, createdAt])
  @@index([groupKey, updatedAt])
  @@map("notifications")
}

model NotificationActor {
  id             String       @id @default(cuid())
  notificationId String
  notification   Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)
  actorId        String
  actor          User         @relation("notificationActor", fields: [actorId], references: [id], onDelete: Cascade)
  createdAt      DateTime     @default(now())

  @@unique([notificationId, actorId])
  @@index([notificationId])
  @@map("notification_actors")
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  p256dh    String   // Public key for push encryption
  auth      String   // Auth secret for push encryption
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("push_subscriptions")
}
```

**User model additions:**
```prisma
model User {
  // ... existing fields ...
  notifications     Notification[]     @relation("notificationRecipient")
  notificationActors NotificationActor[] @relation("notificationActor")
  pushSubscriptions PushSubscription[]
}
```

### SSE Client Hook (Frontend)
```typescript
// hooks/use-sse.ts
import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/notification-store';
import { useQueryClient } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export function useSSE(enabled: boolean) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const incrementUnread = useNotificationStore((s) => s.incrementUnread);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      const es = new EventSource(`${API_URL}/notifications/stream`, {
        withCredentials: true,
      });

      es.onmessage = (event) => {
        const notification = JSON.parse(event.data);
        addNotification(notification);
        incrementUnread();
        // Invalidate notification list query for background refetch
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      };

      es.onerror = () => {
        es.close();
        // Fallback: poll after 30s
        setTimeout(connect, 30000);
      };

      eventSourceRef.current = es;
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [enabled]);
}
```

### Notification Response Type (Shared)
```typescript
// packages/shared/src/types/notification.types.ts
export interface NotificationActor {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface NotificationResponse {
  id: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'mention';
  actors: NotificationActor[];
  actorCount: number;          // Total actors (for "+N nguoi khac")
  targetId: string | null;
  targetType: string | null;
  targetThumbnail: string | null; // Post thumbnail URL if applicable
  message: string;             // Pre-composed Vietnamese text
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Push Notification Registration (Frontend)
```typescript
// hooks/use-push-permission.ts
import { useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function usePushPermission() {
  useEffect(() => {
    const sessionCount = parseInt(localStorage.getItem('figly_sessions') || '0', 10);
    localStorage.setItem('figly_sessions', String(sessionCount + 1));

    // Only prompt after 2+ sessions
    if (sessionCount < 1) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'denied') return;

    const register = async () => {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // User hasn't subscribed yet -- check if we should prompt
        if (Notification.permission === 'default') {
          // Show in-app prompt first, then request browser permission
          // (actual prompt UI handled by component, this hook provides the logic)
          return;
        }
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      // Send subscription to backend
      await apiClient.post('/notifications/push-subscription', {
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!),
      });
    };

    register().catch(console.error);
  }, []);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}
```

### VAPID Configuration (Backend)
```typescript
// backend/src/config/configuration.ts additions:
vapid: {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@figly.app',
},
```

### Manifest.json (PWA)
```json
{
  "name": "Figly",
  "short_name": "Figly",
  "description": "Chia se, khoe va quan ly bo suu tap cua ban",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSocket for all real-time | SSE for notifications, WebSocket only for bidirectional (chat) | Widely adopted 2023+ | Simpler architecture, fewer dependencies, built into NestJS |
| Firebase Cloud Messaging (FCM) | Web Push API + VAPID (no Google dependency) | W3C Push API standardized 2018, widely adopted | No third-party service needed, works with any browser supporting Push API |
| Custom push encryption | web-push library handles RFC 8291 | Stable since web-push 3.x | Eliminates 500+ lines of crypto boilerplate |
| next-pwa package | Manual service worker in public/ | next-pwa maintenance declined 2024 | More control, fewer build issues, no dependency on unmaintained package |

**Deprecated/outdated:**
- `next-pwa`: Poorly maintained, doesn't work well with Next.js 14 App Router. Use manual service worker instead.
- `socket.io` for notifications: Overkill for one-way streams; SSE is simpler and has native browser reconnection.

## Open Questions

1. **Multi-Instance SSE Scaling**
   - What we know: In-memory Subject map works for single instance. If Figly scales to multiple backend instances behind a load balancer, SSE connections are pinned to one instance.
   - What's unclear: When will Figly need multiple instances?
   - Recommendation: Keep in-memory Subjects for v1. Document migration path to Redis Pub/Sub (`ioredis` subscriber per instance) when horizontal scaling is needed. This is a v2 concern.

2. **VAPID Key Generation Timing**
   - What we know: VAPID keys must be generated once and stored permanently. `web-push.generateVAPIDKeys()` creates the pair.
   - What's unclear: Whether to generate during setup script or on first boot.
   - Recommendation: Generate during project setup (CLI command or seed script), store as environment variables. Add generation command to CONTRIBUTING.md.

3. **Post Thumbnail in Notification**
   - What we know: Notifications for likes/comments should show the target post's thumbnail. This requires resolving presigned URLs for post media.
   - What's unclear: Whether to resolve presigned URLs at notification query time (fresh but slower) or at creation time (fast but URLs expire).
   - Recommendation: Resolve at query time using the existing `resolvePresignedUrls` pattern from PostsService. Presigned URLs have short TTLs so pre-resolving is unreliable.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `backend/jest.config.ts` |
| Quick run command | `cd backend && pnpm test -- --testPathPattern=notifications --no-coverage` |
| Full suite command | `cd backend && pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTF-01 | Notification created on like/comment/follow/mention, self-notification skipped, SSE emission | unit | `cd backend && pnpm test -- --testPathPattern=notifications.service.spec -x` | Wave 0 |
| NOTF-01 | BullMQ processor creates and emits notifications | unit | `cd backend && pnpm test -- --testPathPattern=notifications.processor.spec -x` | Wave 0 |
| NOTF-02 | Notification list with cursor pagination, read/unread filtering, mark-as-read | unit | `cd backend && pnpm test -- --testPathPattern=notifications.service.spec -x` | Wave 0 |
| NOTF-02 | Notification grouping/aggregation within 5-min window | unit | `cd backend && pnpm test -- --testPathPattern=notifications.service.spec -x` | Wave 0 |
| NOTF-03 | Push subscription storage, push notification sending, 410 cleanup | unit | `cd backend && pnpm test -- --testPathPattern=push.service.spec -x` | Wave 0 |
| NOTF-03 | Service worker push handler + notification click | manual-only | Manual: verify push in browser DevTools > Application > Service Workers | N/A |

### Sampling Rate
- **Per task commit:** `cd backend && pnpm test -- --testPathPattern=notifications --no-coverage`
- **Per wave merge:** `cd backend && pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/notifications/__tests__/notifications.service.spec.ts` -- covers NOTF-01, NOTF-02
- [ ] `backend/src/notifications/__tests__/notifications.processor.spec.ts` -- covers NOTF-01 BullMQ processing
- [ ] `backend/src/notifications/__tests__/push.service.spec.ts` -- covers NOTF-03 push delivery

## Sources

### Primary (HIGH confidence)
- Project codebase: `backend/src/media/media.module.ts`, `media.processor.ts` -- verified BullMQ queue registration and @Processor worker pattern
- Project codebase: `backend/src/posts/posts.service.ts` -- verified like/comment/bookmark action entry points
- Project codebase: `backend/src/social/social.service.ts` -- verified follow action entry points
- Project codebase: `backend/src/comments/comments.service.ts` -- verified comment creation (mention detection integration point)
- NestJS official docs (training data): SSE via `@Sse()` decorator returning `Observable<MessageEvent>` -- well-established pattern since NestJS v8
- Web Push Protocol (RFC 8030, RFC 8291): VAPID-based push notification standard, `web-push` npm library
- W3C Push API specification: `PushManager.subscribe()`, `ServiceWorkerRegistration.showNotification()`

### Secondary (MEDIUM confidence)
- `web-push` npm library API: `generateVAPIDKeys()`, `setVapidDetails()`, `sendNotification()` -- stable API since v3.x, widely documented
- EventSource Web API: auto-reconnection behavior, `withCredentials` for cookie auth
- Next.js 14 App Router: service workers served from `public/` directory, `manifest.json` linked via `<link rel="manifest">`

### Tertiary (LOW confidence)
- None -- all patterns verified against codebase or well-established standards

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- BullMQ, Prisma, NestJS SSE are established patterns already in the project or well-documented
- Architecture: HIGH -- SSE gateway + BullMQ processor pattern is well-proven; notification schema follows standard social app patterns
- Pitfalls: HIGH -- Based on common production issues with SSE and push notifications documented across multiple sources and my training data
- Push notifications: MEDIUM -- web-push library API and service worker specifics based on training data (stable library, unlikely to have changed)

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable domain, 30-day validity)
