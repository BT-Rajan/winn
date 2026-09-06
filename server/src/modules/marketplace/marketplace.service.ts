import { ForbiddenError, NotFoundError } from "../../core/errors";
import { findProfileByUserId } from "../builders/builders.repository";
import { assertCanAccess, getFileOrThrow } from "../files/files.service";
import {
  findVerifiedProjectById,
  listProjectDocuments,
  listVerifiedProjects,
  type ProjectRow,
} from "../projects/projects.repository";
import type { ProjectDocumentRow } from "../projects/projects.repository";

/** The one place Pass 4's "Only verified builders participate" trust rule
 *  is enforced. Every marketplace entry point calls this first. */
async function assertBuilderVerified(userId: string): Promise<void> {
  const profile = await findProfileByUserId(userId);
  if (!profile || profile.verification_status !== "verified") {
    throw new ForbiddenError(
      "Your company profile must be verified before you can view marketplace projects",
    );
  }
}

/** Pass 5 (AI Matching) will rank and score these; for now every verified
 *  builder sees every verified project — no crude interim filter that
 *  Pass 5 would just have to replace. */
export async function listMarketplaceProjects(builderUserId: string): Promise<ProjectRow[]> {
  await assertBuilderVerified(builderUserId);
  return listVerifiedProjects();
}

export async function getMarketplaceProject(
  builderUserId: string,
  projectId: string,
): Promise<{ project: ProjectRow; documents: ProjectDocumentRow[] }> {
  await assertBuilderVerified(builderUserId);

  // An unverified or nonexistent project looks identical to a builder —
  // never reveal that a not-yet-verified project exists.
  const project = await findVerifiedProjectById(projectId);
  if (!project) throw new NotFoundError("Project");

  const documents = await listProjectDocuments(project.id);
  return { project, documents };
}

export async function getMarketplaceDocumentFile(
  builderUserId: string,
  projectId: string,
  documentId: string,
) {
  await assertBuilderVerified(builderUserId);

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
