---
phase: 01-foundation-auth
plan: 01
subsystem: infra
tags: [turborepo, pnpm, next.js, nestjs, prisma, docker, tailwind, shadcn, zod, typescript]

# Dependency graph
requires: []
provides:
  - Turborepo monorepo with pnpm workspaces (frontend/, backend/, packages/shared/)
  - Docker Compose dev environment (PostgreSQL 16, Redis 7, MinIO)
  - Prisma schema with User, RefreshToken, VerificationToken, PasswordResetToken, Media models
  - NestJS bootstrap with CORS, cookies, validation pipe, rate limiting
  - Next.js 14 frontend with Tailwind CSS and shadcn/ui
  - Shared package with Zod auth DTOs, types, validators, constants
  - Jest test infrastructure for backend
affects: [01-02, 01-03, 02-media-pipeline, 03-social-core]

# Tech tracking
tech-stack:
  added: [turborepo, pnpm, next.js-14, nestjs-10, prisma-6, tailwindcss-3, shadcn-ui, zod, zustand, tanstack-query, docker-compose, jest, ts-jest]
  patterns: [monorepo-workspaces, source-only-shared-package, global-prisma-module, typed-config-factory, vietnamese-error-messages]

key-files:
  created:
    - package.json
    - pnpm-workspace.yaml
    - turbo.json
    - docker-compose.yml
    - .env.example
    - .gitignore
    - frontend/package.json
    - frontend/next.config.js
    - frontend/tailwind.config.ts
    - frontend/src/app/layout.tsx
    - frontend/src/app/page.tsx
    - frontend/src/lib/utils.ts
    - frontend/components.json
    - backend/package.json
    - backend/tsconfig.json
    - backend/nest-cli.json
    - backend/prisma/schema.prisma
    - backend/src/main.ts
    - backend/src/app.module.ts
    - backend/src/prisma/prisma.module.ts
    - backend/src/prisma/prisma.service.ts
    - backend/src/config/configuration.ts
    - backend/jest.config.ts
    - backend/test/setup.ts
    - packages/shared/package.json
    - packages/shared/src/index.ts
    - packages/shared/src/dto/auth.dto.ts
    - packages/shared/src/types/auth.types.ts
    - packages/shared/src/types/user.types.ts
    - packages/shared/src/validators/password.ts
    - packages/shared/src/constants/index.ts
  modified: []

key-decisions:
  - "Source-only shared package (no build step) -- TypeScript imports resolved by consuming workspace tooling"
  - "Vietnamese error messages in Zod schemas per user decision"
  - "ConfigModule loads .env from both backend/ and root directories for monorepo compatibility"
  - "Prisma backend/.env created for CLI tool compatibility (prisma validate/generate/db push)"
  - "shadcn/ui configured via components.json with CSS variables and default style"

patterns-established:
  - "Global PrismaModule pattern: @Global() module exporting PrismaService"
  - "Typed configuration factory: configuration.ts returns structured config object"
  - "cn() utility: clsx + tailwind-merge for className merging"
  - "Workspace references: @figly/shared as workspace:* dependency"
  - "Rate limiting: ThrottlerGuard as APP_GUARD with named throttle profiles"

requirements-completed: [AUTH-01, AUTH-04]

# Metrics
duration: 11min
completed: 2026-03-13
---

# Phase 1 Plan 1: Foundation Infrastructure Summary

**Turborepo monorepo with Next.js 14, NestJS 10, Prisma 6 schema (5 models), Docker Compose (PG/Redis/MinIO), shared Zod DTOs, and Jest test infrastructure**

## Performance

- **Duration:** 11 min
- **Started:** 2026-03-13T12:47:54Z
- **Completed:** 2026-03-13T12:59:09Z
- **Tasks:** 2
- **Files modified:** 41

## Accomplishments
- Complete Turborepo monorepo scaffolded with pnpm workspaces: frontend/, backend/, packages/shared/
- Docker Compose with PostgreSQL 16, Redis 7, MinIO (with auto-bucket-init)
- Prisma schema with all auth and media models: User, RefreshToken, VerificationToken, PasswordResetToken, Media + MediaStatus enum
- NestJS bootstrap with CORS, cookie parser, validation pipe, rate limiting (100/min general, 5/min login)
- Next.js 14 frontend with Tailwind CSS, shadcn/ui config, and cn() utility
- Shared package with Zod auth DTOs (Vietnamese error messages), TypeScript interfaces, password validators, and constants
- Jest configured with ts-jest and module name mapper for @figly/shared
- `pnpm turbo build` passes for all 3 workspaces

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold monorepo, Docker Compose, and shared package** - `3978af2` (feat)
2. **Task 2: Prisma schema, NestJS bootstrap, and test infrastructure** - `7c81e57` (feat)

