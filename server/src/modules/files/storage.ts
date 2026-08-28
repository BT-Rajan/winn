import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { env } from "../../config/env";

/**
 * Storage is behind this interface so Pass 2+ (project documents) and
 * later production hardening (move to S3) never touch calling code —
 * only this file changes.
 */
export interface StorageDriver {
  save(buffer: Buffer, originalName: string): Promise<{ storageKey: string }>;
  resolvePath(storageKey: string): string;
}

class LocalDiskStorage implements StorageDriver {
  private readonly root: string;

  constructor(root: string) {
    this.root = root;
    fs.mkdirSync(this.root, { recursive: true });
  }

  async save(buffer: Buffer, originalName: string): Promise<{ storageKey: string }> {
    const ext = path.extname(originalName);
    const storageKey = `${randomUUID()}${ext}`;
    fs.writeFileSync(path.join(this.root, storageKey), buffer);
    return { storageKey };
  }

  resolvePath(storageKey: string): string {
    return path.join(this.root, storageKey);
  }
}

export const storageDriver: StorageDriver = new LocalDiskStorage(env.files.storageDir);
