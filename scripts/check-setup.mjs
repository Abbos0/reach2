import envModule from '@next/env';
import { createTransport } from 'nodemailer';

envModule.loadEnvConfig(process.cwd(), true);

const marker = String.fromCharCode(36);
const config = {
  database: (process.env.DATABASE_URL ?? '').startsWith('postgresql://'),
  blobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  adminHash: (process.env.ADMIN_PASSWORD_HASH ?? '').startsWith(`${marker}argon2id${marker}`),
  gmailAppPassword: Boolean(process.env.GMAIL_APP_PASSWORD),
  cronSecret: (process.env.CRON_SECRET ?? '').length >= 32,
  telegramToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  telegramChatId: Boolean(process.env.TELEGRAM_CHAT_ID),
};

console.log(
  'CONFIG',
  Object.entries(config)
    .map(([key, valid]) => `${key}=${valid ? 'OK' : 'MISSING_OR_INVALID'}`)
    .join(' '),
);

let failed = Object.values(config).some((valid) => !valid);

try {
  const dbModule = await import('../lib/db.ts');
  const db = dbModule.default ?? dbModule;
  const rows = await db.getDb()`SELECT 1 AS ok`;
  console.log('NEON', rows[0]?.ok === 1 ? 'OK' : 'FAILED');
  failed ||= rows[0]?.ok !== 1;

  const authModule = await import('../lib/auth.ts');
  const auth = authModule.default ?? authModule;
  const passwordHash = await auth.getAdminPasswordHash();
  console.log('DB_ADMIN_CREDENTIAL', passwordHash ? 'OK' : 'MISSING');
  failed ||= !passwordHash;

  const recoveryTables = await db.getDb()`
    SELECT to_regclass('public.admin_recovery_state') AS recovery_state,
           to_regclass('public.admin_credentials') AS admin_credentials
  `;
  const tablesReady = Boolean(recoveryTables[0]?.recovery_state && recoveryTables[0]?.admin_credentials);
  console.log('RECOVERY_SCHEMA', tablesReady ? 'OK' : 'MISSING');
  failed ||= !tablesReady;

  if (tablesReady) {
    const state = await db.getDb()`
      SELECT failed_attempts,
             recovery_code_hash IS NOT NULL AS code_active,
             recovery_expires_at > NOW() AS code_unexpired
      FROM admin_recovery_state
      WHERE id = 1
    `;
    const row = state[0];
    console.log(
      'RECOVERY_STATE',
      row ? `failed_attempts=${row.failed_attempts} code_active=${row.code_active} code_unexpired=${row.code_unexpired}` : 'MISSING',
    );
  }
} catch (error) {
  console.log('NEON', 'FAILED', error?.constructor?.name ?? 'Error');
  failed = true;
}

try {
  const blobModule = await import('@vercel/blob');
  const blob = blobModule.default ?? blobModule;
  await blob.head('reach2-health-check-file-that-does-not-exist.pdf');
  console.log('PRIVATE_BLOB_AUTH', 'OK');
} catch (error) {
  if (error?.constructor?.name === 'BlobNotFoundError') {
    console.log('PRIVATE_BLOB_AUTH', 'OK');
  } else {
    console.log('PRIVATE_BLOB_AUTH', 'FAILED', error?.constructor?.name ?? 'Error');
    failed = true;
  }
}

try {
  const base = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/`;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const chatResponse = await fetch(`${base}getChat?chat_id=${encodeURIComponent(chatId)}`);
  const chat = await chatResponse.json();

  if (!chat.ok) {
    console.log('TELEGRAM_CHAT', 'FAILED', chat.description ?? 'Unknown Telegram error');
    failed = true;
  } else {
    console.log('TELEGRAM_CHAT', 'OK', `type=${chat.result?.type ?? 'unknown'}`);
    const meResponse = await fetch(`${base}getMe`);
    const me = await meResponse.json();

    if (!me.ok) {
      console.log('TELEGRAM_BOT', 'FAILED');
      failed = true;
    } else {
      const memberUrl = new URL(`${base}getChatMember`);
      memberUrl.searchParams.set('chat_id', chatId);
      memberUrl.searchParams.set('user_id', String(me.result.id));
      const memberResponse = await fetch(memberUrl);
      const member = await memberResponse.json();
      const isAdmin = ['administrator', 'creator'].includes(member.result?.status);
      const canPost = member.result?.can_post_messages;

      console.log(
        'TELEGRAM_BOT_ACCESS',
        member.ok ? `status=${member.result.status} can_post=${canPost ?? 'not_applicable'}` : 'FAILED',
      );

      if (!member.ok || !isAdmin || canPost === false) {
        failed = true;
      }
    }
  }
} catch (error) {
  console.log('TELEGRAM', 'FAILED', error?.constructor?.name ?? 'Error');
  failed = true;
}

if (config.gmailAppPassword) {
  try {
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.RECOVERY_EMAIL ?? 'abbosnorqulov2002@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, ''),
      },
    });
    await transporter.verify();
    console.log('GMAIL_SMTP', 'OK');
  } catch (error) {
    const details = [error?.code, error?.responseCode].filter(Boolean).join(' ');
    console.log('GMAIL_SMTP', 'FAILED', details || error?.constructor?.name || 'Error');
    failed = true;
  }
} else {
  console.log('GMAIL_SMTP', 'NOT_CONFIGURED');
}

try {
  const response = await fetch('http://localhost:3001/');
  console.log('LOCAL_APP', response.ok ? 'OK' : `FAILED HTTP=${response.status}`);
  failed ||= !response.ok;
} catch (error) {
  console.log('LOCAL_APP', 'NOT_RUNNING', error?.constructor?.name ?? 'Error');
  failed = true;
}

process.exitCode = failed ? 1 : 0;