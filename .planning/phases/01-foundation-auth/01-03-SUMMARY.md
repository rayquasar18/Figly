---
phase: 01-foundation-auth
plan: 03
subsystem: frontend-auth, media
tags: [next.js, react, tanstack-query, zustand, axios, shadcn-ui, react-hook-form, zod, bullmq, sharp, minio, s3, multer]

# Dependency graph
requires:
  - phase: 01-foundation-auth/01
    provides: Turborepo monorepo, Next.js 14 frontend with Tailwind and shadcn/ui, shared Zod DTOs and constants
  - phase: 01-foundation-auth/02
    provides: AuthService with all auth endpoints (signup, login, refresh, verify, reset, OAuth), JWT cookie sessions, guards
provides:
  - Frontend auth UI: login, signup, email verification, forgot-password, reset-password pages
  - Axios API client with 401 interceptor and silent token refresh (queue pattern for concurrent 401s)
  - TanStack Query hooks for all auth endpoints
  - Zustand auth store for client-side user state management
  - Protected route layout with auth guard and email verification redirect
  - Social login buttons (Google, Apple) with OAuth redirect
  - Backend media pipeline: MinIO storage, BullMQ job queue, Sharp thumbnail generation
  - Media upload endpoint with validation (mimetype, 10MB size limit)
  - Async image processing: 3 WebP sizes (150px, 600px, 1080px)
  - GET /media/:id with presigned URLs for all variants
affects: [02-profiles, 03-content, 04-collections, all-media-using-features]

# Tech tracking
tech-stack:
  added: [axios, @tanstack/react-query, zustand, react-hook-form, @hookform/resolvers, sonner, @nestjs/bullmq, bullmq, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, sharp, multer]
  patterns: [api-client-with-401-interceptor, queue-pattern-concurrent-refresh, tanstack-query-auth-hooks, zustand-ui-state, route-group-auth-guard, tdd-red-green-media-pipeline]

key-files:
  created:
    - frontend/src/lib/api-client.ts
    - frontend/src/lib/query-client.ts
    - frontend/src/stores/auth-store.ts
    - frontend/src/hooks/use-auth.ts
    - frontend/src/hooks/queries/auth-queries.ts
    - frontend/src/app/providers.tsx
    - frontend/src/app/(auth)/layout.tsx
    - frontend/src/app/(auth)/login/page.tsx
    - frontend/src/app/(auth)/signup/page.tsx
    - frontend/src/app/(auth)/verify-email/page.tsx
    - frontend/src/app/(auth)/forgot-password/page.tsx
    - frontend/src/app/(auth)/reset-password/page.tsx
    - frontend/src/app/(app)/layout.tsx
    - frontend/src/app/(app)/page.tsx
    - frontend/src/components/auth/login-form.tsx
    - frontend/src/components/auth/signup-form.tsx
    - frontend/src/components/auth/social-login-buttons.tsx
    - frontend/.env.example
    - backend/src/media/storage.service.ts
    - backend/src/media/media.service.ts
    - backend/src/media/media.processor.ts
    - backend/src/media/media.controller.ts
    - backend/src/media/media.module.ts
    - backend/src/media/__tests__/media.spec.ts
  modified:
    - frontend/src/app/layout.tsx
    - backend/src/app.module.ts
    - backend/src/auth/auth.controller.ts
    - backend/src/auth/auth.service.ts
    - backend/src/auth/dto/auth.dto.ts
    - backend/src/auth/strategies/jwt.strategy.ts
    - backend/src/auth/strategies/jwt-refresh.strategy.ts

key-decisions:
  - "Removed EmailVerifiedGuard from /me endpoint so frontend can distinguish unverified from unauthenticated"
  - "/me returns full PublicUser object {user: {id, email, name, emailVerified}} instead of just {userId}"
  - "Queue pattern for concurrent 401 refresh: only one refresh request in flight, other 401s queued"
  - "Route groups (auth) and (app) for clean layout separation and auth guard per group"
  - "Vietnamese UI text throughout: 'Dang nhap', 'Dang ky', 'Quen mat khau', etc."

patterns-established:
  - "API client interceptor: 401 -> refresh -> retry original request, with concurrent request queue"
  - "TanStack Query + Zustand: queries fetch data and update Zustand store as side effect"
  - "Auth page layout: centered Card component with form, max-w-md, mobile-responsive"
  - "Protected route: (app) layout checks useMe, redirects to /login or /verify-email"
  - "Media upload pattern: validate -> store original -> create DB record -> queue processing job"
  - "Media processor pattern: download original -> Sharp resize to WebP -> upload variants -> update DB status"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06]

