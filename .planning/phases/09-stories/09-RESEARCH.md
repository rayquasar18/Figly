# Phase 9: Stories - Research

**Researched:** 2026-03-16
**Domain:** Ephemeral content (24h stories) with photo/video support, horizontal story bar UI
**Confidence:** HIGH

## Summary

Phase 9 implements Instagram-style ephemeral stories -- photo or short video content that auto-expires after 24 hours. This is a well-established UI/UX pattern with clear implementation paths. The Figly codebase already has all the infrastructure needed: media upload via MinIO + BullMQ processing, presigned URL resolution, Prisma ORM, NestJS module structure, and TanStack Query on the frontend.

The key technical challenges are: (1) adding video support to the existing image-only media pipeline, (2) implementing TTL-based auto-deletion of expired stories, and (3) building the horizontal story bar UI with viewed/unviewed state tracking. The data model is straightforward -- a Story model linked to User and Media with an `expiresAt` timestamp, plus a StoryView join table for tracking who has viewed each story.

**Primary recommendation:** Use the existing media upload pipeline with video extension (sharp for images, ffmpeg/fluent-ffmpeg for video thumbnails), Prisma for Story/StoryView models with `expiresAt` field, BullMQ repeatable job for periodic cleanup of expired stories, and a horizontal scroll component at the top of the feed page.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-08 | User can post stories (24h ephemeral photo/video content) | Story model with `expiresAt = now + 24h`, media upload reuse, video MIME type validation, StoryMedia join table, create/delete endpoints, BullMQ cleanup job |
| CONT-09 | User can view stories from followed users | StoryBar component at top of feed, stories grouped by user, StoryView tracking for viewed/unviewed ring indicators, full-screen story viewer with tap-to-advance, auto-advance timer |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS | ^10.4.0 | Backend framework | Already used, module-based architecture |
| Prisma | ^6.4.0 | ORM + migrations | Already used for all data models |
| BullMQ | ^5.71.0 | Background job queue | Already used for media processing + notifications |
| sharp | ^0.34.5 | Image processing | Already used in media processor |
| MinIO (S3-compatible) | latest | Object storage | Already used for all media storage |
| TanStack Query | ^5.62.0 | Frontend data fetching | Already used for all API queries |
| Zustand | ^5.0.0 | Frontend state management | Already used for create-post, notifications, messaging |
| Tailwind CSS | ^3.4.0 | Styling | Already used throughout |
| Lucide React | ^0.468.0 | Icons | Already used throughout |
| date-fns | ^4.1.0 | Date formatting | Already used for timestamps |

### New Dependencies Required
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fluent-ffmpeg | ^2.1.3 | Video thumbnail extraction | Generate thumbnail frame from uploaded video |
| @types/fluent-ffmpeg | ^2.1.27 | TypeScript types | Dev dependency for fluent-ffmpeg |

**Note on video processing:** The project already has `FILE_LIMITS.video = 100MB` defined in shared constants, indicating video support was planned from the start. For stories, video should be capped at 15 seconds / 30MB to keep processing fast and storage manageable.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fluent-ffmpeg | @ffmpeg/ffmpeg (WASM) | Client-side processing saves server resources but is slower and less reliable on mobile browsers. Server-side is the established pattern. |
| BullMQ cron for cleanup | pg_cron / PostgreSQL scheduled job | External dependency, harder to manage. BullMQ repeatable jobs are already infrastructure. |
| Custom story viewer | Swiper.js / embla-carousel | embla-carousel is already in the project for post carousels but story viewer needs vertical-swipe-between-users + horizontal-tap-to-advance. Custom is simpler for this specific UX. |

**Installation:**
```bash
cd backend && pnpm add fluent-ffmpeg && pnpm add -D @types/fluent-ffmpeg
```

