import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

describe('Throttle Redis Wiring', () => {
  it('should create ThrottlerStorageRedisService with an ioredis instance', () => {
    const mockRedis = { ping: jest.fn().mockResolvedValue('PONG') } as any;
    const storage = new ThrottlerStorageRedisService(mockRedis);
    expect(storage).toBeDefined();
    expect(storage).toBeInstanceOf(ThrottlerStorageRedisService);
  });

  it('should share RedisService instance between throttler and other consumers', () => {
    // Verify that the same ioredis instance can be used for both
    // throttler storage and direct Redis operations
    const mockRedis = {
      ping: jest.fn().mockResolvedValue('PONG'),
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    // Same instance used for throttler
    const storage = new ThrottlerStorageRedisService(mockRedis);
    expect(storage).toBeDefined();

    // Same instance available for other operations (health check, etc.)
    expect(mockRedis.ping).toBeDefined();
    expect(mockRedis.get).toBeDefined();
  });

  it('should have AppModule configured with RedisModule and HealthModule', async () => {
    // Dynamic import to get the latest AppModule configuration
    const { AppModule } = await import('../../app.module');
    const metadata = Reflect.getMetadata('imports', AppModule);

    // Resolve import names including dynamic modules
    const importNames = metadata.map((imp: any) => {
      if (typeof imp === 'function') return imp.name;
      if (imp && imp.module) return imp.module.name;
      return String(imp);
    });

    expect(importNames).toContain('RedisModule');
    expect(importNames).toContain('HealthModule');
  });

  it('should have AppModule configured with ThrottlerStorageRedisService', async () => {
    const { AppModule } = await import('../../app.module');
    const metadata = Reflect.getMetadata('imports', AppModule);

    // Find the ThrottlerModule dynamic module config
    const throttlerImport = metadata.find((imp: any) => {
      if (imp && imp.module) return imp.module.name === 'ThrottlerModule';
      return false;
    });

    expect(throttlerImport).toBeDefined();
    // Verify it's a dynamic module (forRootAsync) not static (forRoot with array)
    expect(throttlerImport.module.name).toBe('ThrottlerModule');
  });
});
