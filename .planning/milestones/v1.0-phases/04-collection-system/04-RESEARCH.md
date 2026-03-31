# Phase 4: Collection System - Research

**Researched:** 2026-03-15
**Domain:** Collection tracking system -- Prisma schema design, NestJS modules, Next.js pages, search, seed data
**Confidence:** HIGH

## Summary

Phase 4 is Figly's core differentiator: a hierarchical collection database (Category > Series > Item) with ownership/wishlist tracking, custom checklists, post-to-item linking, profile collection showcase, and series/category following. The existing codebase has well-established patterns for NestJS modules (controller + service + module), Prisma schema extension with `@@map`, cursor-based pagination (take+1), optimistic toggle mutations (like/bookmark/follow), and profile page components. The collection system extends all of these patterns rather than introducing new architectural concepts.

The primary technical challenges are: (1) designing 8 new Prisma models with correct relations and indexes, (2) implementing item search with acceptable performance using Prisma's built-in `contains` filtering (sufficient for the admin-seeded database size), (3) seed data strategy for initial categories/series/items, (4) extending the post creation flow with an item-linking step, and (5) adding a Collection tab to the profile page.

**Primary recommendation:** Build incrementally -- schema + seed first, then backend CRUD modules, then frontend browsing/search, then owned/wishlist toggles, then checklists, then post linking + profile tab + follow extensions. Reuse every existing pattern (toggle mutations, cursor pagination, infinite scroll, optimistic updates).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Shared item database with categories (Gundam, figurines, sneakers, trading cards, etc.)
- Items organized hierarchically: Category > Series/Line > Individual Items
- Items are admin-seeded -- users cannot add items to the shared database
- Category-based browsing: landing page shows all categories with cover images and item counts
- Within a category: grid of series/lines; within a series: grid of individual items
- Search: single search bar across all items by name, with category/series filters
- Owned/wishlist are mutually exclusive toggle states per user per item
- Visual indicators: filled checkmark for owned, heart/star for wishlist
- "X collectors own this" social proof on item detail
- Custom checklists with database items OR freeform text entries
- Progress displayed as "X/Y complete" with progress bar
- Checklists private by default, visible on profile collection showcase
- Post-to-item linking: 1+ items from database, item picker with search, tappable tags on post detail
- Profile Collection tab showing owned items organized by category
- Follow series/categories with follow/unfollow button (track state only, feed integration is future)

### Claude's Discretion
- Exact seed data content and quantity per category
- Item detail page layout
- Checklist reordering interaction (drag-and-drop vs up/down buttons)
- Category cover image handling (static assets vs admin-uploaded)
- Search debounce timing and result limit
- Empty states for categories with no items, empty checklists
- Pagination strategy for item browsing grids
- Animation details for owned/wishlist toggle

