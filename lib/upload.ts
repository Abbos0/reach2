import { head } from '@vercel/blob';

import { getUploadJob, markUploadComplete } from './jobs';
import { validateFileDescriptor } from './validators';

export async function finalizeUpload(jobId: string): Promise<{ ok: boolean; status: number; message?: string }> {
  const job = await getUploadJob(jobId);

  if (!job) {
    return { ok: false, status: 404, message: 'Upload job was not found.' };
  }

  if (job.status === 'uploaded') {
    return { ok: true, status: 200 };
  }

  if (job.status !== 'created') {
    return { ok: false, status: 409, message: 'Upload job is not awaiting a file.' };
  }

  const metadata = await head(job.blob_pathname);
  const validation = validateFileDescriptor({
    name: job.file_name,
    mimeType: metadata.contentType,
    sizeBytes: metadata.size,
  });

  if (!validation.ok || metadata.size !== job.size_bytes) {
    return { ok: false, status: 400, message: 'Uploaded file does not match its validated metadata.' };
  }

  if (!(await markUploadComplete(jobId, job.blob_pathname))) {
    return { ok: false, status: 409, message: 'Upload job could not be completed.' };
  }

  return { ok: true, status: 200 };
}