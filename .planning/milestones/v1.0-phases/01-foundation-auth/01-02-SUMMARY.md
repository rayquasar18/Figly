---
phase: 01-foundation-auth
plan: 02
subsystem: auth
tags: [nestjs, passport, jwt, argon2, oauth, google-oauth, apple-signin, resend, email, cookies, guards, strategies]

# Dependency graph
requires:
  - phase: 01-foundation-auth/01
    provides: Turborepo monorepo, Prisma schema (User, RefreshToken, VerificationToken, PasswordResetToken), NestJS bootstrap, shared Zod DTOs and constants
provides:
  - AuthService with signup, login, logout, refresh token rotation, stolen token detection
  - Email verification flow (send, verify, resend) with SHA-256 hashed tokens
  - Password reset flow (forgot, reset) with Argon2 re-hashing
  - Google OAuth and Apple Sign-In with account linking by email
  - Passport strategies (local, jwt, jwt-refresh, google, apple)
  - Guards (JwtAuth, LocalAuth, JwtRefresh, GoogleAuth, AppleAuth, EmailVerified)
  - EmailService with Resend SDK and branded HTML templates
  - Rate limiting on login endpoint (5 attempts/minute)
  - HttpOnly cookie-based JWT session management
affects: [01-03, 02-profiles, 03-content, all-authenticated-endpoints]

# Tech tracking
tech-stack:
  added: [@nestjs/passport, @nestjs/jwt, passport, passport-jwt, passport-local, passport-google-oauth20, passport-apple, argon2, class-validator, class-transformer, resend]
  patterns: [passport-strategy-pattern, jwt-cookie-extraction, refresh-token-rotation, sha256-for-one-time-tokens, argon2-for-passwords, oauth-account-linking, vietnamese-error-messages]

key-files:
  created:
    - backend/src/auth/auth.service.ts
    - backend/src/auth/auth.controller.ts
    - backend/src/auth/auth.module.ts
    - backend/src/auth/dto/auth.dto.ts
    - backend/src/auth/strategies/local.strategy.ts
    - backend/src/auth/strategies/jwt.strategy.ts
    - backend/src/auth/strategies/jwt-refresh.strategy.ts
    - backend/src/auth/strategies/google.strategy.ts
    - backend/src/auth/strategies/apple.strategy.ts
    - backend/src/auth/guards/jwt-auth.guard.ts
    - backend/src/auth/guards/local-auth.guard.ts
    - backend/src/auth/guards/jwt-refresh.guard.ts
    - backend/src/auth/guards/google-auth.guard.ts
    - backend/src/auth/guards/apple-auth.guard.ts
    - backend/src/auth/guards/email-verified.guard.ts
    - backend/src/email/email.service.ts
    - backend/src/email/email.module.ts
    - backend/src/email/templates/verification.ts
    - backend/src/email/templates/password-reset.ts
    - backend/src/auth/__tests__/auth.service.spec.ts
    - backend/src/auth/__tests__/jwt-refresh.spec.ts
    - backend/src/auth/__tests__/email-verification.spec.ts
    - backend/src/auth/__tests__/password-reset.spec.ts
    - backend/src/auth/__tests__/google-auth.spec.ts
    - backend/src/auth/__tests__/apple-auth.spec.ts
  modified:
    - backend/src/app.module.ts
    - backend/src/config/configuration.ts
    - backend/package.json
    - .env.example

key-decisions:
  - "Argon2 for password and refresh token hashing, SHA-256 for single-use verification/reset tokens (fast hash acceptable for time-limited, single-use tokens)"
  - "Refresh token rotation with stolen token detection: invalid token triggers deletion of ALL user tokens"
  - "HTML email templates as plain TypeScript functions instead of React Email JSX (avoids JSX compilation complexity in NestJS backend)"
  - "OAuth account linking: match by provider ID first, then by email, then create new user"
  - "OAuth users are auto-verified (email verified by provider, no verification email needed)"
  - "Vietnamese error messages: 'Email khong ton tai', 'Sai mat khau', 'Email chua duoc xac minh'"

