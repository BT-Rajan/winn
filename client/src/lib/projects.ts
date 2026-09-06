import { apiRequest, apiUpload } from "./apiClient";

export type ProjectStatus = "draft" | "submitted" | "verified" | "rejected";

export interface Project {
  id: string;
  title: string;
  projectType: string | null;
  location: string | null;
  sizeValue: string | null;
  sizeUnit: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  closingDate: string | null;
  requirements: string | null;
  status: ProjectStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDocument {
  id: string;
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface ProjectUpdateInput {
  title?: string;
  projectType?: string;
  location?: string;
  sizeValue?: number | null;
  sizeUnit?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  closingDate?: string | null;
  requirements?: string;
}

export function listProjects(): Promise<{ projects: Project[] }> {
  return apiRequest("/projects");
}

export function createProject(title: string): Promise<{ project: Project }> {
  return apiRequest("/projects", { method: "POST", body: { title } });
}

export function getProject(id: string): Promise<{ project: Project; documents: ProjectDocument[] }> {
  return apiRequest(`/projects/${id}`);
}

export function updateProject(id: string, patch: ProjectUpdateInput): Promise<{ project: Project }> {
  return apiRequest(`/projects/${id}`, { method: "PATCH", body: patch });
}

export function submitProject(id: string): Promise<{ project: Project }> {
  return apiRequest(`/projects/${id}/submit`, { method: "POST" });
}

export function removeProjectDocument(projectId: string, documentId: string): Promise<void> {
  return apiRequest(`/projects/${projectId}/documents/${documentId}`, { method: "DELETE" });
}

/** Two-step upload: send the file to the shared /files endpoint (Pass 1
 *  foundation), then link the returned file id to this project. Documents
 *  stay private via the same access rule every other file uses. */
export async function uploadProjectDocument(
  projectId: string,
  file: File,
): Promise<{ project: Project; documents: ProjectDocument[] }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("entityType", "project");
  formData.append("entityId", projectId);

  const { file: uploaded } = await apiUpload<{ file: { id: string } }>("/files", formData);

  return apiRequest(`/projects/${projectId}/documents`, {
    method: "POST",
    body: { fileId: uploaded.id },
  });
}
