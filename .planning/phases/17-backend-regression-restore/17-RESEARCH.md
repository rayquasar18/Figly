# Phase 17: Backend Regression Restore - Research

**Researched:** 2026-03-26
**Domain:** NestJS backend infrastructure restoration (gap closure)
**Confidence:** HIGH

## Summary

Phase 17 is a gap closure phase that restores backend infrastructure wiring lost during the Phase 15-01 worktree merge. Phase 13 (Backend Hardening) successfully implemented env validation, exception filter, Pino logging, health checks, Zod DTOs, response serialization, and Redis rate limiter. However, the Phase 15-01 ESLint configuration merge overwrote `app.module.ts` with its pre-Phase-13 version, reverted 3 of 7 DTO files back to class-validator, and stripped `@ZodSerializerDto` decorators from the auth controller.

The good news is that all Phase 13 **source files** still exist on disk -- the modules, filters, services, and test files are intact. Only the **wiring** in `app.module.ts`, the DTO file contents (3 of 7), and controller decorators were regressed. The `main.ts` file already has correct Swagger and Pino logger setup. All Phase 13 npm dependencies are already installed in `package.json` (nestjs-zod, nestjs-pino, pino, @nestjs/terminus, ioredis, @nest-lab/throttler-storage-redis). class-validator has already been removed from `package.json`.

**Primary recommendation:** This is a surgical wiring restoration, not a reimplementation. Restore `app.module.ts` imports/providers, rewrite 3 regressed DTO files to use `createZodDto`, add `@ZodSerializerDto` decorators to auth controller, and fix the 3 failing tests.

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                     | Research Support                                                                                                                                                   |
| ------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BACK-01 | Environment variables validated at startup using Zod schemas                    | `validateEnv` function exists in `config/env.schema.ts`; must wire into `ConfigModule.forRoot({ validate: validateEnv })` in app.module.ts                         |
| BACK-02 | Global exception filter catches all unhandled errors and returns safe responses | `AllExceptionsFilter` exists in `common/filters/all-exceptions.filter.ts`; must register as `APP_FILTER` in app.module.ts                                          |
| BACK-03 | Structured logging with Pino replaces basic NestJS Logger across all modules    | `nestjs-pino` already wired in `main.ts` (bufferLogs + useLogger); must add `LoggerModule.forRootAsync` import in app.module.ts                                    |
| BACK-04 | Health check endpoint reports database, Redis, and MinIO connectivity           | `HealthModule` exists in `health/health.module.ts`; must add to app.module.ts imports                                                                              |
| BACK-06 | DTO validation unified with nestjs-zod (class-validator duplication removed)    | 4 of 7 DTOs already correct; must rewrite auth.dto.ts, update-profile.dto.ts, checklist.dto.ts; must add `ZodValidationPipe` as `APP_PIPE`                         |
| BACK-07 | Response serialization layer strips internal fields from API responses          | `user-response.dto.ts` exists with correct schemas; must add `ZodSerializerInterceptor` as `APP_INTERCEPTOR` and `@ZodSerializerDto` decorators to auth controller |
| BACK-08 | Redis-backed rate limiter replaces in-process memory rate limiter               | `RedisModule` and `RedisService` exist; must wire `ThrottlerModule.forRootAsync` with `ThrottlerStorageRedisService` in app.module.ts                              |

</phase_requirements>

## Regression Inventory

### Current State Analysis

**Files that EXIST and are CORRECT (no changes needed):**

