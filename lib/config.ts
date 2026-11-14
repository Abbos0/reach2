import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD_HASH: z.string().optional(),
  RECOVERY_EMAIL: z.string().email().default('abbosnorqulov2002@gmail.com'),
  GMAIL_APP_PASSWORD: z.string().optional(),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  CRON_SECRET: z.union([z.string().min(32), z.literal('')]).optional(),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
});

export const config = envSchema.parse(process.env);
