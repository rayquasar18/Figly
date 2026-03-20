# Architecture

**Analysis Date:** 2026-03-20

## Pattern Overview

**Overall:** Monorepo with separated frontend/backend services and a shared package

**Key Characteristics:**
- NestJS backend uses a feature-module architecture — each domain (posts, profiles, auth, etc.) is a self-contained module with its own controller, service, and DTOs
- Next.js 14 frontend uses App Router with route groups for access control (`(app)`, `(auth)`, `(public)`)
- `packages/shared` acts as a contract layer — DTOs, type definitions, constants, and validators are imported by both frontend and backend via the `@figly/shared` alias
- All API communication uses cookie-based JWT (access token in `access_token` cookie, refresh token in `refresh_token` cookie)
- Media processing is async: uploads go to MinIO immediately, then a BullMQ job processes variants via Sharp (images) or ffmpeg (videos)

## Layers

**Presentation Layer (Frontend):**
- Purpose: Renders UI, manages client state, calls backend API
- Location: `frontend/src/`
- Contains: Next.js pages, React components, TanStack Query hooks, Zustand stores
- Depends on: `@figly/shared` types, `@/lib/api-client`
- Used by: End users via browser

**API Layer (Backend Controllers):**
- Purpose: Receives HTTP requests, validates input via DTOs, delegates to services
- Location: `backend/src/{module}/{module}.controller.ts`
- Contains: NestJS controllers, route guards, decorator-based validation
- Depends on: Services, auth guards
- Used by: Frontend via `NEXT_PUBLIC_API_URL`

**Business Logic Layer (Backend Services):**
- Purpose: Implements domain logic, orchestrates database queries, resolves presigned URLs
- Location: `backend/src/{module}/{module}.service.ts`
- Contains: Injectable services with PrismaService + StorageService injections
- Depends on: `PrismaService`, `StorageService`, `@figly/shared` constants
- Used by: Controllers

**Data Access Layer:**
- Purpose: PostgreSQL access via Prisma ORM
- Location: `backend/src/prisma/prisma.service.ts`, `backend/prisma/schema.prisma`
- Contains: `PrismaService` (extends `PrismaClient`), schema definitions, migrations
- Depends on: PostgreSQL (DATABASE_URL)
- Used by: All backend services

**Storage Layer:**
- Purpose: Binary file storage and presigned URL generation
- Location: `backend/src/media/storage.service.ts`
- Contains: S3-compatible client (AWS SDK v3) pointed at MinIO
- Depends on: MinIO (MINIO_ENDPOINT, MINIO_PORT)
- Used by: `MediaService`, `PostsService`, `FeedService`, `ProfilesService`

**Queue Layer:**
- Purpose: Async media processing (image resizing, video transcoding)
- Location: `backend/src/media/media.processor.ts`, `backend/src/media/media.module.ts`
- Contains: BullMQ processor using Sharp for images, fluent-ffmpeg for videos
- Depends on: Redis (REDIS_URL), `StorageService`, `PrismaService`
- Used by: `MediaService` (enqueues jobs)

**Shared Contract Layer:**
- Purpose: Type-safe DTOs, response types, constants shared between frontend and backend
- Location: `packages/shared/src/`
- Contains: Zod schemas (DTOs), TypeScript types, constants, validators
- Depends on: Nothing (pure TypeScript/Zod)
- Used by: Both `frontend` and `backend` via `@figly/shared`

## Data Flow

**Upload and Post Creation:**

1. Frontend uploads file to `POST /api/media/upload` via multipart form
2. `MediaController` receives file via Multer, calls `MediaService.upload()`
3. `MediaService` writes original to MinIO, creates `Media` record with `status: PROCESSING`, enqueues a BullMQ job
4. `MediaProcessor` processes the job: downloads original from MinIO, generates variants (thumbnail/medium/large via Sharp or ffmpeg), uploads variants to MinIO, updates `Media` record to `status: COMPLETED`
5. Frontend polls `GET /api/media/:id/status` until `COMPLETED`
6. Frontend calls `POST /api/posts` or `POST /api/posts/reel` with `mediaIds` array
7. `PostsService` validates all mediaIds are `COMPLETED`, creates `Post` + `PostMedia` + `PostHashtag` records in a Prisma transaction

**Feed Request:**

1. Frontend calls `GET /api/feed` (authenticated) or `GET /api/feed/public` (unauthenticated) via `useFeed()` / `usePublicFeed()` TanStack Query hook
2. `FeedController` invokes `FeedService.getFeed()` with userId from JWT payload
3. `FeedService` queries Prisma for posts from followed users + own posts with cursor-based pagination
4. Service batches like/bookmark status check via `Promise.all()`
5. Service calls `StorageService.getPresignedUrl()` for all media keys in a single batched pass
6. Returns `{ items, nextCursor, hasMore }` shape
7. Frontend renders with infinite scroll via `useInfiniteQuery`

**Auth Flow:**

