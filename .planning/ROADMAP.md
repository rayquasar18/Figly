# Roadmap: Figly

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4, 3.1, 10 (shipped 2026-03-20)
- 🚧 **v2.0 Architecture & Production Hardening** — Phases 11-18 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4, 3.1, 10) — SHIPPED 2026-03-20</summary>

- [x] Phase 1: Foundation & Auth (3/3 plans) — completed 2026-03-13
- [x] Phase 2: Profiles & Social Graph (4/4 plans) — completed 2026-03-13
- [x] Phase 3: Content & Feed (4/4 plans) — completed 2026-03-14
- [x] Phase 3.1: Public Viewing Mode (2/2 plans) — completed 2026-03-14
- [x] Phase 4: Collection System (6/6 plans) — completed 2026-03-15
- [x] Phase 10: Reels (2/2 plans) — completed 2026-03-20

**Known gaps deferred:** Search (5), Notifications (6), Moderation (7), DM (8), Stories (9), Docker Split (7.1)

</details>

### 🚧 v2.0 Architecture & Production Hardening

**Milestone Goal:** Upgrade frameworks, harden architecture, restructure codebase, and add production-ready infrastructure — before building new features.

- [x] **Phase 11: Bugfixes & UX Flow** - Fix broken registration flow, explore page, and desktop navigation layout (completed 2026-03-24)
- [x] **Phase 12: Framework Upgrades** - Upgrade React 18->19, Next.js 14->16, NestJS 10->11 (completed 2026-03-24)
- [x] **Phase 13: Backend Hardening** - Add env validation, exception filter, structured logging, health checks, Swagger, DTO unification, response serialization, Redis rate limiter (completed 2026-03-24)
- [x] **Phase 14: Frontend Restructure** - Reorganize to features/ pattern, add auth middleware, SSR/SEO for public routes, dark mode (completed 2026-03-25)
- [x] **Phase 15: DevOps & Tooling** - ESLint/Prettier/Husky, CI/CD pipeline, Docker dual-container split (completed 2026-03-25)
- [x] **Phase 16: Shared Package Cleanup** - Rename dto/ to schemas/, remove dist/ from git tracking (completed 2026-03-26)
- [x] **Phase 17: Backend Regression Restore** - Restore app.module.ts wiring, DTOs, and controller decorators lost in Phase 15-01 merge (gap closure) (completed 2026-03-26)
- [x] **Phase 18: Frontend Regression Restore** - Restore 17 Server Component pages, fix broken imports, remove forwardRef from UI components (gap closure) (completed 2026-03-26)

## Phase Details

### Phase 11: Bugfixes & UX Flow

**Goal**: Users can register, complete their profile, and navigate the app without broken flows or layout issues
**Depends on**: Nothing (first phase of v2.0, fixes existing breakage)
**Requirements**: BUGF-01, BUGF-02, BUGF-03, BUGF-04, BUGF-05
**Success Criteria** (what must be TRUE):

1. User can sign up with only email and password — no name/username required at registration
2. After signup, user is directed to a complete-profile page where they set a username, and upon completion they land on the homepage without redirect loops
3. Explore page loads and displays content (posts/reels) without errors
4. Desktop viewport shows an Instagram-style left sidebar with navigation links (Home, Explore, Reels, Create, Profile) and an inline search input in the header
   **Plans:** 3/3 plans complete
   Plans:

- [x] 11-01-PLAN.md — Simplify signup to email+password only (Prisma migration, shared/backend/frontend DTOs, email template)
- [x] 11-02-PLAN.md — Fix complete-profile redirect loop and explore page null-username issue
- [x] 11-03-PLAN.md — Add Instagram-style desktop sidebar navigation

### Phase 12: Framework Upgrades

**Goal**: All frameworks are on latest major versions with zero runtime regressions
**Depends on**: Phase 11 (bugfixes provide stable baseline for upgrades)
**Requirements**: FRMW-01, FRMW-02, FRMW-03
**Success Criteria** (what must be TRUE):

1. React 19 is installed and all components render without deprecation warnings or forwardRef errors
2. Next.js 16 is installed with all async API migrations complete (cookies, headers, params awaited) and pages load correctly
3. NestJS 11 is installed with all dependencies aligned and the backend starts without errors
4. All existing v1.0 features (auth, posts, feed, collections, reels) continue to work after upgrades
   **Plans:** 3/3 plans complete
   Plans:

- [x] 12-01-PLAN.md — Upgrade NestJS backend from v10 to v11 with all satellite dependencies aligned
- [x] 12-02-PLAN.md — Remove React.forwardRef from all 20 shadcn/ui components (React 19 migration)
- [x] 12-03-PLAN.md — Migrate 4 pages from useParams to async params with use() hook (Next.js 16 migration)

