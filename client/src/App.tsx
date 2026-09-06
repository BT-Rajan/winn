import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProjectsListPage } from "./pages/projects/ProjectsListPage";
import { ProjectDetailPage } from "./pages/projects/ProjectDetailPage";
import { BuilderProfilePage } from "./pages/builder/BuilderProfilePage";
import { MarketplaceListPage } from "./pages/marketplace/MarketplaceListPage";
import { MarketplaceProjectDetailPage } from "./pages/marketplace/MarketplaceProjectDetailPage";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute roles={["customer"]}>
                <ProjectsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute roles={["customer"]}>
                <ProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/builder/profile"
            element={
              <ProtectedRoute roles={["builder"]}>
                <BuilderProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace"
            element={
              <ProtectedRoute roles={["builder"]}>
                <MarketplaceListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/marketplace/:id"
            element={
              <ProtectedRoute roles={["builder"]}>
                <MarketplaceProjectDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
