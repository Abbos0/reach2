import { NextResponse } from 'next/server';

import { ADMIN_SESSION_COOKIE, createAdminSession, SESSION_TTL_SECONDS, verifyPassword } from '@/lib/auth';
import { config } from '@/lib/config';
import { clearFailedLoginState, recordFailedLogin } from '@/lib/password-recovery';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === 'string' ? body.username : config.ADMIN_USERNAME;
  const password = typeof body.password === 'string' ? body.password : '';

  if (!password) {
    return NextResponse.json({ ok: false, message: 'Password is required.' }, { status: 400 });
  }

  if (!config.ADMIN_PASSWORD_HASH || !config.DATABASE_URL) {
    return NextResponse.json({ ok: false, message: 'Authentication is not configured.' }, { status: 503 });
  }

  let validPassword = false;

  try {
    validPassword = await verifyPassword(password);
  } catch {
    return NextResponse.json({ ok: false, message: 'Authentication service is unavailable.' }, { status: 503 });
  }

  if (username !== config.ADMIN_USERNAME || !validPassword) {
    let recoveryCodeSent = false;

    try {
      recoveryCodeSent = await recordFailedLogin();
    } catch (error) {
      console.error('Failed to process login recovery:', error instanceof Error ? error.name : 'UnknownError');
    }

    return NextResponse.json({
      ok: false,
      recoveryCodeSent,
      message: recoveryCodeSent
        ? 'Tiklash kodi emailingizga yuborildi.'
        : 'Parol noto‘g‘ri.',
    }, { status: 401 });
  }

  try {
    await clearFailedLoginState();
    const token = await createAdminSession();
    const response = NextResponse.json({ ok: true });

    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: 'Authentication service is unavailable.' }, { status: 503 });
  }
}
