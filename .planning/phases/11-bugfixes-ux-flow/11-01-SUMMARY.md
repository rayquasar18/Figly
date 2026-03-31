---
phase: 11-bugfixes-ux-flow
plan: 01
subsystem: auth
tags: [zod, prisma, class-validator, signup, email-template]

# Dependency graph
requires:
  - phase: none
    provides: existing auth flow with name+username in signup
provides:
  - Simplified signup flow accepting only email+password
  - Nullable User.name in Prisma schema (migration applied)
  - Null-safe email templates (verification + password reset)
  - Updated shared signupSchema (email+password only)
  - Simplified frontend signup form (2 fields)
affects: [11-02 (complete-profile), 11-03 (sidebar)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Null-safe name fallback ('ban') in email template calls"
    - "Defensive escapeHtml null guard in email templates"

key-files:
  created:
    - backend/prisma/migrations/20260324_make_name_nullable/migration.sql
  modified:
    - backend/prisma/schema.prisma
    - packages/shared/src/dto/auth.dto.ts
    - packages/shared/dist/dto/auth.dto.d.ts
    - packages/shared/dist/dto/auth.dto.js
    - backend/src/auth/dto/auth.dto.ts
    - backend/src/auth/auth.service.ts
    - backend/src/auth/auth.controller.ts
    - backend/src/email/templates/verification.ts
    - backend/src/email/templates/password-reset.ts
    - backend/src/auth/__tests__/auth.service.spec.ts
    - backend/src/auth/__tests__/signup-username.spec.ts
    - backend/test/auth-e2e.spec.ts
    - frontend/src/components/auth/signup-form.tsx
    - frontend/src/hooks/queries/auth-queries.ts

key-decisions:
  - "Used manual migration file (prisma migrate dev fails due to broken shadow DB baseline)"
  - "Applied null-safe name fallback to password reset email too (not just verification)"

patterns-established:
  - "Null-safe name pattern: user.name || 'ban' before passing to email services"

requirements-completed: [BUGF-01, BUGF-02]

# Metrics
duration: 10min
completed: 2026-03-24
---

# Phase 11 Plan 01: Simplified Signup Summary

**Email+password-only signup with nullable User.name, simplified 4-layer validation (Prisma/Zod/class-validator/frontend), and null-safe email templates**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-24T01:11:37Z
- **Completed:** 2026-03-24T01:21:44Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments
- Simplified signup to collect only email and password (removed name and username from all 4 validation layers)
- Made User.name nullable in Prisma schema with migration applied to database
- Added null-safe name handling in verification and password reset email flows
- Simplified frontend signup form from 4 fields to 2 fields
- All 70 auth tests pass (unit + E2E)

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend signup simplification** - `4d13bfb` (feat) + `ef39b50` (chore: dist rebuild)
   - Note: Backend source changes were committed by parallel agent 11-02 which executed overlapping work. This agent committed the shared package dist rebuild.
2. **Task 2: Frontend signup form simplification** - `346fa5d` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `backend/prisma/schema.prisma` - User.name changed from String to String? (nullable)
- `backend/prisma/migrations/20260324_make_name_nullable/migration.sql` - Migration SQL (gitignored)
- `packages/shared/src/dto/auth.dto.ts` - signupSchema simplified to email+password only
- `packages/shared/dist/dto/auth.dto.d.ts` - Rebuilt type declarations
- `packages/shared/dist/dto/auth.dto.js` - Rebuilt JS output
- `backend/src/auth/dto/auth.dto.ts` - SignupDto simplified to email+password (class-validator)
- `backend/src/auth/auth.service.ts` - signup() accepts {email, password}, creates user with null name/username
- `backend/src/auth/auth.controller.ts` - Null-safe name fallback ('ban') in signup and resendVerification
- `backend/src/email/templates/verification.ts` - Defensive escapeHtml null guard
- `backend/src/email/templates/password-reset.ts` - Defensive escapeHtml null guard
- `backend/src/auth/__tests__/auth.service.spec.ts` - Updated for email+password-only signup, added null name/username test
- `backend/src/auth/__tests__/signup-username.spec.ts` - Updated for simplified signup (removed reserved username and P2002 username tests)
- `backend/test/auth-e2e.spec.ts` - Updated E2E to send only email+password and expect null name
- `frontend/src/components/auth/signup-form.tsx` - Removed name/username fields, debounce logic, and unused imports
- `frontend/src/hooks/queries/auth-queries.ts` - Simplified useSignupMutation type to {email, password}

## Decisions Made
- Used manual migration file instead of `prisma migrate dev` because shadow DB baseline is broken (existing migration references tables not in migration history). Migration SQL was applied directly.
- Extended null-safe name handling to password reset email (not just verification) -- this was a Rule 1 auto-fix for a potential crash when a user with null name requests password reset.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added null-safe name to forgotPassword/password reset email**
- **Found during:** Task 1 (backend auth service update)
- **Issue:** `auth.service.ts` forgotPassword method passes `user.name` to `sendPasswordResetEmail`, which would crash on null for users who signed up with email+password only
- **Fix:** Added `user.name || 'ban'` fallback in forgotPassword, and defensive `if (!str) return ''` in password-reset template's escapeHtml
- **Files modified:** backend/src/auth/auth.service.ts, backend/src/email/templates/password-reset.ts
- **Verification:** Backend tests pass
- **Committed in:** 4d13bfb (part of task 1 commit)

**2. [Rule 3 - Blocking] Updated E2E tests for simplified signup**
- **Found during:** Task 1 (test verification)
- **Issue:** E2E tests in `backend/test/auth-e2e.spec.ts` were sending name+username in signup payload and asserting `user.name === testName`, causing test failures
- **Fix:** Updated signup payloads to email+password only, assertions to expect null name/username
- **Files modified:** backend/test/auth-e2e.spec.ts
- **Verification:** All 70 auth tests pass
- **Committed in:** 4d13bfb (part of task 1 commit)

**3. [Rule 3 - Blocking] Manual Prisma migration due to broken shadow DB**
- **Found during:** Task 1 (Prisma schema change)
- **Issue:** `prisma migrate dev` fails because existing migration `20260315_add_moderation_and_safety` references tables not created in migration history (base tables predate migrations)
- **Fix:** Created migration file manually, applied SQL directly with `prisma db execute`, marked as applied with `prisma migrate resolve`
- **Files modified:** backend/prisma/migrations/20260324_make_name_nullable/migration.sql (gitignored)
- **Verification:** `prisma migrate status` shows migration applied
- **Committed in:** N/A (migration directory is gitignored)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for correctness and test stability. No scope creep.

## Issues Encountered
- Parallel agent (plan 11-02) committed overlapping backend changes before this agent. All Task 1 source edits matched HEAD after the parallel commit, so Task 1 effectively only committed the shared package dist rebuild.
- Pre-existing test failure in `backend/src/feed/__tests__/public-feed.spec.ts` (unrelated to signup changes). Logged to deferred-items.md.
- Frontend `tsc --noEmit` reports errors in `.next/types/` for removed/missing pages (admin, messages, etc.). These are pre-existing stale Next.js type artifacts, not related to our changes.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all changes are fully wired with no placeholder data.

## Next Phase Readiness
- Signup flow is simplified; users register with email+password only
- Complete-profile page (plan 11-02) can now enforce name+username collection post-signup
- Verification email works correctly with null-name users

---
*Phase: 11-bugfixes-ux-flow*
*Completed: 2026-03-24*

## Self-Check: PASSED

All 13 key files verified present. Both commits (ef39b50, 346fa5d) found in git history.
