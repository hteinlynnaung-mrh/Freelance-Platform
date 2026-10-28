import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { useI18n } from "../i18n/I18nProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** If provided, only these roles may access the route. */
  roles?: Array<"CLIENT" | "FREELANCER" | "ADMIN">;
}

/**
 * Wraps a route element. Behaviour:
 * 1. While the auth provider is still restoring the session → spinner.
 * 2. Not authenticated → redirect to /login?next=<current-path>.
 * 3. Authenticated but wrong role → redirect to the role-appropriate landing.
 * 4. OK → render children.
 */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  // Still checking stored tokens / calling /auth/me
  if (isLoading) {
    return (
      <div className="protected-loading">
        <span className="protected-spinner" />
        <p>{t("loading")}</p>
      </div>
    );
  }

  // Not signed in → send to login and remember where they wanted to go
  if (!isAuthenticated || !user) {
    const next = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  // Signed in but wrong role
  if (roles && !roles.includes(user.role)) {
    // Redirect to a sensible default for the user's actual role
    const fallback = roleHome(user.role);
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}

/** Return the "home" route for a given role. */
function roleHome(role: string): string {
  switch (role) {
    case "CLIENT":
      return "/dashboard";
    case "FREELANCER":
      return "/projects";
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
}
