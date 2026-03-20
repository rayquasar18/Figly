# Phase 2: Profiles & Social Graph - Context

**Gathered:** 2026-03-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can set up their identity (display name, @username, avatar, bio) and build a social network by following other collectors. Includes viewing other users' profiles with post grids, follow/unfollow system, and follower/following lists. Collection showcase tab (PROF-04) is Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Profile page layout
- Instagram-style header: circular avatar on the left, stats (posts/followers/following) on the right in a row
- Display name, @username, and bio below the stats row
- "Edit Profile" button for own profile, "Follow" button for other users
- 3-column square thumbnail grid for posts below the header
- Tapping a grid thumbnail opens the post

### Edit profile
- Modal/drawer overlay on the profile page (not a separate page)
- Fields: avatar upload, display name, @username, bio
- Bio character limit: 150 characters

### Username system
- @username is required — picked during signup flow
- Username rules: lowercase letters, numbers, underscores, periods. 3-30 characters (Instagram rules)
- New `username` field in User model (unique, indexed)
- Profile URLs use username: /@username
- Username is changeable with a cooldown (14-day cooldown between changes)

### Follow interaction
- All accounts are public — anyone can follow anyone instantly, no approval needed
- Follow/unfollow is an instant toggle — tap to follow, tap again to unfollow, no confirmation
- Button visual states: filled/primary for "Follow", outlined/secondary for "Following"
- "Follows you" badge displayed on profiles of users who follow you back

### Follower/following lists
- Full-page display at /@username/followers and /@username/following
- Each row shows: avatar + display name + @username + follow/unfollow button
- Search bar at the top to filter the list as you type
- On own followers list: "Remove" button to remove a follower (silent, no notification to removed user)

### Claude's Discretion
- Exact avatar size and spacing in profile header
- Loading skeletons and empty states
- Error handling UI
- Pagination strategy for follower/following lists
- Mobile responsive adjustments to profile layout
- Username change cooldown implementation details

</decisions>

<specifics>
## Specific Ideas

- Instagram is the direct benchmark for profile page layout and follow UX — familiar patterns, no reinventing
- Strict separation: username is picked during signup, not deferred. All users have @username from day one
- "Follows you" badge provides social context without changing the follow button itself

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- **shadcn/ui components**: Button, Card, Form, Input, Label, Toast — use for profile UI and edit modal
- **Media pipeline**: MinIO + BullMQ + Sharp already set up — reuse for avatar upload and processing (150px, 600px, 1080px thumbnails already configured)
- **API client**: Axios with auth interceptor and silent refresh — use for profile and follow API calls
- **TanStack Query**: Already configured for data fetching — use for profile data, follow state, follower lists
- **Zustand**: Client state management — use for optimistic follow/unfollow updates

### Established Patterns
- NestJS modules for backend features (auth module pattern to follow)
- Prisma ORM for database access
- JWT + HttpOnly cookie auth (all API calls authenticated automatically)
- Vietnamese error messages in Zod schemas

### Integration Points
- **User model** needs new fields: `username` (unique), `avatarId` (relation to Media), `bio`
- **Follow relation** needs new Prisma model: followers/following relationship table
- **Signup flow** needs modification to collect @username during registration
- **Media module** already handles uploads — avatar uploads connect here
- **Frontend routing**: New routes for /@username, /@username/followers, /@username/following

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-profiles-social-graph*
*Context gathered: 2026-03-14*
