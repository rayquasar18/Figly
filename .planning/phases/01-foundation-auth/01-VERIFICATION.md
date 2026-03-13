---
phase: 01-foundation-auth
verified: 2026-03-13T14:15:00Z
status: gaps_found
score: 16/18 must-haves verified
gaps:
  - truth: "File uploaded via media endpoint is processed into 3 thumbnail sizes"
    status: failed
    reason: "MediaProcessor is a plain @Injectable() class — it does not carry the @Processor('media-processing') decorator from @nestjs/bullmq and does not extend WorkerHost. BullMQ has no mechanism to dispatch queued jobs to it. The process() method logic is sound and unit-tested in isolation, but it will never be called at runtime."
    artifacts:
      - path: "backend/src/media/media.processor.ts"
        issue: "Missing @Processor('media-processing') decorator and WorkerHost extension; class is registered as a plain NestJS provider, not a BullMQ worker"
    missing:
      - "Add `import { Processor, WorkerHost } from '@nestjs/bullmq'` to media.processor.ts"
      - "Replace `@Injectable()` with `@Processor('media-processing')` on the MediaProcessor class"
      - "Extend class with `extends WorkerHost` so BullMQ can discover and invoke the process() method"
      - "Confirm media.module.ts still registers the class as a provider (already done)"
  - truth: "Processed media is retrievable via presigned URL"
    status: partial
    reason: "GET /media/:id returns presigned URLs correctly once Media record has COMPLETED status, but since the processor is never invoked by BullMQ, records remain in PROCESSING state indefinitely at runtime. The wiring for retrieving URLs is correct; the blocker is the same processor registration gap."
    artifacts:
      - path: "backend/src/media/media.processor.ts"
        issue: "Same as above — media records will never reach COMPLETED status at runtime"
    missing:
      - "Same fix as gap 1 — fix the @Processor decorator so processing actually completes"
human_verification:
  - test: "Full auth flow in browser"
    expected: "Visit http://localhost:3000 -> redirected to /login; signup -> verify email (check Resend or server log) -> login -> dashboard shows 'Chao mung, {name}!'; refresh page stays logged in; logout returns to /login"
    why_human: "End-to-end browser flow requires Docker services running, Resend API key configuration, and user interaction across multiple pages"
  - test: "Vietnamese error messages in login form"
    expected: "Wrong email shows 'Email khong ton tai'; wrong password shows 'Sai mat khau'; login with unverified account shows 'Email chua duoc xac minh'"
    why_human: "Error message display requires running backend and browser interaction"
  - test: "Silent token refresh"
    expected: "After access token expires (15 min), subsequent API call transparently refreshes and retries without user re-login"
    why_human: "Requires waiting 15 minutes or manually expiring the cookie, then observing network behavior"
  - test: "Google and Apple OAuth redirects"
    expected: "Clicking 'Dang nhap voi Google' redirects to Google consent screen; clicking 'Dang nhap voi Apple' redirects to Apple; callback creates or links user account"
    why_human: "Requires Google/Apple OAuth credentials configured in .env and interaction with external OAuth providers"
  - test: "Rate limiting on login"
    expected: "6th login attempt within 1 minute returns HTTP 429"
    why_human: "Requires running backend and rapid successive requests"
---

# Phase 1: Foundation and Auth Verification Report

