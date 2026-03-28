import type { ReportQueueItem, AdminActionResponse } from './moderation.types';

export interface AdminReportQueueResponse {
  items: ReportQueueItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface AdminUserActionResponse extends AdminActionResponse {
  userId: string;
  action: 'warn' | 'ban' | 'dismiss' | 'remove_content';
}
