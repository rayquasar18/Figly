---
phase: 02-profiles-social-graph
verified: 2026-03-14T00:00:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
---

# Phase 2: Profiles & Social Graph Verification Report

**Phase Goal:** Users can set up their identity and build a social network by following other collectors
**Verified:** 2026-03-14
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

All truths are drawn directly from the `must_haves` frontmatter across all four plans.

#### Plan 02-01 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User model has username, bio, avatarId, and usernameChangedAt fields | VERIFIED | `schema.prisma` lines 20-24: `username String? @unique`, `bio String? @db.VarChar(150)`, `avatarId String? @unique`, `usernameChangedAt DateTime?` |
| 2 | Follow model exists with composite unique constraint | VERIFIED | `schema.prisma` lines 101-113: `model Follow` with `@@unique([followerId, followingId])`, dual `@@index`, `@@map("follows")` |
| 3 | Shared package exports username/bio validators | VERIFIED | `packages/shared/src/validators/username.ts` exports `USERNAME_RULES`, `RESERVED_USERNAMES`, `usernameSchema`, `bioSchema`; re-exported from `index.ts` line 28 |
| 4 | Shared package exports ProfileResponse, UserListItem, PaginatedResponse types | VERIFIED | `packages/shared/src/types/profile.types.ts` defines all three; `index.ts` line 24 exports them |
| 5 | Signup accepts and stores a username | VERIFIED | `auth.service.ts` line 30: `signup(dto: { email, password, name, username })`; stores in `prisma.user.create` with `username: dto.username` |
| 6 | Username validation rejects reserved names, invalid characters, and out-of-range lengths | VERIFIED | `usernameSchema`: min 3, max 30, pattern `/^[a-z0-9_.]+$/`; `RESERVED_USERNAMES` list of 16 names checked in `auth.service.ts` before insert |

#### Plan 02-02 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 7 | Profile data can be retrieved by username | VERIFIED | `ProfilesService.getProfile` queries by `{ username }`, returns `ProfileResponse` shape with `_count.followers`, `_count.following`, parallel isFollowing/isFollowedBy checks |
| 8 | Profile can be updated with username cooldown enforcement | VERIFIED | `updateProfile` checks `usernameChangedAt + 14 days`, throws `BadRequestException` if within cooldown; also checks reserved names and uniqueness |
| 9 | A user can follow another user and the relationship is persisted | VERIFIED | `SocialService.follow` calls `prisma.follow.create`, prevents self-follow, catches P2002 for idempotency |
| 10 | A user can unfollow and the relationship is removed | VERIFIED | `SocialService.unfollow` calls `prisma.follow.delete` with composite key, catches P2025 for idempotency |
| 11 | Follower and following lists can be retrieved with pagination and search | VERIFIED | `getFollowers` and `getFollowing` use take+1 cursor pattern, `search` filter via OR contains on `username` and `name`, batch follow-status check |
| 12 | A user can remove a follower silently | VERIFIED | `SocialService.removeFollower` deletes `Follow` where `followerId=followerUserId AND followingId=ownerId` |

#### Plan 02-03 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 13 | User can visit /{username} and see Instagram-style profile with avatar, stats, bio, and post grid | VERIFIED | `frontend/src/app/(app)/[username]/page.tsx` renders `ProfileHeader` + `Tabs` + `ProfilePostGrid`; header shows Avatar, ProfileStats, displayName, bio |
| 14 | User can tap 'Chinh sua trang ca nhan' on own profile and edit display name, username, bio, and avatar in a modal | VERIFIED | `ProfileEditModal` (326 lines) uses shadcn Dialog, react-hook-form, fields for displayName/username/bio/avatarId, avatar upload via `/media/upload`, calls `useUpdateProfile`, toast on success |
| 15 | User sees 'Theo doi ban' badge on profiles of users who follow them back | VERIFIED | `profile-header.tsx` line 56-60: renders `<span>Theo doi ban</span>` when `profile.isFollowedBy` is true |
| 16 | Signup form collects @username with real-time availability check | VERIFIED | `signup-form.tsx`: username field with `@` prefix, `useCheckUsername` hook from `profile-queries.ts`, 300ms debounce, Check/X/Loader2 indicators |
| 17 | OAuth users without username see 'complete profile' interstitial before accessing the app | VERIFIED | `app/(app)/layout.tsx` lines 29-39: redirects to `/complete-profile` when `user.username` is null and path is not already `/complete-profile` |
| 18 | Post grid shows empty state with 'Chua co bai viet nao' message | VERIFIED | `profile-post-grid.tsx` renders camera icon and "Chua co bai viet nao" when `posts.length === 0` |

