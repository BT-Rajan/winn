import { randomUUID } from "node:crypto";
import { ForbiddenError, NotFoundError, ValidationError } from "../../core/errors";
import { recordAuditEvent } from "../audit/audit.service";
import { notifyUser } from "../notifications/notifications.service";
import { findProfileByUserId, findProfileById } from "../builders/builders.repository";
import { findProjectById, findVerifiedProjectById } from "../projects/projects.repository";
import { scoreMatch } from "../matching/matching.service";
import {
  awardProposalTransaction,
  findProposal,
  findProposalById,
  insertProposal,
  listActiveProposalsForProject,
  listProposalsForBuilder,
  listRejectedBuilderUserIds,
  markProposalWithdrawn,
  updateProposalContent,
  type ProposalRow,
  type ProposalWithBuilderRow,
  type ProposalWithProjectRow,
} from "./proposals.repository";
import type { SubmitProposalInput } from "./proposals.schemas";

async function getVerifiedBuilderProfile(userId: string) {
  const profile = await findProfileByUserId(userId);
  if (!profile || profile.verification_status !== "verified") {
    throw new ForbiddenError("Your company profile must be verified before you can submit a proposal");
  }
  return profile;
}

/** Submitting for a project that isn't open (unverified, or already
 *  awarded) is treated the same as the project not existing — same
 *  reasoning as Pass 4's marketplace: don't reveal business state a
 *  builder isn't eligible to know about. */
async function getOpenProjectOrThrow(projectId: string) {
  const project = await findVerifiedProjectById(projectId);
  if (!project) throw new NotFoundError("Project");
  return project;
}

export async function submitOrUpdateProposal(
  builderUserId: string,
  projectId: string,
  input: SubmitProposalInput,
): Promise<ProposalRow> {
  const profile = await getVerifiedBuilderProfile(builderUserId);
  const project = await getOpenProjectOrThrow(projectId);

  const existing = await findProposal(project.id, profile.id);

  if (existing && (existing.status === "awarded" || existing.status === "rejected")) {
    throw new ValidationError("This proposal has already been decided and can no longer be edited");
  }

  const content = {
    price: input.price,
    durationValue: input.durationValue,
    durationUnit: input.durationUnit,
    scope: input.scope,
    exclusions: input.exclusions ?? null,
    paymentTerms: input.paymentTerms ?? null,
    warranty: input.warranty ?? null,
  };

  let proposalId: string;
  if (existing) {
    await updateProposalContent(existing.id, content);
    proposalId = existing.id;
  } else {
    proposalId = randomUUID();
    await insertProposal({ id: proposalId, projectId: project.id, builderProfileId: profile.id, ...content });
  }

  await recordAuditEvent({
    actorUserId: builderUserId,
    action: existing ? "proposal.updated" : "proposal.submitted",
    entityType: "proposal",
    entityId: proposalId,
  });

  if (!existing) {
    await notifyUser(
      project.customer_id,
      "New proposal received",
      "A builder has submitted a proposal for your project.",
    );
  }

  const proposal = await findProposalById(proposalId);
  if (!proposal) throw new NotFoundError("Proposal");
  return proposal;
}

export async function withdrawProposal(builderUserId: string, projectId: string): Promise<void> {
  const profile = await getVerifiedBuilderProfile(builderUserId);
  const proposal = await findProposal(projectId, profile.id);

  if (!proposal || proposal.status !== "submitted") {
    throw new NotFoundError("Proposal");
  }

  await markProposalWithdrawn(proposal.id);

  await recordAuditEvent({
    actorUserId: builderUserId,
    action: "proposal.withdrawn",
    entityType: "proposal",
    entityId: proposal.id,
  });
}

export async function listMyProposals(builderUserId: string): Promise<ProposalWithProjectRow[]> {
  const profile = await findProfileByUserId(builderUserId);
  if (!profile) return [];
  return listProposalsForBuilder(profile.id);
}

async function getOwnedProjectForCustomer(customerUserId: string, projectId: string) {
  const project = await findProjectById(projectId);
  if (!project) throw new NotFoundError("Project");
  if (project.customer_id !== customerUserId) throw new ForbiddenError();
  return project;
}

export interface ProposalWithMatch {
  proposal: ProposalWithBuilderRow;
  match: ReturnType<typeof scoreMatch>;
}

/** Never sorted, filtered, or otherwise nudged toward any builder — the
 *  constitution's trust rule is "the customer chooses". Sorting by match
 *  score here (as the marketplace does for builders) would be exactly
 *  the kind of thumb-on-the-scale this pass rules out. */
export async function listProposalsForCustomerProject(
  customerUserId: string,
  projectId: string,
): Promise<ProposalWithMatch[]> {
  const project = await getOwnedProjectForCustomer(customerUserId, projectId);
  const proposals = await listActiveProposalsForProject(project.id);

  return proposals.map((proposal) => ({
    proposal,
    match: scoreMatch(project, {
      specialties: proposal.specialties as string[] | null,
      service_locations: proposal.service_locations as string[] | null,
      budget_range_min: proposal.budget_range_min,
      budget_range_max: proposal.budget_range_max,
      years_experience: proposal.years_experience,
    }),
  }));
}

export async function awardProposal(
  customerUserId: string,
  projectId: string,
  proposalId: string,
): Promise<void> {
  const project = await getOwnedProjectForCustomer(customerUserId, projectId);

  if (project.status !== "verified") {
    throw new ValidationError("This project isn't open for selection");
  }

  const proposal = await findProposalById(proposalId);
  if (!proposal || proposal.project_id !== project.id || proposal.status !== "submitted") {
    throw new NotFoundError("Proposal");
  }

  await awardProposalTransaction(project.id, proposal.id);

  await recordAuditEvent({
    actorUserId: customerUserId,
    action: "proposal.awarded",
    entityType: "proposal",
    entityId: proposal.id,
  });

  const awardedProfile = await findProfileById(proposal.builder_profile_id);
  if (awardedProfile) {
    await notifyUser(awardedProfile.user_id, "Proposal awarded", "Your proposal has been selected. Congratulations!");
  }

  const rejectedUserIds = await listRejectedBuilderUserIds(project.id, proposal.id);
  for (const userId of rejectedUserIds) {
    await notifyUser(userId, "Proposal not selected", "The customer selected another builder for this project.");
  }
}
