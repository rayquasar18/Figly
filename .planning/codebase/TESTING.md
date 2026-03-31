# Testing Patterns

**Analysis Date:** 2026-03-20

## Test Framework

**Runner:**
- Jest (backend only)
- Config: `backend/jest.config.ts`
- Transform: `ts-jest` for TypeScript
- Test environment: `node`

**Assertion Library:**
- Jest built-in (`expect`, `toBe`, `toEqual`, `toThrow`, `toHaveBeenCalledWith`, etc.)

**Run Commands:**
```bash
pnpm test                # Run all tests via Turborepo
cd backend && pnpm test  # Backend tests only
cd backend && pnpm test:watch   # Watch mode
cd backend && pnpm test:cov     # Coverage report
```

**No frontend tests exist.** The frontend has no test framework configured.

## Test File Organization

**Location:**
- Backend unit/service tests: co-located in `__tests__/` subdirectory within each feature module
  - `src/auth/__tests__/auth.service.spec.ts`
  - `src/posts/__tests__/posts.service.spec.ts`
  - `src/feed/__tests__/feed.service.spec.ts`
  - `src/social/__tests__/social.service.spec.ts`
  - `src/media/__tests__/media.spec.ts`
  - `src/comments/__tests__/comments.service.spec.ts`
  - `src/collection/__tests__/collection.service.spec.ts`
  - `src/checklist/__tests__/checklist.service.spec.ts`
  - `src/profiles/__tests__/profiles.service.spec.ts`
- Backend E2E tests: top-level `test/` directory
  - `test/auth-e2e.spec.ts`

**Naming:**
- Unit specs: `<ServiceName>.spec.ts` or `<feature>.spec.ts`
- E2E specs: `<feature>-e2e.spec.ts`
- Jest matches: `testRegex: '.*\\.spec\\.ts$'`

## Test Structure

**Suite Organization:**
```typescript
describe('ServiceName', () => {
  let service: ServiceName;

  // Mock objects declared at describe scope
  const mockPrisma = {
    entity: {
      findUnique: jest.fn(),
      create: jest.fn(),
      // ...
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceName,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OtherDep, useValue: mockOtherDep },
      ],
    }).compile();

    service = module.get<ServiceName>(ServiceName);
    jest.clearAllMocks();  // Always cleared between tests
  });

  describe('methodName', () => {
    it('should do specific behavior', async () => {
      // Arrange: configure mock return values
      mockPrisma.entity.findUnique.mockResolvedValue({ id: 'x' });

      // Act
      const result = await service.methodName(args);

      // Assert
      expect(result).toEqual(expect.objectContaining({ id: 'x' }));
      expect(mockPrisma.entity.findUnique).toHaveBeenCalledWith({ where: { id: 'x' } });
    });
  });
});
```

**Patterns:**
- `beforeEach` rebuilds module and service fresh for every test
- `jest.clearAllMocks()` always called at end of `beforeEach` (prevents mock state leakage)
- Nested `describe` blocks group tests by method name
- `it` descriptions use "should ..." phrasing to state expected behavior

## Mocking

**Framework:** Jest built-in (`jest.fn()`, `jest.mock()`)

**Standard Prisma Mock Pattern:**
```typescript
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  post: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
};
// In tests:
mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', email: '...' });
mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
```

**ConfigService Mock Pattern:**
```typescript
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'jwt.accessSecret': 'test-access-secret',
      'minio.endpoint': 'localhost',
    };
    return config[key];
  }),
};
```

**Module-level `jest.mock()` for native modules:**
```typescript
// Top of file, before describe blocks
jest.mock('sharp', () => jest.fn(() => mockSharpInstance));
```

**What to Mock:**
- `PrismaService` — always mocked in unit tests (no real DB)
- `StorageService` — always mocked (no real MinIO)
- `JwtService`, `ConfigService`, `EmailService` — always mocked
- BullMQ queues — mocked via `'BullQueue_<queue-name>'` injection token
- `sharp` — mocked at module level for media processing tests

**What NOT to Mock:**
- The service under test itself
- NestJS testing module infrastructure
- `argon2` — used for real password hashing in some tests (validates actual hash behavior)

## Fixtures and Factories

