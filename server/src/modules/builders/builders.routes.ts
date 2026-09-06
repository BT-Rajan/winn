import { Router } from "express";
import { asyncHandler } from "../../core/asyncHandler";
import { requireAuth } from "../../core/middleware/auth";
import { requireRole } from "../../core/middleware/rbac";
import { attachDocumentSchema, updateBuilderProfileSchema } from "./builders.schemas";
import {
  attachDocumentToProfile,
  detachDocumentFromProfile,
  getMyProfile,
  submitProfileForVerification,
  updateMyProfile,
} from "./builders.service";
import type { BuilderDocumentRow, BuilderProfileRow } from "./builders.repository";

export const buildersRouter = Router();

// Pass 3 is the builder's own company profile before verification.
// Admin review is Pass 8; marketplace/matching visibility is Pass 4/5 —
// this module doesn't reach ahead into either.
buildersRouter.use(requireAuth, requireRole("builder"));

function toProfileDto(profile: BuilderProfileRow) {
  return {
    id: profile.id,
    companyName: profile.company_name,
    description: profile.description,
    yearsExperience: profile.years_experience,
    budgetRangeMin: profile.budget_range_min,
    budgetRangeMax: profile.budget_range_max,
    serviceLocations: profile.service_locations ?? [],
    specialties: profile.specialties ?? [],
    verificationStatus: profile.verification_status,
    submittedAt: profile.submitted_at,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

function toDocumentDto(doc: BuilderDocumentRow) {
  return {
    id: doc.id,
    fileId: doc.file_id,
    originalName: doc.original_name,
    mimeType: doc.mime_type,
    sizeBytes: doc.size_bytes,
    createdAt: doc.created_at,
  };
}

buildersRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const { profile, documents } = await getMyProfile(req.user!.sub);
    res.json({ profile: toProfileDto(profile), documents: documents.map(toDocumentDto) });
  }),
);

buildersRouter.patch(
  "/me",
  asyncHandler(async (req, res) => {
    const input = updateBuilderProfileSchema.parse(req.body);
    const profile = await updateMyProfile(req.user!.sub, input);
    res.json({ profile: toProfileDto(profile) });
  }),
);

buildersRouter.post(
  "/me/documents",
  asyncHandler(async (req, res) => {
    const { fileId } = attachDocumentSchema.parse(req.body);
    await attachDocumentToProfile(req.user!.sub, fileId);
    const { profile, documents } = await getMyProfile(req.user!.sub);
    res.status(201).json({ profile: toProfileDto(profile), documents: documents.map(toDocumentDto) });
  }),
);

buildersRouter.delete(
  "/me/documents/:documentId",
  asyncHandler(async (req, res) => {
    await detachDocumentFromProfile(req.user!.sub, req.params.documentId);
    res.status(204).send();
  }),
);

buildersRouter.post(
  "/me/submit",
  asyncHandler(async (req, res) => {
    const profile = await submitProfileForVerification(req.user!.sub);
    res.json({ profile: toProfileDto(profile) });
  }),
);
