import argon2 from 'argon2';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { stdin, stdout } from 'node:process';

function readHidden(prompt) {
  return new Promise((resolveInput, rejectInput) => {
    if (!stdin.isTTY || typeof stdin.setRawMode !== 'function') {
      rejectInput(new Error('Run this command in an interactive terminal.'));
      return;
    }

    let value = '';

    function finish() {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
    }

    function onData(chunk) {
      for (const character of chunk) {
        if (character === '\u0003') {
          finish();
          rejectInput(new Error('Cancelled.'));
          return;
        }

        if (character === '\r' || character === '\n') {
          finish();
          resolveInput(value);
          return;
        }

        if (character === '\u007f' || character === '\b') {
          if (value.length > 0) {
            value = value.slice(0, -1);
            stdout.write('\b \b');
          }
          continue;
        }

        if (character >= ' ') {
          value += character;
          stdout.write('*');
        }
      }
    }

    stdout.write(prompt);
    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

async function readPipedPasswords() {
  stdin.setEncoding('utf8');
  let input = '';

  for await (const chunk of stdin) {
    input += chunk;
  }

  const [password = '', confirmation = ''] = input.replace(/\r\n/g, '\n').split('\n');
  return { password, confirmation };
}

try {
  const envPath = resolve(process.cwd(), '.env.local');
  const currentEnv = await readFile(envPath, 'utf8');
  const lines = currentEnv.split(/\r?\n/);
  const hashLines = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^\s*ADMIN_PASSWORD_HASH\s*=/.test(line));

  if (hashLines.length !== 1) {
    throw new Error('.env.local must contain exactly one ADMIN_PASSWORD_HASH entry.');
  }

  const { password, confirmation } = process.argv.includes('--stdin')
    ? await readPipedPasswords()
    : {
        password: await readHidden('New admin password (5+ characters; hidden): '),
        confirmation: undefined,
      };

  if (password.length < 5) {
    throw new Error('Use a password with at least 5 characters.');
  }

  const confirmedPassword = confirmation ?? await readHidden('Confirm new password: ');

  if (password !== confirmedPassword) {
    throw new Error('Passwords do not match. No changes were made.');
  }

  const hash = await argon2.hash(password, { type: argon2.argon2id });
  const { DATABASE_URL } = process.env;

  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is required to save the admin password.');
  }

  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(DATABASE_URL);
  await sql`
    INSERT INTO admin_credentials (id, password_hash)
    VALUES (1, ${hash})
    ON CONFLICT (id) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          updated_at = NOW()
  `;

  lines[hashLines[0].index] = `ADMIN_PASSWORD_HASH="${hash.replaceAll('$', '\\$')}"`;
  await writeFile(envPath, lines.join(currentEnv.includes('\r\n') ? '\r\n' : '\n'), 'utf8');
  stdout.write('Admin password hash saved to .env.local. Restart the Next.js server.\n');
} catch (error) {
  stdout.write(`${error instanceof Error ? error.message : 'Password update failed.'}\n`);
  process.exitCode = 1;
}