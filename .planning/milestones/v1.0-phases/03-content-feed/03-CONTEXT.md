# Phase 3: Content & Feed - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create photo posts (single-image or multi-image carousel up to 10), crop and rotate images before publishing, write captions with hashtags and @mentions, edit captions, delete own posts. Users can like/unlike posts, write comments with threaded replies, bookmark/save posts and view saved collection. Users can browse a chronological feed of posts from followed users. The feed replaces the current placeholder dashboard page.

</domain>

<decisions>
## Implementation Decisions

### Post creation flow
- Instagram-style multi-step full-screen flow: select photos -> edit (crop/rotate) -> write caption -> publish
- Bottom navigation '+' icon triggers the creation flow
- Gallery picker allows selecting up to 10 images for carousel
- Crop and rotate tools on each selected image before proceeding
- Caption field supports #hashtags and @mentions with autocomplete
- Reuses existing media upload pipeline (POST /api/media/upload) for each image
- After publish, redirects to the new post or back to feed

### Feed layout & behavior
- Chronological feed (newest first), no algorithm
- No "new posts" indicator — pull-to-refresh or manual refresh only
- Infinite scroll with cursor-based pagination (same take+1 pattern from Phase 2)
- Feed page replaces current placeholder at (app)/page.tsx
- Post cards in feed show: author avatar + username, post image(s), like/comment/bookmark buttons, like count, caption preview, comment count, relative timestamp
- Carousel posts show dot indicators and swipe navigation

### Post detail view
- Desktop: modal overlay on the feed (image left, comments/info right — Instagram style)
- Mobile: full-page view
- Carousel navigation with swipe/arrows
- Full comment section with input field
- Like, comment, bookmark actions available
- Post author can access edit caption and delete from three-dot menu

### Interactions
- Like: heart icon, tap to toggle, heart animation on like (Instagram double-tap to like on image)
- Comment: speech bubble icon opens comment section, threaded replies (1 level deep, like Instagram)
- Bookmark: flag/bookmark icon, tap to toggle save
- Saved posts accessible from a dedicated "Saved" page/tab
- Like count displayed below post image
- Comment count displayed as "View all X comments" link

### Comment threading
- Top-level comments displayed chronologically (newest or oldest first — Claude's discretion)
- Reply to a comment creates an indented thread (1 level deep max)
- "Reply" button on each comment to start a threaded reply
- @mention of parent comment author auto-inserted in reply
- Comments support @mentions

### Post management
- Edit caption: accessible from three-dot menu on own posts, inline editing
- Delete post: accessible from three-dot menu, confirmation dialog before deletion
- Deleted posts remove all associated likes, comments, bookmarks (cascade)

### Claude's Discretion
- Exact crop/rotate UI implementation (canvas-based vs library choice)
- Loading skeletons for feed and post detail
- Image viewer/carousel library choice
- Comment sort order (newest first vs oldest first)
- Empty feed state design ("Follow people to see posts")
- Error handling UI for failed uploads, failed interactions
- Exact animation details (like heart animation timing, bookmark toggle)
- Mobile bottom navigation bar design
- Hashtag and @mention autocomplete implementation details

</decisions>

<specifics>
## Specific Ideas

- "Just make it like Instagram" — Instagram is the direct benchmark for ALL UX patterns in this phase
- Instagram full-screen post creation flow (gallery -> edit -> caption -> publish)
- Instagram hybrid post detail (modal on desktop, full page on mobile)
- Instagram-style double-tap to like on post images
- Instagram-style threaded comments (1 level deep)
- Feed is strictly chronological, no algorithmic sorting

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Media pipeline**: MinIO + BullMQ + Sharp already handles upload, processing, and 3 thumbnail sizes (150px, 600px, 1080px). Post images use the same pipeline.
- **shadcn/ui components**: Button, Card, Dialog, Avatar, Skeleton, Tabs, Textarea, Toast, ScrollArea — all available for post UI
- **ProfilePostGrid**: Already renders 3-column grid on profile, currently empty — needs real post data from new API
- **API client**: Axios with auth interceptor and silent refresh — use for all post/feed/interaction API calls
- **TanStack Query**: useInfiniteQuery pattern already established for follower lists — reuse for feed pagination
- **Zustand**: auth-store exists — may need post-related optimistic state
- **Follow system**: Social module provides follower data needed for feed query ("posts from users I follow")

### Established Patterns
- NestJS module pattern: Controller + Service + Module, registered in app.module.ts
- Cursor-based pagination with take+1 trick, returns { items, nextCursor, hasMore }
- JWT + HttpOnly cookie auth on all endpoints via @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
- Prisma error codes handled inline (P2002 = duplicate, P2025 = not found)
- Vietnamese error messages in Zod schemas
- react-hook-form + zodResolver for forms
- Optimistic updates with TanStack Query setQueryData + rollback (used in follow/unfollow)

### Integration Points
- **Prisma schema**: Add Post, PostMedia (join table for carousel), Like, Comment, Bookmark models
- **profiles.service.ts**: postCount placeholder (currently 0) needs real _count.posts query
- **(app)/page.tsx**: Replace placeholder dashboard with chronological feed
- **ProfilePostGrid**: Wire to real posts data from new posts API
- **Media model**: Posts reference Media records via PostMedia join table
- **packages/shared**: Add PostDto, CommentDto, FeedItemDto, CreatePostDto types
- **Bottom navigation**: New component for app-wide navigation including '+' create button

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-content-feed*
*Context gathered: 2026-03-14*
