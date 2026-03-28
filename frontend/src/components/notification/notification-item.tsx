'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { NotificationResponse } from '@figly/shared';
import { useMarkAsRead } from '@/hooks/queries/notification-queries';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: NotificationResponse;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();
  const markAsRead = useMarkAsRead();
  const itemRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Auto-mark as read via IntersectionObserver
  useEffect(() => {
    if (notification.isRead) return;
    if (!itemRef.current) return;

    const el = itemRef.current;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          markAsRead.mutate(notification.id);
          observerRef.current?.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    observerRef.current.observe(el);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [notification.id, notification.isRead]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClick() {
    if (notification.type === 'follow' && notification.actors[0]?.username) {
      router.push(`/${notification.actors[0].username}`);
    } else if (notification.targetId) {
      router.push(`/post/${notification.targetId}`);
    }
  }

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  const displayActors = notification.actors.slice(0, 3);

  return (
    <div
      ref={itemRef}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleClick();
      }}
      className={cn(
        'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50',
        !notification.isRead && 'bg-accent/20',
      )}
    >
      {/* Stacked avatars */}
      <div className="relative flex-shrink-0" style={{ width: `${Math.min(displayActors.length, 3) * 10 + 22}px`, height: 32 }}>
        {displayActors.map((actor, i) => (
          <div
            key={actor.id}
            className="absolute top-0 size-8 overflow-hidden rounded-full border-2 border-background bg-muted"
            style={{ left: `${i * 10}px`, zIndex: 3 - i }}
          >
            {actor.avatarUrl ? (
              <img
                src={actor.avatarUrl}
                alt={actor.displayName}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xs font-medium text-muted-foreground">
                {actor.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            !notification.isRead ? 'font-semibold' : 'font-normal',
          )}
        >
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
      </div>

      {/* Post thumbnail */}
      {notification.targetThumbnail && (
        <div className="flex-shrink-0 size-11 overflow-hidden rounded-md bg-muted">
          <img
            src={notification.targetThumbnail}
            alt=""
            className="size-full object-cover"
          />
        </div>
      )}

      {/* Unread dot */}
      {!notification.isRead && (
        <div className="flex-shrink-0 size-2 rounded-full bg-primary" />
      )}
    </div>
  );
}
