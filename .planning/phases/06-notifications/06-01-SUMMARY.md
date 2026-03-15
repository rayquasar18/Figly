---
phase: 06-notifications
plan: 01
subsystem: api
tags: [nestjs, bullmq, sse, web-push, prisma, notifications, real-time]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    provides: JwtAuthGuard, PrismaService, BullMQ root config
  - phase: 02-profiles-social-graph
    provides: SocialService.follow, User model with avatar
  - phase: 03-content-feed
    provides: PostsService.toggleLike, CommentsService.createComment, MediaModule StorageService
provides:
  - NotificationsModule with BullMQ async processing
  - SSE real-time notification gateway
  - Notification REST API (list, unread-count, mark-read, mark-all-read)
  - Push notification service with web-push VAPID
  - Notification triggers in PostsService, CommentsService, SocialService
  - Notification, NotificationActor, PushSubscription Prisma models
  - Shared notification types and constants
affects: [06-02-notifications-frontend, messaging]

# Tech tracking
tech-stack:
  added: [web-push, @types/web-push]
  patterns: [SSE per-user Subject map, BullMQ notification queue, notification grouping with 5-min window, Vietnamese notification messages]

key-files:
  created:
    - backend/src/notifications/notifications.module.ts
    - backend/src/notifications/notifications.service.ts
    - backend/src/notifications/notifications.processor.ts
    - backend/src/notifications/notifications.gateway.ts
    - backend/src/notifications/notifications.controller.ts
    - backend/src/notifications/push/push.service.ts
    - backend/src/notifications/push/push-subscription.dto.ts
    - backend/src/notifications/dto/notification-response.dto.ts
    - packages/shared/src/types/notification.types.ts
    - packages/shared/src/constants/notification.constants.ts
    - backend/src/notifications/__tests__/notifications.service.spec.ts
    - backend/src/notifications/__tests__/notifications.processor.spec.ts
    - backend/src/notifications/__tests__/push.service.spec.ts
  modified:
    - backend/prisma/schema.prisma
    - backend/src/app.module.ts
    - backend/src/config/configuration.ts
    - backend/src/posts/posts.service.ts
    - backend/src/posts/posts.module.ts
    - backend/src/comments/comments.service.ts
    - backend/src/comments/comments.module.ts
    - backend/src/social/social.service.ts
    - backend/src/social/social.module.ts
    - packages/shared/src/index.ts

key-decisions:
  - "NotificationsGateway as injectable service with per-user Subject map (not WebSocket gateway) for SSE"
  - "Notification grouping via groupKey pattern (type:targetId) with 5-min window"
  - "Vietnamese notification messages composed in service with actor count-aware text"
  - "Push service graceful degradation when VAPID keys not configured"
  - "BullModule.registerQueue added to PostsModule, CommentsModule, SocialModule for notification enqueuing"

patterns-established:
  - "SSE per-user Subject map pattern: NotificationsGateway manages Map<string, Subject<MessageEvent>>"
  - "Notification grouping: findGroupableNotification checks groupKey + 5-min window before creating"
  - "Notification triggers: InjectQueue('notification') + queue.add in service methods"
  - "Push 410 cleanup: sendNotification catch deletes expired subscriptions"

requirements-completed: [NOTF-01, NOTF-02, NOTF-03]

# Metrics
duration: 21min
completed: 2026-03-15
---

# Phase 6 Plan 1: Notification Backend Infrastructure Summary

**Complete NotificationsModule with BullMQ processor, SSE gateway, push service, and notification triggers wired into PostsService (like), CommentsService (comment/reply/mention), and SocialService (follow)**

## Performance

- **Duration:** 21 min
- **Started:** 2026-03-15T03:19:41Z
- **Completed:** 2026-03-15T03:41:00Z
- **Tasks:** 2
- **Files modified:** 28

## Accomplishments
- Prisma schema extended with Notification, NotificationActor, PushSubscription models with proper indexes
- NotificationsService with CRUD, 5-minute grouping window, mark-read, Vietnamese message composition
- SSE real-time gateway with per-user Subject map for instant notification delivery
- BullMQ processor with self-notification guard and automatic grouping logic
- Push notification service with web-push VAPID and expired subscription cleanup (410/404)
- Notification triggers wired into PostsService.toggleLike, CommentsService.createComment, SocialService.follow
- @mention detection in comments with username-to-userId resolution
- 29 notification-specific tests + 258 total backend unit tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema, shared types, and NotificationsModule with service + tests** - `bbce2fd` (feat)
2. **Task 2: BullMQ processor, push service, notification triggers in existing services** - `f316bb6` (feat)

## Files Created/Modified

