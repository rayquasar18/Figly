# Codebase Concerns

**Analysis Date:** 2026-03-20

## Tech Debt

**Pervasive `as any` type casting in backend controllers and services:**
- Issue: 51 occurrences of `as any` across backend source — bypasses TypeScript safety entirely
- Files: `backend/src/comments/comments.controller.ts`, `backend/src/collection/collection.controller.ts`, `backend/src/posts/posts.service.ts`, `backend/src/feed/feed.service.ts`, `backend/src/checklist/checklist.service.ts`, and more
- Impact: Type errors at runtime go undetected; refactoring is unsafe; Prisma query results lose type narrowing
- Fix approach: Define proper typed interfaces for Prisma result shapes or use Prisma-generated types; extend Express `Request` with a typed `user` property via declaration merging instead of `req.user as any`

**Hashtag upsert loop inside transactions:**
- Issue: `for` loops call `tx.hashtag.upsert` sequentially per hashtag — N sequential DB round trips inside a transaction
- Files: `backend/src/posts/posts.service.ts` lines 55–64, 120–129, 254–263
- Impact: Each hashtag in a caption creates a separate DB roundtrip. A post with 10 hashtags = 20+ sequential awaits inside a single transaction; holds transaction lock longer
- Fix approach: Use `createMany` with `skipDuplicates: true` or batch the upsert outside the transaction, then link in a single `createMany` for PostHashtag

**Collection item images served as raw storage keys, not presigned URLs:**
- Issue: `collection.service.ts` returns `imageUrl: item.imageKey` directly (the raw MinIO key string), not a presigned URL
- Files: `backend/src/collection/collection.service.ts` lines 175, 238, 310, 546; also `backend/src/posts/posts.service.ts` line 712 `mapLinkedItems`
- Impact: Frontend receives a storage key string (e.g., `originals/...`) instead of a real HTTP URL for collection item images. Images do not load unless MinIO is publicly accessible
- Fix approach: Pass item `imageKey` values through `resolvePresignedUrls` the same way post media keys are handled; or use the same `resolvePresignedUrls` helper that exists in `feed.service.ts`

**`posts.service.ts` is a 715-line god class:**
- Issue: Single service handles posts, reels, likes, bookmarks, saved posts, hashtags, explore, and per-user feeds with deeply duplicated query shapes
- Files: `backend/src/posts/posts.service.ts`
- Impact: The Prisma `include` block for a post is copy-pasted 5+ times verbatim; any schema change must be made in multiple places and is prone to drift
- Fix approach: Extract a shared `buildPostInclude()` helper, and split `ReelService` and `InteractionService` into separate classes

**`media.controller.ts` does not pass `purpose` to `MediaService.upload`:**
- Issue: `MediaService.upload` accepts a `purpose: 'post' | 'story' | 'reel'` parameter with video size rules based on it, but `MediaController` always calls `mediaService.upload(file, userId)` with no purpose argument (defaults to `'post'`)
- Files: `backend/src/media/media.controller.ts` line 32, `backend/src/media/media.service.ts` line 22
- Impact: Video uploads for reels use the `post` purpose default, which blocks video uploads (`if (isVideo && purpose === 'post') throw`). The reel upload flow works around this by calling the upload endpoint through the frontend without indicating reel purpose — any reel video upload will be rejected
- Fix approach: Add a `?purpose=reel` query param to the upload endpoint and pass it through

**Shared package types for messaging and stories exist in dist but not in src index:**
- Issue: `packages/shared/dist/` contains compiled `messaging.constants.js`, `story.constants.js`, `messaging.dto.js`, `story.dto.js`, `messaging.types.js`, `story.types.js` — but `packages/shared/src/index.ts` exports none of these
- Files: `packages/shared/src/index.ts`, `packages/shared/dist/`
- Impact: Messaging and story feature code cannot import shared types from `@figly/shared`; the dist files are untracked artifacts from a previous build; these features are partially scaffolded but not connected
- Fix approach: Either add exports to `src/index.ts` and rebuild, or remove the untracked dist files if the features are deferred

**Explore page is just a public feed clone — no discovery logic:**
- Issue: `/explore` renders `usePublicFeed()` — identical chronological feed of all posts, no ranking, recommendations, or hashtag-based discovery
- Files: `frontend/src/app/(public)/explore/page.tsx`
- Impact: Explore page provides no value over the home feed for logged-in users; hashtag links in captions (e.g., `/hashtag/pokemon`) route to a non-existent page — the `(public)/hashtag/[name]` route does not exist in the frontend app routes
- Fix approach: Implement a hashtag feed route at `frontend/src/app/(public)/hashtag/[name]/page.tsx`; differentiate explore with trending/search

