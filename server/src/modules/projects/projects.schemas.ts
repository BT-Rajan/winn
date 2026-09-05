import { z } from "zod";

// Creating a project only requires a title — everything else is filled in
// as the customer works through the form and autosaves. "Never ask for
// the same information twice, no unnecessary forms" (Pass 2 UX rules).
export const createProjectSchema = z.object({
  title: z.string().min(1, "Give your project a name").max(255),
});

// Every field optional: this is the autosave PATCH, called as the
// customer fills in one field at a time — not a single big form submit.
export const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  projectType: z.string().min(1).max(100).optional(),
  location: z.string().min(1).max(255).optional(),
  sizeValue: z.number().positive().optional().nullable(),
  sizeUnit: z.string().max(20).optional().nullable(),
  budgetMin: z.number().nonnegative().optional().nullable(),
  budgetMax: z.number().nonnegative().optional().nullable(),
  requirements: z.string().max(5000).optional(),
});

export const attachDocumentSchema = z.object({
  fileId: z.string().uuid(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AttachDocumentInput = z.infer<typeof attachDocumentSchema>;
