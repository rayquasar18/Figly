# Pitfalls Research

**Domain:** Instagram-like social media platform for collectors (Figly)
**Researched:** 2026-03-13
**Confidence:** HIGH (well-documented domain; Instagram clones are among the most common project types with extensive post-mortems and engineering literature)

## Critical Pitfalls

### Pitfall 1: Synchronous Media Processing Blocking the Event Loop

**What goes wrong:**
Developers process image resizing, thumbnail generation, and video transcoding synchronously in the main API request handler. A user uploads a 20MB photo or a 2-minute video, and the server blocks for 5-30 seconds. During this time, the Node.js event loop is starved -- all other requests queue up. With just 10 concurrent uploads, the entire API becomes unresponsive.

**Why it happens:**
In early development, synchronous processing "just works" for small test images. Sharp (image processing) is fast for single images, so developers don't notice the problem until multiple users upload simultaneously. Video processing with ffmpeg is even worse -- a single 1080p video transcode can consume 100% CPU for minutes.

**How to avoid:**
- Accept the raw upload, store it immediately in S3/object storage, and return a 202 Accepted with a processing status URL
- Use a job queue (BullMQ with Redis) in NestJS to handle all media processing asynchronously
- Process media in a separate worker process (not the API server) -- NestJS supports standalone applications for workers
- Generate multiple resolutions asynchronously: thumbnail (150px), feed (640px), full (1080px) for images; 480p/720p/1080p for video
- Use pre-signed S3 upload URLs so large files never touch your API server at all

**Warning signs:**
- API response times spike during user testing with media uploads
- Server CPU consistently above 80% with few concurrent users
- Upload endpoint has no queue or background job infrastructure
- Videos are processed in the same process as the REST API

**Phase to address:**
Phase 1 (Foundation) -- Media processing architecture must be async from day one. Retrofitting a queue system after building synchronous processing requires rewriting every upload endpoint.

---

### Pitfall 2: Naive Feed Query Without Fanout Strategy

**What goes wrong:**
The feed is built by querying "get all posts from users I follow, sorted by date" at read time. This requires a JOIN across the follows table and the posts table, sorting potentially millions of rows. At 1000 users with 100 follows each, this query takes 500ms+. At 10,000 users it becomes unusable. This is the single most common failure in Instagram clones.

**Why it happens:**
The naive query (`SELECT * FROM posts WHERE author_id IN (SELECT following_id FROM follows WHERE follower_id = ?) ORDER BY created_at DESC LIMIT 20`) is the obvious first implementation and works perfectly in development. The problem is that this is a fan-out-on-read approach that scales with the number of people you follow multiplied by their post volume.

**How to avoid:**
- Start with fan-out-on-read but design the feed service as an isolated module behind an interface so you can swap implementations
- Use materialized feed tables early: when a user posts, write a row into a `feed_items` table for each of their followers (fan-out-on-write)
- For MVP, use a hybrid approach: fan-out-on-write for users with <10K followers, fan-out-on-read for "celebrity" users with many followers
- Cache the feed in Redis as a sorted set (user_id -> list of post_ids with timestamps)
- Always paginate with cursor-based pagination (keyset), never OFFSET/LIMIT

**Warning signs:**
- Feed endpoint response time grows linearly as users add follows
- Database CPU spikes when many users open the app simultaneously
- Feed queries show sequential scans in EXPLAIN ANALYZE
- No dedicated feed/timeline table or cache exists

**Phase to address:**
Phase 2 (Core Social Features) -- Feed architecture must be designed before building the feed UI. The data model decision (fan-out strategy) dictates the entire social feature set.

---

### Pitfall 3: N+1 Queries on Social Data (Posts, Comments, Likes, User Profiles)

**What goes wrong:**
Loading a feed of 20 posts results in: 1 query for posts + 20 queries for authors + 20 queries for like counts + 20 queries for comment counts + 20 queries for "did current user like this" = 81 queries per feed page load. Response time: 800ms+. This multiplies with every new feature (collection tags, reshares, etc.).

**Why it happens:**
ORMs (TypeORM/Prisma in NestJS) make it easy to access relations lazily. `post.author.name` triggers a separate query. This is invisible during development with a local database and low latency. In production with network latency between app and DB, each extra query adds 2-5ms.