## Known Bugs

**Hashtag caption links route to 404:**
- Symptoms: Clicking a `#hashtag` in a post caption navigates to `/hashtag/<name>` which returns a Next.js 404 — the route does not exist
- Files: `frontend/src/components/post/caption-display.tsx` line 61; route does not exist under `frontend/src/app/(public)/hashtag/`
- Trigger: Click any hashtag link rendered in any post caption
- Workaround: None; links simply 404

**Banned users can still log in:**
- Symptoms: The moderation migration (`backend/prisma/migrations/20260315_add_moderation_and_safety/migration.sql`) added `isBanned` and `role` columns to the `users` table, but `auth.service.ts` `validateUser()` never checks `isBanned` before issuing tokens
- Files: `backend/src/auth/auth.service.ts` line 79–104; schema.prisma does not yet reflect the moderation migration fields (migration applied to DB but schema not updated)
- Trigger: Ban a user in the database directly; they can still authenticate
- Workaround: None at application level

**Schema drift from moderation migration:**
- Symptoms: `backend/prisma/schema.prisma` does not contain `isBanned`, `role`, `UserRole`, `Block`, `Mute`, `Report` models — but they exist in the database via the migration SQL
- Files: `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260315_add_moderation_and_safety/migration.sql`
- Trigger: `prisma generate` produces a client that does not know about these fields; accessing `user.isBanned` in code will be a type error
- Workaround: Fields exist in DB but cannot be used from Prisma Client until schema is updated and client regenerated

**Reel upload video blocked by wrong purpose default:**
- Symptoms: Uploading a video via `POST /api/media/upload` without a `purpose` query param hits the `isVideo && purpose === 'post'` guard and throws `BadRequestException`
- Files: `backend/src/media/media.controller.ts`, `backend/src/media/media.service.ts`
- Trigger: Any reel upload from the frontend create-reel flow
- Workaround: Frontend `create-reel-flow.tsx` must pass `purpose=reel` as a query param if it does not already

## Security Considerations