- `backend/src/config/env.schema.ts` -- validateEnv function, Zod schema, all correct
- `backend/src/config/__tests__/env.schema.spec.ts` -- 7 tests, all passing
- `backend/src/common/filters/all-exceptions.filter.ts` -- P2002->409, P2025->404, correct
- `backend/src/common/filters/__tests__/all-exceptions.filter.spec.ts` -- 7 tests, all passing
- `backend/src/common/dto/user-response.dto.ts` -- response schemas with createZodDto, correct
- `backend/src/common/interceptors/__tests__/serialization.spec.ts` -- 5 test groups, all passing
- `backend/src/redis/redis.module.ts` -- @Global RedisModule, correct
- `backend/src/redis/redis.service.ts` -- extends Redis with onModuleDestroy, correct
- `backend/src/health/health.module.ts` -- Terminus + 3 indicators, correct
- `backend/src/health/health.controller.ts` -- @SkipThrottle + @HealthCheck, correct
- `backend/src/health/indicators/prisma.health.ts` -- SELECT 1 check, correct
- `backend/src/health/indicators/redis.health.ts` -- ping check, correct
- `backend/src/health/indicators/minio.health.ts` -- HeadBucket check, correct
- `backend/src/health/__tests__/health.controller.spec.ts` -- 3 tests, all passing
- `backend/src/throttle/__tests__/throttle.spec.ts` -- 4 tests (2 pass, 2 fail because app.module.ts missing wiring)
- `backend/src/main.ts` -- Swagger + Pino logger setup already correct
- `backend/src/posts/dto/create-post.dto.ts` -- uses createZodDto, correct
- `backend/src/posts/dto/create-reel.dto.ts` -- uses createZodDto with extend, correct
- `backend/src/posts/dto/update-post.dto.ts` -- uses createZodDto, correct
- `backend/src/comments/dto/create-comment.dto.ts` -- uses createZodDto, correct
- `backend/src/collection/dto/collection.dto.ts` -- re-exports from @figly/shared, correct

**Files that need RESTORATION (regressed):**

| File                                             | Current State                                                                                                                                                                                     | Required State                                                                     | Issue                                                 |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `backend/src/app.module.ts`                      | Pre-Phase-13 version: static ThrottlerModule.forRoot, no RedisModule, no HealthModule, no LoggerModule, no validateEnv, no ZodValidationPipe, no AllExceptionsFilter, no ZodSerializerInterceptor | Full Phase 13 wiring with all 7 providers/imports                                  | **Primary regression** -- entire Phase 13 wiring lost |
| `backend/src/auth/dto/auth.dto.ts`               | class-validator decorators (IsEmail, IsString, etc.) with name/username fields                                                                                                                    | createZodDto wrapping @figly/shared schemas (signupSchema only has email+password) | Regressed to pre-Phase-11 version                     |
| `backend/src/profiles/dto/update-profile.dto.ts` | class-validator decorators                                                                                                                                                                        | createZodDto wrapping @figly/shared updateProfileSchema                            | Regressed to pre-Phase-13 version                     |
| `backend/src/checklist/dto/checklist.dto.ts`     | class-validator decorators                                                                                                                                                                        | createZodDto wrapping @figly/shared checklist schemas                              | Regressed to pre-Phase-13 version                     |
| `backend/src/auth/auth.controller.ts`            | No @ZodSerializerDto decorators                                                                                                                                                                   | @ZodSerializerDto on signup, login, me endpoints                                   | Decorators lost in merge                              |

### Dependencies Status (all ALREADY INSTALLED)

All Phase 13 npm dependencies are present in `backend/package.json`:

- `nestjs-zod@5.2.1` -- installed
- `nestjs-pino@4.6.1` -- installed
- `pino@10.3.1` -- installed
- `pino-http@11.0.0` -- installed
- `@nestjs/terminus@11.1.1` -- installed
- `@nestjs/swagger@11.2.6` -- installed
- `@nest-lab/throttler-storage-redis@1.2.0` -- installed
- `ioredis@5.10.1` -- installed
- `pino-pretty@13.1.3` (devDep) -- installed
- `zod@^3.25.0` -- installed

**NOT installed (already removed):**

- `class-validator` -- already removed from package.json
- `class-transformer` -- already removed from package.json

### Shared Package Schemas Available

From `packages/shared/src/index.ts` (Phase 16 renamed dto/ to schemas/):