### Phase 13: Backend Hardening

**Goal**: Backend is production-ready with proper validation, error handling, logging, monitoring, and API documentation
**Depends on**: Phase 12 (NestJS 11 must be in place before adding new infrastructure)
**Requirements**: BACK-01, BACK-02, BACK-03, BACK-04, BACK-05, BACK-06, BACK-07, BACK-08
**Success Criteria** (what must be TRUE):

1. Application refuses to start if required environment variables (JWT secret, database URL) are missing or invalid — no silent fallbacks
2. Unhandled errors return safe JSON responses (no Prisma error details, no stack traces) with appropriate HTTP status codes
3. All log output is structured JSON (Pino) with request context, parseable by log aggregation tools
4. GET /health endpoint returns status of database, Redis, and MinIO connectivity
5. Swagger UI is accessible at /api/docs with all endpoints documented from decorators
6. All DTOs use nestjs-zod schemas (no class-validator decorators remain) and API responses exclude internal fields (passwords, internal IDs)
7. Rate limiter survives server restarts (Redis-backed) and correctly throttles excessive requests
   **Plans:** 4/4 plans complete
   Plans:

- [x] 13-01-PLAN.md — Install deps, Zod env validation, migrate 7 DTO files to nestjs-zod
- [x] 13-02-PLAN.md — Global exception filter and Pino structured logging
- [x] 13-03-PLAN.md — Health checks (Prisma/Redis/MinIO) and Redis-backed rate limiter
- [x] 13-04-PLAN.md — Swagger/OpenAPI documentation and response serialization

### Phase 14: Frontend Restructure

**Goal**: Frontend codebase follows best-practice organization, public pages are SEO-friendly, and dark mode is functional
**Depends on**: Phase 13 (backend API must be stable before restructuring frontend that consumes it)
**Requirements**: FRNT-01, FRNT-02, FRNT-03, FRNT-04
**Success Criteria** (what must be TRUE):

1. Frontend source follows features/ directory pattern with domain-grouped components, hooks, and stores (no flat src/components dump)
2. Unauthenticated users hitting protected routes are redirected to login server-side (no flash of protected content)
3. Public pages (feed, profiles, individual posts) render as Server Components with proper meta tags (title, description, og:image) visible in page source
4. Dark mode toggles between system preference and manual selection, persisting across sessions
   **Plans:** 4/4 plans complete
   Plans:

- [x] 14-01-PLAN.md — Auth proxy, server-fetch utility, dark mode setup, Tailwind config update
- [x] 14-02-PLAN.md — Directory restructure: move components/hooks/stores to features/ with barrel exports
- [ ] 14-03-PLAN.md — Convert 9 public pages to Server Components with generateMetadata for SEO
- [ ] 14-04-PLAN.md — Convert 12 authenticated + auth pages to Server Components

### Phase 15: DevOps & Tooling

**Goal**: Codebase has automated quality gates, CI/CD pipeline, and production-ready containerization
**Depends on**: Phase 14 (all code restructuring must be complete before linting rules and CI enforce structure)
**Requirements**: DEVP-01, DEVP-02, DEVP-03, DEVP-04
**Success Criteria** (what must be TRUE):

1. ESLint and Prettier enforce consistent code style across frontend, backend, and shared packages with zero existing violations
2. Git pre-commit hook automatically runs linting on staged files and blocks commits with violations
3. GitHub Actions pipeline runs lint, type-check, build, and test on every push/PR — failing checks block merge
4. Frontend and backend run as two separate Docker containers (figly-frontend, figly-backend) that communicate over a Docker network
   **Plans:** 3/3 plans complete
   Plans:

- [x] 15-01-PLAN.md — ESLint 9 + Prettier config across all workspaces, Husky + lint-staged pre-commit hook
- [ ] 15-02-PLAN.md — GitHub Actions CI/CD pipeline with parallel lint/typecheck/build/test jobs
- [x] 15-03-PLAN.md — Docker dual-container split (figly-frontend + figly-backend)

### Phase 16: Shared Package Cleanup

**Goal**: Shared package is cleanly organized with no build artifacts in version control
**Depends on**: Phase 15 (CI/CD and linting must be in place to catch import breakage)
**Requirements**: SHRD-01, SHRD-02
**Success Criteria** (what must be TRUE):

1. Shared package uses schemas/ directory (not dto/) with all imports across frontend and backend updated and working
2. dist/ directory is in .gitignore and absent from the repository — shared package is consumed as TypeScript source, not pre-built artifacts
   **Plans:** 2/2 plans complete
   Plans:

