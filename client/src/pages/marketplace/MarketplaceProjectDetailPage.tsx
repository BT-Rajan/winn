import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../design-system/AppShell";
import { Card } from "../../design-system/Card";
import { Button } from "../../design-system/Button";
import { ApiError } from "../../lib/apiClient";
import {
  downloadMarketplaceDocument,
  getMarketplaceProject,
  type MarketplaceDocument,
  type MarketplaceProjectDetail,
} from "../../lib/marketplace";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MarketplaceProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<MarketplaceProjectDetail | null>(null);
  const [documents, setDocuments] = useState<MarketplaceDocument[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getMarketplaceProject(id)
      .then((res) => {
        setProject(res.project);
        setDocuments(res.documents);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load this project."));
  }, [id]);

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

  if (!project) {
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

        <Card>
          <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>
            Submitting a proposal arrives in a later development pass.
          </p>
        </Card>
      </div>
    </AppShell>
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
