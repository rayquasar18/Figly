# Roadmap: Figly

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4, 3.1, 10 (shipped 2026-03-20)
- 🚧 **v2.0 Architecture & Production Hardening** — Phases 11-16 (in progress)

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
- [ ] **Phase 12: Framework Upgrades** - Upgrade React 18->19, Next.js 14->16, NestJS 10->11
- [ ] **Phase 13: Backend Hardening** - Add env validation, exception filter, structured logging, health checks, Swagger, DTO unification, response serialization, Redis rate limiter
- [ ] **Phase 14: Frontend Restructure** - Reorganize to features/ pattern, add auth middleware, SSR/SEO for public routes, dark mode
- [ ] **Phase 15: DevOps & Tooling** - ESLint/Prettier/Husky, CI/CD pipeline, Docker dual-container split
- [ ] **Phase 16: Shared Package Cleanup** - Rename dto/ to schemas/, remove dist/ from git tracking

## Phase Details

### Phase 11: Bugfixes & UX Flow
**Goal**: Users can register, complete their profile, and navigate the app without broken flows or layout issues
**Depends on**: Nothing (first phase of v2.0, fixes existing breakage)
**Requirements**: BUGF-01, BUGF-02, BUGF-03, BUGF-04, BUGF-05
**Success Criteria** (what must be TRUE):
  1. User can sign up with only email and password — no name/username required at registration
  2. After signup, user is directed to a complete-profile page where they set a username, and upon completion they land on the homepage without redirect loops
  3. Explore page loads and displays content (posts/reels) without errors
  4. Desktop viewport shows an Instagram-style left sidebar with navigation links (Home, Search, Explore, Reels, Create, Profile)
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
**Plans**: TBD

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
**Plans**: TBD

### Phase 14: Frontend Restructure
**Goal**: Frontend codebase follows best-practice organization, public pages are SEO-friendly, and dark mode is functional
**Depends on**: Phase 13 (backend API must be stable before restructuring frontend that consumes it)
**Requirements**: FRNT-01, FRNT-02, FRNT-03, FRNT-04
**Success Criteria** (what must be TRUE):
  1. Frontend source follows features/ directory pattern with domain-grouped components, hooks, and stores (no flat src/components dump)
  2. Unauthenticated users hitting protected routes are redirected to login server-side (no flash of protected content)
  3. Public pages (feed, profiles, individual posts) render as Server Components with proper meta tags (title, description, og:image) visible in page source
  4. Dark mode toggles between system preference and manual selection, persisting across sessions
**Plans**: TBD

### Phase 15: DevOps & Tooling
**Goal**: Codebase has automated quality gates, CI/CD pipeline, and production-ready containerization
**Depends on**: Phase 14 (all code restructuring must be complete before linting rules and CI enforce structure)
**Requirements**: DEVP-01, DEVP-02, DEVP-03, DEVP-04
**Success Criteria** (what must be TRUE):
  1. ESLint and Prettier enforce consistent code style across frontend, backend, and shared packages with zero existing violations
  2. Git pre-commit hook automatically runs linting on staged files and blocks commits with violations
  3. GitHub Actions pipeline runs lint, type-check, build, and test on every push/PR — failing checks block merge
  4. Frontend and backend run as two separate Docker containers (figly-frontend, figly-backend) that communicate over a Docker network
**Plans**: TBD

### Phase 16: Shared Package Cleanup
**Goal**: Shared package is cleanly organized with no build artifacts in version control
**Depends on**: Phase 15 (CI/CD and linting must be in place to catch import breakage)
**Requirements**: SHRD-01, SHRD-02
**Success Criteria** (what must be TRUE):
  1. Shared package uses schemas/ directory (not dto/) with all imports across frontend and backend updated and working
  2. dist/ directory is in .gitignore and absent from the repository — shared package is consumed as TypeScript source, not pre-built artifacts
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Auth | v1.0 | 3/3 | Complete | 2026-03-13 |
| 2. Profiles & Social Graph | v1.0 | 4/4 | Complete | 2026-03-13 |
| 3. Content & Feed | v1.0 | 4/4 | Complete | 2026-03-14 |
| 3.1 Public Viewing Mode | v1.0 | 2/2 | Complete | 2026-03-14 |
| 4. Collection System | v1.0 | 6/6 | Complete | 2026-03-15 |
| 10. Reels | v1.0 | 2/2 | Complete | 2026-03-20 |
| 11. Bugfixes & UX Flow | v2.0 | 3/3 | Complete    | 2026-03-24 |
| 12. Framework Upgrades | v2.0 | 0/? | Not started | - |
| 13. Backend Hardening | v2.0 | 0/? | Not started | - |
| 14. Frontend Restructure | v2.0 | 0/? | Not started | - |
| 15. DevOps & Tooling | v2.0 | 0/? | Not started | - |
| 16. Shared Package Cleanup | v2.0 | 0/? | Not started | - |

**Full v1.0 archive:** `.planning/milestones/v1.0-ROADMAP.md`
