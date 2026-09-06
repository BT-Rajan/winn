import { apiDownload, apiRequest } from "./apiClient";

export interface MarketplaceProjectCard {
  id: string;
  projectType: string | null;
  location: string | null;
  sizeValue: string | null;
  sizeUnit: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  closingDate: string | null;
  readiness: string;
  requirementsSummary: string | null;
  matchScore: number;
  matchExplanation: string;
}

export interface MarketplaceProjectDetail {
  id: string;
  title: string;
  projectType: string | null;
  location: string | null;
  sizeValue: string | null;
  sizeUnit: string | null;
  budgetMin: string | null;
  budgetMax: string | null;
  closingDate: string | null;
  readiness: string;
  requirements: string | null;
  matchScore: number;
  matchExplanation: string;
  matchedCriteria: string[];
}

export interface MarketplaceDocument {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export function listMarketplaceProjects(): Promise<{ projects: MarketplaceProjectCard[] }> {
  return apiRequest("/marketplace/projects");
}

export function getMarketplaceProject(
  id: string,
): Promise<{ project: MarketplaceProjectDetail; documents: MarketplaceDocument[] }> {
  return apiRequest(`/marketplace/projects/${id}`);
}

export function downloadMarketplaceDocument(
  projectId: string,
  document: MarketplaceDocument,
): Promise<void> {
  return apiDownload(`/marketplace/projects/${projectId}/documents/${document.id}`, document.originalName);
}
