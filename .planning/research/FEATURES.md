# Feature Research

**Domain:** Instagram-like social media platform for collectors (figurines, Gundam, sneakers, trading cards)
**Researched:** 2026-03-13
**Confidence:** MEDIUM (based on training data knowledge of Instagram, MyFigureCollection, Discogs, TCGPlayer, PriceCharting, hobbyDB; web search tools returned limited results on research date)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in an Instagram-like social platform. Missing any of these makes the product feel broken or incomplete.

#### Core Social / Feed

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Photo/video feed (infinite scroll) | Fundamental to Instagram-like UX. Users expect to open the app and see content from people they follow. | HIGH | Requires feed algorithm (chronological first, ranked later), pagination, lazy-loading media. Most complex core feature. |
| Single and multi-image posts (carousel) | Standard since 2017. Collectors need to show multiple angles of a figure or an entire set. | MEDIUM | Swipeable image carousel, image ordering, up to 10 images per post. |
| Post captions with hashtags and mentions | Users expect to describe items, tag relevant series/brands, and mention other collectors. | LOW | Text parsing for #hashtags and @mentions, linkification. |
| Image upload with crop/rotate | Basic content creation. Users need to frame their collection photos properly. | MEDIUM | Client-side image manipulation before upload. Support at minimum 1:1, 4:5, 16:9 aspect ratios. |
| Like/heart on posts | Most basic engagement signal. Every social platform has this. | LOW | Simple toggle, counter, notification trigger. |
| Comments on posts | Users expect to discuss items, ask about figures, compliment collections. | MEDIUM | Threaded replies, pagination, mention support within comments. |
| User profiles with avatar, bio, post grid | Identity is core to social platforms. Collectors especially want to showcase their collection. | MEDIUM | Avatar upload, editable bio, grid/list view of posts, follower/following counts. |
| Follow/unfollow system | Core social graph. Users expect to curate their feed by following other collectors. | MEDIUM | Follow, unfollow, followers list, following list, follow-back indicators. |
| Search (users, hashtags, posts) | Users need to find specific collectors, series, or item categories. | HIGH | Full-text search across multiple entities, typeahead/autocomplete, recent searches. |
| Hashtag pages | Standard discovery mechanism. Collectors will use hashtags like #Gundam, #Sneakers, #GradedCards. | LOW | Aggregate posts by hashtag, post count, follow hashtag capability. |
| Notifications (likes, comments, follows, mentions) | Users expect to know when someone interacts with their content. | HIGH | Real-time delivery, aggregation ("A, B, and 3 others liked your post"), push/in-app, read/unread state. |
| User authentication (email/password, social login) | Non-negotiable baseline. Social login lowers friction. | MEDIUM | Email/password, Google OAuth, Apple Sign-In at minimum. Email verification, password reset. |
| Basic content moderation (report, block, mute) | Users expect safety tools. Without them, spam and toxins drive users away. | MEDIUM | Report post/user, block user, mute user. Admin review queue. |
| Responsive web design | PROJECT.md mandates web-only. Must work on mobile browsers since collectors browse on phones. | MEDIUM | Mobile-first responsive design. Touch-friendly interactions. |
| Direct messaging (1-on-1) | Expected in social platforms. Collectors message each other to discuss trades, ask questions. | HIGH | Real-time messaging, message read receipts, media sharing in DMs, conversation list. WebSocket-based. |
| Bookmarks/saves | Users expect to save posts for later reference (e.g., a figure they want to buy, a display idea). | LOW | Save/unsave toggle, saved posts collection viewable from profile. |

#### Collection Tracking (Table Stakes for a Collector Platform)

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Shared item database (browse/search items) | MyFigureCollection's core value. Collectors expect a curated database of items they can browse by category, series, brand. Without this, it is just another Instagram. | HIGH | Structured data: item name, series, manufacturer, release date, images, category. Admin/community-contributed. Seed data needed. |
| "Owned" status on items | Core tracking feature. Collectors must be able to mark what they own. MyFigureCollection, Discogs, TCGPlayer all have this. | LOW | Binary owned/not-owned per user per item. Bulk operations helpful. |
| "Wishlist" status on items | Second most important tracking status. Every collection tracker has wishlists. | LOW | Separate from owned. Users flag items they want. |
| Collection overview on profile | Collectors want their profile to show what they collect, not just their photos. Collection count, category breakdown. | MEDIUM | Aggregate stats, category badges, collection gallery distinct from post grid. |
| Category/hobby support | PROJECT.md requires multi-category from day one. Collectors identify by hobby (Gundam, sneakers, cards). | MEDIUM | Category taxonomy, user can indicate which categories they collect, items organized by category. |

