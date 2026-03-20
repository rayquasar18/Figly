# Phase 2: Profiles & Social Graph - Research

**Researched:** 2026-03-14
**Domain:** User profiles, username system, avatar upload, follow/unfollow social graph, Prisma self-relations
**Confidence:** HIGH

## Summary

Phase 2 builds user identity and social networking on top of the existing Phase 1 foundation. The work divides into three main domains: (1) extending the User model with profile fields (username, bio, avatar) and modifying the signup flow, (2) building the profile viewing/editing UI with an Instagram-style layout, and (3) implementing a follow/unfollow social graph with follower/following counts and lists.

The existing stack provides strong support for all requirements. Prisma handles the self-referential many-to-many follow relation via an explicit join table. The media pipeline (MinIO + BullMQ + Sharp) already processes images at three sizes -- avatar upload plugs directly into this. TanStack Query and Zustand handle data fetching and optimistic follow/unfollow updates on the frontend. The NestJS module pattern established in auth and media modules provides a clear template for the new profiles and social modules.

The primary challenge is the username routing pattern -- profile URLs use `/@username` which requires a Next.js dynamic route `[username]` under the `(app)` route group, plus sub-routes for `/followers` and `/following`. The `@` prefix is cosmetic (used in display) while the route parameter is the raw username. This is purely a frontend routing concern; the backend API takes the username as a path parameter.

**Primary recommendation:** Build in three waves -- (1) backend schema + profile CRUD + username system, (2) follow system backend, (3) frontend profile page + edit modal + follow UI + follower/following lists. Avatar upload reuses the existing media pipeline with no new backend infrastructure needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Instagram-style header: circular avatar on the left, stats (posts/followers/following) on the right in a row
- Display name, @username, and bio below the stats row
- "Edit Profile" button for own profile, "Follow" button for other users
- 3-column square thumbnail grid for posts below the header
- Tapping a grid thumbnail opens the post
- Edit profile: modal/drawer overlay on the profile page (not a separate page)
- Edit profile fields: avatar upload, display name, @username, bio
- Bio character limit: 150 characters
- @username is required -- picked during signup flow
- Username rules: lowercase letters, numbers, underscores, periods. 3-30 characters (Instagram rules)
- New `username` field in User model (unique, indexed)
- Profile URLs use username: /@username
- Username is changeable with a cooldown (14-day cooldown between changes)
- All accounts are public -- anyone can follow anyone instantly, no approval needed
- Follow/unfollow is an instant toggle -- no confirmation
- Button visual states: filled/primary for "Follow", outlined/secondary for "Following"
- "Follows you" badge displayed on profiles of users who follow you back
- Full-page display at /@username/followers and /@username/following
- Each row: avatar + display name + @username + follow/unfollow button
- Search bar at the top to filter follower/following lists
- On own followers list: "Remove" button to remove a follower (silent, no notification)

### Claude's Discretion
- Exact avatar size and spacing in profile header
- Loading skeletons and empty states
- Error handling UI
- Pagination strategy for follower/following lists
- Mobile responsive adjustments to profile layout
- Username change cooldown implementation details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | User can create profile with display name and avatar | User model extension (username, bio, avatarId fields), signup flow modification to collect username, avatar upload via existing media pipeline, edit profile modal |
| PROF-02 | User can write and edit bio | Bio field on User model (150 char limit), edit profile modal with textarea and character counter, Zod validation in shared package |
| PROF-03 | User can view other users' profiles with post grid | Profile page at /[username] route, profile header component, 3-column post grid (placeholder for Phase 3 posts), public profile API endpoint |
| SOCL-01 | User can follow/unfollow other users | Follow model (explicit join table), follow/unfollow toggle API, optimistic UI updates, follower/following counts, "Follows you" badge |
| SOCL-02 | User can view followers and following lists | Follower/following list pages, paginated API with search filter, user row component with follow/unfollow button, remove follower capability |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^6.4 | ORM -- User model extension, Follow model, self-referential relations | Already in use, handles join tables and relation queries natively |
| NestJS | ^10.4 | Backend framework -- profile module, social module | Already in use, module pattern established |
| Next.js | ^14.2 | Frontend -- profile pages, dynamic username routing | Already in use, App Router with route groups |
| TanStack Query | ^5.62 | Data fetching -- profile queries, follow mutations, follower lists | Already in use, staleTime/invalidation patterns established |
| Zustand | ^5.0 | Client state -- optimistic follow/unfollow state | Already in use for auth state |
| shadcn/ui | latest | UI components -- Avatar, Button, Dialog/Drawer, Input, Textarea, Skeleton | Partially installed, add missing components |
| react-hook-form | ^7.71 | Form handling -- edit profile form | Already in use for auth forms |
| Zod | ^3.24 | Validation -- username, bio schemas in shared package | Already in use for auth DTOs |

