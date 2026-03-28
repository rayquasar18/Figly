import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  BlockedUserResponse,
  MutedUserResponse,
  PaginatedResponse,
} from '@figly/shared';

// --------------------------------
// Report
// --------------------------------

export function useReport() {
  return useMutation({
    mutationFn: async (data: {
      targetId: string;
      targetType: 'POST' | 'USER';
      reason: string;
    }) => {
      const response = await apiClient.post('/moderation/report', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cam on ban da bao cao. Chung toi se xem xet.');
    },
  });
}

// --------------------------------
// Block / Unblock
// --------------------------------

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await apiClient.post(`/moderation/block/${userId}`);
      return response.data;
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
      queryClient.invalidateQueries({ queryKey: ['blockStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      toast.success('Da chan nguoi dung.');
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await apiClient.delete(`/moderation/block/${userId}`);
      return response.data;
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['blockStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Da bo chan.');
    },
  });
}

// --------------------------------
// Mute / Unmute
// --------------------------------

export function useMuteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await apiClient.post(`/moderation/mute/${userId}`);
      return response.data;
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['muteStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['mutedUsers'] });
      toast.success('Da tat tieng nguoi dung.');
    },
  });
}

export function useUnmuteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await apiClient.delete(`/moderation/mute/${userId}`);
      return response.data;
    },
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['mutedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['muteStatus', userId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Da bat tieng lai.');
    },
  });
}

// --------------------------------
// Blocked / Muted User Lists
// --------------------------------

export function useBlockedUsers() {
  return useInfiniteQuery({
    queryKey: ['blockedUsers'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const query = params.toString();

      const response = await apiClient.get<PaginatedResponse<BlockedUserResponse>>(
        `/moderation/blocked${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useMutedUsers() {
  return useInfiniteQuery({
    queryKey: ['mutedUsers'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const query = params.toString();

      const response = await apiClient.get<PaginatedResponse<MutedUserResponse>>(
        `/moderation/muted${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// --------------------------------
// Block / Mute Status
// --------------------------------

export function useBlockStatus(userId: string) {
  return useQuery({
    queryKey: ['blockStatus', userId],
    queryFn: async () => {
      const response = await apiClient.get<{ isBlocked: boolean }>(
        `/moderation/block-status/${userId}`,
      );
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useMuteStatus(userId: string) {
  return useQuery({
    queryKey: ['muteStatus', userId],
    queryFn: async () => {
      const response = await apiClient.get<{ isMuted: boolean }>(
        `/moderation/mute-status/${userId}`,
      );
      return response.data;
    },
    enabled: !!userId,
  });
}