**How to avoid:**
- Use eager loading with explicit JOIN strategies in TypeORM (`relations: ['author', 'collection']`) or Prisma (`include: {}`)
- Create dedicated DTOs/response shapes that aggregate data in a single query using SQL subqueries or CTEs
- For the feed specifically, use a denormalized feed item that includes author name, avatar URL, like count, and comment count -- updated asynchronously
- Use DataLoader pattern (batching) for GraphQL-style queries in NestJS
- Monitor query count per request in development using query logging middleware

**Warning signs:**
- Slow feed loads that get worse as you add features
- Database connection pool exhaustion under moderate load
- Query logs showing dozens of near-identical queries per request
- TypeORM/Prisma lazy loading used without explicit eager relations

**Phase to address:**
Phase 2 (Core Social Features) -- Establish query patterns and DTOs before building out the feed, comments, and likes features.

---

### Pitfall 4: Storing Original Media Without Size Limits or Processing Pipeline

**What goes wrong:**
Users upload 30MB RAW photos, 4K videos at 500MB, or exploit the upload endpoint to store arbitrary large files. Storage costs explode -- S3 alone can reach $500+/month with just a few hundred active users uploading uncompressed media. CDN egress costs compound this by 3-5x. A single viral post serving an unoptimized 10MB image to 10,000 viewers costs $1+ in bandwidth alone.

**Why it happens:**
Developers focus on making uploads work, not on media optimization. They store originals "for quality" without generating optimized versions. They don't enforce client-side or server-side file size limits. They serve original files directly instead of optimized versions through a CDN with appropriate cache headers.

**How to avoid:**
- Enforce strict upload limits: 10MB for photos, 100MB for videos (client-side validation + server-side enforcement)
- Generate multiple sizes immediately: thumbnail (150px square, ~5KB), feed (640px wide, ~50KB), detail (1080px, ~150KB) using Sharp
- Convert all images to WebP/AVIF with JPEG fallback -- 30-50% size reduction
- For video: transcode to H.264 MP4 at 720p max for stories/reels, strip unnecessary metadata
- Set S3 lifecycle policies to move originals to Glacier/Infrequent Access after processing
- Use CloudFront/CDN with aggressive cache headers (1 year for processed media, since URLs contain content hashes)
- Consider Cloudinary or imgproxy for on-the-fly transformations instead of pre-generating all sizes

**Warning signs:**
- Average stored file size >2MB for images
- No image optimization step in upload pipeline
- S3 bill growing faster than user count
- No CDN in front of media storage
- Original files served directly to browsers

**Phase to address:**
Phase 1 (Foundation) -- Media pipeline must be defined before any upload feature is built. Retrofitting size optimization requires re-processing every existing file.

---

### Pitfall 5: WebSocket Connection Management Without Redis Adapter

**What goes wrong:**
NestJS WebSocket Gateway (Socket.IO) works perfectly on a single server instance. The moment you deploy a second instance (for reliability or scaling), users connected to different instances cannot see each other's messages, notifications, or typing indicators. DMs appear lost. Notifications only reach users on the same server instance as the sender.

**Why it happens:**
Socket.IO stores connection state in-memory by default. A WebSocket connection is a persistent TCP connection to a specific server. Without a shared pub/sub layer, events emitted on Server A never reach clients connected to Server B. This is invisible in development (single instance) and even in early production.

**How to avoid:**
- Use `@socket.io/redis-adapter` from day one, even with a single server instance -- it costs nearly nothing and prevents the scaling cliff
- Configure Redis pub/sub for WebSocket event distribution across instances
- Implement proper connection lifecycle: authenticate on connect, handle reconnection with message catch-up, clean up on disconnect
- Use rooms/namespaces properly: one room per DM conversation, one room per user for notifications
- Implement heartbeat/ping-pong to detect stale connections and free memory
- Set maximum connections per user (prevent tab-bombing: user opens 50 tabs = 50 connections)

**Warning signs:**
- Socket.IO using default in-memory adapter
- No Redis dependency in the WebSocket module
- DMs work in testing but "sometimes don't arrive" in staging with multiple instances
- Memory usage grows linearly and never decreases as users connect/disconnect

