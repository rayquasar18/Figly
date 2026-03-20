# Phase 3: Content & Feed - Research

**Researched:** 2026-03-14
**Domain:** Post creation, image editing, social interactions (like/comment/bookmark), feed pagination
**Confidence:** HIGH (well-established stack, extensive existing codebase patterns to follow)

## Summary

Phase 3 is the largest and most feature-rich phase so far, spanning post creation with multi-image carousels, client-side image crop/rotate, a full interaction system (likes, threaded comments, bookmarks), and a chronological feed. The existing codebase provides strong patterns to build on: the media upload pipeline (MinIO + BullMQ + Sharp) handles image storage, TanStack Query's useInfiniteQuery is already proven for cursor-based pagination, and the established NestJS module pattern (Controller + Service + Module) maps cleanly to new posts, comments, and feed modules.

The main technical challenges are: (1) designing the Prisma schema extension with Post, PostMedia, Like, Comment, and Bookmark models with correct cascading deletes, (2) implementing client-side image crop/rotate before upload using react-easy-crop + Canvas API, (3) building the Instagram-style multi-step creation flow as a full-screen overlay, (4) efficiently querying "posts from users I follow" with cursor pagination for the feed, and (5) optimistic UI updates for like/unlike/bookmark/comment interactions matching the established follow button pattern.

**Primary recommendation:** Structure as 5 plans: (1) Prisma schema + shared DTOs/types, (2) backend posts/interactions/feed API, (3) frontend post creation flow with crop/rotate, (4) frontend feed page + post detail modal + interactions, (5) frontend saved posts page + profile post grid wiring. Use react-easy-crop for image cropping (supports drag, zoom, rotate). Use embla-carousel-react via shadcn/ui Carousel for post carousels. Feed query uses a subquery on Follow table to get followed user IDs, then queries Post table ordered by createdAt DESC with cursor pagination.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Instagram-style multi-step full-screen post creation flow: select photos -> edit (crop/rotate) -> write caption -> publish
- Bottom navigation '+' icon triggers the creation flow
- Gallery picker allows selecting up to 10 images for carousel
- Crop and rotate tools on each selected image before proceeding
- Caption field supports #hashtags and @mentions with autocomplete
- Reuses existing media upload pipeline (POST /api/media/upload) for each image
- After publish, redirects to the new post or back to feed
- Chronological feed (newest first), no algorithm
- No "new posts" indicator -- pull-to-refresh or manual refresh only
- Infinite scroll with cursor-based pagination (same take+1 pattern from Phase 2)
- Feed page replaces current placeholder at (app)/page.tsx
- Post cards show: author avatar + username, post image(s), like/comment/bookmark buttons, like count, caption preview, comment count, relative timestamp
- Carousel posts show dot indicators and swipe navigation
- Desktop post detail: modal overlay on feed (image left, comments/info right -- Instagram style)
- Mobile post detail: full-page view
- Like: heart icon, tap to toggle, heart animation, Instagram double-tap to like on image
- Comment: threaded replies (1 level deep, like Instagram)
- Bookmark: flag/bookmark icon, tap to toggle save
- Saved posts accessible from a dedicated "Saved" page/tab
- Edit caption: accessible from three-dot menu on own posts, inline editing
- Delete post: confirmation dialog before deletion, cascade deletes all likes/comments/bookmarks
- "Reply" button on each comment to start a threaded reply
- @mention of parent comment author auto-inserted in reply

