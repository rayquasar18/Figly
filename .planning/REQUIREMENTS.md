# Requirements: Figly

**Defined:** 2026-03-13
**Core Value:** Người sưu tập có thể chia sẻ, khoe và quản lý bộ sưu tập trong cộng đồng cùng đam mê — kết hợp social media với collection tracking.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: User can reset password via email link
- [ ] **AUTH-04**: User session persists across browser refresh
- [ ] **AUTH-05**: User can log in with Google OAuth
- [ ] **AUTH-06**: User can log in with Apple Sign-In

### Profiles

- [ ] **PROF-01**: User can create profile with display name and avatar
- [ ] **PROF-02**: User can write and edit bio
- [ ] **PROF-03**: User can view other users' profiles with post grid
- [ ] **PROF-04**: User profile has collection showcase tab showing owned items

### Content

- [ ] **CONT-01**: User can create single-image post with caption
- [ ] **CONT-02**: User can create multi-image carousel post (up to 10 images)
- [ ] **CONT-03**: User can crop and rotate images before posting
- [ ] **CONT-04**: User can edit own post captions
- [ ] **CONT-05**: User can delete own posts
- [ ] **CONT-06**: User can include hashtags and @mentions in captions
- [ ] **CONT-07**: User can link post to item(s) from the collection database
- [ ] **CONT-08**: User can post stories (24h ephemeral photo/video content)
- [ ] **CONT-09**: User can view stories from followed users
- [ ] **CONT-10**: User can upload and post short-form video (reels)
- [ ] **CONT-11**: User can browse reels in dedicated vertical scroll feed

### Interactions

- [ ] **INTR-01**: User can like/unlike posts
- [ ] **INTR-02**: User can comment on posts
- [ ] **INTR-03**: User can reply to comments (threaded)
- [ ] **INTR-04**: User can bookmark/save posts
- [ ] **INTR-05**: User can view saved posts collection

### Social

- [ ] **SOCL-01**: User can follow/unfollow other users
- [ ] **SOCL-02**: User can view followers and following lists
- [ ] **SOCL-03**: User can view chronological feed of posts from followed users
- [ ] **SOCL-04**: User can follow collection series/categories

### Discovery

- [ ] **DISC-01**: User can search for users, hashtags, and items
- [ ] **DISC-02**: User can view hashtag pages with aggregated posts
- [ ] **DISC-03**: User can browse explore page curated by collection category

### Collection

- [ ] **COLL-01**: User can browse shared item database by category (Gundam, figurines, sneakers, etc.)
- [ ] **COLL-02**: User can search items in the database
- [ ] **COLL-03**: User can mark items as "owned"
- [ ] **COLL-04**: User can mark items as "wishlist"
- [ ] **COLL-05**: User can create custom checklists with custom names
- [ ] **COLL-06**: User can add database items or freeform entries to custom checklists
- [ ] **COLL-07**: User can track checklist progress (X/Y complete)

### Messaging

- [ ] **MESG-01**: User can send and receive direct messages (1-on-1)
- [ ] **MESG-02**: User can share media in DMs
- [ ] **MESG-03**: User can see message read status
- [ ] **MESG-04**: User can participate in group chats by category/interest

### Notifications

- [ ] **NOTF-01**: User receives in-app notifications for likes, comments, follows, mentions
- [ ] **NOTF-02**: User can view notification history with read/unread state
- [ ] **NOTF-03**: User receives push notifications via PWA/service worker

### Moderation

- [ ] **MODR-01**: User can report posts or users
- [ ] **MODR-02**: User can block other users
- [ ] **MODR-03**: User can mute other users
- [ ] **MODR-04**: Admin can view and act on reported content queue

## v2 Requirements

### Collection Enhanced

- **COLL-V2-01**: Item pages with community photos, ratings, and discussion
- **COLL-V2-02**: Collection statistics with progress bars and completion % per series
- **COLL-V2-03**: Item release calendar with notifications
- **COLL-V2-04**: Collection sharing cards (shareable images with stats)
- **COLL-V2-05**: Community-submitted database entries with admin approval

### Social Enhanced

- **SOCL-V2-01**: Algorithmic feed based on engagement data
- **SOCL-V2-02**: Story highlights (persistent collections of past stories)

### Platform

- **PLAT-V2-01**: Full PWA experience with offline support
- **PLAT-V2-02**: Interactive story elements (polls, questions)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Built-in marketplace / e-commerce | Massive regulatory burden (payments, disputes, fraud). "For Sale" status + external links instead |
| Native mobile app | Web-first. PWA covers mobile needs. Revisit after web validation |
| AI-powered recommendations | Insufficient data at launch. Simple co-occurrence ("collectors who own X also own Y") instead |
| Full video editing suite | Not core to collection tracking. Users edit externally and upload |
| NFT / digital collectibles | Controversial, market crashed, alienates users |
| Auction system | Full auction logic is an entire product. Use DMs for offers |
| Price tracking / market value | Complex data sourcing. Link to PriceCharting externally |
| Real-time typing indicators | Marginal value vs infrastructure cost |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| AUTH-06 | — | Pending |
| PROF-01 | — | Pending |
| PROF-02 | — | Pending |
| PROF-03 | — | Pending |
| PROF-04 | — | Pending |
| CONT-01 | — | Pending |
| CONT-02 | — | Pending |
| CONT-03 | — | Pending |
| CONT-04 | — | Pending |
| CONT-05 | — | Pending |
| CONT-06 | — | Pending |
| CONT-07 | — | Pending |
| CONT-08 | — | Pending |
| CONT-09 | — | Pending |
| CONT-10 | — | Pending |
| CONT-11 | — | Pending |
| INTR-01 | — | Pending |
| INTR-02 | — | Pending |
| INTR-03 | — | Pending |
| INTR-04 | — | Pending |
| INTR-05 | — | Pending |
| SOCL-01 | — | Pending |
| SOCL-02 | — | Pending |
| SOCL-03 | — | Pending |
| SOCL-04 | — | Pending |
| DISC-01 | — | Pending |
| DISC-02 | — | Pending |
| DISC-03 | — | Pending |
| COLL-01 | — | Pending |
| COLL-02 | — | Pending |
| COLL-03 | — | Pending |
| COLL-04 | — | Pending |
| COLL-05 | — | Pending |
| COLL-06 | — | Pending |
| COLL-07 | — | Pending |
| MESG-01 | — | Pending |
| MESG-02 | — | Pending |
| MESG-03 | — | Pending |
| MESG-04 | — | Pending |
| NOTF-01 | — | Pending |
| NOTF-02 | — | Pending |
| NOTF-03 | — | Pending |
| MODR-01 | — | Pending |
| MODR-02 | — | Pending |
| MODR-03 | — | Pending |
| MODR-04 | — | Pending |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 0
- Unmapped: 41 ⚠️

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after initial definition*
