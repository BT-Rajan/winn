import { randomUUID } from "node:crypto";
import { pool } from "../../db/pool";

export interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  channel: "in_app";
  read_at: string | null;
  created_at: string;
}

/**
 * In-app delivery only for Pass 1. The `channel` field and this single
 * entry point are what let email/SMS plug in later without callers
 * (auth, verification, matching, etc.) changing how they notify a user.
 */
export async function notifyUser(userId: string, title: string, body?: string): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (id, user_id, channel, title, body) VALUES (:id, :userId, 'in_app', :title, :body)`,
    { id: randomUUID(), userId, title, body: body ?? null },
  );
}

export async function listNotifications(userId: string): Promise<NotificationRow[]> {
  const [rows] = await pool.query(
    `SELECT id, title, body, channel, read_at, created_at
     FROM notifications WHERE user_id = :userId ORDER BY created_at DESC LIMIT 50`,
    { userId },
  );
  return rows as NotificationRow[];
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  await pool.query(
    `UPDATE notifications SET read_at = NOW() WHERE id = :notificationId AND user_id = :userId`,
    { notificationId, userId },
  );
}
