# Phase 13: Backend Hardening - Research

**Researched:** 2026-03-24
**Domain:** NestJS backend production hardening (validation, logging, health, docs, security)
**Confidence:** HIGH

## Summary

Phase 13 hardens the Figly backend for production by addressing 8 requirements across environment validation, error handling, structured logging, health checks, API documentation, DTO unification, response serialization, and Redis-backed rate limiting.

The backend is a NestJS 11 application using Prisma ORM, Redis (via BullMQ), and MinIO for storage. Currently it has 7 DTO files using class-validator decorators, while the shared package (`@figly/shared`) already defines Zod schemas for the same DTOs. There is no Swagger setup, no health check endpoint, no Pino logging, no global exception filter, and the ThrottlerModule uses in-memory storage. The configuration file (`configuration.ts`) silently falls back to dev defaults for secrets like JWT keys.

**Primary recommendation:** Use `nestjs-zod` 5.2.1 as the integration layer -- it provides `createZodDto()` for DTO creation from existing Zod schemas, `ZodValidationPipe` for request validation, `ZodSerializerInterceptor` for response stripping, and `cleanupOpenApiDoc()` for Swagger/OpenAPI integration. This eliminates class-validator entirely and leverages the Zod schemas already defined in `@figly/shared`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BACK-01 | Environment variables validated at startup using Zod schemas (no fallback defaults for secrets) | Zod schema validation in configuration factory + NestJS ConfigModule `validate` option; fail-fast on missing required vars |
| BACK-02 | Global exception filter catches all unhandled errors and returns safe responses (no Prisma/internal details leaked) | Custom `AllExceptionsFilter` catches `Error`, maps Prisma `PrismaClientKnownRequestError` codes, strips stack traces |
| BACK-03 | Structured logging with Pino replaces basic NestJS Logger across all modules | nestjs-pino 4.6.1 + pino 10.3.1 + pino-http 11.0.0; request context auto-bound via AsyncLocalStorage |
| BACK-04 | Health check endpoint reports database, Redis, and MinIO connectivity | @nestjs/terminus 11.1.1 with custom health indicators for Prisma, Redis (ioredis ping), MinIO (S3 HeadBucket) |
| BACK-05 | Swagger/OpenAPI documentation auto-generated from all API endpoints | @nestjs/swagger 11.2.6 + nestjs-zod `cleanupOpenApiDoc()`; Zod DTOs auto-generate OpenAPI schemas |
| BACK-06 | DTO validation unified with nestjs-zod (class-validator duplication removed) | nestjs-zod 5.2.1 `createZodDto()` wraps existing `@figly/shared` Zod schemas; 7 class-validator DTO files replaced |
| BACK-07 | Response serialization layer strips internal fields from API responses | `ZodSerializerInterceptor` + `@ZodSerializerDto()` decorator with response Zod schemas |
| BACK-08 | Redis-backed rate limiter replaces in-process memory rate limiter | @nest-lab/throttler-storage-redis 1.2.0 with ioredis 5.10.1 |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nestjs-zod | 5.2.1 | Zod-based DTO validation + serialization + OpenAPI for NestJS | Peer supports NestJS 11 + Zod 3.25+; replaces class-validator entirely; auto-generates OpenAPI |
| @nestjs/swagger | 11.2.6 | OpenAPI/Swagger documentation | Official NestJS package; peer requires NestJS 11 |
| nestjs-pino | 4.6.1 | Structured JSON logging with request context | Peer supports NestJS 11; auto-binds request context via AsyncLocalStorage |
| pino | 10.3.1 | High-performance JSON logger | Fastest Node.js logger; structured output by default |
| pino-http | 11.0.0 | HTTP request/response logging middleware | Required peer of nestjs-pino |
| pino-pretty | 13.1.3 | Human-readable dev output | Dev-only; formats Pino JSON for terminal readability |
| @nestjs/terminus | 11.1.1 | Health check framework | Official NestJS package; supports Prisma, custom indicators |
| @nest-lab/throttler-storage-redis | 1.2.0 | Redis storage for @nestjs/throttler | Official community package by throttler maintainer (jmcdo29) |
| ioredis | 5.10.1 | Redis client | Required peer of throttler-storage-redis; more feature-rich than node-redis |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^3.25.0 | Schema validation (already present as ^3.24.0) | May need minor version bump to satisfy nestjs-zod peer requirement of ^3.25.0 |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| nestjs-zod | Manual ZodValidationPipe | nestjs-zod provides Swagger integration, serialization, and DTO class generation out of the box |
| pino | winston | Pino is 5x faster for structured JSON; winston more flexible for transports but overkill here |
| @nest-lab/throttler-storage-redis | Custom ThrottlerStorage | Community package handles edge cases (TTL, atomicity) correctly |

