# Roadmap: Figly

## Overview

Figly delivers an Instagram-like social platform purpose-built for collectors. The roadmap prioritizes foundation and auth first, then builds profiles and social graph, followed by content creation with feed -- before tackling the collection system (the core differentiator) as a dedicated phase. Search, notifications, and moderation complete the social infrastructure. Messaging, stories, and reels arrive last as engagement multipliers once the core collector experience is validated. Ten phases deliver all 41 v1 requirements with collection tracking treated as a first-class citizen alongside social features.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Auth** - Monorepo scaffold, database, media pipeline, and complete authentication system (completed 2026-03-13)
- [x] **Phase 2: Profiles & Social Graph** - User profiles, follow/unfollow system, and follower/following lists (completed 2026-03-13)
- [x] **Phase 3: Content & Feed** - Photo posts, image editing, interactions (likes/comments/bookmarks), and chronological feed (completed 2026-03-14)
- [x] **Phase 3.1: Public Viewing Mode** - Public viewing mode for non-authenticated users (INSERTED) (completed 2026-03-14)
- [x] **Phase 4: Collection System** - Shared item database, owned/wishlist tracking, custom checklists, post-to-item linking, and collection showcase (completed 2026-03-15)
- [x] **Phase 5: Search & Discovery** - User/hashtag/item search, hashtag pages, and category-based explore page (completed 2026-03-15)
- [x] **Phase 6: Notifications** - Real-time in-app notifications, notification history, and push notifications via PWA (completed 2026-03-15)
- [x] **Phase 7: Moderation & Safety** - Report, block, mute for users, and admin moderation queue (completed 2026-03-15)
- [ ] **Phase 7.1: Docker Split** - Split figly-app into figly-frontend + figly-backend containers (INSERTED)
- [ ] **Phase 8: Direct Messaging** - 1-on-1 DMs, media sharing, read receipts, and group chats (gap closure in progress)
- [ ] **Phase 9: Stories** - 24h ephemeral photo/video content with followed-user story feed
- [ ] **Phase 10: Reels** - Short-form video upload and vertical scroll browsing feed

## Phase Details

### Phase 1: Foundation & Auth
**Goal**: Users can securely create accounts, authenticate, and the entire infrastructure (monorepo, database, media pipeline) is operational for all subsequent phases
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. User can sign up with email/password and receive a verification email before gaining full access
  2. User can log in with Google or Apple and have their session persist across browser refreshes without re-login
  3. User can reset a forgotten password by receiving an email link and setting a new password
  4. The monorepo builds and runs locally with Next.js frontend communicating with NestJS backend against a real PostgreSQL database
  5. A file uploaded through the media endpoint is processed asynchronously and retrievable via CDN URL
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Monorepo scaffold, Docker Compose, Prisma schema, shared package, test infrastructure
- [x] 01-02-PLAN.md — Auth backend: email/password, JWT sessions, email verification, password reset, Google + Apple OAuth
- [x] 01-03-PLAN.md — Frontend auth pages, API client with silent refresh, media upload pipeline (MinIO + BullMQ + Sharp)

### Phase 2: Profiles & Social Graph
**Goal**: Users can set up their identity and build a social network by following other collectors
**Depends on**: Phase 1
**Requirements**: PROF-01, PROF-02, PROF-03, SOCL-01, SOCL-02
**Success Criteria** (what must be TRUE):
  1. User can create and edit a profile with display name, avatar upload, and bio text
  2. User can visit another user's profile and see their post grid
  3. User can follow/unfollow another user and see updated follower/following counts immediately
  4. User can view the full list of their followers and the users they follow
**Plans**: 4 plans

Plans:
- [x] 02-01-PLAN.md — Schema extension (username, bio, avatar, Follow model), shared types/validators, signup username support
- [x] 02-02-PLAN.md — Backend: Profiles and Social NestJS modules with full test coverage
- [x] 02-03-PLAN.md — Frontend: Profile page at /[username] with Instagram-style header, edit profile modal, signup username field, complete-profile interstitial for OAuth users
- [x] 02-04-PLAN.md — Frontend: Follow/unfollow button with optimistic UI, follower and following list pages with search filter and cursor pagination

### Phase 3: Content & Feed
**Goal**: Users can create photo posts, interact with content (like, comment, save), and browse a chronological feed of posts from people they follow
**Depends on**: Phase 2
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, INTR-01, INTR-02, INTR-03, INTR-04, INTR-05, SOCL-03
**Success Criteria** (what must be TRUE):
  1. User can create a single-image or multi-image carousel post (up to 10 images) with caption, hashtags, and @mentions
  2. User can crop and rotate images before publishing a post
  3. User can edit captions and delete their own posts
  4. User can like/unlike posts, write comments, and reply to comments in threads
  5. User can bookmark posts and view all saved posts in a dedicated collection
  6. User can scroll a chronological feed showing posts from users they follow
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — Prisma schema extension (Post, PostMedia, Like, Comment, Bookmark, Hashtag models) and shared DTOs/types/constants
- [x] 03-02-PLAN.md — Backend: Posts, Comments, and Feed NestJS modules with like/bookmark/hashtag support and full test coverage
- [x] 03-03-PLAN.md — Frontend: Instagram-style multi-step post creation flow with react-easy-crop image editing and bottom navigation
- [x] 03-04-PLAN.md — Frontend: Chronological feed with infinite scroll, post detail modal, comment threading, interactions with optimistic UI, saved posts page

