import fs from "node:fs";
import path from "node:path";
import { pool } from "./pool";
import { logger } from "../core/logger";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const [rows] = await pool.query("SELECT name FROM schema_migrations");
  return new Set((rows as { name: string }[]).map((r) => r.name));
}

async function run() {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      logger.info("Migration already applied, skipping", { file });
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const statement of statements) {
        await conn.query(statement);
      }
      await conn.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
      await conn.commit();
      logger.info("Applied migration", { file });
    } catch (err) {
      await conn.rollback();
      logger.error("Migration failed", { file, error: (err as Error).message });
      throw err;
    } finally {
      conn.release();
    }
  }

  logger.info("Migrations complete");
  process.exit(0);
}

run().catch((err) => {
  logger.error("Migration run failed", { error: (err as Error).message });
  process.exit(1);
});
