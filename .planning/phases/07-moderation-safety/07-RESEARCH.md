# Phase 7: Moderation & Safety - Research

**Researched:** 2026-03-15
**Domain:** Moderation infrastructure (reporting, blocking, muting, admin queue) for NestJS + Prisma + Next.js social platform
**Confidence:** HIGH

## Summary

Phase 7 adds user safety and community moderation to Figly. The scope divides into four areas: (1) reporting system -- users can report posts or other users with predefined reason categories, feeding into an admin queue; (2) blocking -- bidirectional content hiding with auto-unfollow and opaque "user not found" masking; (3) muting -- silent feed-only filtering; (4) admin moderation queue -- dedicated admin page with action capabilities (dismiss, warn, remove content, ban user).

The implementation requires new Prisma models (Report, Block, Mute), a `role` enum on User, an `isBanned` boolean, a new `ModerationModule` in NestJS, and a new `AdminModule`. On the frontend, this means extending existing three-dot menus (PostMenu, ProfileHeader) with report/block/mute actions, creating an admin route group, and adding a settings page with blocked/muted user management. The most critical integration work is adding block/mute filtering to existing queries in FeedService, PostsService, ProfilesService, SearchService, CommentsService, SocialService, and NotificationsService.

**Primary recommendation:** Build backend moderation infrastructure first (schema + services), then integrate block/mute filtering into all existing services, then build frontend UI components. Admin features can be parallelized with user-facing features since they share the same backend models but have separate frontend routes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Report flow**: Predefined reason categories (spam, harassment/bullying, nudity/sexual, violence, hate speech, scam/fraud, misinformation). Reportable from post detail three-dot menu and user profile three-dot menu. One report per user per target (submitting again updates the reason). After submitting: toast confirmation only -- "Cam on ban da bao cao. Chung toi se xem xet." No status tracking for reporter. Reports create entries in admin moderation queue.
- **Block behavior**: Bidirectional block -- neither user can see the other's content (posts, comments, profile). Auto-unfollow in both directions when blocking. Blocked user sees "Nguoi dung khong ton tai" when visiting blocker's profile (no indication of being blocked). Block accessible from user profile three-dot menu. Confirmation dialog before blocking: "Ban co chac chan muon chan [username]?" with explanation of consequences.
- **Mute behavior**: Mute hides the muted user's posts from your feed only. You stay following them -- their profile and comments are still visible elsewhere. Muting is silent -- muted user has no idea they've been muted. Mute accessible from user profile three-dot menu. No confirmation dialog -- instant toggle.
- **Admin designation & queue**: Add `role` enum field on User model: USER (default), ADMIN. Set admins via database seed or manual DB update (no admin management UI needed for v1). Dedicated /admin page with report queue showing: reported content, reason, reporter info, report count, sorted by newest/most reported. Inline admin controls on content visible when admin is logged in (extra options on posts/profiles). Admin actions: Dismiss (false report), Remove content (delete post/comment), Warn user (flag on record), Ban user (permanent account disable).
- **Banned user handling**: Banned users cannot log in (login rejected with clear message). Their content stays in database but profile shows "Nguoi dung bi cam" and posts are hidden from feed/search. Existing interactions (likes, comments) remain but attributed to banned profile.
- **User management settings**: Settings page with blocked users list -- unblock from there. Settings page with muted users list -- unmute from there. Lists show username + avatar, with unblock/unmute button per entry.

