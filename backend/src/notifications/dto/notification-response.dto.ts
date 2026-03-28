export interface NotificationJobData {
  type: 'like' | 'comment' | 'reply' | 'follow' | 'mention';
  actorId: string;
  recipientId: string;
  targetId?: string;
  targetType?: string;
}