**Phase Goal:** Users can securely create accounts, authenticate, and the entire infrastructure (monorepo, database, media pipeline) is operational for all subsequent phases
**Verified:** 2026-03-13T14:15:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Monorepo builds successfully with pnpm turbo build | VERIFIED | turbo.json has build/dev/test/lint/db:generate/db:push tasks; SUMMARY confirms `pnpm turbo build` passes all 3 workspaces |
| 2 | Docker services (PostgreSQL, Redis, MinIO) start and accept connections | VERIFIED | docker-compose.yml defines all 4 services (postgres, redis, minio, minio-init) with volumes and correct ports |
| 3 | NestJS backend starts on port 4000 with CORS, cookie parser, and validation pipe | VERIFIED | backend/src/main.ts: enableCors, cookieParser(), ValidationPipe(whitelist, forbidNonWhitelisted, transform), listens on configService port (default 4000) |
| 4 | Next.js frontend starts on port 3000 with Tailwind CSS and shadcn/ui initialized | VERIFIED | frontend/components.json exists; tailwind.config.ts confirmed; frontend/src/app/layout.tsx substantive (>10 lines) |
| 5 | Prisma schema has User, RefreshToken, VerificationToken, PasswordResetToken, and Media models | VERIFIED | backend/prisma/schema.prisma: all 5 models + MediaStatus enum present, correctly mapped, relations with cascades |
| 6 | Shared package is importable from both frontend and backend | VERIFIED | packages/shared/src/index.ts barrel-exports signupSchema, loginSchema, TOKEN_EXPIRY, FILE_LIMITS, THUMBNAIL_SIZES, PublicUser, TokenPair; both workspaces import via @figly/shared |
| 7 | User can sign up with email and password and receive a verification email | VERIFIED | AuthController POST /auth/signup calls authService.signup() then sendVerificationEmail(); EmailService sends via Resend with SHA-256 hashed token stored in VerificationToken table |
| 8 | User is blocked from app access until email is verified | VERIFIED | EmailVerifiedGuard throws ForbiddenException when emailVerified=false; (app) layout redirects to /verify-email when user.emailVerified is false |
| 9 | User can log in with correct credentials and receive JWT cookies | VERIFIED | auth.service.ts login() generates access+refresh JWT tokens; setCookies() sets httpOnly cookies; auth.controller.ts POST /auth/login uses LocalAuthGuard |
| 10 | Login returns specific error messages: 'Email khong ton tai' or 'Sai mat khau' | VERIFIED | validateUser() throws UnauthorizedException('Email khong ton tai') and UnauthorizedException('Sai mat khau') respectively; login-form.tsx renders server error message |
| 11 | JWT access token refreshes silently via refresh endpoint using HttpOnly cookies | VERIFIED | api-client.ts has 401 interceptor with queue pattern; POST /auth/refresh uses JwtRefreshGuard, calls refreshTokens() with token rotation |
| 12 | User can request password reset and receive email link | VERIFIED | POST /auth/forgot-password calls forgotPassword(); always returns 200; EmailService.sendPasswordResetEmail() sends branded email |
| 13 | User can set new password via reset token | VERIFIED | POST /auth/reset-password validates SHA-256 hashed token, Argon2 re-hashes new password, marks token used |
| 14 | User can log in with Google OAuth | VERIFIED | GoogleStrategy validates via handleGoogleLogin(); GET /auth/google and callback implemented; GoogleAuthGuard registered |
| 15 | User can log in with Apple Sign-In | VERIFIED | AppleStrategy validates via handleAppleLogin(); POST /auth/apple and callback implemented; POST callback correctly handles Apple's POST-based flow |
| 16 | OAuth login links to existing account if email matches | VERIFIED | handleGoogleLogin() and handleAppleLogin() both: findByProviderId -> findByEmail (link + set emailVerified=true) -> create new |
| 17 | File uploaded via media endpoint is processed into 3 thumbnail sizes | FAILED | MediaProcessor is missing @Processor('media-processing') decorator and WorkerHost extension. BullMQ cannot dispatch queued jobs to it at runtime. Unit tests call processor.process() directly — they pass but don't validate the BullMQ wiring |
| 18 | Processed media is retrievable via presigned URL | PARTIAL | StorageService.getPresignedUrl() and MediaService.getMedia() are correctly implemented. Presigned URL generation logic is verified. However, media records will remain in PROCESSING status at runtime because the processor is never invoked, meaning largeKey/mediumKey/thumbnailKey remain null |

