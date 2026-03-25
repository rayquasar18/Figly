export interface ConversationResponse {
    id: string;
    isGroup: boolean;
    name: string | null;
    description: string | null;
    categoryId: string | null;
    participants: ConversationParticipantResponse[];
    lastMessage: MessageResponse | null;
    unreadCount: number;
    updatedAt: string;
}
export interface ConversationParticipantResponse {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    lastReadAt: string;
}
export interface MessageResponse {
    id: string;
    conversationId: string;
    sender: MessageSender;
    content: string | null;
    media: MessageMediaItem[];
    createdAt: string;
}
export interface MessageSender {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
}
export interface MessageMediaItem {
    id: string;
    url: string;
    thumbnailUrl: string | null;
    mimeType: string;
}
export interface ConversationListResponse {
    items: ConversationResponse[];
    nextCursor: string | null;
    hasMore: boolean;
}
export interface MessageListResponse {
    items: MessageResponse[];
    nextCursor: string | null;
    hasMore: boolean;
}
export interface UnreadTotalResponse {
    total: number;
}
