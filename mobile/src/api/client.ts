import * as SecureStore from 'expo-secure-store';
import { API_URL } from './config';

export { API_URL };

const ACCESS_TOKEN_KEY = 'archer_access_token';
const REFRESH_TOKEN_KEY = 'archer_refresh_token';

export const tokenStore = {
  getAccess: () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
  setAccess: (v: string) => SecureStore.setItemAsync(ACCESS_TOKEN_KEY, v),
  getRefresh: () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  setRefresh: (v: string) => SecureStore.setItemAsync(REFRESH_TOKEN_KEY, v),
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};

// Injected by AuthContext so the client can call refresh without circular imports
let _onRefreshFailed: (() => void) | null = null;
export const setRefreshFailedHandler = (fn: () => void) => { _onRefreshFailed = fn; };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshToken = await tokenStore.getRefresh();
      if (!refreshToken) throw new Error('No refresh token');
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error('Refresh failed');
      const body = await res.json();
      const { accessToken, refreshToken: nextRefresh } = body.data;
      await tokenStore.setAccess(accessToken);
      await tokenStore.setRefresh(nextRefresh);
      return accessToken as string;
    } catch {
      await tokenStore.clear();
      _onRefreshFailed?.();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = await tokenStore.getAccess();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Token expired — attempt one refresh and retry
  if (res.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message ?? `Request failed (${res.status})`;
    const err = new Error(message) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
