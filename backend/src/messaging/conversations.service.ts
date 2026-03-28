import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ModerationService } from '../moderation/moderation.service';
import { StorageService } from '../media/storage.service';
import { MessageResponseMapper } from './dto/message-response.dto';
import { MESSAGING_LIMITS } from '@figly/shared';
import type { ConversationResponse, ConversationListResponse, UnreadTotalResponse } from '@figly/shared';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private moderationService: ModerationService,
    private storageService: StorageService,
  ) {}

  private readonly participantInclude = {
    user: {
      select: {
        id: true,
        username: true,
        name: true,
        avatar: { select: { mediumKey: true } },
      },
    },
  };

  async createConversation(
    userId: string,
    dto: { participantIds: string[]; isGroup?: boolean; name?: string; description?: string; categoryId?: string },
  ): Promise<ConversationResponse> {
    const isGroup = dto.isGroup || dto.participantIds.length > 1;

    // For 1-on-1, check block and dedup
    if (!isGroup) {
      const otherId = dto.participantIds[0];
      const blocked = await this.moderationService.isBlocked(userId, otherId);
      if (blocked) {
        throw new ForbiddenException('Khong the tao hoi thoai voi nguoi dung da chan');
      }

      // Check for existing 1-on-1 conversation
      const existing = await this.prisma.conversation.findFirst({
        where: {
          isGroup: false,
          AND: [
            { participants: { some: { userId } } },
            { participants: { some: { userId: otherId } } },
          ],
        },
        include: {
          participants: { include: this.participantInclude },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' as const },
            include: {
              sender: {
                select: { id: true, username: true, name: true, avatar: { select: { mediumKey: true } } },
              },
              media: { include: { media: true }, orderBy: { position: 'asc' as const } },
            },
          },
        },
      });

      if (existing) {
        return MessageResponseMapper.mapConversation(existing, userId, this.storageService, 0);
      }
    }

    // Create conversation in transaction
    const conversation = await this.prisma.$transaction(async (tx: any) => {
      const allParticipantIds = [userId, ...dto.participantIds.filter((id: string) => id !== userId)];

      const conv = await tx.conversation.create({
        data: {
          isGroup,
          name: isGroup ? (dto.name || null) : null,
          description: isGroup ? (dto.description || null) : null,
          categoryId: dto.categoryId || null,
          createdById: userId,
          participants: {
            create: allParticipantIds.map((id: string, index: number) => ({
              userId: id,
              role: isGroup && id === userId ? 'admin' : 'member',
            })),
          },
        },
        include: {
          participants: { include: this.participantInclude },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' as const },
            include: {
              sender: {
                select: { id: true, username: true, name: true, avatar: { select: { mediumKey: true } } },
              },
              media: { include: { media: true }, orderBy: { position: 'asc' as const } },
            },
          },
        },
      });

      return conv;
    });

    return MessageResponseMapper.mapConversation(conversation, userId, this.storageService, 0);
  }

  async getConversations(
    userId: string,
    cursor?: string,
    limit: number = MESSAGING_LIMITS.conversationsPageSize,
  ): Promise<ConversationListResponse> {
    const blockedIds = await this.moderationService.getBlockedUserIds(userId);

    const participations = await this.prisma.conversationParticipant.findMany({
      where: {
        userId,
        conversation: blockedIds.length > 0
          ? {
              // Filter out 1-on-1 conversations with blocked users
              OR: [
                { isGroup: true },
                {
                  isGroup: false,
                  participants: { none: { userId: { in: blockedIds } } },
                },
              ],
            }
          : undefined,
      },
      include: {
        conversation: {
          include: {
            participants: { include: this.participantInclude },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' as const },
              include: {
                sender: {
                  select: { id: true, username: true, name: true, avatar: { select: { mediumKey: true } } },
                },
                media: { include: { media: true }, orderBy: { position: 'asc' as const } },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' as const } },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    const hasMore = participations.length > limit;
    const items = participations.slice(0, limit);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    const mappedItems: ConversationResponse[] = [];
    for (const p of items) {
      const unreadCount = await this.prisma.message.count({
        where: {
          conversationId: p.conversationId,
          createdAt: { gt: p.lastReadAt },
          senderId: { not: userId },
        },
      });

      mappedItems.push(
        await MessageResponseMapper.mapConversation(
          p.conversation,
          userId,
          this.storageService,
          unreadCount,
        ),
      );
    }

    return { items: mappedItems, nextCursor, hasMore };
  }

  async getConversation(userId: string, conversationId: string): Promise<ConversationResponse> {
    const membership = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('Ban khong phai thanh vien hoi thoai nay');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: { include: this.participantInclude },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' as const },
          include: {
            sender: {
              select: { id: true, username: true, name: true, avatar: { select: { mediumKey: true } } },
            },
            media: { include: { media: true }, orderBy: { position: 'asc' as const } },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Khong tim thay hoi thoai');
    }

    const unreadCount = await this.prisma.message.count({
      where: {
        conversationId,
        createdAt: { gt: membership.lastReadAt },
        senderId: { not: userId },
      },
    });

    return MessageResponseMapper.mapConversation(conversation, userId, this.storageService, unreadCount);
  }

  async addParticipant(userId: string, conversationId: string, targetUserId: string) {
    const membership = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('Ban khong phai thanh vien hoi thoai nay');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation?.isGroup) {
      throw new ForbiddenException('Chi co the them thanh vien vao nhom chat');
    }

    return this.prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId: targetUserId,
        role: 'member',
      },
    });
  }

  async removeParticipant(userId: string, conversationId: string, targetUserId: string) {
    const membership = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('Ban khong phai thanh vien hoi thoai nay');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation?.isGroup) {
      throw new ForbiddenException('Chi co the xoa thanh vien khoi nhom chat');
    }

    // Verify target is a member
    const targetMembership = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
    });

    if (!targetMembership) {
      throw new NotFoundException('Nguoi dung khong phai thanh vien');
    }

    // Only admin can remove others (or removing self)
    if (targetUserId !== userId && (membership as any).role !== 'admin') {
      throw new ForbiddenException('Chi quan tri vien moi co the xoa thanh vien');
    }

    await this.prisma.conversationParticipant.delete({
      where: { conversationId_userId: { conversationId, userId: targetUserId } },
    });
  }

  async leaveConversation(userId: string, conversationId: string) {
    const membership = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });

    if (!membership) {
      throw new ForbiddenException('Ban khong phai thanh vien hoi thoai nay');
    }

    await this.prisma.conversationParticipant.delete({
      where: { id: membership.id },
    });
  }

  async getUnreadTotal(userId: string): Promise<UnreadTotalResponse> {
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