# Metrics
duration: 11min
completed: 2026-03-13
---

# Phase 1 Plan 3: Frontend Auth Pages + Media Pipeline Summary

**Next.js auth UI with 6 pages (login, signup, verify-email, forgot/reset-password), Axios silent refresh interceptor, and NestJS media pipeline with MinIO storage, BullMQ processing queue, and Sharp WebP thumbnail generation (150/600/1080px)**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-13T13:27:22Z
- **Completed:** 2026-03-13T13:39:07Z
- **Tasks:** 2 auto tasks completed + 1 checkpoint (human-verify pending)
- **Files modified:** 44

## Accomplishments
- Complete frontend auth flow: login, signup, email verification, password reset, forgot-password pages with Vietnamese text
- API client with 401 interceptor using queue pattern for concurrent silent refresh (only one refresh request in flight)
- TanStack Query hooks for all 7 auth endpoints + Zustand auth store
- Social login buttons (Google, Apple) with OAuth redirect to backend
- Protected app layout with auth guard and email verification redirect
- Backend media pipeline: StorageService (MinIO/S3), MediaService (upload + validation), MediaProcessor (Sharp thumbnails)
- 12 new media tests + 30 existing auth tests = 42 total tests passing
- `pnpm turbo build` passes for all 3 workspaces

## Task Commits

Each task was committed atomically:

1. **Task 1: Frontend auth infrastructure and all auth pages** - `e28cca9` (feat)
2. **Task 2: Backend media pipeline (TDD)**
   - `2811123` (test) - TDD RED: failing tests for media pipeline
   - `03a5990` (feat) - TDD GREEN: implement media pipeline with MinIO, BullMQ, Sharp

## Files Created/Modified
- `frontend/src/lib/api-client.ts` - Axios client with 401 interceptor and queue-based silent refresh
- `frontend/src/lib/query-client.ts` - TanStack Query client with 5-minute stale time
- `frontend/src/stores/auth-store.ts` - Zustand store for auth UI state (user, isLoading)
- `frontend/src/hooks/use-auth.ts` - Convenience hook wrapping Zustand store + auth actions
- `frontend/src/hooks/queries/auth-queries.ts` - TanStack Query hooks for all auth endpoints
- `frontend/src/app/providers.tsx` - QueryClientProvider + Sonner Toaster wrapper
- `frontend/src/app/layout.tsx` - Updated to wrap with Providers
- `frontend/src/app/(auth)/layout.tsx` - Auth route group: centered, redirect if authenticated
- `frontend/src/app/(auth)/login/page.tsx` - Login form + social buttons + "hoac" divider
- `frontend/src/app/(auth)/signup/page.tsx` - Signup form with name/email/password
- `frontend/src/app/(auth)/verify-email/page.tsx` - Token verification or "check email" message
- `frontend/src/app/(auth)/forgot-password/page.tsx` - Email form with confirmation message
- `frontend/src/app/(auth)/reset-password/page.tsx` - New password + confirm with token from URL
- `frontend/src/app/(app)/layout.tsx` - Protected: redirects to /login or /verify-email
- `frontend/src/app/(app)/page.tsx` - Dashboard: "Chao mung, {name}!" with logout
- `frontend/src/components/auth/login-form.tsx` - react-hook-form + zod + loginSchema
- `frontend/src/components/auth/signup-form.tsx` - react-hook-form + zod + signupSchema
- `frontend/src/components/auth/social-login-buttons.tsx` - Google/Apple OAuth redirect buttons
- `frontend/.env.example` - NEXT_PUBLIC_API_URL
- `backend/src/media/storage.service.ts` - S3Client for MinIO with upload, download, presigned URLs
- `backend/src/media/media.service.ts` - Upload validation, DB record creation, job queuing
- `backend/src/media/media.processor.ts` - Sharp resize to 3 WebP sizes, status update
- `backend/src/media/media.controller.ts` - POST /media/upload, GET /media/:id, GET /media/:id/status
- `backend/src/media/media.module.ts` - BullMQ queue registration, service providers
- `backend/src/media/__tests__/media.spec.ts` - 12 tests: upload validation, processing, presigned URLs
- `backend/src/app.module.ts` - Added BullModule.forRootAsync and MediaModule
- `backend/src/auth/auth.controller.ts` - Fixed /me to return full user object
- `backend/src/auth/auth.service.ts` - Added getMe method returning PublicUser
- `backend/src/auth/dto/auth.dto.ts` - Fixed definite assignment assertions
- `backend/src/auth/strategies/jwt.strategy.ts` - Fixed secretOrKey type safety
- `backend/src/auth/strategies/jwt-refresh.strategy.ts` - Fixed StrategyOptionsWithRequest type

