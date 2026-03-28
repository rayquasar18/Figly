import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { StoryFeedResponse } from '@figly/shared';

export const storyKeys = {
  all: ['stories'] as const,
  feed: () => [...storyKeys.all, 'feed'] as const,
  viewers: (storyId: string) => [...storyKeys.all, 'viewers', storyId] as const,
};

export function useStoryFeed() {
  return useQuery({
    queryKey: storyKeys.feed(),
    queryFn: async (): Promise<StoryFeedResponse> => {
      const { data } = await apiClient.get('/stories/feed');
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

export function useCreateStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (mediaId: string) => {
      const { data } = await apiClient.post('/stories', { mediaId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyKeys.feed() });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (storyId: string) => {
      const { data } = await apiClient.delete(`/stories/${storyId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: storyKeys.feed() });
    },
  });
}

export function useMarkStoryViewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (storyId: string) => {
      const { data } = await apiClient.post(`/stories/${storyId}/view`);
      return data;
    },
    onSuccess: () => {
      // Don't invalidate immediately -- batch invalidation on viewer close
    },
  });
}

export function useStoryViewers(storyId: string) {
  return useQuery({
    queryKey: storyKeys.viewers(storyId),
    queryFn: async () => {
      const { data } = await apiClient.get(`/stories/${storyId}/viewers`);
      return data;
    },
    enabled: !!storyId,
  });
}
