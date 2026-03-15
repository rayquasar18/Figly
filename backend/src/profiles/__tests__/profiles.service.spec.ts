import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ProfilesService } from '../profiles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../media/storage.service';

describe('ProfilesService', () => {
  let service: ProfilesService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    follow: {
      findUnique: jest.fn(),
    },
  };

  const mockStorageService = {
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);

    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    const mockUser = {
      id: 'user-1',
      username: 'john_doe',
      name: 'John Doe',
      bio: 'Hello world',
      avatarId: null,
      avatar: null,
      _count: {
        followers: 10,
        following: 5,
      },
    };

    it('should return ProfileResponse with correct counts and relationship flags', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      // isFollowing: false, isFollowedBy: false
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      const result = await service.getProfile('john_doe', 'viewer-1');

      expect(result).toEqual({
        id: 'user-1',
        username: 'john_doe',
        displayName: 'John Doe',
        bio: 'Hello world',
        avatarUrl: null,
        postCount: 0,
        followerCount: 10,
        followingCount: 5,
        isOwnProfile: false,
        isFollowing: false,
        isFollowedBy: false,
      });
    });

    it('should return isOwnProfile=true when viewer is the profile owner', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.follow.findUnique.mockResolvedValue(null);

      const result = await service.getProfile('john_doe', 'user-1');

      expect(result.isOwnProfile).toBe(true);
    });

    it('should compute isFollowing=true when viewer follows the user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.follow.findUnique
        .mockResolvedValueOnce({ id: 'follow-1' }) // isFollowing
        .mockResolvedValueOnce(null); // isFollowedBy

      const result = await service.getProfile('john_doe', 'viewer-1');

      expect(result.isFollowing).toBe(true);
      expect(result.isFollowedBy).toBe(false);
    });

    it('should compute isFollowedBy=true when the user follows the viewer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.follow.findUnique
        .mockResolvedValueOnce(null) // isFollowing
        .mockResolvedValueOnce({ id: 'follow-2' }); // isFollowedBy

      const result = await service.getProfile('john_doe', 'viewer-1');

      expect(result.isFollowing).toBe(false);
      expect(result.isFollowedBy).toBe(true);
    });

    it('should throw NotFoundException for non-existent username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('nonexistent', 'viewer-1'))
        .rejects
        .toThrow(NotFoundException);
    });

    it('should resolve avatar presigned URL when avatar exists', async () => {
      const userWithAvatar = {
        ...mockUser,
        avatarId: 'media-1',
        avatar: { thumbnailKey: 'thumb/avatar.jpg', mediumKey: 'medium/avatar.jpg' },
      };
      mockPrisma.user.findUnique.mockResolvedValue(userWithAvatar);
      mockPrisma.follow.findUnique.mockResolvedValue(null);
      mockStorageService.getPresignedUrl.mockResolvedValue('https://minio.local/medium/avatar.jpg?signed=1');

      const result = await service.getProfile('john_doe', 'viewer-1');

      expect(result.avatarUrl).toBe('https://minio.local/medium/avatar.jpg?signed=1');
      expect(mockStorageService.getPresignedUrl).toHaveBeenCalledWith('medium/avatar.jpg');
    });
  });

  describe('updateProfile', () => {
    const existingUser = {
      id: 'user-1',
      username: 'old_name',
      name: 'Old Name',
      bio: null,
      usernameChangedAt: null,
    };

    it('should update display name without affecting username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue({
        ...existingUser,
        name: 'New Name',
      });

      const result = await service.updateProfile('user-1', { displayName: 'New Name' });

      expect(result.name).toBe('New Name');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            name: 'New Name',
          }),
        }),
      );
    });

    it('should update bio', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue({
        ...existingUser,
        bio: 'New bio text',
      });

      const result = await service.updateProfile('user-1', { bio: 'New bio text' });

      expect(result.bio).toBe('New bio text');
    });

    it('should update username and set usernameChangedAt when username changes', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser) // first findUnique for user
        .mockResolvedValueOnce(null); // check username uniqueness
      mockPrisma.user.update.mockResolvedValue({
        ...existingUser,
        username: 'new_name',
        usernameChangedAt: new Date(),
      });

      await service.updateProfile('user-1', { username: 'new_name' });

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            username: 'new_name',
            usernameChangedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should NOT update usernameChangedAt when username does not change', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue({
        ...existingUser,
        name: 'Updated Name',
      });

      await service.updateProfile('user-1', { username: 'old_name', displayName: 'Updated Name' });

      const updateCall = mockPrisma.user.update.mock.calls[0][0];
      expect(updateCall.data.usernameChangedAt).toBeUndefined();
      expect(updateCall.data.username).toBeUndefined();
    });

    it('should enforce 14-day username cooldown', async () => {
      const recentlyChanged = {
        ...existingUser,
        usernameChangedAt: new Date(), // just changed
      };
      mockPrisma.user.findUnique.mockResolvedValue(recentlyChanged);

      await expect(
        service.updateProfile('user-1', { username: 'brand_new_name' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow username change after cooldown expires', async () => {
      const oldChange = new Date();
      oldChange.setDate(oldChange.getDate() - 15); // 15 days ago
      const expiredCooldown = {
        ...existingUser,
        usernameChangedAt: oldChange,
      };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(expiredCooldown)
        .mockResolvedValueOnce(null); // uniqueness check
      mockPrisma.user.update.mockResolvedValue({
        ...expiredCooldown,
        username: 'allowed_name',
        usernameChangedAt: new Date(),
      });

      const result = await service.updateProfile('user-1', { username: 'allowed_name' });

      expect(result.username).toBe('allowed_name');
    });

    it('should reject username that is already taken', async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(existingUser) // current user
        .mockResolvedValueOnce({ id: 'other-user', username: 'taken_name' }); // username taken

      await expect(
        service.updateProfile('user-1', { username: 'taken_name' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject reserved usernames', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        service.updateProfile('user-1', { username: 'admin' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('isUsernameAvailable', () => {
    it('should return true for available username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.isUsernameAvailable('available_name');

      expect(result).toBe(true);
    });

    it('should return false for taken username', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1', username: 'taken_name' });

      const result = await service.isUsernameAvailable('taken_name');

      expect(result).toBe(false);
    });

    it('should return false for reserved username', async () => {
      const result = await service.isUsernameAvailable('admin');

      expect(result).toBe(false);
    });

    it('should return false for reserved username case-insensitive', async () => {
      const result = await service.isUsernameAvailable('Admin');

      expect(result).toBe(false);
    });
  });
});
