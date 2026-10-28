import { useAuth } from "./AuthProvider";
import type { AuthUser } from "../api/client";

/**
 * Reads the signed-in account from AuthProvider context.
 *
 * This is a thin wrapper that preserves the existing call-site API
 * (returns AuthUser | null) while delegating to the centralised provider.
 */
export function useAccount(): AuthUser | null {
  const { user } = useAuth();
  return user;
}