- `signupSchema, loginSchema, resetPasswordRequestSchema, resetPasswordSchema, verifyEmailSchema` -- for auth DTOs
- `updateProfileSchema` -- for profile DTO
- `createPostSchema, updateCaptionSchema` -- for post DTOs (already using)
- `createCommentSchema` -- for comment DTO (already using)
- `createChecklistSchema, updateChecklistSchema, addChecklistEntrySchema, reorderEntriesSchema` -- for checklist DTOs
- `createReelSchema` -- for reel DTO (already using)
- `searchItemsSchema` -- for collection DTO (already re-exported)

## Architecture Patterns

### Target app.module.ts Structure

The restored `app.module.ts` must have these imports and providers, matching what Phase 13 delivered:

```typescript
// Required imports
import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_PIPE, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { validateEnv } from './config/env.schema';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';
import { HealthModule } from './health/health.module';
// ... existing feature module imports
import configuration from './config/configuration';
```

**Module imports array (order matters):**

1. `ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate: validateEnv, envFilePath: [...] })`
2. `RedisModule`
3. `LoggerModule.forRootAsync({ useFactory: (configService) => ({...pinoHttp config...}), inject: [ConfigService] })`
4. `ThrottlerModule.forRootAsync({ inject: [RedisService], useFactory: (redis) => ({ throttlers: [...], storage: new ThrottlerStorageRedisService(redis) }) })`
5. `BullModule.forRootAsync({ ... })` (existing)
6. `PrismaModule` (existing)
7. `HealthModule`
8. Feature modules (existing: AuthModule, MediaModule, etc.)

**Providers array:**

1. `{ provide: APP_FILTER, useClass: AllExceptionsFilter }`
2. `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }`
3. `{ provide: APP_PIPE, useClass: ZodValidationPipe }`
4. `{ provide: APP_GUARD, useClass: ThrottlerGuard }`

### DTO Pattern

All backend DTOs follow this pattern:

```typescript
import { createZodDto } from 'nestjs-zod';
import { someSchema } from '@figly/shared';

export class SomeDto extends createZodDto(someSchema) {}
```

### Response Serialization Pattern

Auth controller endpoints use `@ZodSerializerDto` decorator:

```typescript
import { ZodSerializerDto } from 'nestjs-zod';
import { SignupResponseDto, LoginResponseDto, MeResponseDto } from '../common/dto/user-response.dto';

@ZodSerializerDto(SignupResponseDto)
async signup(...) { ... }

@ZodSerializerDto(LoginResponseDto)
async login(...) { ... }

@ZodSerializerDto(MeResponseDto)
async me(...) { ... }
```

### Anti-Patterns to Avoid

- **Do NOT reimport class-validator:** It was already removed from package.json. The 3 regressed DTO files still reference it by source text only -- they will fail at runtime. Replace them, don't reinstall.
- **Do NOT modify main.ts:** It already has correct Swagger and Pino logger setup. Only app.module.ts needs wiring changes.
- **Do NOT change env.schema.ts or configuration.ts:** Both are correct. Only the ConfigModule.forRoot `validate` option is missing from app.module.ts.

## Failing Tests Analysis

### Test Suite Status (24 suites, 238 tests)

| Suite                  | Status     | Failures                                                                         | Root Cause                                                            | Fix Required                                        |
| ---------------------- | ---------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------- |
| `throttle.spec.ts`     | FAIL (2/4) | Tests 3,4 check AppModule metadata for RedisModule/HealthModule imports          | app.module.ts missing imports                                         | Restoring app.module.ts wiring fixes these          |
| `auth.service.spec.ts` | FAIL (1/~) | signup test sends `{ name, username }` but service expects `{ email, password }` | Pre-existing from Phase 11 (signup simplified to email+password only) | Update test mock to match current service signature |
| `auth-e2e.spec.ts`     | FAIL       | TS compile error: `user.name` is `string                                         | null`passed to`sendVerificationEmail`expecting`string`                | Type mismatch in auth.controller.ts line 42         | Fix type: pass `user.name ?? 'User'` or adjust method signature |
| All other 21 suites    | PASS       | 235 tests passing                                                                | --                                                                    | No changes needed                                   |

### auth.service.spec.ts Fix