### Claude's Discretion
- Report reason category exact list and Vietnamese translations
- Admin queue page layout and filtering/sorting UI
- Inline admin control placement and styling
- Warning system implementation details (counter, escalation logic)
- Exact block/mute filter implementation in feed/search queries
- Settings page layout and navigation
- Admin notification preferences for new reports

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MODR-01 | User can report posts or users | Report model in Prisma schema, ModerationService with createReport/updateReport, ReportDto with reason enum, three-dot menu extensions on PostMenu and ProfileHeader |
| MODR-02 | User can block other users | Block model with bidirectional filtering, BlockService with block/unblock + auto-unfollow transaction, filter integration in FeedService/PostsService/ProfilesService/SearchService/SocialService/CommentsService/NotificationsService |
| MODR-03 | User can mute other users | Mute model, MuteService with mute/unmute toggle, feed-only filtering in FeedService (NOT in profiles/comments/search) |
| MODR-04 | Admin can view and act on reported content queue | Role enum on User, AdminGuard, AdminService with queue listing/actions, admin route group in frontend, ReportStatus tracking |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | (existing) | New Report/Block/Mute models, User role enum, schema migration | Already the project ORM -- extend schema, no new dependencies |
| NestJS | (existing) | ModerationModule, AdminModule with guards, controllers, services | Established module pattern throughout project |
| Next.js 14 | (existing) | Admin route group, settings pages, menu extensions | Existing app router structure with (app)/(public) groups |
| shadcn/ui | (existing) | DropdownMenu, AlertDialog, Dialog, Toast, Tabs, Badge | All required components already installed in project |
| TanStack Query | (existing) | Mutations for report/block/mute, admin queue queries | Established pattern for all API interactions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | (existing) | Icons for menu items (Flag, Ban, VolumeX, Shield, etc.) | All menu items and admin UI elements |
| zod | (existing) | Report reason validation, admin action DTOs | Input validation on both client and server |
| BullMQ | (existing) | Optional: admin notification when new reports arrive | Extend existing notification queue if admin notifications desired |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma enum for report reasons | String field with validation | Enum is stricter but requires migration for new reasons; since reasons are locked, enum is fine |
| Separate ModerationModule + AdminModule | Single combined module | Separate is cleaner -- moderation handles user actions, admin handles queue/actions |
| Middleware for block filtering | Prisma query filters in each service | Prisma middleware could add `NOT` clauses globally, but per-service is more explicit and controllable |

## Architecture Patterns

### Recommended Project Structure

```
backend/src/
  moderation/
    moderation.module.ts
    moderation.controller.ts
    moderation.service.ts
    dto/
      create-report.dto.ts
      block-user.dto.ts
  admin/
    admin.module.ts
    admin.controller.ts
    admin.service.ts
    guards/
      admin.guard.ts
    dto/
      admin-action.dto.ts

frontend/src/
  app/(app)/
    admin/
      page.tsx
      loading.tsx
    settings/
      page.tsx
      blocked/
        page.tsx
      muted/
        page.tsx
  components/
    moderation/
      report-dialog.tsx
      block-confirm-dialog.tsx
      profile-menu.tsx        # Three-dot menu for other users' profiles
    admin/
      report-queue.tsx
      report-card.tsx
      admin-actions.tsx
  hooks/queries/
    moderation-queries.ts     # report, block, mute mutations + settings list queries
    admin-queries.ts          # admin queue queries + action mutations
```

### Pattern 1: Block/Mute Filter Helper

**What:** A reusable function that generates Prisma `where` clauses to exclude blocked/muted users from queries
**When to use:** Every service that returns content to a viewer (feed, posts, profiles, search, comments)
**Example:**

```typescript
// backend/src/moderation/moderation.service.ts
async getBlockedUserIds(userId: string): Promise<string[]> {
  const blocks = await this.prisma.block.findMany({
    where: {
      OR: [
        { blockerId: userId },
        { blockedId: userId },
      ],
    },
    select: { blockerId: true, blockedId: true },
  });
  const ids = new Set<string>();
  for (const b of blocks) {
    if (b.blockerId !== userId) ids.add(b.blockerId);
    if (b.blockedId !== userId) ids.add(b.blockedId);
  }
  return [...ids];
}

async getMutedUserIds(userId: string): Promise<string[]> {
  const mutes = await this.prisma.mute.findMany({
    where: { muterId: userId },
    select: { mutedId: true },
  });
  return mutes.map(m => m.mutedId);
}
```

### Pattern 2: Admin Guard

**What:** NestJS guard that checks if the authenticated user has ADMIN role
**When to use:** All admin-only endpoints (report queue, admin actions)
**Example:**

