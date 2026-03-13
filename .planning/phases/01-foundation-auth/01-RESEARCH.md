# Phase 1: Foundation & Auth - Research

**Researched:** 2026-03-13
**Domain:** Monorepo infrastructure, authentication, media pipeline, database
**Confidence:** MEDIUM-HIGH (training data only -- external verification tools unavailable)

## Summary

Phase 1 establishes the entire Figly infrastructure from scratch: a Turborepo monorepo with pnpm workspaces (frontend/ + backend/ + packages/shared/), PostgreSQL via Prisma ORM, a complete JWT-based authentication system with email/password + Google OAuth + Apple Sign-In, email verification and password reset flows via Resend + React Email, and an async media processing pipeline using MinIO + BullMQ + Sharp. All decisions are locked by CONTEXT.md -- no alternatives to explore.

The stack is well-established and the integration patterns are mature. NestJS provides first-party support for Passport.js, JWT, BullMQ (via @nestjs/bullmq), and has documented Prisma integration. The primary complexity lies in correctly wiring together many pieces: cookie-based JWT rotation, OAuth callback handling, email verification gating, async media processing with job queues, and making the shared package consumable by both frontend and backend.

**Primary recommendation:** Build infrastructure layer-by-layer -- monorepo scaffold first, then database/Prisma, then auth (email/password before OAuth), then email system, then media pipeline. Each layer should be independently testable before the next is added.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Turborepo + pnpm workspaces as monorepo tool
- Folder layout: `frontend/` (Next.js), `backend/` (NestJS), `packages/shared/` (types, DTOs, constants, validators)
- Next.js is STRICTLY frontend only -- no API routes, no server actions for business logic
- NestJS handles ALL business logic, database, auth, media processing
- Tailwind CSS for styling
- shadcn/ui for component library
- Zustand for client state management
- TanStack Query for data fetching and API client
- JWT + Refresh token strategy with HttpOnly cookies
- Multi-device login allowed (like Instagram)
- Refresh token ~30 days, no "remember me" checkbox
- Logout only affects current device
- Rate limit: 5 failed login attempts per minute, then temporary lock
- Resend as email service
- Password reset via email link (not OTP code)
- Branded HTML email templates using React Email (Figly logo, brand colors)
- Token expiry: 24 hours for email verification, 1 hour for password reset
- MinIO for storage (S3-compatible, Docker for local dev)
- Upload flow: browser -> NestJS backend -> MinIO
- Async image processing via BullMQ workers (Sharp)
- File size limits: 10MB for images, 100MB for videos
- 3 thumbnail sizes: 150px (thumbnail), 600px (medium), 1080px (large)
- Password policy: minimum 8 characters, must contain letters and numbers
- Password hashing: Argon2
- CORS: strict -- only allow frontend domain
- Rate limiting: 100 requests/minute for general API, 5/minute for login endpoint
- Block user until email is verified -- no access to app before verification
- Login error messages are specific (not vague)
- Folder naming MUST be `frontend/` and `backend/` -- not `apps/web` and `apps/api`

### Claude's Discretion
- Login/signup page layout (single page with toggle vs separate pages)
- OAuth button placement (above or below email/password form)
- Loading states and error UI design
- Exact Turborepo task pipeline configuration
- Docker Compose setup for dev environment (PostgreSQL, MinIO, Redis)
- Database seeding approach for dev

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up with email and password | NestJS auth module + Prisma User model + Argon2 hashing + class-validator DTOs in shared package |
| AUTH-02 | User receives email verification after signup | Resend SDK + React Email templates + crypto token generation + verification endpoint |
| AUTH-03 | User can reset password via email link | Resend password reset email + time-limited token (1h) + reset endpoint with Argon2 re-hash |
| AUTH-04 | User session persists across browser refresh | JWT access token (15min) + refresh token (30d) in HttpOnly cookies + silent refresh via TanStack Query |
| AUTH-05 | User can log in with Google OAuth | Passport Google OAuth2 strategy + callback handler + account linking logic |
| AUTH-06 | User can log in with Apple Sign-In | Passport Apple strategy + callback handler + account linking logic |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| turborepo | ^2.x | Monorepo build orchestration | Industry standard for JS/TS monorepos, intelligent caching |
| pnpm | ^9.x | Package manager with workspaces | Faster, stricter dependency resolution than npm/yarn |
| next | ^14.x or ^15.x | Frontend framework | App Router, RSC support, project skill alignment |
| @nestjs/core | ^10.x | Backend framework | Enterprise-grade Node.js framework, modular architecture |
| @nestjs/platform-express | ^10.x | HTTP adapter | Express underneath for maximum middleware compatibility |
| prisma | ^5.x or ^6.x | ORM + migrations | Type-safe database client, schema-first, excellent DX |
| @prisma/client | ^5.x or ^6.x | Generated database client | Auto-generated types from schema |
| typescript | ^5.x | Language | Shared across all workspaces |