### Supporting (New Components to Add)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui Avatar | latest | Circular avatar display with fallback initials | Profile header, user rows in follower lists |
| shadcn/ui Dialog | latest | Edit profile modal overlay | Edit profile interaction |
| shadcn/ui Textarea | latest | Bio text input with character count | Edit profile form |
| shadcn/ui Skeleton | latest | Loading states for profile page | Initial load, lazy content |
| shadcn/ui Tabs | latest | Profile content tabs (Posts tab now, Collection tab in Phase 4) | Profile page content sections |
| lucide-react | ^0.468 | Icons -- Grid, Users, Settings, etc. | Already installed, use for UI elements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Explicit join table (Follow model) | Prisma implicit many-to-many | Explicit gives `createdAt` on the follow relation, needed for sorting follower lists by follow date |
| shadcn Dialog for edit profile | shadcn Drawer (Sheet) | Dialog better for desktop, Drawer better for mobile. Recommend Dialog with responsive sizing; can switch to Drawer later if needed |
| Cursor-based pagination for lists | Offset-based pagination | Cursor-based is better for real-time lists where items can be added/removed. Use cursor-based for follower/following lists |

**Installation:**
```bash
# Frontend -- add missing shadcn components
cd frontend
npx shadcn@latest add avatar dialog textarea skeleton tabs separator scroll-area

# No new npm packages needed -- everything is already installed
```

## Architecture Patterns

### Recommended Project Structure

#### Backend
```
backend/src/
  profiles/
    profiles.module.ts          # NestJS module
    profiles.controller.ts      # REST endpoints
    profiles.service.ts         # Business logic
    dto/
      update-profile.dto.ts     # class-validator DTO
  social/
    social.module.ts            # NestJS module
    social.controller.ts        # REST endpoints
    social.service.ts           # Business logic
    dto/
      follow.dto.ts             # class-validator DTO
```

#### Frontend
```
frontend/src/
  app/
    (app)/
      [username]/
        page.tsx                # Profile page
        followers/
          page.tsx              # Followers list
        following/
          page.tsx              # Following list
  components/
    profile/
      profile-header.tsx        # Avatar + stats + buttons
      profile-edit-modal.tsx    # Edit profile dialog
      profile-post-grid.tsx     # 3-column post grid
      profile-stats.tsx         # Posts/followers/following counts
    social/
      follow-button.tsx         # Follow/unfollow toggle
      user-row.tsx              # Avatar + name + username + action button
      follower-list.tsx         # List with search filter
  hooks/
    queries/
      profile-queries.ts        # useProfile, useUpdateProfile, etc.
      social-queries.ts         # useFollow, useUnfollow, useFollowers, etc.
```

### Pattern 1: Prisma Explicit Self-Referential Many-to-Many (Follow Model)

**What:** An explicit join table for the follow relationship, allowing metadata (createdAt) on the relation itself.
**When to use:** When you need timestamps, status, or any data on the relationship -- not just the existence of it.

```prisma
// schema.prisma

model User {
  id              String   @id @default(cuid())
  // ... existing fields ...
  username        String   @unique
  bio             String?  @db.VarChar(150)
  avatarId        String?
  avatar          Media?   @relation("UserAvatar", fields: [avatarId], references: [id])
  usernameChangedAt DateTime?

  // Self-referential follow relations
  followers       Follow[] @relation("following")  // Users who follow this user
  following       Follow[] @relation("follower")   // Users this user follows

  @@map("users")
}

model Follow {
  id          String   @id @default(cuid())
  followerId  String
  followingId String
  follower    User     @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("following", fields: [followingId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
  @@map("follows")
}
```

