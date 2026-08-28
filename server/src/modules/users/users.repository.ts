import { pool } from "../../db/pool";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  status: "pending" | "active" | "suspended";
  created_at: string;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const [rows] = await pool.query(`SELECT * FROM users WHERE email = :email`, { email });
  return (rows as UserRow[])[0] ?? null;
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const [rows] = await pool.query(`SELECT * FROM users WHERE id = :id`, { id });
  return (rows as UserRow[])[0] ?? null;
}

export async function insertUser(user: {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO users (id, email, password_hash, full_name, status) VALUES (:id, :email, :passwordHash, :fullName, 'active')`,
    user,
  );
}

export async function assignRole(userId: string, roleName: "admin" | "customer" | "builder"): Promise<void> {
  await pool.query(
    `INSERT IGNORE INTO user_roles (user_id, role_id) SELECT :userId, id FROM roles WHERE name = :roleName`,
    { userId, roleName },
  );
}

export async function getRolesForUser(userId: string): Promise<string[]> {
  const [rows] = await pool.query(
    `SELECT r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = :userId`,
    { userId },
  );
  return (rows as { name: string }[]).map((r) => r.name);
}
