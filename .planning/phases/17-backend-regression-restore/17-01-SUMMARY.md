---
phase: 17-backend-regression-restore
plan: 01
subsystem: infra
tags: [nestjs, app-module, redis, pino, throttler, zod, health-check, exception-filter]

requires:
  - phase: 13-infrastructure-hardening
    provides: All Phase 13 source modules (env.schema, AllExceptionsFilter, RedisModule, HealthModule, LoggerModule)
provides:
  - Fully wired app.module.ts with all Phase 13 infrastructure providers restored
  - Env validation at startup (DATABASE_URL, JWT secrets required)
  - Global exception filter hiding Prisma internals
  - Pino structured logging
  - Health check endpoint
  - Redis-backed rate limiter
  - Zod validation pipe and serializer interceptor
affects: [17-backend-regression-restore, backend-testing, deployment]

tech-stack:
  added: [class-validator]
  patterns: [test-env-setup-with-required-vars, tsconfig-shared-path-mapping]

key-files:
  created: []
  modified:
    - backend/src/app.module.ts
    - backend/tsconfig.json
    - backend/test/setup.ts
    - backend/src/auth/auth.controller.ts
    - backend/package.json
    - .gitignore

key-decisions:
  - "Added class-validator as backend dependency -- auth DTOs use class-validator decorators (pre-existing usage, missing dep)"
  - "Added @figly/shared path mapping to tsconfig.json for TypeScript-level module resolution in tests"
  - "Set test env vars (DATABASE_URL, JWT secrets) in test/setup.ts -- ConfigModule.forRoot runs validateEnv at import time"
  - "Fixed null safety in auth.controller.ts: user.name ?? '' for sendVerificationEmail call"

patterns-established:
  - "Test env setup: Required env vars set in test/setup.ts so ConfigModule.forRoot validate passes during dynamic imports"
  - "Shared package tsconfig path: @figly/shared mapped in backend tsconfig for TypeScript compiler resolution"

requirements-completed: [BACK-01, BACK-02, BACK-03, BACK-04, BACK-08]

duration: 14min
completed: 2026-03-26
---

# Phase 17 Plan 01: AppModule Infrastructure Restore Summary

**Restored app.module.ts to full Phase 13 state with validateEnv, AllExceptionsFilter, Pino logging, HealthModule, RedisModule, ZodValidationPipe, ZodSerializerInterceptor, and Redis-backed ThrottlerModule**

## Performance

- **Duration:** 14 min
- **Started:** 2026-03-26T03:22:47Z
- **Completed:** 2026-03-26T03:37:07Z
- **Tasks:** 1
- **Files modified:** 7

## Accomplishments
- Restored all 7 Phase 13 infrastructure providers in app.module.ts (APP_FILTER, APP_INTERCEPTOR, APP_PIPE, APP_GUARD, RedisModule, HealthModule, LoggerModule)
- ConfigModule.forRoot now validates env with Zod schema -- app refuses to start without DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
- ThrottlerModule switched from static forRoot to forRootAsync with ThrottlerStorageRedisService for Redis-backed rate limiting
- All 4 throttle spec tests pass (including metadata reflection tests 3 and 4)

## Task Commits

Each task was committed atomically:

1. **Task 1: Restore app.module.ts with full Phase 13 infrastructure wiring** - `ea43bda` (feat)

## Files Created/Modified
- `backend/src/app.module.ts` - Full Phase 13 wiring restored: 8 new imports, 4 providers, 3 new module imports, forRootAsync for Throttler and Logger
- `backend/tsconfig.json` - Added @figly/shared path mapping for test module resolution
- `backend/test/setup.ts` - Added required env vars for ConfigModule.forRoot validate at import time
- `backend/src/auth/auth.controller.ts` - Fixed null safety: user.name ?? '' for sendVerificationEmail
- `backend/package.json` - Added class-validator dependency
- `pnpm-lock.yaml` - Updated lockfile for class-validator
- `.gitignore` - Added package-lock.json (project uses pnpm)

## Decisions Made
- Added class-validator as backend dependency -- auth.dto.ts uses class-validator decorators but the package was missing (pre-existing gap)
- Added @figly/shared path mapping to backend tsconfig.json for TypeScript compiler resolution during test dynamic imports
- Set test environment variables in test/setup.ts (DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET) so ConfigModule.forRoot validate passes during Jest dynamic imports
- Fixed null coalesce on user.name in auth.controller.ts signup handler

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing class-validator dependency**
- **Found during:** Task 1 (throttle test verification)
- **Issue:** backend/src/auth/dto/auth.dto.ts imports from class-validator but the package was not in backend/package.json. Dynamic import of AppModule in tests triggered transitive compilation failure.
- **Fix:** Installed class-validator via `pnpm --filter @figly/backend add class-validator`
- **Files modified:** backend/package.json, pnpm-lock.yaml
- **Verification:** Dynamic import of AppModule succeeds in tests
- **Committed in:** ea43bda (Task 1 commit)

**2. [Rule 3 - Blocking] Missing @figly/shared TypeScript path mapping**
- **Found during:** Task 1 (throttle test verification)
- **Issue:** tsconfig.json had no path mapping for @figly/shared. TypeScript compiler during ts-jest transform could not resolve `import { TOKEN_EXPIRY } from '@figly/shared'` in auth.service.ts.
- **Fix:** Added `"@figly/shared": ["../packages/shared/src"]` and `"@figly/shared/*": ["../packages/shared/src/*"]` to tsconfig paths
- **Files modified:** backend/tsconfig.json
- **Verification:** TypeScript resolves @figly/shared during test compilation
- **Committed in:** ea43bda (Task 1 commit)

**3. [Rule 3 - Blocking] Missing test environment variables**
- **Found during:** Task 1 (throttle test verification)
- **Issue:** ConfigModule.forRoot with validate: validateEnv runs at module import time. No .env file exists in test environment, causing validateEnv to throw "DATABASE_URL: Required" error.
- **Fix:** Added fallback env vars in backend/test/setup.ts (DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)
- **Files modified:** backend/test/setup.ts
- **Verification:** Throttle tests 3 and 4 pass (dynamic import of AppModule succeeds)
- **Committed in:** ea43bda (Task 1 commit)

**4. [Rule 1 - Bug] Null safety in auth.controller.ts**
- **Found during:** Task 1 (fixing TypeScript strict errors after enabling @figly/shared path mapping)
- **Issue:** `user.name` is `string | null` but `sendVerificationEmail` expects `string`. TypeScript strict mode caught this after enabling proper module resolution.
- **Fix:** Changed `user.name` to `user.name ?? ''`
- **Files modified:** backend/src/auth/auth.controller.ts
- **Verification:** No TypeScript error on line 42
- **Committed in:** ea43bda (Task 1 commit)

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All fixes were necessary for throttle tests to pass. Pre-existing issues exposed by restoring proper infrastructure wiring. No scope creep.

## Issues Encountered
- Throttle tests 3 and 4 had empty error messages in Jest output -- dynamic import failures were being swallowed. Required creating debug test files with explicit try/catch to diagnose the actual errors (class-validator missing, then @figly/shared resolution, then env validation).

## Known Stubs
None -- all wiring is production-complete.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- app.module.ts fully restored with all Phase 13 infrastructure
- Plan 17-02 can proceed with remaining backend regression fixes (Prisma schema, Docker, etc.)

## Self-Check: PASSED

---
*Phase: 17-backend-regression-restore*
*Completed: 2026-03-26*