**Installation:**
```bash
cd backend && npm install nestjs-zod @nestjs/swagger nestjs-pino pino pino-http @nestjs/terminus @nest-lab/throttler-storage-redis ioredis && npm install -D pino-pretty @types/ioredis
```

**Zod version note:** nestjs-zod 5.2.1 requires zod `^3.25.0 || ^4.0.0`. The project currently uses `^3.24.0`. This must be bumped to `^3.25.0` in package.json before installation. Verify no breaking changes between 3.24 and 3.25 (there are none -- 3.25 is backward-compatible).

## Architecture Patterns

### Recommended Project Structure (new/modified files)
```
backend/src/
  config/
    configuration.ts      # Modified: env validation with Zod
    env.schema.ts         # NEW: Zod schema for all env vars
  common/
    filters/
      all-exceptions.filter.ts   # NEW: global exception filter
    interceptors/
      (ZodSerializerInterceptor registered in AppModule)
    pipes/
      (ZodValidationPipe registered in AppModule)
  health/
    health.module.ts          # NEW
    health.controller.ts      # NEW
    indicators/
      prisma.health.ts        # NEW
      redis.health.ts         # NEW
      minio.health.ts         # NEW
  auth/dto/
    auth.dto.ts           # Rewritten: createZodDto from shared schemas
  posts/dto/
    create-post.dto.ts    # Rewritten
    create-reel.dto.ts    # Rewritten
    update-post.dto.ts    # Rewritten
  comments/dto/
    create-comment.dto.ts # Rewritten
  profiles/dto/
    update-profile.dto.ts # Rewritten
  checklist/dto/
    checklist.dto.ts      # Rewritten
  app.module.ts           # Modified: add providers, imports
  main.ts                 # Modified: Swagger setup, Pino logger, remove ValidationPipe
```

### Pattern 1: Environment Validation with Zod (BACK-01)
**What:** Validate all environment variables at startup using a Zod schema. Required vars (JWT secrets, DATABASE_URL) have no defaults and cause immediate failure if missing.
**When to use:** Always -- runs once at boot in ConfigModule `validate` function.
**Example:**
```typescript
// backend/src/config/env.schema.ts
import { z } from 'zod';

const envSchema = z.object({
  // Required -- no defaults, app fails to start without these
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Optional with safe defaults
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // MinIO
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('figly-media'),

  // Optional services (empty string = disabled)
  RESEND_API_KEY: z.string().default(''),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  APPLE_CLIENT_ID: z.string().default(''),
  // ... other optional vars
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.issues
      .map(i => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `Environment validation failed:\n${formatted}\n\nApplication cannot start.`
    );
  }
  return result.data;
}
```

```typescript
// backend/src/config/configuration.ts -- updated
import { validateEnv, type Env } from './env.schema';

export default () => {
  // Env already validated by ConfigModule validate option
  const env = process.env as unknown as Env;
  return {
    port: Number(env.PORT) || 4000,
    frontendUrl: env.FRONTEND_URL,
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
    },
    database: { url: env.DATABASE_URL },
    redis: { url: env.REDIS_URL },
    minio: {
      endpoint: env.MINIO_ENDPOINT,
      port: Number(env.MINIO_PORT),
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      bucket: env.MINIO_BUCKET,
    },
    // ... rest same structure
  };
};

// Used in ConfigModule.forRoot({ validate: validateEnv, ... })
export { validateEnv };
```

