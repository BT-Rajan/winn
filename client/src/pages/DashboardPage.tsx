import { useNavigate } from "react-router-dom";
import { AppShell } from "../design-system/AppShell";
import { Card } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { useAuth } from "../auth/AuthContext";

/**
 * Pass 1 shipped an empty, calm dashboard. Pass 2 gives customers their
 * real entry point (their projects) here — builder/admin content still
 * arrives in later passes, so this stays a placeholder for those roles.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCustomer = user?.roles.includes("customer");

  return (
    <AppShell>
      <h1 style={{ fontSize: "var(--font-size-2xl)", marginBottom: "var(--space-2)" }}>
        Welcome{user ? `, ${user.fullName.split(" ")[0]}` : ""}
      </h1>
      <p style={{ color: "var(--color-ink-500)", marginBottom: "var(--space-6)" }}>
        {isCustomer
          ? "Submit a project to start receiving builder proposals."
          : "Your opportunities will appear here once matching is live."}
      </p>
      {isCustomer ? (
        <Button onClick={() => navigate("/projects")}>Go to your projects</Button>
      ) : (
        <Card>
          <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>
            Builder workflows arrive in the next development pass.
          </p>
        </Card>
      )}
    </AppShell>
  );
}
