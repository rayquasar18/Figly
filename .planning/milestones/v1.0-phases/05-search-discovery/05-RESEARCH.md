# Phase 5: Search & Discovery - Research

**Researched:** 2026-03-15
**Domain:** Unified search, hashtag aggregation, explore page with category curation
**Confidence:** HIGH

## Summary

Phase 5 builds three discovery features on a codebase that already has most of the backend primitives in place. The existing `ProfilesService.searchProfiles()`, `PostsService.searchHashtags()`, and `CollectionService.searchItems()` methods cover the three search domains individually. The Prisma schema already has `Hashtag`, `PostHashtag`, and all collection models indexed. The frontend `CaptionDisplay` component already renders hashtag links pointing to `/hashtag/[name]`, and the `BottomNav` already links to `/search` -- but neither route exists yet.

The primary work is: (1) a new unified **SearchModule** backend that orchestrates calls across existing services and adds a `getPostsByHashtag()` method, (2) a new category-curated explore endpoint that replaces the current chronological public feed with a category-organized explore page, and (3) three new frontend pages (`/search`, `/hashtag/[name]`, enhanced `/explore`). No new Prisma models or migrations are needed. All search uses PostgreSQL `ILIKE`/`contains` -- full-text search (pg_trgm, tsvector) is unnecessary at current scale.

**Primary recommendation:** Create a thin `SearchModule` backend that delegates to existing services, add `getPostsByHashtag()` to `PostsService`, add a category-curated explore endpoint to `FeedService`, then build the three frontend pages following established patterns (debounced input, infinite scroll via IntersectionObserver, TanStack Query hooks).

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-01 | User can search for users, hashtags, and items | Unified search endpoint delegates to existing `ProfilesService.searchProfiles()`, `PostsService.searchHashtags()`, `CollectionService.searchItems()`; frontend tabbed search UI with debounced input |
| DISC-02 | User can view hashtag pages with aggregated posts | New `PostsService.getPostsByHashtag()` method querying via `PostHashtag` join; new `/hashtag/[name]` frontend route; `CaptionDisplay` already links to this path |
| DISC-03 | User can browse explore page curated by collection category | New `FeedService.getExploreFeed()` grouping recent posts by category via `PostItem -> Item -> Series -> Category` join; enhanced `/explore` page with category sections |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NestJS | 10.x | Backend framework | Already in use, modular architecture |
| Prisma | Current | ORM + query builder | Already in use, supports `contains` mode for search |
| Next.js | Current | Frontend framework | Already in use, App Router with route groups |
| TanStack Query | Current | Data fetching/caching | Already in use, infinite query for paginated results |
| Axios | Current | HTTP client | Already configured with auth interceptors |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | Current | Icons (Search, Hash, Users, Package) | Search UI iconography |
| shadcn/ui | Current | UI primitives (Input, Tabs, Badge) | Search input, tab switching, result cards |
| date-fns + vi locale | Current | Relative timestamps | Post timestamps on hashtag and explore pages |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma `contains` | PostgreSQL `pg_trgm` + GIN index | Better fuzzy matching but overkill at current scale; add when >10K items |
| Prisma `contains` | PostgreSQL `tsvector` full-text search | Better relevance ranking but adds migration complexity; defer to v2 |
| Single unified endpoint | Separate endpoints per type | Single endpoint simpler for frontend, but separate allows independent caching -- use separate endpoints with frontend orchestration |

**Installation:**
No new packages needed. Everything required is already installed.

## Architecture Patterns

### Recommended Project Structure
```
backend/src/
  search/                    # NEW: SearchModule
    search.module.ts         # Imports PostsModule, ProfilesModule, CollectionModule
    search.controller.ts     # GET /search/unified?q=&type=
    search.service.ts        # Orchestrates cross-service search
    dto/
      search.dto.ts          # SearchQueryDto with Zod validation
  posts/
    posts.service.ts         # ADD: getPostsByHashtag() method
  feed/
    feed.service.ts          # ADD: getExploreFeed() method
    feed.controller.ts       # ADD: GET /feed/explore endpoint

frontend/src/
  app/(public)/
    search/
      page.tsx               # NEW: Unified search page
    hashtag/
      [name]/
        page.tsx             # NEW: Hashtag aggregation page
    explore/
      page.tsx               # MODIFY: Category-curated explore page
  hooks/queries/
    search-queries.ts        # NEW: Search query hooks
  components/
    search/
      search-input.tsx       # NEW: Debounced search input
      search-results.tsx     # NEW: Tabbed results display
      user-result-card.tsx   # NEW: User search result row
      hashtag-result-card.tsx # NEW: Hashtag search result row
```

