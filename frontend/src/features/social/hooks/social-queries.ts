import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ProfileResponse, UserListItem, PaginatedResponse } from '@figly/shared';

/** Follow a user. Optimistically updates profile cache. */
export function useFollowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string; username: string }) => {
      const response = await apiClient.post<{ message: string }>(`/social/follow/${userId}`);
      return response.data;
    },
    onMutate: async ({ username }) => {
      // Cancel in-flight profile query
      await queryClient.cancelQueries({ queryKey: ['profile', username] });

      // Snapshot current data for rollback
      const previous = queryClient.getQueryData<ProfileResponse>(['profile', username]);

      // Optimistically set isFollowing=true and increment followerCount
      if (previous) {
        queryClient.setQueryData<ProfileResponse>(['profile', username], {
          ...previous,
          isFollowing: true,
          followerCount: previous.followerCount + 1,
        });
      }

      return { previous, username };
    },
    onError: (_err, _vars, context) => {
      // Rollback to snapshot on error
      if (context?.previous) {
        queryClient.setQueryData(['profile', context.username], context.previous);
      }
    },
    onSettled: (_data, _err, { username }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
}

/** Unfollow a user. Optimistically updates profile cache. */
export function useUnfollowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string; username: string }) => {
      const response = await apiClient.delete<{ message: string }>(`/social/follow/${userId}`);
      return response.data;
    },
    onMutate: async ({ username }) => {
      await queryClient.cancelQueries({ queryKey: ['profile', username] });

      const previous = queryClient.getQueryData<ProfileResponse>(['profile', username]);

      if (previous) {
        queryClient.setQueryData<ProfileResponse>(['profile', username], {
          ...previous,
          isFollowing: false,
          followerCount: Math.max(0, previous.followerCount - 1),
        });
      }

      return { previous, username };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['profile', context.username], context.previous);
      }
    },
    onSettled: (_data, _err, { username }) => {
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
}

/** Fetch paginated followers for a user with optional search filter. */
export function useFollowers(username: string, search?: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['followers', username, search],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      if (search) params.set('search', search);
      const query = params.toString();

      const response = await apiClient.get<PaginatedResponse<UserListItem>>(
        `/social/${username}/followers${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username && enabled,
  });
}

/** Fetch paginated following list for a user with optional search filter. */
export function useFollowing(username: string, search?: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['following', username, search],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      if (search) params.set('search', search);
      const query = params.toString();

      const response = await apiClient.get<PaginatedResponse<UserListItem>>(
        `/social/${username}/following${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username && enabled,
  });
}

/** Remove a follower from the current user's followers list. */
export function useRemoveFollowerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await apiClient.delete<{ message: string }>(`/social/followers/${userId}`);
      return response.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['followers'] });
    },
  });
}
