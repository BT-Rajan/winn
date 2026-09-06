import { z } from "zod";

// A proposal is a formal bid, not an autosaved draft — it's submitted as
// one complete document (matching Pass 6's comparison table, which needs
// every field present to compare fairly), not built up field by field.
export const submitProposalSchema = z.object({
  price: z.number().positive(),
  durationValue: z.number().int().positive().max(1000),
  durationUnit: z.enum(["days", "weeks", "months"]).default("months"),
  scope: z.string().min(1).max(5000),
  exclusions: z.string().max(5000).optional().nullable(),
  paymentTerms: z.string().max(2000).optional().nullable(),
  warranty: z.string().max(2000).optional().nullable(),
});

export const awardProposalSchema = z.object({
  proposalId: z.string().uuid(),
});

export type SubmitProposalInput = z.infer<typeof submitProposalSchema>;
export type AwardProposalInput = z.infer<typeof awardProposalSchema>;
