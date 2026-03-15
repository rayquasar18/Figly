export interface ReportResponse {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'POST' | 'USER';
  reason: string;
  status: 'PENDING' | 'DISMISSED' | 'ACTIONED';
  createdAt: string;
}

export interface BlockedUserResponse {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  blockedAt: string;
}

export interface MutedUserResponse {
  id: string;
  username: string | null;
  displayName: string;
  avatarUrl: string | null;
  mutedAt: string;
}

export interface ReportQueueItem {
  id: string;
  reporterId: string;
  reporterUsername: string | null;
  targetId: string;
  targetType: 'POST' | 'USER';
  reason: string;
  status: 'PENDING' | 'DISMISSED' | 'ACTIONED';
  reportCount: number;
  createdAt: string;
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
}