### Authentication
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @nestjs/passport | ^10.x | Passport integration for NestJS | Wraps Passport strategies as NestJS Guards |
| @nestjs/jwt | ^10.x | JWT module for NestJS | Token signing/verification, integrates with ConfigModule |
| passport | ^0.7.x | Authentication middleware | Strategy pattern for multiple auth methods |
| passport-jwt | ^4.x | JWT extraction strategy | Extract JWT from cookies, validate |
| passport-local | ^1.x | Email/password strategy | Local authentication with username/password |
| passport-google-oauth20 | ^2.x | Google OAuth2 strategy | Google sign-in flow |
| passport-apple | ^2.x | Apple Sign-In strategy | Apple sign-in flow (note: Apple uses POST callback) |
| argon2 | ^0.41.x | Password hashing | OWASP-recommended, superior to bcrypt |

### Email
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| resend | ^4.x | Email delivery API | Sending verification and password reset emails |
| @react-email/components | latest | Email template components | Building branded HTML email templates |
| react-email | latest | Email development/preview | Dev-time preview of email templates |

### Media Pipeline
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @nestjs/bullmq | ^10.x | Job queue integration | Async image processing jobs |
| bullmq | ^5.x | Redis-backed job queue | Worker processes for media tasks |
| @aws-sdk/client-s3 | ^3.x | S3-compatible client | Upload/download from MinIO (S3-compatible API) |
| @aws-sdk/s3-request-presigner | ^3.x | Presigned URLs | Generate CDN-like URLs for media access |
| sharp | ^0.33.x | Image processing | Resize, convert, generate thumbnails |
| multer | ^1.x | File upload middleware | Parse multipart/form-data uploads |
| @nestjs/platform-express | (included) | Multer integration | Built-in file upload interceptors |

### Frontend
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | ^5.x | Server state management | All API calls, caching, background refresh |
| zustand | ^4.x or ^5.x | Client state management | UI state, auth state, non-server state |
| tailwindcss | ^3.x or ^4.x | Utility-first CSS | All styling |
| shadcn/ui | latest (CLI) | Component library | Pre-built accessible components |
| react-hook-form | ^7.x | Form handling | Login, signup, password reset forms |
| zod | ^3.x | Schema validation | Shared validation (frontend + backend via shared package) |

### DevOps / Infrastructure
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| docker-compose | v2 | Local dev services | PostgreSQL, MinIO, Redis containers |
| @nestjs/config | ^3.x | Configuration module | Environment variables, secrets |
| @nestjs/throttler | ^5.x or ^6.x | Rate limiting | Login endpoint + general API rate limits |
| class-validator | ^0.14.x | DTO validation (backend) | NestJS pipe validation |
| class-transformer | ^0.5.x | DTO transformation | NestJS serialization |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Argon2 | bcrypt | Argon2 is OWASP-recommended, harder to misconfigure; bcrypt is more widely deployed but weaker against GPU attacks |
| Passport.js | Custom JWT guards | Passport provides battle-tested OAuth flows; custom guards are simpler but lack OAuth strategy ecosystem |
| BullMQ | Agenda / pg-boss | BullMQ is fastest, Redis-backed, first-party NestJS support; pg-boss avoids Redis but slower |
| MinIO | Direct S3 | MinIO is S3-compatible but runs locally; production swap is transparent |
| Resend | Nodemailer + SMTP | Resend has simpler API, React Email integration; Nodemailer is lower-level |

**Installation (backend):**
```bash
pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt passport-local passport-google-oauth20 passport-apple argon2 @nestjs/config @nestjs/throttler @nestjs/bullmq bullmq @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp multer resend class-validator class-transformer
pnpm add -D @types/passport-jwt @types/passport-local @types/passport-google-oauth20 @types/multer prisma
```

**Installation (frontend):**
```bash
pnpm add @tanstack/react-query zustand react-hook-form zod @hookform/resolvers
pnpm add -D tailwindcss postcss autoprefixer
npx shadcn@latest init
```

**Installation (shared):**
```bash
pnpm add zod
```