#### Plan 02-04 Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 19 | User can tap Follow button on another user's profile and see it change to 'Dang theo doi' instantly | VERIFIED | `FollowButton` calls `useFollowMutation` which does `setQueryData` optimistically to `isFollowing: true` before server response |
| 20 | User can tap 'Dang theo doi' to unfollow and see button revert to 'Theo doi' instantly | VERIFIED | `useUnfollowMutation` does `setQueryData` to `isFollowing: false, followerCount - 1`; rollback on error |
| 21 | Follower/following counts update immediately on follow/unfollow | VERIFIED | `useFollowMutation.onMutate` sets `followerCount: previous.followerCount + 1`; `useUnfollowMutation.onMutate` decrements with `Math.max(0, previous.followerCount - 1)` |
| 22 | User can visit /{username}/followers and see paginated list of followers | VERIFIED | `app/(app)/[username]/followers/page.tsx` (45 lines) renders `FollowerList` with `type="followers"`; backed by `useFollowers` infinite query |
| 23 | User can visit /{username}/following and see paginated list of followed users | VERIFIED | `app/(app)/[username]/following/page.tsx` (45 lines) renders `FollowerList` with `type="following"` |
| 24 | User can search/filter follower and following lists by typing in the search bar | VERIFIED | `FollowerList` has debounced search state (300ms), passes `debouncedSearch` to `useFollowers`/`useFollowing` hooks which append `?search=` param |
| 25 | User can remove a follower from own followers list via 'Go' (Remove) button | VERIFIED | `FollowerList` determines `isOwnFollowers` by comparing `currentUser?.username === username`; passes `showRemoveButton` and `onRemove` to `UserRow`; `UserRow` renders destructive "Go" button |
| 26 | Each user row shows avatar, display name, @username, and follow/unfollow button | VERIFIED | `UserRow` (76 lines): Avatar with AvatarFallback, linked displayName + @username, FollowButton or "Go" button |

**Score: 14/14 plan must-have groups verified** (26 individual truths all verified)

---

### Required Artifacts

| Artifact | Min Lines | Actual | Status | Details |
|----------|-----------|--------|--------|---------|
| `backend/prisma/schema.prisma` | — | 114 | VERIFIED | Follow model with composite unique; User fields username/bio/avatarId/usernameChangedAt all present |
| `packages/shared/src/validators/username.ts` | — | 44 | VERIFIED | Exports USERNAME_RULES, RESERVED_USERNAMES, usernameSchema, bioSchema |
| `packages/shared/src/types/profile.types.ts` | — | 27 | VERIFIED | Exports ProfileResponse, UserListItem, PaginatedResponse |
| `packages/shared/src/dto/profile.dto.ts` | — | — | VERIFIED | Exports updateProfileSchema; imports and reuses usernameSchema, bioSchema |
| `backend/src/profiles/profiles.service.ts` | — | 160 | VERIFIED | getProfile with _count, parallel follow checks, avatar presigned URL; updateProfile with cooldown, reserved names, uniqueness; isUsernameAvailable |
| `backend/src/social/social.service.ts` | — | 228 | VERIFIED | follow/unfollow (both idempotent), getFollowers/getFollowing with cursor pagination + search + batch status, removeFollower |
| `backend/src/profiles/__tests__/profiles.service.spec.ts` | 50 | 294 | VERIFIED | Substantive: 294 lines, 18 unit tests |
| `backend/src/social/__tests__/social.service.spec.ts` | 50 | 302 | VERIFIED | Substantive: 302 lines, 14 unit tests |
| `frontend/src/app/(app)/[username]/page.tsx` | 20 | 65 | VERIFIED | Renders ProfileHeader, Tabs, ProfilePostGrid; ProfileEditModal gated on isOwnProfile |
| `frontend/src/components/profile/profile-header.tsx` | 40 | 86 | VERIFIED | Avatar left, stats right, displayName/bio below, FollowButton (real) wired in, "Theo doi ban" badge |
| `frontend/src/components/profile/profile-edit-modal.tsx` | 60 | 326 | VERIFIED | Avatar upload, display name, username with availability check, bio with counter, toast on save |
| `frontend/src/hooks/queries/profile-queries.ts` | — | 71 | VERIFIED | Exports useProfile, useUpdateProfile, useCheckUsername; all hit real API endpoints |
| `frontend/src/app/(app)/complete-profile/page.tsx` | 15 | 24 | VERIFIED | Renders CompleteProfileForm in centered card layout |
| `frontend/src/components/social/follow-button.tsx` | 25 | 51 | VERIFIED | Filled/outline toggle, hover destructive, disabled on pending, uses useFollowMutation + useUnfollowMutation |
| `frontend/src/components/social/user-row.tsx` | 20 | 76 | VERIFIED | Avatar, linked displayName/@username, FollowButton or destructive "Go" button |
| `frontend/src/components/social/follower-list.tsx` | 40 | 166 | VERIFIED | Debounced search, IntersectionObserver infinite scroll, skeleton loading, Vietnamese empty states |
| `frontend/src/hooks/queries/social-queries.ts` | — | 165 | VERIFIED | Exports useFollowMutation, useUnfollowMutation (both with full optimistic update + rollback), useFollowers, useFollowing, useRemoveFollowerMutation |
| `frontend/src/app/(app)/[username]/followers/page.tsx` | 15 | 45 | VERIFIED | Renders FollowerList type="followers" with back navigation |
| `frontend/src/app/(app)/[username]/following/page.tsx` | 15 | 45 | VERIFIED | Renders FollowerList type="following" with back navigation |

