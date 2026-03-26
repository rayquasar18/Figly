---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Architecture & Production Hardening
status: Milestone complete
stopped_at: Completed 16-02-PLAN.md
last_updated: "2026-03-26T00:02:42.876Z"
progress:
  total_phases: 6
  completed_phases: 6
  total_plans: 19
  completed_plans: 19
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)

**Core value:** Collectors can share, showcase, and manage their collections in a community of shared passion -- combining social media with collection tracking.
**Current focus:** Phase 16 -- shared-package-cleanup

## Current Position

Phase: 16
Plan: Not started

## Performance Metrics

**Velocity (from v1.0):**

- Total plans completed: 21
- v1.0 timeline: 8 days (2026-03-13 to 2026-03-20)

_v2.0 metrics will populate after first plan completes_

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [v2.0]: Architecture audit revealed 15+ production gaps; fix before adding features
- [v2.0]: Phase order: Bugfixes -> Framework upgrades -> Backend -> Frontend -> DevOps -> Shared cleanup
- [v2.0]: Unify DTO validation with nestjs-zod (remove class-validator duplication)
- [Phase 11]: Sidebar width 220px fixed, matching Instagram desktop pattern
- [Phase 11-02]: PostAuthor.username typed as string | null; null-username users filtered at backend query level
- [Phase 11-02]: Auth cache invalidated after profile mutation to prevent redirect loop
- [Phase 11]: Manual Prisma migration for nullable name (shadow DB baseline broken)
- [Phase 11]: Null-safe name pattern: user.name || 'ban' before email services
- [Phase 12-01]: NestJS 11 upgrade requires no code changes -- existing patterns (cookie-parser import, config factory, Express types) are fully compatible
- [Phase 12-03]: All 8 dynamic route pages now use async params pattern with use() hook -- useParams fully eliminated
- [Phase 12]: React 19 ref-as-prop pattern: function Component({ ref, ...props }) replaces const Component = React.forwardRef((props, ref) => ...)
- [Phase 13]: Zod ^3.25.0 bump for nestjs-zod peer compatibility; createZodDto wrapper pattern for all backend DTOs
- [Phase 13]: ZodValidationPipe via APP_PIPE in AppModule providers; env validation via ConfigModule validate option
- [Phase 13]: Logger.error called only for 500+ errors; 4xx are not logged to reduce noise
- [Phase 13]: Pino uses pino-pretty in development and raw JSON in production for log aggregation readiness
- [Phase 13]: Global exception filter: P2002->409, P2025->404, unknown->500 with safe messages (no Prisma details)
- [Phase 13]: RedisService extends ioredis directly for full API surface; @Global RedisModule shares singleton instance
- [Phase 13]: ThrottlerModule.forRootAsync injects shared RedisService for Redis-backed rate limiting
- [Phase 13]: E2e tests override ThrottlerGuard to prevent rate limit accumulation across test runs
- [Phase 13]: Swagger path 'api/docs' is absolute from app root, not doubled by setGlobalPrefix
- [Phase 13]: ZodSerializerInterceptor registered globally; @ZodSerializerDto per-endpoint for explicit control
- [Phase 14]: Next.js 16 proxy.ts convention used instead of deprecated middleware.ts
- [Phase 14]: ThemeProvider wraps QueryClientProvider as outermost provider
- [Phase 14]: Theme toggle placed inside user avatar DropdownMenu per D-21
- [Phase 14]: 9 feature barrels created (reel deferred to phase-10 merge), feature-internal relative imports, cross-feature barrel imports
- [Phase 14]: toAbsoluteUrl helper defined per-page for og:image absolute URL resolution
- [Phase 14]: Server Component page pattern: async page.tsx with generateMetadata delegates to \*-client.tsx
- [Phase 14]: Suspense boundary for useSearchParams: verify-email and reset-password pages wrap client component in Suspense
- [Phase 14]: fetchApi pre-fetch without initialData prop: pages call fetchApi for cache warming, React Query hooks refetch on mount
- [Phase 15]: ESLint 9 flat config with eslint-config-next@15.5 for ESLint 9 compatibility
- [Phase 15]: Type-check excluded from pre-commit hook (too slow), deferred to CI only
- [Phase 15]: Full monorepo node_modules in backend Docker runner for pnpm hoisting compatibility
- [Phase 15]: NEXT*PUBLIC* vars as Docker build args (not runtime env) because Next.js inlines them at build time
- [Phase 15]: 4 parallel CI jobs (lint, typecheck, build, test) for fastest feedback with concurrency cancel-in-progress
- [Phase 16]: Removed stale dist/dto/ alongside source rename to keep dist consistent
- [Phase 16]: Kept backend dto/ references in STRUCTURE.md since those are NestJS-internal DTOs, not shared package
- [Phase 16]: D-08 deferred: main field kept as ./dist/index.js because NestJS tsc produces external require calls resolved at Node.js runtime

### Pending Todos

None yet.

### Roadmap Evolution

- v1.0 phases 5-9 deferred to v2.1+
- v2.0 focused entirely on architecture & production hardening (Phases 11-16)

### Blockers/Concerns

- Next.js async API changes (cookies/headers/params must be awaited) — Phase 12
- Directory restructure (~100+ files, high blast radius) — Phase 14
- forwardRef removal in React 19 may affect UI components — Phase 12

## Session Continuity

Last session: 2026-03-25T23:49:45Z
Stopped at: Completed 16-02-PLAN.md
Resume file: None
