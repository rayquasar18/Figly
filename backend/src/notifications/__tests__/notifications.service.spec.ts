import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from '../notifications.service';
import { NotificationsGateway } from '../notifications.gateway';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;
  let gateway: NotificationsGateway;

  const mockPrisma = {
    notification: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    notificationActor: {
      create: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockGateway = {
    emit: jest.fn(),
  };

  const mockStorageService = {
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsGateway, useValue: mockGateway },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<NotificationsGateway>(NotificationsGateway);

    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return paginated list with cursor, sorted by updatedAt desc', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          recipientId: 'user-1',
          type: 'LIKE',
          groupKey: 'like:post-1',
          targetId: 'post-1',
          targetType: 'post',
          isRead: false,
          createdAt: new Date('2026-03-15T00:00:00Z'),
          updatedAt: new Date('2026-03-15T00:05:00Z'),
          actors: [
            {
              id: 'na-1',
              actorId: 'user-2',
              createdAt: new Date(),
              actor: {
                id: 'user-2',
                username: 'user2',
                name: 'User Two',
                avatar: null,
              },
            },
          ],
          _count: { actors: 1 },
        },
      ];

      mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.post.findMany.mockResolvedValue([]);

      const result = await service.getNotifications('user-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('notif-1');
      expect(result.items[0].type).toBe('like');
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();

      // Verify query was ordered by updatedAt desc
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'desc' },
        }),
      );
    });

    it('should filter by recipientId only (no cross-user leakage)', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.getNotifications('user-1');

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recipientId: 'user-1' },
        }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of isRead=false for a user', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { recipientId: 'user-1', isRead: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should set isRead=true for a specific notification owned by user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead('user-1', 'notif-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-1', recipientId: 'user-1' },
        data: { isRead: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should set isRead=true for all notifications of a user', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 });

      await service.markAllAsRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientId: 'user-1', isRead: false },
        data: { isRead: true },
      });
    });
  });

  describe('findGroupableNotification', () => {
    it('should return existing notification within 5-min window for same groupKey', async () => {
      const mockNotif = {
        id: 'notif-1',
        groupKey: 'like:post-1',
        recipientId: 'user-1',
        updatedAt: new Date(),
      };

      mockPrisma.notification.findFirst.mockResolvedValue(mockNotif);

      const result = await service.findGroupableNotification('like', 'post-1', 'user-1');

      expect(result).toEqual(mockNotif);
      expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            groupKey: 'like:post-1',
            recipientId: 'user-1',
            updatedAt: expect.objectContaining({
              gt: expect.any(Date),
            }),
          }),
        }),
      );
    });

    it('should return null when no match or window expired', async () => {
      mockPrisma.notification.findFirst.mockResolvedValue(null);

      const result = await service.findGroupableNotification('like', 'post-1', 'user-1');

      expect(result).toBeNull();
    });

    it('should return null when targetId is undefined (e.g. follow)', async () => {
      const result = await service.findGroupableNotification('follow', undefined, 'user-1');

      expect(result).toBeNull();
    });
  });

  describe('createNotification', () => {
    it('should persist notification with actor and emit SSE', async () => {
      const mockNotif = {
        id: 'notif-1',
        recipientId: 'user-2',
        type: 'LIKE',
        groupKey: 'like:post-1',
      };

      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        const tx = {
          notification: {
            create: jest.fn().mockResolvedValue(mockNotif),
          },
          notificationActor: {
            create: jest.fn().mockResolvedValue({ id: 'na-1' }),
          },
        };
        return cb(tx);
      });

      const result = await service.createNotification({
        type: 'like',
        actorId: 'user-1',
        recipientId: 'user-2',
        targetId: 'post-1',
        targetType: 'post',
      });

      expect(result).toBeTruthy();
      expect(result!.id).toBe('notif-1');
      expect(mockGateway.emit).toHaveBeenCalledWith('user-2', expect.objectContaining({
        data: expect.stringContaining('notification'),
      }));
    });

    it('should skip self-notification (actorId === recipientId returns early)', async () => {
      const result = await service.createNotification({
        type: 'like',
        actorId: 'user-1',
        recipientId: 'user-1',
        targetId: 'post-1',
        targetType: 'post',
      });

      expect(result).toBeNull();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockGateway.emit).not.toHaveBeenCalled();
    });
  });

  describe('addActorToGroup', () => {
    it('should add actor to existing notification, update timestamp, emit SSE', async () => {
      mockPrisma.notificationActor.create.mockResolvedValue({ id: 'na-2' });
      mockPrisma.notification.update.mockResolvedValue({
        id: 'notif-1',
        recipientId: 'user-2',
        type: 'LIKE',
        isRead: false,
        updatedAt: new Date(),
      });

      await service.addActorToGroup('notif-1', 'user-3');

      expect(mockPrisma.notificationActor.create).toHaveBeenCalledWith({
        data: {
          notificationId: 'notif-1',
          actorId: 'user-3',
        },
      });
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: expect.objectContaining({
          isRead: false,
        }),
      });
      expect(mockGateway.emit).toHaveBeenCalledWith('user-2', expect.objectContaining({
        data: expect.stringContaining('notification'),
      }));
    });

    it('should handle P2002 idempotently for duplicate actor', async () => {
      mockPrisma.notificationActor.create.mockRejectedValue({ code: 'P2002' });

      // Should not throw
      await service.addActorToGroup('notif-1', 'user-3');

      // Should not call update since actor was already in group
      expect(mockPrisma.notification.update).not.toHaveBeenCalled();
    });
  });

  describe('composeMessage', () => {
    it('should compose Vietnamese message for 1 actor like', () => {
      const msg = service.composeMessage('like', [{ displayName: 'UserA' }], 1);
      expect(msg).toBe('UserA da thich bai viet cua ban');
    });

    it('should compose Vietnamese message for 2 actors like', () => {
      const msg = service.composeMessage(
        'like',
        [{ displayName: 'UserA' }, { displayName: 'UserB' }],
        2,
      );
      expect(msg).toBe('UserA va UserB da thich bai viet cua ban');
    });

    it('should compose Vietnamese message for 3+ actors like', () => {
      const msg = service.composeMessage(
        'like',
        [{ displayName: 'UserA' }, { displayName: 'UserB' }, { displayName: 'UserC' }],
        5,
      );
      expect(msg).toBe('UserA, UserB va 3 nguoi khac da thich bai viet cua ban');
    });

    it('should compose message for comment', () => {
      const msg = service.composeMessage('comment', [{ displayName: 'UserA' }], 1);
      expect(msg).toBe('UserA da binh luan ve bai viet cua ban');
    });

    it('should compose message for reply', () => {
      const msg = service.composeMessage('reply', [{ displayName: 'UserA' }], 1);
      expect(msg).toBe('UserA da tra loi binh luan cua ban');
    });

    it('should compose message for follow', () => {
      const msg = service.composeMessage('follow', [{ displayName: 'UserA' }], 1);
      expect(msg).toBe('UserA da theo doi ban');
    });

    it('should compose message for mention', () => {
      const msg = service.composeMessage('mention', [{ displayName: 'UserA' }], 1);
      expect(msg).toBe('UserA da nhac den ban trong mot binh luan');
    });
  });
});
