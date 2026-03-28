import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useNotificationStore } from '@/stores/notification-store';
import type {
  NotificationResponse,
  UnreadCountResponse,
} from '@figly/shared';

interface PaginatedNotifications {
  data: NotificationResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Fetch paginated notifications with infinite scroll */
export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      params.set('limit', '20');
      const query = params.toString();

      const response = await apiClient.get<PaginatedNotifications>(
        `/notifications${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      ...data,
      pages: data.pages,
      notifications: data.pages.flatMap((page) => page.data),
    }),
    staleTime: 60 * 1000,
  });
}

/** Fetch unread notification count and sync to store */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response =
        await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
      useNotificationStore.getState().setUnreadCount(response.data.count);
      return response.data;
    },
    refetchInterval: 60_000, // 1 min background poll safety net
    staleTime: 30_000,
  });
}

/** Mark a single notification as read */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.patch(
        `/notifications/${notificationId}/read`,
      );
      return response.data;
    },
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previous = queryClient.getQueryData(['notifications']);

      // Optimistic update: set isRead=true in cache
      queryClient.setQueriesData<{
        pages: PaginatedNotifications[];
        pageParams: (string | undefined)[];
      }>({ queryKey: ['notifications'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n,
            ),
          })),
        };
      });

      useNotificationStore.getState().decrementUnread();
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      });
    },
  });
}

/** Mark all notifications as read */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch('/notifications/read-all');
      return response.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previous = queryClient.getQueryData(['notifications']);

      // Optimistic: set all isRead=true
      queryClient.setQueriesData<{
        pages: PaginatedNotifications[];
        pageParams: (string | undefined)[];
      }>({ queryKey: ['notifications'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((n) => ({ ...n, isRead: true })),
          })),
        };
      });

      useNotificationStore.getState().resetUnread();
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['notifications'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      });
    },
  });
}

/** Save push subscription to backend */
export function useSavePushSubscription() {
  return useMutation({
    mutationFn: async (sub: {
      endpoint: string;
      p256dh: string;
      auth: string;
    }) => {
      const response = await apiClient.post(
        '/notifications/push-subscription',
        sub,
      );
      return response.data;
    },
  });
}

/** Remove push subscription from backend */
export function useRemovePushSubscription() {
  return useMutation({
    mutationFn: async (endpoint: string) => {
      const response = await apiClient.delete(
        '/notifications/push-subscription',
        { data: { endpoint } },
      );
      return response.data;
    },
  });
}