**Docker:** FFmpeg must be available in the backend container. Add `RUN apk add --no-cache ffmpeg` to `Dockerfile.backend` (Alpine-based).

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── stories/
│   ├── __tests__/
│   │   └── stories.service.spec.ts
│   ├── dto/
│   │   └── create-story.dto.ts
│   ├── stories.module.ts
│   ├── stories.controller.ts
│   ├── stories.service.ts
│   └── stories-cleanup.processor.ts   # BullMQ repeatable job
├── media/
│   ├── media.processor.ts             # Extended with video thumbnail generation
│   └── media.service.ts               # Extended with video MIME validation

frontend/src/
├── components/
│   └── story/
│       ├── story-bar.tsx               # Horizontal scroll bar at top of feed
│       ├── story-avatar.tsx            # Single avatar circle with gradient ring
│       ├── story-viewer.tsx            # Full-screen story viewer overlay
│       ├── story-viewer-content.tsx    # Single story image/video display
│       └── create-story-flow.tsx       # Story creation (simpler than post creation)
├── hooks/
│   └── queries/
│       └── story-queries.ts            # TanStack Query hooks
├── stores/
│   └── create-story-store.ts           # Zustand store

packages/shared/src/
├── constants/
│   └── story.constants.ts              # STORY_LIMITS
├── types/
│   └── story.types.ts                  # StoryResponse, StoryGroupResponse
├── dto/
│   └── story.dto.ts                    # createStorySchema (Zod)
```

### Pattern 1: Story Data Model (Prisma)
**What:** New Story + StoryMedia + StoryView models
**When to use:** Core data persistence for ephemeral content
**Example:**
```prisma
model Story {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())

  media  StoryMedia[]
  views  StoryView[]

  @@index([userId, expiresAt])
  @@index([expiresAt])
  @@map("stories")
}

model StoryMedia {
  id       String @id @default(cuid())
  storyId  String
  story    Story  @relation(fields: [storyId], references: [id], onDelete: Cascade)
  mediaId  String
  media    Media  @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  position Int    @default(0)

  @@unique([storyId, position])
  @@index([storyId])
  @@map("story_media")
}

model StoryView {
  id       String   @id @default(cuid())
  storyId  String
  story    Story    @relation(fields: [storyId], references: [id], onDelete: Cascade)
  viewerId String
  viewedAt DateTime @default(now())

  @@unique([storyId, viewerId])
  @@index([storyId])
  @@index([viewerId])
  @@map("story_views")
}
```

### Pattern 2: Story Grouping by User (API Response)
**What:** Stories grouped by author for the horizontal bar
**When to use:** Feed page story bar rendering
**Example:**
```typescript
// Backend: GET /stories/feed
// Returns stories from followed users, grouped by author
// Current user's stories first (if any), then followed users sorted by latest story

interface StoryGroupResponse {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  stories: StoryResponse[];
  hasUnviewed: boolean;  // At least one story not viewed by current user
}

interface StoryResponse {
  id: string;
  media: { url: string; type: 'image' | 'video' }[];
  isViewed: boolean;
  createdAt: string;
  expiresAt: string;
}
```

### Pattern 3: BullMQ Repeatable Job for Cleanup
**What:** Periodic deletion of expired stories
**When to use:** Background cleanup every 15 minutes
**Example:**
```typescript
// stories-cleanup.processor.ts
@Processor('story-cleanup')
export class StoriesCleanupProcessor extends WorkerHost {
  async process(job: Job): Promise<void> {
    const deleted = await this.prisma.story.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    this.logger.log(`Cleaned up ${deleted.count} expired stories`);
  }
}