### Deferred Ideas (OUT OF SCOPE)
- Community-submitted database entries with admin approval (COLL-V2-05) -- v2
- Item pages with community photos, ratings, and discussion (COLL-V2-01) -- v2
- Collection statistics with progress bars and completion % per series (COLL-V2-02) -- v2
- Item release calendar with notifications (COLL-V2-03) -- v2
- Collection sharing cards (COLL-V2-04) -- v2
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COLL-01 | User can browse shared item database by category | Category > Series > Item hierarchy, cursor pagination, category landing page |
| COLL-02 | User can search items in the database | Prisma `contains` with mode `insensitive`, category/series filter params |
| COLL-03 | User can mark items as "owned" | OwnedItem model with unique constraint, toggle endpoint, optimistic mutation |
| COLL-04 | User can mark items as "wishlist" | WishlistItem model with unique constraint, mutual exclusion with owned |
| COLL-05 | User can create custom checklists with custom names | Checklist model with userId + name, CRUD endpoints |
| COLL-06 | User can add database items or freeform entries to custom checklists | ChecklistEntry with optional itemId + optional freeformText |
| COLL-07 | User can track checklist progress (X/Y complete) | Aggregated count query, progress bar UI component |
| CONT-07 | User can link post to item(s) from collection database | PostItem join table, item picker in create-post flow, tags on post detail |
| PROF-04 | User profile has collection showcase tab | Tabs component on profile page, owned items grouped by category |
| SOCL-04 | User can follow collection series/categories | SeriesFollow + CategoryFollow models, follow/unfollow endpoints |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.19.x | Database ORM, schema, migrations | Already in use, 8 new models extend existing schema |
| NestJS | 10.x | Backend framework | Already in use, new Collection + Checklist modules |
| Next.js | 15.x | Frontend framework | Already in use, new collection pages + profile tab |
| TanStack Query | 5.x | Server state management | Already in use, infinite queries + mutations |
| shadcn/ui | latest | UI components | Already in use -- Tabs, Card, Progress, Checkbox, Badge, ScrollArea |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.x | DTO validation | Collection DTOs, checklist validators (Vietnamese messages) |
| lucide-react | latest | Icons | Check, Heart, Star, Search, Grid, List icons for collection UI |
| sonner | latest | Toast notifications | Success/error toasts for toggle actions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma `contains` search | PostgreSQL `pg_trgm` extension | pg_trgm is better for fuzzy/typo-tolerant search but overkill for admin-seeded DB of ~500-2000 items. Prisma `contains` with `mode: 'insensitive'` is sufficient for v1 |
| Drag-and-drop library (dnd-kit) | Up/down arrow buttons | Drag-and-drop adds ~15KB bundle + complexity. Up/down buttons are simpler and sufficient for checklist reordering in v1. Recommend up/down buttons |
| Separate search service (Meilisearch) | Prisma queries | Way overkill for admin-seeded item database. Reserve for v2 if item count grows past 10K |

## Architecture Patterns

### Recommended New Backend Modules
```
backend/src/
  collection/
    collection.controller.ts    # Categories, series, items CRUD (read-only for users)
    collection.service.ts       # Browse, search, owned/wishlist logic
    collection.module.ts
    dto/
      collection.dto.ts         # Query params, response DTOs
    __tests__/
      collection.service.spec.ts
  checklist/
    checklist.controller.ts     # Checklist CRUD + entries
    checklist.service.ts        # Create, update, delete, reorder, toggle entry
    checklist.module.ts
    dto/
      checklist.dto.ts
    __tests__/
      checklist.service.spec.ts
```

### Recommended New Frontend Structure
```
frontend/src/
  app/(public)/
    collection/
      page.tsx                  # Category landing page (all categories grid)
      [categorySlug]/
        page.tsx                # Series grid within category
        [seriesSlug]/
          page.tsx              # Items grid within series
    item/
      [itemId]/
        page.tsx                # Item detail page
  app/(app)/
    checklists/
      page.tsx                  # User's checklists list
      [checklistId]/
        page.tsx                # Checklist detail with entries
      new/
        page.tsx                # Create checklist
  components/
    collection/
      category-card.tsx         # Category grid card with cover + count
      series-card.tsx           # Series grid card
      item-card.tsx             # Item card with owned/wishlist indicators
      item-detail.tsx           # Item detail view
      item-search.tsx           # Search bar + results
      owned-wishlist-toggle.tsx # Toggle buttons for owned/wishlist state
      item-picker.tsx           # Search+select picker for post linking
      collection-showcase.tsx   # Profile tab content
    checklist/
      checklist-card.tsx        # Checklist with progress bar
      checklist-entry.tsx       # Single entry with checkbox
  hooks/queries/
    collection-queries.ts       # Categories, series, items, search, owned/wishlist
    checklist-queries.ts        # Checklists CRUD + entries
```

