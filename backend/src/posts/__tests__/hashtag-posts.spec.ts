import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { PostsService } from '../posts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';

describe('PostsService - getPostsByHashtag', () => {
  let service: PostsService;

  const mockPrisma = {
    hashtag: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
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
    postHashtag: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    postItem: {
      create: jest.fn(),
    },
    media: {
      findMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockStorageService = {
    getPresignedUrl: jest.fn(),
  };

  const mockNotificationQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: getQueueToken('notification'), useValue: mockNotificationQueue },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);

    jest.clearAllMocks();
  });

  const createMockPost = (id: string) => ({
    id,
    userId: 'author-1',
    caption: `Post ${id}`,
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
        id: `pm-${id}`,
        mediaId: `media-${id}`,
        position: 0,
        media: { id: `media-${id}`, largeKey: `posts/large/${id}.jpg` },
      },
    ],
    items: [],
    _count: { likes: 5, comments: 2 },
  });

  it('should return paginated posts for an existing hashtag', async () => {
    mockPrisma.hashtag.findUnique.mockResolvedValue({
      id: 'h1',
      name: 'gundam',
      _count: { posts: 42 },
    });

    const mockPosts = [createMockPost('post-1')];
    mockPrisma.post.findMany.mockResolvedValue(mockPosts);
    mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

    const result = await service.getPostsByHashtag('gundam', null);

    expect(result.hashtag).toEqual({ id: 'h1', name: 'gundam', postCount: 42 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual(
      expect.objectContaining({ id: 'post-1' }),
    );
    expect(result.hasMore).toBe(false);
  });

  it('should throw NotFoundException for non-existent hashtag', async () => {
    mockPrisma.hashtag.findUnique.mockResolvedValue(null);

    await expect(
      service.getPostsByHashtag('nonexistent', null),
    ).rejects.toThrow(NotFoundException);
  });

  it('should normalize hashtag name to lowercase before querying', async () => {
    mockPrisma.hashtag.findUnique.mockResolvedValue({
      id: 'h1',
      name: 'gundam',
      _count: { posts: 10 },
    });
    mockPrisma.post.findMany.mockResolvedValue([]);

    await service.getPostsByHashtag('GUNDAM', null);

    expect(mockPrisma.hashtag.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'gundam' },
      }),
    );
  });

  it('should support cursor pagination with take+1 pattern', async () => {
    mockPrisma.hashtag.findUnique.mockResolvedValue({
      id: 'h1',
      name: 'gundam',
      _count: { posts: 20 },
    });

    // Return 11 posts (take+1)
    const posts = Array.from({ length: 11 }, (_, i) =>
      createMockPost(`post-${i}`),
    );
    mockPrisma.post.findMany.mockResolvedValue(posts);
    mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

    const result = await service.getPostsByHashtag('gundam', null);

    expect(result.items).toHaveLength(10);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('post-9');
  });

  it('should populate isLiked/isBookmarked when viewerId is provided', async () => {
    mockPrisma.hashtag.findUnique.mockResolvedValue({
      id: 'h1',
      name: 'gundam',
      _count: { posts: 5 },
    });

    const mockPosts = [createMockPost('post-1')];
    mockPrisma.post.findMany.mockResolvedValue(mockPosts);
    mockPrisma.like.findMany.mockResolvedValue([{ postId: 'post-1' }]);
    mockPrisma.bookmark.findMany.mockResolvedValue([]);
    mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

    const result = await service.getPostsByHashtag('gundam', 'viewer-1');

    expect(result.items[0].isLiked).toBe(true);
    expect(result.items[0].isBookmarked).toBe(false);
  });

  it('should set isLiked/isBookmarked to false when viewerId is null', async () => {
    mockPrisma.hashtag.findUnique.mockResolvedValue({
      id: 'h1',
      name: 'gundam',
      _count: { posts: 5 },
    });

    const mockPosts = [createMockPost('post-1')];
    mockPrisma.post.findMany.mockResolvedValue(mockPosts);
    mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

    const result = await service.getPostsByHashtag('gundam', null);

    expect(result.items[0].isLiked).toBe(false);
    expect(result.items[0].isBookmarked).toBe(false);
    expect(mockPrisma.like.findMany).not.toHaveBeenCalled();
  });
});
