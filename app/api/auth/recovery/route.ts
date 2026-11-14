import { NextResponse } from 'next/server';

import { resetAdminPasswordWithCode } from '@/lib/password-recovery';

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);

  if (contentLength > 4096) {
    return NextResponse.json({ ok: false, message: 'Request is too large.' }, { status: 413 });
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!/^\d{6}$/.test(code) || password.length < 5 || password.length > 128) {
    return NextResponse.json({ ok: false, message: 'Kod yoki yangi parol noto‘g‘ri.' }, { status: 400 });
  }

  try {
    const reset = await resetAdminPasswordWithCode(code, password);

    if (!reset) {
      return NextResponse.json({ ok: false, message: 'Kod noto‘g‘ri, muddati tugagan yoki ishlatilgan.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: 'Parol yangilandi. Yangi parol bilan kiring.' });
  } catch {
    return NextResponse.json({ ok: false, message: 'Parolni tiklash xizmati ishlamayapti.' }, { status: 503 });
  }
}