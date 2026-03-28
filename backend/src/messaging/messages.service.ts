import {
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { StorageService } from '../media/storage.service';
import { MessageResponseMapper } from './dto/message-response.dto';
import { MESSAGING_LIMITS } from '@figly/shared';
import type { MessageResponse, MessageListResponse } from '@figly/shared';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private moderationService: ModerationService,
    private storageService: StorageService,
  ) {}

  private readonly senderSelect = {
    id: true,
    username: true,
    name: true,
    avatar: { select: { mediumKey: true } },
  };

  async sendMessage(
    senderId: string,
    conversationId: string,
    content?: string,
    mediaIds?: string[],
  ): Promise<MessageResponse> {
    // Verify participant
    const membership = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });

    if (!membership) {
      throw new ForbiddenException('Ban khong phai thanh vien hoi thoai nay');
    }

    // For 1-on-1, check block
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: conversation_is_group_include(false),
    });

    if (conversation && !conversation.isGroup) {
      const otherParticipant = conversation.participants?.find(
        (p: any) => p.userId !== senderId,
      );
      if (otherParticipant) {
        const blocked = await this.moderationService.isBlocked(senderId, otherParticipant.userId);
        if (blocked) {
          throw new ForbiddenException('Khong the gui tin nhan cho nguoi dung da chan');
        }
      }
    }

    // Create message in transaction
    const message = await this.prisma.$transaction(async (tx: any) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId,
          content: content || null,
          ...(mediaIds?.length && {
            media: {
              create: mediaIds.map((mediaId: string, index: number) => ({
                mediaId,
                position: index,
              })),
            },
          }),
        },
        include: {
          sender: { select: this.senderSelect },
          media: {
            include: { media: true },
            orderBy: { position: 'asc' as const },
          },
        },
      });

      // Update conversation.updatedAt
      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return msg;
    });

    return MessageResponseMapper.mapMessage(message, this.storageService);
  }

  async getMessages(
    userId: string,
    conversationId: string,
    cursor?: string,
    limit: number = MESSAGING_LIMITS.messagesPageSize,
  ): Promise<MessageListResponse> {
    // Verify participant
    const membership = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('Ban khong phai thanh vien hoi thoai nay');
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: this.senderSelect },
        media: {
          include: { media: true },
          orderBy: { position: 'asc' as const },
        },
      },
      orderBy: { createdAt: 'desc' as const },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = messages.length > limit;
    const items = messages.slice(0, limit);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const mappedItems: MessageResponse[] = [];
    for (const msg of items) {
      mappedItems.push(await MessageResponseMapper.mapMessage(msg, this.storageService));
    }

    return { items: mappedItems, nextCursor, hasMore };
  }

  async markRead(userId: string, conversationId: string) {
    const membership = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('Ban khong phai thanh vien hoi thoai nay');
    }

    const updated = await this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });

    return { lastReadAt: updated.lastReadAt };
  }

  async getUnreadCount(userId: string, conversationId: string): Promise<number> {
    const membership = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership) {
      return 0;
    }

    return this.prisma.message.count({
      where: {
        conversationId,
        createdAt: { gt: membership.lastReadAt },
        senderId: { not: userId },
      },
    });
  }

  async getUnreadTotal(userId: string) {
    const participations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true, lastReadAt: true },
    });

    if (participations.length === 0) {
      return { total: 0 };
    }

    let total = 0;
    for (const p of participations) {
      const count = await this.prisma.message.count({
        where: {
          conversationId: p.conversationId,
          createdAt: { gt: p.lastReadAt },
          senderId: { not: userId },
        },
      });
      total += count;
    }

    return { total };
  }
}

// Helper to conditionally include participants for block check
function conversation_is_group_include(needParticipants: boolean) {
  return {
    participants: needParticipants
      ? { select: { userId: true } }
      : { select: { userId: true } },
  };
}
