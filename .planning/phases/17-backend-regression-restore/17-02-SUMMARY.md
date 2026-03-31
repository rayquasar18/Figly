---
phase: 17-backend-regression-restore
plan: 02
subsystem: api
tags: [nestjs-zod, createZodDto, ZodSerializerDto, zod, prisma, dto]

# Dependency graph
requires:
  - phase: 01-foundation-auth
    provides: Auth service, DTOs, Prisma schema
provides:
  - All backend DTOs use createZodDto wrapping @figly/shared schemas
  - Auth controller has @ZodSerializerDto decorators on signup/login/me
  - Null-safe name handling throughout auth flow
  - Signup service accepts email+password only (name/username set later in complete-profile)
affects: [17-backend-regression-restore, frontend-auth]

# Tech tracking
tech-stack:
  added: [nestjs-zod]
  patterns: [createZodDto pattern for all backend DTOs, ZodValidationPipe global pipe, null-safe name fallback]

key-files:
  created:
    - backend/src/common/dto/user-response.dto.ts
  modified:
    - backend/src/auth/dto/auth.dto.ts
    - backend/src/profiles/dto/update-profile.dto.ts
    - backend/src/checklist/dto/checklist.dto.ts
    - backend/src/posts/dto/create-post.dto.ts
    - backend/src/posts/dto/update-post.dto.ts
    - backend/src/comments/dto/create-comment.dto.ts
    - backend/src/auth/auth.controller.ts
    - backend/src/auth/auth.service.ts
    - backend/src/main.ts
    - backend/package.json
    - backend/prisma/schema.prisma

key-decisions:
  - "Null-safe name pattern: user.name || 'ban' before email services"
  - "Removed class-validator/class-transformer entirely, replaced with nestjs-zod"
  - "ZodValidationPipe replaces ValidationPipe in main.ts"
  - "User.name nullable in Prisma schema (Phase 11 regression restored)"

patterns-established:
  - "createZodDto: All backend DTOs wrap @figly/shared schemas via createZodDto()"
  - "ZodSerializerDto: Response serialization decorators strip internal fields"
  - "Null-safe name: Always use user.name || 'ban' when passing to string-expecting methods"

requirements-completed: [BACK-06, BACK-07]

# Metrics
duration: 7min
completed: 2026-03-26
---

# Phase 17 Plan 02: DTO Regression Restore Summary

