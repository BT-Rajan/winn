import { randomUUID } from "node:crypto";
import { pool } from "../../db/pool";

export interface AuditEntry {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Every module that mutates state calls this instead of writing its
 * own history rows. One writer, one table, one format.
 */
export async function recordAuditEvent(entry: AuditEntry): Promise<void> {
  await pool.query(
    `INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, metadata, ip_address)
     VALUES (:id, :actorUserId, :action, :entityType, :entityId, :metadata, :ipAddress)`,
    {
      id: randomUUID(),
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      ipAddress: entry.ipAddress ?? null,
    },
  );
}