**No HTTP security headers (Helmet missing):**
- Risk: No `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, `Content-Security-Policy` headers sent. Exposes app to clickjacking and MIME-sniffing attacks
- Files: `backend/src/main.ts`
- Current mitigation: None
- Recommendations: Add `npm install helmet` and call `app.use(helmet())` in `main.ts`

**MinIO credentials default to `minioadmin` / `minioadmin`:**
- Risk: Default credentials fall back to well-known values if env vars are not set; storage service hardens the fallback directly in source code
- Files: `backend/src/media/storage.service.ts` lines 20–21; `backend/src/config/configuration.ts` lines 17–18
- Current mitigation: Env vars override defaults when set; Docker compose should set them
- Recommendations: Remove inline fallback defaults; let `ConfigService` throw on missing required secrets in production

**No Multer file size limit configured at the interceptor level:**
- Risk: Multer's default memory storage has no enforced size limit at the NestJS level. The size check is done in `MediaService.upload` after the file is already fully buffered in memory. A 2GB upload will be buffered before rejection
- Files: `backend/src/media/media.controller.ts` line 26 (`FileInterceptor('file')`)
- Current mitigation: Application-level check in `media.service.ts` throws `PayloadTooLargeException` — but only after full buffering
- Recommendations: Pass `{ limits: { fileSize: 100 * 1024 * 1024 } }` to `FileInterceptor` options

**Rate limiting only applied to login endpoint; other sensitive endpoints unprotected:**
- Risk: `/auth/signup`, `/auth/resend-verification`, `/auth/forgot-password`, `/auth/reset-password` have no per-IP rate limiting beyond the global 100 req/min short throttle. Signup and forgot-password can be abused to send spam emails at 100/min
- Files: `backend/src/auth/auth.controller.ts`
- Current mitigation: Global `ThrottlerGuard` (100/min) applies to all endpoints
- Recommendations: Add explicit `@Throttle` decorators on signup, resend-verification, and forgot-password with tighter limits (e.g., 3–5/min)

**No file type allowlist validation on upload:**
- Risk: Mimetype check (`file.mimetype.startsWith('image/')`) trusts the client-supplied MIME type, not the actual file magic bytes. A malicious user can upload an SVG with embedded JavaScript or any other file by spoofing the MIME header
- Files: `backend/src/media/media.service.ts` lines 23–32
- Current mitigation: None — Sharp will fail on non-image binary data, but SVGs and HTML files pass the type check
- Recommendations: Use `file-type` or `magic-bytes` library to detect MIME from buffer; explicitly allowlist `image/jpeg`, `image/png`, `image/webp`, `image/gif`

## Performance Bottlenecks

**Presigned URL generation on every request with no caching:**
- Problem: Every feed request generates individual S3 presigned URLs per media key via `Promise.all(keys.map(getPresignedUrl))`. A feed page of 10 posts with 3 images each = 30+ MinIO HTTP calls per request
- Files: `backend/src/feed/feed.service.ts` lines 329–362; `backend/src/posts/posts.service.ts` `resolvePresignedUrls`; `backend/src/comments/comments.service.ts`; `backend/src/profiles/profiles.service.ts`
- Cause: No URL caching layer; presigned URLs have 1-hour expiry but are regenerated on every page load
- Improvement path: Cache presigned URLs in Redis with a TTL of 50 minutes; use key as cache key; this would reduce MinIO calls by ~95%

**Feed query does not filter blocked/muted users:**
- Problem: The `getFeed` and `getPublicFeed` queries have no exclusion of blocked or muted users even though the schema migration added these tables. All posts from all users appear regardless of blocks
- Files: `backend/src/feed/feed.service.ts`
- Cause: Block/Mute tables exist in DB but are not wired into feed queries
- Improvement path: Join against blocks/mutes tables in the feed `WHERE` clause once schema is updated

**Cursor-based pagination `take` parameter is unbounded:**
- Problem: `@Query('take')` is accepted as a string and `parseInt`-ed without clamping. A caller can pass `take=10000` to dump thousands of records in a single request
- Files: `backend/src/comments/comments.controller.ts` line 35; `backend/src/collection/collection.controller.ts` lines 47, 68
- Cause: No max-take guard
- Improvement path: Add `Math.min(parseInt(take), MAX_PAGE_SIZE)` before passing to the service

**`LIKE '%query%'` search hits full table scan at scale:**
- Problem: All search endpoints (`searchProfiles`, collection item search, follower/following search) use Prisma `contains` with `mode: 'insensitive'`, which compiles to `ILIKE '%query%'` — cannot use standard B-tree indexes
- Files: `backend/src/profiles/profiles.service.ts` line 160; `backend/src/social/social.service.ts` lines 77–78; `backend/src/collection/collection.service.ts` line 261
- Cause: No full-text search indexes (`pg_trgm` or PostgreSQL `tsvector`) configured
- Improvement path: Add `pg_trgm` extension and GIN indexes on `username`, `name` columns; or migrate search to a dedicated search service

## Fragile Areas

**`StorageService` has no delete operation:**
- Files: `backend/src/media/storage.service.ts`
- Why fragile: `deletePost` in `posts.service.ts` deletes the Prisma record but never removes the associated media files from MinIO. Every deleted post leaves orphaned objects in storage. At scale this is a significant storage leak
- Safe modification: Add `deleteObject(key: string)` to `StorageService` and call it when deleting posts, profiles with avatars, and failed media records
- Test coverage: No tests for storage cleanup

**Moderation system is schema-only with no enforcement layer:**
- Files: `backend/prisma/migrations/20260315_add_moderation_and_safety/migration.sql`; `backend/prisma/schema.prisma` (not yet reflecting migration)
- Why fragile: Block, Mute, Report, and UserRole tables exist in the database but have zero backend module to manage them. Any code that references `user.isBanned` or `user.role` will fail at the TypeScript level until schema is regenerated
- Safe modification: Update `schema.prisma` to include all fields from the migration, run `prisma generate`, then implement the moderation service before exposing any admin UI
- Test coverage: None

**OAuth new-user flow has no username — causes crash in app layout:**
- Files: `backend/src/auth/auth.service.ts` `handleGoogleLogin`/`handleAppleLogin`; `frontend/src/app/(app)/layout.tsx`
- Why fragile: OAuth users are created with `username: null`. The `(app)/layout.tsx` checks for `user.username` and redirects to `/complete-profile`, but if the redirect fails or is bypassed, any `/${user.username}` link in `BottomNav` renders `/` (empty string username)
- Safe modification: The redirect guard is correct but relies on a single client-side check; add a server-side middleware guard to enforce username requirement
- Test coverage: No test for username-null OAuth user navigating the app

**`resolvePresignedUrls` pattern is duplicated across 4 services:**
- Files: `backend/src/feed/feed.service.ts`, `backend/src/posts/posts.service.ts`, `backend/src/comments/comments.service.ts`, `backend/src/profiles/profiles.service.ts`
- Why fragile: Each service has its own `resolvePresignedUrls` copy. Adding a new media field type (e.g., story thumbnail) requires updating all four copies
- Safe modification: Extract to a shared `PresignedUrlService` or utility function; inject `StorageService` and share the caching layer

## Scaling Limits

**BullMQ Redis connection has no TLS or authentication:**
- Current capacity: Works for localhost/Docker internal network
- Limit: Unsuitable for production Redis in hosted environments that require TLS (`rediss://`) or password authentication
- Scaling path: Parse `redis.url` for password and TLS; BullMQ `connection` object supports `tls` and `password` fields

