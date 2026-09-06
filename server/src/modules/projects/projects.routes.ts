import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth } from "../../core/middleware/auth";
import { requireRole } from "../../core/middleware/rbac";
import {
  attachDocumentSchema,
  createProjectSchema,
  updateProjectSchema,
} from "./projects.schemas";
import {
  attachDocumentToProject,
  createProject,
  detachDocumentFromProject,
  getMyProject,
  listMyProjects,
  submitProject,
  updateMyProject,
} from "./projects.service";
import type { ProjectDocumentRow, ProjectRow } from "./projects.repository";

export const projectsRouter = Router();

// Pass 2 is the customer's own workspace for a project before it's
// submitted. Builder/admin visibility into submitted projects is Pass 3/4/8
// — this module doesn't reach ahead into that.
projectsRouter.use(requireAuth, requireRole("customer"));

function toProjectDto(project: ProjectRow) {
  return {
    id: project.id,
    title: project.title,
    projectType: project.project_type,
    location: project.location,
    sizeValue: project.size_value,
    sizeUnit: project.size_unit,
    budgetMin: project.budget_min,
    budgetMax: project.budget_max,
    closingDate: project.closing_date,
    requirements: project.requirements,
    status: project.status,
    submittedAt: project.submitted_at,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}

function toDocumentDto(doc: ProjectDocumentRow) {
  return {
    id: doc.id,
    fileId: doc.file_id,
    originalName: doc.original_name,
    mimeType: doc.mime_type,
    sizeBytes: doc.size_bytes,
    createdAt: doc.created_at,
  };
}

projectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createProjectSchema.parse(req.body);
    const project = await createProject(req.user!.sub, input);
    res.status(201).json({ project: toProjectDto(project) });
  }),
);

projectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const projects = await listMyProjects(req.user!.sub);
    res.json({ projects: projects.map(toProjectDto) });
  }),
);

projectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { project, documents } = await getMyProject(req.user!.sub, req.params.id);
    res.json({ project: toProjectDto(project), documents: documents.map(toDocumentDto) });
  }),
);

projectsRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateProjectSchema.parse(req.body);
    const project = await updateMyProject(req.user!.sub, req.params.id, input);
    res.json({ project: toProjectDto(project) });
  }),
);

projectsRouter.post(
  "/:id/documents",
  asyncHandler(async (req, res) => {
    const { fileId } = attachDocumentSchema.parse(req.body);
    await attachDocumentToProject(req.user!.sub, req.params.id, fileId);
    const { project, documents } = await getMyProject(req.user!.sub, req.params.id);
    res.status(201).json({ project: toProjectDto(project), documents: documents.map(toDocumentDto) });
  }),
);

projectsRouter.delete(
  "/:id/documents/:documentId",
  asyncHandler(async (req, res) => {
    await detachDocumentFromProject(req.user!.sub, req.params.id, req.params.documentId);
    res.status(204).send();
  }),
);

projectsRouter.post(
  "/:id/submit",
  asyncHandler(async (req, res) => {
    const project = await submitProject(req.user!.sub, req.params.id);
    res.json({ project: toProjectDto(project) });
  }),
);
