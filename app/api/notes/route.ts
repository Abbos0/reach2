

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

// Jadvallarni avtomatik yaratish
async function ensureTables() {
  if (!sql) return;
  await (sql as any)`
    CREATE TABLE IF NOT EXISTS private_notes (
      id SERIAL PRIMARY KEY,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await (sql as any)`
    CREATE TABLE IF NOT EXISTS private_note_text (
      id INT PRIMARY KEY,
      content TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  await (sql as any)`
    INSERT INTO private_note_text (id, content)
    VALUES (1, '')
    ON CONFLICT (id) DO NOTHING;
  `;
}

// Rasmlar va matnli eslatmani bazadan o'qib olish
export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    await ensureTables();
    const rows = await (sql as any)`SELECT id, image_url FROM private_notes ORDER BY id ASC`;
    const images = rows.map((r: any) => ({ id: r.id, url: r.image_url }));

    const textRows = await (sql as any)`SELECT content FROM private_note_text WHERE id = 1`;
    const noteText = textRows[0]?.content ?? '';

    return NextResponse.json({ ok: true, images, noteText });
  } catch (err) {
    return NextResponse.json({ ok: false, message: 'Ma’lumotlarni yuklashda xatolik.' }, { status: 500 });
  }
}

// Bazaga rasm qo'shish yoki matnli eslatmani saqlash
export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    await ensureTables();
    const body = await request.json();

    // Agar matn saqlash so'ralgan bo'lsa
    if (typeof body.noteText === 'string') {
      await (sql as any)`
        UPDATE private_note_text
        SET content = ${body.noteText}, updated_at = NOW()
        WHERE id = 1
      `;
      return NextResponse.json({ ok: true });
    }

    // Agar rasm qo'shish so'ralgan bo'lsa
    const { imageUrl } = body;
    if (!imageUrl) {
      return NextResponse.json({ ok: false, message: 'Rasm yoki matn yuborilmadi.' }, { status: 400 });
    }

    const countResult = await (sql as any)`SELECT COUNT(*) as count FROM private_notes`;
    const count = Number(countResult[0]?.count || 0);

    if (count >= 3) {
      return NextResponse.json({ ok: false, message: 'Maksimal 3 ta rasm saqlash mumkin.' }, { status: 400 });
    }

    await (sql as any)`INSERT INTO private_notes (image_url) VALUES (${imageUrl})`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, message: 'Saqlashda xatolik yuz berdi.' }, { status: 500 });
  }
}

// Rasmni bazadan o'chirish
export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }

  try {
    await ensureTables();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ ok: false, message: 'ID ko‘rsatilmadi.' }, { status: 400 });
    }

    await (sql as any)`DELETE FROM private_notes WHERE id = ${Number(id)}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, message: 'O‘chirishda xatolik.' }, { status: 500 });
  }
}