### Differentiators (Competitive Advantage)

Features that make Figly uniquely valuable -- the intersection of social media and collection tracking that neither Instagram nor MyFigureCollection does well alone.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Post-to-collection linking** | When sharing a photo of a figure, link it directly to the database item. Viewers can see "This is MG Wing Gundam Ver.Ka" and add it to their own wishlist in one tap. Neither Instagram nor MFC does this seamlessly. | MEDIUM | Post creation flow includes item search/link. Posts display linked item metadata. This is Figly's killer feature. |
| **Custom checklists** | Beyond the shared database, users create personal checklists (e.g., "My MG Gundam completionist list", "Grail sneakers to find"). MFC has basic owned/wished; custom lists go further. | MEDIUM | User-created lists with custom names, item addition from database OR freeform entries, progress tracking (X/Y complete), shareable/public lists. |
| **Collection showcase on profile** | Dedicated profile tab showing collection organized by category/series with completion stats. Instagram profiles show photos; MFC profiles show a list. Figly combines visual showcase + tracking data. | MEDIUM | Profile section with collection grid (item images from database), filters by category/status, completion percentage per series. |
| **Collection statistics and progress** | "You own 47/120 MG Gundam kits (39%)" -- visual progress bars, collection value estimates, completion tracking per series. Gamification of collecting. | MEDIUM | Aggregation queries, progress visualization, per-series and per-category stats. Fun and shareable. |
| **Stories (24-hour ephemeral content)** | Instagram-standard but not available on MFC or collection trackers. Great for "just got this in the mail!" unboxing content. Ephemeral = lower pressure to post. | HIGH | Full-screen vertical media, 24h auto-delete, viewer list, reply-to-story as DM, story highlights (persistent collections of past stories). |
| **Explore/discovery page for collectors** | Curated discovery organized by collection category. "Trending in Gundam", "New releases in Sneakers", "Popular figures this week". Instagram's Explore but domain-aware. | HIGH | Content curation by category, trending algorithm, editorial curation capability, grid of posts/reels. |
| **Item pages with community content** | Each database item gets its own page showing: all posts featuring it, average owner rating, who owns/wants it, community photos. Like a product page but social. | HIGH | Aggregate posts linked to item, user lists (owners, wishers), community rating, discussion. This is a major differentiator from Instagram. |
| **Following collections, not just people** | Follow a specific series or category (e.g., follow "Master Grade Gundam") to see all posts tagged with items from that series. Instagram only lets you follow people and hashtags. | MEDIUM | Series/category subscription, feed integration, notification when new items added to database. |
| **Reels (short-form video)** | Short video format for unboxings, collection tours, build process timelapses. Engagement driver on every social platform now. | HIGH | Video upload, playback, vertical scroll feed, basic editing (trim, music would be v2+). |
| **Group chats by collection category** | DM groups organized around collection categories. "MG Gundam Builders" group, "Nike Dunk Collectors" group. Community within the platform. | MEDIUM | Group messaging, member management, tied to categories/interests. Builds on DM infrastructure. |
| **Item release calendar** | Show upcoming releases for items in categories users follow. Collectors obsess over release dates. Neither Instagram nor most trackers do this well. | MEDIUM | Date-indexed items, calendar UI, notification on release day, "pre-wishlist" for unreleased items. |
| **Collection sharing cards** | Generate shareable images/links showing collection stats: "I own 85 Gundam kits!" as a social sharing card. Viral loop mechanic. | LOW | Server-side image generation (Open Graph images), stats compilation, share link. |

### Anti-Features (Deliberately NOT Building)

