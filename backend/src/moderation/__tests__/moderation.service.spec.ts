import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ModerationService } from '../moderation.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ModerationService', () => {
  let service: ModerationService;

  const mockPrisma = {
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    block: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    mute: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    follow: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);

    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('should create a report with reason and return success', async () => {
      mockPrisma.report.create.mockResolvedValue({
        id: 'report-1',
        reporterId: 'user-1',
        targetId: 'post-1',
        targetType: 'POST',
        reason: 'SPAM',
        status: 'PENDING',
        createdAt: new Date(),
      });

      const result = await service.createReport('user-1', {
        targetId: 'post-1',
        targetType: 'POST',
        reason: 'SPAM',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('report-1');
      expect(mockPrisma.report.create).toHaveBeenCalled();
    });

    it('should handle duplicate report (upsert via P2002)', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      mockPrisma.report.create.mockRejectedValue(prismaError);

      // findMany to get existing and update
      mockPrisma.report.findMany.mockResolvedValue([{
        id: 'report-1',
        reporterId: 'user-1',
        targetId: 'post-1',
        targetType: 'POST',
        reason: 'HARASSMENT',
        status: 'PENDING',
      }]);

      const result = await service.createReport('user-1', {
        targetId: 'post-1',
        targetType: 'POST',
        reason: 'HARASSMENT',
      });

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when reporting self', async () => {
      await expect(
        service.createReport('user-1', {
          targetId: 'user-1',
          targetType: 'USER',
          reason: 'SPAM',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getBlockedUserIds', () => {
    it('should return IDs from both blocker and blocked side', async () => {
      mockPrisma.block.findMany.mockResolvedValue([
        { blockerId: 'user-1', blockedId: 'user-2' },
        { blockerId: 'user-3', blockedId: 'user-1' },
      ]);

      const ids = await service.getBlockedUserIds('user-1');

      expect(ids).toContain('user-2');
      expect(ids).toContain('user-3');
      expect(ids).not.toContain('user-1');
      expect(ids).toHaveLength(2);
    });
  });

  describe('getMutedUserIds', () => {
    it('should return only mutedIds for the muter', async () => {
      mockPrisma.mute.findMany.mockResolvedValue([
        { mutedId: 'user-2' },
        { mutedId: 'user-3' },
      ]);

      const ids = await service.getMutedUserIds('user-1');

      expect(ids).toEqual(['user-2', 'user-3']);
      expect(mockPrisma.mute.findMany).toHaveBeenCalledWith({
        where: { muterId: 'user-1' },
        select: { mutedId: true },
      });
    });
  });

  describe('getBlockedUsers', () => {
    it('should return paginated list with username/avatar', async () => {
      mockPrisma.block.findMany.mockResolvedValue([
        {
          id: 'block-1',
          blockedId: 'user-2',
          blocked: {
            id: 'user-2',
            username: 'blocked_user',
            name: 'Blocked User',
            avatar: { mediumKey: 'avatar-key' },
          },
          createdAt: new Date('2026-01-01'),
        },
      ]);

      const result = await service.getBlockedUsers('user-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(expect.objectContaining({
        id: 'user-2',
        username: 'blocked_user',
        displayName: 'Blocked User',
      }));
    });
  });

  describe('getMutedUsers', () => {
    it('should return paginated list with username/avatar', async () => {
      mockPrisma.mute.findMany.mockResolvedValue([
        {
          id: 'mute-1',
          mutedId: 'user-2',
          muted: {
            id: 'user-2',
            username: 'muted_user',
            name: 'Muted User',
            avatar: null,
          },
          createdAt: new Date('2026-01-01'),
        },
      ]);

      const result = await service.getMutedUsers('user-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(expect.objectContaining({
        id: 'user-2',
        username: 'muted_user',
        displayName: 'Muted User',
      }));
    });
  });
});
