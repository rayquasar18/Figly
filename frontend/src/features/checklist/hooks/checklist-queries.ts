import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type {
  ChecklistResponse,
  ChecklistDetailResponse,
  ChecklistEntryResponse,
} from '@figly/shared';

// ---------- Query hooks ----------

/** Fetch current user's checklists */
export function useMyChecklists() {
  return useQuery({
    queryKey: ['checklists'],
    queryFn: async () => {
      const response = await apiClient.get<ChecklistResponse[]>('/checklists');
      return response.data;
    },
  });
}

/** Fetch a single checklist with entries */
export function useChecklistDetail(checklistId: string) {
  return useQuery({
    queryKey: ['checklist', checklistId],
    queryFn: async () => {
      const response = await apiClient.get<ChecklistDetailResponse>(`/checklists/${checklistId}`);
      return response.data;
    },
    enabled: !!checklistId,
  });
}

// ---------- Mutation hooks ----------

/** Create a new checklist */
export function useCreateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; isPublic: boolean }) => {
      const response = await apiClient.post<ChecklistResponse>('/checklists', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast.success('Da tao checklist');
    },
  });
}

/** Update a checklist's name/visibility */
export function useUpdateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checklistId,
      data,
    }: {
      checklistId: string;
      data: { name?: string; isPublic?: boolean };
    }) => {
      const response = await apiClient.patch<ChecklistResponse>(`/checklists/${checklistId}`, data);
      return response.data;
    },
    onSuccess: (_data, { checklistId }) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', checklistId] });
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast.success('Da cap nhat checklist');
    },
  });
}

/** Delete a checklist */
export function useDeleteChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ checklistId }: { checklistId: string }) => {
      await apiClient.delete(`/checklists/${checklistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      toast.success('Da xoa checklist');
    },
  });
}

/** Add an entry to a checklist */
export function useAddEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      checklistId,
      data,
    }: {
      checklistId: string;
      data: { itemId?: string; freeformText?: string };
    }) => {
      const response = await apiClient.post<ChecklistEntryResponse>(
        `/checklists/${checklistId}/entries`,
        data,
      );
      return response.data;
    },
    onSuccess: (_data, { checklistId }) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', checklistId] });
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}

/** Toggle an entry's checked status with optimistic update */
export function useToggleEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId }: { entryId: string; checklistId: string }) => {
      const response = await apiClient.patch<ChecklistEntryResponse>(
        `/checklists/entries/${entryId}/toggle`,
      );
      return response.data;
    },
    onMutate: async ({ entryId, checklistId }) => {
      await queryClient.cancelQueries({ queryKey: ['checklist', checklistId] });

      const previous = queryClient.getQueryData<ChecklistDetailResponse>([
        'checklist',
        checklistId,
      ]);

      // Optimistic toggle
      queryClient.setQueryData<ChecklistDetailResponse>(['checklist', checklistId], (old) => {
        if (!old) return old;
        const entries = old.entries.map((e) =>
          e.id === entryId ? { ...e, isChecked: !e.isChecked } : e,
        );
        const checkedEntries = entries.filter((e) => e.isChecked).length;
        return {
          ...old,
          entries,
          checkedEntries,
        };
      });

      return { previous, checklistId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['checklist', context.checklistId], context.previous);
      }
    },
    onSettled: (_data, _err, { checklistId }) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', checklistId] });
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}

/** Remove an entry from a checklist */
export function useRemoveEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId }: { entryId: string; checklistId: string }) => {
      await apiClient.delete(`/checklists/entries/${entryId}`);
    },
    onSuccess: (_data, { checklistId }) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', checklistId] });
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });
}

/** Reorder entries with optimistic update */
export function useReorderEntries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ checklistId, entryIds }: { checklistId: string; entryIds: string[] }) => {
      await apiClient.patch(`/checklists/${checklistId}/reorder`, {
        entryIds,
      });
    },
    onMutate: async ({ checklistId, entryIds }) => {
      await queryClient.cancelQueries({ queryKey: ['checklist', checklistId] });

      const previous = queryClient.getQueryData<ChecklistDetailResponse>([
        'checklist',
        checklistId,
      ]);

      // Optimistic reorder: rearrange entries based on entryIds order
      queryClient.setQueryData<ChecklistDetailResponse>(['checklist', checklistId], (old) => {
        if (!old) return old;
        const entryMap = new Map(old.entries.map((e) => [e.id, e]));
        const reordered = entryIds
          .map((id, index) => {
            const entry = entryMap.get(id);
            return entry ? { ...entry, position: index } : null;
          })
          .filter(Boolean) as ChecklistEntryResponse[];
        return { ...old, entries: reordered };
      });

      return { previous, checklistId };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['checklist', context.checklistId], context.previous);
      }
    },
    onSettled: (_data, _err, { checklistId }) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', checklistId] });
    },
  });
}
