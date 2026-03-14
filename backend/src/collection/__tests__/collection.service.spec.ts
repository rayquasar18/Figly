import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CollectionService } from '../collection.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CollectionService', () => {
  let service: CollectionService;

  const mockPrisma = {
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    series: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    item: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    ownedItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    wishlistItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    categoryFollow: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    seriesFollow: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((fn: any) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollectionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<CollectionService>(CollectionService);

    jest.clearAllMocks();
    // Reset $transaction to execute the callback with mockPrisma
    mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrisma));
  });

  describe('getCategories', () => {
    it('should return all categories with series and item counts', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Gundam',
          slug: 'gundam',
          description: 'Gundam models',
          coverImage: null,
          position: 0,
          _count: { series: 4 },
          series: [
            { _count: { items: 10 } },
            { _count: { items: 5 } },
            { _count: { items: 8 } },
            { _count: { items: 3 } },
          ],
        },
        {
          id: 'cat-2',
          name: 'Figurines',
          slug: 'figurines',
          description: 'Anime figurines',
          coverImage: null,
          position: 1,
          _count: { series: 2 },
          series: [
            { _count: { items: 12 } },
            { _count: { items: 7 } },
          ],
        },
      ];

      mockPrisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.getCategories();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'cat-1',
        name: 'Gundam',
        slug: 'gundam',
        seriesCount: 4,
        itemCount: 26,
      }));
      expect(result[1]).toEqual(expect.objectContaining({
        id: 'cat-2',
        itemCount: 19,
      }));

      // Verify ordered by position
      expect(mockPrisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { position: 'asc' },
        }),
      );
    });
  });

  describe('getSeriesByCategory', () => {
    it('should return series for a valid category slug with item counts', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        slug: 'gundam',
      });

      const mockSeries = [
        {
          id: 'series-1',
          categoryId: 'cat-1',
          name: 'Master Grade',
          slug: 'master-grade',
          description: null,
          coverImage: null,
          position: 0,
          _count: { items: 10 },
        },
        {
          id: 'series-2',
          categoryId: 'cat-1',
          name: 'High Grade',
          slug: 'high-grade',
          description: null,
          coverImage: null,
          position: 1,
          _count: { items: 15 },
        },
      ];

      mockPrisma.series.findMany.mockResolvedValue(mockSeries);

      const result = await service.getSeriesByCategory('gundam');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'series-1',
        name: 'Master Grade',
        itemCount: 10,
      }));
    });

    it('should throw NotFoundException for invalid category slug', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.getSeriesByCategory('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should include isFollowed when viewerId is provided', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        slug: 'gundam',
      });

      mockPrisma.series.findMany.mockResolvedValue([
        {
          id: 'series-1',
          categoryId: 'cat-1',
          name: 'Master Grade',
          slug: 'master-grade',
          description: null,
          coverImage: null,
          position: 0,
          _count: { items: 10 },
        },
        {
          id: 'series-2',
          categoryId: 'cat-1',
          name: 'High Grade',
          slug: 'high-grade',
          description: null,
          coverImage: null,
          position: 1,
          _count: { items: 15 },
        },
      ]);

      // Batch follow check -- viewer follows series-1
      mockPrisma.seriesFollow.findMany.mockResolvedValue([
        { seriesId: 'series-1' },
      ]);

      const result = await service.getSeriesByCategory('gundam', 'viewer-1');

      expect(result[0].isFollowed).toBe(true);
      expect(result[1].isFollowed).toBe(false);
    });
  });

  describe('getItemsBySeries', () => {
    it('should return paginated items with cursor', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.series.findUnique.mockResolvedValue({
        id: 'series-1',
        categoryId: 'cat-1',
      });

      const mockItems = Array.from({ length: 21 }, (_, i) => ({
        id: `item-${i}`,
        seriesId: 'series-1',
        name: `Item ${i}`,
        description: null,
        imageKey: null,
        releaseDate: null,
        series: {
          name: 'Master Grade',
          category: { name: 'Gundam' },
        },
      }));

      mockPrisma.item.findMany.mockResolvedValue(mockItems);

      const result = await service.getItemsBySeries('gundam', 'master-grade');

      expect(result.items).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('item-19');
    });

    it('should include viewer owned/wishlist status', async () => {
      mockPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1' });
      mockPrisma.series.findUnique.mockResolvedValue({
        id: 'series-1',
        categoryId: 'cat-1',
      });

      mockPrisma.item.findMany.mockResolvedValue([
        {
          id: 'item-1',
          seriesId: 'series-1',
          name: 'RX-78-2',
          description: null,
          imageKey: null,
          releaseDate: null,
          series: {
            name: 'Master Grade',
            category: { name: 'Gundam' },
          },
        },
        {
          id: 'item-2',
          seriesId: 'series-1',
          name: 'Zaku II',
          description: null,
          imageKey: null,
          releaseDate: null,
          series: {
            name: 'Master Grade',
            category: { name: 'Gundam' },
          },
        },
      ]);

      // Viewer owns item-1, has item-2 wishlisted
      mockPrisma.ownedItem.findMany.mockResolvedValue([{ itemId: 'item-1' }]);
      mockPrisma.wishlistItem.findMany.mockResolvedValue([{ itemId: 'item-2' }]);

      const result = await service.getItemsBySeries('gundam', 'master-grade', 'viewer-1');

      expect(result.items[0].isOwned).toBe(true);
      expect(result.items[0].isWishlisted).toBe(false);
      expect(result.items[1].isOwned).toBe(false);
      expect(result.items[1].isWishlisted).toBe(true);
    });
  });

  describe('getItemDetail', () => {
    it('should return full item detail with ownerCount', async () => {
      mockPrisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        seriesId: 'series-1',
        name: 'RX-78-2 Gundam Ver.3.0',
        description: 'Master Grade kit',
        imageKey: null,
        releaseDate: null,
        series: {
          name: 'Master Grade',
          slug: 'master-grade',
          category: {
            name: 'Gundam',
            slug: 'gundam',
          },
        },
        _count: { ownedBy: 42 },
      });

      const result = await service.getItemDetail('item-1');

      expect(result).toEqual(expect.objectContaining({
        id: 'item-1',
        name: 'RX-78-2 Gundam Ver.3.0',
        ownerCount: 42,
        seriesName: 'Master Grade',
        categoryName: 'Gundam',
        categorySlug: 'gundam',
        seriesSlug: 'master-grade',
        isOwned: false,
        isWishlisted: false,
      }));
    });

    it('should include viewer owned/wishlist status', async () => {
      mockPrisma.item.findUnique.mockResolvedValue({
        id: 'item-1',
        seriesId: 'series-1',
        name: 'RX-78-2',
        description: null,
        imageKey: null,
        releaseDate: null,
        series: {
          name: 'Master Grade',
          slug: 'master-grade',
          category: {
            name: 'Gundam',
            slug: 'gundam',
          },
        },
        _count: { ownedBy: 10 },
      });

      mockPrisma.ownedItem.findUnique.mockResolvedValue({ id: 'owned-1' });
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(null);

      const result = await service.getItemDetail('item-1', 'viewer-1');

      expect(result.isOwned).toBe(true);
      expect(result.isWishlisted).toBe(false);
    });

    it('should throw NotFoundException for non-existent item', async () => {
      mockPrisma.item.findUnique.mockResolvedValue(null);

      await expect(
        service.getItemDetail('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('searchItems', () => {
    it('should return filtered results with case-insensitive name match', async () => {
      mockPrisma.item.findMany.mockResolvedValue([
        {
          id: 'item-1',
          seriesId: 'series-1',
          name: 'RX-78-2 Gundam',
          description: null,
          imageKey: null,
          releaseDate: null,
          series: {
            name: 'Master Grade',
            category: { name: 'Gundam' },
          },
        },
      ]);

      const result = await service.searchItems('gundam', {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('RX-78-2 Gundam');

      // Verify case-insensitive search
      const findManyCall = mockPrisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.name).toEqual({
        contains: 'gundam',
        mode: 'insensitive',
      });
    });

    it('should apply categoryId filter', async () => {
      mockPrisma.item.findMany.mockResolvedValue([]);

      await service.searchItems('test', { categoryId: 'cat-1' });

      const findManyCall = mockPrisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.series).toEqual(
        expect.objectContaining({ categoryId: 'cat-1' }),
      );
    });

    it('should apply seriesId filter', async () => {
      mockPrisma.item.findMany.mockResolvedValue([]);

      await service.searchItems('test', { seriesId: 'series-1' });

      const findManyCall = mockPrisma.item.findMany.mock.calls[0][0];
      expect(findManyCall.where.seriesId).toBe('series-1');
    });
  });

  describe('toggleOwned', () => {
    it('should add item to owned and remove from wishlist', async () => {
      // Not currently owned
      mockPrisma.ownedItem.findUnique.mockResolvedValue(null);
      mockPrisma.wishlistItem.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.ownedItem.create.mockResolvedValue({
        id: 'owned-1',
        userId: 'user-1',
        itemId: 'item-1',
      });

      const result = await service.toggleOwned('user-1', 'item-1');

      expect(result).toEqual({ success: true, isOwned: true });
      expect(mockPrisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', itemId: 'item-1' },
      });
      expect(mockPrisma.ownedItem.create).toHaveBeenCalled();
    });

    it('should remove item from owned when already owned', async () => {
      // Currently owned
      mockPrisma.ownedItem.findUnique.mockResolvedValue({
        id: 'owned-1',
        userId: 'user-1',
        itemId: 'item-1',
      });
      mockPrisma.ownedItem.delete.mockResolvedValue({ id: 'owned-1' });

      const result = await service.toggleOwned('user-1', 'item-1');

      expect(result).toEqual({ success: true, isOwned: false });
      expect(mockPrisma.ownedItem.delete).toHaveBeenCalled();
    });

    it('should handle P2002 for concurrent create (idempotent)', async () => {
      mockPrisma.ownedItem.findUnique.mockResolvedValue(null);
      mockPrisma.wishlistItem.deleteMany.mockResolvedValue({ count: 0 });
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      mockPrisma.ownedItem.create.mockRejectedValue(prismaError);

      const result = await service.toggleOwned('user-1', 'item-1');

      expect(result).toEqual({ success: true, isOwned: true });
    });
  });

  describe('toggleWishlist', () => {
    it('should add item to wishlist and remove from owned', async () => {
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(null);
      mockPrisma.ownedItem.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.wishlistItem.create.mockResolvedValue({
        id: 'wish-1',
        userId: 'user-1',
        itemId: 'item-1',
      });

      const result = await service.toggleWishlist('user-1', 'item-1');

      expect(result).toEqual({ success: true, isWishlisted: true });
      expect(mockPrisma.ownedItem.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', itemId: 'item-1' },
      });
      expect(mockPrisma.wishlistItem.create).toHaveBeenCalled();
    });

    it('should remove item from wishlist when already wishlisted', async () => {
      mockPrisma.wishlistItem.findUnique.mockResolvedValue({
        id: 'wish-1',
        userId: 'user-1',
        itemId: 'item-1',
      });
      mockPrisma.wishlistItem.delete.mockResolvedValue({ id: 'wish-1' });

      const result = await service.toggleWishlist('user-1', 'item-1');

      expect(result).toEqual({ success: true, isWishlisted: false });
      expect(mockPrisma.wishlistItem.delete).toHaveBeenCalled();
    });

    it('should handle P2002 for concurrent create (idempotent)', async () => {
      mockPrisma.wishlistItem.findUnique.mockResolvedValue(null);
      mockPrisma.ownedItem.deleteMany.mockResolvedValue({ count: 0 });
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      mockPrisma.wishlistItem.create.mockRejectedValue(prismaError);

      const result = await service.toggleWishlist('user-1', 'item-1');

      expect(result).toEqual({ success: true, isWishlisted: true });
    });
  });

  describe('followCategory', () => {
    it('should follow a category when not already following', async () => {
      mockPrisma.categoryFollow.findUnique.mockResolvedValue(null);
      mockPrisma.categoryFollow.create.mockResolvedValue({
        id: 'cf-1',
        userId: 'user-1',
        categoryId: 'cat-1',
      });

      const result = await service.followCategory('user-1', 'cat-1');

      expect(result).toEqual({ success: true, isFollowed: true });
    });

    it('should unfollow a category when already following', async () => {
      mockPrisma.categoryFollow.findUnique.mockResolvedValue({
        id: 'cf-1',
        userId: 'user-1',
        categoryId: 'cat-1',
      });
      mockPrisma.categoryFollow.delete.mockResolvedValue({ id: 'cf-1' });

      const result = await service.followCategory('user-1', 'cat-1');

      expect(result).toEqual({ success: true, isFollowed: false });
    });
  });

  describe('followSeries', () => {
    it('should follow a series when not already following', async () => {
      mockPrisma.seriesFollow.findUnique.mockResolvedValue(null);
      mockPrisma.seriesFollow.create.mockResolvedValue({
        id: 'sf-1',
        userId: 'user-1',
        seriesId: 'series-1',
      });

      const result = await service.followSeries('user-1', 'series-1');

      expect(result).toEqual({ success: true, isFollowed: true });
    });

    it('should unfollow a series when already following', async () => {
      mockPrisma.seriesFollow.findUnique.mockResolvedValue({
        id: 'sf-1',
        userId: 'user-1',
        seriesId: 'series-1',
      });
      mockPrisma.seriesFollow.delete.mockResolvedValue({ id: 'sf-1' });

      const result = await service.followSeries('user-1', 'series-1');

      expect(result).toEqual({ success: true, isFollowed: false });
    });
  });

  describe('getItemStatuses', () => {
    it('should return correct owned and wishlist Sets', async () => {
      mockPrisma.ownedItem.findMany.mockResolvedValue([
        { itemId: 'item-1' },
        { itemId: 'item-3' },
      ]);
      mockPrisma.wishlistItem.findMany.mockResolvedValue([
        { itemId: 'item-2' },
      ]);

      const result = await service.getItemStatuses('user-1', [
        'item-1',
        'item-2',
        'item-3',
      ]);

      expect(result.ownedSet.has('item-1')).toBe(true);
      expect(result.ownedSet.has('item-3')).toBe(true);
      expect(result.ownedSet.has('item-2')).toBe(false);
      expect(result.wishlistSet.has('item-2')).toBe(true);
      expect(result.wishlistSet.has('item-1')).toBe(false);
    });

    it('should use IN clause for batch lookup', async () => {
      mockPrisma.ownedItem.findMany.mockResolvedValue([]);
      mockPrisma.wishlistItem.findMany.mockResolvedValue([]);

      await service.getItemStatuses('user-1', ['item-1', 'item-2']);

      expect(mockPrisma.ownedItem.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          itemId: { in: ['item-1', 'item-2'] },
        },
        select: { itemId: true },
      });
      expect(mockPrisma.wishlistItem.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          itemId: { in: ['item-1', 'item-2'] },
        },
        select: { itemId: true },
      });
    });
  });

  describe('getUserOwnedItems', () => {
    it('should return paginated owned items for a user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        username: 'collector',
      });

      mockPrisma.ownedItem.findMany.mockResolvedValue([
        {
          id: 'owned-1',
          itemId: 'item-1',
          item: {
            id: 'item-1',
            name: 'RX-78-2',
            description: null,
            imageKey: null,
            releaseDate: null,
            seriesId: 'series-1',
            series: {
              name: 'Master Grade',
              slug: 'master-grade',
              category: {
                name: 'Gundam',
                slug: 'gundam',
              },
            },
          },
          createdAt: new Date(),
        },
      ]);

      const result = await service.getUserOwnedItems('collector');

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(expect.objectContaining({
        id: 'item-1',
        name: 'RX-78-2',
        seriesName: 'Master Grade',
        categoryName: 'Gundam',
      }));
    });

    it('should throw NotFoundException for non-existent username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getUserOwnedItems('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
