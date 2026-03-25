import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';

describe('FeedService - Public Feed', () => {
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
    _count: { likes: 2, comments: 1 },
    ...overrides,
  });

  describe('getPublicFeed', () => {
    it('should return chronological posts from all users without auth', async () => {
      const posts = [createMockPost('post-2', 'user-b'), createMockPost('post-1', 'user-a')];

      mockPrisma.post.findMany.mockResolvedValue(posts);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getPublicFeed();

      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();

      // Verify public feed filters out null-username users
      const findManyCall = mockPrisma.post.findMany.mock.calls[0][0];
      expect(findManyCall.where).toEqual({
        postType: 'POST',
        user: { username: { not: null } },
      });
    });

    it('should return posts with isLiked=false and isBookmarked=false', async () => {
      const posts = [createMockPost('post-1', 'user-a')];

      mockPrisma.post.findMany.mockResolvedValue(posts);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getPublicFeed();

      expect(result.items[0].isLiked).toBe(false);
      expect(result.items[0].isBookmarked).toBe(false);
    });

    it('should NOT query likes or bookmarks (no viewer)', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.getPublicFeed();

      expect(mockPrisma.like.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.bookmark.findMany).not.toHaveBeenCalled();
    });

    it('should support cursor pagination', async () => {
      // Return 11 posts (take+1) to simulate hasMore=true
      const posts = Array.from({ length: 11 }, (_, i) => createMockPost(`post-${i}`, `user-${i}`));

      mockPrisma.post.findMany.mockResolvedValue(posts);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getPublicFeed();

      expect(result.items).toHaveLength(10);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('post-9');
    });

    it('should pass cursor to prisma when provided', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);

      await service.getPublicFeed('cursor-123');

      const findManyCall = mockPrisma.post.findMany.mock.calls[0][0];
      expect(findManyCall.cursor).toEqual({ id: 'cursor-123' });
      expect(findManyCall.skip).toBe(1);
    });

    it('should return empty result when no posts exist', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);

      const result = await service.getPublicFeed();

      expect(result.items).toHaveLength(0);
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('should resolve presigned URLs for media', async () => {
      const posts = [
        createMockPost('post-1', 'user-a', {
          user: {
            id: 'user-a',
            username: 'user_a',
            name: 'User A',
            avatar: { mediumKey: 'avatars/medium/a.jpg' },
          },
        }),
      ];

      mockPrisma.post.findMany.mockResolvedValue(posts);
      mockStorageService.getPresignedUrl
        .mockResolvedValueOnce('https://cdn.example.com/avatars/a.jpg')
        .mockResolvedValueOnce('https://cdn.example.com/posts/post-1.jpg');

      const result = await service.getPublicFeed();

      expect(result.items[0].author.avatarUrl).toBe('https://cdn.example.com/avatars/a.jpg');
      expect(result.items[0].media[0].url).toBe('https://cdn.example.com/posts/post-1.jpg');
    });
  });

  describe('getFeed (personal) remains auth-gated', () => {
    it('should query only followed users + own posts', async () => {
      mockPrisma.post.findMany.mockResolvedValue([]);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);

      await service.getFeed('user-1');

      const findManyCall = mockPrisma.post.findMany.mock.calls[0][0];
      expect(findManyCall.where.OR).toBeDefined();
      expect(findManyCall.where.OR[0]).toEqual({ userId: 'user-1' });
    });
  });
});
