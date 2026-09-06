import { apiRequest } from "./apiClient";

export type ProposalStatus = "submitted" | "withdrawn" | "awarded" | "rejected";
export type DurationUnit = "days" | "weeks" | "months";

export interface Proposal {
  id: string;
  projectId: string;
  price: string;
  durationValue: number;
  durationUnit: DurationUnit;
  scope: string;
  exclusions: string | null;
  paymentTerms: string | null;
  warranty: string | null;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MyProposal extends Proposal {
  projectTitle: string;
  projectType: string | null;
  projectLocation: string | null;
  projectStatus: string;
}

export interface ProposalComparison {
  proposalId: string;
  companyName: string;
  yearsExperience: number | null;
  price: string;
  durationValue: number;
  durationUnit: DurationUnit;
  scope: string;
  exclusions: string | null;
  paymentTerms: string | null;
  warranty: string | null;
  status: ProposalStatus;
  matchScore: number;
  matchExplanation: string;
}

export interface ProposalInput {
  price: number;
  durationValue: number;
  durationUnit: DurationUnit;
  scope: string;
  exclusions?: string | null;
  paymentTerms?: string | null;
  warranty?: string | null;
}

// --- Builder-facing ---------------------------------------------------

export function submitMyProposal(projectId: string, input: ProposalInput): Promise<{ proposal: Proposal }> {
  return apiRequest(`/proposals/projects/${projectId}`, { method: "POST", body: input });
}

export function withdrawMyProposal(projectId: string): Promise<void> {
  return apiRequest(`/proposals/projects/${projectId}`, { method: "DELETE" });
}

export function listMyProposals(): Promise<{ proposals: MyProposal[] }> {
  return apiRequest("/proposals/mine");
}

// --- Customer-facing ----------------------------------------------------

export function listProjectProposals(projectId: string): Promise<{ proposals: ProposalComparison[] }> {
  return apiRequest(`/proposals/projects/${projectId}`);
}

export function awardProposal(projectId: string, proposalId: string): Promise<void> {
  return apiRequest(`/proposals/projects/${projectId}/award`, { method: "POST", body: { proposalId } });
}