// stories.module.ts -- register with repeatable pattern
BullModule.registerQueue({ name: 'story-cleanup' })
// In onModuleInit:
await this.cleanupQueue.add('cleanup', {}, {
  repeat: { every: 15 * 60 * 1000 }, // Every 15 minutes
});
```

### Pattern 4: Story Bar Component (Instagram-style)
**What:** Horizontal scrollable story avatars above feed
**When to use:** Top of feed page
**Example:**
```tsx
// story-bar.tsx
export function StoryBar() {
  const { data: storyGroups } = useStoryFeed();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  return (
    <div className="border-b px-4 py-3">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {/* "Your Story" add button */}
        <StoryAvatar
          isAddButton
          onClick={() => openCreateStory()}
        />
        {/* Followed users' stories */}
        {storyGroups?.map((group, i) => (
          <StoryAvatar
            key={group.user.id}
            user={group.user}
            hasUnviewed={group.hasUnviewed}
            onClick={() => { setActiveGroupIndex(i); setViewerOpen(true); }}
          />
        ))}
      </div>
    </div>
  );
}
```

### Pattern 5: Extending Media Upload for Video
**What:** Accept video MIME types in media.service.ts upload
**When to use:** Story creation with video content
**Example:**
```typescript
// Extend media.service.ts upload method
const isImage = file.mimetype.startsWith('image/');
const isVideo = file.mimetype.startsWith('video/');

if (!isImage && !isVideo) {
  throw new BadRequestException('Chi chap nhan file hinh anh hoac video');
}

const sizeLimit = isVideo ? FILE_LIMITS.storyVideo : FILE_LIMITS.image;
if (file.size > sizeLimit) {
  throw new PayloadTooLargeException(`File khong duoc vuot qua ${sizeLimit / (1024 * 1024)}MB`);
}

// For video: queue video processing job (thumbnail extraction)
if (isVideo) {
  await this.mediaQueue.add('process-video', { mediaId: media.id, originalKey: key, userId });
}
```

### Anti-Patterns to Avoid
- **Storing expiry check in API query only:** Always filter by `expiresAt > now()` in every query, but ALSO run cleanup job. Do not rely solely on cleanup -- expired stories must never appear in API responses even if cleanup is delayed.
- **Loading all stories at once:** Use the grouped-by-user pattern. Load story media URLs lazily (only when viewer opens that user's stories), not when rendering the bar.
- **Mixing story and post data models:** Stories are ephemeral and fundamentally different from posts. Separate Story model, not a `isStory` flag on Post.
- **Client-side expiry calculation only:** Server must enforce expiry. Client displays countdown but server is source of truth.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video thumbnail extraction | Custom ffmpeg CLI wrapper | fluent-ffmpeg | Handles edge cases (codec detection, frame seeking, error recovery) |
| Scheduled cleanup | setTimeout / setInterval in NestJS | BullMQ repeatable jobs | Survives server restarts, distributed-safe, observable |
| Horizontal scroll with snap | Custom scroll + touch handlers | CSS `overflow-x: auto` + `scroll-snap-type` | Native performance, accessibility, momentum scrolling |
| Story progress bar animation | Manual setInterval timer | CSS animation with `animation-duration` | GPU-accelerated, no JS timer drift |
| Gradient ring indicator | SVG/Canvas custom drawing | CSS `background: conic-gradient(...)` on wrapper div | Simple, performant, well-supported |

**Key insight:** Stories appear complex but decompose into simple primitives: a model with TTL, grouped queries, upload reuse, and CSS-driven UI animations.

## Common Pitfalls

### Pitfall 1: Presigned URL Expiry vs Story Expiry Mismatch
**What goes wrong:** Presigned URLs (1h default) expire before the story (24h), causing broken images/videos in the viewer.
**Why it happens:** StorageService.getPresignedUrl defaults to 1h expiry.
**How to avoid:** For story media, use `expiresIn: 86400` (24h) matching story TTL. Or re-fetch URLs when opening the story viewer.
**Warning signs:** Stories show broken image icons after ~1 hour.

### Pitfall 2: N+1 Query on Story Feed
**What goes wrong:** Querying stories, then views, then media, then user avatars separately for each story group.
**Why it happens:** Naive Prisma includes without batching.
**How to avoid:** Single query with nested includes (user, media, _count of views), then batch presigned URL resolution (same pattern as FeedService.resolvePresignedUrls).
**Warning signs:** Slow story bar load time, many database round-trips.

### Pitfall 3: Video File Size Explosion
**What goes wrong:** Users upload 100MB videos as stories, consuming storage and bandwidth rapidly.
**Why it happens:** FILE_LIMITS.video = 100MB is designed for future Reels, not stories.
**How to avoid:** Define separate `FILE_LIMITS.storyVideo = 30 * 1024 * 1024` (30MB) and enforce on upload. Also enforce max duration (15s) server-side via ffprobe.
**Warning signs:** Storage costs spike, slow uploads on mobile.

### Pitfall 4: Race Condition on Story Cleanup
**What goes wrong:** A story gets deleted mid-view, causing 404 errors in the viewer.
**Why it happens:** BullMQ cleanup runs while user is viewing stories.
**How to avoid:** Frontend handles 404 gracefully -- skip to next story. Don't show error toast for expired stories.
**Warning signs:** Users report "Story disappeared while watching."

### Pitfall 5: Story View Count Inflation
**What goes wrong:** Same user viewing a story multiple times inflates view count.
**Why it happens:** Missing unique constraint or upsert logic.
**How to avoid:** `@@unique([storyId, viewerId])` constraint + upsert (P2002 catch) pattern, same as like/bookmark.
**Warning signs:** View counts much higher than follower counts.

### Pitfall 6: Blocked/Muted User Stories Appearing
**What goes wrong:** Stories from blocked or muted users appear in the story bar.
**Why it happens:** Forgetting to apply moderation filters on story feed query.
**How to avoid:** Reuse ModerationService.getBlockedUserIds/getMutedUserIds, same pattern as FeedService.getFeed.
**Warning signs:** Users see stories from people they blocked.

## Code Examples

### Story Constants (shared package)
```typescript
// packages/shared/src/constants/story.constants.ts
export const STORY_LIMITS = {
  maxDurationSeconds: 15,        // Max video duration
  maxVideoSize: 30 * 1024 * 1024, // 30MB
  expiryHours: 24,
  maxMediaPerStory: 1,           // One image or one video per story
} as const;
```

### Create Story DTO (shared package)
```typescript
// packages/shared/src/dto/story.dto.ts
import { z } from 'zod';

