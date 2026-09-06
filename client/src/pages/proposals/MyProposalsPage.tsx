import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../design-system/AppShell";
import { Card } from "../../design-system/Card";
import { ApiError } from "../../lib/apiClient";
import { listMyProposals, type MyProposal } from "../../lib/proposals";

const STATUS_LABEL: Record<MyProposal["status"], string> = {
  submitted: "Submitted — waiting on the customer",
  withdrawn: "Withdrawn",
  awarded: "Awarded 🎉",
  rejected: "Not selected",
};

const STATUS_COLOR: Record<MyProposal["status"], string> = {
  submitted: "var(--color-warning)",
  withdrawn: "var(--color-ink-300)",
  awarded: "var(--color-success)",
  rejected: "var(--color-danger)",
};

export function MyProposalsPage() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<MyProposal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyProposals()
      .then((res) => setProposals(res.proposals))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your proposals."));
  }, []);

  return (
    <AppShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1 style={{ fontSize: "var(--font-size-2xl)", marginBottom: "var(--space-1)" }}>Your proposals</h1>
        <p style={{ color: "var(--color-ink-500)" }}>Every bid you've submitted, across all projects.</p>
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

      {proposals === null ? (
        <p style={{ color: "var(--color-ink-500)" }}>Loading…</p>
      ) : proposals.length === 0 ? (
        <Card>
          <p style={{ color: "var(--color-ink-500)" }}>
            You haven't submitted any proposals yet — browse the marketplace to find a project.
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {proposals.map((proposal) => (
            <Card
              key={proposal.id}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/marketplace/${proposal.projectId}`)}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ marginBottom: "var(--space-1)" }}>
                    {[proposal.projectType, proposal.projectLocation].filter(Boolean).join(" · ") ||
                      proposal.projectTitle}
                  </h3>
                  <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>
                    {proposal.price} · {proposal.durationValue} {proposal.durationUnit}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    color: STATUS_COLOR[proposal.status],
                    whiteSpace: "nowrap",
                  }}
                >
                  {STATUS_LABEL[proposal.status]}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
