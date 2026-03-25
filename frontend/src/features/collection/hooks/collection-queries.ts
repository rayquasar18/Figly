import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CategoryResponse,
  SeriesResponse,
  ItemResponse,
  ItemDetailResponse,
  PaginatedResponse,
} from '@figly/shared';

// ---------- Query hooks ----------

/** Fetch all categories */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response =
        await apiClient.get<CategoryResponse[]>('/collection/categories');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch series within a category by slug */
export function useSeriesByCategory(categorySlug: string) {
  return useQuery({
    queryKey: ['series', categorySlug],
    queryFn: async () => {
      const response = await apiClient.get<SeriesResponse[]>(
        `/collection/categories/${categorySlug}/series`,
      );
      return response.data;
    },
    enabled: !!categorySlug,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetch items within a series with cursor pagination */
export function useItemsBySeries(
  categorySlug: string,
  seriesSlug: string,
) {
  return useInfiniteQuery({
    queryKey: ['items', categorySlug, seriesSlug],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      const query = params.toString();

      const response = await apiClient.get<PaginatedResponse<ItemResponse>>(
        `/collection/series/${categorySlug}/${seriesSlug}/items${query ? `?${query}` : ''}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!categorySlug && !!seriesSlug,
  });
}

/** Fetch single item detail */
export function useItemDetail(itemId: string) {
  return useQuery({
    queryKey: ['itemDetail', itemId],
    queryFn: async () => {
      const response = await apiClient.get<ItemDetailResponse>(
        `/collection/items/${itemId}`,
      );
      return response.data;
    },
    enabled: !!itemId,
    staleTime: 2 * 60 * 1000,
  });
}

/** Search items with debounced query and optional filters */
export function useSearchItems(
  q: string,
  filters?: { categoryId?: string; seriesId?: string },
) {
  return useInfiniteQuery({
    queryKey: ['searchItems', q, filters?.categoryId, filters?.seriesId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('q', q);
      if (pageParam) params.set('cursor', pageParam);
      if (filters?.categoryId) params.set('categoryId', filters.categoryId);
      if (filters?.seriesId) params.set('seriesId', filters.seriesId);

      const response = await apiClient.get<PaginatedResponse<ItemResponse>>(
        `/collection/items/search?${params.toString()}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: q.length >= 1,
  });
}

// ---------- Mutation hooks ----------

type InfiniteItemData = {
  pages: PaginatedResponse<ItemResponse>[];
  pageParams: (string | undefined)[];
};

/** Helper to update an item across all item list query keys */
function updateItemInQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  itemId: string,
  updater: (item: ItemResponse) => ItemResponse,
) {
  // Update items list queries
  queryClient.setQueriesData<InfiniteItemData>(
    { queryKey: ['items'] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.id === itemId ? updater(item) : item,
          ),
        })),
      };
    },
  );

  // Update search results
  queryClient.setQueriesData<InfiniteItemData>(
    { queryKey: ['searchItems'] },
    (old) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.id === itemId ? updater(item) : item,
          ),
        })),
      };
    },
  );

  // Update single item detail
  queryClient.setQueryData<ItemDetailResponse>(
    ['itemDetail', itemId],
    (old) => {
      if (!old) return old;
      return { ...old, ...updater(old) };
    },
  );
}