**Media processing: all video transcoding runs in-process on /tmp:**
- Current capacity: Single worker, `/tmp` filesystem, default BullMQ concurrency (1 job at a time)
- Limit: Large video files (100MB) held in `/tmp`; concurrent transcoding jobs contend for disk space and CPU; no job retry configuration
- Scaling path: Configure BullMQ worker concurrency; add retry/backoff settings; consider offloading to dedicated transcoding service or AWS MediaConvert for production

## Dependencies at Risk

**`@ffprobe-installer/ffprobe` bundles ffprobe binary:**
- Risk: Version `^2.1.2` bundles platform-specific ffprobe binaries; Docker image must match the architecture (aarch64 vs amd64); binary is not signed. Any CVE in the bundled binary requires a package update
- Impact: Video processing fails silently or with obscure errors on architecture mismatch
- Migration plan: Install `ffmpeg` and `ffprobe` as system packages in the Dockerfile rather than bundling via npm

**`sharp` native module requires rebuild per Node version:**
- Risk: `sharp@^0.34.5` uses native binaries; must match Node.js ABI. Docker multi-stage builds or node version upgrades will break image processing with `Error: Module did not self-register`
- Impact: All image resizing (thumbnails, medium, large) fails
- Migration plan: Pin Node version in both Dockerfile and `.nvmrc`; use `npm rebuild sharp` in Dockerfile as a post-install step

## Missing Critical Features

**No in-app notification system:**
- Problem: Navigation bar references `/notifications` (visible in `.next/types/app/(app)/notifications`) but no notification backend module, no schema model, and no frontend page file exists in source
- Blocks: Users have no way to see likes, comments, follows, or mentions

**No messaging system:**
- Problem: Shared package has compiled `messaging.constants.js`, `messaging.dto.js`, `messaging.types.js` and `.next/types/app/(app)/messages/[conversationId]` exists as a built type — but no backend module, no Prisma model, no frontend source page exists
- Blocks: The "Messages" link in navigation leads to a missing page

**No story/ephemeral post feature:**
- Problem: `packages/shared/dist/` contains compiled story types and DTOs (`story.types.js`, `story.dto.js`, `story.constants.js`) but no backend story module exists, no Prisma schema model for stories, and no frontend story component or route
- Blocks: Story feature is scaffolded in shared types but has no implementation

## Test Coverage Gaps

**No tests for media controller upload endpoint:**
- What's not tested: File upload request validation, `purpose` param handling, oversized file rejection, unsupported MIME type rejection
- Files: `backend/src/media/media.controller.ts`; no corresponding test in `backend/src/media/__tests__/media.spec.ts`
- Risk: Upload validation bugs (e.g., the `purpose` defaulting issue above) go undetected
- Priority: High

**No tests for feed service:**
- What's not tested: `getFeed`, `getPublicFeed`, `getReelsFeed` — none of these have unit tests in `backend/src/feed/__tests__/feed.service.spec.ts` or `public-feed.spec.ts`
- Files: `backend/src/feed/feed.service.ts`
- Risk: Feed query shape changes silently break response structure; presigned URL resolution logic untested
- Priority: High

**No tests for profile update or avatar upload:**
- What's not tested: Profile update flow, avatar media linking, username change cooldown enforcement
- Files: `backend/src/profiles/profiles.service.ts` — `backend/src/profiles/__tests__/profiles.service.spec.ts` exists but likely incomplete
- Risk: Username cooldown bypass; avatar orphan leaks
- Priority: Medium

**No E2E or integration tests:**
- What's not tested: Full request-response cycle through NestJS; actual Prisma queries; cookie-based auth flow end-to-end
- Files: No `e2e/` directory found
- Risk: Controller-to-service wiring errors, guard bypass, cookie handling issues go undetected in CI
- Priority: Medium

---

*Concerns audit: 2026-03-20*