## Architecture Patterns

### Recommended Project Structure
```
Figly/
├── turbo.json                    # Turborepo pipeline config
├── pnpm-workspace.yaml           # Workspace definitions
├── package.json                  # Root scripts, devDependencies
├── docker-compose.yml            # PostgreSQL, MinIO, Redis
├── .env.example                  # Template for environment variables
├── frontend/                     # Next.js (STRICTLY frontend-only)
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   │   ├── (auth)/           # Auth route group (login, signup, reset)
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── signup/page.tsx
│   │   │   │   ├── verify-email/page.tsx
│   │   │   │   └── reset-password/page.tsx
│   │   │   ├── (app)/            # Protected route group
│   │   │   │   └── layout.tsx    # Auth guard layout
│   │   │   └── layout.tsx        # Root layout
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
│   │   │   └── auth/             # Auth-specific components
│   │   ├── lib/
│   │   │   ├── api-client.ts     # Axios/fetch wrapper with interceptors
│   │   │   ├── query-client.ts   # TanStack Query client config
│   │   │   └── utils.ts          # cn() utility, etc.
│   │   ├── hooks/
│   │   │   ├── use-auth.ts       # Auth state hook (Zustand)
│   │   │   └── queries/          # TanStack Query hooks
│   │   └── stores/
│   │       └── auth-store.ts     # Zustand auth store
│   └── public/
├── backend/                      # NestJS (ALL business logic)
│   ├── package.json
│   ├── nest-cli.json
│   ├── src/
│   │   ├── main.ts               # Bootstrap, CORS, cookie parser, validation pipe
│   │   ├── app.module.ts         # Root module
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── jwt-refresh.strategy.ts
│   │   │   │   ├── local.strategy.ts
│   │   │   │   ├── google.strategy.ts
│   │   │   │   └── apple.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── local-auth.guard.ts
│   │   │   │   ├── google-auth.guard.ts
│   │   │   │   └── email-verified.guard.ts
│   │   │   └── dto/              # Backend-only DTOs (or import from shared)
│   │   ├── email/
│   │   │   ├── email.module.ts
│   │   │   ├── email.service.ts
│   │   │   └── templates/        # React Email templates
│   │   │       ├── verification.tsx
│   │   │       └── password-reset.tsx
│   │   ├── media/
│   │   │   ├── media.module.ts
│   │   │   ├── media.controller.ts
│   │   │   ├── media.service.ts
│   │   │   ├── media.processor.ts # BullMQ worker
│   │   │   └── storage.service.ts # MinIO/S3 abstraction
│   │   └── config/
│   │       └── configuration.ts  # Typed config factory
│   └── prisma/
│       ├── schema.prisma         # Database schema
│       ├── migrations/           # Prisma migrations
│       └── seed.ts               # Dev seed data
└── packages/
    └── shared/                   # Shared types, DTOs, validators
        ├── package.json
        ├── tsconfig.json
        ├── src/
        │   ├── index.ts          # Barrel export
        │   ├── dto/
        │   │   ├── auth.dto.ts   # SignupDto, LoginDto, etc.
        │   │   └── media.dto.ts
        │   ├── types/
        │   │   ├── auth.types.ts
        │   │   └── user.types.ts
        │   ├── validators/
        │   │   └── password.ts   # Shared password validation rules
        │   └── constants/
        │       └── index.ts      # Shared constants (token expiry, file limits)
        └── tsconfig.json
```

### Pattern 1: JWT + Refresh Token with HttpOnly Cookies
**What:** Access token (short-lived, 15min) and refresh token (long-lived, 30 days) stored in HttpOnly, Secure, SameSite=Strict cookies. The backend sets cookies on login response; the frontend never touches tokens directly.
**When to use:** Every authenticated request.
**Example:**
```typescript
// backend/src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async login(user: User): Promise<TokenPair> {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(
      { sub: user.id, tokenFamily: randomUUID() },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      },
    );

    // Store refresh token hash in DB for revocation support
    await this.prisma.refreshToken.create({
      data: {
        token: await argon2.hash(refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        // Device info for multi-device support
        userAgent: /* from request */,
      },
    });

    return { accessToken, refreshToken };
  }

  setCookies(res: Response, tokens: TokenPair) {
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/api/auth/refresh', // Only sent to refresh endpoint
    });
  }
}
```