### Pattern 1: Prisma Schema -- New Models
**What:** 8 new models extending existing schema with proper relations
**When to use:** All collection data
**Example:**
```prisma
model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  coverImage  String?  // Static asset path or MinIO key
  position    Int      @default(0)
  createdAt   DateTime @default(now())

  series    Series[]
  followers CategoryFollow[]

  @@map("categories")
}

model Series {
  id          String   @id @default(cuid())
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  name        String
  slug        String
  description String?
  coverImage  String?
  position    Int      @default(0)
  createdAt   DateTime @default(now())

  items     Item[]
  followers SeriesFollow[]

  @@unique([categoryId, slug])
  @@index([categoryId])
  @@map("series")
}

model Item {
  id          String    @id @default(cuid())
  seriesId    String
  series      Series    @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  name        String
  description String?
  imageKey    String?   // MinIO storage key
  releaseDate DateTime?
  createdAt   DateTime  @default(now())

  ownedBy        OwnedItem[]
  wishlistedBy   WishlistItem[]
  checklistEntries ChecklistEntry[]
  postItems      PostItem[]

  @@index([seriesId])
  @@index([name])  // For search performance
  @@map("items")
}

model OwnedItem {
  id        String   @id @default(cuid())
  userId    String
  itemId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  item      Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, itemId])
  @@index([userId])
  @@index([itemId])
  @@map("owned_items")
}

model WishlistItem {
  id        String   @id @default(cuid())
  userId    String
  itemId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  item      Item     @relation(fields: [itemId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, itemId])
  @@index([userId])
  @@index([itemId])
  @@map("wishlist_items")
}

model Checklist {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name      String   @db.VarChar(100)
  isPublic  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  entries ChecklistEntry[]

  @@index([userId])
  @@map("checklists")
}

model ChecklistEntry {
  id           String   @id @default(cuid())
  checklistId  String
  checklist    Checklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)
  itemId       String?  // null for freeform entries
  item         Item?    @relation(fields: [itemId], references: [id], onDelete: SetNull)
  freeformText String?  @db.VarChar(200) // null for database item entries
  isChecked    Boolean  @default(false)
  position     Int      @default(0)
  createdAt    DateTime @default(now())

  @@index([checklistId, position])
  @@map("checklist_entries")
}

model PostItem {
  id     String @id @default(cuid())
  postId String
  itemId String
  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  item   Item   @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@unique([postId, itemId])
  @@index([postId])
  @@index([itemId])
  @@map("post_items")
}

model CategoryFollow {
  id         String   @id @default(cuid())
  userId     String
  categoryId String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([userId, categoryId])
  @@index([userId])
  @@map("category_follows")
}

model SeriesFollow {
  id       String   @id @default(cuid())
  userId   String
  seriesId String
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  series   Series   @relation(fields: [seriesId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([userId, seriesId])
  @@index([userId])
  @@map("series_follows")
}
```

**User model additions:**
```prisma
// Add to existing User model:
ownedItems      OwnedItem[]
wishlistItems   WishlistItem[]
checklists      Checklist[]
categoryFollows CategoryFollow[]
seriesFollows   SeriesFollow[]
```

**Post model addition:**
```prisma
// Add to existing Post model:
items PostItem[]
```

### Pattern 2: Owned/Wishlist Toggle (Mutual Exclusion)
**What:** When marking as owned, remove from wishlist (and vice versa). Reuse the idempotent P2002/P2025 pattern from follow/unfollow.
**When to use:** COLL-03, COLL-04
**Example:**
```typescript
async markOwned(userId: string, itemId: string) {
  return this.prisma.$transaction(async (tx) => {
    // Remove from wishlist if present
    await tx.wishlistItem.deleteMany({ where: { userId, itemId } });
    // Add to owned (idempotent)
    try {
      await tx.ownedItem.create({ data: { userId, itemId } });
    } catch (e: any) {
      if (e.code === 'P2002') return; // already owned
      throw e;
    }
  });
}

async removeOwned(userId: string, itemId: string) {
  try {
    await this.prisma.ownedItem.delete({
      where: { userId_itemId: { userId, itemId } },
    });
  } catch (e: any) {
    if (e.code === 'P2025') return; // not owned
    throw e;
  }
}
```

