import { pool } from "../../db/pool";

export interface BuilderProfileRow {
  id: string;
  user_id: string;
  company_name: string;
  description: string | null;
  years_experience: number | null;
  budget_range_min: string | null;
  budget_range_max: string | null;
  service_locations: string[] | null;
  specialties: string[] | null;
  verification_status: "unverified" | "pending" | "verified" | "rejected";
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuilderDocumentRow {
  id: string;
  builder_profile_id: string;
  file_id: string;
  created_at: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
}

export async function findProfileByUserId(userId: string): Promise<BuilderProfileRow | null> {
  const [rows] = await pool.query(`SELECT * FROM builder_profiles WHERE user_id = :userId`, { userId });
  const row = (rows as BuilderProfileRow[])[0];
  return row ? normalizeJsonColumns(row) : null;
}

export async function findProfileById(id: string): Promise<BuilderProfileRow | null> {
  const [rows] = await pool.query(`SELECT * FROM builder_profiles WHERE id = :id`, { id });
  const row = (rows as BuilderProfileRow[])[0];
  return row ? normalizeJsonColumns(row) : null;
}

/** mysql2 doesn't consistently auto-parse JSON columns across driver
 *  versions — normalize here once rather than trusting every caller
 *  to remember whether service_locations/specialties are strings. */
function normalizeJsonColumns(row: BuilderProfileRow): BuilderProfileRow {
  return {
    ...row,
    service_locations: parseJsonArray(row.service_locations),
    specialties: parseJsonArray(row.specialties),
  };
}

function parseJsonArray(value: unknown): string[] | null {
  if (value == null) return null;
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

export async function insertProfile(row: { id: string; userId: string }): Promise<void> {
  await pool.query(`INSERT INTO builder_profiles (id, user_id) VALUES (:id, :userId)`, row);
}

const UPDATABLE_COLUMNS: Record<string, string> = {
  companyName: "company_name",
  description: "description",
  yearsExperience: "years_experience",
  budgetRangeMin: "budget_range_min",
  budgetRangeMax: "budget_range_max",
  serviceLocations: "service_locations",
  specialties: "specialties",
};

const JSON_COLUMNS = new Set(["serviceLocations", "specialties"]);

/** Builds `SET col = :col, ...` from only the fields present in the patch,
 *  so autosaving one field never touches the others. Array fields are
 *  JSON-encoded here — the only place that needs to know the column is JSON. */
export async function updateProfileFields(id: string, patch: Record<string, unknown>): Promise<void> {
  const entries = Object.entries(patch).filter(([key]) => key in UPDATABLE_COLUMNS);
  if (entries.length === 0) return;

  const setClause = entries.map(([key]) => `${UPDATABLE_COLUMNS[key]} = :${key}`).join(", ");
  const params: Record<string, unknown> = { id };
  for (const [key, value] of entries) {
    params[key] = JSON_COLUMNS.has(key) ? JSON.stringify(value) : value;
  }

  await pool.query(`UPDATE builder_profiles SET ${setClause} WHERE id = :id`, params as never);
}

export async function markProfileSubmitted(id: string): Promise<void> {
  await pool.query(
    `UPDATE builder_profiles SET verification_status = 'pending', submitted_at = NOW() WHERE id = :id`,
    { id },
  );
}

export async function insertBuilderDocument(row: {
  id: string;
  builderProfileId: string;
  fileId: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO builder_documents (id, builder_profile_id, file_id) VALUES (:id, :builderProfileId, :fileId)`,
    row,
  );
}

export async function removeBuilderDocument(id: string, builderProfileId: string): Promise<void> {
  await pool.query(
    `DELETE FROM builder_documents WHERE id = :id AND builder_profile_id = :builderProfileId`,
    { id, builderProfileId },
  );
}

export async function listBuilderDocuments(builderProfileId: string): Promise<BuilderDocumentRow[]> {
  const [rows] = await pool.query(
    `SELECT bd.id, bd.builder_profile_id, bd.file_id, bd.created_at, f.original_name, f.mime_type, f.size_bytes
     FROM builder_documents bd
     JOIN files f ON f.id = bd.file_id
     WHERE bd.builder_profile_id = :builderProfileId
     ORDER BY bd.created_at ASC`,
    { builderProfileId },
  );
  return rows as BuilderDocumentRow[];
}

export async function countBuilderDocuments(builderProfileId: string): Promise<number> {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM builder_documents WHERE builder_profile_id = :builderProfileId`,
    { builderProfileId },
  );
  return Number((rows as { count: number }[])[0]?.count ?? 0);
}