### Pattern 2: Silent Token Refresh via TanStack Query
**What:** Frontend API client detects 401, calls /api/auth/refresh, retries the original request. TanStack Query handles retry logic.
**When to use:** Every API call from the frontend.
**Example:**
```typescript
// frontend/src/lib/api-client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // CRITICAL: sends cookies cross-origin
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: Function; reject: Function }> = [];

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/auth/refresh');
        failedQueue.forEach(({ resolve }) => resolve());
        failedQueue = [];
        return apiClient(originalRequest);
      } catch (refreshError) {
        failedQueue.forEach(({ reject }) => reject(refreshError));
        failedQueue = [];
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);
```

### Pattern 3: Email Verification Gating
**What:** Users are blocked from accessing the app until their email is verified. A custom NestJS guard checks the `emailVerified` field on every protected route.
**When to use:** All protected routes except the verification endpoint itself.
**Example:**
```typescript
// backend/src/auth/guards/email-verified.guard.ts
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Email chưa được xác minh. Vui lòng kiểm tra email của bạn.',
      );
    }
    return true;
  }
}

// Usage: Stack after JwtAuthGuard
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
@Controller('posts')
export class PostsController { ... }
```

### Pattern 4: Async Media Processing with BullMQ
**What:** File upload is synchronous (returns immediately with a "processing" status), then a BullMQ worker processes the image in the background. Frontend polls or uses the processed URL once ready.
**When to use:** Every image upload.
**Example:**
```typescript
// backend/src/media/media.service.ts
@Injectable()
export class MediaService {
  constructor(
    @InjectQueue('media-processing') private mediaQueue: Queue,
    private storageService: StorageService,
  ) {}

  async uploadFile(file: Express.Multer.File, userId: string) {
    // 1. Upload original to MinIO
    const key = `originals/${userId}/${randomUUID()}-${file.originalname}`;
    await this.storageService.upload(key, file.buffer, file.mimetype);

    // 2. Create DB record
    const media = await this.prisma.media.create({
      data: {
        originalKey: key,
        userId,
        status: 'PROCESSING',
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    // 3. Queue processing job
    await this.mediaQueue.add('process-image', {
      mediaId: media.id,
      originalKey: key,
      userId,
    });

    return media;
  }
}

// backend/src/media/media.processor.ts
@Processor('media-processing')
export class MediaProcessor extends WorkerHost {
  async process(job: Job<{ mediaId: string; originalKey: string }>) {
    const { mediaId, originalKey } = job.data;
    const originalBuffer = await this.storageService.download(originalKey);

    const sizes = [
      { name: 'thumbnail', width: 150 },
      { name: 'medium', width: 600 },
      { name: 'large', width: 1080 },
    ];

    const variants: Record<string, string> = {};

    for (const size of sizes) {
      const resized = await sharp(originalBuffer)
        .resize(size.width, null, { withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      const variantKey = originalKey.replace('originals/', `${size.name}/`);
      await this.storageService.upload(variantKey, resized, 'image/webp');
      variants[size.name] = variantKey;
    }

    await this.prisma.media.update({
      where: { id: mediaId },
      data: {
        status: 'COMPLETED',
        thumbnailKey: variants.thumbnail,
        mediumKey: variants.medium,
        largeKey: variants.large,
      },
    });
  }
}
```

### Pattern 5: Shared Package for DTOs and Validation
**What:** Zod schemas defined once in `packages/shared`, used by both frontend (react-hook-form + @hookform/resolvers/zod) and backend (custom Zod validation pipe or transform to class-validator).
**When to use:** Every form/endpoint that shares validation logic.
**Example:**
```typescript
// packages/shared/src/dto/auth.dto.ts
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[a-zA-Z]/, 'Mật khẩu phải chứa chữ cái')
    .regex(/[0-9]/, 'Mật khẩu phải chứa số'),
  name: z.string().min(1, 'Tên không được để trống'),
});

export type SignupDto = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginDto = z.infer<typeof loginSchema>;
```

### Pattern 6: Turborepo Workspace Configuration
**What:** Turborepo orchestrates build/dev/lint tasks across workspaces with dependency-aware caching.
**When to use:** Monorepo task management.
**Example:**
```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

```yaml
# pnpm-workspace.yaml
packages:
  - "frontend"
  - "backend"
  - "packages/*"
