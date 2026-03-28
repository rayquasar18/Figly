---
phase: 07-moderation-safety
verified: 2026-03-15T08:00:00Z
status: passed
score: 17/17 must-haves verified
re_verification: true
gaps: []
human_verification:
  - test: "Block flow — bidirectional content hiding"
    expected: "After User A blocks User B, User A does not see User B's posts in feed or profile grid, and User B cannot view User A's profile (sees 404/not found)"
    why_human: "Cannot programmatically test bidirectional hide without running the app against a real database"
  - test: "Mute flow — feed only"
    expected: "After User A mutes User B, User B's posts disappear from User A's personal feed, but User B still appears in comments, search results, and User A can still view User B's profile"
    why_human: "Scoped filtering behavior requires running the app"
  - test: "Ban flow — login rejection"
    expected: "After an admin bans a user, that user cannot log in via email/password, Google OAuth, or Apple OAuth; any active sessions expire within the 15-minute JWT window"
    why_human: "Requires real auth flow with actual OAuth providers"
  - test: "Report dialog Vietnamese text"
    expected: "Report dialog shows all 7 reason categories with correct Vietnamese labels from REPORT_REASONS constant"
    why_human: "Visual/UI verification only"
  - test: "Admin page role gate"
    expected: "Non-admin users who navigate to /admin are redirected to / immediately; admin users see the report queue"
    why_human: "Requires browser navigation test"
---

# Phase 7: Moderation & Safety Verification Report

**Phase Goal:** Users can protect themselves from unwanted interactions, and admins can act on reported content to keep the community safe
**Verified:** 2026-03-15T08:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Plan 07-01 Backend)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can report a post or user with a predefined reason category | VERIFIED | `ModerationService.createReport()` with `ReportReason` enum; `ModerationController` POST /moderation/report; `ReportDialog` calls `useReport` mutation |
| 2 | User can block another user, hiding all content bidirectionally and auto-unfollowing | VERIFIED | `blockUser()` uses `$transaction` to create Block + deleteMany follows both directions; `getBlockedUserIds()` queries both blocker and blocked sides |
| 3 | User can mute another user, removing their posts from personal feed only | VERIFIED | `muteUser()` creates Mute record; `getMutedUserIds()` queries muter-side only; feed integration confirmed in `FeedService.getFeed()` with muted exclusion; comments/profiles/search intentionally NOT filtered for mute |
| 4 | Admin can view a queue of pending reports sorted by newest/most reported | VERIFIED | `AdminService.getReportQueue()` supports `newest` and `most_reported` sort with cursor pagination; `ReportQueue` component with sort toggle wired to `useReportQueue` |
| 5 | Admin can dismiss, warn, remove content, or ban users from the queue | PARTIAL | `dismissReport`, `warnUser`, `removeContent`, `banUser` in AdminService all verified. `admin-actions.tsx` (from report queue) correctly passes `report.id`. However `post-menu.tsx` inline admin "Xoa bai viet" passes `post.id` as `reportId` — will 404 at runtime |
| 6 | Blocked users' content is hidden from feed, posts, comments, profiles, search, and notifications | VERIFIED | FeedService: `userId: { notIn: excludeFromFeed }` + `user: { isBanned: false }`; PostsService: block check on `getPost`, `getUserPosts`, `getSavedPosts`, `getPostsByHashtag`; CommentsService: `userId: { notIn: blockedIds }`; ProfilesService: `isBlocked` check throws NotFoundException; SearchService: delegates to `profilesService.searchProfiles` which has `id: { notIn: blockedIds }` + `isBanned: false`; NotificationsProcessor: `isBlocked` guard skips delivery |
| 7 | Muted users' posts are hidden from personal feed only (not from profiles, comments, search) | VERIFIED | Only `FeedService.getFeed()` uses `getMutedUserIds`. CommentsService, ProfilesService, SearchService confirmed not to filter muted users |
| 8 | Banned users cannot log in via any auth method | VERIFIED | `validateUser` line 90: `if (user.isBanned) throw ForbiddenException`; `handleGoogleLogin` lines 380/392: ban check; `handleAppleLogin` lines 424/436: ban check; `refreshTokens` lines 199-204: ban check + deletes tokens; `JwtStrategy.validate` line 32: `if (user?.isBanned) throw UnauthorizedException` |

**Score (Plan 07-01): 7/8 truths verified** (Truth 5 is partial due to the post-menu inline remove bug)

