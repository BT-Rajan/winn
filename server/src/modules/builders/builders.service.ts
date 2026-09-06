import { randomUUID } from "node:crypto";
import { NotFoundError, ValidationError } from "../../core/errors";
import { recordAuditEvent } from "../audit/audit.service";
import { notifyUser } from "../notifications/notifications.service";
import { assertCanAccess, getFileOrThrow } from "../files/files.service";
import {
  countBuilderDocuments,
  findProfileById,
  findProfileByUserId,
  insertBuilderDocument,
  insertProfile,
  listBuilderDocuments,
  markProfileSubmitted,
  removeBuilderDocument,
  updateProfileFields,
  type BuilderProfileRow,
} from "./builders.repository";
import type { UpdateBuilderProfileInput } from "./builders.schemas";

/** A builder has exactly one profile, created lazily on first visit so
 *  registration doesn't force an extra "create your profile" click —
 *  they land straight in the editor, matching "minimal steps". */
export async function getOrCreateMyProfile(userId: string): Promise<BuilderProfileRow> {
  const existing = await findProfileByUserId(userId);
  if (existing) return existing;

  const id = randomUUID();
  await insertProfile({ id, userId });

  await recordAuditEvent({
    actorUserId: userId,
    action: "builder_profile.created",
    entityType: "builder_profile",
    entityId: id,
  });

  const created = await findProfileById(id);
  if (!created) throw new NotFoundError("Builder profile");
  return created;
}

async function getOwnedProfileOrThrow(userId: string): Promise<BuilderProfileRow> {
  const profile = await findProfileByUserId(userId);
  if (!profile) throw new NotFoundError("Builder profile");
  return profile;
}

function assertEditable(profile: BuilderProfileRow): void {
  if (profile.verification_status === "pending" || profile.verification_status === "verified") {
    throw new ValidationError(
      profile.verification_status === "pending"
        ? "Your profile is under review and can't be edited right now"
        : "Your profile is verified and can't be edited here",
    );
  }
}

export async function getMyProfile(
  userId: string,
): Promise<{ profile: BuilderProfileRow; documents: Awaited<ReturnType<typeof listBuilderDocuments>> }> {
  const profile = await getOrCreateMyProfile(userId);
  const documents = await listBuilderDocuments(profile.id);
  return { profile, documents };
}

/** Autosave — one field (or a few) at a time as the builder fills in
 *  their company profile. */
export async function updateMyProfile(
  userId: string,
  patch: UpdateBuilderProfileInput,
): Promise<BuilderProfileRow> {
  const profile = await getOwnedProfileOrThrow(userId);
  assertEditable(profile);

  await updateProfileFields(profile.id, patch);

  return getOwnedProfileOrThrow(userId);
}

export async function attachDocumentToProfile(userId: string, fileId: string): Promise<void> {
  const profile = await getOwnedProfileOrThrow(userId);
  assertEditable(profile);

  const file = await getFileOrThrow(fileId);
  assertCanAccess(file, userId);

  await insertBuilderDocument({ id: randomUUID(), builderProfileId: profile.id, fileId });
}

export async function detachDocumentFromProfile(userId: string, documentId: string): Promise<void> {
  const profile = await getOwnedProfileOrThrow(userId);
  assertEditable(profile);

  await removeBuilderDocument(documentId, profile.id);
}

const REQUIRED_FIELDS: { key: keyof BuilderProfileRow; label: string }[] = [
  { key: "company_name", label: "Company name" },
  { key: "description", label: "Company description" },
];

/** The one place that defines "a builder profile is ready for review" —
 *  the client mirrors this for UX, but this is the rule that's enforced. */
function assertReadyToSubmit(profile: BuilderProfileRow, documentCount: number): void {
  const missing = REQUIRED_FIELDS.filter((field) => !profile[field.key]).map((field) => field.label);

  if (!profile.service_locations || profile.service_locations.length === 0) {
    missing.push("At least one service location");
  }
  if (!profile.specialties || profile.specialties.length === 0) {
    missing.push("At least one specialty");
  }
  if (documentCount === 0) missing.push("At least one verification document");

  if (missing.length > 0) {
    throw new ValidationError("Your profile isn't ready to submit yet", { missing });
  }
}

export async function submitProfileForVerification(userId: string): Promise<BuilderProfileRow> {
  const profile = await getOwnedProfileOrThrow(userId);
  assertEditable(profile);

  const documentCount = await countBuilderDocuments(profile.id);
  assertReadyToSubmit(profile, documentCount);

  await markProfileSubmitted(profile.id);

  await recordAuditEvent({
    actorUserId: userId,
    action: "builder_profile.submitted",
    entityType: "builder_profile",
    entityId: profile.id,
  });

  await notifyUser(
    userId,
    "Profile submitted for verification",
    "We've received your company profile. You'll be notified once it's verified.",
  );

  return getOwnedProfileOrThrow(userId);
}
