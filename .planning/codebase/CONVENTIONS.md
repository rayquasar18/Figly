# Coding Conventions

**Analysis Date:** 2026-03-20

## Naming Patterns

**Files:**
- Backend: `kebab-case.ts` for all source files (e.g., `auth.service.ts`, `create-post.dto.ts`, `feed.service.ts`)
- Backend tests: `__tests__/` subdirectory, named `<subject>.spec.ts` (e.g., `auth.service.spec.ts`, `posts.service.spec.ts`)
- Frontend pages: `page.tsx` inside Next.js App Router route segments (e.g., `app/(auth)/login/page.tsx`)
- Frontend components: `kebab-case.tsx` (e.g., `post-card.tsx`, `login-form.tsx`, `feed-list.tsx`)
- Frontend hooks: `use-<name>.ts` for custom hooks (e.g., `use-auth.ts`, `use-toast.ts`)
- Frontend query hooks: grouped in `hooks/queries/<domain>-queries.ts` (e.g., `post-queries.ts`, `auth-queries.ts`)
- Frontend stores: `<domain>-store.ts` (e.g., `auth-store.ts`, `create-post-store.ts`)

**Functions/Methods:**
- camelCase everywhere: `createPost`, `getFeed`, `toggleLike`, `validateUser`
- Async service methods always return typed values
- React components: PascalCase named exports (e.g., `export function PostCard(...)`, `export function FeedList()`)
- React page components: PascalCase default export (e.g., `export default function LoginPage()`)

**Variables:**
- camelCase for all variables and parameters
- Mock variables prefixed with `mock` in tests (e.g., `mockPrisma`, `mockJwtService`, `mockStorageService`)
- Boolean state: `is` prefix (e.g., `isLiked`, `isBookmarked`, `isFollowing`, `isLoading`)

**Classes/Types:**
- DTOs: PascalCase with `Dto` suffix (e.g., `SignupDto`, `CreatePostDto`, `UpdateProfileDto`)
- NestJS services: `PascalCase` + `Service` suffix (e.g., `AuthService`, `PostsService`, `FeedService`)
- NestJS controllers: `PascalCase` + `Controller` suffix (e.g., `AuthController`, `PostsController`)
- Interfaces: PascalCase without prefix/suffix (e.g., `PostResponse`, `PostAuthor`, `AuthState`)
- Zod schema variables: camelCase + `Schema` suffix (e.g., `loginSchema`, `signupSchema`, `usernameSchema`)

## Code Style

**TypeScript:**
- `strict: true` in both frontend and backend tsconfigs
- Definite assignment assertions (`!`) used on required DTO fields (e.g., `email!: string`)
- `type` keyword for type-only imports: `import type { PostResponse } from '@figly/shared'`
- Typed catch clauses: `catch (error: any)` when accessing error properties
- Type assertions used for third-party integration types (e.g., `req.user as any`)

**Formatting:**
- No ESLint/Prettier config detected — formatting is consistent but unconfigured
- Trailing commas in multi-line objects and arrays
- Single quotes for string literals (TypeScript/JavaScript)
- 2-space indentation throughout

**Comments:**
- Section dividers with `// ---------------------` pattern for grouping related methods in long services
- Inline comments explain non-obvious logic (e.g., `// CRITICAL: send cookies for auth`)
- Test comments explain behavioral intent (e.g., `// Verify password was hashed (not stored plaintext)`)

## Import Organization

**Backend (NestJS):**
1. NestJS framework imports (`@nestjs/common`, `@nestjs/jwt`, etc.)
2. Third-party packages (`argon2`, `crypto`, etc.)
3. Internal services/modules (relative paths with `../`)
4. Local DTOs and types (relative paths with `./`)
5. Shared package (`@figly/shared`)

**Frontend (React/Next.js):**
1. React hooks (`react`)
2. Next.js modules (`next/link`, `next/navigation`)
3. Third-party packages (`date-fns`, `lucide-react`, `axios`)
4. Internal UI components (`@/components/ui/...`)
5. Feature components (relative `./` imports)
6. Internal stores (`@/stores/...`)
7. Internal hooks (`@/hooks/...`)
8. Shared types (`@figly/shared`) — always as `import type`

**Path Aliases:**
- `@/*` maps to `src/*` in both frontend and backend
- `@figly/shared` maps to the shared monorepo package in both

## Error Handling

**Backend NestJS Services:**
- Throw typed NestJS HTTP exceptions directly from service layer:
  - `NotFoundException` — resource not found
  - `ForbiddenException` — ownership/authorization violation
  - `ConflictException` — uniqueness violations (duplicate email, username)
  - `BadRequestException` — invalid input not caught by validation pipe
  - `UnauthorizedException` — credential failures
  - `PayloadTooLargeException` — file size violations
- Prisma error codes handled explicitly:
  - `P2002` (unique constraint) — returned as `{ success: true }` for idempotent operations (like/bookmark/follow)
  - `P2025` (record not found on delete) — returned as `{ success: true }` for idempotent removes
- Error messages are in Vietnamese (transliterated, no diacritics): `'Email khong ton tai'`, `'Sai mat khau'`

**Frontend:**
- `AxiosError` checked with `instanceof` before reading `.response.data.message`
- Server error messages displayed in a red alert `<div>` above form fields using local `useState<string | null>`
- Auth failures in `use-auth.ts` silently call `clearUser()` (no rethrow)
- API client auto-refreshes on 401 via response interceptor in `src/lib/api-client.ts`
- Queue pattern prevents concurrent refresh storms (see `failedQueue` in `api-client.ts`)

## Validation

**Backend:**
- `class-validator` decorators on DTO classes (e.g., `@IsEmail`, `@MinLength`, `@Matches`, `@IsArray`)
- Global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` in `src/main.ts`
- Custom error messages in Vietnamese on every validator decorator

**Frontend:**
- Zod schemas defined in `packages/shared/src/dto/` — shared between frontend and backend types
- `react-hook-form` with `zodResolver` for form validation
- Schema-inferred TypeScript types: `type LoginDto = z.infer<typeof loginSchema>`

## Module Design

**Backend:**
- Each feature is a NestJS module in its own directory: `src/<feature>/`
- Module structure: `<feature>.module.ts`, `<feature>.service.ts`, `<feature>.controller.ts`, `dto/`, `__tests__/`
- Services injected via constructor DI using `private readonly` (e.g., `private prisma: PrismaService`)

**Frontend:**
- Components grouped by feature domain under `src/components/<domain>/`
- React Query mutations defined in `hooks/queries/<domain>-queries.ts` and consumed in components
- Zustand stores in `src/stores/<domain>-store.ts` for global client state
- No barrel index files — direct named imports

## Logging

**Backend:**
- NestJS `Logger` class used in infrastructure services: `new Logger(MediaProcessor.name)`
- Only `media.processor.ts` and `storage.service.ts` use structured logging
- Business logic services use no logging — exceptions propagate to NestJS exception filter
- `console.log` used only in `src/main.ts` for startup message

---

*Convention analysis: 2026-03-20*