### Claude's Discretion
- Exact crop/rotate UI implementation (canvas-based vs library choice)
- Loading skeletons for feed and post detail
- Image viewer/carousel library choice
- Comment sort order (newest first vs oldest first)
- Empty feed state design ("Follow people to see posts")
- Error handling UI for failed uploads, failed interactions
- Exact animation details (like heart animation timing, bookmark toggle)
- Mobile bottom navigation bar design
- Hashtag and @mention autocomplete implementation details

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | User can create single-image post with caption | Post model + PostMedia join table + create post endpoint + multi-step creation flow frontend |
| CONT-02 | User can create multi-image carousel post (up to 10 images) | PostMedia join table with ordering (position field) + sequential media upload + embla-carousel for display |
| CONT-03 | User can crop and rotate images before posting | react-easy-crop library (v5.5.6) with Canvas API getCroppedImg helper for client-side processing |
| CONT-04 | User can edit own post captions | PATCH /posts/:id endpoint with ownership check + inline caption editing UI |
| CONT-05 | User can delete own posts | DELETE /posts/:id with cascade deletes on PostMedia/Like/Comment/Bookmark + confirmation dialog |
| CONT-06 | User can include hashtags and @mentions in captions | Hashtag model + PostHashtag join table + text parsing regex + autocomplete with debounced API search |
| INTR-01 | User can like/unlike posts | Like model (userId+postId unique) + toggle endpoint + optimistic UI with heart animation |
| INTR-02 | User can comment on posts | Comment model with postId + create endpoint + comment list with pagination |
| INTR-03 | User can reply to comments (threaded) | Comment.parentId self-reference (1 level deep) + nested display in UI |
| INTR-04 | User can bookmark/save posts | Bookmark model (userId+postId unique) + toggle endpoint + optimistic UI |
| INTR-05 | User can view saved posts collection | GET /posts/saved endpoint with cursor pagination + dedicated /saved frontend page |
| SOCL-03 | User can view chronological feed from followed users | Feed query via Follow table subquery + Post ordered by createdAt DESC + useInfiniteQuery |
</phase_requirements>

## Standard Stack

### Core (New for Phase 3)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-easy-crop | ^5.5.6 | Image crop/rotate UI | Instagram-style crop with drag, zoom, rotate. Lightweight (540KB unpacked), 2 deps only. Provides croppedAreaPixels for Canvas API extraction. Active maintenance. |
| embla-carousel-react | ^8.6.0 | Post image carousel (via shadcn/ui Carousel) | shadcn/ui wraps embla-carousel. Lightweight (50KB), fluid swipe, dot indicators. React 18 compatible. |

### Already in Stack (Reused)
| Library | Version | Purpose | How It's Used in Phase 3 |
|---------|---------|---------|--------------------------|
| @tanstack/react-query | ^5.62.0 | Server state, optimistic updates | useInfiniteQuery for feed, useMutation with optimistic updates for like/bookmark/comment |
| react-hook-form + zod | ^7.71.2 / ^3.25.76 | Form validation | Create post caption form, edit caption form, comment input |
| zustand | ^5.0.0 | Client state | Post creation flow multi-step state (selected images, crop data, caption) |
| lucide-react | ^0.468.0 | Icons | Heart, MessageCircle, Bookmark, MoreHorizontal, Send, Camera, ImagePlus, RotateCw, Crop |
| sharp (backend) | ^0.34.5 | Image processing | Already processes uploaded images into 3 sizes -- no changes needed |
| bullmq (backend) | ^5.71.0 | Async job queue | Already processes media -- no changes needed |

### Additional shadcn/ui Components Needed
| Component | Purpose | Install Command |
|-----------|---------|-----------------|
| Carousel | Post image carousel display | `npx shadcn-ui@latest add carousel` |
| DropdownMenu | Three-dot menu (edit/delete post) | `npx shadcn-ui@latest add dropdown-menu` |
| AlertDialog | Delete confirmation dialog | `npx shadcn-ui@latest add alert-dialog` |
| Popover | @mention and #hashtag autocomplete dropdown | `npx shadcn-ui@latest add popover` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-easy-crop | react-image-crop | react-image-crop does not support rotation natively; react-easy-crop has built-in rotation + zoom + Instagram-like UX |
| react-easy-crop | browser-image-compression | browser-image-compression is for compression only, not interactive crop UI |
| embla-carousel (via shadcn) | swiper.js | Swiper is heavier (200KB+), shadcn already wraps embla -- avoid adding a second carousel lib |
| Canvas API crop extraction | sharp server-side crop | Client-side crop via Canvas avoids re-uploading original + saves bandwidth; user sees instant preview |

**Installation (frontend):**
```bash
cd frontend
pnpm add react-easy-crop
npx shadcn-ui@latest add carousel dropdown-menu alert-dialog popover
```

**No new backend dependencies needed** -- existing NestJS, Prisma, BullMQ, Sharp stack covers everything.

## Architecture Patterns

### Recommended Project Structure

