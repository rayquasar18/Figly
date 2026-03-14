# Phase 4: Collection System - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning
**Source:** Auto-generated from prior phase context, requirements, and codebase analysis

<domain>
## Phase Boundary

Users can browse a shared item database by category (Gundam, figurines, sneakers, trading cards, etc.), search for specific items, mark items as "owned" or "wishlist", create named custom checklists with items or freeform entries, track checklist progress (X/Y complete), link posts to collection items, view a collection showcase tab on profiles, and follow specific collection series or categories. This is Figly's core differentiator — the collection tracking system that sets it apart from Instagram.

</domain>

<decisions>
## Implementation Decisions

### Item database structure
- Shared item database with categories (Gundam, figurines, sneakers, trading cards, etc.)
- Items organized hierarchically: Category → Series/Line → Individual Items
- Example: Gundam → MG (Master Grade) → RX-78-2 Gundam Ver.3.0
- Each item has: name, image, series, category, release date (optional), description (optional)
- Items are admin-seeded — users cannot add items to the shared database (community submissions is v2: COLL-V2-05)
- Seed data needed for initial categories — minimum viable set for launch

### Browsing & search
- Category-based browsing: landing page shows all categories with cover images and item counts
- Within a category: grid of series/lines, each showing cover image and item count
- Within a series: grid of individual items
- Search: single search bar that searches across all items by name, with category/series filters
- Search results show item image, name, series, category, and owned/wishlist status indicators

### Owned & wishlist tracking
- Each user can mark any item as "owned" or "wishlist" — mutually exclusive states
- Toggle pattern: tap "owned" to mark owned, tap again to remove. Same for "wishlist"
- Visual indicators on item cards: filled checkmark for owned, heart/star for wishlist
- Counts visible on item detail: "X collectors own this"
- User's owned and wishlist items accessible from their profile collection tab

### Custom checklists
- User can create named checklists (e.g., "My MG Gundam Collection", "Grails")
- Checklist items can be: database items OR freeform text entries
- Each checklist item has a checked/unchecked state
- Progress displayed as "X/Y complete" with a progress bar
- Checklists are private by default, visible on profile collection showcase
- Reorder checklist items via drag-and-drop (or Claude's discretion for interaction pattern)

### Post-to-item linking (CONT-07)
- When creating or editing a post, user can link to 1+ items from the collection database
- Item picker: search + select from database, shows selected items as tags/chips
- On post detail, linked items appear as tappable tags below the caption
- Tapping a linked item navigates to the item detail page

### Profile collection showcase (PROF-04)
- New tab on profile page alongside posts grid: "Collection" tab
- Collection tab shows: owned items organized by category, with counts per category
- Each category section shows item thumbnails in a grid
- Tapping an item shows item detail

### Follow series/categories (SOCL-04)
- User can follow a specific series (e.g., "MG Gundam") or category (e.g., "Sneakers")
- Following a series/category means seeing related posts in feed (future enhancement — for now, just track the follow state)
- Visual: follow/unfollow button on series and category pages

### Claude's Discretion
- Exact seed data content and quantity per category
- Item detail page layout
- Checklist reordering interaction (drag-and-drop vs up/down buttons)
- Category cover image handling (static assets vs admin-uploaded)
- Search debounce timing and result limit
- Empty states for categories with no items, empty checklists
- Pagination strategy for item browsing grids
- Animation details for owned/wishlist toggle

</decisions>

<specifics>
## Specific Ideas

- This is the CORE DIFFERENTIATOR — what makes Figly different from Instagram. The collection system must feel first-class, not bolted on.
- Instagram-style UX patterns continue: tabs on profile, grid layouts, tap interactions
- Hierarchical browsing (Category → Series → Items) mirrors how collectors actually think about their collections
- "X collectors own this" social proof on items encourages engagement and discovery
- Checklists serve the "completionist" mindset — collectors love tracking progress toward completing a set

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Media pipeline**: MinIO + BullMQ + Sharp for item images (same pipeline as posts/avatars)
- **shadcn/ui components**: Tabs (for profile collection tab), Card, Button, Progress, Checkbox, Dialog, ScrollArea, Badge
- **TanStack Query**: useInfiniteQuery for paginated item browsing, useMutation for owned/wishlist toggles
- **Optimistic updates**: Pattern established in follow/unfollow and like/bookmark — reuse for owned/wishlist toggle
- **Cursor-based pagination**: take+1 pattern established in posts and followers
- **ProfilePostGrid**: Profile page already has tab-like structure that can be extended with Collection tab
- **Post creation flow**: Already has multi-step flow — extend with item linking step

### Established Patterns
- NestJS module pattern: Controller + Service + Module
- Prisma schema extension with relations and @@map
- Vietnamese error messages in Zod validators
- JWT + HttpOnly cookie auth on all endpoints
- OptionalJwtAuthGuard for public read endpoints (from Phase 3.1)

### Integration Points
- **Prisma schema**: New models — Category, Series, Item, OwnedItem, WishlistItem, Checklist, ChecklistEntry, PostItem (link)
- **User model**: Add relations for owned items, wishlisted items, checklists, followed series
- **Post model**: Add PostItem relation for linking posts to collection items
- **Profile page**: Add Collection tab in profile header tabs
- **Post creation**: Extend with optional item linking step
- **Post detail**: Show linked items below caption
- **packages/shared**: Add collection-related DTOs, types, validators

</code_context>

<deferred>
## Deferred Ideas

- Community-submitted database entries with admin approval (COLL-V2-05) — v2
- Item pages with community photos, ratings, and discussion (COLL-V2-01) — v2
- Collection statistics with progress bars and completion % per series (COLL-V2-02) — v2
- Item release calendar with notifications (COLL-V2-03) — v2
- Collection sharing cards (COLL-V2-04) — v2

</deferred>

---

*Phase: 04-collection-system*
*Context gathered: 2026-03-15*
