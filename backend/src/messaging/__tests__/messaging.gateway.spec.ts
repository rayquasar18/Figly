import { Test, TestingModule } from '@nestjs/testing';
import { MessagingGateway } from '../messaging.gateway';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages.service';
import { ConversationsService } from '../conversations.service';

describe('MessagingGateway', () => {
  let gateway: MessagingGateway;

  const mockJwtService = {
    verify: jest.fn(),
  };

  const mockPrisma = {
    conversationParticipant: {
      findMany: jest.fn(),
    },
  };

  const mockMessagesService = {
    sendMessage: jest.fn(),
    markRead: jest.fn(),
  };

  const mockConversationsService = {
    getConversation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagingGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: ConversationsService, useValue: mockConversationsService },
      ],
    }).compile();

    gateway = module.get<MessagingGateway>(MessagingGateway);
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should authenticate JWT from cookie and track in userSockets map', async () => {
      const mockSocket = {
        id: 'socket-1',
        handshake: {
          headers: {
            cookie: 'access_token=valid-jwt-token; other=value',
          },
        },
        data: {} as any,
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([
        { conversationId: 'conv-1' },
        { conversationId: 'conv-2' },
      ]);

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.data.userId).toBe('user-1');
      expect(mockSocket.join).toHaveBeenCalledWith('conv:conv-1');
      expect(mockSocket.join).toHaveBeenCalledWith('conv:conv-2');
      expect(gateway.isUserOnline('user-1')).toBe(true);
    });

    it('should disconnect invalid token', async () => {
      const mockSocket = {
        id: 'socket-2',
        handshake: {
          headers: {
            cookie: 'access_token=invalid-token',
          },
        },
        data: {} as any,
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should remove from userSockets map', async () => {
      // First connect
      const mockSocket = {
        id: 'socket-3',
        handshake: {
          headers: {
            cookie: 'access_token=valid-jwt-token',
          },
        },
        data: {} as any,
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockJwtService.verify.mockReturnValue({ sub: 'user-3' });
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);
      expect(gateway.isUserOnline('user-3')).toBe(true);

      // Then disconnect
      gateway.handleDisconnect(mockSocket as any);
      expect(gateway.isUserOnline('user-3')).toBe(false);
    });
  });

  describe('isUserOnline', () => {
    it('should return true for connected users', async () => {
      const mockSocket = {
        id: 'socket-4',
        handshake: {
          headers: {
            cookie: 'access_token=valid-jwt-token',
          },
        },
        data: {} as any,
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockJwtService.verify.mockReturnValue({ sub: 'user-4' });
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);
      expect(gateway.isUserOnline('user-4')).toBe(true);
      expect(gateway.isUserOnline('user-999')).toBe(false);
    });
  });

  describe('emitToUser', () => {
    it('should send to all user socket connections', async () => {
      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      };

      // Set server
      (gateway as any).server = mockServer;

      const mockSocket = {
        id: 'socket-5',
        handshake: {
          headers: {
            cookie: 'access_token=valid-jwt-token',
          },
        },
        data: {} as any,
        join: jest.fn(),
        disconnect: jest.fn(),
      };

      mockJwtService.verify.mockReturnValue({ sub: 'user-5' });
      mockPrisma.conversationParticipant.findMany.mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);

      gateway.emitToUser('user-5', 'test_event', { hello: 'world' });

      // Should have been called for each socket
      expect(mockServer.to).toHaveBeenCalledWith('socket-5');
      expect(mockServer.emit).toHaveBeenCalledWith('test_event', { hello: 'world' });
    });
  });
});