**Restored all backend DTOs from class-validator to nestjs-zod createZodDto, added ZodSerializerDto decorators to auth controller, fixed null-safe name handling**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-26T03:22:04Z
- **Completed:** 2026-03-26T03:29:45Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Restored 6 backend DTO files from class-validator decorators to createZodDto wrapping @figly/shared schemas
- Added @ZodSerializerDto decorators on auth controller signup/login/me endpoints for response serialization
- Fixed null-safe name handling throughout auth flow (user.name || 'ban')
- Restored auth.service.signup to email+password only (Phase 11 signature)
- All 18 unit test suites pass (208 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Restore 3 DTO files from class-validator to createZodDto** - `e23babc` (fix)
2. **Task 2: Add @ZodSerializerDto decorators, fix null-safe name, fix tests** - `87e576a` (fix)

## Files Created/Modified
- `backend/src/auth/dto/auth.dto.ts` - Zod-based auth DTOs (SignupDto, LoginDto, etc.)
- `backend/src/profiles/dto/update-profile.dto.ts` - Zod-based profile DTO
- `backend/src/checklist/dto/checklist.dto.ts` - Zod-based checklist DTOs
- `backend/src/posts/dto/create-post.dto.ts` - Zod-based post DTO
- `backend/src/posts/dto/update-post.dto.ts` - Zod-based update post DTO
- `backend/src/comments/dto/create-comment.dto.ts` - Zod-based comment DTO
- `backend/src/auth/auth.controller.ts` - ZodSerializerDto decorators, null-safe name
- `backend/src/auth/auth.service.ts` - Simplified signup signature, null-safe name in forgotPassword
- `backend/src/common/dto/user-response.dto.ts` - Response schemas for auth endpoints (NEW)
- `backend/src/main.ts` - ZodValidationPipe replaces ValidationPipe
- `backend/package.json` - Added nestjs-zod, removed class-validator/class-transformer
- `backend/prisma/schema.prisma` - User.name made nullable
- `backend/src/auth/__tests__/auth.service.spec.ts` - Updated signup test for email+password only
- `backend/src/auth/__tests__/signup-username.spec.ts` - Updated for simplified signup API

## Decisions Made
- Null-safe name pattern: `user.name || 'ban'` before passing to email services expecting string
- Removed class-validator/class-transformer entirely from package.json, replaced with nestjs-zod
- ZodValidationPipe in main.ts replaces NestJS ValidationPipe (class-validator no longer available)
- User.name nullable in Prisma schema to match Phase 11 intent (name set later in complete-profile)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added nestjs-zod dependency, removed class-validator/class-transformer**
- **Found during:** Task 1 (DTO restoration)
- **Issue:** nestjs-zod not in package.json, class-validator still present. createZodDto requires nestjs-zod.
- **Fix:** Added nestjs-zod 5.2.1, removed class-validator and class-transformer from dependencies
- **Files modified:** backend/package.json, pnpm-lock.yaml
- **Verification:** pnpm install succeeds, imports resolve
- **Committed in:** e23babc (Task 1 commit)

**2. [Rule 3 - Blocking] Restored 3 additional regressed DTO files (posts, comments)**
- **Found during:** Task 1 (DTO restoration)
- **Issue:** create-post.dto.ts, update-post.dto.ts, create-comment.dto.ts also regressed to class-validator
- **Fix:** Replaced all 3 with createZodDto versions matching parent branch
- **Files modified:** backend/src/posts/dto/create-post.dto.ts, backend/src/posts/dto/update-post.dto.ts, backend/src/comments/dto/create-comment.dto.ts
- **Verification:** grep -r "class-validator" returns zero matches in backend/src
- **Committed in:** e23babc (Task 1 commit)

**3. [Rule 3 - Blocking] Replaced ValidationPipe with ZodValidationPipe in main.ts**
- **Found during:** Task 1 (DTO restoration)
- **Issue:** main.ts used class-validator's ValidationPipe which was removed
- **Fix:** Switched to ZodValidationPipe from nestjs-zod
- **Files modified:** backend/src/main.ts
- **Verification:** Build compiles, tests pass
- **Committed in:** e23babc (Task 1 commit)

**4. [Rule 3 - Blocking] Created common/dto/user-response.dto.ts**
- **Found during:** Task 2 (auth controller decorators)
- **Issue:** ZodSerializerDto decorators require response DTO classes that didn't exist in this worktree
- **Fix:** Created user-response.dto.ts with Zod schemas for signup/login/me responses
- **Files modified:** backend/src/common/dto/user-response.dto.ts (NEW)
- **Verification:** Auth controller imports resolve correctly
- **Committed in:** 87e576a (Task 2 commit)

**5. [Rule 3 - Blocking] Restored auth.service.signup to email+password only signature**
- **Found during:** Task 2 (test fixes)
- **Issue:** auth.service.ts signup still accepted name+username (Phase 11 regression)
- **Fix:** Simplified to { email, password } with name: null, username: null
- **Files modified:** backend/src/auth/auth.service.ts
- **Verification:** All 208 unit tests pass
- **Committed in:** 87e576a (Task 2 commit)

**6. [Rule 3 - Blocking] Made User.name nullable in Prisma schema**
- **Found during:** Task 2 (TypeScript compilation error)
- **Issue:** name: String (non-nullable) but service sets name: null. TS2322 error.
- **Fix:** Changed to name: String? in Prisma schema
- **Files modified:** backend/prisma/schema.prisma
- **Verification:** prisma generate succeeds, all tests compile
- **Committed in:** 87e576a (Task 2 commit)

---

**Total deviations:** 6 auto-fixed (all Rule 3 - blocking)
**Impact on plan:** All auto-fixes were cascading dependencies of the planned DTO restoration. Removing class-validator required fixing all 6 DTO files (not just 3), replacing the validation pipe, and ensuring Prisma schema matched the service changes. No scope creep.

## Issues Encountered
- E2E test (test/auth-e2e.spec.ts) fails because it requires a running PostgreSQL database. This is pre-existing and unrelated to the regression restore. All 18 unit test suites (208 tests) pass.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - no stubs detected.

## Next Phase Readiness
- All backend DTOs now consistently use createZodDto from nestjs-zod
- Auth controller properly serializes responses via ZodSerializerDto
- Backend test suite green (208/208 unit tests)
- Ready for further backend regression restore plans

---
*Phase: 17-backend-regression-restore*
*Completed: 2026-03-26*

## Self-Check: PASSED

All files exist. All commits verified.
