import { neon } from '@neondatabase/serverless';

import { config } from './config';

export const sql = config.DATABASE_URL ? neon(config.DATABASE_URL) : null;

export function getDb() {
  if (!sql) {
    throw new Error('DATABASE_URL is not configured. Set it in your environment to enable metadata storage.');
  }

  return sql;
}
