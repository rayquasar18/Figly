'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { useMessages, useConversationDetail } from '@/hooks/queries/messaging-queries';
import { useMessagingSocket } from '@/hooks/use-messaging-socket';
import { useMessagingStore } from '@/stores/messaging-store';
import { useMe } from '@/hooks/queries/auth-queries';
import { ChatView } from '@/components/messaging/chat-view';
import { MessageInput } from '@/components/messaging/message-input';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;

  const { data: currentUser } = useMe();
  const { data: conversation } = useConversationDetail(conversationId);
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useMessages(conversationId);
  const { sendMessage, markRead } = useMessagingSocket(!!currentUser);
  const setActiveConversation = useMessagingStore((s) => s.setActiveConversation);
  const clearUnread = useMessagingStore((s) => s.clearUnread);

  const messages = data?.messages ?? [];

  // Set active conversation on mount, clear on unmount
  useEffect(() => {
    setActiveConversation(conversationId);
    clearUnread(conversationId);
    markRead(conversationId);

    return () => {
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation, clearUnread, markRead]);

  // Determine display name and participants
  const otherParticipants = conversation?.participants.filter(
    (p) => p.id !== currentUser?.id,
  );

  const displayName = conversation?.isGroup
    ? conversation.name || 'Nhom chat'
    : otherParticipants?.[0]?.displayName || 'Tin nhan';

  const participantCount = conversation?.participants.length ?? 0;

  const handleSend = (content?: string, mediaIds?: string[]) => {
    sendMessage(conversationId, content, mediaIds);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-3rem-3.5rem)] max-w-lg flex-col md:h-[calc(100dvh-3rem)]">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Link
          href="/messages"
          className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Quay lai"
        >
          <ArrowLeft className="size-5" />
        </Link>

        {/* Avatar */}
        <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-muted">
          {!conversation?.isGroup && otherParticipants?.[0]?.avatarUrl ? (
            <img
              src={otherParticipants[0].avatarUrl}
              alt={displayName}
              className="size-full object-cover"
            />
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold">{displayName}</h1>
          {conversation?.isGroup && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="size-3" />
              <span>{participantCount} thanh vien</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages area */}
      {currentUser && conversation ? (
        <ChatView
          messages={messages}
          currentUserId={currentUser.id}
          isGroup={conversation.isGroup}
          participants={conversation.participants}
          hasMore={!!hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {/* Message input */}
      <MessageInput conversationId={conversationId} onSend={handleSend} />
    </div>
  );
}
