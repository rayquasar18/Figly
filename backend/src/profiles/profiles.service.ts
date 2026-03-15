import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../media/storage.service';
import { USERNAME_RULES, RESERVED_USERNAMES } from '@figly/shared';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) {}

  async getProfile(username: string, viewerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
        avatarId: true,
        avatar: {
          select: { thumbnailKey: true, mediumKey: true },
        },
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    // Check follow relationships in parallel
    const [isFollowing, isFollowedBy] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
      }),
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: user.id,
            followingId: viewerId,
          },
        },
      }),
    ]);

    // Resolve avatar presigned URL if avatar exists
    const avatarUrl = user.avatar?.mediumKey
      ? await this.storageService.getPresignedUrl(user.avatar.mediumKey)
      : null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.name,
      bio: user.bio,
      avatarUrl,
      postCount: 0, // Placeholder until Phase 3
      followerCount: user._count.followers,
      followingCount: user._count.following,
      isOwnProfile: user.id === viewerId,
      isFollowing: !!isFollowing,
      isFollowedBy: !!isFollowedBy,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }

    const updateData: Record<string, any> = {};

    // Handle display name update
    if (dto.displayName !== undefined) {
      updateData.name = dto.displayName;
    }

    // Handle bio update
    if (dto.bio !== undefined) {
      updateData.bio = dto.bio;
    }

    // Handle avatarId update
    if (dto.avatarId !== undefined) {
      updateData.avatarId = dto.avatarId;
    }

    // Handle username update
    if (dto.username !== undefined && dto.username !== user.username) {
      // Check reserved usernames
      if ((RESERVED_USERNAMES as readonly string[]).includes(dto.username.toLowerCase())) {
        throw new BadRequestException('Ten nguoi dung nay da duoc dat truoc');
      }

      // Check cooldown (14 days since last change)
      if (user.usernameChangedAt) {
        const cooldownEnd = new Date(user.usernameChangedAt);
        cooldownEnd.setDate(cooldownEnd.getDate() + USERNAME_RULES.cooldownDays);
        if (new Date() < cooldownEnd) {
          throw new BadRequestException(
            `Ban chi co the doi ten nguoi dung sau ${USERNAME_RULES.cooldownDays} ngay`,
          );
        }
      }

      // Check uniqueness
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Ten nguoi dung da duoc su dung');
      }

      updateData.username = dto.username;
      updateData.usernameChangedAt = new Date();
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    // Check reserved list (case-insensitive)
    if ((RESERVED_USERNAMES as readonly string[]).includes(username.toLowerCase())) {
      return false;
    }

    // Check database
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    return !existing;
  }
}