### Pattern 2: DTO Migration from class-validator to nestjs-zod (BACK-06)
**What:** Replace class-validator DTO classes with `createZodDto()` wrapping existing `@figly/shared` Zod schemas.
**When to use:** Every DTO file that currently uses class-validator decorators.
**Example:**
```typescript
// BEFORE: backend/src/auth/dto/auth.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
export class SignupDto {
  @IsEmail({}, { message: 'Email khong hop le' })
  email!: string;
  @IsString()
  @MinLength(8, { message: 'Mat khau phai co it nhat 8 ky tu' })
  password!: string;
}

// AFTER: backend/src/auth/dto/auth.dto.ts
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

### Pattern 3: Global Exception Filter (BACK-02)
**What:** Catch all unhandled exceptions globally, map Prisma errors to safe HTTP responses, strip stack traces.
**Example:**
```typescript
// backend/src/common/filters/all-exceptions.filter.ts
import {
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Map common Prisma errors
      switch (exception.code) {
        case 'P2002': status = HttpStatus.CONFLICT; message = 'Resource already exists'; break;
        case 'P2025': status = HttpStatus.NOT_FOUND; message = 'Resource not found'; break;
        default: break; // keep 500
      }
    }

    // Log full error internally
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Pattern 4: Pino Logging Setup (BACK-03)
**What:** Replace default NestJS Logger with Pino for structured JSON output.
**Example:**
```typescript
// In AppModule imports:
LoggerModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    pinoHttp: {
      level: configService.get('NODE_ENV') === 'production' ? 'info' : 'debug',
      transport: configService.get('NODE_ENV') !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
        : undefined,
      // Redact sensitive headers
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  }),
  inject: [ConfigService],
}),

// In main.ts:
const app = await NestFactory.create(AppModule, { bufferLogs: true });
app.useLogger(app.get(Logger)); // Logger from nestjs-pino
```

### Pattern 5: Health Check with Custom Indicators (BACK-04)
**What:** `/health` endpoint checking Prisma (DB), Redis, and MinIO.
**Example:**
```typescript
// Custom Prisma health indicator
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaService) { super(); }
  async isHealthy(key: string) {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (e) {
      return this.getStatus(key, false, { message: e.message });
    }
  }
}
```

### Pattern 6: Swagger Setup (BACK-05)
**What:** Swagger UI at `/api/docs` with all endpoints documented.
**Example:**
```typescript
// In main.ts after app creation:
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

const config = new DocumentBuilder()
  .setTitle('Figly API')
  .setDescription('Figly backend API documentation')
  .setVersion('2.0')
  .addCookieAuth('access_token')
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));
```

### Pattern 7: Response Serialization (BACK-07)
**What:** Use `@ZodSerializerDto()` decorator to strip sensitive fields.
**Example:**
```typescript
// Response schema (strips passwordHash, internal IDs, etc.)
const userResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  username: z.string().nullable(),
  name: z.string().nullable(),
  emailVerified: z.boolean(),
});
class UserResponseDto extends createZodDto(userResponseSchema) {}

// In controller:
@ZodSerializerDto(UserResponseDto)
@Post('signup')
async signup(@Body() dto: SignupDto) { ... }
```

### Pattern 8: Redis-backed Rate Limiter (BACK-08)
**What:** Replace in-memory throttler storage with Redis.
**Example:**
```typescript
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';

ThrottlerModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    throttlers: [
      { name: 'short', ttl: 60000, limit: 100 },
      { name: 'login', ttl: 60000, limit: 5 },
    ],
    storage: new ThrottlerStorageRedisService(
      new Redis(configService.get<string>('redis.url'))
    ),
  }),
  inject: [ConfigService],
}),
```