**Phase to address:**
Phase 3 (Real-time Features) -- Must be in the architecture from the first WebSocket implementation, not added after DMs are "working."

---

### Pitfall 6: JWT Authentication Without Proper Token Lifecycle

**What goes wrong:**
The app uses JWT access tokens with long expiry (24h+) and no refresh token mechanism. When a user's account is compromised, there's no way to invalidate the token -- the attacker has access until expiry. Alternatively, short-lived tokens (15min) without refresh tokens force users to log in constantly, destroying UX.

**Why it happens:**
JWT is "stateless" by design, which appeals to developers wanting to avoid session storage. But stateless means no server-side revocation. Many tutorials show JWT with 24-hour or 7-day expiry and no refresh flow, which is fundamentally insecure for a social platform where account takeover leads to impersonation.

**How to avoid:**
- Short-lived access tokens (15 minutes) + long-lived refresh tokens (7-30 days) stored in httpOnly secure cookies
- Store refresh token family IDs in the database -- enables revocation and rotation detection
- Implement refresh token rotation: each refresh issues a new refresh token and invalidates the old one
- Detect refresh token reuse (indicates theft) and invalidate the entire token family
- Add a token blocklist in Redis for immediate access token revocation (checked on sensitive operations only, not every request)
- Support social login (Google, Apple) via OAuth 2.0 / OIDC -- use Passport.js strategies in NestJS
- Rate-limit login attempts (5 per minute per IP, 10 per hour per account)

**Warning signs:**
- Access tokens with >1 hour expiry
- No refresh token endpoint
- No way to "log out all devices"
- Passwords stored with anything other than bcrypt/argon2
- No rate limiting on authentication endpoints

**Phase to address:**
Phase 1 (Foundation) -- Authentication is the first thing built and the hardest to change later. Token lifecycle must be designed upfront.

---

### Pitfall 7: Collection Database Without Versioning or Merge Strategy

**What goes wrong:**
The shared collection database (Gundam series, sneaker models, etc.) is treated as static data. But catalog data changes: new items release, items get renamed, categories get reorganized. When the admin updates the shared catalog, user checklists that reference old item IDs break silently. Users report "my collection lost 3 items" because a Gundam model was re-categorized and the foreign key reference broke or pointed to the wrong thing.

**Why it happens:**
Developers model collection items as simple rows with auto-increment IDs and direct foreign keys from user checklists. This creates tight coupling between the mutable catalog and user state. Any catalog update (rename, merge, split, delete) cascades destructively to user data.

**How to avoid:**
- Use stable, immutable item identifiers (UUIDs or content-addressable IDs) that never change even when display data updates
- Separate the concept of "catalog item" (admin-managed) from "collection entry" (user-managed) with a junction table
- Implement soft deletes only on catalog items -- never hard delete, mark as deprecated/superseded with a pointer to the replacement
- Version catalog changes: when an item is updated, create a new version and keep the old one accessible
- For custom user lists: user-created items live in a separate table with no catalog dependency
- Build a merge/redirect system: when two catalog items turn out to be duplicates, create a redirect rather than deleting one

**Warning signs:**
- Direct foreign keys from user collections to catalog items with CASCADE DELETE
- No soft-delete mechanism on catalog items
- Catalog updates require manual "what will this break?" analysis
- No audit log of catalog changes
- User-created items and catalog items in the same table

**Phase to address:**
Phase 2 or dedicated Collection Phase -- Collection data model must be designed with mutability in mind before any catalog data is loaded.

---

### Pitfall 8: Building All Instagram Features Before Validating the Collection Differentiator

**What goes wrong:**
The team spends 6 months building a pixel-perfect Instagram clone (feed, stories, reels, explore, DM) and then bolts on collection tracking as an afterthought. Result: a mediocre Instagram copy with a mediocre collection feature. Users already have Instagram -- they have no reason to switch for an inferior version of the same thing. The collection feature, which is the actual value proposition, gets 10% of the development effort.

**Why it happens:**
Instagram's feature set is well-defined and familiar, making it easy to scope and build. Collection tracking is the novel part, requiring original UX design and data modeling that is harder and less "fun" to build. Developers gravitate toward the known problem (clone Instagram) and defer the unknown (invent collection UX).

