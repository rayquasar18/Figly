---
phase: 03-content-feed
plan: 04
subsystem: ui
tags: [react, next.js, tanstack-query, optimistic-ui, feed, carousel, comments, bookmarks, shadcn]

requires:
  - phase: 01-foundation-auth
    provides: Auth store, API client with 401 interceptor, Avatar component
  - phase: 02-profiles-social-graph
    provides: Profile pages, follower list IntersectionObserver pattern, social-queries optimistic pattern
  - phase: 03-content-feed plan 01
    provides: Post, Comment, Like, Bookmark Prisma models; shared DTOs/types/constants (PostResponse, CommentResponse, POST_LIMITS)
  - phase: 03-content-feed plan 02
    provides: PostsModule API (CRUD, like/bookmark toggle), CommentsModule (threaded), FeedModule (chronological)
provides:
  - Feed page replacing placeholder dashboard with infinite scroll
  - PostCard with carousel, double-tap like, heart animation, caption with hashtags/@mentions
  - PostDetailModal for desktop (image left, comments right) and full-page mobile view
  - Like/unlike and bookmark/unbookmark with optimistic UI across all query keys
  - CommentList with 1-level threading, reply support, and inline delete
  - PostMenu for edit caption inline and delete post with confirmation
  - Saved posts page at /saved with grid view
  - ProfilePostGrid wired to real API data via useUserPosts
  - post-queries (useFeed, usePostDetail, useUserPosts, useCreatePost, useSavedPosts)
  - interaction-queries (useLikeMutation, useUnlikeMutation, useBookmarkMutation, useUnbookmarkMutation, useUpdateCaption, useDeletePost)
  - comment-queries (useComments, useCreateComment, useDeleteComment)
affects: [04-collections, 05-discovery, 06-search]

tech-stack:
  added: []
  patterns:
    - "updatePostInQueries helper for cross-query-key optimistic updates (feed, userPosts, savedPosts, post detail)"
    - "PostCarousel: single image renders plain, multi-image uses shadcn Carousel with dot indicators"
    - "Double-tap like detection via lastTapRef with 300ms threshold"
    - "Desktop modal vs mobile full-page via window.innerWidth check"
    - "CaptionDisplay parses #hashtags and @mentions with Unicode-aware regex"

key-files:
  created:
    - frontend/src/hooks/queries/post-queries.ts
    - frontend/src/hooks/queries/interaction-queries.ts
    - frontend/src/hooks/queries/comment-queries.ts
    - frontend/src/components/post/post-card.tsx
    - frontend/src/components/post/post-carousel.tsx
    - frontend/src/components/post/post-actions.tsx
    - frontend/src/components/post/post-detail-modal.tsx
    - frontend/src/components/post/post-menu.tsx
    - frontend/src/components/post/caption-display.tsx
    - frontend/src/components/comment/comment-list.tsx
    - frontend/src/components/comment/comment-item.tsx
    - frontend/src/components/comment/comment-input.tsx
    - frontend/src/components/feed/feed-list.tsx
    - frontend/src/components/feed/feed-skeleton.tsx
    - frontend/src/components/feed/empty-feed.tsx
    - frontend/src/app/(app)/post/[postId]/page.tsx
    - frontend/src/app/(app)/saved/page.tsx
  modified:
    - frontend/src/app/(app)/page.tsx
    - frontend/src/components/profile/profile-post-grid.tsx
    - frontend/src/app/(app)/[username]/page.tsx

key-decisions:
  - "post-queries.ts created in this plan since 03-03 runs in parallel (wave 3) -- Rule 3 auto-fix for missing dependency"
  - "Desktop modal vs mobile navigation via window.innerWidth >= 768 check instead of CSS media queries for JS-level routing decision"
  - "updatePostInQueries helper updates feed, userPosts, savedPosts, and post detail queries in one call to prevent like/bookmark state mismatch"
  - "Heart burst animation uses CSS @keyframes with scale + opacity for smooth like feedback"
  - "CommentItem reply button passes parent's parentId or own ID to flatten replies to 1 level (matching backend behavior)"

patterns-established:
  - "Cross-query-key optimistic update: updatePostInQueries helper iterates all query types to keep UI consistent"
  - "Desktop modal + mobile full-page routing pattern: check viewport width, open Dialog or router.push"
  - "Double-tap detection: lastTapRef + 300ms threshold, trigger action and show animation"
  - "Infinite scroll sentinel div with IntersectionObserver (reused from follower-list)"
  - "PostMenu edit mode: inline Textarea replacing caption with Save/Cancel buttons"

requirements-completed: [CONT-04, CONT-05, INTR-01, INTR-02, INTR-03, INTR-04, INTR-05, SOCL-03]

duration: 12min
completed: 2026-03-14
---

# Phase 3 Plan 4: Frontend Feed & Interactions Summary

**Complete feed UI with infinite scroll, post cards with carousel and optimistic like/bookmark, post detail modal/page with threaded comments, post management (edit/delete), saved posts page, and profile grid wired to API**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-14T09:49:20Z
- **Completed:** 2026-03-14T10:01:45Z
- **Tasks:** 2
- **Files modified:** 21