```

### Anti-Patterns to Avoid
- **API routes in Next.js:** HARD RULE. All business logic goes to NestJS. Next.js is a pure SPA/SSR frontend only. No server actions for data mutation.
- **Tokens in localStorage:** XSS vulnerability. Use HttpOnly cookies exclusively. Frontend never reads or writes tokens.
- **Synchronous image processing:** Never process images in the request handler. Always queue via BullMQ for async processing.
- **Global Prisma client:** Use NestJS DI. Create PrismaService extending PrismaClient, register in PrismaModule, inject everywhere.
- **Barrel file re-exports in frontend:** Per project skills (vercel-react-best-practices), import directly to avoid bundle bloat. The shared package is an exception since it's a library.
- **Vague error messages:** User explicitly wants specific errors ("Email khong ton tai" or "Sai mat khau"). Do NOT use generic "Invalid credentials" messages.
- **Single refresh token per user:** Must support multi-device. Store refresh tokens per-session in DB with device info.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash function | `argon2` package | Timing attacks, salt management, memory-hardness parameters -- one wrong choice and passwords are vulnerable |
| Rate limiting | Custom middleware counter | `@nestjs/throttler` | Distributed state, race conditions, IP spoofing edge cases |
| File upload parsing | Custom multipart parser | `multer` via NestJS interceptors | Boundary parsing, memory limits, temp file cleanup |
| Image resizing | Custom ffmpeg/imagemagick calls | `sharp` | Memory leaks with large files, format detection, EXIF rotation, color space handling |
| Email HTML templates | String concatenation HTML | `@react-email/components` | Email client compatibility is a nightmare (Outlook, Gmail, Yahoo all render differently) |
| OAuth flows | Manual HTTP calls to Google/Apple | Passport strategies | PKCE, state parameter verification, token exchange, nonce validation |
| Job queue | Custom Redis pub/sub | BullMQ | Retry logic, dead letter queues, job priorities, worker concurrency, stalled job detection |
| CORS | Manual header setting | NestJS `app.enableCors()` | Preflight handling, credential headers, origin matching |
| Cookie security | Manual Set-Cookie headers | `cookie-parser` + NestJS `res.cookie()` | Secure flag, SameSite, path scoping, expiry management |
| Form validation | Custom regex validation | Zod schemas in shared package | Edge cases (unicode emails, password complexity), consistent messages across frontend/backend |

**Key insight:** Auth and media processing are domains where subtle bugs have severe consequences (security breaches, data loss). Every item above has known edge cases that mature libraries handle and hand-rolled solutions typically miss.

## Common Pitfalls

### Pitfall 1: CORS + Cookies Not Working
**What goes wrong:** Frontend sends requests but cookies are not attached, or backend rejects them. Auth appears broken.
**Why it happens:** Three things must all be correct simultaneously: (1) backend CORS must explicitly allow the frontend origin (not `*`), (2) backend CORS must set `credentials: true`, (3) frontend fetch/axios must set `withCredentials: true`.
**How to avoid:** Configure all three at project bootstrap and test immediately with a simple authenticated endpoint.
**Warning signs:** 401 errors on requests that should be authenticated; cookies visible in browser DevTools but not sent in requests.

### Pitfall 2: Apple Sign-In POST Callback
**What goes wrong:** Apple sends the auth callback as a POST request (not GET like Google). If the callback route only handles GET, Apple auth silently fails.
**Why it happens:** Apple's OAuth implementation differs from Google's. Apple uses `response_mode=form_post` by default.
**How to avoid:** Configure the Apple callback route to accept POST. In NestJS, ensure the controller method uses `@Post()` for the Apple callback.
**Warning signs:** Google OAuth works but Apple always fails with 404 or method-not-allowed.

### Pitfall 3: Refresh Token Rotation Race Condition
**What goes wrong:** Two concurrent requests both try to refresh the token. The first succeeds and invalidates the old refresh token. The second fails because it uses the now-invalid old token, logging the user out.
**Why it happens:** Multiple browser tabs or concurrent API calls can trigger simultaneous refresh attempts.
**How to avoid:** (1) Use a request queue on the frontend (shown in Pattern 2 above) so only one refresh is in flight at a time. (2) On the backend, implement token family tracking -- if a previously-used refresh token is reused, invalidate the entire token family (potential theft detection).
**Warning signs:** Users randomly logged out, especially when multiple tabs are open.

### Pitfall 4: Prisma Client Not Generated
**What goes wrong:** TypeScript compilation fails because Prisma types don't exist. Import `@prisma/client` shows errors.
**Why it happens:** `prisma generate` wasn't run after schema changes, or the generated client is in a different location than expected.
**How to avoid:** Add `prisma generate` as a `postinstall` script in backend's `package.json`. Also include it in the Turborepo `db:generate` task.
**Warning signs:** TypeScript errors on Prisma model types; `PrismaClient` constructor fails.

### Pitfall 5: Sharp Binary Compatibility in Docker
**What goes wrong:** Sharp works locally but crashes in Docker containers with native module errors.
**Why it happens:** Sharp uses native binaries compiled for the host OS. If `node_modules` is mounted from host into Docker, the binaries are for the wrong platform.
**How to avoid:** Install dependencies inside the Docker container, not on the host. Use multi-stage builds. Alternatively, use `--platform=linux/amd64` in Dockerfile.
**Warning signs:** `Error: Something went wrong installing the "sharp" package` in Docker logs.

### Pitfall 6: MinIO Bucket Doesn't Exist
**What goes wrong:** First upload attempt fails with "NoSuchBucket" error.
**Why it happens:** MinIO starts with no buckets. Unlike managed S3 where buckets are pre-created, local MinIO needs bucket creation.
**How to avoid:** Create an initialization script or NestJS `onModuleInit` lifecycle hook that creates the bucket if it doesn't exist. Alternatively, use `mc` CLI in Docker Compose healthcheck.
**Warning signs:** 404 errors on first file upload attempt.

### Pitfall 7: pnpm Workspace Dependency Resolution
**What goes wrong:** `packages/shared` changes are not picked up by `frontend/` or `backend/` without a full rebuild.
**Why it happens:** pnpm workspaces link packages by symlink, but TypeScript compilation needs the built output or proper `tsconfig` path mapping.
**How to avoid:** Either (a) use TypeScript project references with `composite: true`, or (b) configure the shared package with `"main": "./src/index.ts"` and have consumers use `transpilePackages` in Next.js config and proper tsconfig paths in NestJS. Option (b) is simpler for dev.
**Warning signs:** Stale types in consumers; "module not found" errors for shared imports.

### Pitfall 8: Email Verification Token Guessability
**What goes wrong:** Attacker can guess or brute-force verification tokens if they are short or sequential.
**Why it happens:** Using auto-increment IDs or short random strings as tokens.
**How to avoid:** Use `crypto.randomBytes(32).toString('hex')` for 64-character hex tokens. Store the hash (not the raw token) in the database. Compare with timing-safe comparison.
**Warning signs:** Security review flags; tokens shorter than 32 characters.

## Code Examples

### Prisma Schema for Auth
```prisma
// backend/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String    @id @default(cuid())
  email           String    @unique
  passwordHash    String?   // Null for OAuth-only users
  name            String
  emailVerified   Boolean   @default(false)
  emailVerifiedAt DateTime?

  // OAuth connections
  googleId        String?   @unique
  appleId         String?   @unique

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  refreshTokens   RefreshToken[]
  verificationTokens VerificationToken[]
  passwordResetTokens PasswordResetToken[]
  media           Media[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(cuid())
  tokenHash String   // Hashed refresh token
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userAgent String?  // Device identification
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("refresh_tokens")
}

