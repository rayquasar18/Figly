# Codebase Structure

**Analysis Date:** 2026-03-20

## Directory Layout

```
Figly/                             # Monorepo root
├── backend/                       # NestJS API server
│   ├── src/
│   │   ├── app.module.ts          # Root module — registers all feature modules
│   │   ├── main.ts                # Bootstrap entry point
│   │   ├── auth/                  # Auth: JWT, OAuth, guards, strategies
│   │   ├── checklist/             # User checklists feature
│   │   ├── collection/            # Browse categories/series/items
│   │   ├── comments/              # Post comments and replies
│   │   ├── config/                # Configuration factory (configuration.ts)
│   │   ├── email/                 # Email sending via Resend
│   │   ├── feed/                  # Home feed and reels feed
│   │   ├── media/                 # Upload, processing, storage
│   │   ├── posts/                 # Post and reel CRUD, likes, bookmarks
│   │   ├── prisma/                # PrismaService singleton
│   │   ├── profiles/              # User profile read/update
│   │   └── social/                # Follow/unfollow, follower lists
│   ├── prisma/
│   │   ├── schema.prisma          # Canonical database schema
│   │   └── migrations/            # Prisma migration history
│   └── package.json
├── frontend/                      # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── layout.tsx         # Root layout (Providers wrapper)
│       │   ├── providers.tsx      # QueryClientProvider + Toaster
│       │   ├── globals.css        # Global Tailwind base styles
│       │   ├── (app)/             # Authenticated route group
│       │   │   ├── layout.tsx     # App shell: auth check + nav
│       │   │   ├── page.tsx       # Home feed page
│       │   │   ├── reels/         # Reels feed page
│       │   │   ├── saved/         # Saved posts page
│       │   │   ├── checklists/    # Checklist list + detail + new
│       │   │   └── complete-profile/
│       │   ├── (auth)/            # Unauthenticated route group
│       │   │   ├── layout.tsx
│       │   │   ├── login/
│       │   │   ├── signup/
│       │   │   ├── verify-email/
│       │   │   ├── forgot-password/
│       │   │   └── reset-password/
│       │   └── (public)/          # Public (no auth required) route group
│       │       ├── layout.tsx
│       │       ├── [username]/    # Profile pages + followers/following
│       │       ├── post/[postId]/ # Post detail
│       │       ├── item/[itemId]/ # Collection item detail
│       │       ├── collection/    # Browse categories and series
│       │       └── explore/       # Discovery / explore page
│       ├── components/
│       │   ├── auth/              # LoginForm, SignupForm, SocialLoginButtons
│       │   ├── checklist/         # Checklist display and management components
│       │   ├── collection/        # Category/series/item browse components
│       │   ├── comment/           # Comment list, input, reply components
│       │   ├── create-post/       # Multi-step post creation flow
│       │   ├── feed/              # FeedList, FeedSkeleton, EmptyFeed
│       │   ├── layout/            # BottomNav, PublicNav
│       │   ├── post/              # PostCard, PostCarousel, PostDetailModal, PostActions
│       │   ├── profile/           # Profile header, grid, edit components
│       │   ├── reel/              # ReelFeed, ReelCard, ReelActions, CreateReelFlow
│       │   ├── social/            # FollowButton, FollowersList
│       │   └── ui/                # shadcn/ui primitives (button, dialog, sheet, etc.)
│       ├── hooks/
│       │   ├── use-auth.ts        # Auth state initialization hook
│       │   ├── use-toast.ts       # Toast notification hook
│       │   └── queries/           # TanStack Query hooks per domain
│       ├── lib/
│       │   ├── api-client.ts      # Axios instance with cookie auth + refresh interceptor
│       │   ├── query-client.ts    # Shared QueryClient instance
│       │   ├── utils.ts           # Tailwind cn() utility
│       │   └── crop-image.ts      # Canvas-based image crop utility
│       └── stores/
│           ├── auth-store.ts      # Zustand: current user + loading state
│           ├── create-post-store.ts  # Zustand: multi-step post creation state
│           └── create-reel-store.ts  # Zustand: multi-step reel creation state
├── packages/
│   └── shared/                    # Shared contract package (@figly/shared)
│       └── src/
│           ├── index.ts           # Barrel: re-exports all public symbols
│           ├── schemas/            # Zod schemas: auth, post, profile, comment, checklist, reel
│           ├── types/             # TypeScript types: auth, user, post, profile, collection, etc.
│           ├── constants/         # TOKEN_EXPIRY, FILE_LIMITS, POST_LIMITS, REEL_LIMITS, etc.
│           └── validators/        # password.ts, username.ts (Zod validators + rules)
├── docker-compose.yml             # Infrastructure: postgres, redis, minio, app
├── Dockerfile                     # Single-container build (backend + frontend)
├── turbo.json                     # Turborepo task pipeline
├── pnpm-workspace.yaml            # Workspace packages declaration
└── package.json                   # Root workspace package.json
```

