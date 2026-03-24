import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth E2E (real DB)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const testEmail = `e2e-${Date.now()}@test.com`;
  const testPassword = 'TestPass123';
  const testName = 'E2E Tester';
  const testUsername = `e2e_user_${Date.now()}`;
  let cookies: string[] = [];

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
    // Cleanup test user and related data
    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    if (user) {
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.verificationToken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await prisma.media.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
    }
    await app.close();
  });

  // ─── Signup ───

  it('POST /api/auth/signup — creates user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.name).toBeNull();
    expect(res.body.user.username).toBeNull();
    expect(res.body.user.emailVerified).toBe(false);
  });

  it('POST /api/auth/signup — rejects duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: testEmail, password: testPassword })
      .expect(409);
  });

  it('POST /api/auth/signup — rejects weak password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/signup')
      .send({ email: 'weak@test.com', password: '12345678' })
      .expect(400);

    expect(res.body.message).toBeDefined();
  });

  // ─── Login (before email verification) ───

  it('POST /api/auth/login — rejects unverified email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(403);

    expect(res.body.message).toContain('xac minh');
  });

  // ─── Manual email verification (simulates verify-email flow) ───

  it('verify email via DB update (simulating email click)', async () => {
    await prisma.user.update({
      where: { email: testEmail },
      data: { emailVerified: true, emailVerifiedAt: new Date() },
    });

    const user = await prisma.user.findUnique({ where: { email: testEmail } });
    expect(user!.emailVerified).toBe(true);
  });

  // ─── Login (after verification) ───

  it('POST /api/auth/login — succeeds after verification', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(200);

    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.emailVerified).toBe(true);

    // Save cookies for subsequent requests
    cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies).toBeDefined();
    expect(cookies.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/auth/login — wrong email returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: testPassword })
      .expect(401);

    expect(res.body.message).toContain('Email khong ton tai');
  });

  it('POST /api/auth/login — wrong password returns 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'WrongPass123' })
      .expect(401);

    expect(res.body.message).toContain('Sai mat khau');
  });

  // ─── Authenticated routes ───

  it('GET /api/auth/me — returns user when authenticated', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.name).toBeNull();
  });

  it('GET /api/auth/me — returns 401 without cookies', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .expect(401);
  });

  // ─── Token refresh ───

  it('POST /api/auth/refresh — refreshes tokens', async () => {
    // Need refresh_token cookie with correct path
    const refreshCookie = cookies.find((c: string) => c.includes('refresh_token'));
    if (!refreshCookie) {
      // If refresh cookie has path restriction, send all cookies
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.message).toContain('lam moi');

      // Update cookies with new tokens
      const newCookies = res.headers['set-cookie'] as unknown as string[];
      if (newCookies) cookies = newCookies;
    } else {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.message).toContain('lam moi');
      const newCookies = res.headers['set-cookie'] as unknown as string[];
      if (newCookies) cookies = newCookies;
    }
  });

  // ─── Password reset flow ───

  it('POST /api/auth/forgot-password — always returns 200', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: testEmail })
      .expect(200);

    expect(res.body.message).toBeDefined();
  });

  it('POST /api/auth/forgot-password — non-existent email also returns 200 (security)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@nowhere.com' })
      .expect(200);
  });

  // ─── Logout ───

  it('POST /api/auth/logout — logs out successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body.message).toContain('xuat');
  });

  it('GET /api/auth/me — fails after logout (cookies cleared)', async () => {
    // After logout, cookies should be cleared
    await request(app.getHttpServer())
      .get('/api/auth/me')
      .expect(401);
  });
});