**How to avoid:**
- Build the collection system first or in parallel with basic social features -- it is the differentiator
- Phase 1 should include: authentication, profiles, basic posts, AND collection checklist with at least one category fully populated
- Validate the collection UX with real collectors before investing in stories/reels
- Stories and reels are Phase 3+ features -- they are expensive to build and not the reason users would choose Figly over Instagram
- Define "what can I do on Figly that I cannot do on Instagram?" and build that first

**Warning signs:**
- Sprint backlog is 80% Instagram clone features, 20% collection features
- Collection features keep getting deferred to "next phase"
- No collector users involved in early testing
- Reels/stories being built before collection showcase profiles

**Phase to address:**
Phase 1 (Foundation) AND Phase 2 -- Collection tracking must be a first-class citizen from the first phase, not an add-on.

---

### Pitfall 9: Monolithic Feed Without Content Type Abstraction

**What goes wrong:**
The feed table is designed around "posts with images" because that is the first feature built. When stories, reels, collection showcases, and trade/want-list updates need to appear in the feed, the post table gets overloaded with nullable columns (`video_url`, `story_expires_at`, `collection_id`, `is_reel`, etc.). Queries become complex, indexes become inefficient, and adding any new content type requires schema migrations that touch the core table.

**Why it happens:**
Starting with a simple `posts` table is natural. The problem is that Instagram-like platforms have many content types (photo posts, carousels, stories, reels, IGTV-like long video, text posts) and a collector platform adds more (collection updates, wishlist changes, checklist completions). Without an abstraction layer, the post table becomes a god table.

**How to avoid:**
- Use a polymorphic content model: a `feed_items` table with `content_type` and `content_id` columns, where each content type has its own table
- Or use single-table inheritance with a discriminator column and type-specific JSON metadata (PostgreSQL JSONB)
- Define a `FeedItem` interface/abstract class in NestJS that all content types implement
- Keep the feed item table lightweight (id, author, type, created_at, metadata) and load full content on demand
- Design the feed response as a union type from the start

**Warning signs:**
- Posts table has >15 columns with many nullable
- Adding a new content type requires altering the core posts table
- Feed queries have complex CASE/WHEN logic for different content types
- No `content_type` discriminator field

**Phase to address:**
Phase 2 (Core Social Features) -- Design the content type system before building posts, so stories/reels/collections can be added without restructuring.

---

### Pitfall 10: No Content Moderation Strategy Until After Launch

**What goes wrong:**
A social media platform without content moderation is an unmoderated internet forum. Users post NSFW content on a collector platform meant for all ages. Spam accounts flood the explore page. Without moderation tools, the only option is manual database edits to remove content. This destroys community trust and can create legal liability.

**Why it happens:**
Content moderation is unglamorous and doesn't demo well. It's invisible when it works and catastrophic when absent. Developers defer it as a "we'll deal with it if it becomes a problem" concern. By the time it's a problem, the community is already damaged.

**How to avoid:**
- Build basic moderation tools into the admin panel from Phase 2: flag content, review queue, ban user, remove post
- Implement user-facing report button on every piece of content from day one
- Add automated screening for first-post users (hold first post for review, or require email verification before posting)
- Use a basic image safety check API (AWS Rekognition Content Moderation, or Google Cloud Vision SafeSearch) on upload
- Define community guidelines before launch and display them during signup
- Build rate limiting on posting: new accounts limited to 5 posts/day for first week

**Warning signs:**
- No report functionality in the app
- No admin dashboard for content review
- No rate limiting on post creation
- No automated content screening in the upload pipeline
- Community guidelines don't exist