### Created
- `backend/src/notifications/notifications.module.ts` - Module wiring BullMQ queue, MediaModule, all providers
- `backend/src/notifications/notifications.service.ts` - Notification CRUD, grouping, mark-read, Vietnamese messages
- `backend/src/notifications/notifications.processor.ts` - BullMQ worker with self-notification guard, grouping
- `backend/src/notifications/notifications.gateway.ts` - SSE per-user Subject map
- `backend/src/notifications/notifications.controller.ts` - SSE stream + REST endpoints
- `backend/src/notifications/push/push.service.ts` - web-push VAPID wrapper with 410 cleanup
- `backend/src/notifications/push/push-subscription.dto.ts` - Validation DTOs for push subscriptions
- `backend/src/notifications/dto/notification-response.dto.ts` - NotificationJobData type
- `packages/shared/src/types/notification.types.ts` - NotificationResponse, UnreadCountResponse types
- `packages/shared/src/constants/notification.constants.ts` - NOTIFICATION_LIMITS constants
- `backend/src/notifications/__tests__/notifications.service.spec.ts` - 19 service unit tests
- `backend/src/notifications/__tests__/notifications.processor.spec.ts` - 5 processor unit tests
- `backend/src/notifications/__tests__/push.service.spec.ts` - 5 push service unit tests

### Modified
- `backend/prisma/schema.prisma` - Added NotificationType enum, Notification/NotificationActor/PushSubscription models, User relations
- `backend/src/app.module.ts` - Import NotificationsModule
- `backend/src/config/configuration.ts` - Added VAPID config block
- `backend/src/posts/posts.service.ts` - Added notification queue injection and like notification trigger
- `backend/src/posts/posts.module.ts` - Added BullModule.registerQueue for notification
- `backend/src/comments/comments.service.ts` - Added notification queue injection, comment/reply/mention triggers
- `backend/src/comments/comments.module.ts` - Added BullModule.registerQueue for notification
- `backend/src/social/social.service.ts` - Added notification queue injection and follow trigger
- `backend/src/social/social.module.ts` - Added BullModule.registerQueue for notification
- `packages/shared/src/index.ts` - Export notification types and constants

## Decisions Made
- NotificationsGateway as injectable service with per-user Subject map (not WebSocket gateway) for SSE simplicity
- Notification grouping via groupKey pattern (type:targetId) with 5-min window (NOTIFICATION_LIMITS.groupWindowMs)
- Vietnamese notification messages composed in service with actor count-aware text (1, 2, 3+ actors)
- Push service graceful degradation when VAPID keys not configured (logs warning, disables push)
- BullModule.registerQueue added to PostsModule, CommentsModule, SocialModule for direct notification enqueuing
- @mention detection uses /@(\w+)/g regex with batch username resolution and deduplication

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed existing test suites missing BullQueue_notification mock**
- **Found during:** Task 2 (wiring notification triggers)
- **Issue:** Adding @InjectQueue('notification') to PostsService, CommentsService, SocialService broke their existing test suites which didn't provide the BullQueue mock
- **Fix:** Added `{ provide: getQueueToken('notification'), useValue: mockNotificationQueue }` to all affected test files (posts.service.spec.ts, hashtag-posts.spec.ts, public-access.spec.ts, comments.service.spec.ts, social.service.spec.ts)
- **Files modified:** 5 existing test files
- **Verification:** Full test suite 258 tests passing
- **Committed in:** f316bb6 (Task 2 commit)

**2. [Rule 1 - Bug] Fixed TypeScript type error in NotificationsService.getNotifications**
- **Found during:** Task 2 (full test suite run)
- **Issue:** `limit` parameter default value from `NOTIFICATION_LIMITS.pageSize` (const literal type `20`) incompatible with `number | undefined` passed from controller
- **Fix:** Explicitly typed parameter as `limit: number = NOTIFICATION_LIMITS.pageSize`
- **Files modified:** backend/src/notifications/notifications.service.ts
- **Verification:** E2E compilation passes, all tests green
- **Committed in:** f316bb6 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for test suite and compilation correctness. No scope creep.

## Issues Encountered
- Database not running locally (prisma db push fails with P1001) - Prisma client generated successfully without push, tests use mocks
- E2E test (auth-e2e.spec.ts) fails due to missing DB/Redis infrastructure - pre-existing condition, unrelated to notification changes

## User Setup Required
None - no external service configuration required. VAPID keys are optional with graceful degradation.

## Next Phase Readiness
- Full notification backend infrastructure ready for frontend integration (Phase 06-02)
- SSE stream endpoint at GET /notifications/stream
- REST API for notification list, unread-count, mark-read, mark-all-read
- Push subscription management endpoints ready
- All social action services wired to emit notification jobs

---
*Phase: 06-notifications*
*Completed: 2026-03-15*
