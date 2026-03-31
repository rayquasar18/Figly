import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { PaginatedResponse, PostResponse } from '@figly/shared';

/** Fetch reels feed with infinite scroll */
export function useReelsFeed() {
  return useInfiniteQuery({
    queryKey: ['reelsFeed'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const query = params.toString();
      const response = await apiClient.get<PaginatedResponse<PostResponse>>(
        `/feed/reels${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 2 * 60 * 1000,
  });
}

/** Fetch user's reels for profile tab */
export function useUserReels(username: string) {
  return useInfiniteQuery({
    queryKey: ['userReels', username],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const query = params.toString();
      const response = await apiClient.get<PaginatedResponse<PostResponse>>(
        `/posts/user/${username}/reels${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username,
  });
}

/** Create a new reel */
export function useCreateReel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      mediaId: string;
      caption?: string;
      linkedItemIds?: string[];
      duration: number;
      width: number;
      height: number;
    }) => {
      const response = await apiClient.post<PostResponse>('/posts/reel', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reelsFeed'] });
      queryClient.invalidateQueries({ queryKey: ['userReels'] });
    },
  });
}