## Decisions Made
- **Removed EmailVerifiedGuard from /me:** The frontend needs /me to determine if a user is "not logged in" vs "logged in but not verified". With the guard, both cases returned 401/403, making them indistinguishable.
- **/me returns full PublicUser:** Changed from `{userId}` to `{user: {id, email, name, emailVerified}}` so the frontend can display user info and check verification status.
- **Queue pattern for 401 handling:** When multiple requests get 401 simultaneously, only one refresh request is made. Other requests wait in a queue and retry after refresh completes.
- **Vietnamese text throughout:** All UI labels, error messages, and status text in Vietnamese per project requirements.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed /me endpoint to return full user object**
- **Found during:** Task 1 (Frontend auth hooks)
- **Issue:** GET /auth/me only returned `{userId}` but frontend needs `{user: PublicUser}` for display
- **Fix:** Added `getMe(userId)` method to AuthService, updated controller to call it
- **Files modified:** backend/src/auth/auth.controller.ts, backend/src/auth/auth.service.ts
- **Verification:** Frontend useMe query receives complete user data
- **Committed in:** e28cca9 (Task 1 commit)

**2. [Rule 1 - Bug] Removed EmailVerifiedGuard from /me endpoint**
- **Found during:** Task 1 (Frontend auth flow)
- **Issue:** With guard on /me, unverified users get 403, but frontend can't distinguish from "not authenticated"
- **Fix:** Removed EmailVerifiedGuard from /me, frontend checks user.emailVerified client-side
- **Files modified:** backend/src/auth/auth.controller.ts
- **Verification:** Unverified users correctly redirected to /verify-email page
- **Committed in:** e28cca9 (Task 1 commit)

**3. [Rule 3 - Blocking] Fixed pre-existing backend TypeScript build errors**
- **Found during:** Task 1 (Build verification)
- **Issue:** DTO classes missing definite assignment assertions, JWT strategies had undefined secretOrKey type mismatch
- **Fix:** Added `!` assertions to DTO properties, added fallback defaults to secretOrKey, used StrategyOptionsWithRequest type
- **Files modified:** backend/src/auth/dto/auth.dto.ts, backend/src/auth/strategies/jwt.strategy.ts, backend/src/auth/strategies/jwt-refresh.strategy.ts
- **Verification:** `pnpm turbo build` passes for all 3 workspaces, all 42 tests pass
- **Committed in:** e28cca9 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All fixes necessary for correct frontend-backend integration and build success. No scope creep.

## Issues Encountered
- Pre-existing TypeScript strict mode errors in backend auth module prevented `pnpm turbo build` from passing. Fixed as part of Task 1 (deviation #3).

## User Setup Required

**Docker services must be running for full functionality:**
1. `docker compose up -d` (PostgreSQL, Redis, MinIO)
2. `cd backend && npx prisma db push` (creates tables)
3. `pnpm turbo dev` (starts frontend and backend)

**External services (from Plan 01-02):**
- Resend API key for email sending
- Google OAuth credentials for Google login
- Apple Sign-In credentials for Apple login

## Next Phase Readiness
- Complete auth frontend ready for user testing (checkpoint Task 3 pending)
- Media pipeline ready for avatar uploads in Phase 2 (Profiles)
- All guards and services exported for use by any future module
- 42 tests provide regression safety for all auth and media code
- Phase 1 functionally complete pending human verification checkpoint

## Self-Check: PASSED

- All 23 plan files exist on disk
- Commit e28cca9 (Task 1) verified in git log
- Commit 2811123 (Task 2 RED) verified in git log
- Commit 03a5990 (Task 2 GREEN) verified in git log
- All 42 tests pass (`pnpm test -- --bail`)
- `pnpm turbo build` passes for all 3 workspaces
- Frontend compiles all 7 routes: /, /login, /signup, /verify-email, /forgot-password, /reset-password, /_not-found

---
*Phase: 01-foundation-auth*
*Completed: 2026-03-13 (pending checkpoint)*