The test at line 69-74 creates a `signupDto` with `{ email, password, name, username }` but the actual `AuthService.signup()` method (updated in Phase 11) accepts only `{ email: string; password: string }` and sets `name: null, username: null`. The test expects `data.name` to equal `signupDto.name` but gets `null`. Fix: update the test's signupDto and expectations to match the Phase 11 service signature.

### auth-e2e.spec.ts Fix

Line 42 of auth.controller.ts: `await this.authService.sendVerificationEmail(user.id, user.email, user.name)` -- `user.name` is `string | null` but the method signature may expect `string`. Fix with null coalescing: `user.name ?? 'User'` or `user.name || 'User'`. This was already documented as a Phase 11 decision: "Null-safe name pattern: user.name || 'ban' before email services".

### auth-e2e.spec.ts Additional Issue

The e2e test imports `ValidationPipe` from `@nestjs/common` and applies it (line 25: `app.useGlobalPipes(new ValidationPipe({ whitelist: true }))`). Since we're using `ZodValidationPipe` via APP_PIPE in AppModule, this e2e test should either:

1. Remove the manual `useGlobalPipes` call (since AppModule providers already register ZodValidationPipe), or
2. Override with ZodValidationPipe explicitly

The safest fix: remove line 25 since ZodValidationPipe is wired via AppModule which the e2e test imports.

## Don't Hand-Roll

| Problem            | Don't Build                            | Use Instead                                                             | Why                                                                |
| ------------------ | -------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| DTO validation     | Manual Zod parse in controllers        | `ZodValidationPipe` as APP_PIPE                                         | Handles all validation automatically via createZodDto              |
| Response stripping | Manual select/omit in every controller | `ZodSerializerInterceptor` + `@ZodSerializerDto`                        | Defense-in-depth: strips fields even if Prisma select is forgotten |
| Exception mapping  | Manual try/catch in every service      | `AllExceptionsFilter` as APP_FILTER                                     | Centralized P2002->409, P2025->404 mapping                         |
| Rate limit storage | Custom Redis throttle logic            | `ThrottlerStorageRedisService` from `@nest-lab/throttler-storage-redis` | Production-tested, integrates with NestJS ThrottlerModule          |

## Common Pitfalls

### Pitfall 1: Import Order in app.module.ts

**What goes wrong:** ConfigModule must be first (other modules depend on ConfigService). RedisModule must come before ThrottlerModule (ThrottlerModule.forRootAsync injects RedisService).
**Why it happens:** NestJS resolves dependencies at module initialization time.
**How to avoid:** Follow the exact import order: ConfigModule -> RedisModule -> LoggerModule -> ThrottlerModule -> BullModule -> PrismaModule -> HealthModule -> feature modules.
**Warning signs:** `Nest can't resolve dependencies of the ThrottlerStorageRedisService` error at startup.

### Pitfall 2: ThrottlerModule.forRootAsync vs forRoot

**What goes wrong:** Using static `ThrottlerModule.forRoot([...])` creates in-memory storage (no Redis).
**Why it happens:** The regressed app.module.ts has the old static config.
**How to avoid:** Must use `forRootAsync` with `inject: [RedisService]` and `storage: new ThrottlerStorageRedisService(redis)`.
**Warning signs:** Throttle tests 3 and 4 fail; rate limits reset on server restart.

### Pitfall 3: class-validator Imports in Regressed DTOs

**What goes wrong:** 3 DTO files import from `class-validator` which is not in package.json. They will fail at runtime with module-not-found errors.
**Why it happens:** The worktree merge reverted files to pre-Phase-13 state.
**How to avoid:** Replace all class-validator imports with createZodDto wrapping shared Zod schemas.
**Warning signs:** `Cannot find module 'class-validator'` at backend start.

### Pitfall 4: Auth DTO Schema Mismatch

**What goes wrong:** The regressed `auth.dto.ts` has `name` and `username` as required fields (old signup), but Phase 11 changed signup to email+password only.
**Why it happens:** The worktree merge reverted to pre-Phase-11 auth DTOs.
**How to avoid:** Use the shared `signupSchema` which only has email+password fields.
**Warning signs:** Signup fails with validation error requiring name/username.

