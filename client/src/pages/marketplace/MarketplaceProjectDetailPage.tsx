import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../design-system/AppShell";
import { Card } from "../../design-system/Card";
import { Input } from "../../design-system/Input";
import { Textarea } from "../../design-system/Textarea";
import { Button } from "../../design-system/Button";
import { ApiError } from "../../lib/apiClient";
import {
  downloadMarketplaceDocument,
  getMarketplaceProject,
  type MarketplaceDocument,
  type MarketplaceProjectDetail,
  type MyProposalSummary,
} from "../../lib/marketplace";
import { submitMyProposal, withdrawMyProposal, type DurationUnit } from "../../lib/proposals";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const PROPOSAL_STATUS_COPY: Record<MyProposalSummary["status"], string> = {
  submitted: "Submitted — waiting on the customer",
  withdrawn: "Withdrawn",
  awarded: "Awarded to you 🎉",
  rejected: "Not selected",
};

export function MarketplaceProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<MarketplaceProjectDetail | null>(null);
  const [documents, setDocuments] = useState<MarketplaceDocument[]>([]);
  const [myProposal, setMyProposal] = useState<MyProposalSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  function load() {
    if (!id) return;
    getMarketplaceProject(id)
      .then((res) => {
        setProject(res.project);
        setDocuments(res.documents);
        setMyProposal(res.myProposal);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this project."));
  }

  useEffect(load, [id]);

  async function handleDownload(doc: MarketplaceDocument) {
    if (!id) return;
    setDownloadingId(doc.id);
    try {
      await downloadMarketplaceDocument(id, doc);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't download that document.");
    } finally {
      setDownloadingId(null);
    }
  }

  if (error) {
    return (
      <AppShell>
        <Card>
          <p style={{ color: "var(--color-danger)" }}>{error}</p>
          <Button
            variant="secondary"
            onClick={() => navigate("/marketplace")}
            style={{ marginTop: "var(--space-4)" }}
          >
            Back to marketplace
          </Button>
        </Card>
      </AppShell>
    );
  }

  if (!project || !id) {
    return (
      <AppShell>
        <p style={{ color: "var(--color-ink-500)" }}>Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <button
          onClick={() => navigate("/marketplace")}
          style={{
            border: "none",
            background: "none",
            color: "var(--color-ink-500)",
            fontSize: "var(--font-size-sm)",
            cursor: "pointer",
            padding: 0,
            marginBottom: "var(--space-3)",
          }}
        >
          ← Marketplace
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "var(--font-size-2xl)" }}>
            {[project.projectType, project.location].filter(Boolean).join(" · ") || project.title}
          </h1>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "var(--font-size-xl)",
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
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <Card>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-ink-700)" }}>
            {project.matchExplanation}
          </p>
        </Card>

        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <Row label="Project type" value={project.projectType} />
            <Row label="Location" value={project.location} />
            <Row
              label="Size"
              value={project.sizeValue ? `${project.sizeValue} ${project.sizeUnit ?? ""}`.trim() : null}
            />
            <Row
              label="Budget"
              value={
                project.budgetMin
                  ? `${project.budgetMin}${project.budgetMax ? ` – ${project.budgetMax}` : ""}`
                  : null
              }
            />
            <Row label="Closing date" value={project.closingDate} />
            <Row label="Requirements" value={project.requirements} />
          </div>
        </Card>

        <Card>
          <h2 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-4)" }}>Documents</h2>
          {documents.length === 0 ? (
            <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>
              No documents were attached to this project.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-3)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <span style={{ fontSize: "var(--font-size-sm)" }}>
                    {doc.originalName}{" "}
                    <span style={{ color: "var(--color-ink-300)" }}>({formatBytes(doc.sizeBytes)})</span>
                  </span>
                  <Button
                    variant="secondary"
                    disabled={downloadingId === doc.id}
                    onClick={() => handleDownload(doc)}
                  >
                    {downloadingId === doc.id ? "Downloading…" : "Download"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <ProposalSection projectId={id} myProposal={myProposal} onChanged={load} />
      </div>
    </AppShell>
  );
}

function ProposalSection({
  projectId,
  myProposal,
  onChanged,
}: {
  projectId: string;
  myProposal: MyProposalSummary | null;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(myProposal ? myProposal.price : "");
  const [durationValue, setDurationValue] = useState(myProposal ? String(myProposal.durationValue) : "");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(myProposal?.durationUnit ?? "months");
  const [scope, setScope] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [warranty, setWarranty] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasActiveBid = myProposal && (myProposal.status === "submitted" || myProposal.status === "awarded");
  const canEdit = !myProposal || myProposal.status === "submitted" || myProposal.status === "withdrawn";

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await submitMyProposal(projectId, {
        price: Number(price),
        durationValue: Number(durationValue),
        durationUnit,
        scope,
        exclusions: exclusions || null,
        paymentTerms: paymentTerms || null,
        warranty: warranty || null,
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit your proposal.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleWithdraw() {
    setSubmitting(true);
    setError(null);
    try {
      await withdrawMyProposal(projectId);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't withdraw your proposal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <h2 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-2)" }}>Your proposal</h2>

      {error && (
        <div
          style={{
            backgroundColor: "var(--color-danger-bg)",
            color: "var(--color-danger)",
            fontSize: "var(--font-size-sm)",
            padding: "var(--space-3)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "var(--space-4)",
          }}
        >
          {error}
        </div>
      )}

      {myProposal && !editing ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <Row label="Status" value={PROPOSAL_STATUS_COPY[myProposal.status]} />
          <Row label="Price" value={myProposal.price} />
          <Row label="Duration" value={`${myProposal.durationValue} ${myProposal.durationUnit}`} />
          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            {canEdit && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                {myProposal.status === "withdrawn" ? "Resubmit" : "Edit proposal"}
              </Button>
            )}
            {hasActiveBid && myProposal.status === "submitted" && (
              <Button variant="ghost" onClick={handleWithdraw} disabled={submitting}>
                {submitting ? "Withdrawing…" : "Withdraw"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", gap: "var(--space-4)" }}>
            <div style={{ flex: 1 }}>
              <Input label="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                label="Duration"
                type="number"
                value={durationValue}
                onChange={(e) => setDurationValue(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-1)",
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-ink-700)",
                  fontWeight: 500,
                }}
              >
                Unit
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border-strong)",
                    backgroundColor: "var(--color-surface)",
                    fontSize: "var(--font-size-md)",
                  }}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </label>
            </div>
          </div>
          <Textarea
            label="Scope of work"
            placeholder="What's included in this price?"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          />
          <Textarea
            label="Exclusions (optional)"
            placeholder="What's not included?"
            value={exclusions}
            onChange={(e) => setExclusions(e.target.value)}
          />
          <Textarea
            label="Payment terms (optional)"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
          />
          <Textarea label="Warranty (optional)" value={warranty} onChange={(e) => setWarranty(e.target.value)} />
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Button onClick={handleSubmit} disabled={submitting || !price || !durationValue || !scope}>
              {submitting ? "Submitting…" : "Submit proposal"}
            </Button>
            {myProposal && (
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)" }}>
      <span style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>{label}</span>
      <span style={{ fontSize: "var(--font-size-sm)", textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}
