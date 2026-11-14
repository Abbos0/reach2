import { randomUUID } from 'node:crypto';

import { getDb } from './db';
import { getFileExtension } from './validators';

export type UploadJob = {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  blob_pathname: string;
  status: 'created' | 'uploaded' | 'sending' | 'sent' | 'failed';
  telegram_message_id: number | null;
};

export type ExpiredUploadJob = {
  id: string;
  blob_pathname: string;
};

export async function createUploadJob({
  fileName,
  mimeType,
  sizeBytes,
}: {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ id: string; pathname: string }> {
  const id = randomUUID();
  const pathname = `uploads/${id}.${getFileExtension(fileName)}`;
  const sql = getDb();

  await sql`
    INSERT INTO upload_jobs (id, file_name, mime_type, size_bytes, blob_pathname, status, expires_at)
    VALUES (
      ${id}, ${fileName}, ${mimeType}, ${sizeBytes}, ${pathname}, 'created',
      NOW() + INTERVAL '24 hours'
    )
  `;

  return { id, pathname };
}

export async function getUploadJob(id: string): Promise<UploadJob | null> {
  const sql = getDb();
  const jobs = await sql`
    SELECT id, file_name, mime_type, size_bytes, blob_pathname, status, telegram_message_id
    FROM upload_jobs
    WHERE id = ${id} AND expires_at > NOW()
    LIMIT 1
  `;

  return (jobs[0] as unknown as UploadJob | undefined) ?? null;
}

export async function markUploadComplete(id: string, pathname: string): Promise<boolean> {
  const sql = getDb();
  const jobs = await sql`
    UPDATE upload_jobs
    SET status = 'uploaded', updated_at = NOW(), expires_at = NOW() + INTERVAL '24 hours'
    WHERE id = ${id}
      AND blob_pathname = ${pathname}
      AND status = 'created'
    RETURNING id
  `;

  return jobs.length === 1;
}

export async function claimUploadJob(id: string): Promise<UploadJob | null> {
  const sql = getDb();
  const jobs = await sql`
    UPDATE upload_jobs
    SET status = 'sending', updated_at = NOW(), attempts = attempts + 1
    WHERE id = ${id}
      AND expires_at > NOW()
      AND (
        status IN ('uploaded', 'failed')
        OR (status = 'sending' AND updated_at < NOW() - INTERVAL '5 minutes')
      )
    RETURNING id, file_name, mime_type, size_bytes, blob_pathname, status, telegram_message_id
  `;

  return (jobs[0] as unknown as UploadJob | undefined) ?? null;
}

export async function finishUploadJob({
  id,
  status,
  messageId,
  error,
}: {
  id: string;
  status: 'sent' | 'failed';
  messageId?: number;
  error?: string;
}): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE upload_jobs
    SET status = ${status},
        telegram_message_id = ${messageId ?? null},
        delivery_error = ${error?.slice(0, 500) ?? null},
        updated_at = NOW()
    WHERE id = ${id} AND status = 'sending'
  `;
}

export async function listExpiredUploadJobs(): Promise<ExpiredUploadJob[]> {
  const sql = getDb();
  const jobs = await sql`
    SELECT id, blob_pathname
    FROM upload_jobs
    WHERE expires_at <= NOW()
      AND (status <> 'sending' OR updated_at < NOW() - INTERVAL '10 minutes')
    ORDER BY expires_at
    LIMIT 100
  `;

  return jobs as unknown as ExpiredUploadJob[];
}

export async function deleteExpiredUploadJob(id: string): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM upload_jobs WHERE id = ${id} AND expires_at <= NOW()`;
}