#### Backend New Modules
```
backend/src/
  posts/
    __tests__/
      posts.service.spec.ts
    dto/
      create-post.dto.ts
      update-post.dto.ts
    posts.controller.ts
    posts.service.ts
    posts.module.ts
  comments/
    __tests__/
      comments.service.spec.ts
    dto/
      create-comment.dto.ts
    comments.controller.ts
    comments.service.ts
    comments.module.ts
  feed/
    __tests__/
      feed.service.spec.ts
    feed.controller.ts
    feed.service.ts
    feed.module.ts
```

#### Frontend New Structure
```
frontend/src/
  app/(app)/
    page.tsx                    # Feed page (replaces placeholder)
    saved/
      page.tsx                  # Saved/bookmarked posts
    post/
      [postId]/
        page.tsx                # Mobile post detail (full page)
  components/
    post/
      post-card.tsx             # Feed post card
      post-carousel.tsx         # Image carousel for multi-image posts
      post-detail-modal.tsx     # Desktop modal overlay
      post-actions.tsx          # Like, comment, bookmark buttons
      post-menu.tsx             # Three-dot dropdown menu (edit/delete)
      caption-display.tsx       # Renders caption with clickable hashtags/@mentions
    create-post/
      create-post-flow.tsx      # Multi-step full-screen overlay orchestrator
      step-gallery.tsx          # Step 1: Image selection
      step-edit.tsx             # Step 2: Crop/rotate each image
      step-caption.tsx          # Step 3: Caption with hashtags/@mentions
      image-cropper.tsx         # Wraps react-easy-crop for single image
    comment/
      comment-list.tsx          # Paginated comment thread
      comment-item.tsx          # Single comment with reply button
      comment-input.tsx         # Text input for new comment/reply
    feed/
      feed-list.tsx             # Infinite scroll feed container
      feed-skeleton.tsx         # Loading skeleton for feed
      empty-feed.tsx            # Empty state when no posts
    layout/
      bottom-nav.tsx            # Mobile bottom navigation bar
  hooks/queries/
    post-queries.ts             # useCreatePost, useFeed, usePostDetail, useUserPosts
    interaction-queries.ts      # useLikeMutation, useBookmarkMutation
    comment-queries.ts          # useComments, useCreateComment
  stores/
    create-post-store.ts        # Zustand store for multi-step creation flow state
```

#### Shared Package Extensions
```
packages/shared/src/
  dto/
    post.dto.ts                 # createPostSchema, updateCaptionSchema
    comment.dto.ts              # createCommentSchema
  types/
    post.types.ts               # PostResponse, PostMediaItem, FeedPostResponse
    comment.types.ts            # CommentResponse
    interaction.types.ts        # LikeResponse, BookmarkResponse
  constants/
    index.ts                    # Add POST_LIMITS (maxImages: 10, captionMaxLength: 2200)
```

### Pattern 1: Prisma Schema Extension

**What:** New models for Post, PostMedia, Like, Comment, Bookmark, Hashtag, PostHashtag
**When to use:** Phase 3 schema migration

```prisma
model Post {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  caption   String?  @db.VarChar(2200)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  media     PostMedia[]
  likes     Like[]
  comments  Comment[]
  bookmarks Bookmark[]
  hashtags  PostHashtag[]

  @@index([userId])
  @@index([createdAt])
  @@map("posts")
}

model PostMedia {
  id       String @id @default(cuid())
  postId   String
  post     Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  mediaId  String
  media    Media  @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  position Int    // 0-indexed ordering for carousel

  @@unique([postId, position])
  @@index([postId])
  @@map("post_media")
}

model Like {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, postId])
  @@index([postId])
  @@map("likes")
}

model Comment {
  id        String    @id @default(cuid())
  userId    String
  postId    String
  parentId  String?   // null = top-level, non-null = reply (1 level deep)
  content   String    @db.VarChar(1000)
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")
  createdAt DateTime  @default(now())

  @@index([postId, createdAt])
  @@index([parentId])
  @@map("comments")
}

model Bookmark {
  id        String   @id @default(cuid())
  userId    String
  postId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, postId])
  @@index([userId, createdAt])
  @@map("bookmarks")
}

model Hashtag {
  id    String @id @default(cuid())
  name  String @unique  // lowercase, without #
  posts PostHashtag[]

  @@map("hashtags")
}

model PostHashtag {
  id        String  @id @default(cuid())
  postId    String
  hashtagId String
  post      Post    @relation(fields: [postId], references: [id], onDelete: Cascade)
  hashtag   Hashtag @relation(fields: [hashtagId], references: [id], onDelete: Cascade)

  @@unique([postId, hashtagId])
  @@index([hashtagId])
  @@map("post_hashtags")
}
```

