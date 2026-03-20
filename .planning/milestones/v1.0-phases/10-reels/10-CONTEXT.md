# Phase 10: Reels - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can upload short-form video content (reels) and browse them in a dedicated full-screen vertical scroll feed with auto-play. This is the final v1 phase -- the engagement multiplier built on top of the existing video pipeline from Stories.

Requirements: CONT-10 (upload and post short-form video), CONT-11 (browse reels in dedicated vertical scroll feed).

</domain>

<decisions>
## Implementation Decisions

### Vertical scroll feed
- TikTok/Instagram Reels-style full-screen vertical scroll with CSS scroll-snap (snap-y mandatory, snap-start per item)
- Auto-play current reel, pause when scrolled away (IntersectionObserver threshold ~0.7)
- Start muted by default -- tap to unmute (browser autoplay policy compliance)
- Preload next 1 reel for smooth scrolling (prefetch via IntersectionObserver on sentinel)
- Loop current reel continuously until user scrolls
- Show play/pause toggle on tap (center of screen), mute/unmute on separate icon
- Landscape videos rendered with letterboxing (black bars) to maintain 9:16 viewport

### Reel creation flow
- Simple upload flow similar to Stories -- select video from device, preview, add caption, post
- Max duration: 60 seconds (Instagram Reels standard for v1)
- Max file size: 100MB (higher than story 30MB to accommodate longer videos)
- No in-app trimming, filters, text overlay, or music for v1 -- users edit externally and upload
- Caption with hashtags and @mentions support (reuse existing caption logic from Posts)
- Optional: link to collection items (reuse ItemPicker from Phase 4)
- Backend transcodes to MP4/H.264 via ffmpeg for consistent playback (ffmpeg already in Docker)
- Generate thumbnail from first frame via ffmpeg for feed previews

### Reel engagement
- Right-side floating action column (Instagram Reels style): like, comment, share, bookmark
- Like/bookmark reuse existing Post interactions infrastructure (Reel IS a Post with type='REEL')
- Comments open as bottom sheet overlay (half-screen), same threading as post comments
- Share copies reel URL to clipboard (no external sharing API for v1)
- Double-tap to like (same as post detail)
- Show like count, comment count on action column
- Author info (avatar, username, follow button) at bottom-left overlay

### Navigation & access
- Replace Search tab in bottom nav with Reels tab (Clapperboard/Film icon)
- Search moves to top header bar (magnifying glass icon next to DM icon)
- Reels feed at /reels route
- User's reels visible on profile in a dedicated Reels tab (alongside Posts, Collections)
- Reels also appear in Explore page category sections

### Data model approach
- Reels are Posts with postType='REEL' discriminator (not a separate model)
- Add postType enum to Post model: 'POST' (default) | 'REEL'
- ReelMeta model for reel-specific fields: duration, thumbnailUrl, width, height
- Existing feed excludes reels (postType='POST' filter), reels feed only shows reels
- Profile post grid excludes reels, profile reels tab shows only reels

### Claude's Discretion
- Exact ffmpeg transcoding parameters (bitrate, resolution, codec profile)
- Loading skeleton design for reels feed
- Scroll debounce/throttle timing for view tracking
- Error state handling (failed video load, network issues)
- Exact bottom sheet animation for comments overlay

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs -- requirements fully captured in decisions above and REQUIREMENTS.md.

### Existing patterns to follow
- `.planning/phases/09-stories/09-01-PLAN.md` -- Stories backend pattern (closest feature analogue)
- `.planning/phases/09-stories/09-02-PLAN.md` -- Stories frontend pattern (full-screen viewer, media playback)
- `.planning/phases/03-content-feed/03-01-PLAN.md` -- Post schema and shared types pattern
- `.planning/phases/03-content-feed/03-04-PLAN.md` -- Feed infinite scroll and post interactions pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `backend/src/media/media.service.ts` -- Already handles video upload (mimetype check, size validation). Needs extension for transcoding and thumbnail generation
- `backend/src/media/media.processor.ts` -- BullMQ processor for media. Currently skips video (marks COMPLETED immediately). Needs ffmpeg transcoding step
- `frontend/src/components/story/story-viewer.tsx` -- Full-screen video playback with progress, auto-advance. Pattern reusable for reels
- `frontend/src/components/story/story-viewer-content.tsx` -- Video element with play/pause/ended handlers
- `frontend/src/hooks/queries/post-queries.ts` -- useInfiniteQuery patterns for feed, useToggleLike, useToggleBookmark
- `frontend/src/components/post/post-actions.tsx` -- Like/comment/bookmark/share action buttons
- `frontend/src/components/post/post-card.tsx` -- Post display with linked items, caption, interactions
- `frontend/src/components/layout/bottom-nav.tsx` -- 5-tab nav (Home, Search, Create, Notifications, Profile)
- `packages/shared/src/constants/story.constants.ts` -- STORY_LIMITS pattern to follow for REEL_LIMITS

### Established Patterns
- Post interactions (like, bookmark, comment) via PostsModule -- reels should reuse, not duplicate
- useInfiniteQuery + cursor pagination for all feeds
- IntersectionObserver for infinite scroll sentinel and auto-read notifications
- Optimistic updates via cross-query-key helper (updatePostInQueries)
- class-validator DTOs (not nestjs-zod) per project convention
- Vietnamese error messages throughout

### Integration Points
- `backend/prisma/schema.prisma` -- Add postType to Post, add ReelMeta model
- `backend/src/feed/feed.service.ts` -- Add postType filter to existing feed, new reels feed method
- `backend/src/posts/posts.service.ts` -- Extend create to handle REEL type with ReelMeta
- `frontend/src/components/layout/bottom-nav.tsx` -- Replace Search with Reels tab
- `frontend/src/components/layout/header.tsx` -- Add search icon to header
- `frontend/src/app/(app)/page.tsx` -- Existing feed already needs postType='POST' filter
- `Dockerfile.backend` -- ffmpeg already installed (line 44)

</code_context>

<specifics>
## Specific Ideas

- Reels follow Instagram Reels pattern: full-screen vertical scroll, right-side action column, bottom-left author info
- Keep it simple for v1: upload-only creation (no in-app editing)
- Reels are technically Posts with a type discriminator to maximize code reuse (interactions, comments, bookmarks all work automatically)
- Bottom nav restructure: Search replaced by Reels, search moves to header

</specifics>

<deferred>
## Deferred Ideas

- In-app video trimming/editing -- v2 feature
- Music/audio overlay on reels -- v2 feature
- Reel duets/stitches (TikTok-style) -- v2 feature
- Algorithmic reel recommendations -- v2 (SOCL-V2-01 covers algorithmic feed)
- Reel analytics for creators -- v2 feature

</deferred>

---

*Phase: 10-reels*
*Context gathered: 2026-03-20*
