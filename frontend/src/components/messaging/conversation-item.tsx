'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ConversationResponse } from '@figly/shared';
import { useMe } from '@/hooks/queries/auth-queries';

interface ConversationItemProps {
  conversation: ConversationResponse;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const { data: currentUser } = useMe();

  // For 1-on-1: show other participant. For group: show group name.
  const otherParticipants = conversation.participants.filter(
    (p) => p.id !== currentUser?.id,
  );

  const displayName = conversation.isGroup
    ? conversation.name || 'Nhom chat'
    : otherParticipants[0]?.displayName || 'Nguoi dung';

  const avatarInitial = displayName.charAt(0).toUpperCase();

  const avatarUrl = !conversation.isGroup
    ? otherParticipants[0]?.avatarUrl
    : null;

  const lastMessage = conversation.lastMessage;
  const lastMessagePreview = lastMessage
    ? lastMessage.media.length > 0 && !lastMessage.content
      ? '[Hinh anh]'
      : lastMessage.content || ''
    : '';

  const senderPrefix =
    lastMessage && lastMessage.sender.id === currentUser?.id
      ? 'Ban: '
      : '';

  const timeAgo = lastMessage
    ? formatDistanceToNow(new Date(lastMessage.createdAt), {
        addSuffix: true,
        locale: vi,
      })
    : '';

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
    >
      {/* Avatar */}
      <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-full object-cover"
          />
        ) : conversation.isGroup ? (
          <div className="flex size-full items-center justify-center bg-primary/10">
            <span className="text-sm font-semibold text-primary">
              {otherParticipants.length + 1}
            </span>
          </div>
        ) : (
          <span className="text-lg font-medium text-muted-foreground">
            {avatarInitial}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span
            className={`truncate text-sm ${
              conversation.unreadCount > 0
                ? 'font-semibold text-foreground'
                : 'font-medium text-foreground'
            }`}
          >
            {displayName}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {timeAgo}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-sm ${
              conversation.unreadCount > 0
                ? 'font-medium text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {senderPrefix}
            {lastMessagePreview}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
