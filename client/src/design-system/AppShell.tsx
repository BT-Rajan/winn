import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { Button } from "./Button";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();

  return (
    <div style={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-4) var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
          backgroundColor: "var(--color-surface)",
        }}
      >
        <span style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, letterSpacing: "-0.02em" }}>
          Winn
        </span>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-ink-500)" }}>
              {user.fullName}
            </span>
            <Button variant="ghost" onClick={logout}>
              Sign out
            </Button>
          </div>
        )}
      </header>
      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 960,
          margin: "0 auto",
          padding: "var(--space-7) var(--space-6)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
