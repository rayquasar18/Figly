# Phase 10: Reels - Research

**Researched:** 2026-03-20
**Domain:** Short-form video upload, transcoding, vertical scroll feed
**Confidence:** HIGH

## Summary

Phase 10 adds short-form video reels as a Post with `postType='REEL'` discriminator. The backend work centers on extending the Post model with a `PostType` enum and a `ReelMeta` model, adding ffmpeg-based video transcoding to the existing BullMQ media processor, and creating a dedicated reels feed endpoint. The frontend work centers on a full-screen vertical scroll viewer using CSS `scroll-snap-type: y mandatory`, IntersectionObserver-driven auto-play, and a right-side floating action column.

The existing codebase provides strong foundations: BullMQ media processing pipeline (just needs ffmpeg branch for video), post interactions (like/bookmark/comment all work on Posts already), infinite scroll patterns via `useInfiniteQuery`, and a full-screen video playback pattern from Stories. The key new work is the ffmpeg transcoding step, the scroll-snap feed UI, and the navigation restructure (Search tab replaced by Reels tab).

**Primary recommendation:** Treat reels as Posts throughout -- extend the Post model with a `postType` discriminator and add a `ReelMeta` relation for video-specific metadata. Reuse all existing post interaction infrastructure. Focus implementation effort on the ffmpeg transcoding pipeline and the vertical scroll feed experience.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Reels are Posts with postType='REEL' discriminator (not a separate model)
- Add postType enum to Post model: 'POST' (default) | 'REEL'
- ReelMeta model for reel-specific fields: duration, thumbnailUrl, width, height
- CSS scroll-snap vertical feed (snap-y mandatory, snap-start per item)
- Auto-play current reel, pause when scrolled away (IntersectionObserver threshold ~0.7)
- Start muted by default, tap to unmute
- Preload next 1 reel for smooth scrolling
- Loop current reel continuously until user scrolls
- Simple upload flow (no in-app editing), 60s max, 100MB limit
- Backend transcodes to MP4/H.264 via ffmpeg, thumbnail from first frame
- Right-side floating action column (Instagram Reels style): like, comment, share, bookmark
- Comments open as bottom sheet overlay (half-screen), same threading as post comments
- Replace Search tab in bottom nav with Reels tab (Clapperboard/Film icon)
- Search moves to top header bar (magnifying glass icon next to DM icon)
- Existing feed excludes reels (postType='POST' filter), reels feed only shows reels
- Profile post grid excludes reels, profile reels tab shows only reels
- Double-tap to like, share copies URL to clipboard
- Author info (avatar, username, follow button) at bottom-left overlay
- Landscape videos rendered with letterboxing (black bars) to maintain 9:16 viewport

### Claude's Discretion
- Exact ffmpeg transcoding parameters (bitrate, resolution, codec profile)
- Loading skeleton design for reels feed
- Scroll debounce/throttle timing for view tracking
- Error state handling (failed video load, network issues)
- Exact bottom sheet animation for comments overlay

