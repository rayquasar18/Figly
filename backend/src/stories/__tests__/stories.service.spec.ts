import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { StoriesService } from '../stories.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';
import { ModerationService } from '../../moderation/moderation.service';

describe('StoriesService', () => {
  let service: StoriesService;

  const mockPrisma = {
    media: {
      findFirst: jest.fn(),
    },
    story: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    storyView: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockStorageService = {
    getPresignedUrl: jest.fn().mockResolvedValue('https://minio.local/signed-url'),
  };

  const mockModerationService = {
    getBlockedUserIds: jest.fn().mockResolvedValue([]),
    getMutedUserIds: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoriesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
        { provide: ModerationService, useValue: mockModerationService },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);

    jest.clearAllMocks();
    mockModerationService.getBlockedUserIds.mockResolvedValue([]);
    mockModerationService.getMutedUserIds.mockResolvedValue([]);
    mockStorageService.getPresignedUrl.mockResolvedValue('https://minio.local/signed-url');
  });

  describe('createStory', () => {
    it('should create a story with valid media and set expiresAt 24h ahead', async () => {
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);

      mockPrisma.media.findFirst.mockResolvedValue({
        id: 'media-1',
        userId: 'user-1',
        status: 'COMPLETED',
        mimeType: 'image/jpeg',
      });

      const createdStory = {
        id: 'story-1',
        userId: 'user-1',
        expiresAt: new Date(now + 24 * 60 * 60 * 1000),
        createdAt: new Date(now),
      };
      mockPrisma.story.create.mockResolvedValue(createdStory);

      const result = await service.createStory('user-1', { mediaId: 'media-1' });

      expect(result).toBeDefined();
      expect(result.id).toBe('story-1');
      expect(mockPrisma.media.findFirst).toHaveBeenCalledWith({
        where: { id: 'media-1', userId: 'user-1', status: 'COMPLETED' },
      });
      expect(mockPrisma.story.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          expiresAt: new Date(now + 24 * 60 * 60 * 1000),
          media: {
            create: { mediaId: 'media-1', position: 0 },
          },
        },
      });

      jest.spyOn(Date, 'now').mockRestore();
    });

    it('should throw BadRequestException for non-existent or invalid media', async () => {
      mockPrisma.media.findFirst.mockResolvedValue(null);

      await expect(
        service.createStory('user-1', { mediaId: 'invalid-media' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for media not owned by user', async () => {
      mockPrisma.media.findFirst.mockResolvedValue(null); // findFirst with userId filter returns null

      await expect(
        service.createStory('user-1', { mediaId: 'media-other-user' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteStory', () => {
    it('should delete own story successfully', async () => {
      mockPrisma.story.findFirst.mockResolvedValue({
        id: 'story-1',
        userId: 'user-1',
      });
      mockPrisma.story.delete.mockResolvedValue({ id: 'story-1' });

      const result = await service.deleteStory('story-1', 'user-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.story.delete).toHaveBeenCalledWith({
        where: { id: 'story-1' },
      });
    });

    it('should throw NotFoundException for non-owned story', async () => {
      mockPrisma.story.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteStory('story-1', 'user-2'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStoryFeed', () => {
    const mockStories = [
      {
        id: 'story-1',
        userId: 'user-2',
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        createdAt: new Date('2026-03-20T08:00:00Z'),
        user: {
          id: 'user-2',
          username: 'followeduser',
          name: 'Followed User',
          avatar: { mediumKey: 'avatars/medium/user2.jpg' },
        },
        media: [
          {
            media: {
              id: 'media-1',
              originalKey: 'originals/user-2/photo.jpg',
              largeKey: 'large/user-2/photo.jpg',
              mediumKey: 'medium/user-2/photo.jpg',
              thumbnailKey: 'thumb/user-2/photo.jpg',
              mimeType: 'image/jpeg',
            },
          },
        ],
        views: [],
      },
      {
        id: 'story-me',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        createdAt: new Date('2026-03-20T09:00:00Z'),
        user: {
          id: 'user-1',
          username: 'myuser',
          name: 'My User',
          avatar: null,
        },
        media: [
          {
            media: {
              id: 'media-2',
              originalKey: 'originals/user-1/photo.jpg',
              largeKey: 'large/user-1/photo.jpg',
              mediumKey: null,
              thumbnailKey: null,
              mimeType: 'image/png',
            },
          },
        ],
        views: [],
      },
    ];

    it('should return stories grouped by user with myStories and followedStories', async () => {
      mockPrisma.story.findMany.mockResolvedValue(mockStories);

      const result = await service.getStoryFeed('user-1');

      expect(result.myStories).not.toBeNull();
      expect(result.myStories!.user.id).toBe('user-1');
      expect(result.myStories!.stories).toHaveLength(1);
      expect(result.followedStories).toHaveLength(1);
      expect(result.followedStories[0].user.id).toBe('user-2');
      expect(result.followedStories[0].stories).toHaveLength(1);
    });

    it('should exclude blocked/muted users from feed', async () => {
      mockModerationService.getBlockedUserIds.mockResolvedValue(['blocked-user']);
      mockModerationService.getMutedUserIds.mockResolvedValue(['muted-user']);
      mockPrisma.story.findMany.mockResolvedValue([]);

      await service.getStoryFeed('user-1');

      const findManyCall = mockPrisma.story.findMany.mock.calls[0][0];
      expect(findManyCall.where.userId).toEqual({
        notIn: expect.arrayContaining(['blocked-user', 'muted-user']),
      });
    });

    it('should exclude expired stories via where clause', async () => {
      mockPrisma.story.findMany.mockResolvedValue([]);

      await service.getStoryFeed('user-1');

      const findManyCall = mockPrisma.story.findMany.mock.calls[0][0];
      expect(findManyCall.where.expiresAt).toEqual({ gt: expect.any(Date) });
    });
  });

  describe('markViewed', () => {
    it('should create StoryView record for valid story', async () => {
      mockPrisma.story.findFirst.mockResolvedValue({
        id: 'story-1',
        userId: 'story-owner',
        expiresAt: new Date(Date.now() + 1000),
      });
      mockPrisma.storyView.create.mockResolvedValue({
        id: 'view-1',
        storyId: 'story-1',
        viewerId: 'viewer-1',
      });

      const result = await service.markViewed('story-1', 'viewer-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.storyView.create).toHaveBeenCalledWith({
        data: { storyId: 'story-1', viewerId: 'viewer-1' },
      });
    });

    it('should handle P2002 idempotent on duplicate view', async () => {
      mockPrisma.story.findFirst.mockResolvedValue({
        id: 'story-1',
        userId: 'story-owner',
        expiresAt: new Date(Date.now() + 1000),
      });
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      mockPrisma.storyView.create.mockRejectedValue(prismaError);

      const result = await service.markViewed('story-1', 'viewer-1');

      expect(result).toEqual({ success: true });
    });

    it('should not track self-views', async () => {
      mockPrisma.story.findFirst.mockResolvedValue({
        id: 'story-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 1000),
      });

      const result = await service.markViewed('story-1', 'user-1');

      expect(result).toEqual({ success: true });
      expect(mockPrisma.storyView.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for expired or non-existent story', async () => {
      mockPrisma.story.findFirst.mockResolvedValue(null);

      await expect(
        service.markViewed('nonexistent', 'viewer-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStoryViewers', () => {
    it('should return viewers for owned story', async () => {
      mockPrisma.story.findFirst.mockResolvedValue({
        id: 'story-1',
        userId: 'user-1',
      });
      mockPrisma.storyView.findMany.mockResolvedValue([
        {
          viewer: {
            id: 'viewer-1',
            username: 'viewer',
            name: 'Viewer One',
            avatar: null,
          },
          viewedAt: new Date('2026-03-20T10:00:00Z'),
        },
      ]);

      const result = await service.getStoryViewers('story-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(expect.objectContaining({
        id: 'viewer-1',
        username: 'viewer',
        displayName: 'Viewer One',
      }));
    });

    it('should throw NotFoundException for non-owned story', async () => {
      mockPrisma.story.findFirst.mockResolvedValue(null);

      await expect(
        service.getStoryViewers('story-1', 'not-owner'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
