import { pool } from "../../db/pool";

export interface ProposalRow {
  id: string;
  project_id: string;
  builder_profile_id: string;
  price: string;
  duration_value: number;
  duration_unit: "days" | "weeks" | "months";
  scope: string;
  exclusions: string | null;
  payment_terms: string | null;
  warranty: string | null;
  status: "submitted" | "withdrawn" | "awarded" | "rejected";
  created_at: string;
  updated_at: string;
}

/** Proposal joined with the fields the customer's comparison view and the
 *  Pass 5 matcher need from the builder side — one query, no N+1 lookups
 *  per proposal in a project's comparison list. */
export interface ProposalWithBuilderRow extends ProposalRow {
  company_name: string;
  years_experience: number | null;
  service_locations: string | string[] | null;
  specialties: string | string[] | null;
  budget_range_min: string | null;
  budget_range_max: string | null;
}

export interface ProposalWithProjectRow extends ProposalRow {
  project_title: string;
  project_type: string | null;
  project_location: string | null;
  project_status: string;
}

export async function findProposal(projectId: string, builderProfileId: string): Promise<ProposalRow | null> {
  const [rows] = await pool.query(
    `SELECT * FROM proposals WHERE project_id = :projectId AND builder_profile_id = :builderProfileId`,
    { projectId, builderProfileId },
  );
  return (rows as ProposalRow[])[0] ?? null;
}

export async function findProposalById(id: string): Promise<ProposalRow | null> {
  const [rows] = await pool.query(`SELECT * FROM proposals WHERE id = :id`, { id });
  return (rows as ProposalRow[])[0] ?? null;
}

export async function insertProposal(row: {
  id: string;
  projectId: string;
  builderProfileId: string;
  price: number;
  durationValue: number;
  durationUnit: string;
  scope: string;
  exclusions: string | null;
  paymentTerms: string | null;
  warranty: string | null;
}): Promise<void> {
  await pool.query(
    `INSERT INTO proposals
       (id, project_id, builder_profile_id, price, duration_value, duration_unit, scope, exclusions, payment_terms, warranty, status)
     VALUES
       (:id, :projectId, :builderProfileId, :price, :durationValue, :durationUnit, :scope, :exclusions, :paymentTerms, :warranty, 'submitted')`,
    row,
  );
}

export async function updateProposalContent(
  id: string,
  row: {
    price: number;
    durationValue: number;
    durationUnit: string;
    scope: string;
    exclusions: string | null;
    paymentTerms: string | null;
    warranty: string | null;
  },
): Promise<void> {
  await pool.query(
    `UPDATE proposals SET
       price = :price,
       duration_value = :durationValue,
       duration_unit = :durationUnit,
       scope = :scope,
       exclusions = :exclusions,
       payment_terms = :paymentTerms,
       warranty = :warranty,
       status = 'submitted'
     WHERE id = :id`,
    { id, ...row },
  );
}

export async function markProposalWithdrawn(id: string): Promise<void> {
  await pool.query(`UPDATE proposals SET status = 'withdrawn' WHERE id = :id`, { id });
}

export async function listActiveProposalsForProject(projectId: string): Promise<ProposalWithBuilderRow[]> {
  const [rows] = await pool.query(
    `SELECT p.*, bp.company_name, bp.years_experience, bp.service_locations, bp.specialties,
            bp.budget_range_min, bp.budget_range_max
     FROM proposals p
     JOIN builder_profiles bp ON bp.id = p.builder_profile_id
     WHERE p.project_id = :projectId AND p.status IN ('submitted', 'awarded')
     ORDER BY p.created_at ASC`,
    { projectId },
  );
  return (rows as ProposalWithBuilderRow[]).map(normalizeBuilderJsonColumns);
}

export async function listProposalsForBuilder(builderProfileId: string): Promise<ProposalWithProjectRow[]> {
  const [rows] = await pool.query(
    `SELECT p.*, pr.title AS project_title, pr.project_type, pr.location AS project_location,
            pr.status AS project_status
     FROM proposals p
     JOIN projects pr ON pr.id = p.project_id
     WHERE p.builder_profile_id = :builderProfileId
     ORDER BY p.updated_at DESC`,
    { builderProfileId },
  );
  return rows as ProposalWithProjectRow[];
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

function normalizeBuilderJsonColumns(row: ProposalWithBuilderRow): ProposalWithBuilderRow {
  return {
    ...row,
    service_locations: parseJsonArray(row.service_locations),
    specialties: parseJsonArray(row.specialties),
  };
}

/** The one place a project is awarded: the winning proposal, every other
 *  still-open proposal on the same project, and the project's own status
 *  all move together in a single transaction — never a partial award. */
export async function awardProposalTransaction(
  projectId: string,
  awardedProposalId: string,
): Promise<void> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(`UPDATE proposals SET status = 'awarded' WHERE id = :id`, {
      id: awardedProposalId,
    });

    await connection.query(
      `UPDATE proposals SET status = 'rejected'
       WHERE project_id = :projectId AND id != :awardedProposalId AND status = 'submitted'`,
      { projectId, awardedProposalId },
    );

    await connection.query(`UPDATE projects SET status = 'awarded' WHERE id = :projectId`, { projectId });

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function listRejectedBuilderUserIds(projectId: string, awardedProposalId: string): Promise<string[]> {
  const [rows] = await pool.query(
    `SELECT bp.user_id
     FROM proposals p
     JOIN builder_profiles bp ON bp.id = p.builder_profile_id
     WHERE p.project_id = :projectId AND p.id != :awardedProposalId AND p.status = 'rejected'`,
    { projectId, awardedProposalId },
  );
  return (rows as { user_id: string }[]).map((row) => row.user_id);
}
