import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useMessagingStore } from '@/stores/messaging-store';
import type {
  ConversationListResponse,
  ConversationResponse,
  MessageListResponse,
  UnreadTotalResponse,
} from '@figly/shared';
import { MESSAGING_LIMITS } from '@figly/shared';

/** Fetch paginated conversations with infinite scroll */
export function useConversations() {
  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      params.set('limit', String(MESSAGING_LIMITS.conversationsPageSize));
      const query = params.toString();

      const response = await apiClient.get<ConversationListResponse>(
        `/conversations${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      ...data,
      pages: data.pages,
      conversations: data.pages.flatMap((page) => page.items),
    }),
    staleTime: 30_000,
  });
}

/** Fetch paginated messages for a conversation */
export function useMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      params.set('limit', String(MESSAGING_LIMITS.messagesPageSize));
      const query = params.toString();

      const response = await apiClient.get<MessageListResponse>(
        `/conversations/${conversationId}/messages${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      ...data,
      pages: data.pages,
      messages: data.pages.flatMap((page) => page.items),
    }),
    enabled: !!conversationId,
    staleTime: 30_000,
  });
}

/** Fetch total unread message count across all conversations */
export function useUnreadTotal() {
  return useQuery({
    queryKey: ['unread-total'],
    queryFn: async () => {
      const response = await apiClient.get<UnreadTotalResponse>(
        '/conversations/unread-total',
      );
      useMessagingStore.getState().setTotalUnread(response.data.total);
      return response.data;
    },
    refetchInterval: 30_000, // 30s fallback when WebSocket disconnected
    staleTime: 15_000,
  });
}

/** Fetch conversation detail by ID */
export function useConversationDetail(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const response = await apiClient.get<ConversationResponse>(
        `/conversations/${conversationId}`,
      );
      return response.data;
    },
    enabled: !!conversationId,
    staleTime: 60_000,
  });
}

/** Create a new conversation (1-on-1 or group) */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      participantIds: string[];
      isGroup?: boolean;
      name?: string;
      description?: string;
      categoryId?: string;
    }) => {
      const response = await apiClient.post<ConversationResponse>(
        '/conversations',
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Add a participant to a group conversation */
export function useAddParticipant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      userId,
    }: {
      conversationId: string;
      userId: string;
    }) => {
      const response = await apiClient.post(
        `/conversations/${conversationId}/participants`,
        { userId },
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['conversation', variables.conversationId],
      });
    },
  });
}

/** Leave a conversation */
export function useLeaveConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiClient.delete(
        `/conversations/${conversationId}`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

/** Mark a conversation as read via REST (fallback for when socket not connected) */
export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiClient.patch(
        `/conversations/${conversationId}/read`,
      );
      return response.data;
    },
    onSuccess: (_data, conversationId) => {
      useMessagingStore.getState().clearUnread(conversationId);
      queryClient.invalidateQueries({ queryKey: ['unread-total'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