**User model additions needed:**
```prisma
model User {
  // ... existing fields
  posts     Post[]
  likes     Like[]
  comments  Comment[]
  bookmarks Bookmark[]
}
```

**Media model addition needed:**
```prisma
model Media {
  // ... existing fields
  postMedia PostMedia[]
}
```

### Pattern 2: Feed Query (Chronological, Cursor-Based)

**What:** Query posts from followed users, newest first, with cursor pagination
**When to use:** GET /feed endpoint

```typescript
// feed.service.ts
async getFeed(userId: string, cursor?: string, take = 10) {
  // Get posts from users the viewer follows + own posts
  const posts = await this.prisma.post.findMany({
    where: {
      OR: [
        { userId },
        {
          user: {
            followers: {
              some: { followerId: userId },
            },
          },
        },
      ],
    },
    include: {
      user: {
        select: { id: true, username: true, name: true, avatar: { select: { mediumKey: true } } },
      },
      media: {
        include: { media: { select: { id: true, largeKey: true, mediumKey: true, status: true } } },
        orderBy: { position: 'asc' },
      },
      _count: { select: { likes: true, comments: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: take + 1,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const hasMore = posts.length > take;
  const items = posts.slice(0, take);
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  // Batch check like + bookmark status for viewer
  const postIds = items.map(p => p.id);
  const [likes, bookmarks] = await Promise.all([
    this.prisma.like.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    }),
    this.prisma.bookmark.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    }),
  ]);
  const likedSet = new Set(likes.map(l => l.postId));
  const bookmarkedSet = new Set(bookmarks.map(b => b.postId));

  // Resolve presigned URLs for images
  // ... (use storageService.getPresignedUrl for each media item)

  return {
    items: items.map(post => ({
      ...post,
      isLiked: likedSet.has(post.id),
      isBookmarked: bookmarkedSet.has(post.id),
      likeCount: post._count.likes,
      commentCount: post._count.comments,
    })),
    nextCursor,
    hasMore,
  };
}
```

### Pattern 3: Optimistic Like/Bookmark Toggle

**What:** Immediate UI feedback for like/bookmark with rollback on error
**When to use:** Like and bookmark mutations in frontend

```typescript
// interaction-queries.ts
export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await apiClient.post(`/posts/${postId}/like`);
      return response.data;
    },
    onMutate: async ({ postId }) => {
      // Cancel in-flight feed queries
      await queryClient.cancelQueries({ queryKey: ['feed'] });

      // Snapshot for rollback
      const previousFeed = queryClient.getQueryData(['feed']);

      // Optimistically update feed items
      queryClient.setQueriesData(
        { queryKey: ['feed'] },
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((item: any) =>
                item.id === postId
                  ? { ...item, isLiked: true, likeCount: item.likeCount + 1 }
                  : item,
              ),
            })),
          };
        },
      );

      return { previousFeed };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
```

### Pattern 4: Client-Side Image Crop with Canvas API

**What:** Crop image using react-easy-crop output and Canvas API before uploading
**When to use:** Create post flow, step 2 (edit images)

```typescript
// utils/crop-image.ts
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const rotRad = (rotation * Math.PI) / 180;
  const { width: bBoxWidth, height: bBoxHeight } = getRotatedSize(
    image.width, image.height, rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d')!;

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height,
  );

  return new Promise((resolve) => {
    croppedCanvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.src = url;
  });
}

function getRotatedSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width: Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height: Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}
```

### Pattern 5: Multi-Step Creation Flow State (Zustand)

**What:** Zustand store managing the multi-step post creation flow
**When to use:** Create post flow state management