## Directory Purposes

**`backend/src/{module}/`:**
- Purpose: One directory per domain feature; each is a complete NestJS module
- Contains: `{module}.module.ts`, `{module}.controller.ts`, `{module}.service.ts`, `dto/`, `__tests__/`
- Key files: `backend/src/app.module.ts` (root), `backend/src/main.ts` (bootstrap)

**`backend/src/media/`:**
- Purpose: File upload, processing pipeline, and storage abstraction
- Contains: `media.controller.ts`, `media.service.ts`, `media.processor.ts` (BullMQ worker), `storage.service.ts` (MinIO/S3 client)
- Key files: `backend/src/media/storage.service.ts`, `backend/src/media/media.processor.ts`

**`backend/src/prisma/`:**
- Purpose: Database access singleton
- Contains: `prisma.service.ts` (extends PrismaClient), `prisma.module.ts`
- Key files: `backend/src/prisma/prisma.service.ts`

**`backend/prisma/`:**
- Purpose: Schema and migration files
- Contains: `schema.prisma`, `migrations/`
- Key files: `backend/prisma/schema.prisma`

**`frontend/src/app/(app)/`:**
- Purpose: Route group for pages requiring authentication
- Contains: Pages guarded by auth check in `layout.tsx`

**`frontend/src/app/(auth)/`:**
- Purpose: Route group for authentication flows (login, signup, password reset)
- Contains: Public pages that redirect away if already authenticated

**`frontend/src/app/(public)/`:**
- Purpose: Route group for publicly viewable pages (profiles, posts, collection browse)
- Contains: Pages accessible without login; optional auth via `OptionalJwtAuthGuard` on backend

**`frontend/src/components/ui/`:**
- Purpose: shadcn/ui primitive components — do not add business logic here
- Contains: Radix UI-based components (button, dialog, sheet, tabs, carousel, etc.)

**`frontend/src/hooks/queries/`:**
- Purpose: All TanStack Query data-fetching and mutation hooks
- Contains: One file per domain — `post-queries.ts`, `reel-queries.ts`, `profile-queries.ts`, etc.

**`frontend/src/stores/`:**
- Purpose: Zustand stores for client-only state
- Contains: `auth-store.ts` (user session), `create-post-store.ts`, `create-reel-store.ts`

**`packages/shared/`:**
- Purpose: Contract layer -- single source of truth for schemas, types, and constants used by both apps
- Contains: Zod schemas (schemas/), TypeScript types, constants, validators
- Generated: No (hand-authored)
- Committed: Yes (including `dist/`)

## Key File Locations

**Entry Points:**
- `backend/src/main.ts`: NestJS server bootstrap
- `frontend/src/app/layout.tsx`: Next.js root layout
- `frontend/src/app/providers.tsx`: React provider tree

**Configuration:**
- `backend/src/config/configuration.ts`: All config keys loaded from environment
- `backend/prisma/schema.prisma`: Database schema
- `turbo.json`: Build/dev/test task pipeline
- `docker-compose.yml`: Local infrastructure (postgres, redis, minio)

**Core Logic:**
- `backend/src/feed/feed.service.ts`: Authenticated and public feed queries
- `backend/src/posts/posts.service.ts`: Post/reel CRUD, like/bookmark toggles
- `backend/src/media/media.processor.ts`: Image (Sharp) and video (ffmpeg) processing pipeline
- `backend/src/media/storage.service.ts`: MinIO S3 client — upload, download, presigned URL
- `backend/src/auth/auth.service.ts`: Signup, login, token rotation, OAuth, email verification
- `frontend/src/lib/api-client.ts`: Axios instance with 401 → token refresh → retry interceptor

**Shared Package:**
- `packages/shared/src/index.ts`: Barrel file — all public exports from `@figly/shared`
- `packages/shared/src/constants/index.ts`: `TOKEN_EXPIRY`, `FILE_LIMITS`, `POST_LIMITS`, `COLLECTION_LIMITS`
- `packages/shared/src/constants/reel.constants.ts`: `REEL_LIMITS`

