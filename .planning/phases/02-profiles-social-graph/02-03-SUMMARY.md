---
phase: 02-profiles-social-graph
plan: 03
subsystem: frontend, ui
tags: [nextjs, react, tanstack-query, shadcn, profile, avatar, username, signup, oauth-gate, instagram-layout]

# Dependency graph
requires:
  - phase: 02-profiles-social-graph/01
    provides: Prisma User model with username/bio/avatarId, shared ProfileResponse type, USERNAME_RULES, usernameSchema, bioSchema, PROFILE_LIMITS constants
  - phase: 02-profiles-social-graph/02
    provides: ProfilesController (GET /profiles/:username, PATCH /profiles/me, GET /profiles/check/:username), SocialController (POST/DELETE /social/follow/:userId)
  - phase: 01-foundation-auth/03
    provides: Frontend auth store, apiClient with silent refresh, useMe hook, signup/login forms, Toaster (sonner)
provides:
  - Profile page at /[username] with Instagram-style header (avatar, stats, bio, post grid)
  - ProfileEditModal with avatar upload, display name, username availability check, bio character counter
  - Profile query hooks: useProfile, useUpdateProfile, useCheckUsername
  - Signup form with @username field and real-time availability indicator
  - CompleteProfileForm and /complete-profile interstitial for OAuth users without username
  - Username gate in (app) layout redirecting users without username to /complete-profile
  - ProfileSkeleton loading state and ProfilePostGrid empty state
affects: [02-04, 03-content, 04-collections]

# Tech tracking
tech-stack:
  added: ["@radix-ui/react-avatar", "@radix-ui/react-dialog", "@radix-ui/react-scroll-area", "@radix-ui/react-separator", "@radix-ui/react-tabs"]
  patterns: [debounced-username-check, avatar-upload-with-preview, oauth-username-gate, instagram-style-profile-layout]

key-files:
  created:
    - frontend/src/hooks/queries/profile-queries.ts
    - frontend/src/components/profile/profile-header.tsx
    - frontend/src/components/profile/profile-stats.tsx
    - frontend/src/components/profile/profile-post-grid.tsx
    - frontend/src/components/profile/profile-skeleton.tsx
    - frontend/src/components/profile/profile-edit-modal.tsx
    - frontend/src/components/profile/complete-profile-form.tsx
    - frontend/src/app/(app)/[username]/page.tsx
    - frontend/src/app/(app)/[username]/loading.tsx
    - frontend/src/app/(app)/complete-profile/page.tsx
    - frontend/src/components/ui/avatar.tsx
    - frontend/src/components/ui/dialog.tsx
    - frontend/src/components/ui/textarea.tsx
    - frontend/src/components/ui/skeleton.tsx
    - frontend/src/components/ui/tabs.tsx
    - frontend/src/components/ui/separator.tsx
    - frontend/src/components/ui/scroll-area.tsx
  modified:
    - frontend/src/app/(app)/layout.tsx
    - frontend/src/components/auth/signup-form.tsx
    - frontend/src/hooks/queries/auth-queries.ts
    - packages/shared/src/dto/auth.dto.ts
    - frontend/package.json
    - pnpm-lock.yaml

key-decisions:
  - "ProfileEditModal uses shadcn Dialog (not Drawer) per user decision for modal/drawer overlay"
  - "Username availability check debounced 300ms before triggering API call, only when username differs from current"
  - "Shared signupSchema updated to include username field to match backend DTO (was missing)"
  - "App layout gates all (app) routes behind username: redirects to /complete-profile if user.username is null"
  - "Follow button rendered as placeholder with data-follow-placeholder attribute for Plan 02-04 to replace"

patterns-established:
  - "Debounced username check: 300ms setTimeout on input change, useCheckUsername only when length >= 3"
  - "OAuth user gate: layout-level redirect to interstitial page when required profile field is missing"
  - "Profile page pattern: useProfile hook -> ProfileHeader + Tabs + content, with edit modal state"
  - "Avatar upload flow: file input -> preview via createObjectURL -> POST /media/upload -> set avatarId"

requirements-completed: [PROF-01, PROF-02, PROF-03]

# Metrics
duration: 7min
completed: 2026-03-14
---

# Phase 2 Plan 3: Frontend Profile Experience Summary

**Instagram-style profile page with edit modal (avatar upload, username cooldown, bio counter), signup username collection with real-time availability check, and OAuth user complete-profile interstitial gate**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-13T21:13:08Z
- **Completed:** 2026-03-13T21:20:56Z
- **Tasks:** 2 auto + 1 checkpoint (auto-approved)
- **Files modified:** 21

