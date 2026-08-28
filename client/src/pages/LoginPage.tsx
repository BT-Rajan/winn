import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../design-system/Card";
import { Input } from "../design-system/Input";
import { Button } from "../design-system/Button";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../lib/apiClient";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ width: 380 }}>
        <h1 style={{ fontSize: "var(--font-size-xl)", marginBottom: "var(--space-1)" }}>Sign in</h1>
        <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-5)" }}>
          Welcome back to Winn.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <div
              style={{
                backgroundColor: "var(--color-danger-bg)",
                color: "var(--color-danger)",
                fontSize: "var(--font-size-sm)",
                padding: "var(--space-3)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {error}
            </div>
          )}
          <Button type="submit" fullWidth disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p style={{ marginTop: "var(--space-5)", fontSize: "var(--font-size-sm)", color: "var(--color-ink-500)" }}>
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </Card>
    </div>
  );
}
