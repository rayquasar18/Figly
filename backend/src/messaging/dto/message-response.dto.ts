import { StorageService } from '../../media/storage.service';
import type { MessageResponse, ConversationResponse, ConversationParticipantResponse } from '@figly/shared';

export class MessageResponseMapper {
  static async mapMessage(message: any, storageService: StorageService): Promise<MessageResponse> {
    const media = [];
    if (message.media?.length) {
      for (const mm of message.media) {
        const m = mm.media;
        const url = m.mediumKey ? await storageService.getPresignedUrl(m.mediumKey) : '';
        const thumbnailUrl = m.thumbnailKey ? await storageService.getPresignedUrl(m.thumbnailKey) : null;
        media.push({
          id: m.id,
          url,
          thumbnailUrl,
          mimeType: m.mimeType,
        });
      }
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      sender: {
        id: message.sender.id,
        username: message.sender.username || '',
        displayName: message.sender.name,
        avatarUrl: message.sender.avatar?.mediumKey
          ? await storageService.getPresignedUrl(message.sender.avatar.mediumKey)
          : null,
      },
      content: message.content,
      media,
      createdAt: message.createdAt instanceof Date
        ? message.createdAt.toISOString()
        : message.createdAt,
    };
  }

  static async mapParticipant(
    participant: any,
    storageService: StorageService,
  ): Promise<ConversationParticipantResponse> {
    const user = participant.user;
    return {
      id: user.id,
      username: user.username || '',
      displayName: user.name,
      avatarUrl: user.avatar?.mediumKey
        ? await storageService.getPresignedUrl(user.avatar.mediumKey)
        : null,
      role: participant.role,
      lastReadAt: participant.lastReadAt instanceof Date
        ? participant.lastReadAt.toISOString()
        : participant.lastReadAt,
    };
  }

  static async mapConversation(
    conversation: any,
    userId: string,
    storageService: StorageService,
    unreadCount: number,
  ): Promise<ConversationResponse> {
    const participants = [];
    for (const p of conversation.participants || []) {
      participants.push(await MessageResponseMapper.mapParticipant(p, storageService));
    }

    let lastMessage: MessageResponse | null = null;
    if (conversation.messages?.length) {
      lastMessage = await MessageResponseMapper.mapMessage(conversation.messages[0], storageService);
    }

    return {
      id: conversation.id,
      isGroup: conversation.isGroup,
      name: conversation.name,
      description: conversation.description,
      categoryId: conversation.categoryId,
      participants,
      lastMessage,
      unreadCount,
      updatedAt: conversation.updatedAt instanceof Date
        ? conversation.updatedAt.toISOString()
        : conversation.updatedAt,
    };
  }
}
