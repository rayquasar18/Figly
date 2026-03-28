'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useMessagingStore } from '@/stores/messaging-store';
import type {
  MessageResponse,
  ConversationResponse,
  MessageListResponse,
  ConversationListResponse,
} from '@figly/shared';

const WS_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
  'http://localhost:4000';

export function useMessagingSocket(enabled: boolean) {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(`${WS_URL}/messaging`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    // Handle incoming new message
    socket.on(
      'new_message',
      (data: { message: MessageResponse; conversationId: string }) => {
        const { message, conversationId } = data;
        const store = useMessagingStore.getState();

        // Update messages query cache for this conversation
        queryClient.setQueriesData<{
          pages: MessageListResponse[];
          pageParams: (string | undefined)[];
        }>({ queryKey: ['messages', conversationId] }, (old) => {
          if (!old) return old;
          const firstPage = old.pages[0];
          if (!firstPage) return old;
          // Deduplicate: check if message already exists
          const exists = firstPage.items.some((m) => m.id === message.id);
          if (exists) return old;
          return {
            ...old,
            pages: [
              { ...firstPage, items: [message, ...firstPage.items] },
              ...old.pages.slice(1),
            ],
          };
        });

        // Update conversation list: move this conversation to top
        queryClient.setQueriesData<{
          pages: ConversationListResponse[];
          pageParams: (string | undefined)[];
        }>({ queryKey: ['conversations'] }, (old) => {
          if (!old) return old;
          // Find the conversation across all pages
          let found: ConversationResponse | null = null;
          const pagesWithoutConv = old.pages.map((page) => ({
            ...page,
            items: page.items.filter((c) => {
              if (c.id === conversationId) {
                found = c;
                return false;
              }
              return true;
            }),
          }));

          if (found !== null) {
            const foundConv = found as ConversationResponse;
            const updated: ConversationResponse = {
              ...foundConv,
              lastMessage: message,
              updatedAt: message.createdAt,
              unreadCount:
                store.activeConversationId === conversationId
                  ? 0
                  : foundConv.unreadCount + 1,
            };
            pagesWithoutConv[0] = {
              ...pagesWithoutConv[0],
              items: [updated, ...pagesWithoutConv[0].items],
            };
          }

          return { ...old, pages: pagesWithoutConv };
        });

        // Increment unread if not viewing this conversation
        if (store.activeConversationId !== conversationId) {
          store.incrementUnread(conversationId);
        } else {
          // Auto-mark as read if viewing
          socket.emit('mark_read', { conversationId });
        }

        // Invalidate unread total
        queryClient.invalidateQueries({ queryKey: ['unread-total'] });
      },
    );

    // Handle read receipt
    socket.on(
      'message_read',
      (data: { conversationId: string; userId: string; readAt: string }) => {
        // Update conversation participants cache with new lastReadAt
        queryClient.invalidateQueries({
          queryKey: ['conversation', data.conversationId],
        });
        // Invalidate messages to update read indicators
        queryClient.invalidateQueries({
          queryKey: ['messages', data.conversationId],
        });
      },
    );

    // Handle new conversation created
    socket.on('conversation_created', () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    socket.on('disconnect', () => {
      // Socket disconnected
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, queryClient]);

  const sendMessage = useCallback(
    (conversationId: string, content?: string, mediaIds?: string[]) => {
      socketRef.current?.emit('send_message', {
        conversationId,
        content,
        mediaIds,
      });
    },
    [],
  );

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('mark_read', { conversationId });
  }, []);

  return { socket: socketRef, sendMessage, markRead };
}