### Pattern 3: Item Search with Prisma
**What:** Case-insensitive search with optional category/series filters
**When to use:** COLL-02
**Example:**
```typescript
async searchItems(query: string, opts: { categoryId?: string; seriesId?: string; cursor?: string; take?: number }) {
  const take = opts.take || 20;
  const where: Prisma.ItemWhereInput = {
    name: { contains: query, mode: 'insensitive' },
    ...(opts.seriesId && { seriesId: opts.seriesId }),
    ...(opts.categoryId && { series: { categoryId: opts.categoryId } }),
  };

  const items = await this.prisma.item.findMany({
    where,
    take: take + 1,
    ...(opts.cursor && { cursor: { id: opts.cursor }, skip: 1 }),
    orderBy: { name: 'asc' },
    include: { series: { include: { category: true } } },
  });

  const hasMore = items.length > take;
  return { items: items.slice(0, take), nextCursor: hasMore ? items[take - 1].id : null };
}
```

### Pattern 4: Profile Collection Tab
**What:** Add Tabs to profile page -- Posts tab (existing grid) + Collection tab (new)
**When to use:** PROF-04
**Example:** The profile page currently renders `ProfilePostGrid` directly. Wrap it with shadcn `Tabs`:
```tsx
<Tabs defaultValue="posts">
  <TabsList className="w-full justify-center border-b rounded-none">
    <TabsTrigger value="posts"><Grid3X3 /> Bai viet</TabsTrigger>
    <TabsTrigger value="collection"><Package /> Bo suu tap</TabsTrigger>
  </TabsList>
  <TabsContent value="posts"><ProfilePostGrid username={username} /></TabsContent>
  <TabsContent value="collection"><CollectionShowcase username={username} /></TabsContent>
</Tabs>
```

### Pattern 5: Post Item Linking
**What:** Add optional step to create-post flow for searching and selecting collection items
**When to use:** CONT-07
**Key insight:** The existing `CreatePostFlow` has steps: gallery > edit > caption. Add an optional "link items" sub-step within the caption step (not a separate step). Show an "add items" button that opens an `ItemPicker` dialog. Selected items stored in `create-post-store` as `linkedItemIds: string[]`, sent with the create post API call.

### Anti-Patterns to Avoid
- **Separate owned and wishlist endpoints that don't enforce mutual exclusion:** Always use a transaction to remove the opposite state when setting one.
- **Loading all items without pagination:** Even admin-seeded databases can have hundreds of items per series. Always paginate.
- **Fetching collection status per-item in a loop:** Batch-check owned/wishlist status with `IN` clause, same pattern as batch follow-status check in SocialService.
- **Storing checklist progress as a column:** Calculate it from the entries -- `COUNT(*) WHERE isChecked = true` / `COUNT(*)`. Storing it would create sync issues.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search | Custom search indexing | Prisma `contains` + `mode: insensitive` | Admin-seeded DB is small enough. pg_trgm or Meilisearch for v2 if needed |
| Progress bars | Custom div-based progress | shadcn/ui `Progress` component | Already available, accessible, animated |
| Checkbox UI | Custom checkbox rendering | shadcn/ui `Checkbox` component | Already available, accessible |
| Tab navigation | Custom tab state management | shadcn/ui `Tabs` component | Already available in project |
| Drag-and-drop reorder | Custom pointer event handling | Up/down arrow buttons (simpler) | DnD libraries add complexity; arrow buttons work well for lists of 10-50 items |
| Optimistic toggle | Manual cache manipulation | TanStack Query `onMutate` + `onError` rollback | Exact pattern already established for like/bookmark/follow toggles |
| Slug generation | Custom slug function | Simple: `name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')` | Only needed for admin seed data, not user input |