### Deferred Ideas (OUT OF SCOPE)
- In-app video trimming/editing -- v2 feature
- Music/audio overlay on reels -- v2 feature
- Reel duets/stitches (TikTok-style) -- v2 feature
- Algorithmic reel recommendations -- v2 (SOCL-V2-01 covers algorithmic feed)
- Reel analytics for creators -- v2 feature
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-10 | User can upload and post short-form video (reels) | Extend MediaService upload with 100MB limit for reels, ffmpeg transcoding in MediaProcessor, PostType enum on Post model, ReelMeta model, create reel endpoint in PostsController |
| CONT-11 | User can browse reels in dedicated vertical scroll feed | New /reels route with scroll-snap feed, dedicated reels feed endpoint in FeedService (postType='REEL' filter), IntersectionObserver auto-play, bottom nav restructure |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ffmpeg (fluent-ffmpeg) | ^2.1 | Video transcoding and thumbnail extraction | Industry standard for server-side video processing; ffmpeg binary already installed in Dockerfile.backend line 44 |
| @ffprobe-installer/ffprobe | ^2.1 | Probe video metadata (duration, dimensions) | Required to extract video duration/width/height for ReelMeta |
| @ffmpeg-installer/ffmpeg | ^1.1 | ffmpeg binary path resolution in Node.js | Already covered by Docker install; useful for local dev fallback |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| BullMQ | existing | Async job queue for video transcoding | Existing media-processing queue; add video transcoding job type |
| @tanstack/react-query | existing | Data fetching, infinite scroll | useInfiniteQuery for reels feed, same pattern as post feed |
| lucide-react | existing | Icons (Clapperboard, Volume2, VolumeX, Play, Pause) | Bottom nav Reels icon, player controls |
| class-validator | existing | DTO validation | CreateReelDto validation (per project convention, NOT nestjs-zod) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fluent-ffmpeg | Raw child_process ffmpeg | fluent-ffmpeg provides cleaner API, error handling, progress events |
| CSS scroll-snap | Swiper.js | scroll-snap is native, zero-dependency, sufficient for vertical snap; Swiper adds bundle weight for no clear benefit |
| IntersectionObserver auto-play | Scroll event listener | IO is performant, non-blocking, already used throughout project |

**Installation:**
```bash
cd backend && npm install fluent-ffmpeg @types/fluent-ffmpeg @ffprobe-installer/ffprobe
```

Note: ffmpeg binary is already in Docker image. For local dev, install ffmpeg via `brew install ffmpeg` (macOS) or use @ffmpeg-installer/ffmpeg as fallback.

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
├── media/
│   ├── media.processor.ts      # EXTEND: add video transcoding branch
│   ├── media.service.ts        # EXTEND: reel upload with 100MB limit
│   └── storage.service.ts      # EXISTING: no changes needed
├── posts/
│   ├── posts.controller.ts     # EXTEND: createReel endpoint
│   ├── posts.service.ts        # EXTEND: create with postType, include ReelMeta
│   └── dto/
│       └── create-reel.dto.ts  # NEW: caption, mediaId, linkedItemIds
├── feed/
│   └── feed.service.ts         # EXTEND: getReelsFeed method, postType filter on existing feeds
└── prisma/
    └── schema.prisma           # EXTEND: PostType enum, postType on Post, ReelMeta model

frontend/src/
├── app/(app)/reels/
│   └── page.tsx                # NEW: /reels route - vertical scroll feed
├── components/reel/
│   ├── reel-feed.tsx           # NEW: scroll-snap container with IO auto-play
│   ├── reel-card.tsx           # NEW: full-screen reel with video player
│   ├── reel-actions.tsx        # NEW: right-side floating action column
│   ├── reel-author-info.tsx    # NEW: bottom-left author overlay
│   └── reel-comments-sheet.tsx # NEW: bottom sheet comments overlay
├── hooks/queries/
│   └── reel-queries.ts         # NEW: useReelsFeed, useCreateReel
├── components/layout/
│   ├── bottom-nav.tsx          # MODIFY: Search -> Reels tab
│   └── header.tsx              # MODIFY: add search icon
└── components/story/
    └── story-viewer-content.tsx # REFERENCE: video playback pattern
```

### Pattern 1: Post Type Discriminator
**What:** Add PostType enum to Post model, filter feeds by type
**When to use:** All feed queries, post creation, profile tabs
**Example:**
```prisma
// schema.prisma
enum PostType {
  POST
  REEL
}

model Post {
  // ... existing fields
  postType  PostType @default(POST)
  reelMeta  ReelMeta?
}

model ReelMeta {
  id           String @id @default(cuid())
  postId       String @unique
  post         Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  duration     Float        // seconds
  thumbnailUrl String?      // presigned URL resolved at query time
  thumbnailKey String?      // MinIO storage key
  width        Int
  height       Int

  @@map("reel_meta")
}
```

### Pattern 2: ffmpeg Transcoding in BullMQ Processor
**What:** Branch video processing in existing MediaProcessor
**When to use:** When media upload is a video file for a reel
**Example:**
```typescript
// media.processor.ts - new video branch
import * as ffmpeg from 'fluent-ffmpeg';
import * as ffprobeInstaller from '@ffprobe-installer/ffprobe';