**Key points:**
- The `@@unique([followerId, followingId])` constraint prevents duplicate follows
- Two separate indexes on each FK column for fast lookups in both directions
- `onDelete: Cascade` ensures follows are cleaned up when a user is deleted
- `createdAt` enables sorting follower lists by follow date

### Pattern 2: Username Validation and Cooldown

**What:** Server-side username validation with uniqueness check and change cooldown enforcement.
**When to use:** Every profile update that includes a username change.

```typescript
// Shared package: packages/shared/src/validators/username.ts
import { z } from 'zod';

export const USERNAME_RULES = {
  minLength: 3,
  maxLength: 30,
  pattern: /^[a-z0-9_.]+$/,
  cooldownDays: 14,
} as const;

export const usernameSchema = z
  .string()
  .min(USERNAME_RULES.minLength, {
    message: `Ten nguoi dung phai co it nhat ${USERNAME_RULES.minLength} ky tu`,
  })
  .max(USERNAME_RULES.maxLength, {
    message: `Ten nguoi dung khong duoc vuot qua ${USERNAME_RULES.maxLength} ky tu`,
  })
  .regex(USERNAME_RULES.pattern, {
    message: 'Ten nguoi dung chi chua chu thuong, so, dau gach duoi va dau cham',
  });

export const bioSchema = z
  .string()
  .max(150, { message: 'Tieu su khong duoc vuot qua 150 ky tu' })
  .optional();
```

```typescript
// Backend: profiles.service.ts -- cooldown check
async updateProfile(userId: string, dto: UpdateProfileDto) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  if (dto.username && dto.username !== user.username) {
    // Check cooldown
    if (user.usernameChangedAt) {
      const cooldownEnd = new Date(user.usernameChangedAt);
      cooldownEnd.setDate(cooldownEnd.getDate() + USERNAME_RULES.cooldownDays);
      if (new Date() < cooldownEnd) {
        throw new BadRequestException(
          `Ban chi co the doi ten nguoi dung sau ${USERNAME_RULES.cooldownDays} ngay`
        );
      }
    }

    // Check uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Ten nguoi dung da duoc su dung');
    }
  }

  return this.prisma.user.update({
    where: { id: userId },
    data: {
      ...(dto.displayName && { name: dto.displayName }),
      ...(dto.username && dto.username !== user.username && {
        username: dto.username,
        usernameChangedAt: new Date(),
      }),
      ...(dto.bio !== undefined && { bio: dto.bio }),
      ...(dto.avatarId && { avatarId: dto.avatarId }),
    },
  });
}
```

### Pattern 3: Optimistic Follow/Unfollow with TanStack Query

**What:** Immediate UI response for follow/unfollow, reverting on server error.
**When to use:** Every follow/unfollow interaction.

```typescript
// hooks/queries/social-queries.ts
export function useFollowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await apiClient.post(`/social/follow/${targetUserId}`);
      return response.data;
    },
    onMutate: async (targetUserId) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['profile', targetUserId] });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(['profile', targetUserId]);

      // Optimistically update
      queryClient.setQueryData(['profile', targetUserId], (old: any) => ({
        ...old,
        isFollowing: true,
        followerCount: (old?.followerCount ?? 0) + 1,
      }));

      return { previousProfile };
    },
    onError: (_err, targetUserId, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['profile', targetUserId],
        context?.previousProfile
      );
    },
    onSettled: (_data, _error, targetUserId) => {
      // Always refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['profile', targetUserId] });
    },
  });
}
```

### Pattern 4: Next.js Dynamic Username Route

**What:** Profile pages accessible at `/username` (display as `/@username`) using Next.js App Router dynamic segments.
**When to use:** All profile-related pages.

```
frontend/src/app/(app)/[username]/
  page.tsx              -> /johndoe (profile page)
  followers/page.tsx    -> /johndoe/followers
  following/page.tsx    -> /johndoe/following
```

**Important:** The `@` symbol in `/@username` is a display convention, not part of the URL path. URLs are `/username`, not `/@username`. The `@` is shown in the UI when displaying usernames. This avoids Next.js interpreting `@` as a route group (Next.js uses `@` for parallel routes / named slots).

