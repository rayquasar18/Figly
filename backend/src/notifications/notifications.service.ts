import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../media/storage.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationJobData } from './dto/notification-response.dto';
import { NOTIFICATION_LIMITS } from '@figly/shared';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private storageService: StorageService,
  ) {}

  async getNotifications(userId: string, cursor?: string, limit = NOTIFICATION_LIMITS.pageSize) {
    const notifications = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      include: {
        actors: {
          take: NOTIFICATION_LIMITS.maxDisplayActors,
          orderBy: { createdAt: 'desc' as const },
          include: {
            actor: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: { select: { mediumKey: true } },
              },
            },
          },
        },
        _count: { select: { actors: true } },
      },
      orderBy: { updatedAt: 'desc' as const },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = notifications.length > limit;
    const items = notifications.slice(0, limit);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Resolve presigned URLs for actor avatars and target thumbnails
    const storageKeys: string[] = [];
    for (const notif of items) {
      for (const na of notif.actors) {
        if ((na.actor as any).avatar?.mediumKey) {
          storageKeys.push((na.actor as any).avatar.mediumKey);
        }
      }
    }

    // Collect target post thumbnail keys
    const targetPostIds = items
      .filter((n) => n.targetType === 'post' && n.targetId)
      .map((n) => n.targetId!);

    let targetThumbnailMap = new Map<string, string>();
    if (targetPostIds.length > 0) {
      const posts = await this.prisma.post.findMany({
        where: { id: { in: targetPostIds } },
        include: {
          media: {
            take: 1,
            orderBy: { position: 'asc' as const },
            include: { media: { select: { thumbnailKey: true } } },
          },
        },
      });
      for (const post of posts) {
        if (post.media[0]?.media?.thumbnailKey) {
          targetThumbnailMap.set(post.id, post.media[0].media.thumbnailKey);
          storageKeys.push(post.media[0].media.thumbnailKey);
        }
      }
    }

    const uniqueKeys = [...new Set(storageKeys)];
    const urlMap = new Map<string, string>();
    if (uniqueKeys.length > 0) {
      const urls = await Promise.all(
        uniqueKeys.map((key) => this.storageService.getPresignedUrl(key)),
      );
      uniqueKeys.forEach((key, i) => urlMap.set(key, urls[i]));
    }

    return {
      items: items.map((notif: any) => {
        const actors = notif.actors.map((na: any) => ({
          id: na.actor.id,
          username: na.actor.username,
          displayName: na.actor.name,
          avatarUrl: na.actor.avatar?.mediumKey
            ? urlMap.get(na.actor.avatar.mediumKey) || null
            : null,
        }));

        const actorCount = notif._count.actors;
        const message = this.composeMessage(notif.type.toLowerCase(), actors, actorCount);

        const thumbnailKey = notif.targetId ? targetThumbnailMap.get(notif.targetId) : undefined;

        return {
          id: notif.id,
          type: notif.type.toLowerCase(),
          actors,
          actorCount,
          targetId: notif.targetId,
          targetType: notif.targetType,
          targetThumbnail: thumbnailKey ? urlMap.get(thumbnailKey) || null : null,
          message,
          isRead: notif.isRead,
          createdAt: notif.createdAt.toISOString(),
          updatedAt: notif.updatedAt.toISOString(),
        };
      }),
      nextCursor,
      hasMore,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: userId, isRead: false },
    });
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, recipientId: userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });
  }

  async findGroupableNotification(
    type: string,
    targetId: string | undefined,
    recipientId: string,
  ) {
    if (!targetId) return null;

    const groupKey = `${type}:${targetId}`;
    const windowStart = new Date(Date.now() - NOTIFICATION_LIMITS.groupWindowMs);

    return this.prisma.notification.findFirst({
      where: {
        groupKey,
        recipientId,
        updatedAt: { gt: windowStart },
      },
    });
  }

  async createNotification(data: NotificationJobData) {
    // Skip self-notifications
    if (data.actorId === data.recipientId) return null;

    const groupKey = data.targetId
      ? `${data.type}:${data.targetId}`
      : `${data.type}:${data.actorId}`;

    const notification = await this.prisma.$transaction(async (tx: any) => {
      const notif = await tx.notification.create({
        data: {
          recipientId: data.recipientId,
          type: data.type.toUpperCase(),
          groupKey,
          targetId: data.targetId || null,
          targetType: data.targetType || null,
        },
      });

      await tx.notificationActor.create({
        data: {
          notificationId: notif.id,
          actorId: data.actorId,
        },
      });

      return notif;
    });

    // Emit SSE event
    this.gateway.emit(data.recipientId, {
      data: JSON.stringify({
        type: 'notification',
        notificationId: notification.id,
        notificationType: data.type,
      }),
    });

    return notification;
  }

  async addActorToGroup(notificationId: string, actorId: string) {
    try {
      await this.prisma.notificationActor.create({
        data: {
          notificationId,
          actorId,
        },
      });
    } catch (error: any) {
      // P2002: Actor already in this notification group (idempotent)
      if (error.code === 'P2002') return;
      throw error;
    }

    // Update notification timestamp and re-surface (set isRead=false)
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: false,
        updatedAt: new Date(),
      },
    });

    // Emit SSE event
    this.gateway.emit(notification.recipientId, {
      data: JSON.stringify({
        type: 'notification',
        notificationId,
        notificationType: notification.type.toLowerCase(),
      }),
    });

    return notification;
  }

  composeMessage(
    type: string,
    actors: Array<{ displayName: string }>,
    actorCount: number,
  ): string {
    const names = actors.map((a) => a.displayName);

    let actorText: string;
    if (actorCount === 1) {
      actorText = names[0] || '';
    } else if (actorCount === 2) {
      actorText = `${names[0]} va ${names[1] || ''}`;
    } else {
      const displayNames = names.slice(0, 2).join(', ');
      actorText = `${displayNames} va ${actorCount - 2} nguoi khac`;
    }

    switch (type) {
      case 'like':
        return `${actorText} da thich bai viet cua ban`;
      case 'comment':
        return `${actorText} da binh luan ve bai viet cua ban`;
      case 'reply':
        return `${actorText} da tra loi binh luan cua ban`;
      case 'follow':
        return `${actorText} da theo doi ban`;
      case 'mention':
        return `${actorText} da nhac den ban trong mot binh luan`;
      default:
        return `${actorText} da tuong tac voi ban`;
    }
  }
}