**Testing:**
- `backend/src/{module}/__tests__/`: Unit tests co-located per module

## Naming Conventions

**Files:**
- Backend: `kebab-case.type.ts` — e.g., `posts.service.ts`, `jwt-auth.guard.ts`, `create-post.dto.ts`
- Frontend pages: `page.tsx` (Next.js convention)
- Frontend components: `kebab-case.tsx` — e.g., `post-card.tsx`, `reel-feed.tsx`
- Frontend hooks: `use-kebab-case.ts` — e.g., `use-auth.ts`, `post-queries.ts`
- Frontend stores: `kebab-case-store.ts` — e.g., `auth-store.ts`

**Directories:**
- Backend modules: `kebab-case/` matching the domain name — e.g., `posts/`, `social/`, `checklist/`
- Frontend components: `kebab-case/` matching the domain — e.g., `components/reel/`, `components/post/`
- Next.js route groups: `(group-name)/` — `(app)`, `(auth)`, `(public)`
- Dynamic segments: `[paramName]/` — e.g., `[username]/`, `[postId]/`

**Classes and exports:**
- NestJS modules: `PascalCase` + `Module` suffix — e.g., `PostsModule`
- NestJS controllers: `PascalCase` + `Controller` suffix — e.g., `PostsController`
- NestJS services: `PascalCase` + `Service` suffix — e.g., `PostsService`
- Guards: `PascalCase` + `Guard` suffix — e.g., `JwtAuthGuard`, `EmailVerifiedGuard`
- Strategies: `PascalCase` + `Strategy` suffix — e.g., `JwtStrategy`, `GoogleStrategy`
- React components: `PascalCase` — e.g., `PostCard`, `ReelFeed`
- Zustand stores: exported as `use{Name}Store` — e.g., `useAuthStore`

## Where to Add New Code

**New Backend Feature (e.g., notifications):**
- Primary code: `backend/src/notifications/` — create `notifications.module.ts`, `notifications.controller.ts`, `notifications.service.ts`, `dto/`
- Register in: `backend/src/app.module.ts` imports array
- Shared types: `packages/shared/src/types/notifications.types.ts` + export from `packages/shared/src/index.ts`
- Tests: `backend/src/notifications/__tests__/notifications.service.spec.ts`

**New Frontend Page:**
- Authenticated page: `frontend/src/app/(app)/new-feature/page.tsx`
- Public page: `frontend/src/app/(public)/new-feature/page.tsx`
- Auth page: `frontend/src/app/(auth)/new-flow/page.tsx`

**New Frontend Component:**
- Domain component: `frontend/src/components/{domain}/component-name.tsx`
- UI primitive (shadcn): `frontend/src/components/ui/component-name.tsx`

**New API Query Hook:**
- Location: `frontend/src/hooks/queries/{domain}-queries.ts`
- Pattern: Export named functions `use{Resource}`, `use{Resource}Feed`, `useCreate{Resource}`, `useUpdate{Resource}`, `useDelete{Resource}`

**New Shared Type or Constant:**
- Type: `packages/shared/src/types/{domain}.types.ts`
- Schema: `packages/shared/src/schemas/{domain}.schema.ts`
- Constants: `packages/shared/src/constants/{domain}.constants.ts`
- Re-export from: `packages/shared/src/index.ts`

**New Zustand Store:**
- Location: `frontend/src/stores/{feature}-store.ts`
- Pattern: `export const use{Feature}Store = create<{State}>(...)` with `set` actions

## Special Directories

**`.planning/`:**
- Purpose: GSD planning documents — phases, codebase analysis, research
- Generated: No
- Committed: Yes

**`.agents/`:**
- Purpose: Agent skills and references used by GSD commands
- Generated: No
- Committed: Yes

**`backend/prisma/migrations/`:**
- Purpose: Prisma migration SQL files tracking schema evolution
- Generated: Yes (by `prisma migrate dev`)
- Committed: Yes

**`backend/dist/`:**
- Purpose: Compiled NestJS output
- Generated: Yes
- Committed: No (gitignored)

**`frontend/.next/`:**
- Purpose: Next.js build cache and output
- Generated: Yes
- Committed: No (gitignored)

**`packages/shared/dist/`:**
- Purpose: Compiled shared package consumed by frontend and backend
- Generated: Yes (by `tsc`)
- Committed: Yes (present in repo — needed for workspace resolution without extra build step)

---

*Structure analysis: 2026-03-20*
