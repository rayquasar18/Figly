import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PostsService } from '../posts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';

describe('PostsService', () => {
  let service: PostsService;

  const mockPrisma = {
    media: {
      findMany: jest.fn(),
    },
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    like: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    bookmark: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
    },
    hashtag: {
      upsert: jest.fn(),
    },
    postHashtag: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
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

  describe('createPost', () => {
    it('should create a post with caption and mediaIds', async () => {
      const dto = { mediaIds: ['media-1'], caption: 'Hello world' };

      mockPrisma.media.findMany.mockResolvedValue([
        { id: 'media-1', userId: 'user-1', status: 'COMPLETED' },
      ]);

      const createdPost = { id: 'post-1', userId: 'user-1', caption: 'Hello world' };
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.post.create.mockResolvedValue(createdPost);

      const result = await service.createPost('user-1', dto);

      expect(result).toBeDefined();
      expect(result.id).toBe('post-1');
      expect(mockPrisma.media.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['media-1'] },
          userId: 'user-1',
          status: 'COMPLETED',
        },
      });
    });

    it('should extract hashtags from caption and upsert them', async () => {
      const dto = { mediaIds: ['media-1'], caption: 'Hello #world #figly' };

      mockPrisma.media.findMany.mockResolvedValue([
        { id: 'media-1', userId: 'user-1', status: 'COMPLETED' },
      ]);

      const createdPost = { id: 'post-1', userId: 'user-1', caption: dto.caption };
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.post.create.mockResolvedValue(createdPost);
      mockPrisma.hashtag.upsert.mockResolvedValue({ id: 'hash-1', name: 'world' });
      mockPrisma.postHashtag.create.mockResolvedValue({});

      await service.createPost('user-1', dto);

      expect(mockPrisma.hashtag.upsert).toHaveBeenCalledTimes(2);
    });

    it('should create PostMedia entries with position ordering for carousel', async () => {
      const dto = { mediaIds: ['media-1', 'media-2', 'media-3'], caption: null };

      mockPrisma.media.findMany.mockResolvedValue([
        { id: 'media-1', userId: 'user-1', status: 'COMPLETED' },
        { id: 'media-2', userId: 'user-1', status: 'COMPLETED' },
        { id: 'media-3', userId: 'user-1', status: 'COMPLETED' },
      ]);

      const createdPost = { id: 'post-1', userId: 'user-1', caption: null };
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.post.create.mockResolvedValue(createdPost);

      await service.createPost('user-1', dto);

      const createCall = mockPrisma.post.create.mock.calls[0][0];
      expect(createCall.data.media.create).toHaveLength(3);
      expect(createCall.data.media.create[0]).toEqual({ mediaId: 'media-1', position: 0 });
      expect(createCall.data.media.create[1]).toEqual({ mediaId: 'media-2', position: 1 });
      expect(createCall.data.media.create[2]).toEqual({ mediaId: 'media-3', position: 2 });
    });

    it('should reject if any mediaId is invalid, not owned, or not COMPLETED', async () => {
      const dto = { mediaIds: ['media-1', 'media-invalid'], caption: null };

      mockPrisma.media.findMany.mockResolvedValue([
        { id: 'media-1', userId: 'user-1', status: 'COMPLETED' },
      ]); // Only 1 of 2 found

      await expect(service.createPost('user-1', dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPost', () => {
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

    it('should return PostResponse with media URLs, author, like/bookmark status', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(mockPostData);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);
      mockStorageService.getPresignedUrl
        .mockResolvedValueOnce('https://minio.local/avatars/medium/avatar.jpg?signed=1')
        .mockResolvedValueOnce('https://minio.local/posts/large/img1.jpg?signed=1');

      const result = await service.getPost('post-1', 'viewer-1');

      expect(result).toEqual(expect.objectContaining({
        id: 'post-1',
        author: expect.objectContaining({
          id: 'author-1',
          username: 'testuser',
          displayName: 'Test User',
          avatarUrl: 'https://minio.local/avatars/medium/avatar.jpg?signed=1',
        }),
        media: [
          expect.objectContaining({
            id: 'pm-1',
            mediaId: 'media-1',
            position: 0,
            url: 'https://minio.local/posts/large/img1.jpg?signed=1',
          }),
        ],
        likeCount: 5,
        commentCount: 3,
        isLiked: false,
        isBookmarked: false,
      }));
    });

    it('should set isLiked=true when viewer has liked the post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(mockPostData);
      mockPrisma.like.findMany.mockResolvedValue([{ postId: 'post-1' }]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getPost('post-1', 'viewer-1');

      expect(result.isLiked).toBe(true);
      expect(result.isBookmarked).toBe(false);
    });

    it('should set isBookmarked=true when viewer has bookmarked the post', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(mockPostData);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([{ postId: 'post-1' }]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getPost('post-1', 'viewer-1');

      expect(result.isLiked).toBe(false);
      expect(result.isBookmarked).toBe(true);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.getPost('nonexistent', 'viewer-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCaption', () => {
    it('should update caption and re-extract hashtags', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' });
      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.post.update.mockResolvedValue({ id: 'post-1', caption: 'New #hashtag' });
      mockPrisma.postHashtag.deleteMany.mockResolvedValue({});
      mockPrisma.hashtag.upsert.mockResolvedValue({ id: 'hash-1', name: 'hashtag' });
      mockPrisma.postHashtag.create.mockResolvedValue({});

      const result = await service.updateCaption('post-1', 'user-1', { caption: 'New #hashtag' });

      expect(result).toBeDefined();
      expect(mockPrisma.postHashtag.deleteMany).toHaveBeenCalledWith({
        where: { postId: 'post-1' },
      });
      expect(mockPrisma.hashtag.upsert).toHaveBeenCalledTimes(1);
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1', userId: 'other-user' });

      await expect(
        service.updateCaption('post-1', 'user-1', { caption: 'Updated' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCaption('nonexistent', 'user-1', { caption: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deletePost', () => {
    it('should delete post when user is owner', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1', userId: 'user-1' });
      mockPrisma.post.delete.mockResolvedValue({ id: 'post-1' });

      await service.deletePost('post-1', 'user-1');

      expect(mockPrisma.post.delete).toHaveBeenCalledWith({
        where: { id: 'post-1' },
      });
    });

    it('should throw ForbiddenException if not owner', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ id: 'post-1', userId: 'other-user' });

      await expect(service.deletePost('post-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);

      await expect(service.deletePost('nonexistent', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleLike', () => {
    it('should create a like when like=true', async () => {
      mockPrisma.like.create.mockResolvedValue({
        id: 'like-1',
        userId: 'user-1',
        postId: 'post-1',
      });

      const result = await service.toggleLike('user-1', 'post-1', true);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.like.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', postId: 'post-1' },
      });
    });

    it('should handle P2002 idempotently when already liked', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      mockPrisma.like.create.mockRejectedValue(prismaError);

      const result = await service.toggleLike('user-1', 'post-1', true);

      expect(result).toEqual({ success: true });
    });

    it('should delete a like when like=false', async () => {
      mockPrisma.like.delete.mockResolvedValue({
        id: 'like-1',
        userId: 'user-1',
        postId: 'post-1',
      });

      const result = await service.toggleLike('user-1', 'post-1', false);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.like.delete).toHaveBeenCalledWith({
        where: { userId_postId: { userId: 'user-1', postId: 'post-1' } },
      });
    });

    it('should handle P2025 idempotently when not liked', async () => {
      const prismaError = new Error('Record to delete does not exist');
      (prismaError as any).code = 'P2025';
      mockPrisma.like.delete.mockRejectedValue(prismaError);

      const result = await service.toggleLike('user-1', 'post-1', false);

      expect(result).toEqual({ success: true });
    });
  });

  describe('toggleBookmark', () => {
    it('should create a bookmark when bookmark=true', async () => {
      mockPrisma.bookmark.create.mockResolvedValue({
        id: 'bm-1',
        userId: 'user-1',
        postId: 'post-1',
      });

      const result = await service.toggleBookmark('user-1', 'post-1', true);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.bookmark.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', postId: 'post-1' },
      });
    });

    it('should handle P2002 idempotently when already bookmarked', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      mockPrisma.bookmark.create.mockRejectedValue(prismaError);

      const result = await service.toggleBookmark('user-1', 'post-1', true);

      expect(result).toEqual({ success: true });
    });

    it('should delete bookmark when bookmark=false', async () => {
      mockPrisma.bookmark.delete.mockResolvedValue({
        id: 'bm-1',
        userId: 'user-1',
        postId: 'post-1',
      });

      const result = await service.toggleBookmark('user-1', 'post-1', false);

      expect(result).toEqual({ success: true });
      expect(mockPrisma.bookmark.delete).toHaveBeenCalledWith({
        where: { userId_postId: { userId: 'user-1', postId: 'post-1' } },
      });
    });

    it('should handle P2025 idempotently when not bookmarked', async () => {
      const prismaError = new Error('Record to delete does not exist');
      (prismaError as any).code = 'P2025';
      mockPrisma.bookmark.delete.mockRejectedValue(prismaError);

      const result = await service.toggleBookmark('user-1', 'post-1', false);

      expect(result).toEqual({ success: true });
    });
  });

  describe('getSavedPosts', () => {
    it('should return bookmarked posts with cursor pagination', async () => {
      const mockBookmarks = [
        {
          id: 'bm-1',
          createdAt: new Date('2026-01-02'),
          post: {
            id: 'post-1',
            userId: 'author-1',
            caption: 'Saved post',
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
            user: {
              id: 'author-1',
              username: 'author',
              name: 'Author',
              avatar: null,
            },
            media: [
              {
                id: 'pm-1',
                mediaId: 'media-1',
                position: 0,
                media: { id: 'media-1', largeKey: 'posts/large/img1.jpg' },
              },
            ],
            _count: { likes: 2, comments: 1 },
          },
        },
      ];

      mockPrisma.bookmark.findMany.mockResolvedValue(mockBookmarks);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getSavedPosts('user-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(expect.objectContaining({
        id: 'post-1',
        isBookmarked: true,
      }));
      expect(result.hasMore).toBe(false);
    });
  });

  describe('getUserPosts', () => {
    it('should return posts by username with cursor pagination', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'author-1' });
      const mockPosts = [
        {
          id: 'post-1',
          userId: 'author-1',
          caption: 'User post',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
          user: {
            id: 'author-1',
            username: 'testuser',
            name: 'Test User',
            avatar: null,
          },
          media: [
            {
              id: 'pm-1',
              mediaId: 'media-1',
              position: 0,
              media: { id: 'media-1', largeKey: 'posts/large/img1.jpg' },
            },
          ],
          _count: { likes: 3, comments: 0 },
        },
      ];

      mockPrisma.post.findMany.mockResolvedValue(mockPosts);
      mockPrisma.like.findMany.mockResolvedValue([]);
      mockPrisma.bookmark.findMany.mockResolvedValue([]);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

      const result = await service.getUserPosts('testuser', 'viewer-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(expect.objectContaining({
        id: 'post-1',
        author: expect.objectContaining({ username: 'testuser' }),
      }));
      expect(result.hasMore).toBe(false);
    });

    it('should throw NotFoundException for non-existent username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getUserPosts('nonexistent', 'viewer-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchHashtags', () => {
    it('should return hashtags matching prefix query', async () => {
      mockPrisma.hashtag = { findMany: jest.fn() } as any;
      (mockPrisma.hashtag as any).findMany.mockResolvedValue([
        { id: 'h-1', name: 'travel' },
        { id: 'h-2', name: 'traveler' },
      ]);

      const result = await service.searchHashtags('trave');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({ name: 'travel' }));
    });

    it('should search case-insensitively', async () => {
      mockPrisma.hashtag = { findMany: jest.fn() } as any;
      (mockPrisma.hashtag as any).findMany.mockResolvedValue([
        { id: 'h-1', name: 'food' },
      ]);

      const result = await service.searchHashtags('Food');

      expect(result).toHaveLength(1);
      // Verify query was lowercase
      expect((mockPrisma.hashtag as any).findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { startsWith: 'food', mode: 'insensitive' } },
        }),
      );
    });
  });
});
