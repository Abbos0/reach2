import { NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/auth';
import { finalizeUpload } from '@/lib/upload';

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const jobId = typeof body.jobId === 'string' ? body.jobId : '';

  if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
    return NextResponse.json({ ok: false, message: 'A valid jobId is required.' }, { status: 400 });
  }

  try {
    const completion = await finalizeUpload(jobId);

    if (!completion.ok) {
      return NextResponse.json({ ok: false, message: completion.message }, { status: completion.status });
    }

    return NextResponse.json({ ok: true, jobId, status: 'uploaded' });
  } catch {
    return NextResponse.json({ ok: false, message: 'Upload service is unavailable.' }, { status: 503 });
  }
}
