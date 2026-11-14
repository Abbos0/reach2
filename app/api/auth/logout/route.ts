import { NextResponse } from 'next/server';

import { ADMIN_SESSION_COOKIE, revokeAdminSession } from '@/lib/auth';
import { config } from '@/lib/config';

export async function POST(request: Request) {
  try {
    await revokeAdminSession(request);
  } catch {
    return NextResponse.json({ ok: false, message: 'Authentication service is unavailable.' }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}