```typescript
// frontend/src/app/(app)/[username]/page.tsx
'use client';
import { use } from 'react';
import { useProfile } from '@/hooks/queries/profile-queries';

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { data: profile, isLoading, isError } = useProfile(username);

  if (isLoading) return <ProfileSkeleton />;
  if (isError || !profile) return <ProfileNotFound />;

  return <ProfileView profile={profile} />;
}
```

### Pattern 5: Profile API Response Shape

**What:** Consistent API response that includes relationship context for the viewing user.
**When to use:** GET /profiles/:username endpoint.

```typescript
// Backend response shape
interface ProfileResponse {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;       // Presigned URL from media service
  postCount: number;
  followerCount: number;
  followingCount: number;
  isOwnProfile: boolean;          // true if viewer === profile owner
  isFollowing: boolean;           // true if viewer follows this user
  isFollowedBy: boolean;          // true if this user follows viewer ("Follows you" badge)
}
```

### Anti-Patterns to Avoid

- **Counting followers via relation load:** Never do `user.followers.length`. Use `_count` in Prisma: `include: { _count: { select: { followers: true, following: true } } }`. Loading all follow records to count them is an N+1 disaster.
- **Storing follower/following counts as fields:** Don't maintain separate `followerCount`/`followingCount` columns. Prisma's `_count` is efficient and always accurate. Denormalized counts drift and require complex sync logic.
- **Using `@` in URL paths:** Don't create `app/(app)/@[username]` -- the `@` symbol in Next.js App Router denotes parallel route slots. Use `[username]` and display `@` only in the UI.
- **Blocking on avatar upload during profile edit:** Avatar upload should be async. Upload the file, get back the media ID immediately (while processing happens in background), save the media ID to the profile. Don't wait for all thumbnails to finish.
- **Implicit many-to-many for follows:** Prisma implicit M2M creates a hidden join table with no timestamp. Use explicit Follow model so you can sort by `createdAt` and add future fields (e.g., notification preferences).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Avatar image processing | Custom image resizer | Existing media pipeline (MinIO + BullMQ + Sharp) | Already handles upload, async processing at 3 sizes, presigned URLs |
| Username uniqueness checking | Manual SQL queries | Prisma `@unique` constraint + findUnique check | Database-level enforcement prevents race conditions |
| Follower count computation | Manual COUNT queries | Prisma `_count` on relations | Optimized by Prisma, no manual SQL needed |
| Form validation | Manual string checks | Zod schemas in shared package | Already established pattern, shared between frontend and backend |
| Pagination | Custom offset logic | Cursor-based with Prisma `cursor` + `take` | Prisma has built-in cursor pagination, handles edge cases |
| Avatar placeholder/fallback | Custom SVG generator | shadcn/ui Avatar with AvatarFallback | Built-in fallback with initials, handles load errors |
| Optimistic UI updates | Manual state management | TanStack Query onMutate/onError/onSettled | Battle-tested pattern, handles race conditions and rollback |

**Key insight:** This phase has zero new infrastructure dependencies. Every backend capability (media upload, database, auth) is already built. The work is extending existing patterns to new domains.

## Common Pitfalls

### Pitfall 1: Username Race Condition on Signup
**What goes wrong:** Two users simultaneously try to register with the same username. The `findUnique` check passes for both, but one `create` fails with a unique constraint violation.
**Why it happens:** Check-then-act is not atomic.
**How to avoid:** Use Prisma's `@unique` constraint on `username` and catch `PrismaClientKnownRequestError` with code `P2002` (unique constraint violation). Return a user-friendly error message.
**Warning signs:** Unhandled Prisma errors in production logs.

### Pitfall 2: N+1 Queries in Follower Lists
**What goes wrong:** Loading a list of 50 followers fires 50 separate queries to check if the current user follows each of them.
**Why it happens:** Naive implementation checks follow status one-by-one.
**How to avoid:** Batch the follow-status check. Query all follow relationships between the current user and the list of user IDs in a single query: `prisma.follow.findMany({ where: { followerId: currentUserId, followingId: { in: userIds } } })`. Then create a Set of followed IDs for O(1) lookup.
**Warning signs:** Slow follower/following list page loads; increasing query count with list size.

