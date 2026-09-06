import { pool } from "../../db/pool";

export interface ProjectRow {
  id: string;
  customer_id: string;
  title: string;
  project_type: string | null;
  location: string | null;
  size_value: string | null;
  size_unit: string | null;
  budget_min: string | null;
  budget_max: string | null;
  closing_date: string | null;
  requirements: string | null;
  status: "draft" | "submitted" | "verified" | "rejected";
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocumentRow {
  id: string;
  project_id: string;
  file_id: string;
  created_at: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
}

export async function insertProject(row: {
  id: string;
  customerId: string;
  title: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO projects (id, customer_id, title) VALUES (:id, :customerId, :title)`,
    row,
  );
}

export async function findProjectById(id: string): Promise<ProjectRow | null> {
  const [rows] = await pool.query(`SELECT * FROM projects WHERE id = :id`, { id });
  return (rows as ProjectRow[])[0] ?? null;
}

export async function listProjectsForCustomer(customerId: string): Promise<ProjectRow[]> {
  const [rows] = await pool.query(
    `SELECT * FROM projects WHERE customer_id = :customerId ORDER BY updated_at DESC`,
    { customerId },
  );
  return rows as ProjectRow[];
}

const UPDATABLE_COLUMNS: Record<string, string> = {
  title: "title",
  projectType: "project_type",
  location: "location",
  sizeValue: "size_value",
  sizeUnit: "size_unit",
  budgetMin: "budget_min",
  budgetMax: "budget_max",
  closingDate: "closing_date",
  requirements: "requirements",
};

/** Builds `SET col = :col, ...` from only the fields actually present in
 *  the patch, so an autosave of one field never touches the others. */
export async function updateProjectFields(
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const entries = Object.entries(patch).filter(([key]) => key in UPDATABLE_COLUMNS);
  if (entries.length === 0) return;

  const setClause = entries.map(([key]) => `${UPDATABLE_COLUMNS[key]} = :${key}`).join(", ");
  const params: Record<string, unknown> = { id };
  for (const [key, value] of entries) params[key] = value;

  // Dynamic column set, so the param object's shape isn't known statically —
  // every value here already passed zod validation in updateProjectSchema.
  await pool.query(`UPDATE projects SET ${setClause} WHERE id = :id`, params as never);
}

export async function markProjectSubmitted(id: string): Promise<void> {
  await pool.query(
    `UPDATE projects SET status = 'submitted', submitted_at = NOW() WHERE id = :id`,
    { id },
  );
}

export async function insertProjectDocument(row: {
  id: string;
  projectId: string;
  fileId: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO project_documents (id, project_id, file_id) VALUES (:id, :projectId, :fileId)`,
    row,
  );
}

export async function removeProjectDocument(id: string, projectId: string): Promise<void> {
  await pool.query(`DELETE FROM project_documents WHERE id = :id AND project_id = :projectId`, {
    id,
    projectId,
  });
}

export async function listProjectDocuments(projectId: string): Promise<ProjectDocumentRow[]> {
  const [rows] = await pool.query(
    `SELECT pd.id, pd.project_id, pd.file_id, pd.created_at, f.original_name, f.mime_type, f.size_bytes
     FROM project_documents pd
     JOIN files f ON f.id = pd.file_id
     WHERE pd.project_id = :projectId
     ORDER BY pd.created_at ASC`,
    { projectId },
  );
  return rows as ProjectDocumentRow[];
}

export async function countProjectDocuments(projectId: string): Promise<number> {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM project_documents WHERE project_id = :projectId`,
    { projectId },
  );
  return Number((rows as { count: number }[])[0]?.count ?? 0);
}

/** Pass 4 (Marketplace) reads verified projects straight from this same
 *  table — a project has exactly one status, one source of truth,
 *  never a separate "published listings" copy. */
export async function listVerifiedProjects(): Promise<ProjectRow[]> {
  const [rows] = await pool.query(
    `SELECT * FROM projects WHERE status = 'verified' ORDER BY submitted_at DESC`,
  );
  return rows as ProjectRow[];
}

export async function findVerifiedProjectById(id: string): Promise<ProjectRow | null> {
  const [rows] = await pool.query(`SELECT * FROM projects WHERE id = :id AND status = 'verified'`, { id });
  return (rows as ProjectRow[])[0] ?? null;
}