/** Toggle owned status with optimistic update */
export function useToggleOwned() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: string }) => {
      const response = await apiClient.post<{
        success: boolean;
        isOwned: boolean;
      }>(`/collection/items/${itemId}/owned`);
      return response.data;
    },
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      await queryClient.cancelQueries({ queryKey: ['searchItems'] });
      await queryClient.cancelQueries({ queryKey: ['itemDetail', itemId] });

      const previousDetail = queryClient.getQueryData<ItemDetailResponse>([
        'itemDetail',
        itemId,
      ]);
      const previousItems = queryClient.getQueriesData<InfiniteItemData>({
        queryKey: ['items'],
      });
      const previousSearch = queryClient.getQueriesData<InfiniteItemData>({
        queryKey: ['searchItems'],
      });

      // Optimistic: toggle owned, clear wishlist if marking owned
      updateItemInQueries(queryClient, itemId, (item) => {
        const newOwned = !item.isOwned;
        return {
          ...item,
          isOwned: newOwned,
          isWishlisted: newOwned ? false : item.isWishlisted,
        };
      });

      // Also update ownerCount on detail
      queryClient.setQueryData<ItemDetailResponse>(
        ['itemDetail', itemId],
        (old) => {
          if (!old) return old;
          const newOwned = !old.isOwned;
          return {
            ...old,
            isOwned: newOwned,
            isWishlisted: newOwned ? false : old.isWishlisted,
            ownerCount: old.ownerCount + (newOwned ? 1 : -1),
          };
        },
      );

      return { previousDetail, previousItems, previousSearch, itemId };
    },
    onError: (_err, { itemId }, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          ['itemDetail', itemId],
          context.previousDetail,
        );
      }
      if (context?.previousItems) {
        for (const [key, data] of context.previousItems) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousSearch) {
        for (const [key, data] of context.previousSearch) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: (_data, _err, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['searchItems'] });
      queryClient.invalidateQueries({ queryKey: ['itemDetail', itemId] });
    },
  });
}

/** Toggle wishlist status with optimistic update */
export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId }: { itemId: string }) => {
      const response = await apiClient.post<{
        success: boolean;
        isWishlisted: boolean;
      }>(`/collection/items/${itemId}/wishlist`);
      return response.data;
    },
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey: ['items'] });
      await queryClient.cancelQueries({ queryKey: ['searchItems'] });
      await queryClient.cancelQueries({ queryKey: ['itemDetail', itemId] });

      const previousDetail = queryClient.getQueryData<ItemDetailResponse>([
        'itemDetail',
        itemId,
      ]);
      const previousItems = queryClient.getQueriesData<InfiniteItemData>({
        queryKey: ['items'],
      });
      const previousSearch = queryClient.getQueriesData<InfiniteItemData>({
        queryKey: ['searchItems'],
      });

      // Optimistic: toggle wishlist, clear owned if marking wishlist
      updateItemInQueries(queryClient, itemId, (item) => {
        const newWishlisted = !item.isWishlisted;
        return {
          ...item,
          isWishlisted: newWishlisted,
          isOwned: newWishlisted ? false : item.isOwned,
        };
      });

      // Also update ownerCount on detail if owned was cleared
      queryClient.setQueryData<ItemDetailResponse>(
        ['itemDetail', itemId],
        (old) => {
          if (!old) return old;
          const newWishlisted = !old.isWishlisted;
          return {
            ...old,
            isWishlisted: newWishlisted,
            isOwned: newWishlisted ? false : old.isOwned,
            ownerCount:
              newWishlisted && old.isOwned
                ? Math.max(0, old.ownerCount - 1)
                : old.ownerCount,
          };
        },
      );

      return { previousDetail, previousItems, previousSearch, itemId };
    },
    onError: (_err, { itemId }, context) => {
      if (context?.previousDetail) {
        queryClient.setQueryData(
          ['itemDetail', itemId],
          context.previousDetail,
        );
      }
      if (context?.previousItems) {
        for (const [key, data] of context.previousItems) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousSearch) {
        for (const [key, data] of context.previousSearch) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: (_data, _err, { itemId }) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['searchItems'] });
      queryClient.invalidateQueries({ queryKey: ['itemDetail', itemId] });
    },
  });
}

// ---------- Follow mutations ----------

/** Follow/unfollow a series with optimistic toggle */
export function useFollowSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await apiClient.post<{ success: boolean; isFollowed: boolean }>(
        `/collection/series/${id}/follow`,
      );
      return response.data;
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['series'] });

      queryClient.setQueriesData<SeriesResponse[]>(
        { queryKey: ['series'] },
        (old) => {
          if (!old) return old;
          return old.map((s) =>
            s.id === id ? { ...s, isFollowed: !s.isFollowed } : s,
          );
        },
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['series'] });
    },
  });
}

/** Follow/unfollow a category with optimistic toggle */
export function useFollowCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await apiClient.post<{ success: boolean; isFollowed: boolean }>(
        `/collection/categories/${id}/follow`,
      );
      return response.data;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