## Accomplishments
- Built complete profile page at /[username] with Instagram-style layout: circular avatar, stats row (posts/followers/following with Vietnamese labels), display name, @username, bio, follow/edit buttons, "Theo doi ban" badge
- Built ProfileEditModal with avatar upload (preview + async media API), display name, username with debounced availability check, bio with 150-char counter, Vietnamese labels and toast notifications
- Updated signup form to collect @username with real-time availability indicator (green check / red X / spinner)
- Created /complete-profile interstitial that gates OAuth users without username from accessing the app
- Added 7 shadcn/ui components: avatar, dialog, textarea, skeleton, tabs, separator, scroll-area

## Task Commits

Each task was committed atomically:

1. **Task 1: Profile hooks, profile page, and profile header components** - `60f76f1` (feat)
2. **Task 2: Edit profile modal, signup username field, and complete-profile interstitial** - `e23e027` (feat)
3. **Task 3: Checkpoint (human-verify)** - Auto-approved in auto mode

## Files Created/Modified
- `frontend/src/hooks/queries/profile-queries.ts` - useProfile, useUpdateProfile, useCheckUsername hooks
- `frontend/src/components/profile/profile-header.tsx` - Instagram-style header with avatar, stats, buttons, badge
- `frontend/src/components/profile/profile-stats.tsx` - Posts/followers/following counts with number formatting
- `frontend/src/components/profile/profile-post-grid.tsx` - 3-column grid with empty state camera icon
- `frontend/src/components/profile/profile-skeleton.tsx` - Loading skeleton matching header layout
- `frontend/src/components/profile/profile-edit-modal.tsx` - Full edit modal with avatar upload and form validation
- `frontend/src/components/profile/complete-profile-form.tsx` - Username collection form for OAuth users
- `frontend/src/app/(app)/[username]/page.tsx` - Profile page with tabs and edit modal state
- `frontend/src/app/(app)/[username]/loading.tsx` - Next.js loading state using ProfileSkeleton
- `frontend/src/app/(app)/complete-profile/page.tsx` - Complete-profile interstitial page
- `frontend/src/app/(app)/layout.tsx` - Added username gate with /complete-profile redirect
- `frontend/src/components/auth/signup-form.tsx` - Added username field with availability check
- `frontend/src/hooks/queries/auth-queries.ts` - Updated signup mutation to include username
- `packages/shared/src/dto/auth.dto.ts` - Added username field to signupSchema

## Decisions Made
- **Dialog over Drawer for edit modal:** Used shadcn Dialog per user decision from CONTEXT.md. Works well on both desktop and mobile with responsive sizing.
- **Debounced username check (300ms):** Prevents excessive API calls during typing while still feeling responsive. Only triggers when username length >= 3 and differs from current.
- **Follow button as placeholder:** Rendered with `data-follow-placeholder` attribute so Plan 02-04 can identify and replace it with the real FollowButton that has optimistic updates.
- **Shared signupSchema fix:** Added username to the Zod schema to match the backend DTO that already expected it.
- **min-h-dvh over min-h-screen:** Updated loading spinner in app layout per baseline-ui rules.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added username to shared signupSchema**
- **Found during:** Task 2 (Signup form username field)
- **Issue:** The shared `signupSchema` in `auth.dto.ts` did not include the `username` field, but the backend `SignupDto` class-validator DTO already required it. The frontend would send incomplete data without this fix.
- **Fix:** Added `username: usernameSchema` to the shared signupSchema, importing usernameSchema from validators.
- **Files modified:** `packages/shared/src/dto/auth.dto.ts`
- **Verification:** `pnpm turbo build` passes for all 3 workspaces
- **Committed in:** e23e027 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix to align shared validation schema with backend DTO. No scope creep.

## Issues Encountered
None - all builds passed on first attempt after implementation.

## User Setup Required
None - no external service configuration required. All frontend components use existing API endpoints from Plans 02-01 and 02-02.

## Next Phase Readiness
- Profile page ready for Plan 02-04 to add real FollowButton with optimistic updates (replacing placeholder)
- Profile page ready for Plan 02-04 to add follower/following list pages at /[username]/followers and /[username]/following
- Post grid component ready to receive real post data in Phase 3 (currently shows empty state)
- Tabs component ready for "Bo suu tap" (Collection) tab in Phase 4
- All API integration points are working through apiClient with auth interceptor

## Self-Check: PASSED

- All 18 created files exist on disk
- All 4 modified files verified
- Commit 60f76f1 (Task 1) verified in git log
- Commit e23e027 (Task 2) verified in git log
- `pnpm turbo build` passes for all 3 workspaces (shared, backend, frontend)

---
*Phase: 02-profiles-social-graph*
*Completed: 2026-03-14*
