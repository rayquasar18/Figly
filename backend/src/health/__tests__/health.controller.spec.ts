import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, HealthCheckResult } from '@nestjs/terminus';
import { HealthController } from '../health.controller';
import { PrismaHealthIndicator } from '../indicators/prisma.health';
import { RedisHealthIndicator } from '../indicators/redis.health';
import { MinioHealthIndicator } from '../indicators/minio.health';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let prismaHealth: PrismaHealthIndicator;
  let redisHealth: RedisHealthIndicator;
  let minioHealth: MinioHealthIndicator;

  beforeEach(async () => {
    const mockPrismaHealth = {
      isHealthy: jest.fn().mockResolvedValue({
        database: { status: 'up' },
      }),
    };

    const mockRedisHealth = {
      isHealthy: jest.fn().mockResolvedValue({
        redis: { status: 'up' },
      }),
    };

    const mockMinioHealth = {
      isHealthy: jest.fn().mockResolvedValue({
        minio: { status: 'up' },
      }),
    };

    const mockHealthCheckService = {
      check: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: PrismaHealthIndicator, useValue: mockPrismaHealth },
        { provide: RedisHealthIndicator, useValue: mockRedisHealth },
        { provide: MinioHealthIndicator, useValue: mockMinioHealth },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    prismaHealth = module.get<PrismaHealthIndicator>(PrismaHealthIndicator);
    redisHealth = module.get<RedisHealthIndicator>(RedisHealthIndicator);
    minioHealth = module.get<MinioHealthIndicator>(MinioHealthIndicator);
  });

  it('should call HealthCheckService.check with all three indicators', async () => {
    const expectedResult: HealthCheckResult = {
      status: 'ok',
      info: {
        database: { status: 'up' },
        redis: { status: 'up' },
        minio: { status: 'up' },
      },
      error: {},
      details: {
        database: { status: 'up' },
        redis: { status: 'up' },
        minio: { status: 'up' },
      },
    };

    (healthCheckService.check as jest.Mock).mockImplementation(
      async (indicators: (() => Promise<any>)[]) => {
        // Execute all indicator functions to verify they are called
        for (const indicator of indicators) {
          await indicator();
        }
        return expectedResult;
      },
    );

    const result = await controller.check();

    expect(result).toEqual(expectedResult);
    expect(healthCheckService.check).toHaveBeenCalledTimes(1);
    expect(prismaHealth.isHealthy).toHaveBeenCalledWith('database');
    expect(redisHealth.isHealthy).toHaveBeenCalledWith('redis');
    expect(minioHealth.isHealthy).toHaveBeenCalledWith('minio');
  });

  it('should return error status when an indicator fails', async () => {
    const errorResult: HealthCheckResult = {
      status: 'error',
      info: {
        database: { status: 'up' },
        redis: { status: 'up' },
      },
      error: {
        minio: { status: 'down', message: 'Connection refused' },
      },
      details: {
        database: { status: 'up' },
        redis: { status: 'up' },
        minio: { status: 'down', message: 'Connection refused' },
      },
    };

    (healthCheckService.check as jest.Mock).mockResolvedValue(errorResult);

    const result = await controller.check();

    expect(result.status).toBe('error');
    expect(result.error).toHaveProperty('minio');
    expect(result.error!['minio']).toEqual({
      status: 'down',
      message: 'Connection refused',
    });
  });

  it('should pass exactly 3 health check functions to HealthCheckService', async () => {
    (healthCheckService.check as jest.Mock).mockResolvedValue({
      status: 'ok',
      info: {},
      error: {},
      details: {},
    });

    await controller.check();

    const checkFns = (healthCheckService.check as jest.Mock).mock.calls[0][0];
    expect(checkFns).toHaveLength(3);
    expect(typeof checkFns[0]).toBe('function');
    expect(typeof checkFns[1]).toBe('function');
    expect(typeof checkFns[2]).toBe('function');
  });
});
