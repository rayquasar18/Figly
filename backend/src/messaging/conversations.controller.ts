import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ConversationsService } from './conversations.service';
import { MessagesService } from './messages.service';
import { MessagingGateway } from './messaging.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private conversationsService: ConversationsService,
    private messagesService: MessagesService,
    private messagingGateway: MessagingGateway,
  ) {}

  @Get()
  async getConversations(
    @Req() req: any,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.conversationsService.getConversations(req.user.id, cursor, limit);
  }

  @Post()
  async createConversation(
    @Req() req: any,
    @Body() dto: CreateConversationDto,
  ) {
    const conversation = await this.conversationsService.createConversation(req.user.id, dto);

    // Join all online participants to conversation room
    for (const p of conversation.participants) {
      this.messagingGateway.joinConversationRoom(p.id, conversation.id);
    }

    // Emit conversation created event to all participants
    for (const p of conversation.participants) {
      if (p.id !== req.user.id) {
        this.messagingGateway.emitToUser(p.id, 'conversation_created', conversation);
      }
    }

    return conversation;
  }

  @Get('unread-total')
  async getUnreadTotal(@Req() req: any) {
    return this.conversationsService.getUnreadTotal(req.user.id);
  }

  @Get(':id')
  async getConversation(@Req() req: any, @Param('id') id: string) {
    return this.conversationsService.getConversation(req.user.id, id);
  }

  @Get(':id/messages')
  async getMessages(
    @Req() req: any,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(30), ParseIntPipe) limit?: number,
  ) {
    return this.messagesService.getMessages(req.user.id, id, cursor, limit);
  }

  @Post(':id/messages')
  async sendMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.messagesService.sendMessage(
      req.user.id,
      id,
      dto.content,
      dto.mediaIds,
    );

    // Broadcast via WebSocket
    if (this.messagingGateway.server) {
      this.messagingGateway.server.to(`conv:${id}`).emit('new_message', { message, conversationId: id });
    }

    return message;
  }

  @Patch(':id/read')
  async markRead(@Req() req: any, @Param('id') id: string) {
    return this.messagesService.markRead(req.user.id, id);
  }

  @Post(':id/participants')
  async addParticipant(
    @Req() req: any,
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    const result = await this.conversationsService.addParticipant(req.user.id, id, userId);

    // Join new participant to conversation room
    this.messagingGateway.joinConversationRoom(userId, id);

    return result;
  }

  @Delete(':id/participants/:userId')
  async removeParticipant(
    @Req() req: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.conversationsService.removeParticipant(req.user.id, id, userId);
  }

  @Delete(':id')
  async leaveConversation(@Req() req: any, @Param('id') id: string) {
    return this.conversationsService.leaveConversation(req.user.id, id);
  }
}