ffmpeg.setFfprobePath(ffprobeInstaller.path);

async processVideo(mediaId: string, originalKey: string): Promise<{
  transcodedKey: string;
  thumbnailKey: string;
  duration: number;
  width: number;
  height: number;
}> {
  const originalBuffer = await this.storageService.download(originalKey);
  const tmpInput = `/tmp/${mediaId}-input`;
  const tmpOutput = `/tmp/${mediaId}-output.mp4`;
  const tmpThumb = `/tmp/${mediaId}-thumb.jpg`;

  // Write to temp file (ffmpeg needs file path)
  fs.writeFileSync(tmpInput, originalBuffer);

  // Probe metadata
  const metadata = await new Promise<ffmpeg.FfprobeData>((resolve, reject) => {
    ffmpeg.ffprobe(tmpInput, (err, data) => err ? reject(err) : resolve(data));
  });
  const videoStream = metadata.streams.find(s => s.codec_type === 'video');
  const duration = metadata.format.duration || 0;
  const width = videoStream?.width || 0;
  const height = videoStream?.height || 0;

  // Transcode: H.264 baseline, AAC audio, max 720p
  await new Promise<void>((resolve, reject) => {
    ffmpeg(tmpInput)
      .outputOptions([
        '-c:v libx264',
        '-profile:v baseline',
        '-level 3.1',
        '-preset fast',
        '-crf 23',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',  // Enable progressive download
        '-vf scale=\'min(720,iw)\':\'min(1280,ih)\':force_original_aspect_ratio=decrease',
      ])
      .output(tmpOutput)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });

  // Generate thumbnail from first frame
  await new Promise<void>((resolve, reject) => {
    ffmpeg(tmpInput)
      .screenshots({
        count: 1,
        timemarks: ['0'],
        filename: `${mediaId}-thumb.jpg`,
        folder: '/tmp',
        size: '720x?',
      })
      .on('end', resolve)
      .on('error', reject);
  });

  // Upload transcoded + thumbnail to MinIO
  const transcodedKey = originalKey.replace('originals/', 'transcoded/').replace(/\.[^.]+$/, '.mp4');
  const thumbnailKey = originalKey.replace('originals/', 'thumbnails/').replace(/\.[^.]+$/, '.jpg');

  await this.storageService.upload(transcodedKey, fs.readFileSync(tmpOutput), 'video/mp4');
  await this.storageService.upload(thumbnailKey, fs.readFileSync(tmpThumb), 'image/jpeg');

  // Cleanup temp files
  [tmpInput, tmpOutput, tmpThumb].forEach(f => fs.existsSync(f) && fs.unlinkSync(f));

  return { transcodedKey, thumbnailKey, duration, width, height };
}
```

### Pattern 3: CSS Scroll-Snap Vertical Feed
**What:** Full-screen vertical scroll with snap points
**When to use:** /reels route main container
**Example:**
```tsx
// reel-feed.tsx
function ReelFeed({ reels }: { reels: ReelResponse[] }) {
  return (
    <div
      className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll"
      style={{ scrollbarWidth: 'none' }} // Hide scrollbar
    >
      {reels.map((reel) => (
        <div key={reel.id} className="h-[100dvh] snap-start">
          <ReelCard reel={reel} />
        </div>
      ))}
      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
}
```

### Pattern 4: IntersectionObserver Auto-Play
**What:** Play video when >70% visible, pause when scrolled away
**When to use:** Each reel card in the feed
**Example:**
```tsx
// Inside ReelCard
const videoRef = useRef<HTMLVideoElement>(null);
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        videoRef.current?.play().catch(() => {}); // Catch autoplay rejection
      } else {
        videoRef.current?.pause();
        if (videoRef.current) videoRef.current.currentTime = 0;
      }
    },
    { threshold: 0.7 }
  );
  if (containerRef.current) observer.observe(containerRef.current);
  return () => observer.disconnect();
}, []);

