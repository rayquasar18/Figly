---
phase: 02-profiles-social-graph
plan: 04
subsystem: frontend, ui, social
tags: [nextjs, react, tanstack-query, shadcn, follow-button, optimistic-ui, infinite-scroll, cursor-pagination]

# Dependency graph
requires:
  - phase: 02-profiles-social-graph/01
    provides: Prisma User/Follow models, shared ProfileResponse/UserListItem/PaginatedResponse types, social API endpoints schema
  - phase: 02-profiles-social-graph/02
    provides: SocialController (POST/DELETE /social/follow/:userId, GET /social/:username/followers, GET /social/:username/following, DELETE /social/followers/:userId)
  - phase: 02-profiles-social-graph/03
    provides: ProfileHeader with placeholder follow button, profile query hooks, avatar/dialog/scroll-area UI components
provides:
  - FollowButton component with optimistic UI (filled "Theo doi" / outline "Dang theo doi" with hover destructive styling)
  - Social query hooks (useFollowMutation, useUnfollowMutation, useFollowers, useFollowing, useRemoveFollowerMutation)
  - UserRow component with avatar, display name, @username link, and action button
  - FollowerList with debounced search, IntersectionObserver infinite scroll, skeleton loading, Vietnamese empty states
  - Followers page at /[username]/followers and following page at /[username]/following
  - Real FollowButton wired into ProfileHeader replacing placeholder
affects: [03-content, 04-collections]

# Tech tracking
tech-stack:
  added: []
  patterns: [optimistic-mutation-with-rollback, intersection-observer-infinite-scroll, debounced-search-filter, conditional-hooks-by-type]

key-files:
  created:
    - frontend/src/hooks/queries/social-queries.ts
    - frontend/src/components/social/follow-button.tsx
    - frontend/src/components/social/user-row.tsx
    - frontend/src/components/social/follower-list.tsx
    - frontend/src/app/(app)/[username]/followers/page.tsx
    - frontend/src/app/(app)/[username]/following/page.tsx
  modified:
    - frontend/src/components/profile/profile-header.tsx

key-decisions:
  - "FollowButton hover shows destructive styling (red text + light red bg) for visual unfollow confirmation cue"
  - "FollowerList uses conditional hook call (useFollowers vs useFollowing) based on type prop"
  - "IntersectionObserver with 0.1 threshold on sentinel div for reliable infinite scroll trigger"
  - "Remove follower uses destructive 'Go' button text per plan specification"

patterns-established:
  - "Optimistic mutation: cancel queries, snapshot, update cache, rollback on error, invalidate on settled"
  - "IntersectionObserver infinite scroll: sentinel div at end of list, observe/disconnect in useEffect cleanup"
  - "Debounced search: local state + 300ms setTimeout for debounced value passed to query hook"

requirements-completed: [SOCL-01, SOCL-02]

# Metrics
duration: 3min
completed: 2026-03-14
---

# Phase 2 Plan 4: Social Graph Frontend Summary

**Follow/unfollow button with optimistic cache updates, follower/following list pages with debounced search and IntersectionObserver infinite scroll, remove-follower capability, and real FollowButton wired into ProfileHeader**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-13T21:25:41Z
- **Completed:** 2026-03-13T21:29:05Z
- **Tasks:** 2 auto + 1 checkpoint (auto-approved)
- **Files modified:** 7

## Accomplishments
- Built FollowButton with filled/outline toggle states, hover destructive styling for unfollow, and disabled state during pending mutations
- Created social-queries.ts with 5 hooks: useFollowMutation and useUnfollowMutation with full optimistic update and rollback, useFollowers and useFollowing with cursor-based infinite queries, and useRemoveFollowerMutation
- Built FollowerList with debounced search input, IntersectionObserver-based infinite scroll, skeleton loading rows, and Vietnamese empty state messages
- Created UserRow with avatar, linked display name and @username, and conditional FollowButton or destructive "Go" remove button
- Created /[username]/followers and /[username]/following pages with back navigation and Vietnamese headings
- Replaced placeholder follow button in ProfileHeader with real FollowButton passing profile.id, profile.username, and profile.isFollowing

## Task Commits

Each task was committed atomically:

1. **Task 1: Social query hooks and follow button with optimistic UI** - `9805ed5` (feat)
2. **Task 2: Follower and following list pages with search and user rows** - `769833d` (feat)
3. **Task 3: Checkpoint (human-verify)** - Auto-approved in auto mode

## Files Created/Modified
- `frontend/src/hooks/queries/social-queries.ts` - useFollowMutation, useUnfollowMutation, useFollowers, useFollowing, useRemoveFollowerMutation hooks with optimistic updates
- `frontend/src/components/social/follow-button.tsx` - Follow/unfollow toggle button with filled/outline variants and hover destructive styling
- `frontend/src/components/social/user-row.tsx` - User row with avatar, name link, and FollowButton or "Go" remove action
- `frontend/src/components/social/follower-list.tsx` - Paginated list with debounced search, infinite scroll, skeleton loading, empty states
- `frontend/src/app/(app)/[username]/followers/page.tsx` - Followers page at /{username}/followers
- `frontend/src/app/(app)/[username]/following/page.tsx` - Following page at /{username}/following
- `frontend/src/components/profile/profile-header.tsx` - Replaced placeholder with real FollowButton

## Decisions Made
- **Hover destructive styling for unfollow:** FollowButton shows red text and light red background on hover when in "Dang theo doi" (Following) state, giving clear visual cue that clicking will unfollow. Uses Tailwind classes on the outline variant.
- **Conditional hook by type prop:** FollowerList calls useFollowers or useFollowing based on the `type` prop rather than duplicating components. Both hooks share the same infinite query pattern.
- **IntersectionObserver for infinite scroll:** Used native IntersectionObserver API with a sentinel div element instead of scroll event listeners, which is more performant and avoids throttling issues.
- **Destructive "Go" button for remove:** Own followers list shows a destructive-styled "Go" button per plan specification for removing followers.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None - all builds passed on first attempt after implementation.

## User Setup Required
None - no external service configuration required. All frontend components use existing API endpoints from Plans 02-01 and 02-02.

## Next Phase Readiness
- Social graph frontend is complete: follow/unfollow with optimistic UI, followers/following list pages with search and pagination
- Profile page now has full social functionality: FollowButton, "Theo doi ban" badge, linked follower/following counts
- Ready for Phase 3 (Content) to populate the post grid and feed
- Ready for Phase 4 (Collections) to add collection tabs to profile page

## Self-Check: PASSED

- All 6 created files exist on disk
- 1 modified file (profile-header.tsx) verified
- Commit 9805ed5 (Task 1) verified in git log
- Commit 769833d (Task 2) verified in git log
- `pnpm turbo build` passes for all 3 workspaces (shared, backend, frontend)

---
*Phase: 02-profiles-social-graph*
*Completed: 2026-03-14*
