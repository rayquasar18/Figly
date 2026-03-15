import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsProcessor } from '../notifications.processor';
import { NotificationsService } from '../notifications.service';
import { NotificationsGateway } from '../notifications.gateway';
import { PushService } from '../push/push.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('NotificationsProcessor', () => {
  let processor: NotificationsProcessor;
  let notificationsService: NotificationsService;
  let pushService: PushService;
  let prisma: PrismaService;

  const mockNotificationsService = {
    findGroupableNotification: jest.fn(),
    createNotification: jest.fn(),
    addActorToGroup: jest.fn(),
  };

  const mockPushService = {
    sendToUser: jest.fn(),
  };

  const mockGateway = {
    emit: jest.fn(),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsProcessor,
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: NotificationsGateway, useValue: mockGateway },
        { provide: PushService, useValue: mockPushService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    processor = module.get<NotificationsProcessor>(NotificationsProcessor);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    pushService = module.get<PushService>(PushService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should create notification for a like job', async () => {
    mockNotificationsService.findGroupableNotification.mockResolvedValue(null);
    mockNotificationsService.createNotification.mockResolvedValue({ id: 'notif-1' });
    mockPrisma.user.findUnique.mockResolvedValue({ name: 'UserA', username: 'usera' });
    mockPushService.sendToUser.mockResolvedValue(undefined);

    const job = {
      data: {
        type: 'like',
        actorId: 'user-1',
        recipientId: 'user-2',
        targetId: 'post-1',
        targetType: 'post',
      },
    } as any;

    await processor.process(job);

    expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(job.data);
    expect(mockPushService.sendToUser).toHaveBeenCalledWith('user-2', expect.objectContaining({
      title: 'Figly',
      body: expect.stringContaining('da thich bai viet cua ban'),
    }));
  });

  it('should skip when actorId === recipientId (self-notification guard)', async () => {
    const job = {
      data: {
        type: 'like',
        actorId: 'user-1',
        recipientId: 'user-1',
        targetId: 'post-1',
        targetType: 'post',
      },
    } as any;

    await processor.process(job);

    expect(mockNotificationsService.findGroupableNotification).not.toHaveBeenCalled();
    expect(mockNotificationsService.createNotification).not.toHaveBeenCalled();
    expect(mockPushService.sendToUser).not.toHaveBeenCalled();
  });

  it('should add actor to group when groupable notification exists', async () => {
    const existingNotif = { id: 'notif-existing' };
    mockNotificationsService.findGroupableNotification.mockResolvedValue(existingNotif);
    mockNotificationsService.addActorToGroup.mockResolvedValue({ id: 'notif-existing' });
    mockPrisma.user.findUnique.mockResolvedValue({ name: 'UserB', username: 'userb' });
    mockPushService.sendToUser.mockResolvedValue(undefined);

    const job = {
      data: {
        type: 'like',
        actorId: 'user-3',
        recipientId: 'user-2',
        targetId: 'post-1',
        targetType: 'post',
      },
    } as any;

    await processor.process(job);

    expect(mockNotificationsService.addActorToGroup).toHaveBeenCalledWith('notif-existing', 'user-3');
    expect(mockNotificationsService.createNotification).not.toHaveBeenCalled();
  });

  it('should call pushService.sendToUser after notification creation', async () => {
    mockNotificationsService.findGroupableNotification.mockResolvedValue(null);
    mockNotificationsService.createNotification.mockResolvedValue({ id: 'notif-1' });
    mockPrisma.user.findUnique.mockResolvedValue({ name: 'UserA', username: 'usera' });
    mockPushService.sendToUser.mockResolvedValue(undefined);

    const job = {
      data: {
        type: 'comment',
        actorId: 'user-1',
        recipientId: 'user-2',
        targetId: 'post-1',
        targetType: 'post',
      },
    } as any;

    await processor.process(job);

    expect(mockPushService.sendToUser).toHaveBeenCalledWith('user-2', {
      title: 'Figly',
      body: 'UserA da binh luan ve bai viet cua ban',
      url: '/post/post-1',
    });
  });

  it('should compose correct push message for follow notification', async () => {
    mockNotificationsService.findGroupableNotification.mockResolvedValue(null);
    mockNotificationsService.createNotification.mockResolvedValue({ id: 'notif-1' });
    mockPrisma.user.findUnique.mockResolvedValue({ name: 'UserA', username: 'usera' });
    mockPushService.sendToUser.mockResolvedValue(undefined);

    const job = {
      data: {
        type: 'follow',
        actorId: 'user-1',
        recipientId: 'user-2',
      },
    } as any;

    await processor.process(job);

    expect(mockPushService.sendToUser).toHaveBeenCalledWith('user-2', {
      title: 'Figly',
      body: 'UserA da theo doi ban',
      url: '/usera',
    });
  });
});