## Files Created/Modified
- `package.json` - Root monorepo config with turbo scripts
- `pnpm-workspace.yaml` - Workspace definitions (frontend, backend, packages/*)
- `turbo.json` - Build pipeline with build/dev/test/lint/db tasks
- `docker-compose.yml` - PostgreSQL 16, Redis 7, MinIO with bucket init
- `.env.example` - All required environment variables documented
- `.gitignore` - Node.js, Next.js, Prisma, IDE ignores
- `frontend/package.json` - Next.js with TanStack Query, Zustand, shadcn deps
- `frontend/next.config.js` - transpilePackages for @figly/shared
- `frontend/tailwind.config.ts` - shadcn/ui theme with CSS variables
- `frontend/components.json` - shadcn/ui configuration
- `frontend/src/app/layout.tsx` - Root layout with Inter font
- `frontend/src/app/page.tsx` - Minimal landing page
- `frontend/src/lib/utils.ts` - cn() utility (clsx + tailwind-merge)
- `backend/package.json` - NestJS with Prisma, throttler, config deps
- `backend/prisma/schema.prisma` - User, RefreshToken, VerificationToken, PasswordResetToken, Media, MediaStatus
- `backend/src/main.ts` - NestJS bootstrap with CORS, cookies, validation, /api prefix
- `backend/src/app.module.ts` - ConfigModule, ThrottlerModule, PrismaModule
- `backend/src/prisma/prisma.service.ts` - PrismaClient with lifecycle hooks
- `backend/src/prisma/prisma.module.ts` - Global module exporting PrismaService
- `backend/src/config/configuration.ts` - Typed config for all services
- `backend/jest.config.ts` - Jest with ts-jest and @figly/shared mapping
- `backend/test/setup.ts` - Test setup with 30s timeout
- `packages/shared/src/dto/auth.dto.ts` - Zod schemas: signup, login, resetPassword, verifyEmail
- `packages/shared/src/types/auth.types.ts` - TokenPair, JwtPayload, AuthResponse
- `packages/shared/src/types/user.types.ts` - PublicUser interface
- `packages/shared/src/validators/password.ts` - Password validation with regex
- `packages/shared/src/constants/index.ts` - TOKEN_EXPIRY, FILE_LIMITS, THUMBNAIL_SIZES
- `packages/shared/src/index.ts` - Barrel exports for all shared modules

## Decisions Made
- **Source-only shared package:** No build step -- TypeScript source files imported directly by workspace tooling (Next.js transpilePackages, NestJS ts-loader). Simpler DX, no compile-watch needed.
- **Vietnamese error messages:** All Zod validation errors in Vietnamese as specified in context decisions.
- **Dual .env loading:** ConfigModule loads from both `backend/.env` and root `.env` for monorepo compatibility. Prisma CLI needs `backend/.env` for schema validation.
- **shadcn/ui CSS variables:** Default style with HSL CSS variables for consistent theming.
- **Named throttle profiles:** `short` (100/min) and `login` (5/min) as separate named throttles for flexible per-route application.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created backend/.env for Prisma CLI compatibility**
- **Found during:** Task 2 (Prisma schema validation)
- **Issue:** Prisma CLI looks for .env relative to schema directory, but project .env is at monorepo root
- **Fix:** Created backend/.env with DATABASE_URL and updated ConfigModule to load from both backend/ and root .env paths
- **Files modified:** backend/.env, backend/src/app.module.ts
- **Verification:** `prisma validate` passes successfully
- **Committed in:** 7c81e57 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary fix for Prisma CLI to work in monorepo setup. No scope creep.

## Issues Encountered
- Docker daemon not running during verification -- docker-compose.yml is correct and Prisma schema validated via `prisma validate`, but `docker compose up` and `prisma db push` could not be tested. Docker verification deferred to when user starts Docker Desktop.
- pnpm was not installed globally -- installed pnpm@9 via npm before execution.

## User Setup Required

None - no external service configuration required. Docker Desktop must be running for `docker compose up -d` and `prisma db push`.

## Next Phase Readiness
- Monorepo infrastructure ready for all subsequent plans
- Prisma schema ready for `db push` once Docker services are running
- NestJS ready for auth module implementation (Plan 01-02)
- Next.js ready for auth UI implementation (Plan 01-03)
- Shared package ready for import from both workspaces
- Jest test infrastructure ready for auth service tests

## Self-Check: PASSED

- All 35 plan files exist on disk
- Commit 3978af2 (Task 1) verified in git log
- Commit 7c81e57 (Task 2) verified in git log
- `pnpm turbo build` passes for all 3 workspaces
- `prisma validate` passes
- `jest --passWithNoTests` exits cleanly

---
*Phase: 01-foundation-auth*
*Completed: 2026-03-13*
