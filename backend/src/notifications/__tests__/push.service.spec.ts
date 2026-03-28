import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PushService } from '../push/push.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as webpush from 'web-push';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

describe('PushService', () => {
  let service: PushService;
  let prisma: PrismaService;

  const mockPrisma = {
    pushSubscription: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'vapid.publicKey': 'test-public-key',
        'vapid.privateKey': 'test-private-key',
        'vapid.subject': 'mailto:test@test.com',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PushService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PushService>(PushService);

    // Manually trigger onModuleInit
    service.onModuleInit();

    jest.clearAllMocks();
  });

  describe('sendToUser', () => {
    it('should send web-push notification to all user subscriptions', async () => {
      const subscriptions = [
        { id: 'sub-1', userId: 'user-1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
        { id: 'sub-2', userId: 'user-1', endpoint: 'https://push.example.com/2', p256dh: 'key2', auth: 'auth2' },
      ];

      mockPrisma.pushSubscription.findMany.mockResolvedValue(subscriptions);
      (webpush.sendNotification as jest.Mock).mockResolvedValue({});

      await service.sendToUser('user-1', { title: 'Test', body: 'Hello' });

      expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
      expect(webpush.sendNotification).toHaveBeenCalledWith(
        { endpoint: 'https://push.example.com/1', keys: { p256dh: 'key1', auth: 'auth1' } },
        JSON.stringify({ title: 'Test', body: 'Hello' }),
      );
    });

    it('should handle 410 Gone by deleting expired subscription', async () => {
      const subscriptions = [
        { id: 'sub-1', userId: 'user-1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
      ];

      mockPrisma.pushSubscription.findMany.mockResolvedValue(subscriptions);
      (webpush.sendNotification as jest.Mock).mockRejectedValue({ statusCode: 410 });
      mockPrisma.pushSubscription.delete.mockResolvedValue({});

      await service.sendToUser('user-1', { title: 'Test', body: 'Hello' });

      expect(mockPrisma.pushSubscription.delete).toHaveBeenCalledWith({
        where: { id: 'sub-1' },
      });
    });

    it('should silently handle errors without crashing processor', async () => {
      const subscriptions = [
        { id: 'sub-1', userId: 'user-1', endpoint: 'https://push.example.com/1', p256dh: 'key1', auth: 'auth1' },
      ];

      mockPrisma.pushSubscription.findMany.mockResolvedValue(subscriptions);
      (webpush.sendNotification as jest.Mock).mockRejectedValue({ statusCode: 500, message: 'Server error' });

      // Should not throw
      await expect(
        service.sendToUser('user-1', { title: 'Test', body: 'Hello' }),
      ).resolves.not.toThrow();
    });
  });

  describe('saveSubscription', () => {
    it('should upsert by endpoint', async () => {
      mockPrisma.pushSubscription.upsert.mockResolvedValue({ id: 'sub-1' });

      await service.saveSubscription('user-1', {
        endpoint: 'https://push.example.com/1',
        p256dh: 'key1',
        auth: 'auth1',
      });

      expect(mockPrisma.pushSubscription.upsert).toHaveBeenCalledWith({
        where: { endpoint: 'https://push.example.com/1' },
        update: { userId: 'user-1', p256dh: 'key1', auth: 'auth1' },
        create: {
          userId: 'user-1',
          endpoint: 'https://push.example.com/1',
          p256dh: 'key1',
          auth: 'auth1',
        },
      });
    });
  });

  describe('removeSubscription', () => {
    it('should delete by endpoint + userId', async () => {
      mockPrisma.pushSubscription.deleteMany.mockResolvedValue({ count: 1 });

      await service.removeSubscription('user-1', 'https://push.example.com/1');

      expect(mockPrisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: 'https://push.example.com/1', userId: 'user-1' },
      });
    });
  });
});