- [x] 16-01-PLAN.md — Rename dto/ to schemas/ with updated barrel imports and reel export fix
- [ ] 16-02-PLAN.md — Remove dist/ from git tracking, update gitignore and package.json entry points

### Phase 17: Backend Regression Restore

**Goal**: Backend starts correctly with all Phase 13 infrastructure wired — env validation, exception filter, logging, health checks, Zod DTOs, response serialization, Redis rate limiter
**Depends on**: Phase 16 (shared package schemas must be in place for DTO imports)
**Requirements**: BACK-01, BACK-02, BACK-03, BACK-04, BACK-06, BACK-07, BACK-08
**Gap Closure**: Restores app.module.ts, 3 DTO files, and controller decorators regressed by Phase 15-01 worktree merge
**Success Criteria** (what must be TRUE):

1. app.module.ts imports LoggerModule, registers AllExceptionsFilter, HealthModule, RedisModule, ZodValidationPipe, ThrottlerStorageRedisService, and validateEnv
2. All 7 backend DTO files use createZodDto (zero class-validator imports)
3. auth.controller.ts has @ZodSerializerDto decorators on signup/login/me endpoints
4. Backend starts without errors (`pnpm --filter @figly/backend start:dev`)
5. All existing backend tests pass (no new failures)
   **Plans:** 2/2 plans complete
   Plans:

- [x] 17-01-PLAN.md — Restore app.module.ts with full Phase 13 infrastructure wiring
- [ ] 17-02-PLAN.md — Restore 3 DTOs to createZodDto, add @ZodSerializerDto to auth controller, fix tests

### Phase 18: Frontend Regression Restore

**Goal**: Frontend builds cleanly with all pages as Server Components, correct imports, and React 19 patterns
**Depends on**: Phase 17 (backend must be functional for frontend API calls)
**Requirements**: FRMW-01, FRMW-02, FRNT-01, FRNT-03
**Gap Closure**: Restores 17 page.tsx files, fixes 6 feature component imports, removes forwardRef from 19 UI components
**Success Criteria** (what must be TRUE):

1. All 21 page.tsx files are Server Components (zero 'use client' in page.tsx files)
2. All page.tsx files have metadata or generateMetadata exports
3. All imports resolve correctly (zero TS2307 errors)
4. All 19 UI components use React 19 ref-as-prop (zero forwardRef)
5. Frontend builds without TypeScript errors (`pnpm --filter @figly/frontend build`)
   **Plans:** 4/4 plans complete
   Plans:

- [x] 18-01-PLAN.md — Fix 10 stale imports in 6 features/ files and signup mutation type
- [ ] 18-02-PLAN.md — Remove forwardRef from all 19 shadcn/ui components (React 19 ref-as-prop)
- [ ] 18-03-PLAN.md — Restore 17 page.tsx files as Server Components with metadata exports
- [ ] 18-04-PLAN.md — Full build verification and Docker rebuild

## Progress

| Phase                           | Milestone | Plans Complete | Status            | Completed  |
| ------------------------------- | --------- | -------------- | ----------------- | ---------- |
| 1. Foundation & Auth            | v1.0      | 3/3            | Complete          | 2026-03-13 |
| 2. Profiles & Social Graph      | v1.0      | 4/4            | Complete          | 2026-03-13 |
| 3. Content & Feed               | v1.0      | 4/4            | Complete          | 2026-03-14 |
| 3.1 Public Viewing Mode         | v1.0      | 2/2            | Complete          | 2026-03-14 |
| 4. Collection System            | v1.0      | 6/6            | Complete          | 2026-03-15 |
| 10. Reels                       | v1.0      | 2/2            | Complete          | 2026-03-20 |
| 11. Bugfixes & UX Flow          | v2.0      | 3/3            | Complete          | 2026-03-24 |
| 12. Framework Upgrades          | v2.0      | 3/3            | Complete          | 2026-03-24 |
| 13. Backend Hardening           | v2.0      | 4/4            | Complete          | 2026-03-24 |
| 14. Frontend Restructure        | v2.0      | 2/4            | Complete          | 2026-03-25 |
| 15. DevOps & Tooling            | v2.0      | 2/3            | Complete          | 2026-03-25 |
| 16. Shared Package Cleanup      | v2.0      | 1/2            | Complete          | 2026-03-26 |
| 17. Backend Regression Restore  | v2.0      | 1/2            | Complete          | 2026-03-26 |
| 18. Frontend Regression Restore | v2.0      | 1/4 | Complete    | 2026-03-26 |

**Full v1.0 archive:** `.planning/milestones/v1.0-ROADMAP.md`
