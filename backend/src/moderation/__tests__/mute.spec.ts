import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ModerationService } from '../moderation.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ModerationService - Mute', () => {
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

  describe('muteUser', () => {
    it('should create Mute record, P2002 idempotent', async () => {
      mockPrisma.mute.create.mockResolvedValue({
        id: 'mute-1',
        muterId: 'user-1',
        mutedId: 'user-2',
      });

      await service.muteUser('user-1', 'user-2');

      expect(mockPrisma.mute.create).toHaveBeenCalledWith({
        data: { muterId: 'user-1', mutedId: 'user-2' },
      });
    });

    it('should be idempotent when already muted (P2002)', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      mockPrisma.mute.create.mockRejectedValue(prismaError);

      // Should not throw
      await service.muteUser('user-1', 'user-2');
    });

    it('should throw BadRequestException when muting self', async () => {
      await expect(service.muteUser('user-1', 'user-1'))
        .rejects
        .toThrow(BadRequestException);
    });
  });

  describe('unmuteUser', () => {
    it('should remove Mute record, P2025 safe', async () => {
      mockPrisma.mute.delete.mockResolvedValue({
        id: 'mute-1',
        muterId: 'user-1',
        mutedId: 'user-2',
      });

      await service.unmuteUser('user-1', 'user-2');

      expect(mockPrisma.mute.delete).toHaveBeenCalledWith({
        where: {
          muterId_mutedId: {
            muterId: 'user-1',
            mutedId: 'user-2',
          },
        },
      });
    });

    it('should handle non-existent mute gracefully (P2025)', async () => {
      const prismaError = new Error('Record to delete does not exist');
      (prismaError as any).code = 'P2025';
      mockPrisma.mute.delete.mockRejectedValue(prismaError);

      // Should not throw
      await service.unmuteUser('user-1', 'user-2');
    });
  });
});
