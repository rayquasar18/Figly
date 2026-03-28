import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ModerationService } from '../moderation.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ModerationService - Block', () => {
  let service: ModerationService;

  const mockPrisma = {
    report: {
      create: jest.fn(),
      findMany: jest.fn(),
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

  describe('blockUser', () => {
    it('should create Block record and delete follows in both directions via $transaction', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        return cb(mockPrisma);
      });
      mockPrisma.block.create.mockResolvedValue({
        id: 'block-1',
        blockerId: 'user-1',
        blockedId: 'user-2',
      });
      mockPrisma.follow.deleteMany.mockResolvedValue({ count: 2 });

      await service.blockUser('user-1', 'user-2');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(mockPrisma.block.create).toHaveBeenCalledWith({
        data: { blockerId: 'user-1', blockedId: 'user-2' },
      });
      expect(mockPrisma.follow.deleteMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { followerId: 'user-1', followingId: 'user-2' },
            { followerId: 'user-2', followingId: 'user-1' },
          ],
        },
      });
    });

    it('should be idempotent when already blocked (P2002 safe)', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        return cb(mockPrisma);
      });
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      mockPrisma.block.create.mockRejectedValue(prismaError);
      mockPrisma.follow.deleteMany.mockResolvedValue({ count: 0 });

      // Should not throw
      await service.blockUser('user-1', 'user-2');

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException when blocking self', async () => {
      await expect(service.blockUser('user-1', 'user-1'))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('unblockUser', () => {
    it('should remove Block record, P2025 safe if not blocked', async () => {
      mockPrisma.block.delete.mockResolvedValue({
        id: 'block-1',
        blockerId: 'user-1',
        blockedId: 'user-2',
      });

      await service.unblockUser('user-1', 'user-2');

      expect(mockPrisma.block.delete).toHaveBeenCalledWith({
        where: {
          blockerId_blockedId: {
            blockerId: 'user-1',
            blockedId: 'user-2',
          },
        },
      });
    });

    it('should handle non-existent block gracefully (P2025)', async () => {
      const prismaError = new Error('Record to delete does not exist');
      (prismaError as any).code = 'P2025';
      mockPrisma.block.delete.mockRejectedValue(prismaError);

      // Should not throw
      await service.unblockUser('user-1', 'user-2');
    });
  });
});
