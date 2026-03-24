---
phase: 13-backend-hardening
plan: 01
subsystem: api
tags: [nestjs-zod, zod, validation, dto, env-validation, nestjs]

# Dependency graph
requires:
  - phase: 12-framework-upgrades
    provides: NestJS 11 compatible backend
provides:
  - Zod-based environment validation at startup (validateEnv, Env type)
  - 7 DTO files migrated to nestjs-zod createZodDto
  - ZodValidationPipe as global validation pipe
  - Phase 13 npm dependencies installed (nestjs-zod, @nestjs/swagger, nestjs-pino, pino, @nestjs/terminus, ioredis, throttler-storage-redis)
affects: [13-02, 13-03, 13-04]

# Tech tracking
tech-stack:
  added: [nestjs-zod@5.2.1, "@nestjs/swagger@11.2.6", nestjs-pino@4.6.1, pino@10.3.1, pino-http@11.0.0, "@nestjs/terminus@11.1.1", ioredis@5.10.1, "@nest-lab/throttler-storage-redis@1.2.0", pino-pretty@13.1.3]
  patterns: [createZodDto-wrapper-pattern, env-schema-validation, fail-fast-startup]

key-files:
  created:
    - backend/src/config/env.schema.ts
    - backend/src/config/__tests__/env.schema.spec.ts
  modified:
    - backend/src/config/configuration.ts
    - backend/src/app.module.ts
    - backend/src/main.ts
    - backend/src/auth/dto/auth.dto.ts
    - backend/src/posts/dto/create-post.dto.ts
    - backend/src/posts/dto/create-reel.dto.ts
    - backend/src/posts/dto/update-post.dto.ts
    - backend/src/comments/dto/create-comment.dto.ts
    - backend/src/profiles/dto/update-profile.dto.ts
    - backend/src/checklist/dto/checklist.dto.ts
    - backend/test/auth-e2e.spec.ts
    - backend/package.json
    - packages/shared/package.json

key-decisions:
  - "Zod ^3.25.0 bump in both backend and shared packages for nestjs-zod peer compatibility"
  - "createReelSchema.extend() used for backend-specific fields (duration, width, height) rather than new schema"
  - "ZodValidationPipe registered via APP_PIPE in AppModule providers (not in main.ts)"

patterns-established:
  - "createZodDto pattern: backend DTOs are thin wrappers around @figly/shared Zod schemas"
  - "Env validation pattern: env.schema.ts with validateEnv() wired into ConfigModule.forRoot validate option"
  - "No fallback defaults for secrets: JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, DATABASE_URL are required"

requirements-completed: [BACK-01, BACK-06]

# Metrics
duration: 7min
completed: 2026-03-25
---

# Phase 13 Plan 01: Dependencies, Env Validation & DTO Unification Summary

**Zod env validation with fail-fast startup, all 7 backend DTOs migrated from class-validator to nestjs-zod createZodDto wrapping @figly/shared schemas**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-24T21:50:05Z
- **Completed:** 2026-03-24T21:56:55Z
- **Tasks:** 3
- **Files modified:** 16

## Accomplishments
- Installed all Phase 13 npm dependencies (nestjs-zod, @nestjs/swagger, nestjs-pino, pino, pino-http, @nestjs/terminus, ioredis, throttler-storage-redis)
- Created Zod env validation schema that rejects missing JWT secrets and DATABASE_URL at startup (no more silent dev-secret fallbacks)
- Migrated all 7 backend DTO files (14 classes) from class-validator to nestjs-zod createZodDto
- Removed class-validator and class-transformer packages entirely
- Wired ZodValidationPipe as global pipe via AppModule, removed old ValidationPipe from main.ts
- All 231 tests pass across 20 test suites

## Task Commits

Each task was committed atomically:

1. **Task 1 (TDD RED): Env schema failing tests** - `e04328a` (test)
2. **Task 1 (TDD GREEN): Deps + env schema + configuration** - `b875b97` (feat)
3. **Task 2: Migrate 7 DTO files to createZodDto** - `080baf2` (feat)
4. **Task 3: Wire ZodValidationPipe, remove class-validator** - `35c18a4` (feat)

## Files Created/Modified
- `backend/src/config/env.schema.ts` - Zod schema for all env vars with validateEnv() export
- `backend/src/config/__tests__/env.schema.spec.ts` - 7 test cases for env validation
- `backend/src/config/configuration.ts` - Rewritten: no fallback defaults, uses validated Env type
- `backend/src/app.module.ts` - Added validate: validateEnv, APP_PIPE with ZodValidationPipe
- `backend/src/main.ts` - Removed ValidationPipe and useGlobalPipes
- `backend/src/auth/dto/auth.dto.ts` - 5 DTOs via createZodDto (signup, login, reset, verify)
- `backend/src/posts/dto/create-post.dto.ts` - CreatePostDto via createZodDto
- `backend/src/posts/dto/create-reel.dto.ts` - CreateReelDto via createReelSchema.extend (duration/width/height)
- `backend/src/posts/dto/update-post.dto.ts` - UpdatePostDto via createZodDto
- `backend/src/comments/dto/create-comment.dto.ts` - CreateCommentDto via createZodDto
- `backend/src/profiles/dto/update-profile.dto.ts` - UpdateProfileDto via createZodDto
- `backend/src/checklist/dto/checklist.dto.ts` - 4 DTOs via createZodDto
- `backend/test/auth-e2e.spec.ts` - Removed ValidationPipe usage (ZodValidationPipe from AppModule)
- `backend/package.json` - Added Phase 13 deps, removed class-validator/class-transformer
- `packages/shared/package.json` - Bumped zod to ^3.25.0

## Decisions Made
- Bumped Zod to ^3.25.0 (backward compatible) to satisfy nestjs-zod peer requirement
- Used createReelSchema.extend() for backend-specific video metadata fields rather than creating a separate schema
- Registered ZodValidationPipe via APP_PIPE in AppModule providers rather than in main.ts for consistency with AppModule-first pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed e2e test using removed ValidationPipe**
- **Found during:** Task 3 (wire ZodValidationPipe)
- **Issue:** test/auth-e2e.spec.ts still imported and used `ValidationPipe` from `@nestjs/common`, causing test suite to crash after class-validator removal
- **Fix:** Removed ValidationPipe import and useGlobalPipes call; ZodValidationPipe is now provided by AppModule
- **Files modified:** backend/test/auth-e2e.spec.ts
- **Verification:** All 231 tests pass
- **Committed in:** 35c18a4 (part of Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix -- e2e test would have failed without it. No scope creep.

## Issues Encountered
- Pre-existing TypeScript errors in collection.controller.ts (PaginatedResult type naming issue) -- not caused by our changes, verified by checking `tsc --noEmit` against prior commit

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all functionality fully wired.

## Next Phase Readiness
- All Phase 13 dependencies installed and ready for plans 02-04
- nestjs-zod createZodDto pattern established for any future DTOs
- validateEnv wired into ConfigModule -- subsequent plans can add env vars to the schema
- ZodValidationPipe active globally -- all request validation uses Zod

---
*Phase: 13-backend-hardening*
*Completed: 2026-03-25*

## Self-Check: PASSED

All files verified present on disk. All 4 commit hashes verified in git log.