---

### Key Link Verification

| From | To | Via | Status | Evidence |
|------|----|-----|--------|---------|
| `auth.service.ts` | `shared/validators/username.ts` | `RESERVED_USERNAMES` import used in signup | WIRED | Line 14: `import { ..., RESERVED_USERNAMES } from '@figly/shared'`; line 41: `RESERVED_USERNAMES.includes(dto.username)` |
| `dto/profile.dto.ts` | `shared/validators/username.ts` | Reuses usernameSchema and bioSchema | WIRED | Line 2: `import { usernameSchema, bioSchema }`; lines 10-11: used in schema definition |
| `profiles.service.ts` | `prisma.user` | `_count` for follower/following counts | WIRED | Lines 31-37: `_count: { select: { followers: true, following: true } }`; lines 76-77: `user._count.followers`, `user._count.following` |
| `social.service.ts` | `prisma.follow` | Prisma CRUD on Follow model | WIRED | Lines 24, 42, 83, 112, 157, 186, 210: `prisma.follow.create`, `prisma.follow.delete`, `prisma.follow.findMany` |
| `profiles.service.ts` | `media/storage.service.ts` | `getPresignedUrl` for avatar | WIRED | Line 8: `import { StorageService }`; line 66: `this.storageService.getPresignedUrl(user.avatar.mediumKey)` |
| `profile-queries.ts` | `/api/profiles/:username` | `apiClient.get` | WIRED | Line 15: `apiClient.get<ProfileResponse>('/profiles/${username}')` |
| `profile-edit-modal.tsx` | `/api/profiles/me` | `useUpdateProfile` mutation | WIRED | `useUpdateProfile` in `profile-queries.ts` line 38: `apiClient.patch('/profiles/me', data)` |
| `signup-form.tsx` | `/api/profiles/check/:username` | `useCheckUsername` query | WIRED | `signup-form.tsx` line 8: imports `useCheckUsername`; line 52: calls it with debounced username; `profile-queries.ts` line 62: `apiClient.get('/profiles/check/${username}')` |
| `app/(app)/layout.tsx` | `complete-profile` page | Redirect when user.username is null | WIRED | Lines 29-39: checks `!user.username && pathname !== '/complete-profile'`, calls `router.replace('/complete-profile')` |
| `social-queries.ts` | `/api/social/follow/:userId` | `apiClient.post` and `apiClient.delete` | WIRED | Lines 20, 69: `apiClient.post('/social/follow/${userId}')`, `apiClient.delete('/social/follow/${userId}')` |
| `social-queries.ts` | `/api/social/:username/followers` | `apiClient.get` with cursor pagination | WIRED | Line 118: `apiClient.get('/social/${username}/followers${query}')` |
| `follow-button.tsx` | `social-queries.ts` | `useFollowMutation` and `useUnfollowMutation` | WIRED | Lines 6-8: imports both hooks; lines 23-25: instantiates both |
| `follow-button.tsx` | TanStack Query cache | Optimistic update of profile query data | WIRED | `social-queries.ts` lines 36, 82: `queryClient.setQueryData<ProfileResponse>(['profile', username], ...)` |
| `ProfilesModule` + `SocialModule` | `app.module.ts` | Registered in AppModule imports | WIRED | `app.module.ts` lines 10-11: imports; lines 52-53: listed in `@Module({ imports: [..., ProfilesModule, SocialModule] })` |

