import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../media/storage.service';
import { ModerationService } from '../moderation/moderation.service';
import { POST_LIMITS } from '@figly/shared';
import type { ExploreCategorySection } from '@figly/shared';

@Injectable()
export class FeedService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private moderationService: ModerationService,
  ) {}

  async getFeed(userId: string, cursor?: string, take = POST_LIMITS.feedPageSize) {
    // Fetch blocked and muted IDs once
    const [blockedIds, mutedIds] = await Promise.all([
      this.moderationService.getBlockedUserIds(userId),
      this.moderationService.getMutedUserIds(userId),
    ]);
    const excludeFromFeed = [...new Set([...blockedIds, ...mutedIds])];

    // Get posts from users the viewer follows + own posts
    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          { userId },
          {
            user: {
              followers: {
                some: { followerId: userId },
              },
            },
          },
        ],
        // Exclude blocked + muted users' posts AND banned users
        userId: excludeFromFeed.length > 0 ? { notIn: excludeFromFeed } : undefined,
        user: { isBanned: false },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: { select: { mediumKey: true } },
          },
        },
        media: {
          include: {
            media: { select: { id: true, largeKey: true, mediumKey: true } },
          },
          orderBy: { position: 'asc' as const },
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                imageKey: true,
                series: {
                  select: {
                    name: true,
                    category: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' as const },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = posts.length > take;
    const items = posts.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Batch check like + bookmark status for viewer
    const postIds = items.map((p: any) => p.id);
    const [likes, bookmarks] = await Promise.all([
      this.prisma.like.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
      this.prisma.bookmark.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      }),
    ]);
    const likedSet = new Set(likes.map((l: any) => l.postId));
    const bookmarkedSet = new Set(bookmarks.map((b: any) => b.postId));

    // Batch resolve presigned URLs
    const urlMap = await this.resolvePresignedUrls(items);

    return {
      items: items.map((post: any) => this.mapPostResponse(post, likedSet, bookmarkedSet, urlMap)),
      nextCursor,
      hasMore,
    };
  }

  async getPublicFeed(cursor?: string, take = POST_LIMITS.feedPageSize) {
    // Query all posts from all users, ordered chronologically
    const posts = await this.prisma.post.findMany({
      where: {
        user: { isBanned: false },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: { select: { mediumKey: true } },
          },
        },
        media: {
          include: {
            media: { select: { id: true, largeKey: true, mediumKey: true } },
          },
          orderBy: { position: 'asc' as const },
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                imageKey: true,
                series: {
                  select: {
                    name: true,
                    category: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' as const },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = posts.length > take;
    const items = posts.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // No viewer = no like/bookmark status queries
    const emptySet = new Set<string>();

    // Batch resolve presigned URLs
    const urlMap = await this.resolvePresignedUrls(items);

    return {
      items: items.map((post: any) => this.mapPostResponse(post, emptySet, emptySet, urlMap)),
      nextCursor,
      hasMore,
    };
  }

  async getExploreFeed(): Promise<ExploreCategorySection[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { position: 'asc' },
    });

    if (categories.length === 0) return [];

    const sections: ExploreCategorySection[] = [];
    const allPosts: any[] = [];

    // For each category, query up to 10 recent posts that have linked items in that category
    for (const category of categories) {
      const posts = await this.prisma.post.findMany({
        where: {
          items: { some: { item: { series: { categoryId: category.id } } } },
          user: { isBanned: false },
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: { select: { mediumKey: true } },
            },
          },
          media: {
            include: {
              media: { select: { id: true, largeKey: true, mediumKey: true } },
            },
            orderBy: { position: 'asc' as const },
          },
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  imageKey: true,
                  series: {
                    select: {
                      name: true,
                      category: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
          _count: { select: { likes: true, comments: true } },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 10,
      });

      if (posts.length > 0) {
        allPosts.push(...posts);
        sections.push({
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
          },
          posts: posts as any, // Will be mapped after URL resolution
        });
      }
    }

    // Batch resolve presigned URLs for ALL posts across ALL sections in one call
    const urlMap = await this.resolvePresignedUrls(allPosts);

    // Explore is public -- no viewer interaction status
    const emptySet = new Set<string>();

    // Map posts with resolved URLs
    return sections.map((section) => ({
      ...section,
      posts: (section.posts as any[]).map((post: any) =>
        this.mapPostResponse(post, emptySet, emptySet, urlMap),
      ),
    }));
  }

  private mapPostResponse(
    post: any,
    likedSet: Set<string>,
    bookmarkedSet: Set<string>,
    urlMap: Map<string, string>,
  ) {
    return {
      id: post.id,
      author: {
        id: post.user.id,
        username: post.user.username,
        displayName: post.user.name,
        avatarUrl: post.user.avatar?.mediumKey
          ? urlMap.get(post.user.avatar.mediumKey) || null
          : null,
      },
      caption: post.caption,
      media: (post.media || []).map((pm: any) => ({
        id: pm.id,
        mediaId: pm.mediaId,
        position: pm.position,
        url: pm.media?.largeKey ? urlMap.get(pm.media.largeKey) || '' : '',
      })),
      linkedItems: this.mapLinkedItems(post.items),
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      isLiked: likedSet.has(post.id),
      isBookmarked: bookmarkedSet.has(post.id),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  private mapLinkedItems(items?: any[]): any[] {
    if (!items || items.length === 0) return [];
    return items.map((pi: any) => ({
      id: pi.item.id,
      name: pi.item.name,
      seriesName: pi.item.series?.name ?? '',
      categoryName: pi.item.series?.category?.name ?? '',
      imageUrl: pi.item.imageKey ?? null,
    }));
  }

  private async resolvePresignedUrls(posts: any[]): Promise<Map<string, string>> {
    const storageKeys: string[] = [];

    for (const post of posts) {
      if (post.user?.avatar?.mediumKey) {
        storageKeys.push(post.user.avatar.mediumKey);
      }
      for (const pm of post.media || []) {
        if (pm.media?.largeKey) {
          storageKeys.push(pm.media.largeKey);
        }
      }
    }

    const uniqueKeys = [...new Set(storageKeys)];
    const urlMap = new Map<string, string>();

    if (uniqueKeys.length === 0) return urlMap;

    const urls = await Promise.all(
      uniqueKeys.map((key) => this.storageService.getPresignedUrl(key)),
    );
    uniqueKeys.forEach((key, i) => urlMap.set(key, urls[i]));

    return urlMap;
  }
}