## Common Pitfalls

### Pitfall 1: Owned/Wishlist Race Condition
**What goes wrong:** User rapidly taps owned then wishlist; both end up set due to non-transactional operations.
**Why it happens:** Without `$transaction`, the delete-then-create is not atomic.
**How to avoid:** Always use `prisma.$transaction` for the mutual exclusion toggle. Frontend debounces rapid taps.
**Warning signs:** Item showing both owned AND wishlist indicators.

### Pitfall 2: N+1 Queries in Collection Browsing
**What goes wrong:** Loading category page triggers separate query per series to get item counts.
**Why it happens:** Not using Prisma's `_count` include or aggregation.
**How to avoid:** Use `include: { _count: { select: { items: true } } }` on Series queries and `_count: { select: { series: true } }` on Category queries.
**Warning signs:** Slow page loads, many database queries in logs.

### Pitfall 3: Missing Viewer Context in Item Cards
**What goes wrong:** Item cards don't show owned/wishlist status for the current user.
**Why it happens:** Forgetting to pass viewerId and batch-check status.
**How to avoid:** Same pattern as post like/bookmark status: batch IN query for viewer's owned and wishlist items, return as Sets, attach `isOwned`/`isWishlisted` booleans to response.
**Warning signs:** Logged-in user sees no indicators on items they own.

### Pitfall 4: Checklist Entry Ordering Gaps
**What goes wrong:** After deleting entries, position values have gaps (1, 3, 5), causing visual/sorting issues.
**Why it happens:** Position is a simple integer that isn't recalculated on delete.
**How to avoid:** Two options: (a) accept gaps and just ORDER BY position (gaps are fine for display), or (b) recalculate positions on reorder operations. Recommend (a) for simplicity.
**Warning signs:** New entries appearing in unexpected positions.

### Pitfall 5: Seed Data Without Idempotency
**What goes wrong:** Running seed script twice creates duplicate categories/series/items.
**Why it happens:** Using `create` instead of `upsert`.
**How to avoid:** Use `prisma.category.upsert({ where: { slug }, create: {...}, update: {...} })` for all seed data. Slug is the natural unique key.
**Warning signs:** Duplicate categories appearing in browsing UI.

## Code Examples

### Seed Data Script Pattern
```typescript
// backend/prisma/seed-collections.ts
const categories = [
  {
    name: 'Gundam', slug: 'gundam', description: 'Mo hinh Gundam',
    series: [
      { name: 'Master Grade (MG)', slug: 'mg', items: [
        { name: 'RX-78-2 Gundam Ver.3.0' },
        { name: 'MSN-06S Sinanju' },
        { name: 'ZGMF-X10A Freedom Gundam 2.0' },
        // ... 10-15 items per series minimum
      ]},
      { name: 'High Grade (HG)', slug: 'hg', items: [...] },
      { name: 'Perfect Grade (PG)', slug: 'pg', items: [...] },
      { name: 'Real Grade (RG)', slug: 'rg', items: [...] },
    ],
  },
  {
    name: 'Figurines', slug: 'figurines', description: 'Mo hinh nhan vat',
    series: [
      { name: 'Nendoroid', slug: 'nendoroid', items: [...] },
      { name: 'Figma', slug: 'figma', items: [...] },
      { name: 'S.H.Figuarts', slug: 'sh-figuarts', items: [...] },
    ],
  },
  {
    name: 'Sneakers', slug: 'sneakers', description: 'Giay sneaker',
    series: [
      { name: 'Nike Air Jordan', slug: 'air-jordan', items: [...] },
      { name: 'Nike Dunk', slug: 'nike-dunk', items: [...] },
      { name: 'Adidas Yeezy', slug: 'adidas-yeezy', items: [...] },
    ],
  },
  {
    name: 'Trading Cards', slug: 'trading-cards', description: 'The suu tap',
    series: [
      { name: 'Pokemon TCG', slug: 'pokemon-tcg', items: [...] },
      { name: 'Yu-Gi-Oh!', slug: 'yu-gi-oh', items: [...] },
      { name: 'One Piece Card Game', slug: 'one-piece-tcg', items: [...] },
    ],
  },
];

async function seedCollections(prisma: PrismaClient) {
  for (const cat of categories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: { name: cat.name, slug: cat.slug, description: cat.description },
      update: { name: cat.name, description: cat.description },
    });
    for (const ser of cat.series) {
      const series = await prisma.series.upsert({
        where: { categoryId_slug: { categoryId: category.id, slug: ser.slug } },
        create: { categoryId: category.id, name: ser.name, slug: ser.slug },
        update: { name: ser.name },
      });
      for (const item of ser.items) {
        await prisma.item.upsert({
          where: { id: 'seed-' + cat.slug + '-' + ser.slug + '-' + item.name },
          // Use a deterministic ID for seed items for idempotency
          create: { id: 'seed-' + cat.slug + '-' + ser.slug + '-' + slugify(item.name), seriesId: series.id, name: item.name },
          update: { name: item.name },
        });
      }
    }
  }
}
```

