import { NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/auth';
import { createUploadJob } from '@/lib/jobs';
import { validateFileDescriptor } from '@/lib/validators';

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name : '';
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';
  const sizeBytes = typeof body.sizeBytes === 'number' ? body.sizeBytes : Number(body.sizeBytes ?? 0);

  const validation = validateFileDescriptor({
    name,
    mimeType,
    sizeBytes,
  });

  if (!validation.ok) {
    return NextResponse.json({ ok: false, message: validation.reason }, { status: 400 });
  }

  try {
    const job = await createUploadJob({
      fileName: validation.normalizedName ?? name,
      mimeType,
      sizeBytes,
    });

    return NextResponse.json({ ok: true, jobId: job.id, pathname: job.pathname, access: 'private' });
  } catch {
    return NextResponse.json({ ok: false, message: 'Upload service is unavailable.' }, { status: 503 });
  }
}