```typescript
// stores/create-post-store.ts
interface ImageItem {
  file: File;
  previewUrl: string;      // URL.createObjectURL
  croppedAreaPixels: CroppedArea | null;
  rotation: number;
  croppedBlob: Blob | null; // After crop applied
  mediaId: string | null;   // After upload
}

interface CreatePostState {
  step: 'gallery' | 'edit' | 'caption';
  images: ImageItem[];
  caption: string;
  isPublishing: boolean;
  // Actions
  setStep: (step: CreatePostState['step']) => void;
  addImages: (files: File[]) => void;
  removeImage: (index: number) => void;
  updateImageCrop: (index: number, crop: CroppedArea, rotation: number) => void;
  setCroppedBlob: (index: number, blob: Blob) => void;
  setMediaId: (index: number, mediaId: string) => void;
  setCaption: (caption: string) => void;
  setPublishing: (publishing: boolean) => void;
  reset: () => void;
}
```

### Pattern 6: Post Detail (Desktop Modal / Mobile Full Page)

**What:** Responsive post detail using Next.js route with intercepted route pattern or conditional rendering
**When to use:** Clicking a post in feed or profile grid

**Approach:** Use a combination of React state and responsive rendering:
- On desktop (>= 768px): render `PostDetailModal` as a Dialog overlay on the current page
- On mobile (< 768px): navigate to `/post/[postId]` full page

This avoids the complexity of Next.js parallel routes while matching the Instagram behavior.

### Anti-Patterns to Avoid
- **N+1 presigned URL generation:** Never call getPresignedUrl inside a map for each post's each image. Batch-collect all storage keys first, then generate URLs in parallel with Promise.all.
- **Uploading original uncropped images:** Always crop client-side before upload. The server should receive the final cropped image, not the original with crop coordinates.
- **Separate like-check per post:** Never check isLiked/isBookmarked with individual queries per post. Use batch IN-clause queries (established in social-queries pattern).
- **Nested pagination for comments:** Do NOT paginate replies separately. Load top-level comments with cursor pagination, and eagerly load all replies for visible comments (since replies are capped at 1 level deep and typically few per comment).
- **Storing crop coordinates server-side:** The crop is applied client-side and the cropped image is uploaded. No need to store crop/rotate metadata on the server.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image crop/rotate UI | Custom canvas drag-to-crop | react-easy-crop | Touch/mouse handling, zoom gestures, rotation math, responsive sizing -- react-easy-crop handles all edge cases |
| Image carousel/swiper | Custom touch event slider | shadcn/ui Carousel (embla-carousel) | Swipe physics, momentum, accessibility, dot indicators, keyboard navigation all handled |
| Relative timestamps | Manual date math ("2h ago") | date-fns `formatDistanceToNow` | Handles all edge cases (seconds, minutes, hours, days, weeks, months), i18n support |
| Hashtag/mention parsing | Custom regex parser | Simple regex `/#(\w+)/g` and `/@(\w+)/g` | Pattern is simple enough, but wrap in a shared utility for consistent extraction + rendering |
| Confirmation dialogs | Custom modal state | shadcn/ui AlertDialog | Accessible, handles escape key, focus trap, animation |
| Dropdown menus | Custom positioned dropdown | shadcn/ui DropdownMenu | Collision detection, keyboard navigation, focus management |

**Key insight:** The existing stack (shadcn/ui + TanStack Query + Zustand) already provides solutions for 90% of UI patterns. The only truly new library needed is react-easy-crop for the image editing UX.

**date-fns installation:**
```bash
cd frontend
pnpm add date-fns
```

## Common Pitfalls

### Pitfall 1: Presigned URL Expiration in Long Feed Sessions
**What goes wrong:** User scrolls feed, leaves tab open for hours, comes back and images are broken (presigned URLs expired, default 1h TTL).
**Why it happens:** Presigned URLs have a finite lifespan.
**How to avoid:** Set presigned URL TTL to 4-6 hours for feed images. Use TanStack Query's staleTime + refetchOnWindowFocus to regenerate URLs when user returns to tab. Alternatively, consider adding a public read policy to the MinIO bucket for processed images (they're not sensitive).
**Warning signs:** Broken images after tab has been in background.

### Pitfall 2: Memory Leaks with URL.createObjectURL
**What goes wrong:** Creating preview URLs for selected images without revoking them causes memory leaks.
**Why it happens:** createObjectURL creates a persistent reference in the browser's blob store.
**How to avoid:** Call URL.revokeObjectURL in the Zustand store reset action and when images are removed. Use useEffect cleanup in the gallery step component.
**Warning signs:** Browser memory usage climbing during repeated post creation attempts.

