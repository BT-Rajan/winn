import { apiRequest, apiUpload } from "./apiClient";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface BuilderProfile {
  id: string;
  companyName: string;
  description: string | null;
  yearsExperience: number | null;
  budgetRangeMin: string | null;
  budgetRangeMax: string | null;
  serviceLocations: string[];
  specialties: string[];
  verificationStatus: VerificationStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuilderDocument {
  id: string;
  fileId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface BuilderProfileUpdateInput {
  companyName?: string;
  description?: string;
  yearsExperience?: number | null;
  budgetRangeMin?: number | null;
  budgetRangeMax?: number | null;
  serviceLocations?: string[];
  specialties?: string[];
}

export function getMyBuilderProfile(): Promise<{ profile: BuilderProfile; documents: BuilderDocument[] }> {
  return apiRequest("/builders/me");
}

export function updateMyBuilderProfile(
  patch: BuilderProfileUpdateInput,
): Promise<{ profile: BuilderProfile }> {
  return apiRequest("/builders/me", { method: "PATCH", body: patch });
}

export function submitBuilderProfile(): Promise<{ profile: BuilderProfile }> {
  return apiRequest("/builders/me/submit", { method: "POST" });
}

export function removeBuilderDocument(documentId: string): Promise<void> {
  return apiRequest(`/builders/me/documents/${documentId}`, { method: "DELETE" });
}

/** Same two-step upload as project documents: send to the shared /files
 *  endpoint (Pass 1 foundation), then link the returned file id here. */
export async function uploadBuilderDocument(
  file: File,
): Promise<{ profile: BuilderProfile; documents: BuilderDocument[] }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("entityType", "builder_profile");

  const { file: uploaded } = await apiUpload<{ file: { id: string } }>("/files", formData);

  return apiRequest("/builders/me/documents", { method: "POST", body: { fileId: uploaded.id } });
}
