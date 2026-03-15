import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../media/storage.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { POST_LIMITS } from '@figly/shared';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private moderationService: ModerationService,
    @InjectQueue('notification') private notificationQueue: Queue,
  ) {}

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    // Verify post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, userId: true },
    });

    if (!post) {
      throw new NotFoundException('Bai viet khong ton tai');
    }

    // Prevent commenting on blocked user's post
    if (post.userId !== userId) {
      const isBlocked = await this.moderationService.isBlocked(userId, post.userId);
      if (isBlocked) {
        throw new BadRequestException('Khong the binh luan bai viet nay');
      }
    }

    let resolvedParentId: string | null = dto.parentId || null;

    // If parentId provided, validate and flatten depth
    if (resolvedParentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: resolvedParentId },
        select: { id: true, parentId: true },
      });

      if (!parentComment) {
        throw new NotFoundException('Binh luan goc khong ton tai');
      }

      // If parent is itself a reply, flatten to 1 level
      if (parentComment.parentId !== null) {
        resolvedParentId = parentComment.parentId;
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        userId,
        postId,
        content: dto.content,
        parentId: resolvedParentId,
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
      },
    });

    // Resolve avatar presigned URL
    const avatarUrl = comment.user.avatar?.mediumKey
      ? await this.storageService.getPresignedUrl(comment.user.avatar.mediumKey)
      : null;

    // Enqueue notification for comment/reply
    const notifiedUserIds = new Set<string>();

    if (resolvedParentId) {
      // Reply: notify parent comment author
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: resolvedParentId },
        select: { userId: true },
      });
      if (parentComment && parentComment.userId !== userId) {
        notifiedUserIds.add(parentComment.userId);
        await this.notificationQueue.add('notification', {
          type: 'reply',
          actorId: userId,
          recipientId: parentComment.userId,
          targetId: postId,
          targetType: 'post',
        });
      }
    } else {
      // Top-level comment: notify post author
      const postRecord = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { userId: true },
      });
      if (postRecord && postRecord.userId !== userId) {
        notifiedUserIds.add(postRecord.userId);
        await this.notificationQueue.add('notification', {
          type: 'comment',
          actorId: userId,
          recipientId: postRecord.userId,
          targetId: postId,
          targetType: 'post',
        });
      }
    }

    // Detect @mentions in comment body
    const mentionMatches = dto.content.match(/@(\w+)/g);
    if (mentionMatches) {
      const usernames = [...new Set(mentionMatches.map((m) => m.slice(1)))];
      const mentionedUsers = await this.prisma.user.findMany({
        where: { username: { in: usernames } },
        select: { id: true, username: true },
      });
      for (const mentioned of mentionedUsers) {
        // Skip self, skip already notified users
        if (mentioned.id === userId || notifiedUserIds.has(mentioned.id)) continue;
        notifiedUserIds.add(mentioned.id);
        await this.notificationQueue.add('notification', {
          type: 'mention',
          actorId: userId,
          recipientId: mentioned.id,
          targetId: postId,
          targetType: 'post',
        });
      }
    }

    return {
      id: comment.id,
      author: {
        id: comment.user.id,
        username: comment.user.username,
        displayName: comment.user.name,
        avatarUrl,
      },
      content: comment.content,
      parentId: comment.parentId,
      replies: [],
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async getComments(postId: string, viewerId?: string, cursor?: string, take: number = POST_LIMITS.commentsPageSize) {
    // Get blocked user IDs for filtering
    const blockedIds = viewerId ? await this.moderationService.getBlockedUserIds(viewerId) : [];

    const comments = await this.prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Only top-level comments
        userId: blockedIds.length > 0 ? { notIn: blockedIds } : undefined,
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
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: { select: { mediumKey: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' as const },
        },
      },
      orderBy: { createdAt: 'asc' as const },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = comments.length > take;
    const items = comments.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Batch resolve avatar presigned URLs
    const avatarKeys: string[] = [];
    for (const comment of items) {
      if (comment.user.avatar?.mediumKey) {
        avatarKeys.push(comment.user.avatar.mediumKey);
      }
      for (const reply of comment.replies) {
        if (reply.user.avatar?.mediumKey) {
          avatarKeys.push(reply.user.avatar.mediumKey);
        }
      }
    }

    const uniqueKeys = [...new Set(avatarKeys)];
    const urlMap = new Map<string, string>();
    if (uniqueKeys.length > 0) {
      const urls = await Promise.all(
        uniqueKeys.map((key) => this.storageService.getPresignedUrl(key)),
      );
      uniqueKeys.forEach((key, i) => urlMap.set(key, urls[i]));
    }

    return {
      items: items.map((comment: any) => ({
        id: comment.id,
        author: {
          id: comment.user.id,
          username: comment.user.username,
          displayName: comment.user.name,
          avatarUrl: comment.user.avatar?.mediumKey
            ? urlMap.get(comment.user.avatar.mediumKey) || null
            : null,
        },
        content: comment.content,
        parentId: comment.parentId,
        replies: comment.replies.map((reply: any) => ({
          id: reply.id,
          author: {
            id: reply.user.id,
            username: reply.user.username,
            displayName: reply.user.name,
            avatarUrl: reply.user.avatar?.mediumKey
              ? urlMap.get(reply.user.avatar.mediumKey) || null
              : null,
          },
          content: reply.content,
          parentId: reply.parentId,
          replies: [],
          createdAt: reply.createdAt.toISOString(),
        })),
        createdAt: comment.createdAt.toISOString(),
      })),
      nextCursor,
      hasMore,
    };
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true },
    });

    if (!comment) {
      throw new NotFoundException('Binh luan khong ton tai');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Ban khong co quyen xoa binh luan nay');
    }

    await this.prisma.comment.delete({
      where: { id: commentId },
    });
  }
}
