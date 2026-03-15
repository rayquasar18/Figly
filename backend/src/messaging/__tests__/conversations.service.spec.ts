import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConversationsService } from '../conversations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ModerationService } from '../../moderation/moderation.service';
import { StorageService } from '../../media/storage.service';

describe('ConversationsService', () => {
  let service: ConversationsService;

  const mockPrisma = {
    conversation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversationParticipant: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    message: {
      count: jest.fn(),
    },
    $transaction: jest.fn(),
    $queryRaw: jest.fn(),
  };

  const mockModeration = {
    isBlocked: jest.fn(),
    getBlockedUserIds: jest.fn(),
  };

  const mockStorage = {
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ModerationService, useValue: mockModeration },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should create 1-on-1 with 2 participants', async () => {
      mockModeration.isBlocked.mockResolvedValue(false);
      // No existing conversation
      mockPrisma.conversation.findFirst.mockResolvedValue(null);

      const created = {
        id: 'conv-1',
        isGroup: false,
        name: null,
        description: null,
        categoryId: null,
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [
          {
            id: 'cp-1',
            userId: 'user-1',
            role: 'member',
            lastReadAt: new Date(),
            user: { id: 'user-1', username: 'alice', name: 'Alice', avatar: null },
          },
          {
            id: 'cp-2',
            userId: 'user-2',
            role: 'member',
            lastReadAt: new Date(),
            user: { id: 'user-2', username: 'bob', name: 'Bob', avatar: null },
          },
        ],
        messages: [],
      };

      mockPrisma.$transaction.mockImplementation(async (cb: any) => {
        return cb(mockPrisma);
      });
      mockPrisma.conversation.create.mockResolvedValue(created);

      const result = await service.createConversation('user-1', {
        participantIds: ['user-2'],
        isGroup: false,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('conv-1');
      expect(mockModeration.isBlocked).toHaveBeenCalledWith('user-1', 'user-2');
    });

    it('should return existing if duplicate 1-on-1', async () => {
      mockModeration.isBlocked.mockResolvedValue(false);

      const existing = {
        id: 'conv-existing',
        isGroup: false,
        name: null,
        description: null,
        categoryId: null,
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [
          {
            id: 'cp-1',
            userId: 'user-1',
            role: 'member',
            lastReadAt: new Date(),
            user: { id: 'user-1', username: 'alice', name: 'Alice', avatar: null },
          },
          {
            id: 'cp-2',
            userId: 'user-2',
            role: 'member',
            lastReadAt: new Date(),
            user: { id: 'user-2', username: 'bob', name: 'Bob', avatar: null },
          },
        ],
        messages: [],
      };

      mockPrisma.conversation.findFirst.mockResolvedValue(existing);

      const result = await service.createConversation('user-1', {
        participantIds: ['user-2'],
        isGroup: false,
      });

      expect(result.id).toBe('conv-existing');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should create group with name and multiple participants', async () => {
      const created = {
        id: 'conv-group',
        isGroup: true,
        name: 'Group Chat',
        description: null,
        categoryId: null,
        createdById: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        participants: [
          {
            id: 'cp-1', userId: 'user-1', role: 'admin', lastReadAt: new Date(),
            user: { id: 'user-1', username: 'alice', name: 'Alice', avatar: null },
          },
          {
            id: 'cp-2', userId: 'user-2', role: 'member', lastReadAt: new Date(),
            user: { id: 'user-2', username: 'bob', name: 'Bob', avatar: null },
          },
          {
            id: 'cp-3', userId: 'user-3', role: 'member', lastReadAt: new Date(),
            user: { id: 'user-3', username: 'charlie', name: 'Charlie', avatar: null },
          },
        ],
        messages: [],
      };

      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.conversation.create.mockResolvedValue(created);

      const result = await service.createConversation('user-1', {
        participantIds: ['user-2', 'user-3'],
        isGroup: true,
        name: 'Group Chat',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('conv-group');
      expect(result.isGroup).toBe(true);
    });

    it('should reject if blocked user in 1-on-1', async () => {
      mockModeration.isBlocked.mockResolvedValue(true);

      await expect(
        service.createConversation('user-1', {
          participantIds: ['user-2'],
          isGroup: false,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getConversations', () => {
    it('should return paginated list with last message and unread count', async () => {
      mockModeration.getBlockedUserIds.mockResolvedValue([]);
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([
        {
          conversationId: 'conv-1',
          lastReadAt: new Date('2026-01-01'),
          conversation: {
            id: 'conv-1',
            isGroup: false,
            name: null,
            description: null,
            categoryId: null,
            updatedAt: new Date(),
            participants: [
              {
                userId: 'user-1',
                role: 'member',
                lastReadAt: new Date(),
                user: { id: 'user-1', username: 'alice', name: 'Alice', avatar: null },
              },
              {
                userId: 'user-2',
                role: 'member',
                lastReadAt: new Date(),
                user: { id: 'user-2', username: 'bob', name: 'Bob', avatar: null },
              },
            ],
            messages: [
              {
                id: 'msg-1',
                conversationId: 'conv-1',
                content: 'Hello',
                createdAt: new Date(),
                sender: { id: 'user-2', username: 'bob', name: 'Bob', avatar: null },
                media: [],
              },
            ],
          },
        },
      ]);
      mockPrisma.message.count.mockResolvedValue(5);

      const result = await service.getConversations('user-1');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].lastMessage).toBeDefined();
      expect(result.items[0].unreadCount).toBe(5);
    });
  });

  describe('getConversation', () => {
    it('should return single conversation with participants', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-1',
      });

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        isGroup: false,
        name: null,
        description: null,
        categoryId: null,
        updatedAt: new Date(),
        participants: [
          {
            userId: 'user-1',
            role: 'member',
            lastReadAt: new Date(),
            user: { id: 'user-1', username: 'alice', name: 'Alice', avatar: null },
          },
        ],
        messages: [],
      });

      const result = await service.getConversation('user-1', 'conv-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('conv-1');
    });

    it('should reject non-member', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        service.getConversation('user-1', 'conv-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('addParticipant', () => {
    it('should add user to group', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-1',
        role: 'admin',
      });

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        isGroup: true,
      });

      mockPrisma.conversationParticipant.create.mockResolvedValue({
        id: 'cp-new',
        conversationId: 'conv-1',
        userId: 'user-3',
        role: 'member',
      });

      const result = await service.addParticipant('user-1', 'conv-1', 'user-3');
      expect(result).toBeDefined();
    });

    it('should reject for 1-on-1', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-1',
      });

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        isGroup: false,
      });

      await expect(
        service.addParticipant('user-1', 'conv-1', 'user-3'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeParticipant', () => {
    it('should remove user from group', async () => {
      mockPrisma.conversationParticipant.findUnique
        .mockResolvedValueOnce({
          conversationId: 'conv-1',
          userId: 'user-1',
          role: 'admin',
        })
        .mockResolvedValueOnce({
          conversationId: 'conv-1',
          userId: 'user-3',
          role: 'member',
        });

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        isGroup: true,
      });

      mockPrisma.conversationParticipant.delete.mockResolvedValue({});

      await service.removeParticipant('user-1', 'conv-1', 'user-3');
      expect(mockPrisma.conversationParticipant.delete).toHaveBeenCalled();
    });

    it('should reject for 1-on-1', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-1',
      });

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        isGroup: false,
      });

      await expect(
        service.removeParticipant('user-1', 'conv-1', 'user-3'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('leaveConversation', () => {
    it('should remove self from conversation', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        id: 'cp-1',
        conversationId: 'conv-1',
        userId: 'user-1',
      });

      mockPrisma.conversationParticipant.delete.mockResolvedValue({});

      await service.leaveConversation('user-1', 'conv-1');
      expect(mockPrisma.conversationParticipant.delete).toHaveBeenCalled();
    });
  });
});
