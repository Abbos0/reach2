import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/auth';
import { getUploadJob } from '@/lib/jobs';
import { finalizeUpload } from '@/lib/upload';
import { MAX_FILE_SIZE_BYTES } from '@/lib/validators';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);

  if (contentLength > 64 * 1024) {
    return NextResponse.json({ ok: false, message: 'Request is too large.' }, { status: 413 });
  }

  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;

  if (!body) {
    return NextResponse.json({ ok: false, message: 'Invalid upload request.' }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await isAdminRequest(request))) {
          throw new Error('Unauthorized.');
        }

        const payload = JSON.parse(clientPayload ?? '{}') as { jobId?: string };

        if (!payload.jobId || !/^[0-9a-f-]{36}$/i.test(payload.jobId)) {
          throw new Error('Upload session is invalid.');
        }

        const job = await getUploadJob(payload.jobId);

        if (!job || job.status !== 'created' || job.blob_pathname !== pathname) {
          throw new Error('Upload session is invalid or expired.');
        }

        return {
          allowedContentTypes: [job.mime_type],
          maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
          validUntil: Date.now() + 5 * 60 * 1000,
          cacheControlMaxAge: 60,
          tokenPayload: payload.jobId,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const jobId = tokenPayload ?? '';

        if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
          throw new Error('Upload callback is invalid.');
        }

        const job = await getUploadJob(jobId);

        if (!job || job.blob_pathname !== blob.pathname) {
          throw new Error('Upload callback does not match an active job.');
        }

        const completion = await finalizeUpload(jobId);

        if (!completion.ok) {
          throw new Error(completion.message);
        }
      },
    });

    return NextResponse.json(result);
  } catch {
    const isCompletion = body.type === 'blob.upload-completed';
    return NextResponse.json(
      { ok: false, message: 'Upload request could not be processed.' },
      { status: isCompletion ? 503 : 400 },
    );
  }
}