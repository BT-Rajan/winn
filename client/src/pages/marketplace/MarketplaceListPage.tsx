import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../design-system/AppShell";
import { Card } from "../../design-system/Card";
import { Button } from "../../design-system/Button";
import { ApiError } from "../../lib/apiClient";
import { listMarketplaceProjects, type MarketplaceProjectCard } from "../../lib/marketplace";

function formatBudget(min: string | null, max: string | null): string | null {
  if (!min) return null;
  return max && max !== min ? `${min} – ${max}` : min;
}

function formatSize(value: string | null, unit: string | null): string | null {
  if (!value) return null;
  return unit ? `${value} ${unit}` : value;
}

export function MarketplaceListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<MarketplaceProjectCard[] | null>(null);
  const [notVerified, setNotVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMarketplaceProjects()
      .then((res) => setProjects(res.projects))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setNotVerified(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Couldn't load the marketplace.");
        }
      });
  }, []);

  if (notVerified) {
    return (
      <AppShell>
        <Card>
          <h2 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-2)" }}>
            Verification required
          </h2>
          <p style={{ color: "var(--color-ink-500)", marginBottom: "var(--space-4)" }}>
            Your company profile must be verified before you can view marketplace projects.
          </p>
          <Button onClick={() => navigate("/builder/profile")}>Go to your company profile</Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--font-size-2xl)", marginBottom: "var(--space-1)" }}>Marketplace</h1>
        <p style={{ color: "var(--color-ink-500)" }}>Verified projects looking for a builder.</p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "var(--color-danger-bg)",
            color: "var(--color-danger)",
            fontSize: "var(--font-size-sm)",
            padding: "var(--space-3)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--space-5)",
          }}
        >
          {error}
        </div>
      )}

      {projects === null ? (
        <p style={{ color: "var(--color-ink-500)" }}>Loading…</p>
      ) : projects.length === 0 ? (
        <Card>
          <p style={{ color: "var(--color-ink-500)" }}>
            No verified projects are open right now. Check back soon.
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {projects.map((project) => (
            <Card
              key={project.id}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/marketplace/${project.id}`)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ marginBottom: "var(--space-1)" }}>
                    {[project.projectType, project.location].filter(Boolean).join(" · ") || "Project"}
                  </h3>
                  {project.requirementsSummary && (
                    <p
                      style={{
                        color: "var(--color-ink-500)",
                        fontSize: "var(--font-size-sm)",
                        marginBottom: "var(--space-2)",
                        maxWidth: "560px",
                      }}
                    >
                      {project.requirementsSummary}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--font-size-sm)" }}>
                    {formatSize(project.sizeValue, project.sizeUnit) && (
                      <span style={{ color: "var(--color-ink-500)" }}>
                        {formatSize(project.sizeValue, project.sizeUnit)}
                      </span>
                    )}
                    {formatBudget(project.budgetMin, project.budgetMax) && (
                      <span style={{ color: "var(--color-ink-500)" }}>
                        {formatBudget(project.budgetMin, project.budgetMax)}
                      </span>
                    )}
                    {project.closingDate && (
                      <span style={{ color: "var(--color-ink-500)" }}>Closes {project.closingDate}</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <div
                    style={{
                      fontSize: "var(--font-size-lg)",
                      fontWeight: 700,
                      color:
                        project.matchScore >= 70
                          ? "var(--color-success)"
                          : project.matchScore >= 40
                            ? "var(--color-warning)"
                            : "var(--color-ink-500)",
                    }}
                  >
                    {project.matchScore}% Match
                  </div>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-ink-300)" }}>
                    {project.readiness}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