### Pattern 1: Unified Search with Type Tabs (DISC-01)
**What:** A single search page with a debounced text input and three result tabs (Users, Hashtags, Items). Each tab fetches from its own backend endpoint.
**When to use:** When searching across multiple entity types from one UI.
**Example:**
```typescript
// Backend: search.controller.ts
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('users')
  @UseGuards(OptionalJwtAuthGuard)
  async searchUsers(@Query('q') q: string, @Query('limit') limit?: string) {
    if (!q) return [];
    return this.searchService.searchUsers(q, limit ? parseInt(limit) : 10);
  }

  @Get('hashtags')
  @UseGuards(OptionalJwtAuthGuard)
  async searchHashtags(@Query('q') q: string, @Query('limit') limit?: string) {
    if (!q) return [];
    return this.searchService.searchHashtags(q, limit ? parseInt(limit) : 10);
  }

  @Get('items')
  @UseGuards(OptionalJwtAuthGuard)
  async searchItems(
    @Query('q') q: string,
    @Query('cursor') cursor?: string,
    @Req() req?: Request,
  ) {
    if (!q) return { items: [], nextCursor: null, hasMore: false };
    const viewerId = (req?.user as any)?.userId || null;
    return this.searchService.searchItems(q, cursor, viewerId);
  }
}
```

```typescript
// Frontend: search page with tabs
// Follow existing tab pattern: active tab state + conditional rendering
// Debounce search input 300ms (same as follower search pattern)
const [query, setQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');
const [activeTab, setActiveTab] = useState<'users' | 'hashtags' | 'items'>('users');

useEffect(() => {
  const timer = setTimeout(() => setDebouncedQuery(query), 300);
  return () => clearTimeout(timer);
}, [query]);
```

### Pattern 2: Hashtag Page with Post Grid (DISC-02)
**What:** A page at `/hashtag/[name]` that shows the hashtag name, post count, and a paginated post feed of all posts using that hashtag.
**When to use:** When the user taps a hashtag in a caption or selects a hashtag from search results.
**Example:**
```typescript
// Backend: posts.service.ts addition
async getPostsByHashtag(
  hashtagName: string,
  viewerId: string | null,
  cursor?: string,
  take = POST_LIMITS.feedPageSize,
) {
  const hashtag = await this.prisma.hashtag.findUnique({
    where: { name: hashtagName.toLowerCase() },
    include: { _count: { select: { posts: true } } },
  });

  if (!hashtag) {
    throw new NotFoundException('Hashtag khong ton tai');
  }

  const postHashtags = await this.prisma.postHashtag.findMany({
    where: { hashtagId: hashtag.id },
    include: {
      post: {
        include: {
          user: { select: { id: true, username: true, name: true, avatar: { select: { mediumKey: true } } } },
          media: { include: { media: { select: { id: true, largeKey: true } } }, orderBy: { position: 'asc' } },
          items: { include: { item: { select: { id: true, name: true, imageKey: true, series: { select: { name: true, category: { select: { name: true } } } } } } } },
          _count: { select: { likes: true, comments: true } },
        },
      },
    },
    orderBy: { post: { createdAt: 'desc' } },
    take: take + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });
  // ... pagination + mapPostResponse pattern
}
```

### Pattern 3: Category-Curated Explore (DISC-03)
**What:** An explore page that shows post content grouped by collection category. For each category with linked posts, show a section header and a horizontal scroll of post thumbnails or a grid.
**When to use:** When the user browses the explore page looking for content by collection interest.
**Example:**
```typescript
// Backend: feed.service.ts addition
async getExploreFeed(): Promise<ExploreCategorySection[]> {
  // Get categories with recent posts linked to items in that category
  const categories = await this.prisma.category.findMany({
    orderBy: { position: 'asc' },
    include: {
      series: {
        include: {
          items: {
            include: {
              postItems: {
                include: {
                  post: {
                    include: {
                      media: { include: { media: true }, orderBy: { position: 'asc' }, take: 1 },
                      user: { select: { id: true, username: true, name: true } },
                      _count: { select: { likes: true } },
                    },
                  },
                },
                take: 10, // Limit posts per item
              },
            },
          },
        },
      },
    },
  });
  // Flatten, deduplicate posts per category, take top N, resolve URLs
}
```

