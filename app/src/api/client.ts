import type { ApiEnvelope, Category, PagedProjects, Project, Proposal, SubmitProposalInput } from "./types";

export type AuthUser = { id: string; email: string; username?: string | null; role: "CLIENT" | "FREELANCER" | "ADMIN"; status: string; clientProfile?: unknown; freelancerProfile?: unknown };
export type AuthSession = { user: AuthUser; accessToken: string; refreshToken: string };

const configuredApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (configuredApiUrl || "").replace(/\/$/, "");

// ---------------------------------------------------------------------------
// Token-refresh machinery (mirrors mobile/src/api/client.ts)
// ---------------------------------------------------------------------------

/** Called by AuthProvider when refresh fails so the UI can react. */
let _onRefreshFailed: (() => void) | null = null;
export const setRefreshFailedHandler = (fn: () => void) => { _onRefreshFailed = fn; };

/** Serialise concurrent refresh attempts into one request. */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem("archer_refresh_token");
      if (!refreshToken) throw new Error("No refresh token");

      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) throw new Error("Refresh failed");

      const body = await res.json();
      const { accessToken, refreshToken: nextRefresh, user } = body.data;

      localStorage.setItem("archer_access_token", accessToken);
      localStorage.setItem("archer_refresh_token", nextRefresh);
      if (user) localStorage.setItem("archer_user", JSON.stringify(user));

      return accessToken as string;
    } catch {
      _onRefreshFailed?.();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Core fetch wrapper with transparent 401 → refresh → retry
// ---------------------------------------------------------------------------

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = typeof window !== "undefined" ? localStorage.getItem("archer_access_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  let response = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Token expired — attempt one refresh and retry (matches mobile behavior)
  if (response.status === 401 && accessToken) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      response = await fetch(`${API_URL}${path}`, { ...options, headers });
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.error?.message ?? `Request failed (${response.status})`;
    const err = new Error(message) as Error & { status: number };
    err.status = response.status;
    throw err;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

export function getStoredUser(): AuthUser | null {
  const stored = typeof window !== "undefined" ? localStorage.getItem("archer_user") : null;
  if (!stored) return null;
  try { return JSON.parse(stored) as AuthUser; } catch { return null; }
}

export function storeAuthSession(session: AuthSession) {
  localStorage.setItem("archer_access_token", session.accessToken);
  localStorage.setItem("archer_refresh_token", session.refreshToken);
  localStorage.setItem("archer_user", JSON.stringify(session.user));
  window.dispatchEvent(new Event("archer-auth-changed"));
}

export function clearAuthSession() {
  localStorage.removeItem("archer_access_token");
  localStorage.removeItem("archer_refresh_token");
  localStorage.removeItem("archer_user");
  window.dispatchEvent(new Event("archer-auth-changed"));
}

export async function signOut() {
  const refreshToken = localStorage.getItem("archer_refresh_token");
  try {
    if (refreshToken) await api<void>("/api/v1/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken }) });
  } finally {
    clearAuthSession();
  }
}

export function getCurrentUser() {
  return api<ApiEnvelope<{ user: AuthUser }>>("/api/v1/auth/me");
}

// ---------------------------------------------------------------------------
// Domain API helpers
// ---------------------------------------------------------------------------

export const getCategories = () => api<ApiEnvelope<Category[]>>("/api/v1/reference/categories");

function normalizeLegacyCurrency(project: Project): Project {
  const currency = (project as unknown as { currency: string }).currency;
  return currency === "USD" ? project : { ...project, currency: "JPY" };
}

export async function getProjects(query: string) {
  const result = await api<PagedProjects>(`/api/v1/projects${query}`);
  return { ...result, data: result.data.map(normalizeLegacyCurrency) };
}

export async function getProject(id: string) {
  const result = await api<ApiEnvelope<Project>>(`/api/v1/projects/${id}`);
  return { ...result, data: normalizeLegacyCurrency(result.data) };
}

export function getSavedProjects() {
  return api<ApiEnvelope<Array<Project & { savedAt: string }>>>("/api/v1/projects/saved").then((result) => ({ ...result, data: result.data.map((project) => ({ ...normalizeLegacyCurrency(project), savedAt: project.savedAt })) }));
}

export function saveProject(id: string) {
  return api(`/api/v1/projects/${id}/save`, { method: "POST" });
}

export function unsaveProject(id: string) {
  return api<void>(`/api/v1/projects/${id}/save`, { method: "DELETE" });
}

export function getMyProposals() {
  return api<ApiEnvelope<Proposal[]>>("/api/v1/proposals");
}

export function submitProposal(projectId: string, input: SubmitProposalInput) {
  return api<ApiEnvelope<Proposal>>(`/api/v1/proposals/projects/${projectId}`, { method: "POST", body: JSON.stringify(input) });
}

export function deleteAccount(password?: string) {
  return api<void>("/api/v1/auth/me", {
    method: "DELETE",
    body: password ? JSON.stringify({ password }) : undefined,
  });
}

export { API_URL };

