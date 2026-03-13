import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // CRITICAL: send cookies for auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Queue pattern for concurrent 401 handling
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor: on 401, attempt silent refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only intercept 401s, not on refresh endpoint itself, not already retried
    if (
      error.response?.status !== 401 ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/login') ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request is already refreshing -- queue this one
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await apiClient.post('/auth/refresh');
      processQueue(null);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError);
      // Redirect to login on refresh failure (only in browser)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