## Accomplishments
- Feed page replaces placeholder dashboard with chronological infinite scroll using useFeed + IntersectionObserver
- PostCard with author header, shadcn Carousel for multi-image posts, double-tap to like with CSS heart animation, optimistic like/bookmark toggle across all query keys
- PostDetailModal on desktop (image left, comments/actions right) and full-page mobile view at /post/[postId]
- Threaded comments (1-level deep) with reply support, @mention rendering, and inline delete
- PostMenu for own posts: inline caption editing and AlertDialog delete confirmation
- Saved posts page at /saved with 3-column grid view
- ProfilePostGrid wired to real API data via useUserPosts with infinite scroll
- CaptionDisplay with clickable #hashtags and @mentions using Unicode-aware regex

## Task Commits

Each task was committed atomically:

1. **Task 1: Feed page, post card with carousel, interactions hooks with optimistic UI** - `1606d7c` (feat)
2. **Task 2: Post detail modal/page, comments, post management, saved posts, profile grid wiring** - `a1eda5c` (feat)

## Files Created/Modified
- `frontend/src/hooks/queries/post-queries.ts` - useFeed, usePostDetail, useUserPosts, useCreatePost, useSavedPosts
- `frontend/src/hooks/queries/interaction-queries.ts` - useLikeMutation, useUnlikeMutation, useBookmarkMutation, useUnbookmarkMutation, useUpdateCaption, useDeletePost with cross-query optimistic updates
- `frontend/src/hooks/queries/comment-queries.ts` - useComments, useCreateComment, useDeleteComment
- `frontend/src/components/post/post-card.tsx` - Feed post card with author, carousel, double-tap like, actions, caption
- `frontend/src/components/post/post-carousel.tsx` - Single image or multi-image carousel with dot indicators
- `frontend/src/components/post/post-actions.tsx` - Like, comment, bookmark action buttons
- `frontend/src/components/post/post-detail-modal.tsx` - Desktop modal with image left, comments/info right
- `frontend/src/components/post/post-menu.tsx` - Three-dot dropdown with edit caption and delete post
- `frontend/src/components/post/caption-display.tsx` - Caption with clickable hashtags and @mentions, truncation toggle
- `frontend/src/components/comment/comment-list.tsx` - Paginated comment thread with reply state management
- `frontend/src/components/comment/comment-item.tsx` - Single comment with replies, @mention rendering, delete
- `frontend/src/components/comment/comment-input.tsx` - Textarea with reply prefix, keyboard submit
- `frontend/src/components/feed/feed-list.tsx` - Infinite scroll feed container with IntersectionObserver
- `frontend/src/components/feed/feed-skeleton.tsx` - 3 loading skeleton cards matching post card layout
- `frontend/src/components/feed/empty-feed.tsx` - Empty state with "Theo doi nguoi khac" message
- `frontend/src/app/(app)/page.tsx` - Feed page replacing placeholder dashboard
- `frontend/src/app/(app)/post/[postId]/page.tsx` - Mobile full-page post detail
- `frontend/src/app/(app)/saved/page.tsx` - Saved/bookmarked posts page
- `frontend/src/components/profile/profile-post-grid.tsx` - Wired to useUserPosts, 3-column grid with modal/navigation
- `frontend/src/app/(app)/[username]/page.tsx` - Updated ProfilePostGrid usage to pass username prop

## Decisions Made
- Created post-queries.ts in this plan since Plan 03-03 (which was supposed to create it) runs in the same wave and hadn't executed yet. The hook interfaces match the plan's specification exactly.
- Desktop modal vs mobile navigation uses window.innerWidth >= 768 check at click time rather than CSS media queries, since the routing decision (open Dialog vs router.push) is JavaScript-level
- updatePostInQueries helper updates feed, userPosts, savedPosts, AND single post detail queries in one call, preventing like/bookmark state inconsistency across views
- Heart burst animation uses CSS @keyframes with scale 0 -> 1.2 -> 1 -> fade out for smooth, Instagram-like feedback
- Comment reply button passes the root parent ID to ensure replies stay at 1 level deep (matching backend flattening logic)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created post-queries.ts missing from Plan 03-03**
- **Found during:** Task 1 (pre-execution analysis)
- **Issue:** Plan 03-04 requires useFeed, usePostDetail, useUserPosts, useCreatePost hooks from post-queries.ts, but Plan 03-03 (which creates it) is in the same wave and hadn't executed yet
- **Fix:** Created post-queries.ts with all required hooks matching the interfaces spec in the plan context
- **Files modified:** frontend/src/hooks/queries/post-queries.ts
- **Verification:** Build passes, all hooks match expected interfaces
- **Committed in:** 1606d7c (Task 1 commit)

**2. [Rule 1 - Bug] Fixed VisuallyHidden import in placeholder PostDetailModal**
- **Found during:** Task 1 (build verification)
- **Issue:** Used @radix-ui/react-visually-hidden which isn't installed as a direct dependency
- **Fix:** Replaced with className="sr-only" on DialogTitle for accessibility
- **Files modified:** frontend/src/components/post/post-detail-modal.tsx
- **Verification:** Build passes
- **Committed in:** 1606d7c (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for build success. No scope creep.

## Issues Encountered
- Turbo cache caused false build failure on second build (cached old result); resolved by running `pnpm turbo build --force` with clean .next directory

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All frontend feed and interaction UI complete, ready for Phase 4 (Collections)
- Post creation flow (Plan 03-03) components exist on disk from parallel execution
- Feed page, post detail, comments, saved posts, profile grid all functional
- Optimistic UI patterns established for like/bookmark/comment can be reused in future phases

---
*Phase: 03-content-feed*
*Completed: 2026-03-14*

## Self-Check: PASSED

- All 20 created/modified files verified present on disk
- Commit 1606d7c (Task 1) verified in git log
- Commit a1eda5c (Task 2) verified in git log
