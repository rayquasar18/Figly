import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  PaginatedResponse,
  FeedPostResponse,
  PostResponse,
} from '@figly/shared';

/** Fetch chronological feed from followed users with infinite scroll */
export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const query = params.toString();

      const response = await apiClient.get<PaginatedResponse<FeedPostResponse>>(
        `/feed${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/** Fetch a single post by ID */
export function usePostDetail(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const response = await apiClient.get<PostResponse>(`/posts/${postId}`);
      return response.data;
    },
    enabled: !!postId,
    staleTime: 2 * 60 * 1000,
  });
}

/** Fetch posts by a user for profile grid */
export function useUserPosts(username: string) {
  return useInfiniteQuery({
    queryKey: ['userPosts', username],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const query = params.toString();

      const response = await apiClient.get<PaginatedResponse<PostResponse>>(
        `/posts/user/${username}${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username,
  });
}

/** Create a new post */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { caption?: string; mediaIds: string[] }) => {
      const response = await apiClient.post<PostResponse>('/posts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
    },
  });
}

/** Fetch saved/bookmarked posts */
export function useSavedPosts() {
  return useInfiniteQuery({
    queryKey: ['savedPosts'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const query = params.toString();

      const response = await apiClient.get<PaginatedResponse<PostResponse>>(
        `/posts/saved${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