**Test Data:**
```typescript
// Inline fixture objects defined inside test cases
const mockUser = { id: 'user-1', email: 'test@test.com', emailVerified: true };

// Factory functions defined at describe scope for reuse across tests
const createMockPost = (id: string, userId: string, overrides: any = {}) => ({
  id,
  userId,
  caption: `Post ${id}`,
  createdAt: new Date('2026-01-01'),
  user: { id: userId, username: `user_${userId}`, name: `User ${userId}`, avatar: null },
  media: [{ id: `pm-${id}`, mediaId: `media-${id}`, position: 0, media: { ... } }],
  _count: { likes: 0, comments: 0 },
  ...overrides,
});
```

**ID Conventions in Fixtures:**
- User IDs: `'user-1'`, `'user-2'`, `'author-1'`, `'viewer-1'`
- Entity IDs: `'post-1'`, `'media-1'`, `'bm-1'`, `'like-1'`, `'rt-1'`
- Test emails: `'test@test.com'`, `'nonexistent@test.com'`

**Location:** Fixtures are always inlined within test files — no shared fixture files exist.

## E2E Testing

**Pattern:** Full `INestApplication` with real DB connection against a test database.

```typescript
describe('Auth E2E (real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testEmail = `e2e-${Date.now()}@test.com`;  // Unique email per run

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Cleanup test data from real DB
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await app.close();
  });

  it('POST /api/auth/signup — creates user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: testEmail, password: 'TestPass123', name: 'Test', username: `user_${Date.now()}` })
      .expect(201);

    expect(res.body.user.email).toBe(testEmail);
  });
});
```

**E2E characteristics:**
- Uses `supertest` for HTTP assertions
- Tests are stateful — `cookies` variable passed between test cases in sequence
- `Date.now()` in test email/username ensures isolation across runs
- DB state directly manipulated via `prisma` (e.g., setting `emailVerified: true` to simulate email click)
- `beforeAll`/`afterAll` used (not `beforeEach`/`afterEach`) — single app instance for full test suite

## Coverage

**Requirements:** Not enforced (no coverage threshold configured in `jest.config.ts`)

**Collection:**
- Configured: `collectCoverageFrom: ['src/**/*.(t|j)s', '!src/main.ts']`
- Output: `backend/coverage/`

**View Coverage:**
```bash
cd backend && pnpm test:cov
```

## Test Types

**Unit Tests (primary):**
- Scope: Individual NestJS service methods
- Location: `src/<feature>/__tests__/<feature>.service.spec.ts`
- Mock: All dependencies mocked via `{ provide: X, useValue: mockX }`
- Speed: Fast (no I/O, no DB)

**E2E Tests:**
- Scope: Full HTTP request/response flow through real app with real DB
- Location: `backend/test/auth-e2e.spec.ts`
- Uses: Real `AppModule`, real `PrismaService`, `supertest`
- Only auth flow is covered by E2E tests currently

**Integration Tests:** Not present as a distinct category.

**Frontend Tests:** Not configured — no vitest, Jest, or Playwright setup in `frontend/`.

## Common Patterns

**Async Testing:**
```typescript
it('should throw NotFoundException if post does not exist', async () => {
  mockPrisma.post.findUnique.mockResolvedValue(null);

  await expect(service.getPost('nonexistent', 'viewer-1')).rejects.toThrow(NotFoundException);
});
```

**Idempotency Testing (Prisma error codes):**
```typescript
it('should handle P2002 idempotently when already liked', async () => {
  const prismaError = new Error('Unique constraint failed');
  (prismaError as any).code = 'P2002';
  mockPrisma.like.create.mockRejectedValue(prismaError);

  const result = await service.toggleLike('user-1', 'post-1', true);

  expect(result).toEqual({ success: true });
});
```

**Transaction Testing:**
```typescript
mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
// Then verify individual operations within the transaction
expect(mockPrisma.post.create).toHaveBeenCalledWith(expect.objectContaining({ ... }));
```

**Partial Object Matching:**
```typescript
expect(result).toEqual(expect.objectContaining({
  id: 'post-1',
  author: expect.objectContaining({
    username: 'testuser',
    avatarUrl: 'https://minio.local/...',
  }),
}));
```

**Sequential Mock Return Values:**
```typescript
mockJwtService.signAsync
  .mockResolvedValueOnce('access-token-123')   // First call
  .mockResolvedValueOnce('refresh-token-456'); // Second call
```

**Setup File:**
`backend/test/setup.ts` — sets Jest global timeout to `30000ms` for integration tests. Can be expanded.

---

*Testing analysis: 2026-03-20*
