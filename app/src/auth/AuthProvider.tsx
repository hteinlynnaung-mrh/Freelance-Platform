import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  api,
  clearAuthSession,
  deleteAccount as apiDeleteAccount,
  getCurrentUser,
  getStoredUser,
  setRefreshFailedHandler,
  storeAuthSession,
  type AuthUser,
} from "../api/client";

interface AuthState {
  /** The current signed-in user, or null when signed out. */
  user: AuthUser | null;
  /** True while the provider is restoring a session on mount. */
  isLoading: boolean;
  /** Convenience: !!user */
  isAuthenticated: boolean;
}

interface AuthActions {
  /** Sign in with email/username + password. Stores tokens and sets user. */
  login: (emailOrUsername: string, password: string) => Promise<void>;
  /** Register a new account. Stores tokens and sets user. */
  register: (email: string, password: string, role: "CLIENT" | "FREELANCER", displayName: string, username?: string) => Promise<void>;
  /** Sign out. Clears tokens and user. */
  logout: () => Promise<void>;
  /** Re-fetch /auth/me (e.g. after profile edits). */
  refreshUser: () => Promise<void>;
  /** Permanently delete current user account. */
  deleteAccount: (password?: string) => Promise<void>;
}

type AuthContextValue = AuthState & AuthActions;

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);

  // Re-fetch current user from the API
  const fetchMe = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await getCurrentUser();
      return response.data.user;
    } catch {
      return null;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const u = await fetchMe();
    if (mountedRef.current) {
      if (u) {
        localStorage.setItem("archer_user", JSON.stringify(u));
      }
      setUser(u);
    }
  }, [fetchMe]);

  // Restore session on mount
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      const accessToken = localStorage.getItem("archer_access_token");
      if (accessToken) {
        const u = await fetchMe();
        if (mountedRef.current) {
          if (u) {
            localStorage.setItem("archer_user", JSON.stringify(u));
            setUser(u);
          } else {
            // Token is invalid and refresh also failed — clear everything
            clearAuthSession();
            setUser(null);
          }
        }
      }
      if (mountedRef.current) setIsLoading(false);
    })();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchMe]);

  // Handle token refresh failure: clear user state so the UI reacts
  useEffect(() => {
    setRefreshFailedHandler(() => {
      if (mountedRef.current) {
        clearAuthSession();
        setUser(null);
      }
    });
  }, []);

  // Sync with cross-tab storage changes
  useEffect(() => {
    const sync = () => {
      if (mountedRef.current) setUser(getStoredUser());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string) => {
    const isEmail = emailOrUsername.includes("@");
    const body = isEmail
      ? { email: emailOrUsername, password }
      : { username: emailOrUsername, password };

    const response = await api<{ data: { user: AuthUser; accessToken: string; refreshToken: string } }>(
      "/api/v1/auth/login",
      { method: "POST", body: JSON.stringify(body) },
    );
    storeAuthSession({
      user: response.data.user,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
    setUser(response.data.user);
  }, []);

  const register = useCallback(async (
    email: string,
    password: string,
    role: "CLIENT" | "FREELANCER",
    displayName: string,
    username?: string,
  ) => {
    const response = await api<{ data: { user: AuthUser; accessToken: string; refreshToken: string } }>(
      "/api/v1/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password, role, displayName, ...(username ? { username } : {}) }),
      },
    );
    storeAuthSession({
      user: response.data.user,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
    setUser(response.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("archer_refresh_token");
      if (refreshToken) {
        await api<void>("/api/v1/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        }).catch(() => {});
      }
    } finally {
      clearAuthSession();
      setUser(null);
    }
  }, []);

  const deleteAccount = useCallback(async (password?: string) => {
    try {
      await apiDeleteAccount(password);
    } finally {
      clearAuthSession();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
      deleteAccount,
    }),
    [user, isLoading, login, register, logout, refreshUser, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
