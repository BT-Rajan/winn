import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth } from "../../core/middleware/auth";
import { requireRole } from "../../core/middleware/rbac";
import { awardProposalSchema, submitProposalSchema } from "./proposals.schemas";
import {
  awardProposal,
  listMyProposals,
  listProposalsForCustomerProject,
  submitOrUpdateProposal,
  withdrawProposal,
  type ProposalWithMatch,
} from "./proposals.service";
import type { ProposalRow, ProposalWithProjectRow } from "./proposals.repository";

export const proposalsRouter = Router();

proposalsRouter.use(requireAuth);

function toProposalDto(proposal: ProposalRow) {
  return {
    id: proposal.id,
    projectId: proposal.project_id,
    price: proposal.price,
    durationValue: proposal.duration_value,
    durationUnit: proposal.duration_unit,
    scope: proposal.scope,
    exclusions: proposal.exclusions,
    paymentTerms: proposal.payment_terms,
    warranty: proposal.warranty,
    status: proposal.status,
    createdAt: proposal.created_at,
    updatedAt: proposal.updated_at,
  };
}

function toMyProposalDto(proposal: ProposalWithProjectRow) {
  return {
    ...toProposalDto(proposal),
    projectTitle: proposal.project_title,
    projectType: proposal.project_type,
    projectLocation: proposal.project_location,
    projectStatus: proposal.project_status,
  };
}

// Never sorted or filtered here beyond what the customer explicitly did —
// see proposals.service's listProposalsForCustomerProject for why.
function toComparisonDto({ proposal, match }: ProposalWithMatch) {
  return {
    proposalId: proposal.id,
    companyName: proposal.company_name,
    yearsExperience: proposal.years_experience,
    price: proposal.price,
    durationValue: proposal.duration_value,
    durationUnit: proposal.duration_unit,
    scope: proposal.scope,
    exclusions: proposal.exclusions,
    paymentTerms: proposal.payment_terms,
    warranty: proposal.warranty,
    status: proposal.status,
    matchScore: match.score,
    matchExplanation: match.explanation,
  };
}

// --- Builder-facing ---------------------------------------------------

proposalsRouter.post(
  "/projects/:projectId",
  requireRole("builder"),
  asyncHandler(async (req, res) => {
    const input = submitProposalSchema.parse(req.body);
    const proposal = await submitOrUpdateProposal(req.user!.sub, req.params.projectId, input);
    res.status(201).json({ proposal: toProposalDto(proposal) });
  }),
);

proposalsRouter.delete(
  "/projects/:projectId",
  requireRole("builder"),
  asyncHandler(async (req, res) => {
    await withdrawProposal(req.user!.sub, req.params.projectId);
    res.status(204).send();
  }),
);

proposalsRouter.get(
  "/mine",
  requireRole("builder"),
  asyncHandler(async (req, res) => {
    const proposals = await listMyProposals(req.user!.sub);
    res.json({ proposals: proposals.map(toMyProposalDto) });
  }),
);

// --- Customer-facing ----------------------------------------------------

proposalsRouter.get(
  "/projects/:projectId",
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const results = await listProposalsForCustomerProject(req.user!.sub, req.params.projectId);
    res.json({ proposals: results.map(toComparisonDto) });
  }),
);

proposalsRouter.post(
  "/projects/:projectId/award",
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const { proposalId } = awardProposalSchema.parse(req.body);
    await awardProposal(req.user!.sub, req.params.projectId, proposalId);
    res.status(204).send();
  }),
);
