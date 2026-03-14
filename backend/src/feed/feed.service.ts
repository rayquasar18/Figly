import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../media/storage.service';
import { POST_LIMITS } from '@figly/shared';

@Injectable()
export class FeedService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async getFeed(userId: string, cursor?: string, take = POST_LIMITS.feedPageSize) {
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
      items: items.map((post: any) => ({
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
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        isLiked: likedSet.has(post.id),
        isBookmarked: bookmarkedSet.has(post.id),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      })),
      nextCursor,
      hasMore,
    };
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
