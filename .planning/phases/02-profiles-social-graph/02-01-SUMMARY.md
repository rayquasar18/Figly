---
phase: 02-profiles-social-graph
plan: 01
subsystem: database, shared
tags: [prisma, zod, username, follow, social-graph, validators, profile-types]

# Dependency graph
requires:
  - phase: 01-foundation-auth/01
    provides: Turborepo monorepo, Prisma schema (User, Media models), shared Zod DTOs and constants
  - phase: 01-foundation-auth/02
    provides: AuthService with signup, getMe, JWT cookie sessions
provides:
  - Prisma User model with username, bio, avatarId, usernameChangedAt fields
  - Prisma Follow model with explicit join table (composite unique, dual FK indexes)
  - UserAvatar one-to-one relation between User and Media
  - Shared username validator (usernameSchema) with Vietnamese messages
  - Shared bio validator (bioSchema) with Vietnamese messages
  - USERNAME_RULES constant and RESERVED_USERNAMES list
  - ProfileResponse, UserListItem, PaginatedResponse shared types
  - updateProfileSchema shared DTO
  - PROFILE_LIMITS constant
  - Signup flow accepts and stores username
  - getMe response includes username field
affects: [02-02, 02-03, 02-04, 03-content, 04-collections]

# Tech tracking
tech-stack:
  added: []
  patterns: [reserved-username-check, p2002-unique-constraint-catch, shared-validators-in-backend]

key-files:
  created:
    - packages/shared/src/validators/username.ts
    - packages/shared/src/types/profile.types.ts
    - packages/shared/src/dto/profile.dto.ts
    - backend/src/auth/__tests__/signup-username.spec.ts
  modified:
    - backend/prisma/schema.prisma
    - packages/shared/src/types/user.types.ts
    - packages/shared/src/constants/index.ts
    - packages/shared/src/index.ts
    - backend/src/auth/auth.service.ts
    - backend/src/auth/dto/auth.dto.ts
    - backend/src/auth/__tests__/auth.service.spec.ts
    - backend/test/auth-e2e.spec.ts

key-decisions:
  - "Username field is nullable (String?) on User model to support existing OAuth users without usernames -- frontend will show 'complete profile' interstitial when username is null"
  - "avatarId is @unique to enforce one-to-one relation with Media (Prisma requires this for optional 1:1)"
  - "Reserved username check happens in AuthService.signup before Prisma create, not in Zod schema, to keep validation and business logic separate"
  - "P2002 Prisma error caught on signup to handle race conditions where two users try same username simultaneously"

patterns-established:
  - "Reserved name check pattern: compare against RESERVED_USERNAMES array before database insert"
  - "P2002 catch pattern: try/catch around prisma.create to handle unique constraint violation gracefully"
  - "Shared validator reuse: usernameSchema and bioSchema defined once in shared package, used by both updateProfileSchema DTO and backend class-validator decorators"

requirements-completed: [PROF-01, PROF-02]

# Metrics
duration: 7min
completed: 2026-03-14
---

# Phase 2 Plan 1: Schema & Shared Types Summary

**Prisma schema extended with User profile fields (username/bio/avatar) and Follow model, shared package validators (username/bio with Vietnamese messages), ProfileResponse/UserListItem/PaginatedResponse types, and signup modified to collect @username with reserved name checking**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-13T20:47:54Z
- **Completed:** 2026-03-13T20:55:51Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 12

## Accomplishments
- Extended Prisma User model with username (unique), bio (varchar 150), avatarId (unique, 1:1 with Media), and usernameChangedAt fields
- Created Follow model as explicit join table with composite unique constraint, dual FK indexes, and cascading deletes
- Created shared validators: usernameSchema (3-30 chars, lowercase+numbers+underscores+periods, Vietnamese messages), bioSchema (max 150 chars), and RESERVED_USERNAMES list (16 reserved names)
- Created shared types: ProfileResponse, UserListItem, PaginatedResponse<T>, and updateProfileSchema DTO
- Modified signup to accept, validate, and store username with reserved name checking and P2002 unique constraint handling
- Updated getMe to include username in response for frontend "complete profile" detection
- 62 unit tests passing (20 new + 42 existing)

## Task Commits

Each task was committed atomically (TDD):

1. **Task 1: Schema extension, shared types/validators, and signup username support**
   - `2d6a682` (test) - TDD RED: failing tests for username validators and signup with username
   - `851e549` (feat) - TDD GREEN: implement all schema, validators, types, and signup changes

