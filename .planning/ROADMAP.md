# Roadmap: Figly

## Overview

Figly delivers an Instagram-like social platform purpose-built for collectors. The roadmap prioritizes foundation and auth first, then builds profiles and social graph, followed by content creation with feed -- before tackling the collection system (the core differentiator) as a dedicated phase. Search, notifications, and moderation complete the social infrastructure. Messaging, stories, and reels arrive last as engagement multipliers once the core collector experience is validated. Ten phases deliver all 41 v1 requirements with collection tracking treated as a first-class citizen alongside social features.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Auth** - Monorepo scaffold, database, media pipeline, and complete authentication system
- [ ] **Phase 2: Profiles & Social Graph** - User profiles, follow/unfollow system, and follower/following lists
- [ ] **Phase 3: Content & Feed** - Photo posts, image editing, interactions (likes/comments/bookmarks), and chronological feed
- [ ] **Phase 4: Collection System** - Shared item database, owned/wishlist tracking, custom checklists, post-to-item linking, and collection showcase
- [ ] **Phase 5: Search & Discovery** - User/hashtag/item search, hashtag pages, and category-based explore page
- [ ] **Phase 6: Notifications** - Real-time in-app notifications, notification history, and push notifications via PWA
- [ ] **Phase 7: Moderation & Safety** - Report, block, mute for users, and admin moderation queue
- [ ] **Phase 8: Direct Messaging** - 1-on-1 DMs, media sharing, read receipts, and group chats
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
- [ ] 01-01-PLAN.md — Monorepo scaffold, Docker Compose, Prisma schema, shared package, test infrastructure
- [ ] 01-02-PLAN.md — Auth backend: email/password, JWT sessions, email verification, password reset, Google + Apple OAuth
- [ ] 01-03-PLAN.md — Frontend auth pages, API client with silent refresh, media upload pipeline (MinIO + BullMQ + Sharp)

### Phase 2: Profiles & Social Graph
**Goal**: Users can set up their identity and build a social network by following other collectors
**Depends on**: Phase 1
**Requirements**: PROF-01, PROF-02, PROF-03, SOCL-01, SOCL-02
**Success Criteria** (what must be TRUE):
  1. User can create and edit a profile with display name, avatar upload, and bio text
  2. User can visit another user's profile and see their post grid
  3. User can follow/unfollow another user and see updated follower/following counts immediately
  4. User can view the full list of their followers and the users they follow
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

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
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

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
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD
- [ ] 04-03: TBD

### Phase 5: Search & Discovery
**Goal**: Users can find other collectors, discover content by hashtag, and explore posts organized by collection category
**Depends on**: Phase 4
**Requirements**: DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. User can search for users, hashtags, and collection items from a single search interface and see relevant results
  2. User can tap a hashtag anywhere in the app and see an aggregated page of all posts using that hashtag
  3. User can browse an explore page with content curated and organized by collection category
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Notifications
**Goal**: Users are informed in real-time about activity relevant to them (likes, comments, follows, mentions) and can receive push notifications
**Depends on**: Phase 5
**Requirements**: NOTF-01, NOTF-02, NOTF-03
**Success Criteria** (what must be TRUE):
  1. User receives in-app notifications instantly when someone likes, comments on, follows, or mentions them
  2. User can view a notification history screen with clear read/unread visual state
  3. User receives push notifications via PWA service worker even when the browser tab is not active
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

### Phase 7: Moderation & Safety
**Goal**: Users can protect themselves from unwanted interactions, and admins can act on reported content to keep the community safe
**Depends on**: Phase 6
**Requirements**: MODR-01, MODR-02, MODR-03, MODR-04
**Success Criteria** (what must be TRUE):
  1. User can report a post or user with a reason, and the report appears in the admin queue
  2. User can block another user, which hides all their content and prevents any interaction in both directions
  3. User can mute another user, which removes their content from feed without unfollowing
  4. Admin can view a queue of reported content/users and take action (dismiss, warn, remove content, ban user)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD
- [ ] 07-02: TBD

### Phase 8: Direct Messaging
**Goal**: Users can communicate privately through 1-on-1 and group conversations with real-time delivery
**Depends on**: Phase 7
**Requirements**: MESG-01, MESG-02, MESG-03, MESG-04
**Success Criteria** (what must be TRUE):
  1. User can start a 1-on-1 conversation with another user and send/receive text messages in real-time
  2. User can share photos and videos within DM conversations
  3. User can see when their messages have been read by the recipient
  4. User can participate in group chats organized by collection category or interest
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

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
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 0/3 | Planning complete | - |
| 2. Profiles & Social Graph | 0/2 | Not started | - |
| 3. Content & Feed | 0/3 | Not started | - |
| 4. Collection System | 0/3 | Not started | - |
| 5. Search & Discovery | 0/2 | Not started | - |
| 6. Notifications | 0/2 | Not started | - |
| 7. Moderation & Safety | 0/2 | Not started | - |
| 8. Direct Messaging | 0/2 | Not started | - |
| 9. Stories | 0/1 | Not started | - |
| 10. Reels | 0/1 | Not started | - |
