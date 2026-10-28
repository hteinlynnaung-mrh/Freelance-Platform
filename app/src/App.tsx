import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppShell } from "./components/AppShell";
import { AccountSettingsPage } from "./pages/AccountSettingsPage";
import { BilingualHomePage } from "./pages/BilingualHomePage";
import { BilingualLoginPage } from "./pages/BilingualLoginPage";
import { BilingualProjectDetailPage } from "./pages/BilingualProjectDetailPage";
import { LandingPage } from "./pages/LandingPage";
import { MyApplicationsPage } from "./pages/MyApplicationsPage";
import { RegistrationPage } from "./pages/RegistrationPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/projects" element={<BilingualHomePage />} />
            <Route path="/projects/:id" element={<BilingualProjectDetailPage />} />
            <Route path="/login" element={<BilingualLoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />

            {/* Protected routes — freelancer only */}
            <Route
              path="/account/applications"
              element={
                <ProtectedRoute roles={["FREELANCER"]}>
                  <MyApplicationsPage />
                </ProtectedRoute>
              }
            />

            {/* Protected routes — any authenticated user */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account/settings"
              element={
                <ProtectedRoute>
                  <AccountSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/account" element={<Navigate to="/account/settings" replace />} />


            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
}

/**
 * Temporary placeholder that redirects each role to its relevant page.
 * Will be replaced with real dashboard pages in a future iteration.
 */
function DashboardRedirect() {
  return (
    <div className="detail-state">
      <h2>Dashboard</h2>
      <p style={{ color: "var(--muted)", marginTop: 8, fontSize: 13 }}>
        Your personalised dashboard is coming soon.
      </p>
    </div>
  );
}