patterns-established:
  - "Passport strategy pattern: extend PassportStrategy with cookie extraction for JWT"
  - "Guard composition: @UseGuards(JwtAuthGuard, EmailVerifiedGuard) for layered access control"
  - "Token flow: crypto.randomBytes(32).hex -> SHA-256 hash -> store hash in DB -> send raw to user"
  - "OAuth handler pattern: findByProviderId -> findByEmail (link) -> create new user"
  - "Cookie security: httpOnly, secure in prod, sameSite strict, path-scoped (refresh token only on /api/auth/refresh)"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06]

# Metrics
duration: 15min
completed: 2026-03-13
---

# Phase 1 Plan 2: Auth Backend Summary

**Complete auth backend with Argon2 password hashing, JWT cookie sessions with refresh rotation, email verification via Resend, password reset, Google OAuth, Apple Sign-In, and 30 passing unit tests**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-13T13:06:29Z
- **Completed:** 2026-03-13T13:22:07Z
- **Tasks:** 2
- **Files modified:** 30

## Accomplishments
- Full email/password auth: signup with Argon2 hashing, login with Vietnamese-specific error messages, JWT access+refresh token pair in HttpOnly cookies, refresh token rotation with stolen token detection
- Email verification gating: SHA-256 hashed tokens with 24h expiry, verify endpoint, resend capability, EmailVerifiedGuard blocks unverified users
- Password reset: forgot-password always returns 200 (no email leak), reset-password with Argon2 re-hash, 1h token expiry
- Google OAuth and Apple Sign-In with automatic account linking by email and auto-verification
- 6 test suites with 30 passing tests covering all auth flows (TDD approach)
- Rate limiting on login endpoint (5 attempts per minute)

## Task Commits

Each task was committed atomically:

1. **Task 1: Email/password auth + JWT sessions + rate limiting**
   - `5439118` (test) - TDD RED: failing tests for auth service and JWT refresh
   - `c525c8e` (feat) - TDD GREEN: implement auth service, strategies, guards, controller

2. **Task 2: Email service + verification + password reset + OAuth strategies**
   - `eff9212` (test) - TDD RED: failing tests for email verification, password reset, and OAuth
   - `5abf593` (feat) - TDD GREEN: implement email service, templates, OAuth strategies

