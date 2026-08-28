import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../design-system/Card";
import { Input } from "../design-system/Input";
import { Button } from "../design-system/Button";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../lib/apiClient";

type RoleChoice = "customer" | "builder";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RoleChoice>("customer");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password, fullName, role });
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
        <h1 style={{ fontSize: "var(--font-size-xl)", marginBottom: "var(--space-1)" }}>Create an account</h1>
        <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-5)" }}>
          Set up your Winn account.
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Input
            label="Full name"
            name="fullName"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
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
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label style={{ fontSize: "var(--font-size-sm)", color: "var(--color-ink-700)", fontWeight: 500 }}>
              I am a…
            </label>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                type="button"
                variant={role === "customer" ? "primary" : "secondary"}
                fullWidth
                onClick={() => setRole("customer")}
              >
                Customer
              </Button>
              <Button
                type="button"
                variant={role === "builder" ? "primary" : "secondary"}
                fullWidth
                onClick={() => setRole("builder")}
              >
                Builder
              </Button>
            </div>
          </div>
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
            {submitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
        <p style={{ marginTop: "var(--space-5)", fontSize: "var(--font-size-sm)", color: "var(--color-ink-500)" }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
