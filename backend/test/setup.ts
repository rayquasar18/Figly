// Test setup file
// Can be expanded with test database setup, mocks, etc.

// Increase timeout for integration tests
jest.setTimeout(30000);

// Set required env vars for tests (ConfigModule.forRoot validate runs at import time)
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/figly_test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-minimum-16';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-minimum-16';
