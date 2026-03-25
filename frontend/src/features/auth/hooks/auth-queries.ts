import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '../stores/auth-store';
import type { PublicUser } from '@figly/shared';

// GET /auth/me - check current session
export function useMe() {
  const { setUser, clearUser } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await apiClient.get<{ user: PublicUser }>('/auth/me');
      setUser(response.data.user);
      return response.data.user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    meta: {
      onError: () => {
        clearUser();
      },
    },
  });
}

// POST /auth/login
export function useLoginMutation() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiClient.post<{ user: PublicUser }>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });
}

// POST /auth/signup
export function useSignupMutation() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string; username: string }) => {
      const response = await apiClient.post('/auth/signup', data);
      return response.data;
    },
  });
}

// POST /auth/logout
export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const { clearUser } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout');
    },
    onSuccess: () => {
      clearUser();
      queryClient.removeQueries({ queryKey: ['auth'] });
    },
  });
}

// GET /auth/verify-email?token=xxx
export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await apiClient.get(`/auth/verify-email?token=${token}`);
      return response.data;
    },
  });
}

// POST /auth/forgot-password
export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiClient.post('/auth/forgot-password', data);
      return response.data;
    },
  });
}

// POST /auth/reset-password
export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const response = await apiClient.post('/auth/reset-password', data);
      return response.data;
    },
  });
}
