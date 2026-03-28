import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from '../feed.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';
import { ModerationService } from '../../moderation/moderation.service';

describe('FeedService - getExploreFeed', () => {
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
    getPresignedUrl: jest.fn(),
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
    _count: { likes: 3, comments: 1 },
  });

  it('should return only categories with posts', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Gundam', slug: 'gundam' },
      { id: 'cat-2', name: 'Figurines', slug: 'figurines' },
    ]);

    // cat-1 has posts, cat-2 has none
    mockPrisma.post.findMany
      .mockResolvedValueOnce([createMockPost('post-1')])
      .mockResolvedValueOnce([]);

    mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

    const result = await service.getExploreFeed();

    expect(result).toHaveLength(1);
    expect(result[0].category).toEqual({ id: 'cat-1', name: 'Gundam', slug: 'gundam' });
    expect(result[0].posts).toHaveLength(1);
  });

  it('should return empty array when no categories have linked posts', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Gundam', slug: 'gundam' },
    ]);

    mockPrisma.post.findMany.mockResolvedValue([]);

    const result = await service.getExploreFeed();

    expect(result).toEqual([]);
  });

  it('should map posts with correct structure', async () => {
    mockPrisma.category.findMany.mockResolvedValue([
      { id: 'cat-1', name: 'Gundam', slug: 'gundam' },
    ]);

    mockPrisma.post.findMany.mockResolvedValue([createMockPost('post-1')]);
    mockStorageService.getPresignedUrl.mockResolvedValue('https://url.com/signed');

    const result = await service.getExploreFeed();

    expect(result[0].posts[0]).toEqual(
      expect.objectContaining({
        id: 'post-1',
        author: expect.objectContaining({
          username: 'testuser',
        }),
        isLiked: false,
        isBookmarked: false,
      }),
    );
  });

  it('should return empty array when no categories exist', async () => {
    mockPrisma.category.findMany.mockResolvedValue([]);

    const result = await service.getExploreFeed();

    expect(result).toEqual([]);
  });
});
