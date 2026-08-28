import { AppShell } from "../design-system/AppShell";
import { Card } from "../design-system/Card";
import { useAuth } from "../auth/AuthContext";

/**
 * Pass 1 deliberately ships an empty, calm dashboard — no placeholder
 * metrics or decorative widgets. Passes 2–4 add real content here
 * per role (project status, matching projects, marketplace activity).
 */
export function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      <h1 style={{ fontSize: "var(--font-size-2xl)", marginBottom: "var(--space-2)" }}>
        Welcome{user ? `, ${user.fullName.split(" ")[0]}` : ""}
      </h1>
      <p style={{ color: "var(--color-ink-500)", marginBottom: "var(--space-6)" }}>
        {user?.roles.includes("builder")
          ? "Your opportunities will appear here once matching is live."
          : "Your projects will appear here once you create one."}
      </p>
      <Card>
        <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>
          Foundation complete — account, authentication, and roles are live. Project and builder
          workflows arrive in the next development passes.
        </p>
      </Card>
    </AppShell>
  );
}