export const createStorySchema = z.object({
  mediaId: z.string().min(1, 'Media la bat buoc'),
});

export type CreateStoryDto = z.infer<typeof createStorySchema>;
```

### Story Types (shared package)
```typescript
// packages/shared/src/types/story.types.ts
export interface StoryMediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnailUrl?: string; // Video thumbnail
}

export interface StoryResponse {
  id: string;
  media: StoryMediaItem[];
  isViewed: boolean;
  createdAt: string;
  expiresAt: string;
}

export interface StoryGroupResponse {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  stories: StoryResponse[];
  hasUnviewed: boolean;
  latestAt: string; // For sorting: most recent story timestamp
}

export interface StoryFeedResponse {
  myStories: StoryGroupResponse | null; // Current user's stories (if any)
  followedStories: StoryGroupResponse[]; // Grouped by user, sorted by latest
}
```

### Story Service - Create
```typescript
// backend/src/stories/stories.service.ts
async createStory(userId: string, dto: CreateStoryDto) {
  // Validate media belongs to user and is COMPLETED
  const media = await this.prisma.media.findFirst({
    where: { id: dto.mediaId, userId, status: 'COMPLETED' },
  });
  if (!media) {
    throw new BadRequestException('Media khong hop le');
  }

  const expiresAt = new Date(Date.now() + STORY_LIMITS.expiryHours * 60 * 60 * 1000);

  const story = await this.prisma.story.create({
    data: {
      userId,
      expiresAt,
      media: {
        create: { mediaId: dto.mediaId, position: 0 },
      },
    },
  });

  return story;
}
```

### Story Service - Feed Query
```typescript
// backend/src/stories/stories.service.ts
async getStoryFeed(userId: string): Promise<StoryFeedResponse> {
  const now = new Date();

  // Get blocked + muted IDs
  const [blockedIds, mutedIds] = await Promise.all([
    this.moderationService.getBlockedUserIds(userId),
    this.moderationService.getMutedUserIds(userId),
  ]);
  const excludeIds = [...new Set([...blockedIds, ...mutedIds])];

  // Fetch all active (non-expired) stories from followed users + own
  const stories = await this.prisma.story.findMany({
    where: {
      expiresAt: { gt: now },
      user: {
        isBanned: false,
        OR: [
          { id: userId },
          { followers: { some: { followerId: userId } } },
        ],
      },
      userId: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
    },
    include: {
      user: {
        select: {
          id: true, username: true, name: true,
          avatar: { select: { mediumKey: true } },
        },
      },
      media: {
        include: { media: { select: { id: true, largeKey: true, mediumKey: true, thumbnailKey: true, mimeType: true } } },
        orderBy: { position: 'asc' },
      },
      views: {
        where: { viewerId: userId },
        select: { id: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by user, resolve URLs, determine viewed status
  // ... (group + map logic)
}
```

### Mark Story as Viewed
```typescript
async markViewed(storyId: string, viewerId: string) {
  try {
    await this.prisma.storyView.create({
      data: { storyId, viewerId },
    });
  } catch (error: any) {
    // P2002 = already viewed, idempotent
    if (error.code === 'P2002') return { success: true };
    throw error;
  }
  return { success: true };
}
```

### Story Avatar Component (gradient ring)
```tsx
// frontend/src/components/story/story-avatar.tsx
function StoryAvatar({ user, hasUnviewed, onClick, isAddButton }: Props) {
  if (isAddButton) {
    return (
      <button onClick={onClick} className="flex flex-col items-center gap-1">
        <div className="relative flex size-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40">
          <Plus className="size-5 text-muted-foreground" />
        </div>
        <span className="text-[10px] text-muted-foreground">Cua ban</span>
      </button>
    );
  }

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div
        className={cn(
          'rounded-full p-[2px]',
          hasUnviewed
            ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
            : 'bg-muted-foreground/30',
        )}
      >
        <div className="rounded-full border-2 border-background p-[1px]">
          <div className="size-14 overflow-hidden rounded-full bg-muted">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-sm font-medium">
                {user.displayName?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
      <span className="max-w-[64px] truncate text-[10px]">{user.username}</span>
    </button>
  );
}
```

### Story Viewer (full-screen overlay)
```tsx
// frontend/src/components/story/story-viewer.tsx
// Key behaviors:
// - Tap left side: previous story in group
// - Tap right side: next story in group
// - Swipe left/right or auto-advance at end: next/previous user's stories
// - Progress bars at top showing story position within group
// - Auto-advance: 5 seconds for images, video duration for videos
// - X button to close
// - Mark as viewed via POST /stories/:id/view on each story display
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebSocket-based story updates | Polling with staleTime (TanStack Query) | Current best practice for non-critical real-time | Simpler, sufficient for stories (not chat) |
| Client-side video processing | Server-side ffmpeg | Always standard for reliability | Consistent quality, works on all devices |
| Deleting expired rows in API queries | Scheduled cleanup + query filter | Instagram/Snapchat pattern | Clean data, predictable performance |
| Custom CSS animations for progress | `@keyframes` with `animation-duration` | Standard CSS | No JS timer overhead |

**Deprecated/outdated:**
- Service Workers for story notifications: Not needed for v1. Stories are passive content, not push-worthy.
- Story reactions/replies: Deferred to v2 (PLAT-V2-02: Interactive story elements).
- Story highlights: Deferred to v2 (SOCL-V2-02: Story highlights).

## Open Questions

1. **Video duration validation server-side**
   - What we know: ffprobe can extract duration metadata from uploaded video
   - What's unclear: Whether to reject at upload time (blocking) or during BullMQ processing (async)
   - Recommendation: Validate synchronously at upload time using ffprobe. Duration check is fast (reads metadata, not full video). This provides immediate user feedback.

2. **Story viewer navigation between users**
   - What we know: Instagram uses left-swipe to advance to next user, right-swipe for previous
   - What's unclear: Whether to implement full swipe gestures or just tap-to-advance with auto-progression
   - Recommendation: Start with tap-to-advance + auto-progression at group boundary. Full swipe gestures are complex touch handling that can be added later.

3. **Story creation entry point**
   - What we know: Instagram has a camera icon in the top-left and a "+" on the user's own story avatar
   - What's unclear: Whether to add a camera shortcut to the header or only use the "+" on story avatar
   - Recommendation: "+" on the story avatar in the bar (like the code example above). No header camera icon -- keeps the header clean. The create-story flow opens as a full-screen overlay similar to CreatePostFlow.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 + ts-jest 29.2 + @nestjs/testing 10.4 |
| Config file | `backend/jest.config.ts` |
| Quick run command | `cd backend && pnpm test -- --testPathPattern stories` |
| Full suite command | `cd backend && pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-08 | Create story with photo | unit | `cd backend && pnpm test -- --testPathPattern stories.service` | No -- Wave 0 |
| CONT-08 | Create story with video | unit | `cd backend && pnpm test -- --testPathPattern stories.service` | No -- Wave 0 |
| CONT-08 | Story expires after 24h | unit | `cd backend && pnpm test -- --testPathPattern stories.service` | No -- Wave 0 |
| CONT-08 | Expired stories cleaned up | unit | `cd backend && pnpm test -- --testPathPattern stories-cleanup` | No -- Wave 0 |
| CONT-08 | Delete own story | unit | `cd backend && pnpm test -- --testPathPattern stories.service` | No -- Wave 0 |
| CONT-09 | Story feed returns grouped followed users | unit | `cd backend && pnpm test -- --testPathPattern stories.service` | No -- Wave 0 |
| CONT-09 | Story marked as viewed (idempotent) | unit | `cd backend && pnpm test -- --testPathPattern stories.service` | No -- Wave 0 |
| CONT-09 | Blocked/muted users excluded from feed | unit | `cd backend && pnpm test -- --testPathPattern stories.service` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && pnpm test -- --testPathPattern stories -x`
- **Per wave merge:** `cd backend && pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/stories/__tests__/stories.service.spec.ts` -- covers CONT-08 (create, expire, delete, video validation)
- [ ] `backend/src/stories/__tests__/stories-feed.spec.ts` -- covers CONT-09 (feed grouping, view tracking, moderation filtering)
- [ ] FFmpeg available in test environment (or mock fluent-ffmpeg in unit tests)

## Sources

### Primary (HIGH confidence)
- **Project codebase** -- Prisma schema, NestJS module patterns, MediaService, FeedService, BullMQ setup, frontend component/hook/store patterns all examined directly
- **Existing patterns** -- FeedService grouped query pattern, PostsService create/toggle patterns, MediaProcessor sharp pipeline, StorageService presigned URLs, ModerationService filtering
- **@figly/shared** -- FILE_LIMITS.video already defined (100MB), THUMBNAIL_SIZES, POST_LIMITS patterns established

### Secondary (MEDIUM confidence)
- **fluent-ffmpeg** -- Well-established Node.js FFmpeg wrapper (2.4M weekly npm downloads), compatible with NestJS
- **Instagram Stories UX** -- Standard 24h ephemeral content pattern, horizontal bar, gradient ring for unviewed, full-screen viewer with tap navigation

### Tertiary (LOW confidence)
- **Video duration validation timing** -- Recommendation to validate synchronously is based on ffprobe performance characteristics (metadata-only reads). Should be verified with actual video files during implementation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all core tech already in project, only adding fluent-ffmpeg
- Architecture: HIGH -- follows exact patterns from existing modules (Posts, Feed, Media, Notifications)
- Pitfalls: HIGH -- based on direct codebase analysis (presigned URL expiry, N+1 queries, moderation filters)
- Video processing: MEDIUM -- fluent-ffmpeg is standard but video pipeline is new territory for this project

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable domain, established patterns)