### Anti-Patterns to Avoid
- **Mixing class-validator and nestjs-zod:** Remove ALL class-validator decorators. Having both validation systems active causes confusing double-validation or silent bypasses.
- **Catching and re-throwing in services:** Let exceptions propagate to the global filter. Services should throw NestJS HttpExceptions or let Prisma errors bubble up.
- **Default secrets in production:** Never fall back to `'dev-access-secret'` for JWT keys. The Zod env schema must require these with no defaults.
- **Logging request bodies containing passwords:** Pino redaction config must cover auth endpoints. Use pino-http `serializers` to strip body from auth routes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DTO validation from Zod schemas | Custom ValidationPipe + manual Zod parse | nestjs-zod `ZodValidationPipe` | Handles error formatting, integrates with Swagger, supports `@Body()`, `@Query()`, `@Params()` |
| OpenAPI from Zod schemas | Manual `@ApiProperty()` decorators on every field | nestjs-zod `createZodDto()` + `cleanupOpenApiDoc()` | Auto-generates OpenAPI schemas from Zod; no manual annotation needed |
| Structured logging | Custom logger wrapper around console.log | nestjs-pino + pino | Request context auto-bound via AsyncLocalStorage; structured JSON; no manual correlation ID passing |
| Health check framework | Custom `/health` route with try/catch | @nestjs/terminus | Standard health indicator pattern; integrates with Kubernetes probes |
| Rate limit persistence | Custom Redis counter logic | @nest-lab/throttler-storage-redis | Handles TTL atomicity, key cleanup, multi-throttler support |
| Response serialization | Manual `select` in every Prisma query | `ZodSerializerInterceptor` + response DTOs | Centralized; cannot accidentally forget to exclude a field |

**Key insight:** The project already has Zod schemas in `@figly/shared` that duplicate the class-validator DTOs in the backend. The migration path is to wrap those existing schemas with `createZodDto()` -- no new schema writing required for request validation.

## Common Pitfalls

### Pitfall 1: nestjs-zod peer dependency on zod ^3.25.0
**What goes wrong:** Installation fails because project uses zod ^3.24.0.
**Why it happens:** nestjs-zod 5.x requires zod ^3.25.0 for better OpenAPI support and codec features.
**How to avoid:** Bump zod version to ^3.25.0 in backend/package.json AND packages/shared/package.json before installing nestjs-zod.
**Warning signs:** npm install errors mentioning peer dependency conflict.

### Pitfall 2: Double validation pipe conflict
**What goes wrong:** Both NestJS built-in `ValidationPipe` (class-validator) and `ZodValidationPipe` are active, causing confusing behavior.
**Why it happens:** `main.ts` currently registers `app.useGlobalPipes(new ValidationPipe(...))`. If not removed, both pipes run.
**How to avoid:** Remove the `ValidationPipe` from `main.ts` when adding `ZodValidationPipe` in AppModule providers. Remove `class-validator` and `class-transformer` packages entirely after migration.
**Warning signs:** Validation errors appearing twice or in wrong format.

### Pitfall 3: ConfigModule validate vs. configuration factory
**What goes wrong:** Env validated by ConfigModule `validate`, but `configuration.ts` still reads `process.env` with fallback defaults, bypassing validation.
**Why it happens:** Two separate code paths for reading env vars.
**How to avoid:** The `validate` function returns validated/typed env. The `configuration()` factory should receive the validated result through ConfigModule, not re-read process.env. Use `ConfigModule.forRoot({ validate: validateEnv, load: [configuration] })` where `configuration` relies on the validated env.
**Warning signs:** App starts despite missing required vars.

### Pitfall 4: Health check endpoint rate-limited
**What goes wrong:** The global `ThrottlerGuard` blocks health check probes from orchestrators that send frequent requests.
**Why it happens:** Health checks from Kubernetes/Docker hit `/api/health` rapidly.
**How to avoid:** Add `@SkipThrottle()` decorator on HealthController.
**Warning signs:** Health probe returns 429 Too Many Requests.

### Pitfall 5: Swagger UI path conflict with API prefix
**What goes wrong:** Swagger UI inaccessible because app has `setGlobalPrefix('api')` and Swagger is set to `'api/docs'`, resulting in actual path being `/api/api/docs`.
**Why it happens:** `SwaggerModule.setup` path is relative to the root, not the global prefix.
**How to avoid:** Use `SwaggerModule.setup('api/docs', ...)` and it will correctly serve at `/api/docs` since the path already includes the prefix. Or exclude the docs path from the global prefix.
**Warning signs:** 404 when accessing `/api/docs`.

