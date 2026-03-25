'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/features/auth';
import { apiClient } from '@/lib/api-client';
import type { PublicUser } from '@figly/shared';

export function useAuth() {
  const { user, isLoading, setUser, clearUser, setLoading } = useAuthStore();

  const isAuthenticated = user !== null;

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ user: PublicUser }>('/auth/me');
      setUser(response.data.user);
      return response.data.user;
    } catch {
      clearUser();
      return null;
    }
  }, [setUser, clearUser, setLoading]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await apiClient.post<{ user: PublicUser }>('/auth/login', {
        email,
        password,
      });
      setUser(response.data.user);
      return response.data.user;
    },
    [setUser],
  );

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const response = await apiClient.post('/auth/signup', {
      email,
      password,
      name,
    });
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearUser();
    }
  }, [clearUser]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    checkAuth,
  };
}
