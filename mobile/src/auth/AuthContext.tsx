import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api, setRefreshFailedHandler, tokenStore } from '../api/client';
import type { User } from '../api/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'CLIENT' | 'FREELANCER', displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  deleteAccount: (password?: string) => Promise<void>;
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchMe = useCallback(async (): Promise<User | null> => {
    try {
      // /api/v1/auth/me wraps the user: { data: { user } }
      const res = await api<{ data: { user: User } }>('/api/v1/auth/me');
      return res.data.user;
    } catch {
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await fetchMe();
    if (mountedRef.current) setUser(u);
  }, [fetchMe]);

  // Restore session on mount
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      const token = await tokenStore.getAccess();
      if (token) {
        const u = await fetchMe();
        if (mountedRef.current) setUser(u);
      }
      if (mountedRef.current) setIsLoading(false);
    })();
    return () => { mountedRef.current = false; };
  }, [fetchMe]);

  // Handle token refresh failure (sign out)
  useEffect(() => {
    setRefreshFailedHandler(() => {
      if (mountedRef.current) setUser(null);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ data: { user: User; accessToken: string; refreshToken: string } }>(
      '/api/v1/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
    await tokenStore.setAccess(res.data.accessToken);
    await tokenStore.setRefresh(res.data.refreshToken);
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (
    email: string, password: string,
    role: 'CLIENT' | 'FREELANCER', displayName: string,
  ) => {
    const res = await api<{ data: { user: User; accessToken: string; refreshToken: string } }>(
      '/api/v1/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, role, displayName }) },
    );
    await tokenStore.setAccess(res.data.accessToken);
    await tokenStore.setRefresh(res.data.refreshToken);
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = await tokenStore.getRefresh();
      if (refreshToken) {
        await api('/api/v1/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }).catch(() => {});
      }
    } finally {
      await tokenStore.clear();
      setUser(null);
    }
  }, []);

  const deleteAccount = useCallback(async (password?: string) => {
    try {
      await api('/api/v1/auth/me', {
        method: 'DELETE',
        body: password ? JSON.stringify({ password }) : undefined,
      });
    } finally {
      await tokenStore.clear();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