**Alternative (simpler, recommended):** Query posts that have linked items, group by category on the backend, return flat sections. This avoids deeply nested Prisma includes.

```typescript
// Simpler approach: raw query posts with PostItem joins grouped by category
async getExploreFeed() {
  const categories = await this.prisma.category.findMany({ orderBy: { position: 'asc' } });

  const sections = [];
  for (const category of categories) {
    const posts = await this.prisma.post.findMany({
      where: {
        items: {
          some: {
            item: { series: { categoryId: category.id } },
          },
        },
      },
      include: { /* standard post includes */ },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    if (posts.length > 0) {
      sections.push({ category: { id: category.id, name: category.name, slug: category.slug }, posts: posts.map(...) });
    }
  }
  return sections;
}
```

### Anti-Patterns to Avoid
- **Unified search in a single DB query:** Do NOT try to query users, hashtags, and items in one SQL query. Keep them separate -- the frontend orchestrates parallel requests. Attempting a UNION across unrelated tables creates unmaintainable queries.
- **N+1 on explore feed:** Do NOT load all posts then filter by category in JS. Query posts per category with `where: { items: { some: ... } }` to leverage DB indexes.
- **Full-text search premature optimization:** Do NOT add `pg_trgm` extensions or `tsvector` columns. Prisma `contains` with `mode: 'insensitive'` is sufficient for current scale (<50K records).
- **Separate SearchModule per entity:** Do NOT create three separate NestJS modules for searching. One `SearchModule` that imports and delegates to existing modules keeps it clean.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounced search input | Custom debounce logic from scratch | Reuse existing 300ms `setTimeout` pattern from follower/following search | Already proven in codebase, consistent UX |
| Infinite scroll | Custom scroll listener | IntersectionObserver + sentinel div pattern (used in feed, explore, followers) | Already proven, less buggy than scroll position tracking |
| Search result caching | Manual cache management | TanStack Query with `queryKey` including search term + tab | Automatic cache invalidation, deduplication |
| Post response mapping | New response format | Existing `mapPostResponse()` helper from PostsService/FeedService | Consistent response shape across all post lists |
| Auth-aware endpoints | New guard pattern | Existing `OptionalJwtAuthGuard` for public search, `JwtAuthGuard` where needed | Consistent auth pattern across app |

**Key insight:** 90% of the backend logic for Phase 5 already exists in scattered services. The work is wiring existing methods into new endpoints and adding two new query methods (`getPostsByHashtag`, `getExploreFeed`).

## Common Pitfalls

### Pitfall 1: Hashtag Case Sensitivity
**What goes wrong:** User searches for "gundam" but hashtag was stored as "Gundam" -- no results.
**Why it happens:** Hashtag extraction normalizes to lowercase (`extractHashtags` uses `.toLowerCase()`), but search might not.
**How to avoid:** The existing `searchHashtags` already uses `mode: 'insensitive'` and `startsWith`. The new `getPostsByHashtag` MUST normalize the input: `hashtagName.toLowerCase()` before querying `Hashtag.findUnique({ where: { name } })`.
**Warning signs:** Hashtag links from captions not matching hashtag pages.

### Pitfall 2: Explore Page N+1 Queries
**What goes wrong:** Loading 4 categories x 10 posts each = 40+ individual queries for post media URLs.
**Why it happens:** Resolving presigned URLs for each post's media individually.
**How to avoid:** Batch all storage keys across all sections, resolve presigned URLs once with a single `resolvePresignedUrls()` call for the entire explore response. Reuse the existing `resolvePresignedUrls` pattern from FeedService.
**Warning signs:** Explore page taking >2 seconds to load.

### Pitfall 3: Search Page Route Conflict
**What goes wrong:** `/search` route conflicts with `(public)/[username]` catch-all dynamic route.
**Why it happens:** Next.js App Router treats `[username]` as a catch-all that matches "search".
**How to avoid:** Place `/search` in the `(public)` route group alongside other public routes. Next.js prioritizes static routes over dynamic segments, so `/search/page.tsx` will match before `[username]/page.tsx`. Verify by testing navigation.
**Warning signs:** Clicking search in bottom nav renders a profile page or 404.

