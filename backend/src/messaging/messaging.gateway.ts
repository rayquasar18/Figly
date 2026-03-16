import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';
import { ConversationsService } from './conversations.service';

@Injectable()
@WebSocketGateway({
  namespace: '/messaging',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(MessagingGateway.name);
  private readonly userSockets = new Map<string, Set<string>>();

  @WebSocketServer()
  server!: Server;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private messagesService: MessagesService,
    private conversationsService: ConversationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract JWT from cookie
      const cookies = client.handshake.headers.cookie || '';
      const tokenMatch = cookies.match(/access_token=([^;]+)/);
      if (!tokenMatch) {
        client.disconnect();
        return;
      }

      const token = tokenMatch[1];
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      client.data.userId = userId;

      // Track socket connection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // Join all conversation rooms
      const participations = await this.prisma.conversationParticipant.findMany({
        where: { userId },
        select: { conversationId: true },
      });

      for (const p of participations) {
        client.join(`conv:${p.conversationId}`);
      }

      this.logger.log(`User ${userId} connected (socket: ${client.id})`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content?: string; mediaIds?: string[] },
  ) {
    const userId = client.data?.userId;
    if (!userId) return;

    try {
      const message = await this.messagesService.sendMessage(
        userId,
        data.conversationId,
        data.content,
        data.mediaIds,
      );

      // Broadcast to conversation room
      this.server.to(`conv:${data.conversationId}`).emit('new_message', { message, conversationId: data.conversationId });

      return message;
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data?.userId;
    if (!userId) return;

    try {
      const result = await this.messagesService.markRead(userId, data.conversationId);

      // Broadcast read receipt to conversation room
      this.server.to(`conv:${data.conversationId}`).emit('message_read', {
        conversationId: data.conversationId,
        userId,
        readAt: result.lastReadAt,
      });

      return result;
    } catch (error: any) {
      client.emit('error', { message: error.message });
    }
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  emitToUser(userId: string, event: string, data: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets) {
      for (const socketId of sockets) {
        this.server.to(socketId).emit(event, data);
      }
    }
  }

  joinConversationRoom(userId: string, conversationId: string) {
    const sockets = this.userSockets.get(userId);
    if (sockets && this.server) {
      for (const socketId of sockets) {
        const socket = this.server.sockets?.sockets?.get(socketId);
        if (socket) {
          socket.join(`conv:${conversationId}`);
        }
      }
    }
  }
}
