export type NotificationType = 'like' | 'comment' | 'reply' | 'follow' | 'mention';

export interface NotificationActorResponse {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  actors: NotificationActorResponse[];
  actorCount: number;
  targetId: string | null;
  targetType: string | null;
  targetThumbnail: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
