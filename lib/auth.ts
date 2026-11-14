import { createHash, randomBytes } from 'node:crypto';

// import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

import { config } from './config';
import { getDb } from './db';

export const ADMIN_SESSION_COOKIE = 'reach2_session';
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

export async function getAdminPasswordHash(): Promise<string | null> {
  const sql = getDb();
  let credentials = await sql`
    SELECT password_hash
    FROM admin_credentials
    WHERE id = 1
    LIMIT 1
  `;

  if (credentials.length > 0) {
    return String(credentials[0].password_hash);
  }

  if (!config.ADMIN_PASSWORD_HASH) {
    return null;
  }

  await sql`
    INSERT INTO admin_credentials (id, password_hash)
    VALUES (1, ${config.ADMIN_PASSWORD_HASH})
    ON CONFLICT (id) DO NOTHING
  `;

  credentials = await sql`
    SELECT password_hash
    FROM admin_credentials
    WHERE id = 1
    LIMIT 1
  `;

  return credentials.length > 0 ? String(credentials[0].password_hash) : null;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const passwordHash = await getAdminPasswordHash();
  if (!passwordHash) {
    return false;
  }


// export async function verifyPassword(password: string): Promise<boolean> {
//   const passwordHash = await getAdminPasswordHash();

//   if (!passwordHash) {
//     return false;
//   }

  // try {
  //   return await argon2.verify(passwordHash, password);
  // } catch {
  //   return false;
  // }

  try {
  return await bcrypt.compare(password, passwordHash);
} catch {
  return false;
}
}

// export async function hashPassword(password: string): Promise<string> {
//   return argon2.hash(password, { type: argon2.argon2id });
// }


export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function readSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');

    if (separator < 0 || cookie.slice(0, separator).trim() !== ADMIN_SESSION_COOKIE) {
      continue;
    }

    const token = cookie.slice(separator + 1).trim();
    return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
  }

  return null;
}

export async function createAdminSession(): Promise<string> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const sql = getDb();

  await sql`
    INSERT INTO admin_sessions (token_hash, expires_at)
    VALUES (${hashSessionToken(token)}, ${expiresAt.toISOString()})
  `;

  return token;
}

export async function isAdminRequest(request: Request): Promise<boolean> {
  const token = readSessionToken(request);

  if (!token) {
    return false;
  }

  const sql = getDb();
  const sessions = await sql`
    SELECT token_hash
    FROM admin_sessions
    WHERE token_hash = ${hashSessionToken(token)}
      AND expires_at > NOW()
    LIMIT 1
  `;

  return sessions.length === 1;
}

export async function revokeAdminSession(request: Request): Promise<void> {
  const token = readSessionToken(request);

  if (!token) {
    return;
  }

  const sql = getDb();
  await sql`DELETE FROM admin_sessions WHERE token_hash = ${hashSessionToken(token)}`;
}
