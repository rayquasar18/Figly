'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification-store';
import { useUnreadCount } from '@/hooks/queries/notification-queries';

export function NotificationBell() {
  // Keep query syncing to store
  useUnreadCount();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const displayCount = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex items-center justify-center p-1"
      aria-label={`Thong bao${unreadCount > 0 ? ` (${unreadCount} chua doc)` : ''}`}
    >
      <Bell className="size-6" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 h-[18px] text-[10px] font-bold text-destructive-foreground">
          {displayCount}
        </span>
      )}
    </Link>
  );
}
