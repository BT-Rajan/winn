import { z } from "zod";

// Same autosave shape as Pass 2's projects: every field optional, saved
// one at a time as the builder works through the profile — no big form submit.
export const updateBuilderProfileSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  yearsExperience: z.number().int().nonnegative().max(200).optional().nullable(),
  serviceLocations: z.array(z.string().min(1).max(255)).max(20).optional(),
  specialties: z.array(z.string().min(1).max(255)).max(20).optional(),
});

export const attachDocumentSchema = z.object({
  fileId: z.string().uuid(),
});

export type UpdateBuilderProfileInput = z.infer<typeof updateBuilderProfileSchema>;
export type AttachDocumentInput = z.infer<typeof attachDocumentSchema>;
