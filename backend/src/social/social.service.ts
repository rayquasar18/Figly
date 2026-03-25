import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ListOptions {
  cursor?: string;
  search?: string;
  take?: number;
}

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

  async follow(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Ban khong the tu theo doi chinh minh');
    }

    try {
      const follow = await this.prisma.follow.create({
        data: {
          followerId: userId,
          followingId: targetUserId,
        },
      });
      return follow;
    } catch (error: any) {
      // P2002: Unique constraint violation (already following)
      if (error.code === 'P2002') {
        return { success: true };
      }
      throw error;
    }
  }

  async unfollow(userId: string, targetUserId: string) {
    try {
      const result = await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId,
          },
        },
      });
      return result;
    } catch (error: any) {
      // P2025: Record to delete does not exist
      if (error.code === 'P2025') {
        return { success: true };
      }
      throw error;
    }
  }

  async getFollowers(username: string, viewerId: string | null, options: ListOptions) {
    const take = options.take || 20;

    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    const where: any = { followingId: user.id };

    if (options.search) {
      where.follower = {
        OR: [
          { username: { contains: options.search, mode: 'insensitive' } },
          { name: { contains: options.search, mode: 'insensitive' } },
        ],
      };
    }

    const follows = await this.prisma.follow.findMany({
      where,
      select: {
        id: true,
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarId: true,
            avatar: { select: { thumbnailKey: true } },
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(options.cursor && {
        cursor: { id: options.cursor },
        skip: 1,
      }),
    });

    const hasMore = follows.length > take;
    const items = follows.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Batch check follow status for viewer (skip when unauthenticated)
    let followingSet = new Set<string>();
    if (viewerId) {
      const followerIds = items.map((f) => f.follower.id);
      const viewerFollows = await this.prisma.follow.findMany({
        where: {
          followerId: viewerId,
          followingId: { in: followerIds },
        },
        select: { followingId: true },
      });
      followingSet = new Set(viewerFollows.map((f) => f.followingId));
    }

    return {
      items: items.map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        displayName: f.follower.name,
        avatarUrl: null, // Presigned URLs resolved at frontend layer or via separate endpoint
        isFollowing: followingSet.has(f.follower.id),
      })),
      nextCursor,
      hasMore,
    };
  }

  async getFollowing(username: string, viewerId: string | null, options: ListOptions) {
    const take = options.take || 20;

    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    const where: any = { followerId: user.id };

    if (options.search) {
      where.following = {
        OR: [
          { username: { contains: options.search, mode: 'insensitive' } },
          { name: { contains: options.search, mode: 'insensitive' } },
        ],
      };
    }

    const follows = await this.prisma.follow.findMany({
      where,
      select: {
        id: true,
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarId: true,
            avatar: { select: { thumbnailKey: true } },
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(options.cursor && {
        cursor: { id: options.cursor },
        skip: 1,
      }),
    });

    const hasMore = follows.length > take;
    const items = follows.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Batch check follow status for viewer (skip when unauthenticated)
    let followingSet = new Set<string>();
    if (viewerId) {
      const followingIds = items.map((f) => f.following.id);
      const viewerFollows = await this.prisma.follow.findMany({
        where: {
          followerId: viewerId,
          followingId: { in: followingIds },
        },
        select: { followingId: true },
      });
      followingSet = new Set(viewerFollows.map((f) => f.followingId));
    }

    return {
      items: items.map((f) => ({
        id: f.following.id,
        username: f.following.username,
        displayName: f.following.name,
        avatarUrl: null,
        isFollowing: followingSet.has(f.following.id),
      })),
      nextCursor,
      hasMore,
    };
  }

  async removeFollower(ownerId: string, followerUserId: string) {
    try {
      const result = await this.prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: followerUserId,
            followingId: ownerId,
          },
        },
      });
      return result;
    } catch (error: any) {
      // P2025: Record to delete does not exist
      if (error.code === 'P2025') {
        return { success: true };
      }
      throw error;
    }
  }
}