### Optimistic Owned/Wishlist Toggle (Frontend)
```typescript
// Reuses exact pattern from interaction-queries.ts (like/bookmark toggle)
export function useToggleOwned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => apiClient.post(`/collection/items/${itemId}/owned`),
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ['item', itemId] });
      const prev = queryClient.getQueryData(['item', itemId]);
      queryClient.setQueryData(['item', itemId], (old: any) => ({
        ...old,
        isOwned: !old.isOwned,
        isWishlisted: old.isOwned ? old.isWishlisted : false, // clear wishlist if marking owned
        ownerCount: old.isOwned ? old.ownerCount - 1 : old.ownerCount + 1,
      }));
      return { prev };
    },
    onError: (_err, itemId, context) => {
      queryClient.setQueryData(['item', itemId], context?.prev);
    },
    onSettled: (_d, _e, itemId) => {
      queryClient.invalidateQueries({ queryKey: ['item', itemId] });
    },
  });
}
```

### Batch Status Check (Backend)
```typescript
// Same pattern as batch follow-status in SocialService
async getItemStatuses(userId: string, itemIds: string[]) {
  const [owned, wishlisted] = await Promise.all([
    this.prisma.ownedItem.findMany({
      where: { userId, itemId: { in: itemIds } },
      select: { itemId: true },
    }),
    this.prisma.wishlistItem.findMany({
      where: { userId, itemId: { in: itemIds } },
      select: { itemId: true },
    }),
  ]);
  const ownedSet = new Set(owned.map((o) => o.itemId));
  const wishlistSet = new Set(wishlisted.map((w) => w.itemId));
  return { ownedSet, wishlistSet };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full-text search with `LIKE` | Prisma `contains` + `mode: insensitive` | Prisma 4+ | Simple, sufficient for small datasets |
| Manual optimistic updates | TanStack Query `onMutate` pattern | TQ v5 | Consistent, rollback-safe |
| Custom tab state | shadcn/ui Tabs (Radix) | Already in project | Accessible, keyboard-navigable |
| Client-side search | Server-side filtered queries | Standard pattern | Consistent pagination, no client memory issues |

## Open Questions

1. **Item images for seed data**
   - What we know: Items can have imageKey pointing to MinIO storage
   - What's unclear: Whether to include placeholder images in seed data or leave null
   - Recommendation: Use null for v1 seed, display a placeholder icon (Package from lucide-react). Item images can be added by admin later. This avoids needing to bundle and upload images during seed.

2. **Category cover images**
   - What we know: Categories need cover images for the landing page
   - What's unclear: Static assets vs MinIO-stored
   - Recommendation: Use static assets in `public/categories/` (e.g., `gundam.jpg`). Store as relative path in `coverImage` field. Simpler than MinIO for a handful of admin-managed images.

3. **Checklist visibility on other users' profiles**
   - What we know: Checklists are private by default, visible on profile collection showcase
   - What's unclear: Whether other users can see your public checklists
   - Recommendation: Add `isPublic` boolean on Checklist. Profile showcase shows only public checklists to other viewers, all checklists to the owner.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.x + ts-jest |
| Config file | `backend/jest.config.ts` |
| Quick run command | `cd backend && npx jest --testPathPattern=collection --no-coverage -x` |
| Full suite command | `cd backend && npx jest --no-coverage` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COLL-01 | Browse categories, series, items | unit | `cd backend && npx jest collection.service.spec.ts -x` | No -- Wave 0 |
| COLL-02 | Search items by name with filters | unit | `cd backend && npx jest collection.service.spec.ts -x` | No -- Wave 0 |
| COLL-03 | Mark item as owned (toggle) | unit | `cd backend && npx jest collection.service.spec.ts -x` | No -- Wave 0 |
| COLL-04 | Mark item as wishlist (toggle + mutual exclusion) | unit | `cd backend && npx jest collection.service.spec.ts -x` | No -- Wave 0 |
| COLL-05 | Create custom checklist | unit | `cd backend && npx jest checklist.service.spec.ts -x` | No -- Wave 0 |
| COLL-06 | Add db items or freeform entries | unit | `cd backend && npx jest checklist.service.spec.ts -x` | No -- Wave 0 |
| COLL-07 | Track checklist progress | unit | `cd backend && npx jest checklist.service.spec.ts -x` | No -- Wave 0 |
| CONT-07 | Link post to items | unit | `cd backend && npx jest posts.service.spec.ts -x` | Exists (extend) |
| PROF-04 | Profile collection showcase | manual-only | Visual verification of tab + grid | N/A |
| SOCL-04 | Follow series/categories | unit | `cd backend && npx jest collection.service.spec.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && npx jest --testPathPattern="(collection|checklist)" --no-coverage -x`
- **Per wave merge:** `cd backend && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/collection/__tests__/collection.service.spec.ts` -- covers COLL-01 through COLL-04, SOCL-04
- [ ] `backend/src/checklist/__tests__/checklist.service.spec.ts` -- covers COLL-05 through COLL-07
- [ ] Extend `backend/src/posts/__tests__/posts.service.spec.ts` -- covers CONT-07

## Sources

### Primary (HIGH confidence)
- Existing Prisma schema at `backend/prisma/schema.prisma` -- all model patterns (@@map, @@unique, @@index, relations)
- Existing NestJS modules at `backend/src/social/`, `backend/src/posts/` -- controller+service+module pattern
- Existing frontend components at `frontend/src/components/` -- profile, create-post, social patterns
- Existing query hooks at `frontend/src/hooks/queries/` -- TanStack Query patterns, optimistic updates
- shadcn/ui components already installed: Tabs, Card, Progress, Checkbox, Badge, ScrollArea

### Secondary (MEDIUM confidence)
- Prisma `contains` search with `mode: insensitive` -- verified from Prisma docs, performs case-insensitive ILIKE under PostgreSQL
- TanStack Query optimistic update pattern -- verified from project's existing `interaction-queries.ts` and `social-queries.ts`

### Tertiary (LOW confidence)
- Seed data item counts and names -- estimated, needs validation during implementation. Recommend 10-15 items per series, 3-5 series per category, 4 categories = ~150-300 total items for launch

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new dependencies needed
- Architecture: HIGH - all patterns directly extend existing codebase patterns
- Pitfalls: HIGH - based on actual codebase patterns (P2002/P2025 handling, batch status checks, _count includes)
- Schema design: HIGH - follows exact conventions from existing 14 models in schema.prisma
- Seed data: MEDIUM - quantity and specific item names are estimates, content is Claude's discretion

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable -- no fast-moving dependencies)
