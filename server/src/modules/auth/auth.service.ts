import { randomUUID, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { ConflictError, UnauthorizedError } from "../../core/errors";
import { pool } from "../../db/pool";
import {
  assignRole,
  findUserByEmail,
  findUserById,
  getRolesForUser,
  insertUser,
} from "../users/users.repository";
import { recordAuditEvent } from "../audit/audit.service";
import { notifyUser } from "../notifications/notifications.service";
import type { LoginInput, RegisterInput } from "./auth.schemas";

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResult extends TokenPair {
  user: { id: string; email: string; fullName: string; roles: string[] };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function signAccessToken(userId: string, roles: string[]): string {
  return jwt.sign({ sub: userId, roles }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  } as jwt.SignOptions);
}

async function issueRefreshToken(userId: string): Promise<string> {
  const token = randomUUID() + randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (:id, :userId, :tokenHash, :expiresAt)`,
    { id: randomUUID(), userId, tokenHash: hashToken(token), expiresAt },
  );

  return token;
}

export async function register(input: RegisterInput, ipAddress?: string): Promise<AuthResult> {
  const existing = await findUserByEmail(input.email);
  if (existing) throw new ConflictError("An account with this email already exists");

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(input.password, 12);

  await insertUser({ id, email: input.email, passwordHash, fullName: input.fullName });
  await assignRole(id, input.role);

  await recordAuditEvent({
    actorUserId: id,
    action: "user.registered",
    entityType: "user",
    entityId: id,
    metadata: { role: input.role },
    ipAddress,
  });

  await notifyUser(id, "Welcome to Winn", "Your account has been created.");

  const roles = await getRolesForUser(id);
  const accessToken = signAccessToken(id, roles);
  const refreshToken = await issueRefreshToken(id);

  return {
    accessToken,
    refreshToken,
    user: { id, email: input.email, fullName: input.fullName, roles },
  };
}

export async function login(input: LoginInput, ipAddress?: string): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);
  if (!user) throw new UnauthorizedError("Invalid email or password");

  const valid = await bcrypt.compare(input.password, user.password_hash);
  if (!valid) throw new UnauthorizedError("Invalid email or password");

  if (user.status === "suspended") {
    throw new UnauthorizedError("This account has been suspended");
  }

  const roles = await getRolesForUser(user.id);
  const accessToken = signAccessToken(user.id, roles);
  const refreshToken = await issueRefreshToken(user.id);

  await recordAuditEvent({
    actorUserId: user.id,
    action: "user.login",
    entityType: "user",
    entityId: user.id,
    ipAddress,
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, fullName: user.full_name, roles },
  };
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  const tokenHash = hashToken(refreshToken);
  const [rows] = await pool.query(
    `SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = :tokenHash`,
    { tokenHash },
  );
  const record = (rows as { id: string; user_id: string; expires_at: string; revoked_at: string | null }[])[0];

  if (!record || record.revoked_at || new Date(record.expires_at) < new Date()) {
    throw new UnauthorizedError("Session expired, please log in again");
  }

  // Rotate: revoke the used token, issue a new one.
  await pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = :id`, { id: record.id });

  const user = await findUserById(record.user_id);
  if (!user || user.status === "suspended") throw new UnauthorizedError();

  const roles = await getRolesForUser(user.id);
  const accessToken = signAccessToken(user.id, roles);
  const newRefreshToken = await issueRefreshToken(user.id);

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await pool.query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = :tokenHash`, { tokenHash });
}
