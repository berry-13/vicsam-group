import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import { FilesPage } from "./pages/FilesPage";
import { SaveDataPage } from "./pages/SaveDataPage";
import { StatsPage } from "./pages/StatsPage";
import { SettingsPage } from "./pages/SettingsPage";
import UserManagementPage from "./pages/UserManagementPage";
import "./index.css";

/**
 * The root component of the application, providing global context and routing.
 *
 * Wraps the app with toast notification and authentication providers, and defines all client-side routes, including protected and public pages.
 *
 * @returns The application's component tree with context providers and route configuration.
 */
function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="files" element={<FilesPage />} />
                <Route path="save-data" element={<SaveDataPage />} />
                <Route path="stats" element={<StatsPage />} />
                <Route path="users" element={<UserManagementPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="user-management" element={<UserManagementPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
