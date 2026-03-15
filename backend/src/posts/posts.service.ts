import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../media/storage.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { POST_LIMITS } from '@figly/shared';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    @InjectQueue('notification') private notificationQueue: Queue,
  ) {}

  async createPost(userId: string, dto: CreatePostDto) {
    // Validate all mediaIds belong to user and are COMPLETED
    const mediaRecords = await this.prisma.media.findMany({
      where: {
        id: { in: dto.mediaIds },
        userId,
        status: 'COMPLETED',
      },
    });

    if (mediaRecords.length !== dto.mediaIds.length) {
      throw new BadRequestException('Mot hoac nhieu hinh anh khong hop le');
    }

    // Extract hashtags from caption
    const hashtags = this.extractHashtags(dto.caption || '');

    // Create post + PostMedia entries + hashtag links + PostItem links in transaction
    const post = await this.prisma.$transaction(async (tx: any) => {
      const post = await tx.post.create({
        data: {
          userId,
          caption: dto.caption,
          media: {
            create: dto.mediaIds.map((mediaId: string, index: number) => ({
              mediaId,
              position: index,
            })),
          },
        },
      });

      // Upsert hashtags and create links
      if (hashtags.length > 0) {
        for (const tag of hashtags) {
          const hashtag = await tx.hashtag.upsert({
            where: { name: tag },
            update: {},
            create: { name: tag },
          });
          await tx.postHashtag.create({
            data: { postId: post.id, hashtagId: hashtag.id },
          });
        }
      }

      // Create PostItem links for linked collection items
      if (dto.linkedItemIds && dto.linkedItemIds.length > 0) {
        for (const itemId of dto.linkedItemIds) {
          await tx.postItem.create({
            data: { postId: post.id, itemId },
          });
        }
      }

      return post;
    });

    return post;
  }

  async getPost(postId: string, viewerId: string | null) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
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
            media: { select: { id: true, largeKey: true } },
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
    });

    if (!post) {
      throw new NotFoundException('Bai viet khong ton tai');
    }

    // Batch check isLiked/isBookmarked for viewer (skip when unauthenticated)
    let likedSet = new Set<string>();
    let bookmarkedSet = new Set<string>();
    if (viewerId) {
      const [likes, bookmarks] = await Promise.all([
        this.prisma.like.findMany({
          where: { userId: viewerId, postId: { in: [postId] } },
          select: { postId: true },
        }),
        this.prisma.bookmark.findMany({
          where: { userId: viewerId, postId: { in: [postId] } },
          select: { postId: true },
        }),
      ]);
      likedSet = new Set(likes.map((l: any) => l.postId));
      bookmarkedSet = new Set(bookmarks.map((b: any) => b.postId));
    }

    // Resolve presigned URLs for author avatar and all media
    const storageKeys: string[] = [];
    if (post.user.avatar?.mediumKey) {
      storageKeys.push(post.user.avatar.mediumKey);
    }
    for (const pm of post.media) {
      if (pm.media.largeKey) {
        storageKeys.push(pm.media.largeKey);
      }
    }

    const urlMap = new Map<string, string>();
    const urls = await Promise.all(
      storageKeys.map((key) => this.storageService.getPresignedUrl(key)),
    );
    storageKeys.forEach((key, i) => urlMap.set(key, urls[i]));

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
      media: post.media.map((pm: any) => ({
        id: pm.id,
        mediaId: pm.mediaId,
        position: pm.position,
        url: pm.media.largeKey ? urlMap.get(pm.media.largeKey) || '' : '',
      })),
      linkedItems: this.mapLinkedItems((post as any).items),
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      isLiked: likedSet.has(post.id),
      isBookmarked: bookmarkedSet.has(post.id),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  }

  async updateCaption(postId: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      throw new NotFoundException('Bai viet khong ton tai');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('Ban khong co quyen chinh sua bai viet nay');
    }

    // Extract new hashtags
    const hashtags = this.extractHashtags(dto.caption || '');

    // Update caption and re-link hashtags in transaction
    const updated = await this.prisma.$transaction(async (tx: any) => {
      const updatedPost = await tx.post.update({
        where: { id: postId },
        data: { caption: dto.caption },
      });

      // Delete old PostHashtag records
      await tx.postHashtag.deleteMany({
        where: { postId },
      });

      // Upsert new hashtags and create links
      if (hashtags.length > 0) {
        for (const tag of hashtags) {
          const hashtag = await tx.hashtag.upsert({
            where: { name: tag },
            update: {},
            create: { name: tag },
          });
          await tx.postHashtag.create({
            data: { postId, hashtagId: hashtag.id },
          });
        }
      }

      return updatedPost;
    });

    return updated;
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      throw new NotFoundException('Bai viet khong ton tai');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('Ban khong co quyen xoa bai viet nay');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });
  }

  async toggleLike(userId: string, postId: string, like: boolean) {
    if (like) {
      try {
        await this.prisma.like.create({
          data: { userId, postId },
        });

        // Enqueue notification for post author
        const post = await this.prisma.post.findUnique({
          where: { id: postId },
          select: { userId: true },
        });
        if (post) {
          await this.notificationQueue.add('notification', {
            type: 'like',
            actorId: userId,
            recipientId: post.userId,
            targetId: postId,
            targetType: 'post',
          });
        }
      } catch (error: any) {
        if (error.code === 'P2002') return { success: true };
        throw error;
      }
    } else {
      try {
        await this.prisma.like.delete({
          where: { userId_postId: { userId, postId } },
        });
      } catch (error: any) {
        if (error.code === 'P2025') return { success: true };
        throw error;
      }
    }
    return { success: true };
  }

  async toggleBookmark(userId: string, postId: string, bookmark: boolean) {
    if (bookmark) {
      try {
        await this.prisma.bookmark.create({
          data: { userId, postId },
        });
      } catch (error: any) {
        if (error.code === 'P2002') return { success: true };
        throw error;
      }
    } else {
      try {
        await this.prisma.bookmark.delete({
          where: { userId_postId: { userId, postId } },
        });
      } catch (error: any) {
        if (error.code === 'P2025') return { success: true };
        throw error;
      }
    }
    return { success: true };
  }

  async getSavedPosts(userId: string, cursor?: string, take = POST_LIMITS.feedPageSize) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: {
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
                media: { select: { id: true, largeKey: true } },
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
        },
      },
      orderBy: { createdAt: 'desc' as const },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = bookmarks.length > take;
    const items = bookmarks.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Batch check like status for these posts
    const postIds = items.map((b: any) => b.post.id);
    const likes = await this.prisma.like.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    const likedSet = new Set(likes.map((l: any) => l.postId));

    // Batch resolve presigned URLs
    const urlMap = await this.resolvePresignedUrls(items.map((b: any) => b.post));

    return {
      items: items.map((b: any) => this.mapPostResponse(b.post, likedSet, new Set(postIds), urlMap)),
      nextCursor,
      hasMore,
    };
  }

  async getUserPosts(username: string, viewerId: string | null, cursor?: string, take = POST_LIMITS.feedPageSize) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    const posts = await this.prisma.post.findMany({
      where: { userId: user.id },
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
            media: { select: { id: true, largeKey: true } },
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

    // Batch check like/bookmark status (skip when unauthenticated)
    const postIds = items.map((p: any) => p.id);
    let likedSet = new Set<string>();
    let bookmarkedSet = new Set<string>();
    if (viewerId) {
      const [likes, bookmarks] = await Promise.all([
        this.prisma.like.findMany({
          where: { userId: viewerId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.bookmark.findMany({
          where: { userId: viewerId, postId: { in: postIds } },
          select: { postId: true },
        }),
      ]);
      likedSet = new Set(likes.map((l: any) => l.postId));
      bookmarkedSet = new Set(bookmarks.map((b: any) => b.postId));
    }

    // Batch resolve presigned URLs
    const urlMap = await this.resolvePresignedUrls(items);

    return {
      items: items.map((post: any) => this.mapPostResponse(post, likedSet, bookmarkedSet, urlMap)),
      nextCursor,
      hasMore,
    };
  }

  async searchHashtags(query: string, limit = 10) {
    return this.prisma.hashtag.findMany({
      where: { name: { startsWith: query.toLowerCase(), mode: 'insensitive' } },
      take: limit,
    });
  }

  async getPostsByHashtag(
    hashtagName: string,
    viewerId: string | null,
    cursor?: string,
    take = POST_LIMITS.feedPageSize,
  ) {
    const name = hashtagName.toLowerCase();

    const hashtag = await this.prisma.hashtag.findUnique({
      where: { name },
      include: { _count: { select: { posts: true } } },
    });

    if (!hashtag) {
      throw new NotFoundException('Hashtag khong ton tai');
    }

    const posts = await this.prisma.post.findMany({
      where: {
        hashtags: { some: { hashtag: { name } } },
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
            media: { select: { id: true, largeKey: true } },
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

    // Batch check like/bookmark status (skip when unauthenticated)
    const postIds = items.map((p: any) => p.id);
    let likedSet = new Set<string>();
    let bookmarkedSet = new Set<string>();
    if (viewerId) {
      const [likes, bookmarks] = await Promise.all([
        this.prisma.like.findMany({
          where: { userId: viewerId, postId: { in: postIds } },
          select: { postId: true },
        }),
        this.prisma.bookmark.findMany({
          where: { userId: viewerId, postId: { in: postIds } },
          select: { postId: true },
        }),
      ]);
      likedSet = new Set(likes.map((l: any) => l.postId));
      bookmarkedSet = new Set(bookmarks.map((b: any) => b.postId));
    }

    // Batch resolve presigned URLs
    const urlMap = await this.resolvePresignedUrls(items);

    return {
      hashtag: {
        id: hashtag.id,
        name: hashtag.name,
        postCount: (hashtag as any)._count.posts,
      },
      items: items.map((post: any) => this.mapPostResponse(post, likedSet, bookmarkedSet, urlMap)),
      nextCursor,
      hasMore,
    };
  }

  private extractHashtags(text: string): string[] {
    const matches = text.match(/#([\p{L}\p{N}_]+)/gu);
    if (!matches) return [];
    return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
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

    // Deduplicate keys
    const uniqueKeys = [...new Set(storageKeys)];
    const urlMap = new Map<string, string>();

    if (uniqueKeys.length === 0) return urlMap;

    const urls = await Promise.all(
      uniqueKeys.map((key) => this.storageService.getPresignedUrl(key)),
    );
    uniqueKeys.forEach((key, i) => urlMap.set(key, urls[i]));

    return urlMap;
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
}