**Phase to address:**
Phase 2 (Core Social Features) for basic reporting/flagging, Phase 3 for automated moderation -- but community guidelines and the report button must ship with the first public release.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Storing media on local filesystem instead of S3 | Faster to implement, no AWS setup | Cannot scale horizontally, data loss risk, no CDN | Never in production; OK for local dev only |
| Using OFFSET/LIMIT pagination | Simple to implement | Performance degrades linearly with page depth; inconsistent results when new items are inserted | Never for feeds; OK for admin dashboards with small datasets |
| Polling for real-time updates instead of WebSockets | Simpler infrastructure, no Socket.IO | Wasted server resources, delayed updates, poor UX for DMs | Acceptable for notifications in MVP if polling interval >30s; never for DMs |
| Single JWT with long expiry (no refresh tokens) | Fewer endpoints to build | Cannot revoke access, security risk, forces re-login or insecure long tokens | Never -- refresh token flow is a few hours of work and critical for security |
| Putting media processing in the API request cycle | Works for small files, simpler code | Blocks event loop, timeouts on large files, cannot retry failures | Never -- even MVP should use a queue (BullMQ setup takes <2 hours in NestJS) |
| Using TypeORM synchronize:true in production | Auto-creates tables, no migration files needed | Data loss risk, unpredictable schema changes, no rollback capability | Only in early development; switch to migrations before any real data exists |
| Storing follower counts in real-time queries (COUNT) | Always accurate | Expensive query on every profile view | Acceptable <1000 users; use denormalized counter columns after that |
| Monolithic NestJS app (no module boundaries) | Faster initial development | Circular dependencies, untestable, impossible to extract microservices later | Acceptable in Phase 1 if module boundaries are at least logically separated |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| AWS S3 | Using SDK v2 (legacy) and generating signed URLs with default 15min expiry for public content | Use SDK v3 (modular imports, smaller bundle). Use CloudFront signed URLs or make processed media buckets public with long cache headers. Keep originals private. |
| Socket.IO / NestJS Gateway | Not authenticating WebSocket connections -- anyone can connect and listen to events | Validate JWT in the connection handshake middleware (`handleConnection`), reject unauthenticated connections before they enter any room |
| Redis | Using a single Redis instance for cache, sessions, queues, AND pub/sub | Use separate Redis instances (or at least separate databases/key prefixes) for different concerns. A cache flush should never destroy your job queue. |
| Cloudinary/imgproxy | Letting users specify arbitrary transformation parameters in the URL | Whitelist allowed transformations server-side. User-controlled transform params enable SSRF and resource exhaustion attacks. |
| OAuth Providers (Google, Apple) | Not handling token refresh and provider-side revocation; assuming OAuth token validity means account validity | Always verify the OAuth token with the provider on critical operations. Store provider tokens encrypted. Handle the case where a user revokes app access on the provider side. |
| Email Service (SendGrid, SES) | Sending emails synchronously in request handlers, not handling bounces/complaints | Queue all email sending via BullMQ. Register bounce/complaint webhooks. High bounce rates get your sending domain blacklisted. |
| CDN (CloudFront) | Not invalidating cache when content is deleted (e.g., moderation removal) | Use content-hash-based URLs (e.g., `/media/{hash}.webp`) so deletion means removing the origin file; cache naturally expires. For immediate takedown, use CloudFront invalidation API. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Feed built with fan-out-on-read JOINs | Feed load time grows from 50ms to 5s as users follow more people | Implement fan-out-on-write with materialized feed table, or cache feeds in Redis sorted sets | 500+ users with 100+ follows each |
| Loading full post objects for feed (including all comments, all likes) | Feed API returns 2MB+ JSON payloads, slow rendering | Return feed items with counts only; lazy-load comments and full like lists on scroll/tap | 20+ posts per feed page with active engagement |
| No database indexes on foreign keys and common query patterns | Slow queries, increasing CPU on database server | Add composite indexes: `(author_id, created_at)` on posts, `(follower_id, following_id)` on follows, `(post_id, created_at)` on comments | 10,000+ rows in any table |
| Unbounded queries (SELECT * without LIMIT) | API returns 10,000 comments on a viral post, crashes client | Always enforce server-side LIMIT. Maximum page size of 50 for comments, 20 for feed items. | First viral post or spam attack |
| Real-time notifications for every interaction | Notification service overwhelmed when a popular post gets 1000 likes in a minute | Batch notifications: "UserA and 47 others liked your post" instead of 48 individual notifications. Use debouncing. | First post that gets >100 interactions in an hour |
| next/image optimization for user-uploaded content without pre-processing | Next.js server does on-the-fly image optimization for every request variant, consuming CPU and memory | Pre-process images during upload (multiple sizes in WebP). Use next/image only for static assets. Serve user media directly from CDN. | 100+ concurrent users viewing media-heavy feeds |
| Searching posts/collections with SQL LIKE queries | Full text search becomes unusable, queries take seconds | Use PostgreSQL full-text search (tsvector/tsquery) for basic search, or Elasticsearch/Meilisearch for advanced explore features | 50,000+ posts or catalog items |
| Single database connection pool for all operations | Slow read queries block write operations; migration locks freeze the app | Use read replicas for feed/explore queries. Separate connection pools for reads vs writes. | 100+ concurrent database connections |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Direct object references in APIs (e.g., `GET /api/posts/123` without ownership check for private posts) | Users can enumerate and view private posts/DMs by guessing IDs | Use UUIDs instead of sequential IDs. Always check authorization: "does this user have permission to view this resource?" in every endpoint. NestJS Guards are designed for this. |
| Unsigned or user-controllable media URLs | Users can manipulate URLs to access other users' private media, or perform SSRF via image proxy | Sign all media URLs with time-limited tokens. Never allow users to specify arbitrary URLs for media fetching. |
| No rate limiting on social actions (follow, like, comment) | Bot accounts follow 10,000 users per hour, spam comments, inflate engagement metrics | Rate limit per user per action type: 60 follows/hour, 200 likes/hour, 30 comments/hour. Implement exponential backoff for repeat offenders. |
| Storing user-uploaded filenames and serving them directly | Path traversal attacks, XSS via crafted filenames, content-type sniffing attacks | Generate random filenames (UUID) for all uploads. Set `Content-Disposition: inline` with sanitized filename. Set explicit `Content-Type` based on server-side detection, not user input. |
| DM content not encrypted, accessible by any admin query | Privacy violation, legal liability (GDPR/CCPA), trust destruction if breached | At minimum: encrypt DM content at rest (database-level encryption). Ideally: implement end-to-end encryption or clearly state in ToS that DMs are not E2E encrypted. Restrict admin access to DMs with audit logs. |
| Password reset tokens without expiry or single-use enforcement | Account takeover via intercepted or leaked reset links | Reset tokens expire in 15 minutes. Invalidate token after use. Invalidate all tokens when password changes. Rate limit reset requests (3/hour per email). |
| User profile data exposed in API responses (email, phone in public endpoints) | Privacy leak, scraping, GDPR violation | Create separate public and private profile DTOs. Never include email/phone in public-facing API responses. Audit every API response shape for PII leakage. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Upload with no progress indicator or optimistic UI | Users tap upload and stare at a frozen screen for 10 seconds, assume it failed, tap again (double upload) | Show upload progress bar. Display optimistic preview immediately. Disable the submit button after first tap. Show the post in the feed immediately with a "uploading..." badge. |
| Infinite scroll without scroll position restoration | User scrolls 50 posts deep, taps a post, hits back, and is sent to the top of the feed -- loses their place | Virtualize the feed list (react-window or react-virtuoso). Cache scroll position. Restore position on back navigation. Use Next.js parallel routes or intercepting routes for modal-over-feed pattern. |
| Collection checklist with no search or filter | Users scroll through 500 Gundam models to find the one they own | Full-text search within collections. Filter by series/year/category. "Recently added" section. Alphabetical index. |
| Requiring account creation before browsing | Potential users bounce because they can't see if the content is worth signing up for | Allow unauthenticated browsing of public posts and collections. Prompt sign-up only for interactions (like, follow, post). |
| Notification overload with no granular controls | Users get 50 notifications per day and disable all notifications, then miss DMs | Categorized notification settings: DMs (always on by default), likes (daily digest option), new followers (weekly digest option), collection updates (customizable). |
| No empty states for new users | New user sees blank feed, blank collection, blank explore -- assumes the app is broken | Curated onboarding: suggest popular collectors to follow, show trending collections, pre-populate explore with featured content, offer a "set up your first collection" wizard. |
| Desktop-only or mobile-only design | Collectors browse on desktop (research) but share on mobile (photos of new items) | Responsive from the start. Key flows (upload, browse feed, manage collection) must work on both. Test on real mobile devices early. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Image Upload:** Often missing EXIF orientation handling -- photos from some phones appear rotated 90 degrees. Verify orientation correction in the processing pipeline.
- [ ] **Image Upload:** Often missing EXIF stripping for privacy -- GPS coordinates embedded in photos leak user location. Verify EXIF metadata is stripped before serving.
- [ ] **Video Upload:** Often missing format validation -- users upload .MOV (iPhone) and the player can't handle it. Verify transcoding to H.264 MP4 for universal playback.
- [ ] **Follow System:** Often missing the bidirectional check -- "is this user following me back?" requires a reverse query that's frequently forgotten. Verify mutual follow detection works.
- [ ] **Notifications:** Often missing deduplication -- "UserA liked your post" appears 3 times because the user liked, unliked, and re-liked. Verify idempotent notification creation.
- [ ] **DM System:** Often missing message ordering guarantees -- messages appear out of order due to clock skew or race conditions. Verify server-side timestamp assignment and ordered retrieval.
- [ ] **Feed Pagination:** Often missing the "new posts available" indicator -- users don't know new content exists above their scroll position. Verify real-time feed update notification (like Twitter's "X new posts" bar).
- [ ] **Search:** Often missing accent/diacritic normalization -- searching "gundam" doesn't find "Gundam" or "GUNDAM." Verify case-insensitive, accent-insensitive search.
- [ ] **Collection Checklist:** Often missing the distinction between "I own this" vs "I want this" vs "I had this" -- collectors need multiple states per item, not just checked/unchecked. Verify multi-state tracking.
- [ ] **User Deletion:** Often missing cascading cleanup -- deleting a user leaves orphaned posts, comments, likes, follows, media files, and collection data. Verify GDPR-compliant full account deletion.
- [ ] **Stories:** Often missing automatic expiry cleanup -- 24-hour stories remain in the database and storage forever. Verify TTL-based cleanup cron job.
- [ ] **Profile Page:** Often missing the "posts where I'm tagged" vs "my posts" separation. Verify tagged-posts tab works independently.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Synchronous media processing | MEDIUM | Add queue system (BullMQ), migrate upload endpoints to async pattern, re-process existing media in background. ~1-2 weeks for a mature codebase. |
| Naive feed queries at scale | HIGH | Requires new feed table, backfill job for existing posts, and rewriting the feed API. May need Redis cache layer. ~2-4 weeks with data migration risk. |
| N+1 query patterns everywhere | MEDIUM | Audit all endpoints with query logging, refactor to use eager loading/DataLoader. ~1 week per major feature area. |
| Storage costs from unoptimized media | MEDIUM | Build processing pipeline, run batch job to re-process all existing media, set up lifecycle policies. Existing cost damage is sunk. ~1-2 weeks + processing compute cost. |
| WebSocket without Redis adapter | LOW-MEDIUM | Add redis-adapter dependency, configure Redis connection, deploy. Minimal code change but requires Redis infrastructure. ~2-3 days. |
| JWT without refresh tokens | HIGH | Requires new token endpoints, client-side token management rewrite, forced re-login for all users, and careful migration to avoid session loss. ~1-2 weeks + user disruption. |
| Collection data integrity broken | HIGH | Requires data audit, migration scripts, user communication about lost data, and fundamental schema redesign. Some user data may be unrecoverable. ~3-4 weeks. |
| No content moderation tools post-launch | MEDIUM | Build admin panel retroactively, manually clean up existing violations, implement report queue. Community damage may already be done. ~2 weeks for tools. |
| Monolithic feed table with nullable columns | HIGH | Requires new polymorphic schema, data migration for all existing posts, and client-side changes to handle new response format. ~2-3 weeks. |
| No scroll position restoration | LOW | Implement virtualized list and scroll position cache. ~3-5 days. Requires careful testing on both desktop and mobile. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Synchronous media processing | Phase 1 (Foundation) | Upload returns 202; media appears asynchronously; worker process is separate from API |
| Naive feed queries | Phase 2 (Core Social) | Feed loads in <200ms with 100+ follows; EXPLAIN shows index usage; no sequential scans |
| N+1 queries | Phase 2 (Core Social) | Query count per feed request is <10; query logging middleware confirms |
| Unoptimized media storage | Phase 1 (Foundation) | All stored images are <200KB; WebP/AVIF format; multiple sizes generated; lifecycle policies active |
| WebSocket without Redis adapter | Phase 3 (Real-time) | DMs work across multiple server instances; connection count observable in monitoring |
| JWT token lifecycle | Phase 1 (Foundation) | Access tokens expire in 15min; refresh endpoint works; "log out all devices" implemented |
| Collection data integrity | Phase 2 (Collection System) | Catalog item update does not break user checklists; soft delete verified; audit log exists |
| Scope creep (Instagram over collections) | Phase 1-2 | Collection features are built and tested before stories/reels; at least 1 category fully populated in Phase 1 |
| Monolithic content model | Phase 2 (Core Social) | Posts table has content_type discriminator; adding a new content type doesn't require altering the posts table |
| No content moderation | Phase 2 (Core Social) | Report button exists on all content; admin review queue functional; community guidelines published |
| OFFSET pagination | Phase 2 (Core Social) | All list endpoints use cursor-based pagination; no OFFSET in production queries |
| No scroll position restoration | Phase 2 (Core Social) | Back navigation restores scroll position; feed uses virtualized list |

