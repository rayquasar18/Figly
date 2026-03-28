'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import type { MessageResponse, ConversationParticipantResponse } from '@figly/shared';
import { MessageBubble } from './message-bubble';
import { format, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronDown } from 'lucide-react';

interface ChatViewProps {
  messages: MessageResponse[];
  currentUserId: string;
  isGroup: boolean;
  participants: ConversationParticipantResponse[];
  hasMore: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function ChatView({
  messages,
  currentUserId,
  isGroup,
  participants,
  hasMore,
  isFetchingNextPage,
  fetchNextPage,
}: ChatViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAtBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);

  // Check if user is at bottom
  const checkIfAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    const threshold = 100;
    return (
      container.scrollHeight - container.scrollTop - container.clientHeight <
      threshold
    );
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = false) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'instant',
    });
  }, []);

  // Scroll handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const atBottom = checkIfAtBottom();
      isAtBottomRef.current = atBottom;
      setShowScrollButton(!atBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [checkIfAtBottom]);

  // Auto-scroll on new messages (only if at bottom)
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      if (isAtBottomRef.current || messages.length <= 1) {
        scrollToBottom();
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Infinite scroll upward for older messages
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isFetchingNextPage, fetchNextPage]);

  // Messages come in reverse chronological order from API, reverse for display
  const displayMessages = [...messages].reverse();

  // Get other participants' lastReadAt for read receipts
  const otherParticipantsReadAt = participants
    .filter((p) => p.id !== currentUserId)
    .map((p) => new Date(p.lastReadAt));

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col overflow-y-auto px-4 py-2"
    >
      {/* Top sentinel for loading older messages */}
      <div ref={topSentinelRef} className="h-1 shrink-0" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-2">
          <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Messages with date separators */}
      {displayMessages.map((message, index) => {
        const prevMessage = index > 0 ? displayMessages[index - 1] : null;
        const showDateSeparator =
          !prevMessage ||
          !isSameDay(
            new Date(message.createdAt),
            new Date(prevMessage.createdAt),
          );

        const isSent = message.sender.id === currentUserId;
        const isConsecutive =
          prevMessage && prevMessage.sender.id === message.sender.id;

        // Check if this is the last sent message for read receipt display
        const isLastSentMessage =
          isSent &&
          (index === displayMessages.length - 1 ||
            displayMessages
              .slice(index + 1)
              .every((m) => m.sender.id !== currentUserId));

        // Determine if read by checking if any other participant's lastReadAt > message.createdAt
        const isRead =
          isSent &&
          otherParticipantsReadAt.some(
            (readAt) => readAt >= new Date(message.createdAt),
          );

        return (
          <div key={message.id}>
            {showDateSeparator && (
              <div className="my-3 flex items-center justify-center">
                <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                  {format(new Date(message.createdAt), 'dd MMM yyyy', {
                    locale: vi,
                  })}
                </span>
              </div>
            )}
            <MessageBubble
              message={message}
              isSent={isSent}
              isConsecutive={!!isConsecutive}
              isGroup={isGroup}
              showReadReceipt={!!isLastSentMessage}
              isRead={isRead}
            />
          </div>
        );
      })}

      <div ref={bottomRef} className="h-1 shrink-0" />

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          type="button"
          onClick={() => scrollToBottom(true)}
          className="sticky bottom-2 mx-auto flex items-center gap-1 rounded-full bg-background px-3 py-1.5 text-xs font-medium shadow-md border"
        >
          <ChevronDown className="size-3" />
          Tin nhan moi
        </button>
      )}
    </div>
  );
}