### Pitfall 5: configuration.ts Already Has Fallback Defaults

**What goes wrong:** The current `configuration.ts` has `process.env.JWT_ACCESS_SECRET || 'dev-access-secret'` fallback defaults -- it was supposed to be updated in Phase 13 to remove these and rely on env validation.
**Why it happens:** configuration.ts was also reverted by the merge.
**How to avoid:** Check if configuration.ts needs updating to remove fallback defaults. However, since `validateEnv` runs first via ConfigModule.forRoot `validate`, the fallbacks in configuration.ts are dead code -- env validation will throw before configuration.ts executes with missing vars. The fallbacks are harmless but should be cleaned up for correctness.
**Warning signs:** No runtime issue, but code inspection reveals misleading fallback values.

## Code Examples

### Restored app.module.ts (complete target state)

```typescript
import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD, APP_PIPE, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { validateEnv } from './config/env.schema';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RedisModule } from './redis/redis.module';
import { RedisService } from './redis/redis.service';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MediaModule } from './media/media.module';
import { ProfilesModule } from './profiles/profiles.module';
import { SocialModule } from './social/social.module';
import { PostsModule } from './posts/posts.module';
import { CommentsModule } from './comments/comments.module';
import { FeedModule } from './feed/feed.module';
import { CollectionModule } from './collection/collection.module';
import { ChecklistModule } from './checklist/checklist.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: [join(__dirname, '..', '.env'), join(__dirname, '..', '..', '.env')],
    }),
    RedisModule,
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get('NODE_ENV') === 'production' ? 'info' : 'debug',
          transport:
            configService.get('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
              : undefined,
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      inject: [RedisService],
      useFactory: (redis: RedisService) => ({
        throttlers: [
          { name: 'short', ttl: 60000, limit: 100 },
          { name: 'login', ttl: 60000, limit: 5 },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url') || 'redis://localhost:6379';
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port || '6379', 10),
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    MediaModule,
    ProfilesModule,
    SocialModule,
    PostsModule,
    CommentsModule,
    FeedModule,
    CollectionModule,
    ChecklistModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

### Restored auth.dto.ts

```typescript
import { createZodDto } from 'nestjs-zod';
import {
  signupSchema,
  loginSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@figly/shared';

export class SignupDto extends createZodDto(signupSchema) {}
export class LoginDto extends createZodDto(loginSchema) {}
export class ResetPasswordRequestDto extends createZodDto(resetPasswordRequestSchema) {}
export class ResetPasswordDto extends createZodDto(resetPasswordSchema) {}
export class VerifyEmailDto extends createZodDto(verifyEmailSchema) {}
```

### Restored update-profile.dto.ts

```typescript
import { createZodDto } from 'nestjs-zod';
import { updateProfileSchema } from '@figly/shared';

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
```

### Restored checklist.dto.ts

```typescript
import { createZodDto } from 'nestjs-zod';
import {
  createChecklistSchema,
  updateChecklistSchema,
  addChecklistEntrySchema,
  reorderEntriesSchema,
} from '@figly/shared';

export class CreateChecklistDto extends createZodDto(createChecklistSchema) {}
export class UpdateChecklistDto extends createZodDto(updateChecklistSchema) {}
export class AddChecklistEntryDto extends createZodDto(addChecklistEntrySchema) {}
export class ReorderEntriesDto extends createZodDto(reorderEntriesSchema) {}
```

### Auth Controller Decorator Additions

```typescript
import { ZodSerializerDto } from 'nestjs-zod';
import { SignupResponseDto, LoginResponseDto, MeResponseDto } from '../common/dto/user-response.dto';

// On signup method:
@ZodSerializerDto(SignupResponseDto)
@Post('signup')
async signup(@Body() signupDto: SignupDto) { ... }

// On login method:
@ZodSerializerDto(LoginResponseDto)
@Post('login')
@HttpCode(HttpStatus.OK)
async login(...) { ... }

// On me method:
@ZodSerializerDto(MeResponseDto)
@Get('me')
@UseGuards(JwtAuthGuard)
async me(@Req() req: Request) { ... }
```

## Validation Architecture

### Test Framework

| Property           | Value                                                           |
| ------------------ | --------------------------------------------------------------- |
| Framework          | Jest 29.7                                                       |
| Config file        | `backend/jest.config.ts` or `backend/package.json` jest section |
| Quick run command  | `cd backend && npx jest --no-coverage`                          |
| Full suite command | `cd backend && npx jest --no-coverage`                          |

### Phase Requirements to Test Map

| Req ID  | Behavior                                        | Test Type   | Automated Command                                                       | File Exists?       |
| ------- | ----------------------------------------------- | ----------- | ----------------------------------------------------------------------- | ------------------ |
| BACK-01 | Env validation rejects missing secrets          | unit        | `cd backend && npx jest --testPathPattern=env.schema --no-coverage`     | Yes                |
| BACK-02 | Exception filter maps Prisma errors safely      | unit        | `cd backend && npx jest --testPathPattern=all-exceptions --no-coverage` | Yes                |
| BACK-03 | Pino logger configured in AppModule             | integration | Verify LoggerModule import in app.module.ts (manual/grep)               | N/A (wiring check) |
| BACK-04 | Health check calls 3 indicators                 | unit        | `cd backend && npx jest --testPathPattern=health --no-coverage`         | Yes                |
| BACK-06 | All DTOs use createZodDto, zero class-validator | static      | `grep -r "class-validator" backend/src/*/dto/*.ts` returns empty        | N/A (grep check)   |
| BACK-07 | Response serialization strips passwordHash      | unit        | `cd backend && npx jest --testPathPattern=serializ --no-coverage`       | Yes                |
| BACK-08 | Throttler uses Redis storage                    | unit        | `cd backend && npx jest --testPathPattern=throttle --no-coverage`       | Yes                |

### Sampling Rate

- **Per task commit:** `cd backend && npx jest --no-coverage`
- **Per wave merge:** `cd backend && npx jest --no-coverage`
- **Phase gate:** Full suite green + backend starts without errors

### Wave 0 Gaps

None -- all test files already exist. The 3 test failures are caused by the regression itself and will be fixed as part of the restoration.

## Open Questions

1. **auth.service.spec.ts test update**
   - What we know: The test sends `{ name, username }` to signup but service only accepts `{ email, password }`. This is a pre-existing failure from Phase 11 (not caused by Phase 15-01 merge).
   - What's unclear: Whether this should be fixed in Phase 17 or was already expected to fail.
   - Recommendation: Fix it in Phase 17 since Phase 17 success criteria states "All existing backend tests pass (no new failures)". This test was likely passing before the Phase 15-01 merge because that version had the old auth.dto.ts with name/username fields.

2. **configuration.ts fallback defaults**
   - What we know: The file has `|| 'dev-access-secret'` fallbacks that should have been removed in Phase 13.
   - What's unclear: Whether the Phase 15-01 merge also reverted configuration.ts.
   - Recommendation: Clean up the fallbacks since validateEnv makes them dead code. Low priority but improves code clarity.

## Sources

### Primary (HIGH confidence)

- Direct file inspection of current codebase (all files read via Read tool)
- Phase 13 plan files (13-01 through 13-04 PLAN.md) documenting exact target state
- Backend test suite execution showing 3 failures with root causes
- `backend/package.json` confirming all Phase 13 dependencies installed
- `packages/shared/src/index.ts` confirming all required Zod schemas available

### Secondary (MEDIUM confidence)

- STATE.md decisions documenting Phase 13 architectural choices
- ROADMAP.md gap closure description

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- all dependencies already installed, verified in package.json
- Architecture: HIGH -- Phase 13 plan files provide exact target state, source files all exist
- Pitfalls: HIGH -- actual test failures observed and root-caused
- Regression inventory: HIGH -- every file inspected, current vs target state documented

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable -- this is restoration, not new technology)
