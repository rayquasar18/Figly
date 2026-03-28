# Requirements: Figly

**Defined:** 2026-03-13
**Core Value:** Nguoi suu tap co the chia se, khoe va quan ly bo suu tap trong cong dong cung dam me -- ket hop social media voi collection tracking.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User receives email verification after signup
- [x] **AUTH-03**: User can reset password via email link
- [x] **AUTH-04**: User session persists across browser refresh
- [x] **AUTH-05**: User can log in with Google OAuth
- [x] **AUTH-06**: User can log in with Apple Sign-In

### Profiles

- [x] **PROF-01**: User can create profile with display name and avatar
- [x] **PROF-02**: User can write and edit bio
- [x] **PROF-03**: User can view other users' profiles with post grid
- [x] **PROF-04**: User profile has collection showcase tab showing owned items

### Content

- [x] **CONT-01**: User can create single-image post with caption
- [x] **CONT-02**: User can create multi-image carousel post (up to 10 images)
- [x] **CONT-03**: User can crop and rotate images before posting
- [x] **CONT-04**: User can edit own post captions
- [x] **CONT-05**: User can delete own posts
- [x] **CONT-06**: User can include hashtags and @mentions in captions
- [x] **CONT-07**: User can link post to item(s) from the collection database
- [x] **CONT-08**: User can post stories (24h ephemeral photo/video content)
- [x] **CONT-09**: User can view stories from followed users
- [ ] **CONT-10**: User can upload and post short-form video (reels)
- [ ] **CONT-11**: User can browse reels in dedicated vertical scroll feed

### Interactions

- [x] **INTR-01**: User can like/unlike posts
- [x] **INTR-02**: User can comment on posts
- [x] **INTR-03**: User can reply to comments (threaded)
- [x] **INTR-04**: User can bookmark/save posts
- [x] **INTR-05**: User can view saved posts collection

### Social

- [x] **SOCL-01**: User can follow/unfollow other users
- [x] **SOCL-02**: User can view followers and following lists
- [x] **SOCL-03**: User can view chronological feed of posts from followed users
- [x] **SOCL-04**: User can follow collection series/categories

### Discovery

- [x] **DISC-01**: User can search for users, hashtags, and items
- [x] **DISC-02**: User can view hashtag pages with aggregated posts
- [x] **DISC-03**: User can browse explore page curated by collection category

### Collection

- [x] **COLL-01**: User can browse shared item database by category (Gundam, figurines, sneakers, etc.)
- [x] **COLL-02**: User can search items in the database
- [x] **COLL-03**: User can mark items as "owned"
- [x] **COLL-04**: User can mark items as "wishlist"
- [x] **COLL-05**: User can create custom checklists with custom names
- [x] **COLL-06**: User can add database items or freeform entries to custom checklists
- [x] **COLL-07**: User can track checklist progress (X/Y complete)

### Messaging

- [x] **MESG-01**: User can send and receive direct messages (1-on-1)
- [x] **MESG-02**: User can share media in DMs
- [x] **MESG-03**: User can see message read status
- [x] **MESG-04**: User can participate in group chats by category/interest

### Notifications

- [x] **NOTF-01**: User receives in-app notifications for likes, comments, follows, mentions
- [x] **NOTF-02**: User can view notification history with read/unread state
- [x] **NOTF-03**: User receives push notifications via PWA/service worker

### Moderation

- [x] **MODR-01**: User can report posts or users
- [x] **MODR-02**: User can block other users
- [x] **MODR-03**: User can mute other users
- [x] **MODR-04**: Admin can view and act on reported content queue

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
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| PROF-01 | Phase 2 | Complete |
| PROF-02 | Phase 2 | Complete |
| PROF-03 | Phase 2 | Complete |
| PROF-04 | Phase 4 | Complete |
| CONT-01 | Phase 3 | Complete |
| CONT-02 | Phase 3 | Complete |
| CONT-03 | Phase 3 | Complete |
| CONT-04 | Phase 3 | Complete |
| CONT-05 | Phase 3 | Complete |
| CONT-06 | Phase 3 | Complete |
| CONT-07 | Phase 4 | Complete |
| CONT-08 | Phase 9 | Complete |
| CONT-09 | Phase 9 | Complete |
| CONT-10 | Phase 10 | Pending |
| CONT-11 | Phase 10 | Pending |
| INTR-01 | Phase 3 | Complete |
| INTR-02 | Phase 3 | Complete |
| INTR-03 | Phase 3 | Complete |
| INTR-04 | Phase 3 | Complete |
| INTR-05 | Phase 3 | Complete |
| SOCL-01 | Phase 2 | Complete |
| SOCL-02 | Phase 2 | Complete |
| SOCL-03 | Phase 3 | Complete |
| SOCL-04 | Phase 4 | Complete |
| DISC-01 | Phase 5 | Complete |
| DISC-02 | Phase 5 | Complete |
| DISC-03 | Phase 5 | Complete |
| COLL-01 | Phase 4 | Complete |
| COLL-02 | Phase 4 | Complete |
| COLL-03 | Phase 4 | Complete |
| COLL-04 | Phase 4 | Complete |
| COLL-05 | Phase 4 | Complete |
| COLL-06 | Phase 4 | Complete |
| COLL-07 | Phase 4 | Complete |
| MESG-01 | Phase 8 | Complete |
| MESG-02 | Phase 8 | Complete |
| MESG-03 | Phase 8 | Complete |
| MESG-04 | Phase 8 | Complete |
| NOTF-01 | Phase 6 | Complete |
| NOTF-02 | Phase 6 | Complete |
| NOTF-03 | Phase 6 | Complete |
| MODR-01 | Phase 7 | Complete |
| MODR-02 | Phase 7 | Complete |
| MODR-03 | Phase 7 | Complete |
| MODR-04 | Phase 7 | Complete |

**Coverage:**
- v1 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation*
