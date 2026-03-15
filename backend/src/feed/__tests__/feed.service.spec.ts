import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';

describe('FeedService', () => {
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
  };

  const mockStorageService = {
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);

    jest.clearAllMocks();
  });

  const createMockPost = (id: string, userId: string, overrides: any = {}) => ({
    id,
    userId,
    caption: `Post ${id}`,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    user: {
      id: userId,
      username: `user_${userId}`,
      name: `User ${userId}`,
      avatar: null,
    },
    media: [
      {
        id: `pm-${id}`,
        mediaId: `media-${id}`,
        position: 0,
        media: { id: `media-${id}`, largeKey: `posts/large/${id}.jpg` },
      },
    ],
    _count: { likes: 0, comments: 0 },
    ...overrides,
  });

  describe('getFeed', () => {
    it('should return followed + own posts in chronological order', async () => {
      const posts = [
        createMockPost('post-2', 'followed-user'),
        createMockPost('post-1', 'user-1'),
      ];

      mockPrisma.post.findMany.mockResolvedValue(posts);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getFeed('user-1');

      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(false);

      // Verify the where clause uses OR with userId + followers subquery
      const findManyCall = mockPrisma.post.findMany.mock.calls[0][0];
      expect(findManyCall.where.OR).toBeDefined();
      expect(findManyCall.where.OR).toHaveLength(2);
      expect(findManyCall.where.OR[0]).toEqual({ userId: 'user-1' });
      expect(findManyCall.where.OR[1]).toEqual({
        user: {
          followers: {
            some: { followerId: 'user-1' },
          },
        },
      });
    });

    it('should support cursor pagination', async () => {
      // Return 11 posts (take+1)
      const posts = Array.from({ length: 11 }, (_, i) =>
        createMockPost(`post-${i}`, 'user-1'),
      );

      mockPrisma.post.findMany.mockResolvedValue(posts);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getFeed('user-1');

      expect(result.items).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('post-9');
    });

    it('should batch check isLiked and isBookmarked for viewer', async () => {
      const posts = [
        createMockPost('post-1', 'user-1'),
        createMockPost('post-2', 'followed-user'),
      ];

      mockPrisma.post.findMany.mockResolvedValue(posts);
      mockPrisma.like.findMany.mockResolvedValue([{ postId: 'post-1' }]); // liked post-1
      mockPrisma.bookmark.findMany.mockResolvedValue([{ postId: 'post-2' }]); // bookmarked post-2
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getFeed('user-1');

      expect(result.items[0].isLiked).toBe(true);
      expect(result.items[0].isBookmarked).toBe(false);
      expect(result.items[1].isLiked).toBe(false);
      expect(result.items[1].isBookmarked).toBe(true);
    });

    it('should return only own posts when following nobody', async () => {
      const posts = [createMockPost('post-1', 'user-1')];

      mockPrisma.post.findMany.mockResolvedValue(posts);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getFeed('user-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('post-1');
    });

    it('should return empty result when no posts exist', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);

      const result = await service.getFeed('user-1');

      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });
});
