import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { ToggleResponse, PostResponse, PaginatedResponse } from '@figly/shared';

type InfinitePostData = {
  pages: PaginatedResponse<PostResponse>[];
  pageParams: (string | undefined)[];
};

/** Helper to optimistically update a post across all query keys */
function updatePostInQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  postId: string,
  updater: (post: PostResponse) => PostResponse,
) {
  // Update feed pages
  queryClient.setQueriesData<InfinitePostData>({ queryKey: ['feed'] }, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (item.id === postId ? updater(item) : item)),
      })),
    };
  });

  // Update userPosts pages
  queryClient.setQueriesData<InfinitePostData>({ queryKey: ['userPosts'] }, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (item.id === postId ? updater(item) : item)),
      })),
    };
  });

  // Update savedPosts pages
  queryClient.setQueriesData<InfinitePostData>({ queryKey: ['savedPosts'] }, (old) => {
    if (!old) return old;
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (item.id === postId ? updater(item) : item)),
      })),
    };
  });

  // Update single post detail
  queryClient.setQueryData<PostResponse>(['post', postId], (old) => {
    if (!old) return old;
    return updater(old);
  });
}

/** Like a post with optimistic update */
export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await apiClient.post<ToggleResponse>(`/posts/${postId}/like`);
      return response.data;
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      const previousFeed = queryClient.getQueriesData<InfinitePostData>({ queryKey: ['feed'] });
      const previousPost = queryClient.getQueryData<PostResponse>(['post', postId]);

      updatePostInQueries(queryClient, postId, (post) => ({
        ...post,
        isLiked: true,
        likeCount: post.likeCount + 1,
      }));

      return { previousFeed, previousPost, postId };
    },
    onError: (_err, { postId }, context) => {
      if (context?.previousFeed) {
        for (const [key, data] of context.previousFeed) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },
    onSettled: (_data, _err, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    },
  });
}

/** Unlike a post with optimistic update */
export function useUnlikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await apiClient.delete<ToggleResponse>(`/posts/${postId}/like`);
      return response.data;
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      const previousFeed = queryClient.getQueriesData<InfinitePostData>({ queryKey: ['feed'] });
      const previousPost = queryClient.getQueryData<PostResponse>(['post', postId]);

      updatePostInQueries(queryClient, postId, (post) => ({
        ...post,
        isLiked: false,
        likeCount: Math.max(0, post.likeCount - 1),
      }));

      return { previousFeed, previousPost, postId };
    },
    onError: (_err, { postId }, context) => {
      if (context?.previousFeed) {
        for (const [key, data] of context.previousFeed) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },
    onSettled: (_data, _err, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    },
  });
}

/** Bookmark a post with optimistic update */
export function useBookmarkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await apiClient.post<ToggleResponse>(`/posts/${postId}/bookmark`);
      return response.data;
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      const previousFeed = queryClient.getQueriesData<InfinitePostData>({ queryKey: ['feed'] });
      const previousPost = queryClient.getQueryData<PostResponse>(['post', postId]);

      updatePostInQueries(queryClient, postId, (post) => ({
        ...post,
        isBookmarked: true,
      }));

      return { previousFeed, previousPost, postId };
    },
    onError: (_err, { postId }, context) => {
      if (context?.previousFeed) {
        for (const [key, data] of context.previousFeed) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },
    onSettled: (_data, _err, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    },
  });
}

/** Unbookmark a post with optimistic update */
export function useUnbookmarkMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const response = await apiClient.delete<ToggleResponse>(`/posts/${postId}/bookmark`);
      return response.data;
    },
    onMutate: async ({ postId }) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      const previousFeed = queryClient.getQueriesData<InfinitePostData>({ queryKey: ['feed'] });
      const previousPost = queryClient.getQueryData<PostResponse>(['post', postId]);

      updatePostInQueries(queryClient, postId, (post) => ({
        ...post,
        isBookmarked: false,
      }));

      return { previousFeed, previousPost, postId };
    },
    onError: (_err, { postId }, context) => {
      if (context?.previousFeed) {
        for (const [key, data] of context.previousFeed) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousPost) {
        queryClient.setQueryData(['post', postId], context.previousPost);
      }
    },
    onSettled: (_data, _err, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
    },
  });
}

/** Update a post's caption */
export function useUpdateCaption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, caption }: { postId: string; caption: string }) => {
      const response = await apiClient.patch<PostResponse>(`/posts/${postId}`, { caption });
      return response.data;
    },
    onSuccess: (_data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      toast.success('Da cap nhat chu thich');
    },
  });
}

/** Delete a post */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      await apiClient.delete(`/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['userPosts'] });
      queryClient.invalidateQueries({ queryKey: ['savedPosts'] });
      toast.success('Da xoa bai viet');
    },
  });
}
