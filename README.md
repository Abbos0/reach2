# REACH2

Yagona administrator uchun shaxsiy fayl va xabar uzatish ilovasi. Ilova Node.js 22, Next.js App Router, Neon Postgres, private Vercel Blob va Telegram Bot API’dan foydalanadi.

## Ishga tushirish

1. Node.js 22 bilan dependency’larni o‘rnating: `npm install`.
2. `.env.example` faylidan `.env.local` yarating va Neon, private Blob store hamda Telegram bot qiymatlarini kiriting.
3. `drizzle/0001_admin_sessions.sql`, `drizzle/0002_upload_jobs.sql` va `drizzle/0003_admin_password_recovery.sql` fayllarini shu tartibda Neon SQL Editor’da bajaring.
4. PowerShell’da `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-admin-password.ps1` buyrug‘ini bajaring. Kamida 5 belgili yangi parolni ikki marta yashirin kiriting; Argon2id hash `.env.local` ga yoziladi. Qisqa parol kamroq xavfsiz bo‘ladi.
5. Gmail akkauntingizda 2 bosqichli tasdiqlashni yoqing va Google App Password yarating. Uni `.env.local` ichidagi `GMAIL_APP_PASSWORD` ga yozing; tiklash kodi `RECOVERY_EMAIL` ga yuboriladi. App Password’ni chatga yubormang.
6. Private Blob store’ni Vercel loyihasiga ulang va `BLOB_READ_WRITE_TOKEN` ni faqat server muhitida sozlang.
7. Kamida 32 belgili tasodifiy `CRON_SECRET` yarating va Vercel environment variable sifatida saqlang. `vercel.json` dagi soatlik cron muddati tugagan private Blob obyektlari va metadata’sini o‘chiradi; deploy rejasi soatlik cron’ni qo‘llashi kerak.
8. `npm run dev` bilan boshlang.

Botni shaxsiy kanalga qo‘shing, kerakli yuborish huquqini bering va `TELEGRAM_CHAT_ID` ni belgilang. `ADMIN_PASSWORD_HASH` yoki `DATABASE_URL` bo‘lmasa login o‘chirilgan bo‘ladi; standart parol mavjud emas.

## Parol esdan chiqsa

Eski parolni hash’dan qayta tiklab bo‘lmaydi. Ketma-ket 5 marta xato login kiritilgach, `RECOVERY_EMAIL` ga 10 daqiqa amal qiladigan bir martalik kod yuboriladi; kodni kiritishda 5 urinish, emailni qayta yuborishda 15 daqiqalik kutish bor. Kod orqali kamida 5 belgili yangi parol o‘rnatiladi va mavjud admin sessiyalari bekor qilinadi. Bu email oqimi uchun `GMAIL_APP_PASSWORD` va `0003_admin_password_recovery.sql` migration zarur. Email ishlamasa, server papkasiga egasi sifatida kirib PowerShell’da `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\set-admin-password.ps1` buyrug‘i bilan ham parolni lokal reset qilish mumkin.

## Tekshiruv

- `npm test`
- `npm run typecheck`
- `npm run build`

Fayllar private Blob’da saqlanadi, brauzerga public URL qaytarilmaydi. Fayl metadata’si DB’dan tekshiriladi; Telegram manzili server konfiguratsiyasidan olinadi. Job va Blob obyektlari muddati tugagach soatlik cron orqali o‘chiriladi.