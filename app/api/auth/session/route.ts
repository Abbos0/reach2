import { NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authenticated = await isAdminRequest(request);
    return NextResponse.json({ ok: true, authenticated }, { status: authenticated ? 200 : 401 });
  } catch {
    return NextResponse.json({ ok: false, message: 'Authentication service is unavailable.' }, { status: 503 });
  }
}