### Observable Truths (Plan 07-02 Frontend)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User sees Report option in three-dot menu on other users' posts | VERIFIED | `post-menu.tsx` shows "Bao cao bai viet" with Flag icon for non-own posts; renders `ReportDialog` |
| 2 | User sees Block and Mute options in three-dot menu on other users' profiles | VERIFIED | `profile-header.tsx` renders `UserActionMenu` for non-own profiles; `user-action-menu.tsx` has Block/Mute items |
| 3 | Report dialog shows predefined reason categories in Vietnamese and submits successfully with toast confirmation | VERIFIED | `report-dialog.tsx` uses `REPORT_REASONS` from `@figly/shared`, RadioGroup for selection, `useReport` mutation with `toast.success` on success; dialog closes on success |
| 4 | Block shows confirmation dialog with Vietnamese text explaining consequences, then hides the user's content | VERIFIED | `block-confirm-dialog.tsx` has full Vietnamese consequence text; calls `useBlockUser` which invalidates feed/profile/search queries on success |
| 5 | Mute is instant toggle with no confirmation dialog | VERIFIED | `user-action-menu.tsx` `handleMuteAction` calls `useMuteUser` / `useUnmuteUser` directly with no confirmation dialog |
| 6 | User can manage blocked and muted users from settings page with unblock/unmute per entry | VERIFIED | `/settings/blocked/page.tsx` lists `useBlockedUsers` with "Bo chan" buttons calling `useUnblockUser`; `/settings/muted/page.tsx` lists `useMutedUsers` with "Bat tieng" buttons calling `useUnmuteUser`; both have infinite scroll |
| 7 | Admin sees dedicated /admin page with report queue sorted by newest or most reported | VERIFIED | `admin/page.tsx` role-gates with redirect; renders `ReportQueue` component with sort toggle buttons ("Moi nhat" / "Nhieu bao cao nhat") |
| 8 | Admin can take actions (dismiss, warn, remove content, ban) from report cards | PARTIAL | `admin-actions.tsx` in report queue: all 4 actions correctly wired with `report.id`. BUT `post-menu.tsx` inline "Xoa bai viet" admin action passes `post.id` as `reportId` to `useRemoveContent` — will always 404 |
| 9 | Admin sees inline admin controls (warn/ban/remove) on posts and profiles when logged in as ADMIN | VERIFIED | `post-menu.tsx`: admin section with remove/warn/ban visible when `isAdmin`. `user-action-menu.tsx`: admin section with warn/ban visible when `currentUser.role === 'ADMIN'` |

**Score (Plan 07-02): 8/9 truths verified** (Truth 8 is partial due to the same post-menu bug)

---

## Required Artifacts

### Plan 07-01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `backend/prisma/schema.prisma` | Report, Block, Mute models, UserRole enum, isBanned/warningCount fields | VERIFIED | All 4 enums present (UserRole, ReportReason, ReportStatus, ReportTargetType); Report model with @@unique + @@index; Block + Mute models with correct constraints; User extended with role, isBanned, warningCount, bannedAt |
| `backend/src/moderation/moderation.service.ts` | Report CRUD, block/unblock with auto-unfollow, mute/unmute, blocked/muted ID helpers | VERIFIED | 241 lines; all methods implemented: createReport (P2002 upsert), blockUser ($transaction with follow cleanup), unblockUser (P2025 safe), muteUser/unmuteUser (idempotent), getBlockedUserIds (bidirectional), getMutedUserIds, getBlockedUsers/getMutedUsers (paginated), isBlocked/isMuted |
| `backend/src/admin/admin.service.ts` | Report queue listing, dismiss/warn/remove-content/ban actions | VERIFIED | 208 lines; getReportQueue with newest/most_reported sort; dismissReport (DISMISSED + resolvedById + resolvedAt); removeContent (delete post + ACTIONED, throws for USER type); warnUser (warningCount increment); banUser (isBanned + bannedAt + deleteMany RefreshTokens) |
| `backend/src/admin/guards/admin.guard.ts` | NestJS guard checking User.role === ADMIN | VERIFIED | Database-backed role check; ForbiddenException('Khong co quyen quan tri') on non-ADMIN |
| `packages/shared/src/types/moderation.types.ts` | ReportResponse, BlockedUserResponse, MutedUserResponse types | VERIFIED | All 3 types present plus ReportQueueItem and AdminActionResponse |