### Pitfall 3: Stale Follow State After Optimistic Update
**What goes wrong:** User follows someone, navigates away, comes back -- the follow state is stale because the query cache was not properly invalidated.
**Why it happens:** Only the profile query key was updated optimistically, but the follower list and follower count queries were not invalidated.
**How to avoid:** In `onSettled` of follow/unfollow mutations, invalidate all related query keys: `['profile', username]`, `['followers', username]`, `['following', currentUsername]`. Use query key prefixes for broad invalidation.
**Warning signs:** Follow button state doesn't match server state after navigation.

### Pitfall 4: Avatar URL Expiration
**What goes wrong:** Profile page shows broken avatar images after the presigned URL expires (typically 1 hour).
**Why it happens:** Presigned S3/MinIO URLs have a TTL. If the profile data is cached longer than the URL TTL, the URLs become invalid.
**How to avoid:** Set TanStack Query `staleTime` for profile data shorter than the presigned URL TTL. The existing `staleTime: 5 * 60 * 1000` (5 minutes) is safe for 1-hour presigned URLs. On refetch, the backend generates fresh URLs.
**Warning signs:** Avatar images break after leaving the page open for a long time.

### Pitfall 5: Signup Flow Modification Breaking Existing Users
**What goes wrong:** Adding a required `username` field to the User model fails the migration because existing users don't have usernames.
**Why it happens:** Adding a non-nullable unique column to a table with existing data.
**How to avoid:** Two-step migration: (1) add `username` as nullable, (2) backfill existing users with generated usernames (e.g., from email prefix or cuid), (3) make the column non-nullable. Or use Prisma's `@default()` for the migration if generating from a known pattern.
**Warning signs:** Migration fails in development or staging.

### Pitfall 6: Username with Special Characters in URLs
**What goes wrong:** Usernames with periods (allowed by the rules: `john.doe`) might conflict with Next.js file extension resolution.
**Why it happens:** Next.js might interpret `john.doe` as a file request.
**How to avoid:** This is generally not an issue with the App Router as it handles dynamic segments cleanly. But verify that usernames like `test.json` or `api.something` don't conflict. Reserve a list of protected usernames (e.g., `api`, `auth`, `admin`, `login`, `signup`, `settings`, `explore`, `search`).
**Warning signs:** 404 errors for users with periods in their username.

## Code Examples

### Backend: Profiles Controller
```typescript
// Source: Based on established NestJS patterns in this codebase
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get(':username')
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @Param('username') username: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.profilesService.getProfile(username, userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, EmailVerifiedGuard)
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.profilesService.updateProfile(userId, dto);
  }

  @Get(':username/check')
  async checkUsername(@Param('username') username: string) {
    const available = await this.profilesService.isUsernameAvailable(username);
    return { available };
  }
}
```

### Backend: Social Controller
```typescript
// Source: Based on established NestJS patterns in this codebase
@Controller('social')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow/:userId')
  @HttpCode(HttpStatus.OK)
  async follow(
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.socialService.follow(userId, targetUserId);
  }

  @Delete('follow/:userId')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.socialService.unfollow(userId, targetUserId);
  }

  @Get(':username/followers')
  async getFollowers(
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.socialService.getFollowers(username, userId, { cursor, search });
  }

  @Get(':username/following')
  async getFollowing(
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.socialService.getFollowing(username, userId, { cursor, search });
  }

  @Delete('followers/:userId')
  @HttpCode(HttpStatus.OK)
  async removeFollower(
    @Param('userId') followerUserId: string,
    @Req() req: Request,
  ) {
    const { userId } = req.user as any;
    return this.socialService.removeFollower(userId, followerUserId);
  }
}
```

### Backend: Prisma Count Query for Profile
```typescript
// Source: Prisma documentation -- relation count queries
async getProfile(username: string, viewerId: string) {
  const user = await this.prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      avatarId: true,
      avatar: {
        select: { thumbnailKey: true, mediumKey: true },
      },
      _count: {
        select: {
          followers: true,
          following: true,
          // posts: true,  -- added in Phase 3
        },
      },
    },
  });

  if (!user) throw new NotFoundException('Nguoi dung khong ton tai');

  // Check follow relationship in batch
  const [isFollowing, isFollowedBy] = await Promise.all([
    this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: viewerId,
          followingId: user.id,
        },
      },
    }),
    this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: viewerId,
        },
      },
    }),
  ]);

  const avatarUrl = user.avatar?.mediumKey
    ? await this.storageService.getPresignedUrl(user.avatar.mediumKey)
    : null;

  return {
    id: user.id,
    username: user.username,
    displayName: user.name,
    bio: user.bio,
    avatarUrl,
    postCount: 0,  // Placeholder until Phase 3
    followerCount: user._count.followers,
    followingCount: user._count.following,
    isOwnProfile: user.id === viewerId,
    isFollowing: !!isFollowing,
    isFollowedBy: !!isFollowedBy,
  };
}
```

