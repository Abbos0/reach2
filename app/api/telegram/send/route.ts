// import { NextResponse } from 'next/server';

// import { isAdminRequest } from '@/lib/auth';
// import { claimUploadJob, finishUploadJob } from '@/lib/jobs';
// import { sendTelegramDocument } from '@/lib/telegram';

// export async function POST(request: Request) {
//   if (!(await isAdminRequest(request))) {
//     return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
//   }

//   const body = await request.json().catch(() => ({}));
//   const jobId = typeof body.jobId === 'string' ? body.jobId : '';
//   const caption = typeof body.caption === 'string' ? body.caption : '';

//   if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
//     return NextResponse.json({ ok: false, message: 'A valid jobId is required.' }, { status: 400 });
//   }

//   if (caption.length > 1024) {
//     return NextResponse.json({ ok: false, message: 'Caption exceeds Telegram’s 1024 character limit.' }, { status: 400 });
//   }

//   try {
//     const job = await claimUploadJob(jobId);

//     if (!job) {
//       return NextResponse.json({ ok: false, message: 'Upload job is not ready or is already being sent.' }, { status: 409 });
//     }

//     const result = await sendTelegramDocument({
//       pathname: job.blob_pathname,
//       fileName: job.file_name,
//       mimeType: job.mime_type,
//       caption,
//     });

//     await finishUploadJob({
//       id: job.id,
//       status: result.ok ? 'sent' : 'failed',
//       messageId: result.messageId,
//       error: result.error,
//     });

//     if (!result.ok) {
//       return NextResponse.json({ ok: false, message: result.error ?? 'Telegram delivery failed.' }, { status: 502 });
//     }

//     return NextResponse.json({ ok: true, jobId: job.id, messageId: result.messageId });
//   } catch {
//     return NextResponse.json({ ok: false, message: 'Telegram delivery service is unavailable.' }, { status: 503 });
//   }
// }









import { NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/auth';
import { claimUploadJob, finishUploadJob } from '@/lib/jobs';
import { sendTelegramDocument } from '@/lib/telegram';

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const jobId = typeof body.jobId === 'string' ? body.jobId.trim() : '';
  const caption = typeof body.caption === 'string' ? body.caption.trim() : '';

  if (caption.length > 1024) {
    return NextResponse.json({ ok: false, message: 'Caption exceeds Telegram’s 1024 character limit.' }, { status: 400 });
  }

  // 1. Agar jobId mavjud bo'lsa - faylni yuborish
  if (jobId) {
    if (!/^[0-9a-f-]{36}$/i.test(jobId)) {
      return NextResponse.json({ ok: false, message: 'A valid jobId is required.' }, { status: 400 });
    }

    try {
      const job = await claimUploadJob(jobId);

      if (!job) {
        return NextResponse.json({ ok: false, message: 'Upload job is not ready or is already being sent.' }, { status: 409 });
      }

      const result = await sendTelegramDocument({
        pathname: job.blob_pathname,
        fileName: job.file_name,
        mimeType: job.mime_type,
        caption,
      });

      await finishUploadJob({
        id: job.id,
        status: result.ok ? 'sent' : 'failed',
        messageId: result.messageId,
        error: result.error,
      });

      if (!result.ok) {
        return NextResponse.json({ ok: false, message: result.error ?? 'Telegram delivery failed.' }, { status: 502 });
      }

      return NextResponse.json({ ok: true, jobId: job.id, messageId: result.messageId });
    } catch {
      return NextResponse.json({ ok: false, message: 'Telegram delivery service is unavailable.' }, { status: 503 });
    }
  }

  // 2. Agar jobId yo'q, lekin matn (caption) yozilgan bo'lsa - faqat matnni yuborish
  if (caption) {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        return NextResponse.json({ ok: false, message: 'Telegram configuration is missing.' }, { status: 500 });
      }

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: caption,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        return NextResponse.json({ ok: false, message: data.description ?? 'Telegram text delivery failed.' }, { status: 502 });
      }

      return NextResponse.json({ ok: true, messageId: data.result?.message_id });
    } catch {
      return NextResponse.json({ ok: false, message: 'Telegram delivery service is unavailable.' }, { status: 503 });
    }
  }

  return NextResponse.json({ ok: false, message: 'A valid jobId or caption is required.' }, { status: 400 });
}