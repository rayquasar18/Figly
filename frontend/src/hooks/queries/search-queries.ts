import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  SearchUserResult,
  SearchHashtagResult,
  PaginatedResponse,
  PostResponse,
  ItemResponse,
  ExploreCategorySection,
} from '@figly/shared';

// ---------- Search hooks ----------

/** Search users by query string */
export function useSearchUsers(q: string) {
  return useQuery({
    queryKey: ['search', 'users', q],
    queryFn: async () => {
      const response = await apiClient.get<SearchUserResult[]>(
        `/search/users?q=${encodeURIComponent(q)}`,
      );
      return response.data;
    },
    enabled: q.length >= 1,
    staleTime: 30_000,
  });
}

/** Search hashtags by query string */
export function useSearchHashtags(q: string) {
  return useQuery({
    queryKey: ['search', 'hashtags', q],
    queryFn: async () => {
      const response = await apiClient.get<SearchHashtagResult[]>(
        `/search/hashtags?q=${encodeURIComponent(q)}`,
      );
      return response.data;
    },
    enabled: q.length >= 1,
    staleTime: 30_000,
  });
}

/** Search items with cursor pagination */
export function useSearchItemsGlobal(q: string) {
  return useInfiniteQuery({
    queryKey: ['search', 'items', q],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('q', q);
      if (pageParam) params.set('cursor', pageParam);

      const response = await apiClient.get<PaginatedResponse<ItemResponse>>(
        `/search/items?${params.toString()}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: q.length >= 1,
  });
}

// ---------- Hashtag posts hook ----------

interface HashtagPostsResponse {
  hashtag: { id: string; name: string; postCount: number };
  items: PostResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Fetch paginated posts for a hashtag */
export function useHashtagPosts(name: string) {
  return useInfiniteQuery({
    queryKey: ['hashtagPosts', name],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const query = params.toString();

      const response = await apiClient.get<HashtagPostsResponse>(
        `/posts/hashtag/${encodeURIComponent(name)}${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!name,
  });
}

// ---------- Explore feed hook ----------

/** Fetch category-curated explore feed */
export function useExploreFeed() {
  return useQuery({
    queryKey: ['explore'],
    queryFn: async () => {
      const response =
        await apiClient.get<ExploreCategorySection[]>('/feed/explore');
      return response.data;
    },
    staleTime: 5 * 60_000,
  });
}