**Score:** 16/18 truths verified (1 failed, 1 partial — both from same root cause)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `turbo.json` | Turborepo pipeline configuration | VERIFIED | Contains tasks: build, dev, lint, test, db:generate, db:push |
| `docker-compose.yml` | PostgreSQL, Redis, MinIO containers | VERIFIED | 4 services; named volumes; minio-init bucket creation |
| `backend/prisma/schema.prisma` | Complete database schema for auth and media | VERIFIED | 5 models + MediaStatus enum; all indexes and cascade deletes |
| `backend/src/main.ts` | NestJS bootstrap with CORS, cookies, validation | VERIFIED | enableCors, cookieParser, ValidationPipe, setGlobalPrefix('api') |
| `packages/shared/src/dto/auth.dto.ts` | Shared Zod schemas for auth DTOs | VERIFIED | signupSchema, loginSchema, resetPasswordRequestSchema, resetPasswordSchema, verifyEmailSchema exported |
| `frontend/src/app/layout.tsx` | Root layout with Tailwind | VERIFIED | Wraps with Providers, includes globals.css, Sonner Toaster |
| `backend/src/auth/auth.service.ts` | Core auth logic | VERIFIED | 471 lines; signup, validateUser, login, refreshTokens, logout, verifyEmail, forgotPassword, resetPassword, handleGoogleLogin, handleAppleLogin, getMe |
| `backend/src/auth/auth.controller.ts` | Auth HTTP endpoints | VERIFIED | 185 lines; all endpoints: signup, login, refresh, logout, me, verify-email, resend-verification, forgot-password, reset-password, google, google/callback, apple, apple/callback |
| `backend/src/auth/strategies/jwt.strategy.ts` | JWT access token extraction from cookies | VERIFIED | ExtractJwt.fromExtractors pulls from req.cookies.access_token |
| `backend/src/auth/strategies/jwt-refresh.strategy.ts` | Refresh token extraction from cookies | VERIFIED | passReqToCallback: true; extracts refresh_token cookie |
| `backend/src/auth/strategies/google.strategy.ts` | Google OAuth2 Passport strategy | VERIFIED | PassportStrategy(Strategy, 'google'); scope ['email','profile']; calls handleGoogleLogin |
| `backend/src/auth/strategies/apple.strategy.ts` | Apple Sign-In Passport strategy | VERIFIED | Dynamic require with fallback; calls handleAppleLogin |
| `backend/src/email/email.service.ts` | Email sending via Resend | VERIFIED | sendVerificationEmail and sendPasswordResetEmail; uses Resend SDK |
| `backend/src/email/templates/verification.ts` | Branded verification email template | VERIFIED | 68 lines; Figly purple branding; HTML template function |
| `backend/src/email/templates/password-reset.ts` | Branded password reset email template | VERIFIED | 68 lines; Figly branding; security disclaimer |
| `frontend/src/lib/api-client.ts` | Axios client with 401 interceptor | VERIFIED | 76 lines; withCredentials: true; queue pattern for concurrent 401s |
| `frontend/src/stores/auth-store.ts` | Zustand store for auth UI state | VERIFIED | useAuthStore with user, isLoading, setUser, clearUser, setLoading |
| `frontend/src/app/(auth)/login/page.tsx` | Login page with form and OAuth buttons | VERIFIED | 52 lines; LoginForm + SocialLoginButtons; "hoac" divider; links to signup and forgot-password |
| `frontend/src/app/(auth)/signup/page.tsx` | Signup page with form | VERIFIED | 34 lines; SignupForm; link to login |
| `backend/src/media/media.service.ts` | Upload, queue processing, get status | VERIFIED | 100 lines; validates mimetype/size; uploads to MinIO; creates Media record; queues job; getMedia with presigned URLs |
| `backend/src/media/media.processor.ts` | BullMQ worker for image resizing | STUB | 74 lines; logic is substantive but missing @Processor decorator and WorkerHost extension — not wired to BullMQ job queue at runtime |
| `backend/src/media/storage.service.ts` | MinIO/S3 abstraction | VERIFIED | 90 lines; upload, download, getPresignedUrl; onModuleInit creates bucket |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/shared/src/index.ts` | `packages/shared/src/dto/auth.dto.ts` | barrel export | WIRED | `export { signupSchema, loginSchema, ... } from './dto/auth.dto'` at lines 2-8 |
| `backend/src/app.module.ts` | `backend/src/prisma/prisma.module.ts` | NestJS module import | WIRED | `PrismaModule` imported at line 47; PrismaModule is @Global() |
| `backend/src/main.ts` | `backend/src/app.module.ts` | NestFactory.create | WIRED | `NestFactory.create(AppModule)` at line 8 |
| `backend/src/auth/auth.controller.ts` | `backend/src/auth/auth.service.ts` | NestJS DI injection | WIRED | `constructor(private readonly authService: AuthService)` |
| `backend/src/auth/auth.service.ts` | `backend/src/email/email.service.ts` | NestJS DI injection | WIRED | `private emailService: EmailService` in constructor |
| `backend/src/auth/auth.service.ts` | `backend/src/prisma/prisma.service.ts` | NestJS DI for DB operations | WIRED | `private prisma: PrismaService` in constructor |
| `backend/src/auth/strategies/jwt.strategy.ts` | `backend/src/auth/auth.service.ts` | Token validation | WIRED | validate() returns payload; JwtStrategy correctly extracts from cookie |
| `backend/src/auth/auth.service.ts` | `packages/shared/src/constants/index.ts` | Token expiry constants | WIRED | `import { TOKEN_EXPIRY } from '@figly/shared'`; used in login(), sendVerificationEmail(), forgotPassword(), setCookies() |
| `frontend/src/lib/api-client.ts` | `backend/src/auth/auth.controller.ts` | HTTP with credentials (cookies) | WIRED | `withCredentials: true` on axios instance; 401 interceptor POSTs to /auth/refresh |
| `frontend/src/hooks/queries/auth-queries.ts` | `frontend/src/lib/api-client.ts` | TanStack Query hooks | WIRED | `import { apiClient } from '@/lib/api-client'`; used in all 7 query/mutation functions |
| `frontend/src/app/(app)/layout.tsx` | `frontend/src/hooks/queries/auth-queries.ts` | Auth guard redirect | WIRED | `import { useMe }` from auth-queries; `router.replace('/login')` when !user; `router.replace('/verify-email')` when !emailVerified |
| `backend/src/media/media.service.ts` | `backend/src/media/media.processor.ts` | BullMQ job queue | NOT_WIRED | mediaQueue.add() correctly queues the job, but MediaProcessor has no @Processor decorator — BullMQ will never route the job to it |
| `backend/src/media/media.processor.ts` | `backend/src/media/storage.service.ts` | S3 upload of processed variants | PARTIAL | storageService.upload() call exists in code; would work IF processor were invoked; not wired at BullMQ level |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| AUTH-01 | 01-01, 01-02, 01-03 | User can sign up with email and password | SATISFIED | POST /auth/signup creates user with Argon2 hash; signup page at /signup uses react-hook-form + signupSchema |
| AUTH-02 | 01-02, 01-03 | User receives email verification after signup | SATISFIED | sendVerificationEmail() called in signup handler; Resend SDK sends email; GET /auth/verify-email verifies token and sets emailVerified=true |
| AUTH-03 | 01-02, 01-03 | User can reset password via email link | SATISFIED | POST /auth/forgot-password and POST /auth/reset-password fully implemented; forgot-password and reset-password pages exist |
| AUTH-04 | 01-01, 01-02, 01-03 | User session persists across browser refresh | SATISFIED | HttpOnly JWT cookies survive browser refresh; useMe query runs on mount restoring auth state; silent refresh via 401 interceptor |
| AUTH-05 | 01-02, 01-03 | User can log in with Google OAuth | SATISFIED | GoogleStrategy, GoogleAuthGuard, GET /auth/google + callback endpoint; SocialLoginButtons component redirects to /auth/google |
| AUTH-06 | 01-02, 01-03 | User can log in with Apple Sign-In | SATISFIED | AppleStrategy, AppleAuthGuard, POST /auth/apple + callback endpoint; SocialLoginButtons component |

All 6 AUTH requirements are satisfied. No orphaned requirements — REQUIREMENTS.md traceability maps AUTH-01 through AUTH-06 exclusively to Phase 1, and all three plans claimed all 6 requirements.

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `backend/src/media/media.processor.ts` | 14-15 | Missing `@Processor('media-processing')` decorator; uses `@Injectable()` only | Blocker | BullMQ jobs queued by MediaService will never be picked up at runtime. Media thumbnails are never generated. Records remain in PROCESSING state indefinitely. |
| `backend/src/auth/strategies/apple.strategy.ts` | 13-22 | Dynamic `require('passport-apple')` with DummyStrategy fallback | Warning | If passport-apple is not installed, Apple Sign-In silently uses a no-op strategy with no error. Should fail loudly. |

---

### Human Verification Required

### 1. Complete Browser Auth Flow

**Test:** Start Docker (`docker compose up -d`), run `npx prisma db push` in backend, start `pnpm turbo dev`, visit http://localhost:3000, complete: signup -> check email for verification link -> verify -> login -> see dashboard -> logout
**Expected:** Entire flow completes without errors; Vietnamese text throughout; dashboard shows "Chao mung, {name}!"; session persists on refresh
**Why human:** Requires Docker, Resend API key, and multi-step browser interaction

### 2. Vietnamese Error Messages

**Test:** On the login page, submit with a non-existent email; submit with correct email but wrong password; attempt login with an unverified account
**Expected:** "Email khong ton tai", "Sai mat khau", "Email chua duoc xac minh" displayed inline in the form
**Why human:** Visual display requires running backend and browser

### 3. Silent Token Refresh

**Test:** Log in, then manually expire or delete the access_token cookie while keeping the refresh_token cookie, then trigger an API call (e.g., navigate to dashboard)
**Expected:** 401 from /auth/me triggers /auth/refresh, new cookies are set, original request succeeds transparently
**Why human:** Requires browser dev tools to manipulate cookies and inspect network calls

### 4. Google and Apple OAuth (with credentials configured)

**Test:** Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env, restart backend, click "Dang nhap voi Google" on login page
**Expected:** Redirected to Google consent screen; after consent, redirected back to http://localhost:3000/auth/callback with session established
**Why human:** Requires OAuth credentials and interaction with external provider

### 5. Login Rate Limiting

**Test:** Send 6 rapid POST requests to /auth/login with invalid credentials within 1 minute
**Expected:** First 5 return 401 (wrong credentials), 6th returns 429 Too Many Requests
**Why human:** Requires running backend and rapid HTTP calls (can use curl but needs human to execute)

---

## Gaps Summary

Two truths failed, both from the **same root cause**: `MediaProcessor` is missing the `@Processor('media-processing')` decorator from `@nestjs/bullmq` and does not extend `WorkerHost`.

**Root cause:** The plan specified extending `WorkerHost` and using `@Processor`, but the implementation used only `@Injectable()`. The unit tests call `processor.process()` directly — bypassing BullMQ entirely — so the tests pass while the runtime wiring is broken.

**Impact on phase goal:** The auth infrastructure goal is fully achieved. The media pipeline goal ("infrastructure operational for all subsequent phases") is partially achieved: upload validation, MinIO storage, DB record creation, job queuing, presigned URL retrieval, and Sharp image processing logic all exist and are correct. Only the BullMQ dispatch wiring is missing, which means images will never actually be processed at runtime until this is fixed.

**Fix is minimal:** Add `@Processor('media-processing')` decorator, extend `WorkerHost`, and the existing `process()` method will be picked up automatically by BullMQ.

---

_Verified: 2026-03-13T14:15:00Z_
_Verifier: Claude (gsd-verifier)_