```typescript
// backend/src/admin/guards/admin.guard.ts
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { userId } = request.user;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Khong co quyen quan tri');
    }
    return true;
  }
}
```

### Pattern 3: Idempotent Toggle (Established)

**What:** Use P2002/P2025 error codes for idempotent create/delete operations
**When to use:** Block toggle, mute toggle, report upsert
**Example:** Already used throughout the project (SocialService.follow/unfollow, PostsService.toggleLike/toggleBookmark). Apply identical pattern for block/mute.

### Pattern 4: Three-Dot Menu Extension

**What:** The existing PostMenu shows only for own posts (edit/delete). For other users' posts, show report option. On profiles, show block/mute for other users.
**When to use:** Post detail view (other user's post), user profile (other user)
**Example:**

```typescript
// Current PostMenu returns null if not own post
// New pattern: show different menu for other users' posts
if (currentUser && currentUser.id !== post.author.id) {
  // Show: Bao cao (Report)
}
```

### Anti-Patterns to Avoid
- **Global Prisma middleware for block filtering:** Tempting but dangerous -- it would affect admin queries too, making it impossible for admins to see blocked user content in the moderation queue. Keep filtering explicit in each service method.
- **Checking block status per-item in a loop:** Always batch-fetch blocked/muted user IDs once, then use `userId: { notIn: blockedIds }` in Prisma queries.
- **Storing block as two rows (A blocks B creates both A->B and B->A):** Single row with `blockerId`/`blockedId` and query with `OR` clause. Two rows means double storage and risk of inconsistency.
- **Soft-delete for banned content:** Decision says content stays in DB but is hidden. Use `isBanned` flag on User and filter in queries, not soft-delete on individual posts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Admin role check | Custom JWT claim with role | Database lookup in AdminGuard | Roles can change; DB check ensures current state. JWT approach requires token invalidation on role change |
| Report reason validation | Manual string checking | Zod enum schema mapped to Prisma enum | Type safety across frontend/backend, compile-time guarantees |
| Block filtering in queries | Complex raw SQL | Prisma `NOT` / `notIn` clauses | Prisma handles parameterization and SQL injection prevention |
| Confirmation dialogs | Custom modal components | shadcn/ui AlertDialog (already used in PostMenu delete) | Consistent UX, accessible, already in project |
| Toast notifications | Custom notification system | sonner/shadcn toast (already used) | Already established pattern throughout project |

**Key insight:** This phase is primarily about data modeling (Report, Block, Mute) and query modification (adding filters). No new external libraries are needed -- everything builds on existing patterns.

## Common Pitfalls

### Pitfall 1: Missing Block Filter in One Service
**What goes wrong:** You add block filtering to FeedService and PostsService but forget CommentsService or SearchService. Blocked user's content leaks through.
**Why it happens:** Block filtering touches 7+ services. Easy to miss one.
**How to avoid:** Create an explicit checklist of ALL services that return user-generated content. The complete list: FeedService (getFeed, getPublicFeed, getExploreFeed), PostsService (getPost, getUserPosts, getSavedPosts, getPostsByHashtag), CommentsService (getComments, createComment check), ProfilesService (getProfile, searchProfiles), SearchService (searchUsers), SocialService (follow prevention, getFollowers, getFollowing), NotificationsService (skip delivery for blocked users).
**Warning signs:** Manual testing with a blocked user reveals their content in one specific view.

### Pitfall 2: Block Auto-Unfollow Race Condition
**What goes wrong:** When user A blocks user B, both follow relationships must be deleted. If you do this in separate queries without a transaction, the block could succeed but unfollow could fail.
**Why it happens:** Non-transactional multi-step operation.
**How to avoid:** Use Prisma `$transaction` to atomically: (1) create Block record, (2) delete A->B follow, (3) delete B->A follow. Use P2025 catch on deletes since follows may not exist.

### Pitfall 3: Banned User Login Check Missing from OAuth
**What goes wrong:** Banned user can still log in via Google/Apple OAuth even though password login is blocked.
**Why it happens:** Ban check added to `validateUser` (password login) but not to `handleGoogleLogin`/`handleAppleLogin`.
**How to avoid:** Add `isBanned` check in ALL login paths: `validateUser`, `handleGoogleLogin`, `handleAppleLogin`, and `refreshTokens`.

### Pitfall 4: Admin Seeing Filtered Content
**What goes wrong:** Admin opens the moderation queue but reported posts from blocked users are hidden because block filtering is applied globally.
**Why it happens:** Block filtering applied too broadly.
**How to avoid:** Admin endpoints should NOT apply block filtering. The AdminService queries directly without block/mute filters. Admin views are inherently different from user views.

### Pitfall 5: Mute Applied Too Broadly
**What goes wrong:** Muting a user hides them from comments, search, and profiles instead of just the feed.
**Why it happens:** Confusing mute and block scopes.
**How to avoid:** Mute filtering ONLY applies in FeedService.getFeed. Block filtering applies everywhere else. Keep these clearly separated.

### Pitfall 6: Report Upsert Creates Duplicate
**What goes wrong:** User reports same post twice and gets two report records instead of updating the reason.
**Why it happens:** Using `create` instead of `upsert` on the Report model.
**How to avoid:** Use `@@unique([reporterId, targetId, targetType])` constraint and Prisma `upsert`.

## Code Examples

### Prisma Schema Extensions

```prisma
// New enums
enum UserRole {
  USER
  ADMIN
}

enum ReportReason {
  SPAM
  HARASSMENT
  NUDITY
  VIOLENCE
  HATE_SPEECH
  SCAM
  MISINFORMATION
}

enum ReportStatus {
  PENDING
  DISMISSED
  ACTIONED
}

enum ReportTargetType {
  POST
  USER
}

// Modify User model -- add fields:
//   role       UserRole  @default(USER)
//   isBanned   Boolean   @default(false)
//   warningCount Int     @default(0)
//   bannedAt   DateTime?

model Report {
  id           String           @id @default(cuid())
  reporterId   String
  reporter     User             @relation("reporter", fields: [reporterId], references: [id], onDelete: Cascade)
  targetId     String           // postId or userId depending on targetType
  targetType   ReportTargetType
  reason       ReportReason
  status       ReportStatus     @default(PENDING)
  resolvedById String?
  resolvedBy   User?            @relation("resolver", fields: [resolvedById], references: [id])
  resolvedAt   DateTime?
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  @@unique([reporterId, targetId, targetType])
  @@index([status, createdAt])
  @@index([targetId, targetType])
  @@map("reports")
}

model Block {
  id        String   @id @default(cuid())
  blockerId String
  blockedId String
  blocker   User     @relation("blocker", fields: [blockerId], references: [id], onDelete: Cascade)
  blocked   User     @relation("blocked", fields: [blockedId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([blockerId, blockedId])
  @@index([blockerId])
  @@index([blockedId])
  @@map("blocks")
}

model Mute {
  id      String   @id @default(cuid())
  muterId String
  mutedId String
  muter   User     @relation("muter", fields: [muterId], references: [id], onDelete: Cascade)
  muted   User     @relation("muted", fields: [mutedId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([muterId, mutedId])
  @@index([muterId])
  @@map("mutes")
}
```

### Feed Block/Mute Filtering

```typescript
// FeedService.getFeed -- add block + mute filtering
async getFeed(userId: string, cursor?: string, take = POST_LIMITS.feedPageSize) {
  // Fetch blocked and muted IDs once
  const [blockedIds, mutedIds] = await Promise.all([
    this.moderationService.getBlockedUserIds(userId),
    this.moderationService.getMutedUserIds(userId),
  ]);
  const excludeFromFeed = [...new Set([...blockedIds, ...mutedIds])];

  const posts = await this.prisma.post.findMany({
    where: {
      OR: [
        { userId },
        { user: { followers: { some: { followerId: userId } } } },
      ],
      // Exclude blocked + muted users' posts AND banned users
      userId: { notIn: excludeFromFeed },
      user: { isBanned: false },
    },
    // ... rest of existing query
  });
}
```

### Block with Auto-Unfollow Transaction

```typescript
async blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) {
    throw new BadRequestException('Ban khong the chan chinh minh');
  }

  await this.prisma.$transaction(async (tx) => {
    // Create block record (upsert for idempotency)
    try {
      await tx.block.create({
        data: { blockerId, blockedId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') return; // Already blocked
      throw error;
    }

    // Remove follows in both directions (P2025 safe)
    await tx.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: blockedId },
          { followerId: blockedId, followingId: blockerId },
        ],
      },
    });
  });
}
```

### Admin Action Endpoint

```typescript
// AdminController
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, AdminGuard)
@Controller('admin')
export class AdminController {
  @Get('reports')
  async getReportQueue(
    @Query('cursor') cursor?: string,
    @Query('sort') sort: 'newest' | 'most_reported' = 'newest',
  ) { ... }

  @Post('reports/:id/dismiss')
  async dismissReport(@Param('id') id: string, @Req() req: any) { ... }

  @Post('reports/:id/remove-content')
  async removeContent(@Param('id') id: string, @Req() req: any) { ... }

  @Post('users/:id/warn')
  async warnUser(@Param('id') id: string, @Req() req: any) { ... }

  @Post('users/:id/ban')
  async banUser(@Param('id') id: string, @Req() req: any) { ... }
}
```

### Ban Check in Login Flow

```typescript
// AuthService.validateUser -- add ban check after password verification
async validateUser(email: string, password: string) {
  const user = await this.prisma.user.findUnique({ where: { email } });
  if (!user) throw new UnauthorizedException('Email khong ton tai');

  // Check ban status BEFORE password check
  if (user.isBanned) {
    throw new ForbiddenException('Tai khoan cua ban da bi cam');
  }

  // ... existing password and email verification checks
}
```

### Frontend Report Dialog

```typescript
// ReportDialog -- reuses shadcn Dialog + RadioGroup pattern
'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useReport } from '@/hooks/queries/moderation-queries';

const REPORT_REASONS = [
  { value: 'SPAM', label: 'Spam' },
  { value: 'HARASSMENT', label: 'Quay roi / bat nat' },
  { value: 'NUDITY', label: 'Khoa than / tinh duc' },
  { value: 'VIOLENCE', label: 'Bao luc' },
  { value: 'HATE_SPEECH', label: 'Ngon tu thu han' },
  { value: 'SCAM', label: 'Lua dao' },
  { value: 'MISINFORMATION', label: 'Thong tin sai lech' },
] as const;

// On submit success: toast("Cam on ban da bao cao. Chung toi se xem xet.")
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate user_blocks and user_blocked_by tables | Single Block table with OR query | Standard Prisma pattern | Simpler schema, no data duplication |
| Content soft-delete on ban | User-level ban flag + query filtering | Modern social platform pattern | Content preserved for appeals, simpler implementation |
| Role in JWT token | Role checked from DB in guard | Best practice for changeable roles | No token invalidation needed when role changes |

**Current best practices for this project:**
- Prisma enums for fixed value sets (report reasons, roles, report status)
- Transaction blocks for multi-step operations (block + unfollow)
- `where: { NOT }` / `notIn` for query-level filtering (not middleware)
- Separate modules for separate concerns (ModerationModule for user actions, AdminModule for admin actions)

## Open Questions

1. **Warning escalation policy**
   - What we know: Admin can "warn" a user, which adds a flag on their record. `warningCount` field tracks warnings.
   - What's unclear: Should there be auto-ban after N warnings? Or purely manual admin decision?
   - Recommendation: Keep it simple -- `warningCount` integer field, no auto-escalation for v1. Admin manually decides when to ban. This is in Claude's discretion area.

2. **Admin notification for new reports**
   - What we know: Notification system exists with SSE + BullMQ. Admin should know when new reports arrive.
   - What's unclear: Should admins get real-time notifications for every report, or just check the queue manually?
   - Recommendation: For v1, admin checks queue manually. The /admin page can show unread report count in the header. No push notifications for admin reports yet. This keeps scope manageable.

3. **Banned user's existing sessions**
   - What we know: Banned users cannot log in. But they might have active sessions (valid access tokens).
   - What's unclear: Should we immediately invalidate all sessions on ban?
   - Recommendation: Delete all refresh tokens on ban (same as stolen token detection pattern). Access token will expire naturally in 15 min. Optionally add `isBanned` check in JwtStrategy for immediate rejection.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest (existing) |
| Config file | `backend/jest.config.ts` |
| Quick run command | `cd backend && npx jest --testPathPattern="moderation\|admin" --no-coverage -x` |
| Full suite command | `cd backend && npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MODR-01 | User can report post/user with reason, appears in admin queue | unit | `cd backend && npx jest src/moderation/__tests__/moderation.service.spec.ts -x` | Wave 0 |
| MODR-02 | User can block, hides content bidirectionally, auto-unfollows | unit | `cd backend && npx jest src/moderation/__tests__/block.spec.ts -x` | Wave 0 |
| MODR-03 | User can mute, removes from feed only | unit | `cd backend && npx jest src/moderation/__tests__/mute.spec.ts -x` | Wave 0 |
| MODR-04 | Admin can view queue, dismiss/warn/remove/ban | unit | `cd backend && npx jest src/admin/__tests__/admin.service.spec.ts -x` | Wave 0 |
| MODR-02+ | Feed/search/profile correctly filters blocked users | unit | `cd backend && npx jest src/feed/__tests__/feed-block-filter.spec.ts -x` | Wave 0 |
| MODR-02+ | Ban check in login prevents banned user access | unit | `cd backend && npx jest src/auth/__tests__/ban-check.spec.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && npx jest --testPathPattern="moderation\|admin\|ban" --no-coverage -x`
- **Per wave merge:** `cd backend && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/moderation/__tests__/moderation.service.spec.ts` -- covers MODR-01 (report CRUD)
- [ ] `backend/src/moderation/__tests__/block.spec.ts` -- covers MODR-02 (block/unblock + auto-unfollow)
- [ ] `backend/src/moderation/__tests__/mute.spec.ts` -- covers MODR-03 (mute/unmute toggle)
- [ ] `backend/src/admin/__tests__/admin.service.spec.ts` -- covers MODR-04 (queue listing + actions)
- [ ] `backend/src/feed/__tests__/feed-block-filter.spec.ts` -- covers block/mute feed filtering
- [ ] `backend/src/auth/__tests__/ban-check.spec.ts` -- covers banned user login prevention

*(Test files follow established pattern: NestJS TestingModule with mocked PrismaService, jest.fn() mocks, P2002/P2025 error handling tests)*

## Sources

### Primary (HIGH confidence)
- **Codebase analysis** -- Complete review of all 16 backend modules (auth, profiles, social, posts, comments, feed, search, collection, checklist, notifications, media, prisma, email, config) and all frontend route groups, components, hooks, and stores
- **Prisma schema** -- `backend/prisma/schema.prisma` reviewed for all existing models, relations, indexes, and naming conventions
- **Existing patterns** -- Idempotent toggle (P2002/P2025), cursor pagination (take+1), batch presigned URL resolution, Vietnamese error messages, BullMQ notification queue, shadcn/ui component usage

### Secondary (MEDIUM confidence)
- **Prisma relation patterns** -- Self-referential many-to-many (Block, Mute) follow the same pattern as Follow model (already proven in project)
- **NestJS guard stacking** -- JwtAuthGuard + EmailVerifiedGuard + AdminGuard triple-guard pattern follows NestJS documentation for layered authorization

### Tertiary (LOW confidence)
- None -- all recommendations based on verified codebase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies needed, all building on existing proven stack
- Architecture: HIGH -- follows exact patterns established in Phases 1-6 (module structure, guard patterns, service patterns, query patterns)
- Pitfalls: HIGH -- derived from actual codebase analysis showing exactly which services need modification
- Integration points: HIGH -- every file that needs modification was read and verified

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable -- no external dependency changes, purely internal architecture)