### Pitfall 4: Empty Explore Sections
**What goes wrong:** Categories with no linked posts still render as empty sections.
**Why it happens:** Backend returns all categories regardless of whether they have associated posts.
**How to avoid:** Filter categories server-side -- only return sections where at least one post exists. Use the `posts.length > 0` check before adding to sections array.
**Warning signs:** Explore page shows empty category headers with no content.

### Pitfall 5: Hashtag Page Missing Presigned URLs
**What goes wrong:** Post images on hashtag page show broken images.
**Why it happens:** Hashtag posts query omits presigned URL resolution.
**How to avoid:** Reuse the exact same `resolvePresignedUrls` + `mapPostResponse` pattern from FeedService/PostsService. All post list endpoints MUST resolve media URLs.
**Warning signs:** Hashtag page loads but images are broken or show placeholder.

### Pitfall 6: Search Input Not Clearing on Tab Switch
**What goes wrong:** User searches "gundam" in Users tab, switches to Items tab, sees stale items results for a different query.
**Why it happens:** Query state tied to input but not to tab.
**How to avoid:** Share the same search input state across all tabs. When the user types, all tabs query the same term. TanStack Query handles caching per `[queryKey, tab, term]`.
**Warning signs:** Inconsistent results across tabs for the same search term.

## Code Examples

### Unified Search Service Pattern
```typescript
// backend/src/search/search.service.ts
@Injectable()
export class SearchService {
  constructor(
    private profilesService: ProfilesService,
    private postsService: PostsService,
    private collectionService: CollectionService,
  ) {}

  async searchUsers(q: string, limit = 10) {
    return this.profilesService.searchProfiles(q, limit);
  }

  async searchHashtags(q: string, limit = 10) {
    const hashtags = await this.postsService.searchHashtags(q, limit);
    // Enhance with post count
    return hashtags.map((h: any) => ({
      id: h.id,
      name: h.name,
    }));
  }

  async searchItems(q: string, cursor?: string, viewerId?: string) {
    return this.collectionService.searchItems(q, { cursor }, viewerId);
  }
}
```

### Frontend Search Hook Pattern
```typescript
// frontend/src/hooks/queries/search-queries.ts
export function useSearchUsers(q: string) {
  return useQuery({
    queryKey: ['search', 'users', q],
    queryFn: async () => {
      const response = await apiClient.get<SearchUserResult[]>(
        `/search/users?q=${encodeURIComponent(q)}`,
      );
      return response.data;
    },
    enabled: q.length >= 1,
    staleTime: 30 * 1000,
  });
}

export function useSearchHashtags(q: string) {
  return useQuery({
    queryKey: ['search', 'hashtags', q],
    queryFn: async () => {
      const response = await apiClient.get<SearchHashtagResult[]>(
        `/search/hashtags?q=${encodeURIComponent(q)}`,
      );
      return response.data;
    },
    enabled: q.length >= 1,
    staleTime: 30 * 1000,
  });
}

export function useHashtagPosts(name: string) {
  return useInfiniteQuery({
    queryKey: ['hashtagPosts', name],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const response = await apiClient.get<PaginatedResponse<PostResponse>>(
        `/posts/hashtag/${encodeURIComponent(name)}?${params.toString()}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!name,
  });
}

