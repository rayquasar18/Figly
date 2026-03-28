import {
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  ReportQueueItem,
  PaginatedResponse,
  AdminActionResponse,
} from '@figly/shared';

// --------------------------------
// Report Queue
// --------------------------------

export function useReportQueue(sort: 'newest' | 'most_reported' = 'newest') {
  return useInfiniteQuery({
    queryKey: ['reportQueue', sort],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set('sort', sort);
      if (pageParam) params.set('cursor', pageParam);

      const response = await apiClient.get<PaginatedResponse<ReportQueueItem>>(
        `/admin/reports?${params.toString()}`,
      );
      return response.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

// --------------------------------
// Admin Actions
// --------------------------------

export function useDismissReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId }: { reportId: string }) => {
      const response = await apiClient.post<AdminActionResponse>(
        `/admin/reports/${reportId}/dismiss`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportQueue'] });
      toast.success('Bao cao da bi bo qua.');
    },
  });
}

export function useRemoveContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId }: { reportId: string }) => {
      const response = await apiClient.post<AdminActionResponse>(
        `/admin/reports/${reportId}/remove-content`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportQueue'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Noi dung da bi xoa.');
    },
  });
}

export function useWarnUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await apiClient.post<AdminActionResponse>(
        `/admin/users/${userId}/warn`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportQueue'] });
      toast.success('Da canh bao nguoi dung.');
    },
  });
}

export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const response = await apiClient.post<AdminActionResponse>(
        `/admin/users/${userId}/ban`,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportQueue'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Nguoi dung da bi cam.');
    },
  });
}