model VerificationToken {
  id        String   @id @default(cuid())
  tokenHash String   // Hashed token
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime // 24 hours from creation
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([tokenHash])
  @@map("verification_tokens")
}

model PasswordResetToken {
  id        String   @id @default(cuid())
  tokenHash String   // Hashed token
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime // 1 hour from creation
  usedAt    DateTime?
  createdAt DateTime @default(now())

  @@index([tokenHash])
  @@map("password_reset_tokens")
}

model Media {
  id            String      @id @default(cuid())
  userId        String
  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  originalKey   String      // MinIO object key
  thumbnailKey  String?     // 150px variant
  mediumKey     String?     // 600px variant
  largeKey      String?     // 1080px variant
  mimeType      String
  size          Int         // bytes
  status        MediaStatus @default(PROCESSING)
  createdAt     DateTime    @default(now())

  @@index([userId])
  @@map("media")
}

enum MediaStatus {
  PROCESSING
  COMPLETED
  FAILED
}
```

### Docker Compose for Local Development
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: figly
      POSTGRES_PASSWORD: figly_dev
      POSTGRES_DB: figly
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"   # API
      - "9001:9001"   # Console UI
    volumes:
      - minio_data:/data

  # Create default bucket on startup
  minio-init:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      sleep 3;
      mc alias set local http://minio:9000 minioadmin minioadmin;
      mc mb local/figly-media --ignore-existing;
      mc anonymous set download local/figly-media;
      "

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### NestJS Main Bootstrap
```typescript
// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // CRITICAL for cookie-based auth
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,        // Auto-transform payloads to DTO types
    }),
  );

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
```

### Rate Limiting Configuration
```typescript
// backend/src/app.module.ts (excerpt)
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',   // General API
        ttl: 60000,      // 1 minute window
        limit: 100,      // 100 requests per minute
      },
      {
        name: 'login',   // Login endpoint
        ttl: 60000,
        limit: 5,        // 5 attempts per minute
      },
    ]),
    // ...other modules
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

