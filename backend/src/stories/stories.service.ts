import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../media/storage.service';
import { ModerationService } from '../moderation/moderation.service';
import { STORY_LIMITS } from '@figly/shared';
import type { StoryFeedResponse, StoryGroupResponse, StoryResponse, StoryMediaItem } from '@figly/shared';

@Injectable()
export class StoriesService {
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private moderationService: ModerationService,
  ) {}

  async createStory(userId: string, dto: { mediaId: string }) {
    // Validate media exists, belongs to user, and is COMPLETED
    const media = await this.prisma.media.findFirst({
      where: { id: dto.mediaId, userId, status: 'COMPLETED' },
    });

    if (!media) {
      throw new BadRequestException('Media khong hop le');
    }

    const expiresAt = new Date(Date.now() + STORY_LIMITS.expiryHours * 60 * 60 * 1000);

    const story = await this.prisma.story.create({
      data: {
        userId,
        expiresAt,
        media: {
          create: { mediaId: dto.mediaId, position: 0 },
        },
      },
    });

    return story;
  }

  async deleteStory(storyId: string, userId: string) {
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, userId },
    });

    if (!story) {
      throw new NotFoundException('Story khong ton tai');
    }

    await this.prisma.story.delete({
      where: { id: storyId },
    });

    return { success: true };
  }

  async getStoryFeed(userId: string): Promise<StoryFeedResponse> {
    const now = new Date();

    // Get blocked + muted IDs
    const [blockedIds, mutedIds] = await Promise.all([
      this.moderationService.getBlockedUserIds(userId),
      this.moderationService.getMutedUserIds(userId),
    ]);
    const excludeIds = [...new Set([...blockedIds, ...mutedIds])];

    // Fetch all active (non-expired) stories from followed users + own
    const stories = await this.prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        user: {
          isBanned: false,
          OR: [
            { id: userId },
            { followers: { some: { followerId: userId } } },
          ],
        },
        ...(excludeIds.length > 0 ? { userId: { notIn: excludeIds } } : {}),
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
            media: {
              select: {
                id: true,
                originalKey: true,
                largeKey: true,
                mediumKey: true,
                thumbnailKey: true,
                mimeType: true,
              },
            },
          },
          orderBy: { position: 'asc' as const },
        },
        views: {
          where: { viewerId: userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'asc' as const },
    });

    // Group stories by user
    const groupMap = new Map<string, typeof stories>();
    for (const story of stories) {
      const uid = story.user.id;
      if (!groupMap.has(uid)) {
        groupMap.set(uid, []);
      }
      groupMap.get(uid)!.push(story);
    }

    // Collect all storage keys for batch URL resolution
    const storageKeys: string[] = [];
    for (const story of stories) {
      if (story.user.avatar?.mediumKey) {
        storageKeys.push(story.user.avatar.mediumKey);
      }
      for (const sm of story.media) {
        const isVideo = sm.media.mimeType.startsWith('video/');
        if (isVideo && sm.media.originalKey) {
          storageKeys.push(sm.media.originalKey);
        } else if (sm.media.largeKey) {
          storageKeys.push(sm.media.largeKey);
        }
        if (sm.media.thumbnailKey) {
          storageKeys.push(sm.media.thumbnailKey);
        }
      }
    }

    // Batch resolve presigned URLs with 24h expiry
    const uniqueKeys = [...new Set(storageKeys)];
    const urlMap = new Map<string, string>();
    if (uniqueKeys.length > 0) {
      const urls = await Promise.all(
        uniqueKeys.map((key) => this.storageService.getPresignedUrl(key, 86400)),
      );
      uniqueKeys.forEach((key, i) => urlMap.set(key, urls[i]));
    }

    // Build story groups
    let myStories: StoryGroupResponse | null = null;
    const followedStories: StoryGroupResponse[] = [];

    for (const [uid, userStories] of groupMap) {
      const firstStory = userStories[0];
      const user = firstStory.user;

      const storyResponses: StoryResponse[] = userStories.map((s) => ({
        id: s.id,
        media: s.media.map((sm): StoryMediaItem => {
          const isVideo = sm.media.mimeType.startsWith('video/');
          const mediaKey = isVideo && sm.media.originalKey
            ? sm.media.originalKey
            : sm.media.largeKey;
          return {
            id: sm.media.id,
            url: mediaKey ? urlMap.get(mediaKey) || '' : '',
            type: isVideo ? 'video' : 'image',
            thumbnailUrl: sm.media.thumbnailKey
              ? urlMap.get(sm.media.thumbnailKey)
              : undefined,
          };
        }),
        isViewed: s.views.length > 0,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      }));

      const hasUnviewed = storyResponses.some((s) => !s.isViewed);
      const latestAt = userStories[userStories.length - 1].createdAt.toISOString();

      const group: StoryGroupResponse = {
        user: {
          id: user.id,
          username: user.username || '',
          displayName: user.name,
          avatarUrl: user.avatar?.mediumKey
            ? urlMap.get(user.avatar.mediumKey) || null
            : null,
        },
        stories: storyResponses,
        hasUnviewed,
        latestAt,
      };

      if (uid === userId) {
        myStories = group;
      } else {
        followedStories.push(group);
      }
    }

    // Sort followed stories: unviewed first, then by latestAt desc
    followedStories.sort((a, b) => {
      if (a.hasUnviewed !== b.hasUnviewed) {
        return a.hasUnviewed ? -1 : 1;
      }
      return new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime();
    });

    return { myStories, followedStories };
  }

  async markViewed(storyId: string, viewerId: string) {
    // Check story exists and not expired
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, expiresAt: { gt: new Date() } },
    });

    if (!story) {
      throw new NotFoundException('Story khong ton tai hoac da het han');
    }

    // Don't track self-views
    if (story.userId === viewerId) {
      return { success: true };
    }

    // Create view with P2002 idempotency
    try {
      await this.prisma.storyView.create({
        data: { storyId, viewerId },
      });
    } catch (error: any) {
      if (error.code === 'P2002') return { success: true };
      throw error;
    }

    return { success: true };
  }

  async getStoryViewers(storyId: string, userId: string) {
    // Verify story belongs to user
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, userId },
    });

    if (!story) {
      throw new NotFoundException('Story khong ton tai');
    }

    const views = await this.prisma.storyView.findMany({
      where: { storyId },
      include: {
        viewer: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: { select: { mediumKey: true } },
          },
        },
      },
      orderBy: { viewedAt: 'desc' as const },
    });

    // Resolve avatar URLs
    const avatarKeys = views
      .filter((v: any) => v.viewer.avatar?.mediumKey)
      .map((v: any) => v.viewer.avatar.mediumKey);
    const uniqueKeys = [...new Set(avatarKeys)];
    const urlMap = new Map<string, string>();
    if (uniqueKeys.length > 0) {
      const urls = await Promise.all(
        uniqueKeys.map((key) => this.storageService.getPresignedUrl(key)),
      );
      uniqueKeys.forEach((key, i) => urlMap.set(key, urls[i]));
    }

    return views.map((v: any) => ({
      id: v.viewer.id,
      username: v.viewer.username,
      displayName: v.viewer.name,
      avatarUrl: v.viewer.avatar?.mediumKey
        ? urlMap.get(v.viewer.avatar.mediumKey) || null
        : null,
      viewedAt: v.viewedAt.toISOString(),
    }));
  }
}
