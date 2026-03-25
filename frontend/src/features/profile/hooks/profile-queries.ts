import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth';
import type { ProfileResponse } from '@figly/shared';

/** Fetch a user profile by username */
export function useProfile(username: string) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const response = await apiClient.get<ProfileResponse>(
        `/profiles/${username}`,
      );
      return response.data;
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}

/** Update the current user's profile */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: {
      displayName?: string;
      username?: string;
      bio?: string | null;
      avatarId?: string;
    }) => {
      const response = await apiClient.patch<ProfileResponse>(
        '/profiles/me',
        data,
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate all profile queries so they refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      // Update auth store if username changed
      if (user && data.username !== user.username) {
        setUser({ ...user, username: data.username, name: data.displayName });
      } else if (user) {
        setUser({ ...user, name: data.displayName });
      }
    },
  });
}

/** Check username availability (enabled when username >= 3 chars) */
export function useCheckUsername(username: string) {
  return useQuery({
    queryKey: ['username-check', username],
    queryFn: async () => {
      const response = await apiClient.get<{ available: boolean }>(
        `/profiles/check/${username}`,
      );
      return response.data;
    },
    enabled: username.length >= 3,
    staleTime: 30 * 1000,
  });
}
