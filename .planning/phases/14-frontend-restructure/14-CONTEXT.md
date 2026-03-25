# Phase 14: Frontend Restructure - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Reorganize frontend codebase to features/ directory pattern, add Next.js middleware for server-side auth redirects, convert all pages to Server Components with SSR data fetching and full SEO meta tags, and configure dark mode with next-themes.

</domain>

<decisions>
## Implementation Decisions

### Directory Restructure (FRNT-01)
- **D-01:** Create `features/` directory with full domain isolation — each feature folder contains its own components/, hooks/, stores/, and types/
- **D-02:** Feature folders: `features/auth/`, `features/post/`, `features/feed/`, `features/reel/`, `features/profile/`, `features/social/`, `features/collection/`, `features/checklist/`, `features/comment/`, `features/create-post/`
- **D-03:** Keep `components/ui/` at current location — shadcn/ui primitives are shared, not domain-specific
- **D-04:** Keep `components/layout/` at current location — sidebar, bottom-nav, header-search, public-nav are shared layout components
- **D-05:** Keep `lib/` at current location — api-client, query-client, utils are shared utilities
- **D-06:** Each feature folder has an `index.ts` barrel file re-exporting public API (e.g., `import { PostCard } from '@/features/post'`)
- **D-07:** Move domain-specific hooks from `hooks/queries/` into their feature folder (e.g., `post-queries.ts` → `features/post/hooks/`)
- **D-08:** Move domain-specific stores from `stores/` into their feature folder (e.g., `create-post-store.ts` → `features/create-post/stores/`)

### Auth Middleware (FRNT-02)
- **D-09:** Enterprise-standard auth middleware flow: check cookie existence → decode JWT to verify expiry → check refreshToken if expired → redirect to /login if no valid tokens
- **D-10:** Route protection strategy: blacklist — explicitly list protected routes (/, /reels, /saved, /checklists, /complete-profile). New routes must be added to protected list manually
- **D-11:** Keep client-side auth checks in layout.tsx as defense-in-depth fallback — middleware is the primary gate, useEffect checks handle edge cases like mid-session token expiry
- **D-12:** Middleware does NOT call backend API — purely cookie + JWT decode for speed

### SSR & SEO (FRNT-03)
- **D-13:** All pages converted to Server Components at page level — enterprise best practice. Interactive parts extracted as client components
- **D-14:** Pattern: `page.tsx` (Server Component, fetches initial data) → passes props to `*-client.tsx` ('use client' for interactivity)
- **D-15:** Server Components call backend API directly (fetch) for initial data. Client components continue using React Query for mutations and real-time updates
- **D-16:** `generateMetadata()` on all public pages with full Open Graph + Twitter Card meta tags: title, description, og:title, og:description, og:image, twitter:card
- **D-17:** Profile pages: og:image = user avatar. Post pages: og:image = first image. Collection pages: og:image = item/series image
- **D-18:** Authenticated pages also become Server Components — server fetch initial data, hydrate client components with React Query

### Dark Mode (FRNT-04)
- **D-19:** Use `next-themes` library for ThemeProvider (already in dependencies, supports no-flash)
- **D-20:** Three options: Light / Dark / System. Default follows system preference
- **D-21:** Toggle placed in user avatar dropdown menu
- **D-22:** Persist choice in localStorage across sessions (next-themes handles this automatically)
- **D-23:** Tailwind already configured with `darkMode: ['class']` — shadcn/ui CSS variables will work with dark theme values

### Claude's Discretion
- Exact feature folder internal structure (components/, hooks/, stores/ subdirs vs flat)
- Server-side fetch utility/helper design for calling backend from Server Components
- Dark theme CSS variable values for shadcn/ui (appropriate dark palette)
- Loading/skeleton patterns for Server Component → Client Component hydration
- Exact middleware matcher pattern syntax
- How to handle `auth-store.ts` (Zustand) — may need to remain global since it's used across features

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — FRNT-01 through FRNT-04 define the scope

### Existing Code
- `frontend/src/app/(app)/layout.tsx` — Current client-side auth check pattern (useEffect + useMe)
- `frontend/src/app/(public)/layout.tsx` — Current public layout with optional auth
- `frontend/src/app/providers.tsx` — Current provider tree (QueryClientProvider only, needs ThemeProvider)
- `frontend/src/components/layout/sidebar.tsx` — Desktop sidebar (220px fixed)
- `frontend/src/components/layout/bottom-nav.tsx` — Mobile bottom nav
- `frontend/tailwind.config.ts` — Already has `darkMode: ['class']`
- `frontend/src/app/globals.css` — CSS variables for shadcn/ui theming

### Codebase Maps
- `.planning/codebase/STRUCTURE.md` — Current directory layout and conventions
- `.planning/codebase/CONVENTIONS.md` — Naming patterns, import organization

### Prior Context
- `.planning/phases/11-bugfixes-ux-flow/11-CONTEXT.md` — Sidebar 220px, route groups, username gate decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/` — 20+ shadcn/ui components already using CSS variables (dark mode ready)
- `components/layout/` — Sidebar, BottomNav, HeaderSearch, PublicNav
- `hooks/queries/` — TanStack Query hooks per domain (will be split into features/)
- `stores/` — Zustand stores (auth-store, create-post-store, create-reel-store)
- `lib/api-client.ts` — Axios instance with cookie auth + refresh interceptor
- `lib/query-client.ts` — Shared QueryClient instance

### Established Patterns
- Route groups: `(app)`, `(auth)`, `(public)` — well-established, keep this pattern
- TanStack Query for all data fetching — will add server-side initial fetch alongside
- Zustand for client state — auth-store is cross-feature, may stay global
- shadcn/ui + Tailwind CSS variables — dark mode foundation already in place
- `@/` path alias maps to `src/` — will need `@/features/` imports

### Integration Points
- All 19 page files need conversion from 'use client' to Server Components
- `providers.tsx` needs ThemeProvider wrapper (next-themes)
- `middleware.ts` is a new file at `frontend/src/middleware.ts`
- Feature barrel files need path alias support (`@/features/*`)
- Server Components need a fetch utility to call backend API (replacing client-side React Query for initial loads)

</code_context>

<specifics>
## Specific Ideas

- Enterprise best practices throughout — this is a production codebase upgrade
- All pages as Server Components (not just public) — full Next.js App Router best practice
- Defense-in-depth auth: middleware (primary) + client-side checks (fallback)
- Dark mode toggle in user avatar dropdown menu, not sidebar

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 14-frontend-restructure*
*Context gathered: 2026-03-25*