## Next.js + NestJS Specific Gotchas

Issues unique to this technology combination.

| Gotcha | Description | Prevention |
|--------|-------------|------------|
| Double data fetching (SSR + client) | Next.js fetches data on the server during SSR, then the client re-fetches the same data on hydration. Feed loads twice, doubling API load. | Use React Server Components for initial data loading. Pass SSR-fetched data as props to client components. Use TanStack Query with `initialData` from SSR to prevent re-fetch. |
| CORS configuration between Next.js and NestJS | Development: Next.js on :3000, NestJS on :4000. CORS errors everywhere. Production: different domains or subdomains create same issues. | Configure NestJS CORS to allow the Next.js domain. In production, consider putting both behind a reverse proxy (nginx) on the same domain with path-based routing (`/api/*` -> NestJS). |
| Authentication state mismatch between SSR and client | Next.js SSR doesn't have access to localStorage JWT. Server-rendered page shows "logged out" state, then hydrates to "logged in" -- causing a flash of unauthenticated content (FOUC). | Store tokens in httpOnly cookies (not localStorage). Cookies are automatically sent with SSR requests. Use Next.js middleware to validate auth state before rendering. |
| API route confusion (Next.js API routes vs NestJS) | Developers accidentally mix Next.js API routes (`/app/api/`) and NestJS endpoints, creating two competing APIs with different auth, validation, and error handling. | Use Next.js API routes ONLY for BFF (Backend-For-Frontend) patterns like auth callbacks, image optimization proxies. ALL business logic lives in NestJS. Document this boundary clearly. |
| Environment variable management | Next.js requires `NEXT_PUBLIC_` prefix for client-side env vars. NestJS uses `ConfigModule`. Secrets leak to the client or aren't available where needed. | Use `.env.local` for Next.js, separate `.env` for NestJS. Never prefix API keys with `NEXT_PUBLIC_`. Use NestJS `ConfigService` with validation (Joi/class-validator) to fail fast on missing vars. |
| Deployment complexity (two apps) | Two separate deployable units (Next.js + NestJS) with different build processes, health checks, scaling needs. Deployment becomes twice as complex. | Use a monorepo tool (Turborepo or Nx) to manage builds. Shared TypeScript types package between frontend and backend. CI/CD pipeline builds and deploys both. Consider Docker Compose for local dev parity. |

## Sources

- Instagram Engineering Blog: architecture decisions around feed ranking, media processing at scale (engineering.instagram.com -- historical posts on feed architecture, Cassandra usage, media pipeline)
- Socket.IO Redis Adapter documentation: multi-instance WebSocket scaling patterns
- NestJS official documentation: WebSocket Gateways, BullMQ integration, Guards/Interceptors patterns
- Next.js documentation: Server Components, Image Optimization, Middleware, Intercepting Routes
- PostgreSQL documentation: JSONB, full-text search (tsvector), indexing strategies for social graphs
- AWS S3 pricing and lifecycle documentation: storage class transitions, egress cost calculations
- OWASP JWT Security Cheat Sheet: token lifecycle, refresh token rotation, common JWT pitfalls
- Community post-mortems and discussions on social media app scaling from Hacker News, Reddit r/webdev, and dev.to (multiple sources, LOW-MEDIUM individual confidence, HIGH aggregate confidence due to consistent patterns across sources)

---
*Pitfalls research for: Instagram-like social media platform for collectors (Figly)*
*Researched: 2026-03-13*
