import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';
import { ModerationService } from '../../moderation/moderation.service';

describe('FeedService - Block/Mute/Ban Filtering', () => {
  let service: FeedService;

  const mockPrisma = {
    post: {
      findMany: jest.fn(),
    },
    like: {
      findMany: jest.fn(),
    },
    bookmark: {
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  };

  const mockStorageService = {
    getPresignedUrl: jest.fn().mockResolvedValue('https://example.com/image.jpg'),
  };

  const mockModerationService = {
    getBlockedUserIds: jest.fn().mockResolvedValue([]),
    getMutedUserIds: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: ModerationService, useValue: mockModerationService },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);

    jest.clearAllMocks();
    mockModerationService.getBlockedUserIds.mockResolvedValue([]);
    mockModerationService.getMutedUserIds.mockResolvedValue([]);
  });

  describe('getFeed', () => {
    it('should exclude posts from blocked users (both directions)', async () => {
      mockModerationService.getBlockedUserIds.mockResolvedValue(['blocked-user-1']);
      mockModerationService.getMutedUserIds.mockResolvedValue([]);
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);

      await service.getFeed('user-1');

      expect(mockModerationService.getBlockedUserIds).toHaveBeenCalledWith('user-1');
      const findManyCall = mockPrisma.post.findMany.mock.calls[0][0];
      expect(findManyCall.where.userId).toEqual({ notIn: ['blocked-user-1'] });
    });

    it('should exclude posts from muted users', async () => {
      mockModerationService.getBlockedUserIds.mockResolvedValue([]);
      mockModerationService.getMutedUserIds.mockResolvedValue(['muted-user-1']);
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);

      await service.getFeed('user-1');

      expect(mockModerationService.getMutedUserIds).toHaveBeenCalledWith('user-1');
      const findManyCall = mockPrisma.post.findMany.mock.calls[0][0];
      expect(findManyCall.where.userId).toEqual({ notIn: ['muted-user-1'] });
    });

    it('should exclude posts from banned users', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);

      await service.getFeed('user-1');

      const findManyCall = mockPrisma.post.findMany.mock.calls[0][0];
      expect(findManyCall.where.user).toEqual(expect.objectContaining({
        isBanned: false,
      }));
    });
  });

  describe('getPublicFeed', () => {
    it('should exclude banned users posts', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.getPublicFeed();

      const findManyCall = mockPrisma.post.findMany.mock.calls[0][0];
      expect(findManyCall.where.user).toEqual({ isBanned: false });
    });
  });

  describe('getExploreFeed', () => {
    it('should exclude banned users posts', async () => {
      mockPrisma.category.findMany.mockResolvedValue([
        { id: 'cat-1', name: 'Gundam', slug: 'gundam', position: 0 },
      ]);
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.getExploreFeed();

      const findManyCall = mockPrisma.post.findMany.mock.calls[0][0];
      expect(findManyCall.where.user).toEqual({ isBanned: false });
    });
  });
});
