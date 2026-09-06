import { useEffect, useState, type ChangeEvent } from "react";
import { AppShell } from "../../design-system/AppShell";
import { Card } from "../../design-system/Card";
import { Input } from "../../design-system/Input";
import { Textarea } from "../../design-system/Textarea";
import { Button } from "../../design-system/Button";
import { ApiError } from "../../lib/apiClient";
import {
  getMyBuilderProfile,
  removeBuilderDocument,
  submitBuilderProfile,
  updateMyBuilderProfile,
  uploadBuilderDocument,
  type BuilderDocument,
  type BuilderProfile,
} from "../../lib/builders";

const STATUS_COPY: Record<BuilderProfile["verificationStatus"], { label: string; helper: string }> = {
  unverified: {
    label: "Not submitted",
    helper: "Complete your profile and submit it for verification.",
  },
  pending: {
    label: "Under review",
    helper: "We're verifying your company. You'll be notified once this is complete.",
  },
  verified: {
    label: "Verified",
    helper: "Subscriptions and matching projects arrive in a later release.",
  },
  rejected: {
    label: "Changes requested",
    helper: "Update your profile below and resubmit for verification.",
  },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toListText(values: string[]): string {
  return values.join(", ");
}

function parseListText(raw: string): string[] {
  return raw
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function BuilderProfilePage() {
  const [profile, setProfile] = useState<BuilderProfile | null>(null);
  const [documents, setDocuments] = useState<BuilderDocument[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getMyBuilderProfile()
      .then((res) => {
        setProfile(res.profile);
        setDocuments(res.documents);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Couldn't load your profile."));
  }, []);

  async function saveField(field: string, value: unknown) {
    setSaveError(null);
    try {
      const { profile: updated } = await updateMyBuilderProfile({ [field]: value } as never);
      setProfile(updated);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't save that change.");
    }
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setSaveError(null);
    try {
      const res = await uploadBuilderDocument(file);
      setProfile(res.profile);
      setDocuments(res.documents);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't upload that file.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveDocument(documentId: string) {
    try {
      await removeBuilderDocument(documentId);
      setDocuments((docs) => docs.filter((doc) => doc.id !== documentId));
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Couldn't remove that document.");
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSaveError(null);
    setMissingFields(null);
    try {
      const { profile: updated } = await submitBuilderProfile();
      setProfile(updated);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message);
        const details = err.details as { missing?: string[] } | undefined;
        if (details?.missing) setMissingFields(details.missing);
      } else {
        setSaveError("Couldn't submit your profile.");
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
        </Card>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <p style={{ color: "var(--color-ink-500)" }}>Loading…</p>
      </AppShell>
    );
  }

  const isEditable = profile.verificationStatus === "unverified" || profile.verificationStatus === "rejected";
  const statusCopy = STATUS_COPY[profile.verificationStatus];

  return (
    <AppShell>
      <div style={{ marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "var(--font-size-2xl)" }}>Company profile</h1>
          <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, color: "var(--color-ink-500)" }}>
            {statusCopy.label}
          </span>
        </div>
        <p style={{ color: "var(--color-ink-500)", marginTop: "var(--space-1)" }}>{statusCopy.helper}</p>
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

      {!isEditable ? (
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <Row label="Company name" value={profile.companyName} />
            <Row label="Description" value={profile.description} />
            <Row label="Years of experience" value={profile.yearsExperience?.toString()} />
            <Row label="Service locations" value={profile.serviceLocations.join(", ")} />
            <Row label="Specialties" value={profile.specialties.join(", ")} />
            <Row label="Documents" value={`${documents.length} attached`} />
          </div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <Card>
            <h2 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-4)" }}>About your company</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <Input
                label="Company name"
                defaultValue={profile.companyName}
                onBlur={(e) => saveField("companyName", e.target.value)}
              />
              <Textarea
                label="Description"
                placeholder="What does your company do, and what makes it a good fit for customers?"
                defaultValue={profile.description ?? ""}
                onBlur={(e) => saveField("description", e.target.value)}
              />
              <Input
                label="Years of experience"
                type="number"
                defaultValue={profile.yearsExperience ?? ""}
                onBlur={(e) =>
                  saveField("yearsExperience", e.target.value === "" ? null : Number(e.target.value))
                }
              />
              <Input
                label="Service locations"
                placeholder="e.g. Kuwait City, Hawalli, Salmiya"
                defaultValue={toListText(profile.serviceLocations)}
                onBlur={(e) => saveField("serviceLocations", parseListText(e.target.value))}
              />
              <Input
                label="Specialties"
                placeholder="e.g. Villas, Renovation, Commercial fit-out"
                defaultValue={toListText(profile.specialties)}
                onBlur={(e) => saveField("specialties", parseListText(e.target.value))}
              />
            </div>
          </Card>

          <Card>
            <h2 style={{ fontSize: "var(--font-size-lg)", marginBottom: "var(--space-2)" }}>
              Verification documents
            </h2>
            <p
              style={{
                color: "var(--color-ink-500)",
                fontSize: "var(--font-size-sm)",
                marginBottom: "var(--space-4)",
              }}
            >
              Trade license, registration, or anything that verifies your company.
            </p>

            {documents.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-2)",
                  marginBottom: "var(--space-4)",
                }}
              >
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
              {submitting ? "Submitting…" : "Submit for verification"}
            </Button>
          </div>
        </div>
      )}
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
