import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  CategoryResponse,
  SeriesResponse,
  ItemResponse,
  ItemDetailResponse,
} from '@figly/shared';

interface SearchOptions {
  categoryId?: string;
  seriesId?: string;
  cursor?: string;
  take?: number;
}

interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

@Injectable()
export class CollectionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all categories ordered by position with series and item counts
   */
  async getCategories(): Promise<CategoryResponse[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { series: true } },
        series: {
          select: {
            _count: { select: { items: true } },
          },
        },
      },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      coverImage: cat.coverImage,
      seriesCount: cat._count.series,
      itemCount: cat.series.reduce((sum, s) => sum + s._count.items, 0),
    }));
  }

  /**
   * Get series for a category by slug with item counts and optional follow status
   */
  async getSeriesByCategory(
    categorySlug: string,
    viewerId?: string,
  ): Promise<SeriesResponse[]> {
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Danh muc khong ton tai');
    }

    const seriesList = await this.prisma.series.findMany({
      where: { categoryId: category.id },
      orderBy: { position: 'asc' },
      include: {
        _count: { select: { items: true } },
      },
    });

    // Batch check follow status for viewer
    let followedSet = new Set<string>();
    if (viewerId) {
      const seriesIds = seriesList.map((s) => s.id);
      const follows = await this.prisma.seriesFollow.findMany({
        where: {
          userId: viewerId,
          seriesId: { in: seriesIds },
        },
        select: { seriesId: true },
      });
      followedSet = new Set(follows.map((f) => f.seriesId));
    }

    return seriesList.map((s) => ({
      id: s.id,
      categoryId: s.categoryId,
      name: s.name,
      slug: s.slug,
      description: s.description,
      coverImage: s.coverImage,
      itemCount: s._count.items,
      ...(viewerId !== undefined && { isFollowed: followedSet.has(s.id) }),
    }));
  }

  /**
   * Get paginated items for a series with optional viewer status
   */
  async getItemsBySeries(
    categorySlug: string,
    seriesSlug: string,
    viewerId?: string,
    cursor?: string,
    take = 20,
  ): Promise<PaginatedResult<ItemResponse>> {
    const category = await this.prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Danh muc khong ton tai');
    }

    const series = await this.prisma.series.findUnique({
      where: {
        categoryId_slug: {
          categoryId: category.id,
          slug: seriesSlug,
        },
      },
    });

    if (!series) {
      throw new NotFoundException('Bo suu tap khong ton tai');
    }

    const items = await this.prisma.item.findMany({
      where: { seriesId: series.id },
      include: {
        series: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = items.length > take;
    const pageItems = items.slice(0, take);
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

    // Batch check viewer statuses
    let ownedSet = new Set<string>();
    let wishlistSet = new Set<string>();
    if (viewerId) {
      const itemIds = pageItems.map((i) => i.id);
      const statuses = await this.getItemStatuses(viewerId, itemIds);
      ownedSet = statuses.ownedSet;
      wishlistSet = statuses.wishlistSet;
    }

    return {
      items: pageItems.map((item) => ({
        id: item.id,
        seriesId: item.seriesId,
        name: item.name,
        description: item.description,
        imageUrl: item.imageKey,
        releaseDate: item.releaseDate?.toISOString() ?? null,
        seriesName: item.series.name,
        categoryName: item.series.category.name,
        isOwned: ownedSet.has(item.id),
        isWishlisted: wishlistSet.has(item.id),
      })),
      nextCursor,
      hasMore,
    };
  }

  /**
   * Get item detail with ownerCount and viewer status
   */
  async getItemDetail(
    itemId: string,
    viewerId?: string,
  ): Promise<ItemDetailResponse> {
    const item = await this.prisma.item.findUnique({
      where: { id: itemId },
      include: {
        series: {
          select: {
            name: true,
            slug: true,
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: { select: { ownedBy: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Vat pham khong ton tai');
    }

    let isOwned = false;
    let isWishlisted = false;

    if (viewerId) {
      const [owned, wishlisted] = await Promise.all([
        this.prisma.ownedItem.findUnique({
          where: { userId_itemId: { userId: viewerId, itemId } },
        }),
        this.prisma.wishlistItem.findUnique({
          where: { userId_itemId: { userId: viewerId, itemId } },
        }),
      ]);
      isOwned = !!owned;
      isWishlisted = !!wishlisted;
    }

    return {
      id: item.id,
      seriesId: item.seriesId,
      name: item.name,
      description: item.description,
      imageUrl: item.imageKey,
      releaseDate: item.releaseDate?.toISOString() ?? null,
      seriesName: item.series.name,
      categoryName: item.series.category.name,
      ownerCount: item._count.ownedBy,
      categorySlug: item.series.category.slug,
      seriesSlug: item.series.slug,
      isOwned,
      isWishlisted,
    };
  }

  /**
   * Search items by name with optional filters
   */
  async searchItems(
    q: string,
    opts: SearchOptions,
    viewerId?: string,
  ): Promise<PaginatedResult<ItemResponse>> {
    const take = opts.take || 20;

    const where: any = {
      name: { contains: q, mode: 'insensitive' },
    };

    if (opts.seriesId) {
      where.seriesId = opts.seriesId;
    }

    if (opts.categoryId) {
      where.series = { categoryId: opts.categoryId };
    }

    const items = await this.prisma.item.findMany({
      where,
      include: {
        series: {
          select: {
            name: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
      take: take + 1,
      ...(opts.cursor && {
        cursor: { id: opts.cursor },
        skip: 1,
      }),
    });

    const hasMore = items.length > take;
    const pageItems = items.slice(0, take);
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

    // Batch check viewer statuses
    let ownedSet = new Set<string>();
    let wishlistSet = new Set<string>();
    if (viewerId) {
      const itemIds = pageItems.map((i) => i.id);
      const statuses = await this.getItemStatuses(viewerId, itemIds);
      ownedSet = statuses.ownedSet;
      wishlistSet = statuses.wishlistSet;
    }

    return {
      items: pageItems.map((item) => ({
        id: item.id,
        seriesId: item.seriesId,
        name: item.name,
        description: item.description,
        imageUrl: item.imageKey,
        releaseDate: item.releaseDate?.toISOString() ?? null,
        seriesName: item.series.name,
        categoryName: item.series.category.name,
        isOwned: ownedSet.has(item.id),
        isWishlisted: wishlistSet.has(item.id),
      })),
      nextCursor,
      hasMore,
    };
  }

  /**
   * Toggle owned status for an item (mutual exclusion with wishlist)
   */
  async toggleOwned(
    userId: string,
    itemId: string,
  ): Promise<{ success: true; isOwned: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.ownedItem.findUnique({
        where: { userId_itemId: { userId, itemId } },
      });

      if (existing) {
        await tx.ownedItem.delete({
          where: { id: existing.id },
        });
        return { success: true as const, isOwned: false };
      }

      // Remove from wishlist first (mutual exclusion)
      await tx.wishlistItem.deleteMany({
        where: { userId, itemId },
      });

      try {
        await tx.ownedItem.create({
          data: { userId, itemId },
        });
      } catch (error: any) {
        // P2002: Unique constraint violation (concurrent create -- idempotent)
        if (error.code === 'P2002') {
          return { success: true as const, isOwned: true };
        }
        throw error;
      }

      return { success: true as const, isOwned: true };
    });
  }

  /**
   * Toggle wishlist status for an item (mutual exclusion with owned)
   */
  async toggleWishlist(
    userId: string,
    itemId: string,
  ): Promise<{ success: true; isWishlisted: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.wishlistItem.findUnique({
        where: { userId_itemId: { userId, itemId } },
      });

      if (existing) {
        await tx.wishlistItem.delete({
          where: { id: existing.id },
        });
        return { success: true as const, isWishlisted: false };
      }

      // Remove from owned first (mutual exclusion)
      await tx.ownedItem.deleteMany({
        where: { userId, itemId },
      });

      try {
        await tx.wishlistItem.create({
          data: { userId, itemId },
        });
      } catch (error: any) {
        // P2002: Unique constraint violation (concurrent create -- idempotent)
        if (error.code === 'P2002') {
          return { success: true as const, isWishlisted: true };
        }
        throw error;
      }

      return { success: true as const, isWishlisted: true };
    });
  }

  /**
   * Toggle follow state for a category
   */
  async followCategory(
    userId: string,
    categoryId: string,
  ): Promise<{ success: true; isFollowed: boolean }> {
    const existing = await this.prisma.categoryFollow.findUnique({
      where: { userId_categoryId: { userId, categoryId } },
    });

    if (existing) {
      await this.prisma.categoryFollow.delete({
        where: { id: existing.id },
      });
      return { success: true, isFollowed: false };
    }

    try {
      await this.prisma.categoryFollow.create({
        data: { userId, categoryId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return { success: true, isFollowed: true };
      }
      throw error;
    }

    return { success: true, isFollowed: true };
  }

  /**
   * Toggle follow state for a series
   */
  async followSeries(
    userId: string,
    seriesId: string,
  ): Promise<{ success: true; isFollowed: boolean }> {
    const existing = await this.prisma.seriesFollow.findUnique({
      where: { userId_seriesId: { userId, seriesId } },
    });

    if (existing) {
      await this.prisma.seriesFollow.delete({
        where: { id: existing.id },
      });
      return { success: true, isFollowed: false };
    }

    try {
      await this.prisma.seriesFollow.create({
        data: { userId, seriesId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return { success: true, isFollowed: true };
      }
      throw error;
    }

    return { success: true, isFollowed: true };
  }

  /**
   * Batch check owned/wishlist status for a list of items (IN clause + Set for O(1) lookup)
   */
  async getItemStatuses(
    userId: string,
    itemIds: string[],
  ): Promise<{ ownedSet: Set<string>; wishlistSet: Set<string> }> {
    const [owned, wishlisted] = await Promise.all([
      this.prisma.ownedItem.findMany({
        where: { userId, itemId: { in: itemIds } },
        select: { itemId: true },
      }),
      this.prisma.wishlistItem.findMany({
        where: { userId, itemId: { in: itemIds } },
        select: { itemId: true },
      }),
    ]);

    return {
      ownedSet: new Set(owned.map((o) => o.itemId)),
      wishlistSet: new Set(wishlisted.map((w) => w.itemId)),
    };
  }

  /**
   * Get paginated owned items for a user's profile showcase
   */
  async getUserOwnedItems(
    username: string,
    viewerId?: string,
    cursor?: string,
    take = 20,
  ): Promise<PaginatedResult<ItemResponse>> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    const ownedItems = await this.prisma.ownedItem.findMany({
      where: { userId: user.id },
      include: {
        item: {
          include: {
            series: {
              select: {
                name: true,
                slug: true,
                category: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = ownedItems.length > take;
    const pageItems = ownedItems.slice(0, take);
    const nextCursor = hasMore ? pageItems[pageItems.length - 1].id : null;

    return {
      items: pageItems.map((oi) => ({
        id: oi.item.id,
        seriesId: oi.item.seriesId,
        name: oi.item.name,
        description: oi.item.description,
        imageUrl: oi.item.imageKey,
        releaseDate: oi.item.releaseDate?.toISOString() ?? null,
        seriesName: oi.item.series.name,
        categoryName: oi.item.series.category.name,
        isOwned: true,
        isWishlisted: false,
      })),
      nextCursor,
      hasMore,
    };
  }
}