### Pitfall 3: Race Condition in Multi-Image Upload
**What goes wrong:** User publishes a carousel post, but some images haven't finished processing (BullMQ) when the post is displayed.
**Why it happens:** Image upload returns immediately with PROCESSING status, then BullMQ processes async.
**How to avoid:** Upload all images sequentially (or in parallel), wait for all upload responses, create the Post record with all mediaIds. The post card should handle PROCESSING status gracefully by showing a loading skeleton for that image slot. Frontend can poll /media/:id/status for PROCESSING images.
**Warning signs:** Blank image slots in carousel posts.

### Pitfall 4: Comment Reply Depth Exceeding 1 Level
**What goes wrong:** User replies to a reply, creating depth > 1, which breaks the UI layout.
**Why it happens:** Backend doesn't enforce depth constraint.
**How to avoid:** In the comments service, when creating a comment with a parentId, check that the parent's parentId is null (i.e., the parent is a top-level comment). If the parent is itself a reply, use the parent's parentId as the new comment's parentId instead (flatten to 1 level, like Instagram does). Frontend should only show "Reply" on top-level comments and their direct replies.
**Warning signs:** Deeply nested comment indentation breaking mobile layout.

### Pitfall 5: Optimistic Update State Mismatch Across Multiple Query Keys
**What goes wrong:** Liking a post on the feed doesn't reflect on the post detail modal, or vice versa.
**Why it happens:** Feed data and post detail data live in different query keys.
**How to avoid:** Use queryClient.setQueriesData with a predicate to update ALL matching query keys (feed pages, post detail, user posts). On settle, invalidate all related query keys. This matches the pattern already used for follow/unfollow.
**Warning signs:** Like counts inconsistent between feed view and detail view.

### Pitfall 6: Caption Hashtag Parsing Edge Cases
**What goes wrong:** Hashtags not extracted from captions with special characters, or Unicode usernames not matched by @mentions.
**Why it happens:** Naive regex like `/#\w+/` doesn't handle Unicode.
**How to avoid:** Use `/#([\p{L}\p{N}_]+)/gu` for Unicode-aware hashtag extraction and `/@([\p{L}\p{N}_]+)/gu` for mentions. Store hashtags normalized (lowercase). Parse captions both on backend (for storage) and frontend (for display rendering).
**Warning signs:** Vietnamese characters in hashtags not working.

### Pitfall 7: Feed Page Cursor Ordering with createdAt
**What goes wrong:** Two posts created in the same millisecond can cause missed or duplicate items in pagination.
**Why it happens:** createdAt is not unique.
**How to avoid:** Use the post's cuid() `id` as the cursor (it is unique), with createdAt as the sort key and cursor: { id } with skip: 1 for pagination. The cuid IDs are time-sortable so cursor-based pagination with id is consistent with chronological ordering.
**Warning signs:** Posts appearing twice or missing when scrolling feed.

## Code Examples

### API Endpoint Design

```
# Posts
POST   /posts                    Create post (caption + mediaIds[])
GET    /posts/:id                Get single post with all details
PATCH  /posts/:id                Update caption
DELETE /posts/:id                Delete post (cascade)
GET    /posts/user/:username     Get posts by user (profile grid)

# Interactions
POST   /posts/:id/like           Like a post (toggle)
DELETE /posts/:id/like           Unlike a post (toggle)
POST   /posts/:id/bookmark       Bookmark a post (toggle)
DELETE /posts/:id/bookmark       Remove bookmark (toggle)

# Comments
GET    /posts/:id/comments       Get comments for a post (paginated)
POST   /posts/:id/comments       Create comment (body + optional parentId)
DELETE /comments/:id             Delete own comment

# Feed
GET    /feed                     Chronological feed (cursor pagination)

# Saved
GET    /posts/saved              Get bookmarked posts (cursor pagination)

# Autocomplete
GET    /hashtags/search?q=       Search hashtags for autocomplete
GET    /profiles/search?q=       Search users for @mention autocomplete
```

### Create Post Backend Service