Features that seem useful but create problems, complexity, or scope creep.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Built-in marketplace / e-commerce** | Collectors trade and sell constantly. Seems natural. | Massive regulatory burden (payment processing, disputes, fraud, taxes, escrow). Transforms platform into a marketplace competitor (Mercari, eBay). PROJECT.md explicitly excludes this. | "For Sale" status tag on collection items + link to external listing (eBay, Mercari). Let users signal intent without handling transactions. |
| **AI-powered recommendations** | "You might like this figure based on your collection." Sounds smart. | Requires significant ML infrastructure, training data. Cold-start problem with a new platform. PROJECT.md defers this. | Manual curation (staff picks, trending), category-based discovery, "collectors who own X also own Y" (simple co-occurrence, not ML). |
| **Real-time everything (live typing indicators, live feed updates, presence)** | Instagram has it, seems expected. | Massive WebSocket/infrastructure cost at scale. Typing indicators in DMs add complexity with marginal value for a collector platform. | Real-time for: DM message delivery, notifications. Polling/refresh for: feed updates, comment counts. Typing indicators are v2+ if ever. |
| **Full video editing suite** | Instagram and TikTok have filters, effects, music, text overlays. | Enormous frontend complexity. Not core to collection tracking. Web-based video editing is notoriously hard. | Basic trim/crop only. Let users edit in external apps and upload the result. |
| **NFT / digital collectibles integration** | "Collectors want digital items too." | Controversial, market crashed, alienates many users, complex blockchain integration. | Focus on physical collectibles. If digital collecting grows, revisit as a category, not a blockchain integration. |
| **Auction system** | "Let collectors bid on items!" | Full auction logic (bidding, timing, anti-sniping, escrow) is an entire product. Liability, disputes, fraud risk. | Link to external auction platforms. Alternatively, very simple "offer" system in DMs, v2+ consideration. |
| **Price tracking / market value** | "Show me what my collection is worth." | Requires reliable pricing data sources, constant updates, legal considerations with scraping. PriceCharting already does this well. | Link to PriceCharting/external pricing. Show "estimated value" only if reliable API available. Defer to v2+. |
| **Native mobile app** | "Everyone uses apps." | Double the development effort, app store approvals, two codebases. PROJECT.md says web-only. | Progressive Web App (PWA) with installability, push notifications via service workers. Revisit native after web validation. |
| **Stories polls, quizzes, question stickers** | Instagram has interactive story features. | Significant complexity per interactive element. Low priority for collector niche. | Simple stories (photo/video + text overlay) first. Interactive elements are v2+ if engagement data warrants it. |
| **Algorithmic feed from day one** | "Instagram uses algorithms." | Small platform has no data to train algorithms. Algorithmic feed on small platforms feels random/broken. | Chronological feed first. Add "suggested posts" later once there is sufficient engagement data. Honest chronological is better than bad algorithmic. |

## Feature Dependencies

```
[User Authentication]
    |
    +---> [User Profiles]
    |         |
    |         +---> [Follow System]
    |         |         |
    |         |         +---> [Feed (posts from followed users)]
    |         |         |         |
    |         |         |         +---> [Explore/Discovery]
    |         |         |
    |         |         +---> [Notifications]
    |         |
    |         +---> [Collection Showcase on Profile]
    |
    +---> [Media Upload]
    |         |
    |         +---> [Posts (single + carousel)]
    |         |         |
    |         |         +---> [Likes]
    |         |         +---> [Comments]
    |         |         +---> [Bookmarks/Saves]
    |         |         +---> [Post-to-Collection Linking] --requires--> [Item Database]
    |         |
    |         +---> [Stories] --requires--> [Posts infrastructure]
    |         +---> [Reels] --requires--> [Video upload support]
    |         +---> [Direct Messages (media in DMs)]
    |
    +---> [Item Database (shared)]
    |         |
    |         +---> [Owned/Wishlist Status]
    |         |         |
    |         |         +---> [Collection Stats/Progress]
    |         |         +---> [Collection Showcase on Profile]
    |         |
    |         +---> [Custom Checklists]
    |         +---> [Item Pages with Community Content] --requires--> [Posts + Linking]
    |         +---> [Item Release Calendar]
    |
    +---> [Search]
    |         |
    |         +---> [Hashtag Pages]
    |         +---> [Item Database Search]
    |
    +---> [Notifications System]
    |         |
    |         +---> [Push Notifications] --requires--> [Service Worker / PWA]
    |
    +---> [Direct Messaging (text)]
              |
              +---> [Group Chats]

[Report/Block/Mute] --independent--> [Admin Moderation Queue]
```

### Dependency Notes

