import { useNavigate } from "react-router-dom";
import { AppShell } from "../design-system/AppShell";
import { Card } from "../design-system/Card";
import { Button } from "../design-system/Button";
import { useAuth } from "../auth/AuthContext";

/**
 * Pass 1 shipped an empty, calm dashboard. Pass 2 gave customers their
 * entry point (their projects). Pass 3 gives builders theirs (their
 * company profile) — admin content still arrives in a later pass.
 */
export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCustomer = user?.roles.includes("customer");
  const isBuilder = user?.roles.includes("builder");

  return (
    <AppShell>
      <h1 style={{ fontSize: "var(--font-size-2xl)", marginBottom: "var(--space-2)" }}>
        Welcome{user ? `, ${user.fullName.split(" ")[0]}` : ""}
      </h1>
      <p style={{ color: "var(--color-ink-500)", marginBottom: "var(--space-6)" }}>
        {isCustomer && "Submit a project to start receiving builder proposals."}
        {isBuilder && "Complete your company profile to get verified."}
        {!isCustomer && !isBuilder && "Your workspace will appear here once it's ready."}
      </p>
      {isCustomer && <Button onClick={() => navigate("/projects")}>Go to your projects</Button>}
      {isBuilder && (
        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <Button onClick={() => navigate("/builder/profile")}>Go to your company profile</Button>
          <Button variant="secondary" onClick={() => navigate("/marketplace")}>
            Browse marketplace
          </Button>
        </div>
      )}
      {!isCustomer && !isBuilder && (
        <Card>
          <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>
            Admin workflows arrive in a later development pass.
          </p>
        </Card>
      )}
    </AppShell>
  );
}
