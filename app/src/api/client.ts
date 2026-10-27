import type { ApiEnvelope, Category, PagedProjects, Project } from "./types";

export type AuthUser = { id: string; email: string; role: "CLIENT" | "FREELANCER" | "ADMIN"; status: string; clientProfile?: unknown; freelancerProfile?: unknown };
export type AuthSession = { user: AuthUser; accessToken: string; refreshToken: string };

const configuredApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (configuredApiUrl || "").replace(/\/$/, "");

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const accessToken = typeof window !== "undefined" ? localStorage.getItem("archer_access_token") : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

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
export { API_URL };
