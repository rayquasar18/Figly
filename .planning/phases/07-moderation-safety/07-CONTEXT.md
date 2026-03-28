# Phase 7: Moderation & Safety - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can protect themselves from unwanted interactions by reporting posts/users, blocking users, and muting users. Admins can view a queue of reported content/users and take action (dismiss, warn, remove content, ban user). This phase delivers the safety infrastructure that protects the community.

</domain>

<decisions>
## Implementation Decisions

### Report flow
- Predefined reason categories: spam, harassment/bullying, nudity/sexual, violence, hate speech, scam/fraud, misinformation
- Reportable from post detail three-dot menu and user profile three-dot menu
- One report per user per target (submitting again updates the reason)
- After submitting: toast confirmation only — "Cam on ban da bao cao. Chung toi se xem xet." No status tracking for reporter.
- Reports create entries in admin moderation queue

### Block behavior
- Bidirectional block: neither user can see the other's content (posts, comments, profile)
- Auto-unfollow in both directions when blocking
- Blocked user sees "Nguoi dung khong ton tai" when visiting blocker's profile (no indication of being blocked)
- Block accessible from user profile three-dot menu
- Confirmation dialog before blocking: "Ban co chac chan muon chan [username]?" with explanation of consequences

### Mute behavior
- Mute hides the muted user's posts from your feed only
- You stay following them — their profile and comments are still visible elsewhere
- Muting is silent — muted user has no idea they've been muted
- Mute accessible from user profile three-dot menu
- No confirmation dialog — instant toggle

### Admin designation & queue
- Add `role` enum field on User model: USER (default), ADMIN
- Set admins via database seed or manual DB update (no admin management UI needed for v1)
- Dedicated /admin page with report queue showing: reported content, reason, reporter info, report count, sorted by newest/most reported
- Inline admin controls on content visible when admin is logged in (extra options on posts/profiles)
- Admin actions: Dismiss (false report), Remove content (delete post/comment), Warn user (flag on record), Ban user (permanent account disable)

### Banned user handling
- Banned users cannot log in (login rejected with clear message)
- Their content stays in database but profile shows "Nguoi dung bi cam" and posts are hidden from feed/search
- Existing interactions (likes, comments) remain but attributed to banned profile

### User management settings
- Settings page with blocked users list — unblock from there
- Settings page with muted users list — unmute from there
- Lists show username + avatar, with unblock/unmute button per entry

### Claude's Discretion
- Report reason category exact list and Vietnamese translations
- Admin queue page layout and filtering/sorting UI
- Inline admin control placement and styling
- Warning system implementation details (counter, escalation logic)
- Exact block/mute filter implementation in feed/search queries
- Settings page layout and navigation
- Admin notification preferences for new reports

</decisions>

<specifics>
## Specific Ideas

- Instagram-style moderation UX: three-dot menu actions, silent muting, opaque blocking ("user not found")
- Vietnamese language for all user-facing moderation strings
- Block/mute management in settings mirrors Instagram's Privacy settings section
- Admin queue is a separate dedicated page, not embedded in regular UI

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Three-dot menu pattern**: Already exists on post detail for edit/delete — extend with report/block/mute options
- **Notification system (Phase 6)**: SSE + BullMQ pipeline can trigger notifications for admin when reports come in
- **Vietnamese error messages**: Established pattern across all modules
- **shadcn/ui Dialog**: Used for confirmation dialogs (profile edit, delete post) — reuse for block confirmation
- **Toast (shadcn/ui)**: Already used for success/error feedback — reuse for report confirmation
- **Cursor pagination (take+1)**: Use for admin queue pagination and blocked/muted user lists

### Established Patterns
- NestJS module pattern: Controller + Service + Module
- JwtAuthGuard + EmailVerifiedGuard on all protected endpoints
- Prisma error codes handled inline (P2002 = duplicate, P2025 = not found)
- Optimistic updates with TanStack Query for toggle actions

### Integration Points
- **User model**: Add `role` enum field (USER, ADMIN), add `isBanned` boolean
- **Prisma schema**: New models — Report, Block, Mute (with user relations)
- **FeedService**: Filter out posts from blocked and muted users
- **PostsService/CommentsService**: Filter out content from blocked users
- **ProfilesService**: Return 404 for blocked user's profile
- **SearchService**: Exclude blocked users from search results
- **SocialService**: Prevent follow actions between blocked users
- **NotificationsService**: Skip notification delivery for blocked/muted users
- **Three-dot menus (PostDetailMenu, ProfileMenu)**: Add report/block/mute options
- **App routing**: New /admin route group for moderation queue
- **Settings page**: New sections for blocked and muted user management

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-moderation-safety*
*Context gathered: 2026-03-15*
