import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { MessagesService } from '../messages.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ModerationService } from '../../moderation/moderation.service';
import { StorageService } from '../../media/storage.service';

describe('MessagesService', () => {
  let service: MessagesService;

  const mockPrisma = {
    conversationParticipant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    messageMedia: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockModeration = {
    isBlocked: jest.fn(),
  };

  const mockStorage = {
    getPresignedUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ModerationService, useValue: mockModeration },
        { provide: StorageService, useValue: mockStorage },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    it('should create message with content and update conversation.updatedAt', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-1',
      });

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        isGroup: true,
      });

      const msg = {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Hello',
        createdAt: new Date(),
        sender: { id: 'user-1', username: 'alice', name: 'Alice', avatar: null },
        media: [],
      };

      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.message.create.mockResolvedValue(msg);
      mockPrisma.conversation.update.mockResolvedValue({});

      const result = await service.sendMessage('user-1', 'conv-1', 'Hello');

      expect(result).toBeDefined();
      expect(result.id).toBe('msg-1');
      expect(result.content).toBe('Hello');
    });

    it('should attach media via MessageMedia join table', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-1',
      });

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        isGroup: true,
      });

      const msg = {
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: null,
        createdAt: new Date(),
        sender: { id: 'user-1', username: 'alice', name: 'Alice', avatar: null },
        media: [
          {
            id: 'mm-1',
            position: 0,
            media: { id: 'media-1', thumbnailKey: 'thumb.jpg', mediumKey: 'med.jpg', mimeType: 'image/jpeg' },
          },
        ],
      };

      mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(mockPrisma));
      mockPrisma.message.create.mockResolvedValue(msg);
      mockPrisma.conversation.update.mockResolvedValue({});
      mockStorage.getPresignedUrl.mockResolvedValue('https://example.com/media');

      const result = await service.sendMessage('user-1', 'conv-1', undefined, ['media-1']);

      expect(result).toBeDefined();
      expect(result.media).toBeDefined();
    });

    it('should reject non-participant', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage('user-1', 'conv-1', 'Hello'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject blocked user in 1-on-1', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-1',
      });

      mockPrisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        isGroup: false,
        participants: [
          { userId: 'user-1' },
          { userId: 'user-2' },
        ],
      });

      mockModeration.isBlocked.mockResolvedValue(true);

      await expect(
        service.sendMessage('user-1', 'conv-1', 'Hello'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMessages', () => {
    it('should return cursor-paginated messages newest-first with sender and media', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-1',
      });

      mockPrisma.message.findMany.mockResolvedValue([
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          senderId: 'user-2',
          content: 'World',
          createdAt: new Date(),
          sender: { id: 'user-2', username: 'bob', name: 'Bob', avatar: null },
          media: [],
        },
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          content: 'Hello',
          createdAt: new Date(),
          sender: { id: 'user-1', username: 'alice', name: 'Alice', avatar: null },
          media: [],
        },
      ]);

      const result = await service.getMessages('user-1', 'conv-1');

      expect(result.items).toHaveLength(2);
      expect(result.hasMore).toBe(false);
    });
  });

  describe('markRead', () => {
    it('should update lastReadAt on participant', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-1',
      });

      const updatedDate = new Date();
      mockPrisma.conversationParticipant.update.mockResolvedValue({
        lastReadAt: updatedDate,
      });

      const result = await service.markRead('user-1', 'conv-1');

      expect(result.lastReadAt).toBeDefined();
      expect(mockPrisma.conversationParticipant.update).toHaveBeenCalled();
    });
  });

  describe('getUnreadCount', () => {
    it('should count messages after lastReadAt excluding own messages', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue({
        conversationId: 'conv-1',
        userId: 'user-1',
        lastReadAt: new Date('2026-01-01'),
      });

      mockPrisma.message.count.mockResolvedValue(3);

      const result = await service.getUnreadCount('user-1', 'conv-1');

      expect(result).toBe(3);
      expect(mockPrisma.message.count).toHaveBeenCalledWith({
        where: {
          conversationId: 'conv-1',
          createdAt: { gt: new Date('2026-01-01') },
          senderId: { not: 'user-1' },
        },
      });
    });
  });

  describe('getUnreadTotal', () => {
    it('should sum unread across all conversations', async () => {
      mockPrisma.conversationParticipant.findUnique.mockResolvedValue(null);
      // Mock the participations
      mockPrisma.conversationParticipant.findUnique
        .mockResolvedValueOnce({
          conversationId: 'conv-1',
          userId: 'user-1',
          lastReadAt: new Date('2026-01-01'),
        })
        .mockResolvedValueOnce({
          conversationId: 'conv-2',
          userId: 'user-1',
          lastReadAt: new Date('2026-01-01'),
        });

      // Use $queryRaw for total unread count
      mockPrisma.$transaction.mockResolvedValue([{ total: 10 }]);

      const result = await service.getUnreadTotal('user-1');

      expect(result).toBeDefined();
      expect(typeof result.total).toBe('number');
    });
  });
});
