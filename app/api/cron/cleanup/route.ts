import { timingSafeEqual } from 'node:crypto';

import { del } from '@vercel/blob';
import { NextResponse } from 'next/server';

import { config } from '@/lib/config';
import { deleteExpiredUploadJob, listExpiredUploadJobs } from '@/lib/jobs';

export const runtime = 'nodejs';

function hasCronAuthorization(request: Request): boolean {
  const secret = config.CRON_SECRET;
  const authorization = request.headers.get('authorization') ?? '';

  if (!secret || !authorization.startsWith('Bearer ')) {
    return false;
  }

  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);

  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function GET(request: Request) {
  if (!hasCronAuthorization(request)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const jobs = await listExpiredUploadJobs();
    let deleted = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        await del(job.blob_pathname);
        await deleteExpiredUploadJob(job.id);
        deleted += 1;
      } catch {
        failed += 1;
      }
    }

    return NextResponse.json({ ok: failed === 0, deleted, failed }, { status: failed ? 503 : 200 });
  } catch {
    return NextResponse.json({ ok: false, message: 'Cleanup service is unavailable.' }, { status: 503 });
  }
}