### Phase 03.1: Public Viewing Mode (INSERTED)

**Goal:** Non-authenticated users can view public content (profiles, posts, feeds) in read-only mode with login CTAs for interactive features, enabling social sharing and organic user acquisition
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04, PUB-05, PUB-06
**Depends on:** Phase 3
**Success Criteria** (what must be TRUE):
  1. Non-authenticated user can visit any profile page and see the profile with post grid
  2. Non-authenticated user can view any post with its comments
  3. Non-authenticated user can browse a public discovery feed of recent posts
  4. Interactive elements (like, bookmark, comment, follow) redirect to login for non-authenticated users
  5. Authenticated users see full interactive UI on all pages (no regression)
  6. Auth-only routes (personal feed, saved posts) still require login
**Plans**: 2 plans

Plans:
- [x] 03.1-01-PLAN.md — Backend: OptionalJwtAuthGuard, refactor read endpoints for optional auth, public feed endpoint
- [x] 03.1-02-PLAN.md — Frontend: (public) route group, page migration, auth-aware components, explore page

### Phase 4: Collection System
**Goal**: Users can browse a shared item database, track what they own and want, build custom checklists, link posts to collection items, and showcase collections on their profile
**Depends on**: Phase 3
**Requirements**: COLL-01, COLL-02, COLL-03, COLL-04, COLL-05, COLL-06, COLL-07, CONT-07, PROF-04, SOCL-04
**Success Criteria** (what must be TRUE):
  1. User can browse the shared item database by category (Gundam, figurines, sneakers, etc.) and search for specific items
  2. User can mark any database item as "owned" or "wishlist" and see those statuses reflected across the app
  3. User can create named custom checklists, add database items or freeform entries, and see progress (X/Y complete)
  4. User can link a post to one or more items from the collection database when creating or editing a post
  5. User's profile has a collection showcase tab displaying their owned items organized by category
  6. User can follow specific collection series or categories and see related content
**Plans**: 6 plans

Plans:
- [x] 04-01-PLAN.md — Prisma schema extension (10 collection models), shared types/DTOs/constants, seed data script
- [x] 04-02-PLAN.md — Backend: CollectionModule (browse, search, owned/wishlist, follow)
- [x] 04-03-PLAN.md — Backend: ChecklistModule (CRUD, entries, progress) + PostsModule item linking + shared PostResponse extension
- [x] 04-04-PLAN.md — Frontend: Collection browsing pages (categories, series, items), item detail, search, owned/wishlist toggle, bottom nav
- [x] 04-05-PLAN.md — Frontend: Checklists (CRUD, entries, progress), profile collection tab, follow series/categories
- [x] 04-06-PLAN.md — Frontend: ItemPicker component, post-to-item linking in create post flow, linked items on post display

### Phase 5: Search & Discovery
**Goal**: Users can find other collectors, discover content by hashtag, and explore posts organized by collection category
**Depends on**: Phase 4
**Requirements**: DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. User can search for users, hashtags, and collection items from a single search interface and see relevant results
  2. User can tap a hashtag anywhere in the app and see an aggregated page of all posts using that hashtag
  3. User can browse an explore page with content curated and organized by collection category
**Plans**: 2 plans

Plans:
- [x] 05-01-PLAN.md — Backend: SearchModule (unified search delegation), hashtag posts endpoint, category-curated explore feed endpoint
- [x] 05-02-PLAN.md — Frontend: Unified search page with tabbed results, hashtag aggregation page, enhanced explore page with category sections

### Phase 6: Notifications
**Goal**: Users are informed in real-time about activity relevant to them (likes, comments, follows, mentions) and can receive push notifications
**Depends on**: Phase 5
**Requirements**: NOTF-01, NOTF-02, NOTF-03
**Success Criteria** (what must be TRUE):
  1. User receives in-app notifications instantly when someone likes, comments on, follows, or mentions them
  2. User can view a notification history screen with clear read/unread visual state
  3. User receives push notifications via PWA service worker even when the browser tab is not active
**Plans**: 2 plans

Plans:
- [x] 06-01-PLAN.md — Backend: Prisma schema (Notification, NotificationActor, PushSubscription), NotificationsModule with SSE gateway, BullMQ processor, push service, notification triggers in PostsService/CommentsService/SocialService
- [x] 06-02-PLAN.md — Frontend: SSE connection hook, notification store, notification bell with badge, notification history page with grouped items and auto-read, PWA manifest, service worker, push permission flow

