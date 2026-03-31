import { validateEnv } from '../env.schema';

/**
 * Tests for environment validation schema (BACK-01).
 * Each test provides its own env vars -- does not rely on process.env.
 */
describe('validateEnv', () => {
  const validEnv = {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/figly',
    JWT_ACCESS_SECRET: 'super-secret-access-key-1234',
    JWT_REFRESH_SECRET: 'super-secret-refresh-key-5678',
  };

  it('throws when JWT_ACCESS_SECRET is missing', () => {
    const env = { ...validEnv };
    delete (env as any).JWT_ACCESS_SECRET;
    expect(() => validateEnv(env)).toThrow();
  });

  it('throws when JWT_REFRESH_SECRET is missing', () => {
    const env = { ...validEnv };
    delete (env as any).JWT_REFRESH_SECRET;
    expect(() => validateEnv(env)).toThrow();
  });

  it('throws when DATABASE_URL is missing', () => {
    const env = { ...validEnv };
    delete (env as any).DATABASE_URL;
    expect(() => validateEnv(env)).toThrow();
  });

  it('succeeds with all required vars present, applies defaults for optional vars', () => {
    const result = validateEnv(validEnv);
    expect(result.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    expect(result.JWT_ACCESS_SECRET).toBe(validEnv.JWT_ACCESS_SECRET);
    expect(result.JWT_REFRESH_SECRET).toBe(validEnv.JWT_REFRESH_SECRET);
    expect(result.PORT).toBe(4000);
    expect(result.NODE_ENV).toBe('development');
  });

  it('coerces PORT string "5000" to number 5000', () => {
    const env = { ...validEnv, PORT: '5000' };
    const result = validateEnv(env);
    expect(result.PORT).toBe(5000);
  });

  it('rejects invalid DATABASE_URL (not a URL format)', () => {
    const env = { ...validEnv, DATABASE_URL: 'not-a-url' };
    expect(() => validateEnv(env)).toThrow();
  });

  it('error message includes the failing field name', () => {
    const env = { ...validEnv };
    delete (env as any).JWT_ACCESS_SECRET;
    try {
      validateEnv(env);
      fail('Should have thrown');
    } catch (e: any) {
      expect(e.message).toContain('JWT_ACCESS_SECRET');
    }
  });
});
