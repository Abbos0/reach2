import { randomInt } from 'node:crypto';

// import argon2 from 'argon2';

import bcrypt from 'bcryptjs';
import { createTransport } from 'nodemailer';

import { config } from './config';
import { getDb } from './db';
import { hashPassword } from './auth';

const FAILED_LOGIN_LIMIT = 5;
const RECOVERY_CODE_ATTEMPT_LIMIT = 5;

export async function recordFailedLogin(): Promise<boolean> {
  const sql = getDb();
  const failures = await sql`
    INSERT INTO admin_recovery_state (id, failed_attempts)
    VALUES (1, 1)
    ON CONFLICT (id) DO UPDATE
      SET failed_attempts = admin_recovery_state.failed_attempts + 1,
          updated_at = NOW()
    RETURNING failed_attempts
  `;

  if (Number(failures[0]?.failed_attempts ?? 0) < FAILED_LOGIN_LIMIT || !config.GMAIL_APP_PASSWORD) {
    return false;
  }

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  // const codeHash = await argon2.hash(code, { type: argon2.argon2id });
const codeHash = await hashPassword(code);

  const claimed = await sql`
    UPDATE admin_recovery_state
    SET recovery_code_hash = ${codeHash},
        recovery_expires_at = NOW() + INTERVAL '10 minutes',
        recovery_attempts = 0,
        last_code_sent_at = NOW(),
        updated_at = NOW()
    WHERE id = 1
      AND failed_attempts >= ${FAILED_LOGIN_LIMIT}
      AND (
        last_code_sent_at IS NULL
        OR last_code_sent_at <= NOW() - INTERVAL '15 minutes'
      )
    RETURNING id
  `;

  if (claimed.length === 0) {
    return false;
  }

  try {
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: config.RECOVERY_EMAIL,
        pass: config.GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
      },
    });

    await transporter.sendMail({
      from: `REACH2 <${config.RECOVERY_EMAIL}>`,
      to: config.RECOVERY_EMAIL,
      subject: 'REACH2 parolni tiklash kodi',
      text: `Parolni tiklash kodingiz: ${code}\n\nKod 10 daqiqa amal qiladi. Agar bu so‘rov sizdan bo‘lmasa, xatni e’tiborsiz qoldiring. Hech kimga kodingizni bermang.`,
    });

    return true;
  } catch (error) {
    await sql`
      UPDATE admin_recovery_state
      SET recovery_code_hash = NULL,
          recovery_expires_at = NULL,
          recovery_attempts = 0,
          last_code_sent_at = NULL,
          updated_at = NOW()
      WHERE id = 1 AND recovery_code_hash = ${codeHash}
    `;
    console.error('Recovery email delivery failed:', error instanceof Error ? error.name : 'UnknownError');
    return false;
  }
}

export async function clearFailedLoginState(): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE admin_recovery_state
    SET failed_attempts = 0,
        recovery_code_hash = NULL,
        recovery_expires_at = NULL,
        recovery_attempts = 0,
        last_code_sent_at = NULL,
        updated_at = NOW()
    WHERE id = 1
  `;
}

export async function resetAdminPasswordWithCode(code: string, password: string): Promise<boolean> {
  if (!/^\d{6}$/.test(code) || password.length < 5) {
    return false;
  }

  const sql = getDb();
  const attempts = await sql`
    UPDATE admin_recovery_state
    SET recovery_attempts = recovery_attempts + 1,
        updated_at = NOW()
    WHERE id = 1
      AND recovery_code_hash IS NOT NULL
      AND recovery_expires_at > NOW()
      AND recovery_attempts < ${RECOVERY_CODE_ATTEMPT_LIMIT}
    RETURNING recovery_code_hash, recovery_attempts
  `;

  if (attempts.length === 0) {
    return false;
  }

  const storedCodeHash = String(attempts[0].recovery_code_hash);
  let validCode = false;

  try {
    // validCode = await argon2.verify(storedCodeHash, code);
    validCode = await bcrypt.compare(code, storedCodeHash);
  } catch {
    validCode = false;
  }

  if (!validCode) {
    if (Number(attempts[0].recovery_attempts) >= RECOVERY_CODE_ATTEMPT_LIMIT) {
      await sql`
        UPDATE admin_recovery_state
        SET recovery_code_hash = NULL,
            recovery_expires_at = NULL,
            updated_at = NOW()
        WHERE id = 1 AND recovery_code_hash = ${storedCodeHash}
      `;
    }

    return false;
  }

  const newPasswordHash = await hashPassword(password);
  const updated = await sql`
    WITH consumed AS (
      UPDATE admin_recovery_state
      SET failed_attempts = 0,
          recovery_code_hash = NULL,
          recovery_expires_at = NULL,
          recovery_attempts = 0,
          last_code_sent_at = NULL,
          updated_at = NOW()
      WHERE id = 1
        AND recovery_code_hash = ${storedCodeHash}
        AND recovery_expires_at > NOW()
      RETURNING id
    ), credentials AS (
      INSERT INTO admin_credentials (id, password_hash)
      SELECT 1, ${newPasswordHash} FROM consumed
      ON CONFLICT (id) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            updated_at = NOW()
      RETURNING id
    ), revoked_sessions AS (
      DELETE FROM admin_sessions
      WHERE EXISTS (SELECT 1 FROM credentials)
      RETURNING token_hash
    )
    SELECT id FROM credentials
  `;

  return updated.length === 1;
}