### Phase 7: Moderation & Safety
**Goal**: Users can protect themselves from unwanted interactions, and admins can act on reported content to keep the community safe
**Depends on**: Phase 6
**Requirements**: MODR-01, MODR-02, MODR-03, MODR-04
**Success Criteria** (what must be TRUE):
  1. User can report a post or user with a reason, and the report appears in the admin queue
  2. User can block another user, which hides all their content and prevents any interaction in both directions
  3. User can mute another user, which removes their content from feed without unfollowing
  4. Admin can view a queue of reported content/users and take action (dismiss, warn, remove content, ban user)
**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md — Backend: Prisma schema (Report, Block, Mute models, UserRole enum, ban fields), ModerationModule + AdminModule, block/mute filter integration into all existing services, ban check in all auth paths
- [x] 07-02-PLAN.md — Frontend: Report dialog, block/mute in three-dot menus, admin moderation queue page, settings pages for blocked/muted user management

### Phase 07.1: Docker Split: Tách figly-app thành 2 container riêng (figly-frontend + figly-backend) (INSERTED)

**Goal:** Tách single Docker container (figly-app) thành 2 container riêng: figly-frontend (Next.js standalone) và figly-backend (NestJS), cả hai vẫn trong cùng docker-compose.yml
**Requirements**: INFRA
**Depends on:** Phase 7
**Success Criteria** (what must be TRUE):
  1. Frontend chạy trong container figly-frontend với Next.js standalone output trên port 3000
  2. Backend chạy trong container figly-backend với NestJS trên port 4000, tự chạy Prisma migrate/seed khi startup
  3. docker-compose.yml có 2 service frontend + backend thay vì 1 service app
  4. Cả 2 container có thể giao tiếp với nhau và với postgres/redis/minio
  5. docker compose build && docker compose up chạy thành công
**Plans:** 1/1 plans complete

Plans:
- [ ] 07.1-01-PLAN.md — Remove legacy Dockerfile, validate Docker split end-to-end (build + up + verify all services)

### Phase 8: Direct Messaging
**Goal**: Users can communicate privately through 1-on-1 and group conversations with real-time delivery
**Depends on**: Phase 7
**Requirements**: MESG-01, MESG-02, MESG-03, MESG-04
**Success Criteria** (what must be TRUE):
  1. User can start a 1-on-1 conversation with another user and send/receive text messages in real-time
  2. User can see when their messages have been read by the recipient
  3. User can share photos and videos within DM conversations
  4. User can participate in group chats organized by collection category or interest
**Plans**: 3 plans

Plans:
- [x] 08-01-PLAN.md — Backend: Prisma schema (Conversation, Message, MessageMedia models), shared types/DTOs/constants, MessagingModule with Socket.IO WebSocket gateway, conversations REST API, block enforcement
- [x] 08-02-PLAN.md — Frontend: Socket.IO connection hook, messaging store, conversation list page, chat view with real-time delivery, media sharing, read receipts, new conversation/group dialogs, header DM icon with unread badge
- [x] 08-03-PLAN.md — Gap closure: Fix WebSocket new_message payload shape mismatch between backend emit and frontend handler

### Phase 9: Stories
**Goal**: Users can share ephemeral photo/video moments that disappear after 24 hours, creating a sense of immediacy and daily engagement
**Depends on**: Phase 8
**Requirements**: CONT-08, CONT-09
**Success Criteria** (what must be TRUE):
  1. User can post a story (photo or short video) that is visible for 24 hours and then automatically removed
  2. User can view stories from users they follow in a horizontal scroll bar at the top of their feed, with visual indicators for unviewed stories
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Reels
**Goal**: Users can create and consume short-form video content in a dedicated vertical scroll experience
**Depends on**: Phase 9
**Requirements**: CONT-10, CONT-11
**Success Criteria** (what must be TRUE):
  1. User can upload a short-form video that is transcoded and playable as a reel
  2. User can browse reels in a dedicated full-screen vertical scroll feed with auto-play behavior
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 3.1 -> 4 -> 5 -> 6 -> 7 -> 7.1 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 3/3 | Complete | 2026-03-13 |
| 2. Profiles & Social Graph | 4/4 | Complete | 2026-03-13 |
| 3. Content & Feed | 4/4 | Complete | 2026-03-14 |
| 3.1 Public Viewing Mode | 2/2 | Complete | 2026-03-14 |
| 4. Collection System | 6/6 | Complete | 2026-03-15 |
| 5. Search & Discovery | 2/2 | Complete | 2026-03-15 |
| 6. Notifications | 2/2 | Complete | 2026-03-15 |
| 7. Moderation & Safety | 2/2 | Complete | 2026-03-15 |
| 7.1 Docker Split | 0/1 | In progress | - |
| 8. Direct Messaging | 3/3 | Complete | 2026-03-16 |
| 9. Stories | 0/1 | Not started | - |
| 10. Reels | 0/1 | Not started | - |