```typescript
// posts.service.ts
async createPost(userId: string, dto: CreatePostDto) {
  // Validate all mediaIds belong to user and are COMPLETED
  const mediaRecords = await this.prisma.media.findMany({
    where: {
      id: { in: dto.mediaIds },
      userId,
      status: 'COMPLETED',
    },
  });

  if (mediaRecords.length !== dto.mediaIds.length) {
    throw new BadRequestException('Mot hoac nhieu hinh anh khong hop le');
  }

  // Extract hashtags from caption
  const hashtags = this.extractHashtags(dto.caption || '');

  // Create post + PostMedia entries + hashtag links in transaction
  const post = await this.prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        userId,
        caption: dto.caption,
        media: {
          create: dto.mediaIds.map((mediaId, index) => ({
            mediaId,
            position: index,
          })),
        },
      },
    });

    // Upsert hashtags and create links
    if (hashtags.length > 0) {
      for (const tag of hashtags) {
        const hashtag = await tx.hashtag.upsert({
          where: { name: tag },
          update: {},
          create: { name: tag },
        });
        await tx.postHashtag.create({
          data: { postId: post.id, hashtagId: hashtag.id },
        });
      }
    }

    return post;
  });

  return post;
}

private extractHashtags(text: string): string[] {
  const matches = text.match(/#([\p{L}\p{N}_]+)/gu);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
}
```

### Feed Infinite Scroll Hook

```typescript
// post-queries.ts
export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const query = params.toString();

      const response = await apiClient.get<PaginatedResponse<FeedPostResponse>>(
        `/feed${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}
```

### Like Toggle Endpoint (Idempotent)

```typescript
// posts.controller.ts
@Post(':id/like')
@HttpCode(HttpStatus.OK)
async likePost(@Param('id') postId: string, @Req() req: Request) {
  const { userId } = req.user as any;
  return this.postsService.toggleLike(userId, postId, true);
}

@Delete(':id/like')
@HttpCode(HttpStatus.OK)
async unlikePost(@Param('id') postId: string, @Req() req: Request) {
  const { userId } = req.user as any;
  return this.postsService.toggleLike(userId, postId, false);
}