## Files Created/Modified
- `backend/src/auth/auth.service.ts` - Core auth logic: signup, login, refresh, verify email, reset password, Google/Apple OAuth handlers
- `backend/src/auth/auth.controller.ts` - All auth HTTP endpoints under /auth prefix
- `backend/src/auth/auth.module.ts` - Auth module with Passport, JWT, Email imports
- `backend/src/auth/dto/auth.dto.ts` - NestJS DTOs with class-validator decorators (Vietnamese messages)
- `backend/src/auth/strategies/local.strategy.ts` - Passport local strategy (email/password)
- `backend/src/auth/strategies/jwt.strategy.ts` - JWT access token from cookie
- `backend/src/auth/strategies/jwt-refresh.strategy.ts` - Refresh token from cookie with passReqToCallback
- `backend/src/auth/strategies/google.strategy.ts` - Google OAuth2 Passport strategy
- `backend/src/auth/strategies/apple.strategy.ts` - Apple Sign-In Passport strategy
- `backend/src/auth/guards/jwt-auth.guard.ts` - JWT authentication guard
- `backend/src/auth/guards/local-auth.guard.ts` - Local auth guard
- `backend/src/auth/guards/jwt-refresh.guard.ts` - JWT refresh guard
- `backend/src/auth/guards/google-auth.guard.ts` - Google OAuth guard
- `backend/src/auth/guards/apple-auth.guard.ts` - Apple auth guard
- `backend/src/auth/guards/email-verified.guard.ts` - Email verification check guard
- `backend/src/email/email.service.ts` - Email sending via Resend SDK
- `backend/src/email/email.module.ts` - Email module exporting EmailService
- `backend/src/email/templates/verification.ts` - Branded verification email HTML template (Figly purple #6366f1)
- `backend/src/email/templates/password-reset.ts` - Branded password reset email HTML template
- `backend/src/auth/__tests__/auth.service.spec.ts` - Unit tests: signup, validateUser, login, logout
- `backend/src/auth/__tests__/jwt-refresh.spec.ts` - Unit tests: token rotation, expired token, stolen token
- `backend/src/auth/__tests__/email-verification.spec.ts` - Unit tests: token creation, verify flow, resend
- `backend/src/auth/__tests__/password-reset.spec.ts` - Unit tests: forgot password, reset with valid/expired/used token
- `backend/src/auth/__tests__/google-auth.spec.ts` - Unit tests: new user, existing by googleId, link by email
- `backend/src/auth/__tests__/apple-auth.spec.ts` - Unit tests: new user, existing by appleId, link by email, no-name case
- `backend/src/app.module.ts` - Added AuthModule import
- `backend/src/config/configuration.ts` - Added Google and Apple OAuth config
- `backend/package.json` - Added auth and OAuth dependencies
- `.env.example` - Added Google/Apple OAuth environment variables

## Decisions Made
- **Argon2 for passwords, SHA-256 for one-time tokens:** Argon2's slow hashing is appropriate for passwords and long-lived refresh tokens. SHA-256 is sufficient for single-use, time-limited verification/reset tokens (per plan specification).
- **HTML templates as TypeScript functions:** Used plain HTML template functions instead of React Email JSX to avoid JSX compilation complexity in the NestJS backend. Templates produce equivalent branded HTML output.
- **Refresh token stolen detection:** When a refresh token doesn't match any stored hash, ALL tokens for that user are deleted as a security measure (assumes token was compromised).
- **OAuth auto-verification:** Users authenticating via Google or Apple are automatically marked as email-verified since the provider has already verified the email.
- **Vietnamese error messages:** Consistent with project requirement: "Email khong ton tai", "Sai mat khau", "Email chua duoc xac minh".

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed @figly/shared import path for Jest**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Import `@figly/shared/src/constants` resolved to double `src` path via moduleNameMapper (`packages/shared/src/src/constants`)
- **Fix:** Changed imports to use barrel export `@figly/shared` which maps correctly
- **Files modified:** backend/src/auth/auth.service.ts
- **Verification:** All tests pass with corrected import
- **Committed in:** c525c8e (Task 1 commit)

**2. [Rule 3 - Blocking] Email templates as .ts instead of .tsx**
- **Found during:** Task 2
- **Issue:** Plan specified .tsx templates but NestJS backend tsconfig does not enable JSX compilation
- **Fix:** Created templates as plain TypeScript functions returning HTML strings (equivalent output, no JSX dependency)
- **Files modified:** backend/src/email/templates/verification.ts, backend/src/email/templates/password-reset.ts
- **Verification:** EmailService correctly imports and uses template functions
- **Committed in:** 5abf593 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for correct module resolution and compilation. No scope creep.

## Issues Encountered
- None beyond the auto-fixed blocking issues above.

## User Setup Required

External services require manual configuration for full functionality:

**Resend (Email):**
- Set `RESEND_API_KEY` in `.env` (get from https://resend.com/api-keys)
- Verify a sending domain in Resend Dashboard, or use `onboarding@resend.dev` for testing

**Google OAuth:**
- Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`
- Create OAuth 2.0 Client ID in Google Cloud Console
- Add `http://localhost:4000/api/auth/google/callback` to Authorized redirect URIs

**Apple Sign-In:**
- Set `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` in `.env`
- Create Services ID in Apple Developer Console with Sign In with Apple capability
- Configure return URL as `http://localhost:4000/api/auth/apple/callback`

Note: Auth endpoints work without these services configured -- unit tests mock all external dependencies. OAuth endpoints will fail at runtime without credentials.

## Next Phase Readiness
- All auth API endpoints ready for frontend integration (Plan 01-03)
- AuthService and guards exported for use by any future module
- JwtAuthGuard and EmailVerifiedGuard available for protecting any endpoint
- Email templates ready (will send once Resend API key is configured)
- OAuth strategies registered (will activate once credentials are configured)

## Self-Check: PASSED

- All 25 plan files exist on disk
- Commit 5439118 (Task 1 RED) verified in git log
- Commit c525c8e (Task 1 GREEN) verified in git log
- Commit eff9212 (Task 2 RED) verified in git log
- Commit 5abf593 (Task 2 GREEN) verified in git log
- All 30 unit tests pass (`pnpm test -- --bail`)

---
*Phase: 01-foundation-auth*
*Completed: 2026-03-13*