- **Feed requires Follow System:** Without follows, there is no content to show in the main feed. Explore can work without follows, but the primary feed cannot.
- **Post-to-Collection Linking requires Item Database:** The killer differentiator depends on having a seeded item database. Database must be built and populated before this feature works.
- **Collection Showcase requires both Profiles and Item Database:** This is the unique profile experience, but it sits at the intersection of two systems.
- **Stories require Post infrastructure:** Stories reuse media upload, viewer tracking, and display components. Build posts first, then adapt for ephemeral stories.
- **Reels require video upload:** Video support in posts is a prerequisite. Reels add a dedicated feed and creation UX on top.
- **Item Pages require Posts + Linking:** Community content on item pages only works once users are linking posts to database items.
- **Group Chats require DM infrastructure:** Build 1-on-1 DMs first, then extend to groups.
- **Notifications are cross-cutting:** Almost every feature generates notifications. Build the notification system early as infrastructure, then connect features to it.

## MVP Definition

### Launch With (v1)

Minimum viable product -- enough to validate the "social + collection tracking" concept with real users.

- [ ] **User authentication** (email/password + Google OAuth) -- gatekeeper for everything
- [ ] **User profiles** (avatar, bio, post grid, collection tab) -- identity layer
- [ ] **Follow/unfollow** -- social graph foundation
- [ ] **Photo posts** (single + multi-image carousel with captions) -- core content type
- [ ] **Likes and comments** -- minimum engagement loop
- [ ] **Chronological feed** -- see posts from followed users
- [ ] **Basic search** (users, hashtags) -- discoverability
- [ ] **Hashtag support** -- content organization
- [ ] **Item database** (seeded for 2-3 categories: Gundam, figurines, sneakers) -- collection foundation
- [ ] **Owned/wishlist tracking** -- core collection feature
- [ ] **Post-to-item linking** -- the differentiator that justifies the platform
- [ ] **Collection view on profile** -- show off what you collect
- [ ] **Bookmarks/saves** -- save posts for later
- [ ] **Notifications** (in-app only: likes, comments, follows, mentions) -- engagement loop
- [ ] **Report and block** -- minimum safety tools
- [ ] **Responsive web design** -- mobile browser usability

### Add After Validation (v1.x)

Features to add once core engagement is proven and user base is growing.

- [ ] **Direct messaging (1-on-1)** -- add when users request private communication (they will)
- [ ] **Stories** -- add when daily active usage justifies ephemeral content
- [ ] **Custom checklists** -- add when users outgrow simple owned/wishlist
- [ ] **Collection statistics and progress** -- add when collection database has sufficient coverage
- [ ] **Explore page** -- add when there is enough content to curate
- [ ] **Item pages with community content** -- add when post-to-item linking has adoption
- [ ] **More collection categories** (trading cards, vinyl, comics, etc.) -- add based on user demand signals
- [ ] **Apple Sign-In / more OAuth providers** -- add based on user friction feedback
- [ ] **Item release calendar** -- add when database includes release date data
- [ ] **Collection sharing cards** -- add when users are sharing collections externally

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Reels (short-form video)** -- video infrastructure is expensive; validate with photos first
- [ ] **Group chats** -- defer until DMs are proven and community demand exists
- [ ] **Story highlights** -- defer until stories are launched and used
- [ ] **Follow collections/series** -- defer until follow system and item database are mature
- [ ] **PWA with push notifications** -- defer until web engagement warrants native-like experience
- [ ] **Interactive story elements** (polls, questions) -- defer until stories have traction
- [ ] **Algorithmic feed** -- defer until sufficient engagement data exists
- [ ] **"For Sale" item status** -- defer until collection tracking is mature and users request it
- [ ] **Admin-contributed database entries** (community submissions with approval) -- defer until moderation tools are mature

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| User auth + profiles | HIGH | MEDIUM | P1 |
| Photo posts (single + carousel) | HIGH | MEDIUM | P1 |
| Follow system + chronological feed | HIGH | MEDIUM | P1 |
| Likes + comments | HIGH | LOW | P1 |
| Item database (shared, seeded) | HIGH | HIGH | P1 |
| Owned/wishlist tracking | HIGH | LOW | P1 |
| Post-to-item linking | HIGH | MEDIUM | P1 |
| Collection view on profile | HIGH | MEDIUM | P1 |
| Search (users, hashtags) | HIGH | MEDIUM | P1 |
| Notifications (in-app) | HIGH | MEDIUM | P1 |
| Bookmarks/saves | MEDIUM | LOW | P1 |
| Report/block/mute | MEDIUM | LOW | P1 |
| Direct messaging (1-on-1) | HIGH | HIGH | P2 |
| Stories | MEDIUM | HIGH | P2 |
| Custom checklists | HIGH | MEDIUM | P2 |
| Collection stats/progress | MEDIUM | MEDIUM | P2 |
| Explore page | MEDIUM | HIGH | P2 |
| Item pages (community content) | HIGH | MEDIUM | P2 |
| Item release calendar | MEDIUM | MEDIUM | P2 |
| Collection sharing cards | MEDIUM | LOW | P2 |
| Reels (short video) | MEDIUM | HIGH | P3 |
| Group chats | LOW | MEDIUM | P3 |
| Story highlights | LOW | MEDIUM | P3 |
| Follow collections/series | MEDIUM | MEDIUM | P3 |
| PWA + push notifications | MEDIUM | MEDIUM | P3 |
| Algorithmic feed | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- validates the core concept
- P2: Should have, add post-launch to grow engagement
- P3: Nice to have, future consideration after product-market fit