// posts.service.ts
async toggleLike(userId: string, postId: string, like: boolean) {
  if (like) {
    try {
      await this.prisma.like.create({
        data: { userId, postId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') return { success: true }; // Already liked
      throw error;
    }
  } else {
    try {
      await this.prisma.like.delete({
        where: { userId_postId: { userId, postId } },
      });
    } catch (error: any) {
      if (error.code === 'P2025') return { success: true }; // Already unliked
      throw error;
    }
  }
  return { success: true };
}
```

### Double-Tap to Like Handler

```typescript
// post-card.tsx -- double-tap like on image
const lastTapRef = useRef<number>(0);

function handleImageTap() {
  const now = Date.now();
  if (now - lastTapRef.current < 300) {
    // Double tap detected
    if (!isLiked) {
      likeMutation.mutate({ postId: post.id });
    }
    // Show heart animation regardless
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 1000);
  }
  lastTapRef.current = now;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Server-side image crop | Client-side crop via Canvas API | ~2020+ | Saves bandwidth, instant preview, no round-trip |
| Separate like/unlike endpoints | Toggle pattern with P2002/P2025 idempotency | Standard pattern | Simplifies frontend (no need to know current state before calling) |
| Swiper.js for carousels | embla-carousel (shadcn/ui default) | ~2023+ | Lighter, better React integration, shadcn wraps it natively |
| Fan-out-on-write for feed | Subquery on Follow table at read time | For small-to-medium scale | Simpler, no denormalization needed; fan-out-on-write is premature for early-stage app |
| Offset pagination | Cursor-based pagination | Standard pattern | No skipped/duplicated items when new content is created |

**Note on feed architecture:** The STATE.md mentions "fan-out-on-write feed architecture from day one" as a research decision. However, for a chronological feed with typical early-stage user counts, a read-time query (subquery on Follow to get followed users, then query Post) is simpler and correct. Fan-out-on-write adds significant complexity (denormalized feed table, async fan-out jobs, handling unfollow cleanup). **Recommendation:** Use read-time query for Phase 3. It can be optimized to fan-out-on-write later if query performance degrades at scale. The API contract (GET /feed with cursor pagination) remains the same regardless of backend implementation.

## Open Questions

1. **Profiles search endpoint for @mention autocomplete**
   - What we know: The current profiles controller has `GET /profiles/check/:username` for availability checking, but no search endpoint.
   - What's unclear: Whether to add a search endpoint to ProfilesController or create a new search controller.
   - Recommendation: Add `GET /profiles/search?q=` to ProfilesController since it's a simple username/name prefix search. This will also be needed in Phase 5 (Discovery) but the endpoint is straightforward enough to add now.

2. **Post URL structure for sharing**
   - What we know: Posts need a URL for the detail view.
   - What's unclear: Should it be `/post/[postId]` or `/[username]/post/[postId]`?
   - Recommendation: Use `/post/[postId]` for simplicity. The post detail page fetches all needed context (including author info) from the post ID. Instagram uses `instagram.com/p/[shortcode]` -- no username in URL.

3. **Comment pagination page size**
   - What we know: Top-level comments should be paginated. Replies are loaded eagerly.
   - What's unclear: Optimal page size for comments.
   - Recommendation: 20 top-level comments per page. Eagerly load all replies for those 20 comments (since replies are 1-level deep and typically under 10 per comment).

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `backend/jest.config.ts` |
| Quick run command | `cd backend && pnpm test -- --testPathPattern=posts` |
| Full suite command | `cd backend && pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Create single-image post | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | Wave 0 |
| CONT-02 | Create carousel post (up to 10) | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | Wave 0 |
| CONT-03 | Crop/rotate images client-side | manual-only | Manual browser test (Canvas API / react-easy-crop) | N/A |
| CONT-04 | Edit own post caption | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | Wave 0 |
| CONT-05 | Delete own post (cascade) | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | Wave 0 |
| CONT-06 | Hashtag/mention extraction | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | Wave 0 |
| INTR-01 | Like/unlike toggle | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | Wave 0 |
| INTR-02 | Create comment | unit | `cd backend && pnpm test -- --testPathPattern=comments.service.spec` | Wave 0 |
| INTR-03 | Reply to comment (threaded) | unit | `cd backend && pnpm test -- --testPathPattern=comments.service.spec` | Wave 0 |
| INTR-04 | Bookmark/unbookmark | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | Wave 0 |
| INTR-05 | View saved posts | unit | `cd backend && pnpm test -- --testPathPattern=posts.service.spec` | Wave 0 |
| SOCL-03 | Chronological feed query | unit | `cd backend && pnpm test -- --testPathPattern=feed.service.spec` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && pnpm test -- --testPathPattern=<relevant_module>`
- **Per wave merge:** `cd backend && pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/posts/__tests__/posts.service.spec.ts` -- covers CONT-01 through CONT-06, INTR-01, INTR-04, INTR-05
- [ ] `backend/src/comments/__tests__/comments.service.spec.ts` -- covers INTR-02, INTR-03
- [ ] `backend/src/feed/__tests__/feed.service.spec.ts` -- covers SOCL-03

## Sources

### Primary (HIGH confidence)
- Existing codebase: Prisma schema, NestJS modules, TanStack Query hooks, Zustand stores -- all patterns verified by reading actual source
- npm registry: react-easy-crop@5.5.6 (verified via `npm view`), embla-carousel-react@8.6.0 (verified via `npm view`)
- react-easy-crop README: Features, API (rotation, zoom, croppedAreaPixels output), Canvas crop helper pattern

### Secondary (MEDIUM confidence)
- shadcn/ui Carousel documentation (wraps embla-carousel) -- based on established shadcn pattern used in project
- Prisma self-relation pattern for Comment threading -- standard Prisma documentation pattern
- Feed query pattern using Follow subquery -- standard Prisma relation filtering

### Tertiary (LOW confidence)
- None -- all findings are backed by codebase analysis or verified package metadata

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- only 2 new libraries (react-easy-crop, date-fns), both verified on npm. All other tools already in project.
- Architecture: HIGH -- follows exact patterns from Phase 1-2 (NestJS modules, cursor pagination, optimistic mutations, Zustand stores). Prisma schema extension is straightforward.
- Pitfalls: HIGH -- based on real patterns observed in codebase (presigned URLs, P2002/P2025 idempotency, take+1 cursor pattern) and well-known frontend issues (memory leaks, race conditions).

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (stable stack, no fast-moving dependencies)