## Files Created/Modified
- `backend/prisma/schema.prisma` - Added username/bio/avatarId/usernameChangedAt to User, UserAvatar relation, Follow model with composite unique
- `packages/shared/src/validators/username.ts` - USERNAME_RULES, RESERVED_USERNAMES, usernameSchema, bioSchema with Vietnamese messages
- `packages/shared/src/types/profile.types.ts` - ProfileResponse, UserListItem, PaginatedResponse<T> interfaces
- `packages/shared/src/dto/profile.dto.ts` - updateProfileSchema with optional displayName, username, bio, avatarId
- `packages/shared/src/types/user.types.ts` - Added username (string | null) to PublicUser
- `packages/shared/src/constants/index.ts` - Added PROFILE_LIMITS constant
- `packages/shared/src/index.ts` - Updated barrel exports for all new types, validators, DTOs, constants
- `backend/src/auth/auth.service.ts` - Signup accepts username, checks reserved names, catches P2002; getMe includes username
- `backend/src/auth/dto/auth.dto.ts` - Added username field with class-validator decorators to SignupDto
- `backend/src/auth/__tests__/auth.service.spec.ts` - Updated existing signup tests to include username
- `backend/src/auth/__tests__/signup-username.spec.ts` - 20 new tests for username/bio validators and signup with username
- `backend/test/auth-e2e.spec.ts` - Updated E2E tests to include username in signup requests

## Decisions Made
- **Username nullable on User model:** Used `String?` instead of `String` to support existing OAuth users from Phase 1 who don't have usernames yet. Frontend will show "complete profile" interstitial when username is null (per CONTEXT.md plan).
- **avatarId @unique:** Prisma requires @unique on the FK field for optional one-to-one relations. This also ensures a single media item can only be one user's avatar.
- **Reserved name check in service, not schema:** The RESERVED_USERNAMES check is in AuthService.signup (business logic) rather than in the Zod schema (validation). This keeps the Zod schema reusable for general username format validation while business rules stay in the service.
- **P2002 error handling for username races:** Catching Prisma P2002 errors on user creation to handle the check-then-act race condition where two concurrent signups pick the same username.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed existing auth.service.spec.ts for new signup API**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** Existing signup tests used `{ email, password, name }` without `username`, which TypeScript rejects since signup now requires username
- **Fix:** Added `username: 'testuser'` to the signup DTO in existing tests
- **Files modified:** backend/src/auth/__tests__/auth.service.spec.ts
- **Verification:** All 62 tests pass
- **Committed in:** 851e549

**2. [Rule 1 - Bug] Updated E2E tests for new signup API**
- **Found during:** Task 1 (GREEN phase)
- **Issue:** E2E tests sent signup requests without username field, would fail once DB schema is pushed
- **Fix:** Added username field to all signup requests in auth-e2e.spec.ts
- **Files modified:** backend/test/auth-e2e.spec.ts
- **Verification:** E2E tests compile (DB-dependent tests need `prisma db push` to pass at runtime)
- **Committed in:** 851e549

**3. [Rule 3 - Blocking] Added @unique to avatarId for Prisma one-to-one relation**
- **Found during:** Task 1 (GREEN phase, prisma validate)
- **Issue:** Prisma requires @unique on the defining side of an optional one-to-one relation
- **Fix:** Changed `avatarId String?` to `avatarId String? @unique`
- **Files modified:** backend/prisma/schema.prisma
- **Verification:** `npx prisma validate` passes
- **Committed in:** 851e549

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All fixes necessary for correct compilation and test passing. No scope creep.

## Issues Encountered
- E2E tests fail at runtime because the database hasn't been pushed with the new schema (Docker must be running for `prisma db push`). This is expected per plan instructions ("do NOT run db push -- user needs Docker running"). Unit tests all pass.

## User Setup Required

**Database migration required (once Docker is running):**
```bash
docker compose up -d
cd backend && npx prisma db push
```

Note: The `username` column is added as nullable (`String?`), so existing data (if any) will not block the migration. Existing users will have `username = null` until they set one via the "complete profile" flow (Plan 02-03).

## Next Phase Readiness
- Prisma schema ready for profiles module (Plan 02-02) and social module (Plan 02-03)
- Shared types and validators ready for import by backend profile/social services and frontend forms
- USERNAME_RULES and RESERVED_USERNAMES available for frontend username checking UI
- ProfileResponse type ready for profile API endpoint implementation
- PaginatedResponse type ready for follower/following list APIs
- Follow model ready for social graph queries

## Self-Check: PASSED

- All 12 plan files exist on disk
- Commit 2d6a682 (Task 1 RED) verified in git log
- Commit 851e549 (Task 1 GREEN) verified in git log
- All 62 unit tests pass
- `pnpm turbo build` passes for all 3 workspaces
- `npx prisma validate` passes

---
*Phase: 02-profiles-social-graph*
*Completed: 2026-03-14*
