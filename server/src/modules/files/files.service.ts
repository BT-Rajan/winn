import { randomUUID } from "node:crypto";
import { pool } from "../../db/pool";
import { NotFoundError, ForbiddenError } from "../../core/errors";
import { storageDriver } from "./storage";

export interface FileRow {
  id: string;
  owner_user_id: string;
  entity_type: string | null;
  entity_id: string | null;
  original_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  is_private: number;
  created_at: string;
}

export interface UploadFileInput {
  ownerUserId: string;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  entityType?: string;
  entityId?: string;
}

export async function uploadFile(input: UploadFileInput): Promise<FileRow> {
  const { storageKey } = await storageDriver.save(input.buffer, input.originalName);
  const id = randomUUID();

  await pool.query(
    `INSERT INTO files (id, owner_user_id, entity_type, entity_id, original_name, storage_key, mime_type, size_bytes, is_private)
     VALUES (:id, :ownerUserId, :entityType, :entityId, :originalName, :storageKey, :mimeType, :sizeBytes, 1)`,
    {
      id,
      ownerUserId: input.ownerUserId,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      originalName: input.originalName,
      storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
    },
  );

  return getFileOrThrow(id);
}

export async function getFileOrThrow(id: string): Promise<FileRow> {
  const [rows] = await pool.query(`SELECT * FROM files WHERE id = :id`, { id });
  const file = (rows as FileRow[])[0];
  if (!file) throw new NotFoundError("File");
  return file;
}

/** Documents are private by default — only the owner may read them in Pass 1. */
export function assertCanAccess(file: FileRow, requestingUserId: string): void {
  if (file.is_private && file.owner_user_id !== requestingUserId) {
    throw new ForbiddenError("You do not have access to this file");
  }
}
