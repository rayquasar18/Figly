'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useNotifications, useMarkAllAsRead } from '@/hooks/queries/notification-queries';
import { useNotificationStore } from '@/stores/notification-store';
import { usePushPermission } from '@/hooks/use-push-permission';
import { NotificationItem } from './notification-item';
import { NotificationEmpty } from './notification-empty';
import { Button } from '@/components/ui/button';

const PUSH_DISMISSED_KEY = 'figly_push_dismissed';

export function NotificationList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const { canPrompt, requestPermission } = usePushPermission();
  const [pushDismissed, setPushDismissed] = useState(true);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // Check push dismissed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPushDismissed(localStorage.getItem(PUSH_DISMISSED_KEY) === 'true');
    }
  }, []);

  // Infinite scroll sentinel
  const handleSentinel = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleSentinel, {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleSentinel]);

  const notifications = data?.notifications ?? [];

  function dismissPush() {
    localStorage.setItem(PUSH_DISMISSED_KEY, 'true');
    setPushDismissed(true);
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-lg font-bold">Thong bao</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markAllAsRead.mutate()}
          disabled={unreadCount === 0 || markAllAsRead.isPending}
          className="text-sm text-primary"
        >
          Doc tat ca
        </Button>
      </div>

      {/* Push permission banner */}
      {canPrompt && !pushDismissed && (
        <div className="flex items-center gap-3 bg-accent/50 px-4 py-3 border-b">
          <p className="flex-1 text-sm">
            Bat thong bao de khong bo lo hoat dong?
          </p>
          <Button size="sm" onClick={requestPermission}>
            Bat
          </Button>
          <Button size="sm" variant="ghost" onClick={dismissPush}>
            De sau
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="size-8 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-2 w-1/2 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && notifications.length === 0 && <NotificationEmpty />}

      {/* Notification items */}
      {notifications.length > 0 && (
        <div className="divide-y">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* Loading more */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
}