1. User submits login form → `POST /api/auth/login` with `LocalStrategy` (username/password via Passport)
2. `AuthService` validates credentials, generates JWT access token (15m) and refresh token (30d)
3. Tokens set as `HttpOnly` cookies: `access_token` and `refresh_token`
4. `JwtStrategy` extracts token from `req.cookies.access_token` on every protected request
5. On 401 response, `api-client.ts` interceptor silently calls `POST /api/auth/refresh` to rotate tokens
6. Failed refresh redirects to `/login`

**State Management:**

- Auth user object lives in Zustand (`useAuthStore` at `frontend/src/stores/auth-store.ts`) — populated once on app load via `useAuth` hook
- All server data (posts, profiles, feeds) is managed by TanStack Query with cache keys like `['feed']`, `['post', postId]`, `['userPosts', username]`
- Mutations call `queryClient.invalidateQueries()` on success to trigger refetches
- Multi-step creation flows (post, reel) use dedicated Zustand stores: `create-post-store.ts`, `create-reel-store.ts`

## Key Abstractions

**NestJS Feature Module:**
- Purpose: Self-contained vertical slice of a domain feature
- Examples: `backend/src/posts/`, `backend/src/social/`, `backend/src/collection/`
- Pattern: Each module contains `{name}.module.ts`, `{name}.controller.ts`, `{name}.service.ts`, `dto/`, optional `__tests__/`

**TanStack Query Hook:**
- Purpose: Encapsulates API calls, caching, pagination, and mutation logic
- Examples: `frontend/src/hooks/queries/post-queries.ts`, `frontend/src/hooks/queries/reel-queries.ts`
- Pattern: Exported functions returning `useQuery`, `useInfiniteQuery`, or `useMutation` — named `use{Resource}`, `use{Resource}Feed`, `useCreate{Resource}`

**Shared DTO/Type:**
- Purpose: Single source of truth for request/response shapes validated on both ends
- Examples: `packages/shared/src/dto/post.dto.ts`, `packages/shared/src/types/post.types.ts`
- Pattern: Zod schema exported for runtime validation, TypeScript `type` inferred from schema and exported separately

**Presigned URL Resolution:**
- Purpose: Generate time-limited S3 presigned URLs for all media keys in a response batch
- Examples: `resolvePresignedUrls()` private method in `PostsService`, `FeedService`, `ProfilesService`
- Pattern: Collect all storage keys → deduplicate → `Promise.all(getPresignedUrl)` → `Map<key, url>` passed to `mapPostResponse()`

## Entry Points

**Backend HTTP Server:**
- Location: `backend/src/main.ts`
- Triggers: Process start via `pnpm dev` or Docker container
- Responsibilities: Creates NestJS app, sets global prefix `/api`, enables CORS for `FRONTEND_URL`, mounts cookie parser, applies global `ValidationPipe`

**Frontend App Root:**
- Location: `frontend/src/app/layout.tsx`
- Triggers: Next.js app render
- Responsibilities: Wraps all pages in `<Providers>` (QueryClientProvider + Toaster), sets HTML lang to `vi`

**Frontend Providers:**
- Location: `frontend/src/app/providers.tsx`
- Triggers: Rendered by root layout
- Responsibilities: Mounts TanStack Query context with shared `queryClient`, mounts global toast system

**AppModule:**
- Location: `backend/src/app.module.ts`
- Triggers: NestFactory bootstraps this
- Responsibilities: Registers all feature modules, configures global ThrottlerGuard (100 req/min short, 5 req/min for login), initializes BullMQ with Redis connection

## Error Handling

**Strategy:** HTTP exception-first on backend; interceptor-driven retry with redirect on frontend

**Patterns:**
- Backend throws NestJS HTTP exceptions (`NotFoundException`, `ForbiddenException`, `BadRequestException`, `ConflictException`) directly from service methods — NestJS converts these to appropriate HTTP responses
- Prisma unique constraint violations (code `P2002`) and not-found errors (code `P2025`) are caught inline in service methods and converted to HTTP exceptions or silently ignored for idempotent operations (like/unlike)
- Frontend `api-client.ts` interceptor catches 401 responses, silently refreshes tokens via queue pattern, replays original request — only redirects to `/login` on refresh failure

## Cross-Cutting Concerns

**Rate Limiting:** Global `ThrottlerGuard` applied via `APP_GUARD` in `AppModule` — short tier: 100 req/60s, login tier: 5 req/60s — configured in `backend/src/app.module.ts`

**Validation:** `ValidationPipe` global on backend (`whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`) validates all DTOs. Frontend uses Zod schemas from `@figly/shared` for form validation.

**Authentication:** `JwtAuthGuard` used on protected routes; `OptionalJwtAuthGuard` on public-but-viewer-aware routes (feed, post detail); `EmailVerifiedGuard` stacked on write operations

**Logging:** NestJS built-in `Logger` used in `StorageService` and `MediaProcessor`; no structured logging framework

---

*Architecture analysis: 2026-03-20*
