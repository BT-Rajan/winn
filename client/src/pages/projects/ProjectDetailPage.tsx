import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../../design-system/AppShell";
import { Card } from "../../design-system/Card";
import { Input } from "../../design-system/Input";
import { Textarea } from "../../design-system/Textarea";
import { Button } from "../../design-system/Button";
import { ApiError } from "../../lib/apiClient";
import {
  getProject,
  removeProjectDocument,
  submitProject,
  updateProject,
  uploadProjectDocument,
  type Project,
  type ProjectDocument,
} from "../../lib/projects";
import { awardProposal, listProjectProposals, type ProposalComparison } from "../../lib/proposals";

const STATUS_LABEL: Record<Project["status"], string> = {
  draft: "Draft",
  submitted: "Submitted — under review",
  verified: "Verified — open for proposals",
  rejected: "Needs changes",
  awarded: "Awarded",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  function load() {
    if (!id) return;
    getProject(id)
      .then((res) => {
        setProject(res.project);
        setDocuments(res.documents);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Couldn't load this project."));
  }

  // Autosave: one field at a time, on blur. Never a separate "Save" button
  // for the details form — the customer just moves on to the next field.
  async function saveField(field: string, value: string, parse: (raw: string) => unknown = (raw) => raw) {
    if (!project) return;
    setSaveError(null);
    try {
      const { project: updated } = await updateProject(project.id, { [field]: parse(value) } as never);
      setProject(updated);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't save that change.");
    }
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !project) return;

    setUploading(true);
    setSaveError(null);
    try {
      const res = await uploadProjectDocument(project.id, file);
      setProject(res.project);
      setDocuments(res.documents);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't upload that file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveDocument(documentId: string) {
    if (!project) return;
    try {
      await removeProjectDocument(project.id, documentId);
      setDocuments((docs) => docs.filter((doc) => doc.id !== documentId));
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't remove that document.");
    }
  }

  async function handleSubmit() {
    if (!project) return;
    setSubmitting(true);
    setSaveError(null);
    setMissingFields(null);
    try {
      const { project: updated } = await submitProject(project.id);
      setProject(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
        const details = err.details as { missing?: string[] } | undefined;
        if (details?.missing) setMissingFields(details.missing);
      } else {
        setSaveError("Couldn't submit this project.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <AppShell>
        <Card>
          <p style={{ color: "var(--color-danger)" }}>{loadError}</p>
          <Button variant="secondary" onClick={() => navigate("/projects")} style={{ marginTop: "var(--space-4)" }}>
            Back to projects
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

  const isDraft = project.status === "draft";

  return (
    <AppShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <button
          onClick={() => navigate("/projects")}
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
          ← All projects
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "var(--font-size-2xl)" }}>{project.title || "Untitled project"}</h1>
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-ink-500)" }}>
            {STATUS_LABEL[project.status]}
          </span>
        </div>
      </div>

      {saveError && (
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
          {saveError}
          {missingFields && missingFields.length > 0 && (
            <ul style={{ margin: "var(--space-2) 0 0", paddingLeft: "var(--space-5)" }}>
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!isDraft ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
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
              <Row label="Requirements" value={project.requirements} />
              <Row label="Closing date" value={project.closingDate} />
              <Row label="Documents" value={`${documents.length} attached`} />
            </div>
          </Card>

          {(project.status === "verified" || project.status === "awarded") && (
            <ProposalsComparison projectId={project.id} projectStatus={project.status} onAwarded={load} />
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <Card>
            <h2 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-4)" }}>Project basics</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <Input
                label="Project name"
                defaultValue={project.title}
                onBlur={(e) => saveField("title", e.target.value)}
              />
              <Input
                label="Project type"
                placeholder="e.g. Villa, Renovation, Commercial fit-out"
                defaultValue={project.projectType ?? ""}
                onBlur={(e) => saveField("projectType", e.target.value)}
              />
              <Input
                label="Location"
                defaultValue={project.location ?? ""}
                onBlur={(e) => saveField("location", e.target.value)}
              />
              <div style={{ display: "flex", gap: "var(--space-4)" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Size"
                    type="number"
                    defaultValue={project.sizeValue ?? ""}
                    onBlur={(e) => saveField("sizeValue", e.target.value, (raw) => (raw === "" ? null : Number(raw)))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Unit"
                    placeholder="sqm"
                    defaultValue={project.sizeUnit ?? ""}
                    onBlur={(e) => saveField("sizeUnit", e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-4)" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Budget — minimum"
                    type="number"
                    defaultValue={project.budgetMin ?? ""}
                    onBlur={(e) => saveField("budgetMin", e.target.value, (raw) => (raw === "" ? null : Number(raw)))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Budget — maximum (optional)"
                    type="number"
                    defaultValue={project.budgetMax ?? ""}
                    onBlur={(e) => saveField("budgetMax", e.target.value, (raw) => (raw === "" ? null : Number(raw)))}
                  />
                </div>
              </div>
              <Textarea
                label="Requirements"
                placeholder="What does the builder need to know?"
                defaultValue={project.requirements ?? ""}
                onBlur={(e) => saveField("requirements", e.target.value)}
              />
              <Input
                label="Closing date (optional)"
                type="date"
                defaultValue={project.closingDate ?? ""}
                onBlur={(e) => saveField("closingDate", e.target.value, (raw) => (raw === "" ? null : raw))}
              />
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-2)" }}>Documents</h2>
            <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-4)" }}>
              Drawings, specifications, or anything a builder needs to quote accurately.
            </p>

            {documents.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
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
                    <Button variant="ghost" onClick={() => handleRemoveDocument(doc.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)" }}>
              <input type="file" onChange={handleFileSelected} disabled={uploading} style={{ display: "none" }} />
              <span
                onClick={(e) => (e.currentTarget.previousSibling as HTMLInputElement)?.click?.()}
                style={{ display: "inline-block" }}
              >
                <Button variant="secondary" disabled={uploading} type="button">
                  {uploading ? "Uploading…" : "Add a document"}
                </Button>
              </span>
            </label>
          </Card>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit project"}
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ProposalsComparison({
  projectId,
  projectStatus,
  onAwarded,
}: {
  projectId: string;
  projectStatus: Project["status"];
  onAwarded: () => void;
}) {
  const [proposals, setProposals] = useState<ProposalComparison[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [awardingId, setAwardingId] = useState<string | null>(null);

  useEffect(() => {
    listProjectProposals(projectId)
      .then((res) => setProposals(res.proposals))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load proposals."));
  }, [projectId]);

  async function handleAward(proposalId: string) {
    setAwardingId(proposalId);
    setError(null);
    try {
      await awardProposal(projectId, proposalId);
      onAwarded();
      const res = await listProjectProposals(projectId);
      setProposals(res.proposals);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't award this proposal.");
    } finally {
      setAwardingId(null);
    }
  }

  return (
    <Card>
      <h2 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-2)" }}>Proposals</h2>
      <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-4)" }}>
        {projectStatus === "awarded"
          ? "You've selected a builder for this project."
          : "Compare builders side by side. Selecting one awards the project and closes it to further proposals."}
      </p>

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

      {proposals === null ? (
        <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>Loading…</p>
      ) : proposals.length === 0 ? (
        <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>
          No proposals yet. Verified builders can see this project and submit a bid.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {proposals.map((proposal) => (
            <div
              key={proposal.proposalId}
              style={{
                border: `1px solid ${proposal.status === "awarded" ? "var(--color-success)" : "var(--color-border)"}`,
                borderRadius: "var(--radius-sm)",
                padding: "var(--space-4)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ marginBottom: "var(--space-1)" }}>{proposal.companyName}</h3>
                  {proposal.yearsExperience != null && (
                    <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>
                      {proposal.yearsExperience} years of experience
                    </p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 700 }}>{proposal.price}</div>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-ink-500)" }}>
                    {proposal.durationValue} {proposal.durationUnit}
                  </div>
                </div>
              </div>

              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-ink-700)", margin: "var(--space-3) 0" }}>
                {proposal.matchScore}% match — {proposal.matchExplanation}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <Row label="Scope" value={proposal.scope} />
                <Row label="Exclusions" value={proposal.exclusions} />
                <Row label="Payment terms" value={proposal.paymentTerms} />
                <Row label="Warranty" value={proposal.warranty} />
              </div>

              <div style={{ marginTop: "var(--space-4)" }}>
                {proposal.status === "awarded" ? (
                  <span style={{ color: "var(--color-success)", fontWeight: 600, fontSize: "var(--font-size-sm)" }}>
                    Awarded
                  </span>
                ) : projectStatus === "verified" ? (
                  <Button
                    onClick={() => handleAward(proposal.proposalId)}
                    disabled={awardingId === proposal.proposalId}
                  >
                    {awardingId === proposal.proposalId ? "Awarding…" : "Award this builder"}
                  </Button>
                ) : (
                  <span style={{ color: "var(--color-ink-300)", fontSize: "var(--font-size-sm)" }}>
                    Not selected
                  </span>
                )}
              </div>
            </div>
          ))}
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