---

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|---------|
| PROF-01 | 02-01, 02-03 | User can create profile with display name and avatar | SATISFIED | Schema: `name` (displayName), `avatarId` + `UserAvatar` relation. Frontend: edit modal with avatar upload + display name field; `ProfileEditModal` uploads via `/media/upload`, stores `avatarId` |
| PROF-02 | 02-01, 02-03 | User can write and edit bio | SATISFIED | Schema: `bio String? @db.VarChar(150)`. Backend: `updateProfile` accepts `bio`. Frontend: edit modal textarea with 150-char counter |
| PROF-03 | 02-02, 02-03 | User can view other users' profiles with post grid | SATISFIED | `GET /profiles/:username` returns `ProfileResponse`. Profile page at `/[username]` renders header + post grid (empty state with "Chua co bai viet nao" for Phase 2, extensible for Phase 3) |
| SOCL-01 | 02-02, 02-04 | User can follow/unfollow other users | SATISFIED | Backend: `POST /social/follow/:userId`, `DELETE /social/follow/:userId`. Frontend: `FollowButton` with optimistic updates, `useFollowMutation`/`useUnfollowMutation` wired to profile header |
| SOCL-02 | 02-02, 02-04 | User can view followers and following lists | SATISFIED | Backend: `GET /social/:username/followers`, `GET /social/:username/following` with cursor pagination + search. Frontend: `/[username]/followers` and `/[username]/following` pages with `FollowerList` (infinite scroll + debounced search) |

No orphaned requirements: REQUIREMENTS.md maps PROF-01, PROF-02, PROF-03, SOCL-01, SOCL-02 to Phase 2. All five are claimed and satisfied by the four plans.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `backend/src/profiles/profiles.service.ts` | 75 | `postCount: 0, // Placeholder until Phase 3` | Info | Intentional and documented. Phase 3 (content) will replace with real post count query. Not a blocker — plan explicitly acknowledges it. |

The `placeholder` strings found in HTML `<input placeholder="...">` attributes are legitimate UI placeholder text, not code stubs.

No blockers. No warnings.

---

### Human Verification Required

The following items require a running application to verify and cannot be confirmed programmatically:

#### 1. Instagram-Style Profile Layout Visual Fidelity

**Test:** Start dev servers and visit `/{username}`. Resize browser between mobile (375px) and desktop (1024px+).
**Expected:** Avatar circular on left (md+) or centered-top (mobile), stats row on right (md+), display name + @username + bio below, correct spacing.
**Why human:** Visual layout and responsive breakpoint behavior cannot be verified from source code alone.

#### 2. Edit Profile Modal — Avatar Upload Flow

**Test:** Open edit modal, click "Doi anh dai dien", select an image file.
**Expected:** Immediate circular preview appears, upload spinner shows, on success the avatar updates. Save confirms with "Cap nhat thanh cong" toast.
**Why human:** File upload, preview via `createObjectURL`, async media API call, and toast are runtime behaviors.

#### 3. Username Availability Check in Real-Time

**Test:** Type a username in signup form or edit modal — try an available name, a reserved name ("admin"), and an already-taken name.
**Expected:** Green checkmark for available, red X for taken/reserved, spinner while checking; check fires after 300ms debounce.
**Why human:** Network timing, debounce feel, and visual indicator accuracy require runtime verification.

#### 4. Follow/Unfollow Optimistic UI

**Test:** Create two accounts. From account A, visit account B's profile and click "Theo doi". Click again to unfollow.
**Expected:** Button changes instantly before server responds; follower count increments/decrements immediately; if network is slow, UI reflects change before API returns.
**Why human:** Optimistic update timing and rollback on error require real network conditions.

#### 5. Complete-Profile Gate for OAuth Users

**Test:** Log in via Google OAuth with an account that has no username. Attempt to navigate to any app page.
**Expected:** Redirected to `/complete-profile`, cannot access other pages until username is set.
**Why human:** Requires a real OAuth flow and database state to test the gate logic.

#### 6. Infinite Scroll on Follower/Following Lists

**Test:** With a user who has >20 followers, visit `/{username}/followers` and scroll to the bottom.
**Expected:** Next page loads automatically when sentinel div enters viewport; no duplicate entries.
**Why human:** IntersectionObserver behavior requires a real browser and real paginated data.

---

### Gaps Summary

No gaps found. All 14 plan must-have groups are verified at all three levels (exists, substantive, wired). All 5 requirements (PROF-01, PROF-02, PROF-03, SOCL-01, SOCL-02) are satisfied with concrete implementation evidence.

The phase goal — "Users can set up their identity and build a social network by following other collectors" — is fully achieved:

- **Identity setup:** Users can sign up with a username, set a display name and avatar, write a bio, and view their profile at a public URL. OAuth users are gated until they complete their profile.
- **Social network:** Users can follow/unfollow other collectors with optimistic UI, view follower/following lists with search and pagination, remove followers, and see mutual-follow badges.

The only human-verification items are UX quality checks (layout fidelity, real-time feel) — not functional gaps.

---

_Verified: 2026-03-14_
_Verifier: Claude (gsd-verifier)_
