import { ForbiddenError, NotFoundError } from "../../core/errors";
import { findProfileByUserId, type BuilderProfileRow } from "../builders/builders.repository";
import { assertCanAccess, getFileOrThrow } from "../files/files.service";
import { scoreMatch, type MatchResult } from "../matching/matching.service";
import {
  findVerifiedProjectById,
  listProjectDocuments,
  listVerifiedProjects,
  type ProjectRow,
} from "../projects/projects.repository";
import type { ProjectDocumentRow } from "../projects/projects.repository";

/** The one place Pass 4's "Only verified builders participate" trust rule
 *  is enforced. Every marketplace entry point calls this first, and reuses
 *  the profile it already fetched for Pass 5's match scoring. */
async function getVerifiedBuilderProfile(userId: string): Promise<BuilderProfileRow> {
  const profile = await findProfileByUserId(userId);
  if (!profile || profile.verification_status !== "verified") {
    throw new ForbiddenError(
      "Your company profile must be verified before you can view marketplace projects",
    );
  }
  return profile;
}

export interface MarketplaceProject {
  project: ProjectRow;
  match: MatchResult;
}

/** Every verified builder sees every verified project — Pass 5 changes
 *  the order and adds an honest score, it doesn't gate who gets to see
 *  what. That gate is Pass 4's job and stays as-is. */
export async function listMarketplaceProjects(builderUserId: string): Promise<MarketplaceProject[]> {
  const profile = await getVerifiedBuilderProfile(builderUserId);
  const projects = await listVerifiedProjects();

  return projects
    .map((project) => ({ project, match: scoreMatch(project, profile) }))
    .sort((a, b) => b.match.score - a.match.score);
}

export async function getMarketplaceProject(
  builderUserId: string,
  projectId: string,
): Promise<{ project: ProjectRow; documents: ProjectDocumentRow[]; match: MatchResult }> {
  const profile = await getVerifiedBuilderProfile(builderUserId);

  // An unverified or nonexistent project looks identical to a builder —
  // never reveal that a not-yet-verified project exists.
  const project = await findVerifiedProjectById(projectId);
  if (!project) throw new NotFoundError("Project");

  const documents = await listProjectDocuments(project.id);
  const match = scoreMatch(project, profile);
  return { project, documents, match };
}

export async function getMarketplaceDocumentFile(
  builderUserId: string,
  projectId: string,
  documentId: string,
) {
  await getVerifiedBuilderProfile(builderUserId);

  const project = await findVerifiedProjectById(projectId);
  if (!project) throw new NotFoundError("Project");

  const documents = await listProjectDocuments(project.id);
  const document = documents.find((doc) => doc.id === documentId);
  if (!document) throw new NotFoundError("Document");

  const file = await getFileOrThrow(document.file_id);
  // Eligibility (verified builder + verified project) already established
  // above — that's the business reason for granting access here.
  assertCanAccess(file, builderUserId, true);

  return file;
}
