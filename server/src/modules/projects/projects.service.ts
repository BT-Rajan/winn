import { randomUUID } from "node:crypto";
import { ForbiddenError, NotFoundError, ValidationError } from "../../core/errors";
import { recordAuditEvent } from "../audit/audit.service";
import { notifyUser } from "../notifications/notifications.service";
import { assertCanAccess, getFileOrThrow } from "../files/files.service";
import {
  countProjectDocuments,
  findProjectById,
  insertProject,
  insertProjectDocument,
  listProjectDocuments,
  listProjectsForCustomer,
  markProjectSubmitted,
  removeProjectDocument,
  updateProjectFields,
  type ProjectRow,
} from "./projects.repository";
import type { CreateProjectInput, UpdateProjectInput } from "./projects.schemas";

/** Every handler that touches a project starts here — one place enforces
 *  "a customer only ever sees their own project", not each route. */
async function getOwnedProjectOrThrow(projectId: string, customerId: string): Promise<ProjectRow> {
  const project = await findProjectById(projectId);
  if (!project) throw new NotFoundError("Project");
  if (project.customer_id !== customerId) throw new ForbiddenError();
  return project;
}

function assertEditable(project: ProjectRow): void {
  if (project.status !== "draft") {
    throw new ValidationError("This project has already been submitted and can no longer be edited");
  }
}

export async function createProject(customerId: string, input: CreateProjectInput): Promise<ProjectRow> {
  const id = randomUUID();
  await insertProject({ id, customerId, title: input.title });

  await recordAuditEvent({
    actorUserId: customerId,
    action: "project.created",
    entityType: "project",
    entityId: id,
  });

  return getOwnedProjectOrThrow(id, customerId);
}

export async function listMyProjects(customerId: string): Promise<ProjectRow[]> {
  return listProjectsForCustomer(customerId);
}

export async function getMyProject(
  customerId: string,
  projectId: string,
): Promise<{ project: ProjectRow; documents: Awaited<ReturnType<typeof listProjectDocuments>> }> {
  const project = await getOwnedProjectOrThrow(projectId, customerId);
  const documents = await listProjectDocuments(project.id);
  return { project, documents };
}

/** Autosave — called on blur/debounce as the customer fills in the form,
 *  one field (or a few) at a time. Never re-asks for anything already saved. */
export async function updateMyProject(
  customerId: string,
  projectId: string,
  patch: UpdateProjectInput,
): Promise<ProjectRow> {
  const project = await getOwnedProjectOrThrow(projectId, customerId);
  assertEditable(project);

  await updateProjectFields(projectId, patch);

  return getOwnedProjectOrThrow(projectId, customerId);
}

export async function attachDocumentToProject(
  customerId: string,
  projectId: string,
  fileId: string,
): Promise<void> {
  const project = await getOwnedProjectOrThrow(projectId, customerId);
  assertEditable(project);

  // The file must actually belong to this customer — attaching someone
  // else's uploaded file to your project is not a valid path here.
  const file = await getFileOrThrow(fileId);
  assertCanAccess(file, customerId);

  await insertProjectDocument({ id: randomUUID(), projectId, fileId });
}

export async function detachDocumentFromProject(
  customerId: string,
  projectId: string,
  documentId: string,
): Promise<void> {
  const project = await getOwnedProjectOrThrow(projectId, customerId);
  assertEditable(project);

  await removeProjectDocument(documentId, project.id);
}

const REQUIRED_FIELDS: { key: keyof ProjectRow; label: string }[] = [
  { key: "title", label: "Project name" },
  { key: "project_type", label: "Project type" },
  { key: "location", label: "Location" },
  { key: "budget_min", label: "Budget" },
  { key: "requirements", label: "Requirements" },
];

/** The one place that defines "a project is complete enough to submit" —
 *  the client mirrors this for UX, but this is the rule that's enforced. */
function assertReadyToSubmit(project: ProjectRow, documentCount: number): void {
  const missing = REQUIRED_FIELDS.filter((field) => !project[field.key]).map((field) => field.label);

  if (documentCount === 0) missing.push("At least one document");

  if (missing.length > 0) {
    throw new ValidationError("This project isn't ready to submit yet", { missing });
  }
}

export async function submitProject(customerId: string, projectId: string): Promise<ProjectRow> {
  const project = await getOwnedProjectOrThrow(projectId, customerId);
  assertEditable(project);

  const documentCount = await countProjectDocuments(project.id);
  assertReadyToSubmit(project, documentCount);

  await markProjectSubmitted(project.id);

  await recordAuditEvent({
    actorUserId: customerId,
    action: "project.submitted",
    entityType: "project",
    entityId: project.id,
  });

  await notifyUser(
    customerId,
    "Project submitted",
    "We've received your project. You'll be notified once it's verified and visible to builders.",
  );

  return getOwnedProjectOrThrow(projectId, customerId);
}
