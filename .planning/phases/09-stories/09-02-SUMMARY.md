---
phase: 09-stories
plan: 02
subsystem: ui
tags: [react, tanstack-query, zustand, tailwind, stories, instagram-style]

# Dependency graph
requires:
  - phase: 09-stories-01
    provides: Stories backend API (CRUD, feed, view tracking, cleanup)
provides:
  - StoryBar component with horizontal scroll and gradient/gray avatar rings
  - StoryAvatar component with add-button and user variants
  - StoryViewer full-screen overlay with progress bars, tap/keyboard navigation, auto-advance
  - StoryViewerContent for image/video rendering
  - CreateStoryFlow for story creation with validation and upload
  - TanStack Query hooks for stories API (feed, create, delete, markViewed, viewers)
  - Zustand store for create-story flow state management
  - story-progress CSS keyframe animation
affects: [10-reels, feed-improvements]

# Tech tracking
tech-stack:
  added: []
  patterns: [instagram-story-ring-gradient, css-animation-auto-advance, touch-zone-split-40-60]

key-files:
  created:
    - frontend/src/hooks/queries/story-queries.ts
    - frontend/src/stores/create-story-store.ts
    - frontend/src/components/story/story-bar.tsx
    - frontend/src/components/story/story-avatar.tsx
    - frontend/src/components/story/story-viewer.tsx
    - frontend/src/components/story/story-viewer-content.tsx
    - frontend/src/components/story/create-story-flow.tsx
  modified:
    - frontend/tailwind.config.ts
    - frontend/src/app/(app)/page.tsx
    - frontend/src/app/globals.css

key-decisions:
  - "apiClient from @/lib/api-client used instead of plan's api from @/lib/api to match existing project convention"
  - "Progress bar auto-advance via CSS animation onAnimationEnd for images, onEnded for video"
  - "Story viewer keyboard navigation: ArrowLeft/ArrowRight/Escape for desktop UX"
  - "Delete confirmation uses shadcn AlertDialog with Vietnamese copy"

patterns-established:
  - "Instagram-style gradient ring: bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 for unviewed stories"
  - "Touch zone split: left 40% previous, right 60% next for story viewer navigation"
  - "CSS keyframe animation with onAnimationEnd callback for timed auto-advance"
  - "scrollbar-hide CSS utility class for hidden horizontal scrollbars"

requirements-completed: [CONT-08, CONT-09]

# Metrics
duration: 4min
completed: 2026-03-20
---

# Phase 9 Plan 02: Stories Frontend Summary

**Complete story UI with StoryBar, gradient-ring avatars, full-screen viewer with progress bars and tap navigation, and CreateStoryFlow with media upload**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-20T09:51:14Z
- **Completed:** 2026-03-20T09:55:14Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- StoryBar renders at top of feed page with "+" add button and user avatars with gradient (unviewed) or gray (viewed) rings
- Full-screen StoryViewer with progress bars, CSS animation auto-advance (5s images), video onEnded auto-advance, tap navigation (40/60 split), keyboard support, mark-as-viewed, and delete confirmation
- CreateStoryFlow handles image/video selection with size/duration validation, upload via /media/upload, and story creation via POST /stories
- TanStack Query hooks and Zustand store following existing project patterns with memory leak prevention

## Task Commits

Each task was committed atomically:

1. **Task 1: Story query hooks, Zustand store, and tailwind config extension** - `ec68e32` (feat)
2. **Task 2: Story UI components and feed page integration** - `b74300e` (feat)

## Files Created/Modified
- `frontend/src/hooks/queries/story-queries.ts` - TanStack Query hooks: useStoryFeed, useCreateStory, useDeleteStory, useMarkStoryViewed, useStoryViewers
- `frontend/src/stores/create-story-store.ts` - Zustand store for create-story flow with URL.revokeObjectURL cleanup
- `frontend/src/components/story/story-bar.tsx` - Horizontal scrollable story avatar bar with skeleton loading
- `frontend/src/components/story/story-avatar.tsx` - Story avatar with gradient/gray ring and add-button variant
- `frontend/src/components/story/story-viewer.tsx` - Full-screen story viewer overlay with progress bars, navigation, delete
- `frontend/src/components/story/story-viewer-content.tsx` - Single story image/video renderer
- `frontend/src/components/story/create-story-flow.tsx` - Story creation overlay with file picker, validation, upload
- `frontend/tailwind.config.ts` - Added story-progress keyframe animation
- `frontend/src/app/(app)/page.tsx` - Added StoryBar and CreateStoryFlow to feed page
- `frontend/src/app/globals.css` - Added scrollbar-hide CSS utility

## Decisions Made
- Used `apiClient` from `@/lib/api-client` instead of plan's `api` from `@/lib/api` to match existing project convention (auto-fixed, Rule 1)
- Progress bar auto-advance uses CSS animation `onAnimationEnd` for images (5s) and video `onEnded` event
- Story viewer keyboard navigation with ArrowLeft/ArrowRight/Escape for desktop users
- Delete confirmation uses shadcn AlertDialog with Vietnamese copy matching UI spec
- View count display shows generic "Luot xem" label for own stories

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed API client import to match project convention**
- **Found during:** Task 1 (Story query hooks)
- **Issue:** Plan specified `api` from `@/lib/api` but project uses `apiClient` from `@/lib/api-client`
- **Fix:** Used `apiClient` from `@/lib/api-client` throughout all hooks and components
- **Files modified:** frontend/src/hooks/queries/story-queries.ts, frontend/src/components/story/create-story-flow.tsx
- **Verification:** TypeScript compiles cleanly
- **Committed in:** ec68e32 (Task 1), b74300e (Task 2)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Essential for project consistency. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Stories frontend complete, ready for Phase 10 (Reels) or any subsequent phases
- Story viewer can be extended with swipe gestures and unmute toggle for video in future iterations

---
*Phase: 09-stories*
*Completed: 2026-03-20*

## Self-Check: PASSED

All 8 created files verified on disk. Both task commits (ec68e32, b74300e) verified in git log.