export function useExploreFeed() {
  return useQuery({
    queryKey: ['explore'],
    queryFn: async () => {
      const response = await apiClient.get<ExploreCategorySection[]>('/feed/explore');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### Hashtag Page Frontend Pattern
```typescript
// frontend/src/app/(public)/hashtag/[name]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { useHashtagPosts } from '@/hooks/queries/search-queries';
import { PostCard } from '@/components/post/post-card';
// ... IntersectionObserver infinite scroll pattern (same as explore/feed)

export default function HashtagPage() {
  const { name } = useParams<{ name: string }>();
  const decodedName = decodeURIComponent(name);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useHashtagPosts(decodedName);
  // ... standard infinite scroll rendering
}
```

### Category-Curated Explore Section
```typescript
// Frontend explore page with category sections
interface ExploreCategorySection {
  category: { id: string; name: string; slug: string };
  posts: PostResponse[];
}

// Render: category header + horizontal scroll of post thumbnails
{sections.map((section) => (
  <div key={section.category.id} className="mb-6">
    <div className="flex items-center justify-between px-4 mb-2">
      <h2 className="text-lg font-bold">{section.category.name}</h2>
      <Link href={`/collection/${section.category.slug}`} className="text-sm text-primary">
        Xem tat ca
      </Link>
    </div>
    <div className="grid grid-cols-3 gap-0.5">
      {section.posts.slice(0, 9).map((post) => (
        <PostThumbnail key={post.id} post={post} />
      ))}
    </div>
  </div>
))}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full-text search from day 1 | Simple `ILIKE`/`contains` until scale demands it | Ongoing best practice | Avoids premature optimization, simpler Prisma queries |
| Client-side filtering | Server-side filtering with cursor pagination | Already implemented | Consistent with existing codebase pattern |
| Single monolithic search endpoint | Separate endpoints per entity type | Current pattern | Better caching, independent loading states per tab |

**Deprecated/outdated:**
- The current explore page (`/explore`) uses `usePublicFeed()` which is a simple chronological feed. This will be replaced with a category-curated explore. The public feed can remain as a fallback or be removed.

## Open Questions

1. **Hashtag post count display**
   - What we know: `PostHashtag` join table allows counting posts per hashtag via `_count`
   - What's unclear: Whether to show post count in search results and on hashtag page header
   - Recommendation: Yes, add `postCount` to hashtag search results and hashtag page header. Query via `_count: { select: { posts: true } }` on `Hashtag` model.

2. **Explore page: posts with no linked items**
   - What we know: Only posts linked to collection items via `PostItem` will appear in category sections
   - What's unclear: Should posts without linked items appear anywhere on explore? (e.g., a "Recent" section)
   - Recommendation: Add a "Moi nhat" (Latest) section at the bottom of explore using the existing public feed query for posts not captured by categories. This ensures all content is discoverable.

3. **Search endpoint authentication**
   - What we know: Existing hashtag search requires `JwtAuthGuard`, but the goal is public discoverability
   - What's unclear: Whether search should work for unauthenticated users
   - Recommendation: Use `OptionalJwtAuthGuard` for all search endpoints. Unauthenticated users can search and discover; item search omits owned/wishlist status when no viewer.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest with ts-jest |
| Config file | `backend/jest.config.ts` |
| Quick run command | `cd backend && npx jest --testPathPattern="search\|hashtag\|explore" --no-coverage -t` |
| Full suite command | `cd backend && npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISC-01 | Unified search returns users, hashtags, items | unit | `cd backend && npx jest src/search/__tests__/search.service.spec.ts -x` | Wave 0 |
| DISC-02 | getPostsByHashtag returns paginated posts for a hashtag | unit | `cd backend && npx jest src/posts/__tests__/hashtag-posts.spec.ts -x` | Wave 0 |
| DISC-03 | getExploreFeed returns category-grouped posts | unit | `cd backend && npx jest src/feed/__tests__/explore-feed.spec.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && npx jest --no-coverage --testPathPattern="search|hashtag|explore" -x`
- **Per wave merge:** `cd backend && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/search/__tests__/search.service.spec.ts` -- covers DISC-01 unified search delegation
- [ ] `backend/src/posts/__tests__/hashtag-posts.spec.ts` -- covers DISC-02 getPostsByHashtag
- [ ] `backend/src/feed/__tests__/explore-feed.spec.ts` -- covers DISC-03 getExploreFeed

## Sources

### Primary (HIGH confidence)
- **Existing codebase analysis** -- Read all relevant source files: PostsService, FeedService, CollectionService, ProfilesService, all controllers, all frontend hooks/queries, Prisma schema, shared types, CaptionDisplay component, BottomNav component
- **Prisma documentation** -- `contains` with `mode: 'insensitive'` for case-insensitive search confirmed in schema and existing service code
- **Existing patterns** -- Debounced search (300ms), IntersectionObserver infinite scroll, cursor pagination (take+1), OptionalJwtAuthGuard, mapPostResponse helper all verified in codebase

### Secondary (MEDIUM confidence)
- **Next.js App Router routing** -- Static routes (`/search`) take precedence over dynamic routes (`/[username]`) per Next.js routing documentation

### Tertiary (LOW confidence)
- None -- all findings verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries needed, all patterns established in codebase
- Architecture: HIGH -- extends existing modules with well-understood patterns
- Pitfalls: HIGH -- identified from direct codebase analysis of existing bugs and patterns

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable -- no external dependencies changing)