// On login controller:
@Throttle({ login: { ttl: 60000, limit: 5 } })
@Post('login')
async login(@Body() dto: LoginDto) { ... }
```

### OAuth Account Linking
```typescript
// backend/src/auth/auth.service.ts (Google OAuth handling)
async handleGoogleLogin(profile: GoogleProfile): Promise<User> {
  // Check if user exists by Google ID
  let user = await this.prisma.user.findUnique({
    where: { googleId: profile.id },
  });

  if (user) return user;

  // Check if email already registered (link accounts)
  user = await this.prisma.user.findUnique({
    where: { email: profile.emails[0].value },
  });

  if (user) {
    // Link Google account to existing user
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: profile.id,
        emailVerified: true, // Google verifies email
      },
    });
  }

  // Create new user (email already verified by Google)
  return this.prisma.user.create({
    data: {
      email: profile.emails[0].value,
      name: profile.displayName,
      googleId: profile.id,
      emailVerified: true,
    },
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Passport.js session-based auth | JWT + HttpOnly cookies (stateless) | ~2022 | No server-side session store needed; scales horizontally |
| bcrypt for passwords | Argon2id (OWASP recommended) | OWASP 2023 update | Better resistance to GPU/ASIC attacks |
| Multer disk storage | Stream to object storage (MinIO/S3) | Ongoing | Avoids disk space issues, works in containers |
| Synchronous image processing | BullMQ async workers | Ongoing | Non-blocking uploads, better UX |
| localStorage for tokens | HttpOnly cookies only | Security best practice | Eliminates XSS token theft |
| Single monolithic package.json | Turborepo + pnpm workspaces | ~2023 | Faster builds, dependency isolation, better caching |
| class-validator everywhere | Zod schemas shared frontend/backend | ~2023 | Single source of truth for validation, better TypeScript inference |

**Deprecated/outdated:**
- `passport-apple` has limited maintenance -- verify it supports the current Apple Sign-In spec. If issues arise, consider `apple-signin-auth` as a lower-level alternative.
- Turborepo moved from `turbo.build` to `turborepo.dev` domain -- use new documentation URLs.
- NestJS v10 is current stable. v11 may be in preview but stick with v10 for stability.

## Open Questions

1. **Resend API key and domain verification**
   - What we know: Resend requires domain verification for production email sending. Dev mode allows limited sends to verified addresses only.
   - What's unclear: Whether the user has a domain ready for Resend verification, or if dev-mode (test sends only) is acceptable for Phase 1.
   - Recommendation: Use Resend dev mode for Phase 1. Log email content to console as fallback. Document production domain setup as a deployment task.

2. **Apple Developer Account**
   - What we know: Apple Sign-In requires an Apple Developer account ($99/year) and Service ID configuration.
   - What's unclear: Whether the user has an Apple Developer account provisioned.
   - Recommendation: Implement Apple auth with proper strategy code but make it configurable/skippable via env vars. If no Apple credentials, gracefully hide the Apple button.

3. **Google OAuth Client Credentials**
   - What we know: Google OAuth requires a project in Google Cloud Console with OAuth 2.0 credentials.
   - What's unclear: Whether the user has Google Cloud credentials ready.
   - Recommendation: Same as Apple -- implement fully but make configurable via env vars. Document setup steps.

4. **Next.js Version (14 vs 15)**
   - What we know: Next.js 15 introduced changes to caching defaults and may have breaking changes from 14.
   - What's unclear: Which version is most stable at the time of implementation.
   - Recommendation: Use Next.js 14 (stable, well-documented) unless the user specifically wants 15. Since Next.js is frontend-only here, the choice has minimal impact on the backend-heavy Phase 1.

5. **Shared Package Build Strategy**
   - What we know: The shared package needs to be consumable by both Next.js and NestJS.
   - What's unclear: Whether to use a build step (tsup/tsc) or raw TypeScript imports.
   - Recommendation: Use raw TypeScript with `"main": "./src/index.ts"` and configure `transpilePackages: ['@figly/shared']` in next.config.js. For NestJS, configure tsconfig paths. Avoids build step complexity in dev.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (NestJS default) + @nestjs/testing |
| Config file | `backend/jest.config.ts` -- needs creation in Wave 0 |
| Quick run command | `cd backend && pnpm test -- --testPathPattern=<pattern> --bail` |
| Full suite command | `pnpm turbo test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Sign up with email/password creates user, hashes password, returns tokens in cookies | integration | `cd backend && pnpm test -- --testPathPattern=auth.service.spec --bail` | Wave 0 |
| AUTH-02 | Signup triggers verification email, token validates within 24h, blocks app access until verified | integration | `cd backend && pnpm test -- --testPathPattern=email-verification.spec --bail` | Wave 0 |
| AUTH-03 | Password reset sends email, token valid for 1h, new password is hashed | integration | `cd backend && pnpm test -- --testPathPattern=password-reset.spec --bail` | Wave 0 |
| AUTH-04 | JWT access token works, refresh token rotates, cookies persist across requests | integration | `cd backend && pnpm test -- --testPathPattern=jwt-refresh.spec --bail` | Wave 0 |
| AUTH-05 | Google OAuth callback creates/links user, sets cookies | integration | `cd backend && pnpm test -- --testPathPattern=google-auth.spec --bail` | Wave 0 |
| AUTH-06 | Apple Sign-In callback (POST) creates/links user, sets cookies | integration | `cd backend && pnpm test -- --testPathPattern=apple-auth.spec --bail` | Wave 0 |
| INFRA | Media upload queues BullMQ job, worker processes and stores 3 thumbnail sizes | integration | `cd backend && pnpm test -- --testPathPattern=media.spec --bail` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && pnpm test -- --bail --testPathPattern=<relevant-module>`
- **Per wave merge:** `pnpm turbo test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/jest.config.ts` -- Jest configuration for NestJS
- [ ] `backend/test/jest-e2e.json` -- E2E test configuration
- [ ] `backend/test/setup.ts` -- Test setup (Prisma test utils, mock factories)
- [ ] `backend/src/auth/__tests__/auth.service.spec.ts` -- Auth service unit tests
- [ ] `backend/src/auth/__tests__/email-verification.spec.ts` -- Email verification flow
- [ ] `backend/src/auth/__tests__/password-reset.spec.ts` -- Password reset flow
- [ ] `backend/src/auth/__tests__/jwt-refresh.spec.ts` -- Token refresh flow
- [ ] `backend/src/auth/__tests__/google-auth.spec.ts` -- Google OAuth flow
- [ ] `backend/src/auth/__tests__/apple-auth.spec.ts` -- Apple Sign-In flow
- [ ] `backend/src/media/__tests__/media.spec.ts` -- Media upload and processing
- [ ] Framework install: `pnpm add -D jest @nestjs/testing @types/jest ts-jest` (backend)

## Sources

### Primary (HIGH confidence)
- NestJS official documentation -- authentication, Prisma recipe, BullMQ module, throttler module (training data, verified patterns)
- Prisma documentation -- schema design, migrations, client generation (training data)
- Turborepo documentation -- workspace configuration, task pipelines (training data)

### Secondary (MEDIUM confidence)
- Sharp documentation -- image processing API, resize options (training data)
- MinIO documentation -- S3-compatible API, Docker setup (training data)
- Resend + React Email documentation -- email sending API, template components (training data)
- Passport.js strategies -- google-oauth20, apple, jwt, local (training data)

### Tertiary (LOW confidence)
- Specific version numbers are based on training data (cutoff ~May 2025). Actual latest versions should be verified via `npm info <package> version` at implementation time.
- `passport-apple` maintenance status needs verification at implementation time.
- Turborepo domain migration to turborepo.dev -- verify current documentation URLs.

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM-HIGH - All libraries are well-established and commonly used together. Version numbers may be slightly stale.
- Architecture: HIGH - NestJS module patterns, JWT cookie auth, BullMQ async processing are battle-tested patterns with extensive documentation.
- Pitfalls: HIGH - These are well-documented failure modes encountered repeatedly in NestJS + auth + media processing projects.
- Validation: MEDIUM - Test patterns follow NestJS conventions but exact file structure depends on implementation decisions.

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (30 days -- stable ecosystem, no fast-moving dependencies)
**Note:** External verification tools (WebSearch, WebFetch, Context7) were unavailable during research. All findings are based on training data (cutoff ~May 2025). Version numbers should be verified with `npm info` at implementation time.