return (
  <div ref={containerRef} className="relative h-full w-full bg-black">
    <video
      ref={videoRef}
      src={reel.videoUrl}
      loop
      muted={isMuted}
      playsInline
      className="h-full w-full object-contain" // object-contain for letterboxing
    />
  </div>
);
```

### Anti-Patterns to Avoid
- **Separate Reel model:** Reels MUST be Posts with postType='REEL' -- duplicating the interactions system (likes, comments, bookmarks) would be a massive mistake
- **Synchronous transcoding:** Never transcode in the request handler -- always use BullMQ async job
- **autoplay with sound:** Browsers block autoplay with sound -- always start muted, user taps to unmute
- **Scroll event listeners for snap detection:** Use IntersectionObserver, not scroll events -- IO is non-blocking and performant
- **Loading all reels at once:** Must use cursor-based infinite scroll with useInfiniteQuery, loading ~5-10 reels per page

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video transcoding | Custom ffmpeg CLI wrapper | fluent-ffmpeg | Handles streams, errors, progress; well-tested API |
| Video metadata extraction | Parse video bytes manually | ffprobe via fluent-ffmpeg | Reliable duration/dimension extraction |
| Vertical snap scroll | Custom JS scroll snapping | CSS scroll-snap-type: y mandatory | Native browser support, zero JS, performant |
| Autoplay detection | Scroll position calculation | IntersectionObserver | Already used in project (notifications, infinite scroll) |
| Comment threading | New comment system | Existing PostsModule comments | Reels ARE Posts, comments work automatically |
| Like/bookmark | New interaction system | Existing Like/Bookmark on Post | PostType discriminator means all Post relations work |

**Key insight:** The "Reel is a Post" decision means ~60% of the interaction layer is free. The real work is video transcoding and the scroll-snap feed UI.

## Common Pitfalls

### Pitfall 1: Browser Autoplay Policy
**What goes wrong:** Video fails to play automatically, user sees blank screen
**Why it happens:** All modern browsers block autoplay with sound; some block autoplay entirely without user gesture
**How to avoid:** Always set `muted` attribute on initial load. Use `video.play().catch(() => {})` to handle rejections gracefully. Show a visible play button overlay if autoplay is blocked.
**Warning signs:** Videos not playing on first load in Safari/iOS

### Pitfall 2: Memory Leaks from Video Elements
**What goes wrong:** Tab memory grows indefinitely as user scrolls through many reels
**Why it happens:** Video elements keep decoded frames in memory even when off-screen
**How to avoid:** Remove `src` attribute or set to empty string when reel scrolls out of view (beyond 1 position from current). Only keep current + next reel loaded. Use IO to detect off-screen reels.
**Warning signs:** Browser tab memory exceeding 500MB after scrolling ~50 reels

### Pitfall 3: ffmpeg Temp File Cleanup
**What goes wrong:** /tmp fills up on server, transcoding fails for new uploads
**Why it happens:** Failed transcoding jobs leave temp files behind
**How to avoid:** Always use try/finally for temp file cleanup. Set a cron/BullMQ repeatable job to clean /tmp/mediaId-* files older than 1 hour.
**Warning signs:** Disk space alerts, ENOSPC errors in media processor logs

### Pitfall 4: Feed Contamination
**What goes wrong:** Reels appear in the regular post feed or vice versa
**Why it happens:** Adding postType to Post without updating ALL existing feed queries
**How to avoid:** Add `postType: 'POST'` filter to: getFeed, getPublicFeed, getExploreFeed, getUserPosts, getSavedPosts. Add `postType: 'REEL'` filter to the new getReelsFeed. Audit every Prisma post.findMany call.
**Warning signs:** Reels showing up in home feed as broken cards without video player

### Pitfall 5: Mobile Safari Video Quirks
**What goes wrong:** Video doesn't play inline on iOS, goes fullscreen instead
**Why it happens:** iOS requires `playsInline` attribute and `webkit-playsinline` for inline video
**How to avoid:** Always set `playsInline` attribute on video elements. Add `webkit-playsinline` for older iOS versions.
**Warning signs:** Tapping a reel triggers native iOS fullscreen player instead of playing inline

### Pitfall 6: Reel Upload Size vs Story Size
**What goes wrong:** Reel uploads rejected with story size limit (30MB) instead of reel limit (100MB)
**Why it happens:** MediaService.upload currently uses STORY_LIMITS.maxVideoSize for all video uploads
**How to avoid:** Pass a context/purpose parameter to upload, or create a separate uploadReel method that uses REEL_LIMITS.maxVideoSize (100MB). The upload endpoint needs to know whether the video is for a story or reel.
**Warning signs:** Users unable to upload videos >30MB as reels

## Code Examples

### Existing Feed Query with postType Filter
```typescript
// feed.service.ts - MODIFY existing getFeed
async getFeed(userId: string, cursor?: string, take = POST_LIMITS.feedPageSize) {
  const posts = await this.prisma.post.findMany({
    where: {
      postType: 'POST', // NEW: exclude reels from regular feed
      OR: [
        { userId },
        { user: { followers: { some: { followerId: userId } } } },
      ],
      // ... existing blocked/muted/banned filters
    },
    // ... existing includes
  });
}
```

### Reels Feed Endpoint
```typescript
// feed.service.ts - NEW method
async getReelsFeed(userId?: string, cursor?: string, take = 5) {
  const excludeIds = userId
    ? [...await this.moderationService.getBlockedUserIds(userId),
       ...await this.moderationService.getMutedUserIds(userId)]
    : [];

  const reels = await this.prisma.post.findMany({
    where: {
      postType: 'REEL',
      user: { isBanned: false },
      ...(excludeIds.length > 0 && { userId: { notIn: excludeIds } }),
    },
    include: {
      user: { select: { id: true, username: true, name: true, avatar: { select: { mediumKey: true } } } },
      media: { include: { media: true }, orderBy: { position: 'asc' } },
      reelMeta: true,
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  // ... standard pagination pattern
}
```

### REEL_LIMITS Constants
```typescript
// packages/shared/src/constants/reel.constants.ts
export const REEL_LIMITS = {
  maxDurationSeconds: 60,
  maxVideoSize: 100 * 1024 * 1024, // 100MB
  feedPageSize: 5, // Fewer per page since videos are heavy
  maxCaptionLength: 2200, // Same as regular posts
} as const;
```

### Bottom Nav Restructure
```tsx
// bottom-nav.tsx - Replace Search with Reels
import { Home, Clapperboard, PlusSquare, Heart, User } from 'lucide-react';

// Replace the Search NavLink with:
<NavLink
  href="/reels"
  icon={Clapperboard}
  label="Reels"
  isActive={pathname.startsWith('/reels')}
/>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Skip video in media processor | ffmpeg transcode to H.264 + thumbnail | Phase 10 | Consistent playback across all devices |
| Single PostType (implicit POST) | Explicit PostType enum discriminator | Phase 10 | Enables reel/post separation in all feeds |
| 5-tab nav (Home, Search, Create, Notif, Profile) | 5-tab nav (Home, Reels, Create, Notif, Profile) | Phase 10 | Search moves to header bar |
| STORY_LIMITS for all video uploads | Separate REEL_LIMITS (100MB, 60s) | Phase 10 | Correct size/duration limits per feature |

**Deprecated/outdated:**
- Video upload marking COMPLETED immediately (from Phase 9 decision [09-01]) -- now videos will be transcoded via BullMQ

## Open Questions

1. **ffmpeg Binary Path in Docker vs Local Dev**
   - What we know: Dockerfile.backend installs ffmpeg (line 44). fluent-ffmpeg needs the binary path.
   - What's unclear: Whether ffmpeg is in PATH in the Docker container or needs explicit path config
   - Recommendation: Use `which ffmpeg` fallback detection. In Docker it should be in PATH. For local dev, use @ffmpeg-installer/ffmpeg as fallback.

2. **Video Transcoding Duration for Large Files**
   - What we know: 100MB / 60s video transcoding can take 30-60 seconds on modest hardware
   - What's unclear: Exact BullMQ job timeout needed; whether user should see "processing" state
   - Recommendation: Set BullMQ job timeout to 5 minutes. Show "Dang xu ly..." status on reel until transcoding completes. Poll media status from frontend.

3. **Existing Post Queries Need Audit**
   - What we know: Adding postType requires updating every query that fetches posts
   - What's unclear: Full list of all post query locations (PostsService, FeedService, SearchService, etc.)
   - Recommendation: Grep for `prisma.post.findMany` across entire backend and add postType filter to each. Default to 'POST' for backward compatibility.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (existing) |
| Config file | backend/vitest.config.ts, frontend/vitest.config.ts |
| Quick run command | `cd backend && npx vitest run --reporter=verbose` |
| Full suite command | `cd backend && npx vitest run && cd ../frontend && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-10a | Reel upload validates 60s max duration, 100MB max size | unit | `cd backend && npx vitest run src/media/media.service.spec.ts -x` | Wave 0 |
| CONT-10b | ffmpeg transcodes video to H.264 and generates thumbnail | integration | `cd backend && npx vitest run src/media/media.processor.spec.ts -x` | Wave 0 |
| CONT-10c | Create reel endpoint creates Post with postType='REEL' + ReelMeta | unit | `cd backend && npx vitest run src/posts/posts.service.spec.ts -x` | Wave 0 |
| CONT-11a | Reels feed returns only postType='REEL' posts | unit | `cd backend && npx vitest run src/feed/feed.service.spec.ts -x` | Wave 0 |
| CONT-11b | Existing feed excludes reels (postType='POST' filter) | unit | `cd backend && npx vitest run src/feed/feed.service.spec.ts -x` | Wave 0 |
| CONT-11c | Vertical scroll feed renders with scroll-snap | smoke | Manual -- verify CSS scroll-snap behavior in browser | manual-only |
| CONT-11d | Auto-play triggers on >70% visibility | smoke | Manual -- verify IntersectionObserver behavior | manual-only |

### Sampling Rate
- **Per task commit:** `cd backend && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd backend && npx vitest run && cd ../frontend && npx vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `backend/src/media/media.processor.spec.ts` -- needs video transcoding test cases (may need to mock ffmpeg)
- [ ] `backend/src/feed/feed.service.spec.ts` -- needs postType filter test cases
- [ ] ffmpeg mock strategy -- fluent-ffmpeg should be mocked in unit tests to avoid actual transcoding

## Sources

### Primary (HIGH confidence)
- Codebase: `backend/src/media/media.processor.ts` -- current Sharp-only image processing pipeline
- Codebase: `backend/src/media/media.service.ts` -- current upload flow with video skip
- Codebase: `backend/src/feed/feed.service.ts` -- feed query patterns (getFeed, getPublicFeed, getExploreFeed)
- Codebase: `backend/prisma/schema.prisma` -- Post model, Media model, Story model patterns
- Codebase: `frontend/src/components/story/story-viewer.tsx` -- full-screen video playback pattern
- Codebase: `frontend/src/hooks/queries/post-queries.ts` -- useInfiniteQuery patterns
- Codebase: `frontend/src/components/layout/bottom-nav.tsx` -- current 5-tab nav structure
- Codebase: `packages/shared/src/constants/story.constants.ts` -- STORY_LIMITS pattern for REEL_LIMITS

### Secondary (MEDIUM confidence)
- fluent-ffmpeg npm package -- well-established Node.js ffmpeg wrapper
- CSS scroll-snap specification -- widely supported in all modern browsers
- IntersectionObserver API -- used throughout project for infinite scroll and auto-read

### Tertiary (LOW confidence)
- ffmpeg transcoding parameters (CRF 23, baseline profile, fast preset) -- reasonable defaults but may need tuning for quality/speed tradeoff

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - fluent-ffmpeg is the standard Node.js ffmpeg wrapper, CSS scroll-snap is native
- Architecture: HIGH - Post discriminator pattern is clean, all code patterns visible in existing codebase
- Pitfalls: HIGH - Browser autoplay, memory leaks, feed contamination are well-documented issues
- ffmpeg parameters: MEDIUM - defaults are reasonable but may need production tuning

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable domain, 30 days)