### Pitfall 6: Prisma error details leaking in responses
**What goes wrong:** Unhandled Prisma errors reveal table names, column names, constraint names in the response body.
**Why it happens:** Without a global exception filter, NestJS returns the raw error message.
**How to avoid:** The `AllExceptionsFilter` catches Prisma errors and returns generic messages. Never pass `error.message` from Prisma to the client.
**Warning signs:** Client receiving error responses containing "Unique constraint failed on the fields: (`email`)" or similar.

### Pitfall 7: Existing tests break after removing class-validator
**What goes wrong:** Tests that mock ValidationPipe behavior or assert specific validation error formats fail.
**Why it happens:** nestjs-zod throws `ZodValidationException` instead of `BadRequestException` with class-validator format.
**How to avoid:** Update test expectations for the new error format. ZodValidationException returns `{ statusCode: 400, message: "Validation failed", errors: [...] }`.
**Warning signs:** Tests passing locally but failing in CI due to different error response shapes.

### Pitfall 8: ioredis connection handling
**What goes wrong:** App hangs on shutdown or during health checks because Redis connection not properly closed.
**Why it happens:** ioredis connections need explicit cleanup.
**How to avoid:** Create a shared ioredis instance (e.g., in a RedisModule) that implements `OnModuleDestroy` to call `redis.quit()`. Share this instance between ThrottlerStorage and HealthIndicator.
**Warning signs:** Process hanging on `SIGTERM`, or connection pool exhaustion.

## Code Examples

### DTO File Migration (all 7 files follow same pattern)

```typescript
// backend/src/posts/dto/create-post.dto.ts
import { createZodDto } from 'nestjs-zod';
import { createPostSchema } from '@figly/shared';

export class CreatePostDto extends createZodDto(createPostSchema) {}
```

```typescript
// backend/src/posts/dto/create-reel.dto.ts
import { createZodDto } from 'nestjs-zod';
import { createReelSchema } from '@figly/shared';

export class CreateReelDto extends createZodDto(createReelSchema) {}
```

```typescript
// backend/src/posts/dto/update-post.dto.ts
import { createZodDto } from 'nestjs-zod';
import { updateCaptionSchema } from '@figly/shared';

export class UpdatePostDto extends createZodDto(updateCaptionSchema) {}
```

```typescript
// backend/src/comments/dto/create-comment.dto.ts
import { createZodDto } from 'nestjs-zod';
import { createCommentSchema } from '@figly/shared';

export class CreateCommentDto extends createZodDto(createCommentSchema) {}
```

```typescript
// backend/src/profiles/dto/update-profile.dto.ts
import { createZodDto } from 'nestjs-zod';
import { updateProfileSchema } from '@figly/shared';

export class UpdateProfileDto extends createZodDto(updateProfileSchema) {}
```

