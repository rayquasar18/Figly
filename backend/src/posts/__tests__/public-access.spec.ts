import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../posts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';
import { NotFoundException } from '@nestjs/common';

describe('Public Access - PostsService', () => {
  let service: PostsService;

  const mockPrisma = {
    post: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    like: {
      findMany: jest.fn(),
    },
    bookmark: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockStorageService = {
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);

    jest.clearAllMocks();
  });

  const mockPostData = {
    id: 'post-1',
    userId: 'author-1',
    caption: 'Test caption',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    user: {
      id: 'author-1',
      username: 'testuser',
      name: 'Test User',
      avatar: { mediumKey: 'avatars/medium/avatar.jpg' },
    },
    media: [
      {
        id: 'pm-1',
        mediaId: 'media-1',
        position: 0,
        media: { id: 'media-1', largeKey: 'posts/large/img1.jpg' },
      },
    ],
    _count: { likes: 5, comments: 3 },
  };

  describe('getPost with null viewerId (unauthenticated)', () => {
    it('should return post with isLiked=false and isBookmarked=false when viewerId is null', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(mockPostData);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getPost('post-1', null);

      expect(result).toEqual(expect.objectContaining({
        id: 'post-1',
        isLiked: false,
        isBookmarked: false,
        likeCount: 5,
        commentCount: 3,
      }));
      expect(result.author).toEqual(expect.objectContaining({
        id: 'author-1',
        username: 'testuser',
      }));
    });

    it('should NOT query likes or bookmarks when viewerId is null', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(mockPostData);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      await service.getPost('post-1', null);

      expect(mockPrisma.like.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.bookmark.findMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent post even without auth', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.getPost('nonexistent', null)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPost with authenticated viewerId', () => {
    it('should return enriched data with isLiked=true when viewer liked the post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(mockPostData);
      mockPrisma.like.findMany.mockResolvedValue([{ postId: 'post-1' }]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getPost('post-1', 'viewer-1');

      expect(result.isLiked).toBe(true);
      expect(result.isBookmarked).toBe(false);
    });

    it('should return enriched data with isBookmarked=true when viewer bookmarked', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(mockPostData);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([{ postId: 'post-1' }]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getPost('post-1', 'viewer-1');

      expect(result.isLiked).toBe(false);
      expect(result.isBookmarked).toBe(true);
    });
  });

  describe('getUserPosts with null viewerId (unauthenticated)', () => {
    it('should return user posts with isLiked=false and isBookmarked=false when no auth', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'author-1' });
      mockPrisma.post.findMany.mockResolvedValue([mockPostData]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getUserPosts('testuser', null);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isLiked).toBe(false);
      expect(result.items[0].isBookmarked).toBe(false);
    });

    it('should NOT query likes or bookmarks when viewerId is null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'author-1' });
      mockPrisma.post.findMany.mockResolvedValue([mockPostData]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      await service.getUserPosts('testuser', null);

      expect(mockPrisma.like.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.bookmark.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getUserPosts with authenticated viewerId', () => {
    it('should return enriched data when authenticated', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'author-1' });
      mockPrisma.post.findMany.mockResolvedValue([mockPostData]);
      mockPrisma.like.findMany.mockResolvedValue([{ postId: 'post-1' }]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getUserPosts('testuser', 'viewer-1');

      expect(result.items[0].isLiked).toBe(true);
      expect(result.items[0].isBookmarked).toBe(false);
      expect(mockPrisma.like.findMany).toHaveBeenCalled();
    });
  });
});