## Competitor Feature Analysis

| Feature | Instagram | MyFigureCollection | Discogs | TCGPlayer | Figly Approach |
|---------|-----------|---------------------|---------|-----------|----------------|
| Photo feed | Full-featured with algorithm | Basic photo gallery per item | No social feed | No social feed | Instagram-like chronological feed with collection context |
| Stories | Yes (24h, highlights, interactive) | No | No | No | P2 -- simple stories first |
| Reels | Yes (full editor, music, effects) | No | No | No | P3 -- basic video upload first |
| Item database | No structured database | Extensive figure database (community-maintained) | Massive music database | Comprehensive card database | Seeded database for multiple collector categories |
| Collection tracking | No native tracking | Owned/wished/ordered statuses | Have/want lists, custom lists | Have/want lists | Owned/wishlist + custom checklists (P2) |
| Post-to-item linking | No (only hashtags) | Photos linked to entries | Submissions linked to releases | No | Core differentiator -- seamless linking |
| Search | Users, hashtags, places | Items, users, encyclopedic | Releases, artists, labels | Cards, sets, sellers | Users, hashtags, items, categories |
| DM | Full messaging + video calls | No DM | No DM | Buyer-seller messaging | 1-on-1 DMs (P2), no video calls |
| Groups/clubs | No groups (broadcast channels only) | Clubs with forums | No groups | No groups | Category-based group chats (P3) |
| Marketplace | Instagram Shop (being scaled back) | Partner links | Full marketplace | Full marketplace | Explicitly no marketplace -- external links only |
| Collection on profile | No | Owned items list | Collection list | Collection list | Visual collection showcase with stats |
| Notifications | Full push + in-app | Basic email + in-app | Email | Email + in-app | In-app (P1), push via PWA (P3) |
| Moderation | Automated + manual review | Community moderators | Community + staff | Staff moderation | Report/block (P1), admin queue (P1) |
| Price tracking | No | Links to shops with prices | Market pricing, price history | Market pricing | No -- link to external price resources |
| Community ratings | No | User ratings per item | User ratings, reviews | No | Community ratings on item pages (P2) |

## Sources

- Training data knowledge of Instagram features (as of 2025) -- MEDIUM confidence
- Training data knowledge of MyFigureCollection.net features and structure -- MEDIUM confidence
- Training data knowledge of Discogs collection management features -- MEDIUM confidence
- Training data knowledge of TCGPlayer collection features -- MEDIUM confidence
- Training data knowledge of PriceCharting tracking features -- MEDIUM confidence
- Training data knowledge of hobbyDB, Whatnot, and niche collector platforms -- LOW confidence
- Web search tools returned limited results on 2026-03-13 (search service issues)

**Note:** Web search and web fetch tools were largely unavailable during this research session. All findings are based on training data (cutoff ~mid 2025). Feature sets of competitor platforms should be re-verified before implementation decisions, particularly for any features that may have launched or been deprecated since mid-2025.

---
*Feature research for: Instagram-like social media platform for collectors*
*Researched: 2026-03-13*