### Backend: Cursor-Based Pagination for Follower Lists
```typescript
// Source: Prisma cursor-based pagination pattern
async getFollowers(
  username: string,
  viewerId: string,
  options: { cursor?: string; search?: string; take?: number },
) {
  const take = options.take || 20;
  const user = await this.prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });

  if (!user) throw new NotFoundException('Nguoi dung khong ton tai');

  const where: any = { followingId: user.id };

  if (options.search) {
    where.follower = {
      OR: [
        { username: { contains: options.search, mode: 'insensitive' } },
        { name: { contains: options.search, mode: 'insensitive' } },
      ],
    };
  }

  const follows = await this.prisma.follow.findMany({
    where,
    select: {
      id: true,
      follower: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarId: true,
          avatar: { select: { thumbnailKey: true } },
        },
      },
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(options.cursor && {
      cursor: { id: options.cursor },
      skip: 1,
    }),
  });

  const hasMore = follows.length > take;
  const items = follows.slice(0, take);
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // Batch check follow status for all users in list
  const followerIds = items.map((f) => f.follower.id);
  const viewerFollows = await this.prisma.follow.findMany({
    where: {
      followerId: viewerId,
      followingId: { in: followerIds },
    },
    select: { followingId: true },
  });
  const followingSet = new Set(viewerFollows.map((f) => f.followingId));

  return {
    items: items.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      displayName: f.follower.name,
      avatarUrl: null, // Resolve presigned URLs
      isFollowing: followingSet.has(f.follower.id),
      followedAt: f.createdAt,
    })),
    nextCursor,
    hasMore,
  };
}
```

### Frontend: Follow Button Component
```typescript
// Source: Based on established component patterns in this codebase
'use client';
import { Button } from '@/components/ui/button';
import { useFollowMutation, useUnfollowMutation } from '@/hooks/queries/social-queries';

interface FollowButtonProps {
  userId: string;
  username: string;
  isFollowing: boolean;
}

export function FollowButton({ userId, username, isFollowing }: FollowButtonProps) {
  const followMutation = useFollowMutation();
  const unfollowMutation = useUnfollowMutation();

  const isPending = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isFollowing ? 'Dang theo doi' : 'Theo doi'}
    </Button>
  );
}
```