```typescript
// backend/src/checklist/dto/checklist.dto.ts
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

### AppModule Full Setup

```typescript
// Updated app.module.ts
import { APP_GUARD, APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { LoggerModule } from 'nestjs-pino';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HealthModule } from './health/health.module';
import { validateEnv } from './config/env.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: [/* ... */],
    }),
    LoggerModule.forRootAsync({
      useFactory: (cs: ConfigService) => ({
        pinoHttp: {
          level: cs.get('NODE_ENV') === 'production' ? 'info' : 'debug',
          transport: cs.get('NODE_ENV') !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
            : undefined,
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      useFactory: (cs: ConfigService) => ({
        throttlers: [
          { name: 'short', ttl: 60000, limit: 100 },
          { name: 'login', ttl: 60000, limit: 5 },
        ],
        storage: new ThrottlerStorageRedisService(new Redis(cs.get('redis.url'))),
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    // ... existing modules
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
```

### DTO Files Inventory (what changes)

| File | Current | After | Shared Schema Used |
|------|---------|-------|--------------------|
| `auth/dto/auth.dto.ts` | 5 classes, class-validator | 5 classes via `createZodDto` | signupSchema, loginSchema, resetPasswordRequestSchema, resetPasswordSchema, verifyEmailSchema |
| `posts/dto/create-post.dto.ts` | 1 class, class-validator | 1 class via `createZodDto` | createPostSchema |
| `posts/dto/create-reel.dto.ts` | 1 class, class-validator | 1 class via `createZodDto` | createReelSchema |
| `posts/dto/update-post.dto.ts` | 1 class, class-validator | 1 class via `createZodDto` | updateCaptionSchema |
| `comments/dto/create-comment.dto.ts` | 1 class, class-validator | 1 class via `createZodDto` | createCommentSchema |
| `profiles/dto/update-profile.dto.ts` | 1 class, class-validator | 1 class via `createZodDto` | updateProfileSchema |
| `checklist/dto/checklist.dto.ts` | 4 classes, class-validator | 4 classes via `createZodDto` | createChecklistSchema, updateChecklistSchema, addChecklistEntrySchema, reorderEntriesSchema |
| `collection/dto/collection.dto.ts` | Re-export from shared (already Zod) | No change needed | searchItemsSchema |

**Total: 7 files to rewrite, 14 DTO classes to migrate, 1 file already correct.**

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| class-validator + class-transformer DTOs | nestjs-zod `createZodDto()` from Zod schemas | nestjs-zod v5 (2025) | Single source of truth for validation, types, and OpenAPI |
| Manual `@ApiProperty()` decorators for Swagger | Auto-generated from Zod schemas via nestjs-zod | nestjs-zod v5 | No manual annotation needed |
| NestJS built-in Logger (console output) | nestjs-pino structured JSON | Standard since 2022 | Log aggregation ready (ELK, Datadog, etc.) |
| In-memory rate limit storage | Redis-backed via @nest-lab/throttler-storage-redis | @nestjs/throttler v5+ | Survives restarts, works across multiple instances |
| process.env with fallback defaults | Zod schema validation at startup | ConfigModule `validate` option | Fail-fast on missing critical config |

**Deprecated/outdated:**
- `@nestjs/swagger` manual `@ApiProperty()` is still supported but unnecessary when using nestjs-zod
- class-validator approach is not deprecated but creates duplication when Zod schemas exist
- `@nest-zod/z` (extended Zod) is deprecated in nestjs-zod v5 -- use standard Zod

## Open Questions

1. **Response serialization scope**
   - What we know: `ZodSerializerInterceptor` works per-controller-method via `@ZodSerializerDto()` decorator
   - What's unclear: Some endpoints return simple objects without a formal response type. Do ALL endpoints need response DTOs, or only those handling user data?
   - Recommendation: Start with endpoints that return user data (where passwordHash could leak): auth, profiles, posts with author info. Add response DTOs incrementally.

2. **Shared ioredis instance**
   - What we know: Both ThrottlerStorageRedis and health check need Redis connections. BullMQ also uses Redis.
   - What's unclear: Whether to create a shared RedisModule or let each consumer create its own connection.
   - Recommendation: Create a shared `RedisModule` that provides a singleton ioredis instance, used by ThrottlerStorage and HealthIndicator. BullMQ can keep its own connection (different config path).

3. **Swagger authentication for cookie-based auth**
   - What we know: App uses httpOnly cookies, not Bearer tokens. Swagger UI typically uses Bearer auth for "Try it out".
   - What's unclear: How to make Swagger "Try it out" work with cookie auth.
   - Recommendation: Add `addCookieAuth('access_token')` in DocumentBuilder. For manual testing, users can log in via the Swagger UI login endpoint which sets cookies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + ts-jest 29.2.0 |
| Config file | `backend/jest.config.ts` |
| Quick run command | `cd backend && npx jest --testPathPattern={pattern} --no-coverage` |
| Full suite command | `cd backend && npx jest --no-coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BACK-01 | App refuses to start with missing JWT_ACCESS_SECRET | unit | `cd backend && npx jest --testPathPattern=env.schema --no-coverage` | Wave 0 |
| BACK-01 | App refuses to start with missing DATABASE_URL | unit | `cd backend && npx jest --testPathPattern=env.schema --no-coverage` | Wave 0 |
| BACK-02 | Unhandled Prisma P2002 returns 409, no internals | unit | `cd backend && npx jest --testPathPattern=all-exceptions --no-coverage` | Wave 0 |
| BACK-02 | Unknown exception returns 500 with safe message | unit | `cd backend && npx jest --testPathPattern=all-exceptions --no-coverage` | Wave 0 |
| BACK-03 | Log output is JSON with req context | smoke | Manual: start server, make request, verify stdout is JSON | manual-only (log format is runtime behavior) |
| BACK-04 | GET /api/health returns DB, Redis, MinIO status | integration | `cd backend && npx jest --testPathPattern=health --no-coverage` | Wave 0 |
| BACK-05 | GET /api/docs returns Swagger HTML | smoke | Manual: start server, curl /api/docs | manual-only (requires running server) |
| BACK-06 | Auth signup DTO validates with Zod (no class-validator) | unit | `cd backend && npx jest --testPathPattern=auth --no-coverage` | Existing (update) |
| BACK-07 | Response does not include passwordHash | unit | `cd backend && npx jest --testPathPattern=serializ --no-coverage` | Wave 0 |
| BACK-08 | Rate limiter uses Redis storage | unit | `cd backend && npx jest --testPathPattern=throttle --no-coverage` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd backend && npx jest --no-coverage`
- **Per wave merge:** `cd backend && npx jest --no-coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/config/__tests__/env.schema.spec.ts` -- covers BACK-01
- [ ] `backend/src/common/filters/__tests__/all-exceptions.filter.spec.ts` -- covers BACK-02
- [ ] `backend/src/health/__tests__/health.controller.spec.ts` -- covers BACK-04
- [ ] `backend/src/common/interceptors/__tests__/serialization.spec.ts` -- covers BACK-07

## Sources

### Primary (HIGH confidence)
- npm registry: `nestjs-zod@5.2.1` -- peer deps verified: `@nestjs/common ^10.0.0 || ^11.0.0`, `@nestjs/swagger ^7.4.2 || ^8.0.0 || ^11.0.0`, `zod ^3.25.0 || ^4.0.0`
- npm registry: `nestjs-pino@4.6.1` -- peer deps verified: `@nestjs/common ^8-11`, `pino ^7-10`, `pino-http ^6-11`
- npm registry: `@nestjs/terminus@11.1.1` -- peer deps verified: `@nestjs/common ^10-11`, `@prisma/client *`
- npm registry: `@nestjs/swagger@11.2.6` -- peer deps verified: `@nestjs/common ^11.0.1`
- npm registry: `@nest-lab/throttler-storage-redis@1.2.0` -- peer deps verified: `@nestjs/throttler >=6.0.0`, `ioredis >=5.0.0`
- nestjs-zod README (via `npm view readme`) -- createZodDto, ZodValidationPipe, ZodSerializerInterceptor, cleanupOpenApiDoc documented
- nestjs-pino README (via `npm view readme`) -- LoggerModule.forRoot/forRootAsync, Logger injection, structured output documented

### Secondary (MEDIUM confidence)
- Codebase analysis: 7 DTO files with class-validator, corresponding Zod schemas in @figly/shared verified
- Codebase analysis: Current configuration.ts uses fallback defaults for secrets
- Codebase analysis: No existing Swagger, health check, Pino, or nestjs-zod usage in backend

### Tertiary (LOW confidence)
- None -- all findings verified through npm registry and codebase inspection

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified via npm registry with peer dependency compatibility for NestJS 11
- Architecture: HIGH - Patterns derived from official package READMEs and existing codebase structure
- Pitfalls: HIGH - Based on concrete codebase analysis (e.g., known ValidationPipe in main.ts, zod version mismatch)
- DTO migration: HIGH - Every class-validator DTO file inspected; corresponding shared Zod schema verified to exist

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable ecosystem, no fast-moving dependencies)
