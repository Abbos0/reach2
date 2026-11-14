import { config } from './config';
import { get } from '@vercel/blob';

export async function sendTelegramDocument({
  pathname,
  fileName,
  mimeType,
  caption,
}: {
  pathname: string;
  fileName: string;
  mimeType: string;
  caption?: string;
}): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const botToken = config.TELEGRAM_BOT_TOKEN;
  const targetChatId = config.TELEGRAM_CHAT_ID;

  if (!botToken || !targetChatId) {
    return { ok: false, error: 'TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be configured.' };
  }

  const storedBlob = await get(pathname, { access: 'private' });

  if (!storedBlob || storedBlob.statusCode !== 200 || !storedBlob.stream) {
    return { ok: false, error: 'Stored file is unavailable.' };
  }

  const file = await new Response(storedBlob.stream, {
    headers: { 'Content-Type': mimeType },
  }).blob();
  const form = new FormData();
  form.set('chat_id', targetChatId);
  form.set('document', file, fileName);
  form.set('caption', caption ?? '');
  form.set('disable_content_type_detection', 'true');

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
    method: 'POST',
    body: form,
  });

  const payload = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    description?: string;
    result?: { message_id?: number };
  };

  if (!response.ok || !payload.ok) {
    return {
      ok: false,
      error: payload.description ?? 'Telegram rejected the upload request.',
    };
  }

  return {
    ok: true,
    messageId: payload.result?.message_id,
  };
}
