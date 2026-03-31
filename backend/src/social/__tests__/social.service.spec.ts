import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SocialService } from '../social.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SocialService', () => {
  let service: SocialService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    follow: {
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SocialService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<SocialService>(SocialService);

    jest.clearAllMocks();
  });

  describe('follow', () => {
    it('should create a follow record', async () => {
      mockPrisma.follow.create.mockResolvedValue({
        id: 'follow-1',
        followerId: 'user-1',
        followingId: 'user-2',
        createdAt: new Date(),
      });

      const result = await service.follow('user-1', 'user-2');

      expect(result).toBeDefined();
      expect(mockPrisma.follow.create).toHaveBeenCalledWith({
        data: {
          followerId: 'user-1',
          followingId: 'user-2',
        },
      });
    });

    it('should prevent self-follow', async () => {
      await expect(service.follow('user-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should handle duplicate follow gracefully (idempotent)', async () => {
      const prismaError = new Error('Unique constraint failed');
      (prismaError as any).code = 'P2002';
      mockPrisma.follow.create.mockRejectedValue(prismaError);

      // Should not throw -- returns success
      const result = await service.follow('user-1', 'user-2');

      expect(result).toEqual({ success: true });
    });
  });

  describe('unfollow', () => {
    it('should delete a follow record', async () => {
      mockPrisma.follow.delete.mockResolvedValue({
        id: 'follow-1',
        followerId: 'user-1',
        followingId: 'user-2',
      });

      const result = await service.unfollow('user-1', 'user-2');

      expect(result).toBeDefined();
      expect(mockPrisma.follow.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 'user-1',
            followingId: 'user-2',
          },
        },
      });
    });

    it('should handle non-existent follow gracefully (idempotent)', async () => {
      const prismaError = new Error('Record to delete does not exist');
      (prismaError as any).code = 'P2025';
      mockPrisma.follow.delete.mockRejectedValue(prismaError);

      // Should not throw -- returns success
      const result = await service.unfollow('user-1', 'user-2');

      expect(result).toEqual({ success: true });
    });
  });

  describe('getFollowers', () => {
    const mockUser = { id: 'user-1', username: 'john_doe' };

    it('should return paginated followers list', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.follow.findMany.mockResolvedValueOnce([
        {
          id: 'follow-1',
          follower: {
            id: 'follower-1',
            username: 'alice',
            name: 'Alice',
            avatarId: null,
            avatar: null,
          },
          createdAt: new Date(),
        },
      ]);
      // Batch follow status check
      mockPrisma.follow.findMany.mockResolvedValueOnce([]);

      const result = await service.getFollowers('john_doe', 'viewer-1', {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          id: 'follower-1',
          username: 'alice',
          displayName: 'Alice',
          isFollowing: false,
        }),
      );
      expect(result.hasMore).toBe(false);
      expect(result.nextCursor).toBeNull();
    });

    it('should return hasMore=true when more results exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      // Return take+1 items to indicate more results
      const follows = Array.from({ length: 21 }, (_, i) => ({
        id: `follow-${i}`,
        follower: {
          id: `follower-${i}`,
          username: `user_${i}`,
          name: `User ${i}`,
          avatarId: null,
          avatar: null,
        },
        createdAt: new Date(),
      }));
      mockPrisma.follow.findMany.mockResolvedValueOnce(follows).mockResolvedValueOnce([]);

      const result = await service.getFollowers('john_doe', 'viewer-1', {});

      expect(result.items).toHaveLength(20);
      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('follow-19');
    });

    it('should apply search filter on follower name/username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.follow.findMany
        .mockResolvedValueOnce([
          {
            id: 'follow-1',
            follower: {
              id: 'follower-1',
              username: 'alice_wonder',
              name: 'Alice',
              avatarId: null,
              avatar: null,
            },
            createdAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([]);

      await service.getFollowers('john_doe', 'viewer-1', { search: 'alice' });

      const findManyCall = mockPrisma.follow.findMany.mock.calls[0][0];
      expect(findManyCall.where.follower).toEqual({
        OR: [
          { username: { contains: 'alice', mode: 'insensitive' } },
          { name: { contains: 'alice', mode: 'insensitive' } },
        ],
      });
    });

    it('should batch check viewer follow status for each follower', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.follow.findMany
        .mockResolvedValueOnce([
          {
            id: 'follow-1',
            follower: {
              id: 'follower-1',
              username: 'alice',
              name: 'Alice',
              avatarId: null,
              avatar: null,
            },
            createdAt: new Date(),
          },
          {
            id: 'follow-2',
            follower: {
              id: 'follower-2',
              username: 'bob',
              name: 'Bob',
              avatarId: null,
              avatar: null,
            },
            createdAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([{ followingId: 'follower-1' }]); // viewer follows alice

      const result = await service.getFollowers('john_doe', 'viewer-1', {});

      expect(result.items[0].isFollowing).toBe(true); // alice
      expect(result.items[1].isFollowing).toBe(false); // bob
    });

    it('should throw NotFoundException for non-existent username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getFollowers('nonexistent', 'viewer-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getFollowing', () => {
    const mockUser = { id: 'user-1', username: 'john_doe' };

    it('should return paginated following list', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.follow.findMany
        .mockResolvedValueOnce([
          {
            id: 'follow-1',
            following: {
              id: 'following-1',
              username: 'bob',
              name: 'Bob',
              avatarId: null,
              avatar: null,
            },
            createdAt: new Date(),
          },
        ])
        .mockResolvedValueOnce([{ followingId: 'following-1' }]); // viewer follows bob

      const result = await service.getFollowing('john_doe', 'viewer-1', {});

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(
        expect.objectContaining({
          id: 'following-1',
          username: 'bob',
          displayName: 'Bob',
          isFollowing: true,
        }),
      );
    });

    it('should throw NotFoundException for non-existent username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getFollowing('nonexistent', 'viewer-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeFollower', () => {
    it('should delete the follow relationship where followerUserId follows ownerId', async () => {
      mockPrisma.follow.delete.mockResolvedValue({
        id: 'follow-1',
        followerId: 'follower-1',
        followingId: 'owner-1',
      });

      const result = await service.removeFollower('owner-1', 'follower-1');

      expect(result).toBeDefined();
      expect(mockPrisma.follow.delete).toHaveBeenCalledWith({
        where: {
          followerId_followingId: {
            followerId: 'follower-1',
            followingId: 'owner-1',
          },
        },
      });
    });

    it('should handle non-existent follow gracefully', async () => {
      const prismaError = new Error('Record to delete does not exist');
      (prismaError as any).code = 'P2025';
      mockPrisma.follow.delete.mockRejectedValue(prismaError);

      const result = await service.removeFollower('owner-1', 'follower-1');

      expect(result).toEqual({ success: true });
    });
  });
});
