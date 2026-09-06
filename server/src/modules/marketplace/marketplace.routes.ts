import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth } from "../../core/middleware/auth";
import { requireRole } from "../../core/middleware/rbac";
import { storageDriver } from "../files/storage";
import { getMarketplaceDocumentFile, getMarketplaceProject, listMarketplaceProjects } from "./marketplace.service";
import type { ProjectDocumentRow, ProjectRow } from "../projects/projects.repository";

export const marketplaceRouter = Router();

// Pass 4 is the trusted exchange between verified projects and verified
// builders. Only builders reach this router — and only verified ones get
// past the service layer's eligibility check.
marketplaceRouter.use(requireAuth, requireRole("builder"));

function summarize(text: string | null, maxLength = 160): string | null {
  if (!text) return null;
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

// Customer identity is never included here — only the project itself.
function toCardDto(project: ProjectRow) {
  return {
    id: project.id,
    projectType: project.project_type,
    location: project.location,
    sizeValue: project.size_value,
    sizeUnit: project.size_unit,
    budgetMin: project.budget_min,
    budgetMax: project.budget_max,
    closingDate: project.closing_date,
    readiness: "Verified",
    requirementsSummary: summarize(project.requirements),
  };
}

function toDetailDto(project: ProjectRow) {
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
    readiness: "Verified",
    requirements: project.requirements,
  };
}

function toDocumentDto(doc: ProjectDocumentRow) {
  return {
    id: doc.id,
    originalName: doc.original_name,
    mimeType: doc.mime_type,
    sizeBytes: doc.size_bytes,
  };
}

marketplaceRouter.get(
  "/projects",
  asyncHandler(async (req, res) => {
    const projects = await listMarketplaceProjects(req.user!.sub);
    res.json({ projects: projects.map(toCardDto) });
  }),
);

marketplaceRouter.get(
  "/projects/:id",
  asyncHandler(async (req, res) => {
    const { project, documents } = await getMarketplaceProject(req.user!.sub, req.params.id);
    res.json({ project: toDetailDto(project), documents: documents.map(toDocumentDto) });
  }),
);

marketplaceRouter.get(
  "/projects/:id/documents/:documentId",
  asyncHandler(async (req, res) => {
    const file = await getMarketplaceDocumentFile(req.user!.sub, req.params.id, req.params.documentId);
    res.download(storageDriver.resolvePath(file.storage_key), file.original_name);
  }),
);
