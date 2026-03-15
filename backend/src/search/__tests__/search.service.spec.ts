import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from '../search.service';
import { ProfilesService } from '../../profiles/profiles.service';
import { PostsService } from '../../posts/posts.service';
import { CollectionService } from '../../collection/collection.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;

  const mockProfilesService = {
    searchProfiles: jest.fn(),
  };

  const mockPostsService = {
    searchHashtags: jest.fn(),
  };

  const mockCollectionService = {
    searchItems: jest.fn(),
  };

  const mockPrisma = {
    hashtag: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: ProfilesService, useValue: mockProfilesService },
        { provide: PostsService, useValue: mockPostsService },
        { provide: CollectionService, useValue: mockCollectionService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);

    jest.clearAllMocks();
  });

  describe('searchUsers', () => {
    it('should delegate to profilesService.searchProfiles', async () => {
      const mockResults = [
        { id: 'u1', username: 'gundam_fan', displayName: 'Gundam Fan', avatarUrl: null },
      ];
      mockProfilesService.searchProfiles.mockResolvedValue(mockResults);

      const result = await service.searchUsers('gundam');

      expect(mockProfilesService.searchProfiles).toHaveBeenCalledWith('gundam', 10);
      expect(result).toEqual(mockResults);
    });

    it('should return empty array without calling profilesService when query is empty', async () => {
      const result = await service.searchUsers('');

      expect(result).toEqual([]);
      expect(mockProfilesService.searchProfiles).not.toHaveBeenCalled();
    });

    it('should pass custom limit to profilesService', async () => {
      mockProfilesService.searchProfiles.mockResolvedValue([]);

      await service.searchUsers('test', 5);

      expect(mockProfilesService.searchProfiles).toHaveBeenCalledWith('test', 5);
    });
  });

  describe('searchHashtags', () => {
    it('should query prisma for hashtags with postCount from _count', async () => {
      mockPrisma.hashtag.findMany.mockResolvedValue([
        { id: 'h1', name: 'gundam', _count: { posts: 42 } },
        { id: 'h2', name: 'gundambuilder', _count: { posts: 7 } },
      ]);

      const result = await service.searchHashtags('gun');

      expect(result).toEqual([
        { id: 'h1', name: 'gundam', postCount: 42 },
        { id: 'h2', name: 'gundambuilder', postCount: 7 },
      ]);
      expect(mockPrisma.hashtag.findMany).toHaveBeenCalledWith({
        where: { name: { startsWith: 'gun', mode: 'insensitive' } },
        include: { _count: { select: { posts: true } } },
        take: 10,
      });
    });

    it('should return empty array when query is empty', async () => {
      const result = await service.searchHashtags('');

      expect(result).toEqual([]);
      expect(mockPrisma.hashtag.findMany).not.toHaveBeenCalled();
    });

    it('should lowercase the query before searching', async () => {
      mockPrisma.hashtag.findMany.mockResolvedValue([]);

      await service.searchHashtags('GunDam');

      expect(mockPrisma.hashtag.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { name: { startsWith: 'gundam', mode: 'insensitive' } },
        }),
      );
    });
  });

  describe('searchItems', () => {
    it('should delegate to collectionService.searchItems with viewerId', async () => {
      const mockResult = {
        items: [{ id: 'item-1', name: 'RX-78-2' }],
        nextCursor: null,
        hasMore: false,
      };
      mockCollectionService.searchItems.mockResolvedValue(mockResult);

      const result = await service.searchItems('rg', undefined, 'viewer-1');

      expect(mockCollectionService.searchItems).toHaveBeenCalledWith(
        'rg',
        { cursor: undefined },
        'viewer-1',
      );
      expect(result).toEqual(mockResult);
    });

    it('should pass cursor to collectionService', async () => {
      mockCollectionService.searchItems.mockResolvedValue({
        items: [],
        nextCursor: null,
        hasMore: false,
      });

      await service.searchItems('rg', 'cursor-123', 'viewer-1');

      expect(mockCollectionService.searchItems).toHaveBeenCalledWith(
        'rg',
        { cursor: 'cursor-123' },
        'viewer-1',
      );
    });

    it('should return empty result when query is empty', async () => {
      const result = await service.searchItems('');

      expect(result).toEqual({ items: [], nextCursor: null, hasMore: false });
      expect(mockCollectionService.searchItems).not.toHaveBeenCalled();
    });
  });
});