### Plan 07-02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `frontend/src/hooks/queries/moderation-queries.ts` | useReport, useBlockUser, useUnblockUser, useMuteUser, useUnmuteUser, useBlockedUsers, useMutedUsers | VERIFIED | All 9 hooks present (plus useBlockStatus, useMuteStatus); all wired to correct API endpoints with query invalidation and Vietnamese toasts |
| `frontend/src/hooks/queries/admin-queries.ts` | useReportQueue, useDismissReport, useRemoveContent, useWarnUser, useBanUser | VERIFIED | All 5 hooks present; infinite query for report queue with sort param; mutations wired to /admin/* endpoints |
| `frontend/src/components/moderation/report-dialog.tsx` | Report dialog with reason radio group and submit | VERIFIED | Uses REPORT_REASONS from shared; RadioGroup with Vietnamese labels; submit button disabled until reason selected; closes on success |
| `frontend/src/components/moderation/block-confirm-dialog.tsx` | Block confirmation AlertDialog with Vietnamese consequence text | VERIFIED | Full Vietnamese consequence text present; calls useBlockUser; closes on success |
| `frontend/src/components/moderation/user-action-menu.tsx` | Three-dot DropdownMenu with report/block/mute + admin warn/ban | VERIFIED | Block/Mute/Report for all users; admin section (warn/ban) gated on `currentUser.role === 'ADMIN'`; ReportDialog and BlockConfirmDialog rendered inline |
| `frontend/src/app/(app)/admin/page.tsx` | Admin moderation queue page | VERIFIED | Role gate with redirect to /; renders ReportQueue; Vietnamese title "Quan ly bao cao" |
| `frontend/src/app/(app)/settings/blocked/page.tsx` | Blocked users list with unblock buttons | VERIFIED | Infinite scroll with IntersectionObserver; "Bo chan" buttons; empty state with ShieldOff icon |
| `frontend/src/app/(app)/settings/muted/page.tsx` | Muted users list with unmute buttons | VERIFIED | Infinite scroll; "Bat tieng" buttons; empty state with Volume2 icon |
| `packages/shared/src/types/user.types.ts` | PublicUser type extended with optional role field | VERIFIED | `role?: 'USER' | 'ADMIN'` present on PublicUser interface |

---

## Key Link Verification

### Plan 07-01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `feed/feed.service.ts` | `moderation/moderation.service.ts` | `moderationService.get(Blocked|Muted)UserIds` before feed queries | VERIFIED | Lines 18-22: `Promise.all([getBlockedUserIds, getMutedUserIds])` combined into `excludeFromFeed`; applied as `userId: { notIn: excludeFromFeed }` |
| `posts/posts.service.ts` | `moderation/moderation.service.ts` | `moderationService.getBlockedUserIds` for post/comment visibility | VERIFIED | Lines 132, 333, 423, 536: getBlockedUserIds called in getPost, getUserPosts, getSavedPosts, getPostsByHashtag |
| `auth/auth.service.ts` | `prisma.user.isBanned` | Ban check in validateUser, handleGoogleLogin, handleAppleLogin, refreshTokens | VERIFIED | Lines 90, 191/199, 380/392, 424/436: all 4 auth paths check isBanned before proceeding |
| `admin/admin.controller.ts` | `admin/guards/admin.guard.ts` | `UseGuards(JwtAuthGuard, EmailVerifiedGuard, AdminGuard)` | VERIFIED | Line 15: `@UseGuards(JwtAuthGuard, EmailVerifiedGuard, AdminGuard)` on class level; applies to all 5 endpoints |

### Plan 07-02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `post/post-menu.tsx` | `moderation/report-dialog.tsx` | PostMenu renders ReportDialog for non-own posts | VERIFIED | Line 222-227: `<ReportDialog open={reportOpen} ... targetType="POST" />` rendered for non-own post case |
| `profile/profile-header.tsx` | `moderation/user-action-menu.tsx` | ProfileHeader renders UserActionMenu for non-own profiles | VERIFIED | Lines 73-78: `<UserActionMenu userId={profile.id} ...>` in non-own-profile section |
| `hooks/queries/moderation-queries.ts` | `/moderation/* API endpoints` | apiClient calls to moderation backend | VERIFIED | All 9 hooks use `apiClient.post/delete/get` with `/moderation/` prefix |
| `hooks/queries/admin-queries.ts` | `/admin/* API endpoints` | apiClient calls to admin backend | VERIFIED | All 5 hooks use `apiClient.get/post` with `/admin/` prefix |
| `app/(app)/layout.tsx` | `packages/shared/src/types/user.types.ts` | Admin Shield icon conditional on `user.role === 'ADMIN'` from /me response | VERIFIED | Line 84: `{user.role === 'ADMIN' && <Link href="/admin">...<Shield />}` |

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| MODR-01 | 07-01, 07-02 | User can report posts or users | SATISFIED | Backend: ModerationService.createReport + ModerationController POST /moderation/report. Frontend: ReportDialog with 7 Vietnamese reason categories, wired via useReport mutation |
| MODR-02 | 07-01, 07-02 | User can block other users | SATISFIED | Backend: blockUser() transaction + bidirectional getBlockedUserIds() + filter in feed/posts/comments/profiles/search/social/notifications. Frontend: BlockConfirmDialog, useBlockUser, /settings/blocked page |
| MODR-03 | 07-01, 07-02 | User can mute other users | SATISFIED | Backend: muteUser() + getMutedUserIds() + feed-only filter (intentional design). Frontend: instant toggle via useMuteUser in user-action-menu, /settings/muted page |
| MODR-04 | 07-01, 07-02 | Admin can view and act on reported content queue | PARTIALLY SATISFIED | Backend: AdminService getReportQueue + all 4 actions + AdminGuard. Frontend: /admin page + ReportQueue + admin-actions.tsx. GAP: Inline "Xoa bai viet" in post-menu.tsx passes post.id as reportId, which will fail at runtime. The queue-based path (admin-actions.tsx) works correctly. |

---

## Anti-Patterns Found

No TODO/FIXME/PLACEHOLDER/stub patterns found in any phase 07 files.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `frontend/src/components/post/post-menu.tsx` | 79 | `removeContent.mutate({ reportId: post.id })` — passes post ID where report ID is required | Blocker | Inline admin "remove content" from PostMenu will always return 404 since the backend looks up a Report record by ID, not a Post record |

---

## Human Verification Required

### 1. Block flow — bidirectional content hiding

**Test:** Log in as User A, block User B, then verify User A's feed shows no User B posts, User A cannot view User B's profile (should see 404), and User B also cannot see User A's profile.
**Expected:** Complete bidirectional content hide; getBlockedUserIds returns both sides
**Why human:** Cannot verify runtime bidirectional effect without a live database

### 2. Mute flow — feed only scoping

**Test:** Log in as User A, mute User B, then check User A's personal feed (User B posts absent), comments section on a post (User B comments visible), User B's profile (viewable), and search results (User B appears).
**Expected:** Mute affects only the personal feed — all other contexts remain unaffected
**Why human:** Requires running the app against real data to confirm the scoping is correct

### 3. Ban flow — multi-path login rejection

**Test:** Admin bans User C. Attempt to log in as User C via email/password, then Google OAuth, then Apple OAuth. Also test that an existing valid session for User C fails at the next API call (within 15 minutes).
**Expected:** ForbiddenException on all login paths; UnauthorizedException on next authenticated request after ban
**Why human:** Real OAuth flow and active session testing required

### 4. Report dialog — Vietnamese reason categories

**Test:** Open report dialog on any non-own post or user profile, observe the reason list.
**Expected:** All 7 Vietnamese reason labels visible (Spam, Quay roi / bat nat, Khoa than / tinh duc, Bao luc, Ngon tu thu han, Lua dao, Thong tin sai lech)
**Why human:** Visual UI verification

### 5. Admin page — role gate

**Test:** Navigate to /admin as a regular user; navigate to /admin as an admin user.
**Expected:** Regular user immediately redirected to /; Admin user sees report queue with sort options
**Why human:** Browser navigation and redirect behavior

---

## Gaps Summary

One gap blocks full goal achievement:

**Inline admin "remove content" from PostMenu is broken.** In `frontend/src/components/post/post-menu.tsx` line 79, the inline admin action "Xoa bai viet" calls `removeContent.mutate({ reportId: post.id })`. The `useRemoveContent` hook calls `POST /admin/reports/:id/remove-content`, where `:id` must be a **Report record ID**. Passing the post's ID will always return 404 ("Bao cao khong ton tai") because no Report with that ID exists.

The correct path — removing content from the report queue via `admin-actions.tsx` — works correctly since it receives `report.id` from the `ReportCard` component.

**Fix options:**
1. Remove the inline "Xoa bai viet" action from PostMenu entirely (admins can remove content from the dedicated queue page where they have the actual report ID).
2. Add a new backend endpoint `DELETE /admin/posts/:id` that deletes a post directly (bypassing the report workflow), and wire the PostMenu admin remove to that endpoint.

This gap affects MODR-04 (admin action on reported content) partially — the queue-based remove flow works correctly. The inline remove from posts is the only broken path.

---

_Verified: 2026-03-15T08:00:00Z_
_Verifier: Claude (gsd-verifier)_
