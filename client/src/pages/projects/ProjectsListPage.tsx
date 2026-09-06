import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../../design-system/AppShell";
import { Card } from "../../design-system/Card";
import { Button } from "../../design-system/Button";
import { ApiError } from "../../lib/apiClient";
import { createProject, listProjects, type Project } from "../../lib/projects";

const STATUS_LABEL: Record<Project["status"], string> = {
  draft: "Draft",
  submitted: "Submitted — under review",
  verified: "Verified — open for proposals",
  rejected: "Needs changes",
  awarded: "Awarded",
};

const STATUS_COLOR: Record<Project["status"], string> = {
  draft: "var(--color-ink-500)",
  submitted: "var(--color-warning)",
  verified: "var(--color-success)",
  rejected: "var(--color-danger)",
  awarded: "var(--color-success)",
};

export function ProjectsListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    listProjects()
      .then((res) => setProjects(res.projects))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load your projects."));
  }, []);

  async function handleStartProject() {
    setCreating(true);
    setError(null);
    try {
      const { project } = await createProject("Untitled project");
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start a new project.");
      setCreating(false);
    }
  }

  return (
    <AppShell>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-6)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "var(--font-size-2xl)", marginBottom: "var(--space-1)" }}>
            Your projects
          </h1>
          <p style={{ color: "var(--color-ink-500)" }}>Submit a project to start receiving builder proposals.</p>
        </div>
        <Button onClick={handleStartProject} disabled={creating}>
          {creating ? "Starting…" : "Start a new project"}
        </Button>
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
            You haven't started a project yet. It takes a few minutes.
          </p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {projects.map((project) => (
            <Card
              key={project.id}
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h3 style={{ marginBottom: "var(--space-1)" }}>{project.title}</h3>
                  <p style={{ color: "var(--color-ink-500)", fontSize: "var(--font-size-sm)" }}>
                    {[project.projectType, project.location].filter(Boolean).join(" · ") || "Details in progress"}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    color: STATUS_COLOR[project.status],
                  }}
                >
                  {STATUS_LABEL[project.status]}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