### Shared Package: Profile Types
```typescript
// packages/shared/src/types/profile.types.ts
export interface ProfileResponse {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isOwnProfile: boolean;
  isFollowing: boolean;
  isFollowedBy: boolean;
}

export interface UserListItem {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isFollowing: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma implicit M2M | Explicit join table for social relations | Always recommended for social graphs | Allows metadata (createdAt), custom indexes, future extensibility |
| Next.js Pages Router dynamic routes | App Router `[param]` with `params` as Promise | Next.js 15 (late 2024) | params is now async/Promise in Next.js 15+; project uses 14.2 where params is synchronous, but code should use `use()` for forward compatibility |
| React Query v4 optimistic updates | TanStack Query v5 with improved types | TanStack Query v5 (2023) | Same pattern (onMutate/onError/onSettled), but improved TypeScript support |
| `getServerSideProps` for profile data | Client-side fetching with TanStack Query | Project decision (Next.js as pure frontend) | All data flows through NestJS API; frontend is purely client-rendered with TanStack Query |

**Deprecated/outdated:**
- `useRouter().query` for accessing route params (Pages Router) -- use `useParams()` or `params` prop in App Router
- `getServerSideProps` / `getStaticProps` -- project uses App Router with client-side data fetching

## Open Questions

1. **Post grid placeholder strategy**
   - What we know: PROF-03 requires showing a post grid, but posts are Phase 3
   - What's unclear: Should we build the grid component with placeholder data, or show an empty state?
   - Recommendation: Build the grid component structure with an empty state message ("Chua co bai viet nao"). The component will be ready to receive real post data in Phase 3.

2. **Username assignment for existing OAuth users**
   - What we know: The signup flow must collect @username. But OAuth users (Google/Apple) created in Phase 1 don't have usernames.
   - What's unclear: Should OAuth users be forced to pick a username on first login after this phase ships?
   - Recommendation: Yes -- add a "complete profile" interstitial that shows after login if `username` is null. This gates access to the app until username is set, similar to the email verification gate.

3. **Reserved username list**
   - What we know: Certain usernames must be blocked to prevent confusion with routes (api, auth, admin, etc.)
   - What's unclear: Exact list of reserved usernames
   - Recommendation: Maintain a RESERVED_USERNAMES constant in the shared package. Include at minimum: `api`, `auth`, `admin`, `login`, `signup`, `settings`, `explore`, `search`, `help`, `about`, `terms`, `privacy`, `notifications`, `messages`, `feed`, `discover`.

4. **Avatar crop before upload**
   - What we know: Users upload avatars via the existing media pipeline
   - What's unclear: Should there be client-side cropping (e.g., react-easy-crop) to enforce square aspect ratio?
   - Recommendation: Defer client-side cropping to a future enhancement. For now, accept any image and server-side crop to square (center crop) during Sharp processing. This keeps Phase 2 scope manageable.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `backend/jest.config.ts` |
| Quick run command | `cd backend && npx jest --testPathPattern="profiles\|social" --no-coverage -x` |
| Full suite command | `cd backend && npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Create profile with display name and avatar | unit | `cd backend && npx jest src/profiles/__tests__/profiles.service.spec.ts -x` | No -- Wave 0 |
| PROF-02 | Write and edit bio | unit | `cd backend && npx jest src/profiles/__tests__/profiles.service.spec.ts -x` | No -- Wave 0 |
| PROF-03 | View other users' profiles with post grid | unit | `cd backend && npx jest src/profiles/__tests__/profiles.service.spec.ts -x` | No -- Wave 0 |
| SOCL-01 | Follow/unfollow other users | unit | `cd backend && npx jest src/social/__tests__/social.service.spec.ts -x` | No -- Wave 0 |
| SOCL-02 | View followers and following lists | unit | `cd backend && npx jest src/social/__tests__/social.service.spec.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && npx jest --testPathPattern="profiles|social" --no-coverage -x`
- **Per wave merge:** `cd backend && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/profiles/__tests__/profiles.service.spec.ts` -- covers PROF-01, PROF-02, PROF-03
- [ ] `backend/src/social/__tests__/social.service.spec.ts` -- covers SOCL-01, SOCL-02
- [ ] No new framework install needed -- Jest already configured

## Sources

### Primary (HIGH confidence)
- Codebase analysis -- read all existing source files in backend/src/ and frontend/src/ to verify patterns, dependencies, and conventions
- Prisma schema.prisma -- current User/Media model structure verified by reading the file directly
- package.json files (root, backend, frontend) -- verified all installed dependencies and versions
- Next.js official documentation (dynamic routes) -- fetched and verified App Router dynamic segment patterns

### Secondary (MEDIUM confidence)
- Prisma self-relation many-to-many pattern -- based on well-established Prisma documentation patterns (stable API, unchanged since Prisma 4+)
- TanStack Query v5 optimistic update pattern -- based on established TanStack Query documentation (stable API)
- NestJS module/controller/service pattern -- directly observed in auth and media modules in this codebase

### Tertiary (LOW confidence)
- Next.js 14 vs 15 `params` Promise behavior -- the project uses Next.js ^14.2; in 14.x params is synchronous, but Next.js 15+ makes it async. Code examples use `use()` for forward compatibility but this may not be strictly necessary in 14.x.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and in use; no new dependencies
- Architecture: HIGH -- follows established patterns from Phase 1 modules; Prisma self-relations are well-documented
- Pitfalls: HIGH -- common social graph pitfalls are well-known (N+1, race conditions, stale state)

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (30 days -- stable technologies, no fast-moving APIs)
