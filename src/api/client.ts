import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from './config';
import { tokenStore } from './tokenStore';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Called when refresh fails so the app can log the user out.
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: () => void) {
  onAuthFailure = fn;
}

// Attach the access token to every request.
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStore.getAccess();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try a single refresh, then retry the original request.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStore.getRefresh();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
    await tokenStore.save(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    await tokenStore.clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      onAuthFailure?.();
    }
    return Promise.reject(error);
  },
);

/** Extract a human-friendly message from an API error. */
export function apiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string })?.message ?? error.message ?? fallback;
  }
  return fallback;
}
