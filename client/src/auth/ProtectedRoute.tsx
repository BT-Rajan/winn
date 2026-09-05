import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Restrict to specific roles, e.g. Pass 2's customer-only project
   *  workspace. Omit for anything shared across every signed-in user. */
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>Loading…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.some((role) => user.roles.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
