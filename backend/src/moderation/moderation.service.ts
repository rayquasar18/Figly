import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MODERATION_LIMITS } from '@figly/shared';

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async createReport(
    reporterId: string,
    dto: { targetId: string; targetType: string; reason: string },
  ) {
    // Prevent self-reporting
    if (dto.targetType === 'USER' && dto.targetId === reporterId) {
      throw new BadRequestException('Ban khong the bao cao chinh minh');
    }

    try {
      const report = await this.prisma.report.create({
        data: {
          reporterId,
          targetId: dto.targetId,
          targetType: dto.targetType as any,
          reason: dto.reason as any,
        },
      });
      return report;
    } catch (error: any) {
      // P2002: duplicate report -- return existing (upsert behavior)
      if (error.code === 'P2002') {
        const existing = await this.prisma.report.findMany({
          where: {
            reporterId,
            targetId: dto.targetId,
            targetType: dto.targetType as any,
          },
        });
        return existing[0] || { success: true };
      }
      throw error;
    }
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Ban khong the chan chinh minh');
    }

    await this.prisma.$transaction(async (tx: any) => {
      // Create block record (P2002 safe for idempotency)
      try {
        await tx.block.create({
          data: { blockerId, blockedId },
        });
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Already blocked -- continue to clean up follows anyway
        } else {
          throw error;
        }
      }

      // Remove follows in both directions
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: blockerId, followingId: blockedId },
            { followerId: blockedId, followingId: blockerId },
          ],
        },
      });
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    try {
      await this.prisma.block.delete({
        where: {
          blockerId_blockedId: { blockerId, blockedId },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') return; // Not blocked
      throw error;
    }
  }

  async muteUser(muterId: string, mutedId: string) {
    if (muterId === mutedId) {
      throw new BadRequestException('Ban khong the tat tieng chinh minh');
    }

    try {
      await this.prisma.mute.create({
        data: { muterId, mutedId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') return; // Already muted
      throw error;
    }
  }

  async unmuteUser(muterId: string, mutedId: string) {
    try {
      await this.prisma.mute.delete({
        where: {
          muterId_mutedId: { muterId, mutedId },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') return; // Not muted
      throw error;
    }
  }

  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.prisma.block.findMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedId: userId },
        ],
      },
      select: { blockerId: true, blockedId: true },
    });
    const ids = new Set<string>();
    for (const b of blocks) {
      if (b.blockerId !== userId) ids.add(b.blockerId);
      if (b.blockedId !== userId) ids.add(b.blockedId);
    }
    return [...ids];
  }

  async getMutedUserIds(userId: string): Promise<string[]> {
    const mutes = await this.prisma.mute.findMany({
      where: { muterId: userId },
      select: { mutedId: true },
    });
    return mutes.map((m: any) => m.mutedId);
  }

  async getBlockedUsers(userId: string, cursor?: string, take = MODERATION_LIMITS.blockedPageSize) {
    const blocks = await this.prisma.block.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: { select: { mediumKey: true } },
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

    const hasMore = blocks.length > take;
    const items = blocks.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map((b: any) => ({
        id: b.blocked.id,
        username: b.blocked.username,
        displayName: b.blocked.name,
        avatarUrl: null, // Resolved at controller layer if needed
        blockedAt: b.createdAt.toISOString(),
      })),
      nextCursor,
      hasMore,
    };
  }

  async getMutedUsers(userId: string, cursor?: string, take = MODERATION_LIMITS.mutedPageSize) {
    const mutes = await this.prisma.mute.findMany({
      where: { muterId: userId },
      include: {
        muted: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: { select: { mediumKey: true } },
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

    const hasMore = mutes.length > take;
    const items = mutes.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items: items.map((m: any) => ({
        id: m.muted.id,
        username: m.muted.username,
        displayName: m.muted.name,
        avatarUrl: null,
        mutedAt: m.createdAt.toISOString(),
      })),
      nextCursor,
      hasMore,
    };
  }

  async isBlocked(userId: string, targetId: string): Promise<boolean> {
    const block = await this.prisma.block.findMany({
      where: {
        OR: [
          { blockerId: userId, blockedId: targetId },
          { blockerId: targetId, blockedId: userId },
        ],
      },
      take: 1,
    });
    return block.length > 0;
  }

  async isMuted(userId: string, targetId: string): Promise<boolean> {
    const mute = await this.prisma.mute.findMany({
      where: { muterId: userId, mutedId: targetId },
      take: 1,
    });
    return mute.length > 0;
  }
}
