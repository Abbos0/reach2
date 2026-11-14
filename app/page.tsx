// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
//   const [file, setFile] = useState<File | null>(null);
//   const [caption, setCaption] = useState('');
//   const [jobId, setJobId] = useState<string | null>(null);
//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));
//   }, []);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');

//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
//           return;
//         }

//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi. Yangi parol bilan kiring.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function uploadFile(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (!file) {
//       setError('Avval fayl tanlang.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Yuklash sessiyasi tayyorlanmoqda...');

//     try {
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: file.name, mimeType: file.type, sizeBytes: file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Yuklash sessiyasi yaratilmadi.');
//       }

//       await upload(session.pathname, file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => setStatus(`Yuklanmoqda: ${Math.round(percentage)}%`),
//       });

//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Faylni tekshirish amalga oshmadi.');
//       }

//       setJobId(session.jobId);
//       setStatus('Fayl tayyor. Telegram’ga yuborish mumkin.');
//     } catch (uploadError) {
//       setError(uploadError instanceof Error ? uploadError.message : 'Faylni yuklash amalga oshmadi.');
//       setStatus('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function sendFile(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (!jobId) {
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Telegram’ga yuborilmoqda...');

//     try {
//       const response = await fetch('/api/telegram/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId, caption }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Yuborish amalga oshmadi.');
//       }

//       setStatus('Telegram’ga yuborildi.');
//       setJobId(null);
//       setFile(null);
//       setCaption('');
//     } catch (sendError) {
//       setError(sendError instanceof Error ? sendError.message : 'Yuborish amalga oshmadi.');
//       setStatus('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setJobId(null);
//     setFile(null);
//     setCaption('');
//     setStatus('');
//     setError('');
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header">
//           <div className="brand-row"><span className="brand-mark"></span><div><p className="eyebrow"></p><h1></h1></div></div>
//           <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//         </header>
//         <form className="stack" onSubmit={uploadFile}>
//           <label>
            
//             <input
//               type="file"
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 setFile(event.target.files?.[0] ?? null);
//                 setJobId(null);
//                 setStatus('');
//                 setError('');
//               }}
//               required
//             />
//           </label>
//           {file && <p className="file-meta">{file.name} <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span></p>}
//           <button type="submit" disabled={busy || !file}>{busy ? 'Kutib turing...' : 'Xavfsiz yuklash'}</button>
//         </form>
//         {jobId && (
//           <form className="stack send-form" onSubmit={sendFile}>
//             <label>
//               Xabar (ixtiyoriy)
//               <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
//             </label>
//             <button type="submit" disabled={busy}>Telegram’ga yuborish</button>
//           </form>
//         )}
//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>
//     </main>
//   );
// }






// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
//   const [file, setFile] = useState<File | null>(null);
//   const [caption, setCaption] = useState('');
//   const [jobId, setJobId] = useState<string | null>(null);
//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));
//   }, []);

//   // Skrinshotni Ctrl + V orqali qabul qilish funksiyasi
//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             // Faylga avtomat nom beramiz (masalan: screenshot_vaqti.png)
//             const fileName = `screenshot_${Date.now()}.png`;
//             const imageFile = new File([blob], fileName, { type: blob.type });

//             setFile(imageFile);
//             setJobId(null);
//             setStatus(`Skrinshot qo‘shildi: ${fileName}`);
//             setError('');
//             event.preventDefault();
//             break;
//           }
//         }
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');

//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
//           return;
//         }

//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi. Yangi parol bilan kiring.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function uploadFile(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (!file) {
//       setError('Avval fayl tanlang.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Yuklash sessiyasi tayyorlanmoqda...');

//     try {
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: file.name, mimeType: file.type, sizeBytes: file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Yuklash sessiyasi yaratilmadi.');
//       }

//       await upload(session.pathname, file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => setStatus(`Yuklanmoqda: ${Math.round(percentage)}%`),
//       });

//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Faylni tekshirish amalga oshmadi.');
//       }

//       setJobId(session.jobId);
//       setStatus('Fayl tayyor. Telegram’ga yuborish mumkin.');
//     } catch (uploadError) {
//       setError(uploadError instanceof Error ? uploadError.message : 'Faylni yuklash amalga oshmadi.');
//       setStatus('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function sendFile(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (!jobId) {
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Telegram’ga yuborilmoqda...');

//     try {
//       const response = await fetch('/api/telegram/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId, caption }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Yuborish amalga oshmadi.');
//       }

//       setStatus('Telegram’ga yuborildi.');
//       setJobId(null);
//       setFile(null);
//       setCaption('');
//     } catch (sendError) {
//       setError(sendError instanceof Error ? sendError.message : 'Yuborish amalga oshmadi.');
//       setStatus('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setJobId(null);
//     setFile(null);
//     setCaption('');
//     setStatus('');
//     setError('');
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header">
//           <div className="brand-row"><p>Ctrl+V ni bosib quy screshotni</p><div></div></div>
//           <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//         </header>
//         <form className="stack" onSubmit={uploadFile}>
//           <label>
//             <input
//               type="file"
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 setFile(event.target.files?.[0] ?? null);
//                 setJobId(null);
//                 setStatus('');
//                 setError('');
//               }}
//               // required
//             />
//           </label>
//           {file && <p className="file-meta">{file.name} <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span></p>}
//           <button type="submit" disabled={busy || !file}>{busy ? 'Kutib turing...' : 'Xavfsiz yuklash'}</button>
//         </form>
//         {jobId && (
//           <form className="stack send-form" onSubmit={sendFile}>
//             <label>
//               Xabar (ixtiyoriy)
//               <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
//             </label>
//             <button type="submit" disabled={busy}>Telegram’ga yuborish</button>
//           </form>
//         )}
//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>
//     </main>
//   );
// }




// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
//   // Bir nechta fayl va job'larni saqlash uchun massivlar
//   const [files, setFiles] = useState<File[]>([]);
//   const [caption, setCaption] = useState('');
//   const [uploadedJobIds, setUploadedJobIds] = useState<string[]>([]);
  
//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));
//   }, []);

//   // Bir nechta skrinshotni Ctrl + V orqali qabul qilish
//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       const newFiles: File[] = [];
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             const fileName = `screenshot_${Date.now()}_${i}.png`;
//             newFiles.push(new File([blob], fileName, { type: blob.type }));
//           }
//         }
//       }

//       if (newFiles.length > 0) {
//         setFiles((prev) => [...prev, ...newFiles]);
//         setUploadedJobIds([]);
//         setStatus(`${newFiles.length} ta rasm qo'shildi.`);
//         setError('');
//         event.preventDefault();
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');
//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
//           return;
//         }
//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   // Barcha tanlangan fayllarni birma-bir yuklash
//   async function uploadFiles(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (files.length === 0) {
//       setError('Avval fayllarni tanlang.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Fayllar yuklanmoqda...');

//     try {
//       const jobIds: string[] = [];

//       for (let i = 0; i < files.length; i++) {
//         const file = files[i];
//         setStatus(`Yuklanmoqda (${i + 1}/${files.length}): ${file.name}`);

//         const sessionResponse = await fetch('/api/upload/session', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ name: file.name, mimeType: file.type, sizeBytes: file.size }),
//         });
//         const session = (await sessionResponse.json()) as ApiResult;

//         if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//           throw new Error(session.message ?? `${file.name} uchun sessiya yaratilmadi.`);
//         }

//         await upload(session.pathname, file, {
//           access: 'private',
//           handleUploadUrl: '/api/upload/blob',
//           clientPayload: JSON.stringify({ jobId: session.jobId }),
//         });

//         const completeResponse = await fetch('/api/upload/complete', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ jobId: session.jobId }),
//         });
//         const complete = (await completeResponse.json()) as ApiResult;

//         if (!completeResponse.ok) {
//           throw new Error(complete.message ?? `${file.name} tekshirilmadi.`);
//         }

//         jobIds.push(session.jobId);
//       }

//       setUploadedJobIds(jobIds);
//       setStatus('Barcha fayllar tayyor. Telegram’ga yuborish mumkin.');
//     } catch (uploadError) {
//       setError(uploadError instanceof Error ? uploadError.message : 'Fayllarni yuklash amalga oshmadi.');
//       setStatus('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function sendFiles(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();

//     if (uploadedJobIds.length === 0) {
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Telegram’ga yuborilmoqda...');

//     try {
//       for (let i = 0; i < uploadedJobIds.length; i++) {
//         const jobId = uploadedJobIds[i];
//         const response = await fetch('/api/telegram/send', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ jobId, caption }),
//         });
//         const result = (await response.json()) as ApiResult;

//         if (!response.ok) {
//           throw new Error(result.message ?? 'Yuborish amalga oshmadi.');
//         }
//       }

//       setStatus('Barcha fayllar Telegram’ga yuborildi.');
//       setUploadedJobIds([]);
//       setFiles([]);
//       setCaption('');
//     } catch (sendError) {
//       setError(sendError instanceof Error ? sendError.message : 'Yuborish amalga oshmadi.');
//       setStatus('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setUploadedJobIds([]);
//     setFiles([]);
//     setCaption('');
//     setStatus('');
//     setError('');
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header">
//           <div className="brand-row"><span className="brand-mark"></span><div><p className="eyebrow"></p><h1></h1></div></div>
//           <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//         </header>
//         <form className="stack" onSubmit={uploadFiles}>
//           <label>
//             {/* multiple atributi qo'shildi */}
//             <input
//               type="file"
//               multiple
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 const selectedFiles = event.target.files ? Array.from(event.target.files) : [];
//                 setFiles((prev) => [...prev, ...selectedFiles]);
//                 setUploadedJobIds([]);
//                 setStatus('');
//                 setError('');
//               }}
//             />
//           </label>
//           {files.length > 0 && (
//             <div className="file-list" style={{ maxHeight: '150px', overflowY: 'auto' }}>
//               <p>Tanlangan fayllar ({files.length} ta):</p>
//               <ul>
//                 {files.map((f, index) => (
//                   <li key={index} style={{ fontSize: '12px' }}>
//                     {f.name} ({(f.size / (1024 * 1024)).toFixed(2)} MB)
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}
//           <button type="submit" disabled={busy || files.length === 0}>
//             {busy ? 'Kutib turing...' : 'Xavfsiz yuklash'}
//           </button>
//         </form>

//         {uploadedJobIds.length > 0 && (
//           <form className="stack send-form" onSubmit={sendFiles}>
//             <label>
//               Xabar (ixtiyoriy)
//               <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
//             </label>
//             <button type="submit" disabled={busy}>Telegram’ga yuborish</button>
//           </form>
//         )}
//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>
//     </main>
//   );
// }







// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// type FileItem = {
//   id: string;
//   file: File;
//   status: 'pending' | 'uploading' | 'done' | 'error';
//   progress: number;
//   jobId?: string;
//   errorMsg?: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
//   const [fileItems, setFileItems] = useState<FileItem[]>([]);
//   const [caption, setCaption] = useState('');
//   const [previewImage, setPreviewImage] = useState<string | null>(null);

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));
//   }, []);

//   // Skrinshotni Ctrl + V orqali qabul qilish
//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       const newItems: FileItem[] = [];
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             const fileName = `screenshot_${Date.now()}_${i}.png`;
//             const file = new File([blob], fileName, { type: blob.type });
//             newItems.push({
//               id: Math.random().toString(36).substring(2, 9),
//               file,
//               status: 'pending',
//               progress: 0,
//             });
//           }
//         }
//       }

//       if (newItems.length > 0) {
//         setFileItems((prev) => [...prev, ...newItems]);
//         setStatus(`${newItems.length} ta rasm qo'shildi.`);
//         setError('');
//         event.preventDefault();
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');
//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
//           return;
//         }
//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   // Faylni ro'yxatdan o'chirish
//   function removeFileItem(id: string) {
//     setFileItems((prev) => prev.filter((item) => item.id !== id));
//   }

//   // Har bir faylni alohida yuklash funksiyasi
//   async function uploadSingleFile(item: FileItem) {
//     setFileItems((prev) =>
//       prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
//     );

//     try {
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Sessiya yaratilmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f))
//       );

//       await upload(session.pathname, item.file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => {
//           setFileItems((prev) =>
//             prev.map((f) => (f.id === item.id ? { ...f, progress: 40 + Math.round(percentage * 0.4) } : f))
//           );
//         },
//       });

//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Tekshirish amalga oshmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100, jobId: session.jobId } : f))
//       );
//     } catch (err) {
//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Xatolik' } : f))
//       );
//     }
//   }

//   // Barcha pending fayllarni bir vaqtning o'zida alohida-alohida yuklay boshlash
//   async function handleStartAllUploads(e: FormEvent) {
//     e.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');
//     if (pendingItems.length === 0) return;

//     setBusy(true);
//     setStatus('Fayllar alohida yuklanmoqda...');

//     // Hammasini parallel ravishda yuklashni boshlaymiz
//     await Promise.all(pendingItems.map((item) => uploadSingleFile(item)));

//     setBusy(false);
//     setStatus('Yuklash jarayoni yakunlandi.');
//   }

//   // Telegram'ga yuborish
//   async function sendFilesToTelegram(event: FormEvent) {
//     event.preventDefault();
//     const doneItems = fileItems.filter((f) => f.status === 'done' && f.jobId);

//     if (doneItems.length === 0) {
//       setError('Yuklangan tayyor fayllar yo‘q.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Telegram’ga yuborilmoqda...');

//     try {
//       for (const item of doneItems) {
//         if (!item.jobId) continue;
//         const response = await fetch('/api/telegram/send', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ jobId: item.jobId, caption }),
//         });
//         const result = (await response.json()) as ApiResult;

//         if (!response.ok) {
//           throw new Error(result.message ?? 'Yuborish amalga oshmadi.');
//         }
//       }

//       setStatus('Tayyor fayllar Telegram’ga yuborildi.');
//       // Yuborilganlarni ro'yxatdan olib tashlaymiz
//       setFileItems((prev) => prev.filter((f) => f.status !== 'done'));
//       setCaption('');
//     } catch (sendError) {
//       setError(sendError instanceof Error ? sendError.message : 'Yuborish amalga oshmadi.');
//       setStatus('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setFileItems([]);
//     setCaption('');
//     setStatus('');
//     setError('');
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   const hasDoneFiles = fileItems.some((f) => f.status === 'done');
//   const hasPendingFiles = fileItems.some((f) => f.status === 'pending' || f.status === 'error');

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header">
//           <div className="brand-row"><span className="brand-mark"></span><div><p className="eyebrow"></p><h1></h1></div></div>
//           <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//         </header>

//         <form className="stack" onSubmit={handleStartAllUploads}>
//           <label>
//             <input
//               type="file"
//               multiple
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 const selected = event.target.files ? Array.from(event.target.files) : [];
//                 const newItems: FileItem[] = selected.map((file) => ({
//                   id: Math.random().toString(36).substring(2, 9),
//                   file,
//                   status: 'pending',
//                   progress: 0,
//                 }));
//                 setFileItems((prev) => [...prev, ...newItems]);
//                 setStatus('');
//                 setError('');
//               }}
//             />
//           </label>

//           {fileItems.length > 0 && (
//             <div className="file-list" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
//               <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Fayllar ro‘yxati ({fileItems.length} ta):</p>
//               <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                 {fileItems.map((item) => (
//                   <li key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '6px', background: '#f9f9f9', padding: '6px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: item.status === 'done' ? 'bold' : 'normal' }}>
//                         {item.file.name}
//                       </span>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                         <span style={{ fontSize: '11px', color: item.status === 'done' ? 'green' : item.status === 'uploading' ? 'blue' : item.status === 'error' ? 'red' : '#666' }}>
//                           {item.status === 'done' ? '100%' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'error' ? 'Xato' : 'Navbatda'}
//                         </span>

//                         {/* Ko'zcha */}
//                         {item.file.type.startsWith('image/') && (
//                           <button
//                             type="button"
//                             onClick={() => setPreviewImage(URL.createObjectURL(item.file))}
//                             style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
//                             title="Ko'rish"
//                           >
//                             👁️
//                           </button>
//                         )}

//                         {/* O'chirish */}
//                         <button
//                           type="button"
//                           onClick={() => removeFileItem(item.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '14px', fontWeight: 'bold' }}
//                           title="O'chirish"
//                         >
//                           ❌
//                         </button>
//                       </div>
//                     </div>
//                     {item.status === 'uploading' && (
//                       <div style={{ width: '100%', background: '#ddd', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
//                         <div style={{ width: `${item.progress}%`, background: '#0070f3', height: '100%', borderRadius: '2px', transition: 'width 0.2s' }}></div>
//                       </div>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           <button type="submit" disabled={busy || !hasPendingFiles}>
//             {busy ? 'Yuklanmoqda...' : 'Hamma fayllarni alohida yuklash'}
//           </button>
//         </form>

//         {hasDoneFiles && (
//           <form className="stack send-form" onSubmit={sendFilesToTelegram} style={{ marginTop: '12px' }}>
//             <label>
//               Xabar (ixtiyoriy)
//               <textarea maxLength={1024} rows={2} value={caption} onChange={(event) => setCaption(event.target.value)} />
//             </label>
//             <button type="submit" disabled={busy}>Tayyor bo‘lganlarni Telegram’ga yuborish</button>
//           </form>
//         )}

//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>

//       {/* Rasmni kattalashtirib ko'rish oynasi (Modal) */}
//       {previewImage && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', textAlign: 'center', position: 'relative' }}>
//             <button
//               onClick={() => setPreviewImage(null)}
//               style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '4px', marginTop: '15px' }} />
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }







// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useRef, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// type FileItem = {
//   id: string;
//   file: File;
//   status: 'pending' | 'uploading' | 'done' | 'error';
//   progress: number;
//   jobId?: string;
//   errorMsg?: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
//   const [fileItems, setFileItems] = useState<FileItem[]>([]);
//   const [caption, setCaption] = useState('');
//   const [previewImage, setPreviewImage] = useState<string | null>(null);

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   // Fayl input elementini tozalash uchun ref
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));
//   }, []);

//   // Skrinshotni Ctrl + V orqali qabul qilish
//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       const newItems: FileItem[] = [];
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             const fileName = `screenshot_${Date.now()}_${i}.png`;
//             const file = new File([blob], fileName, { type: blob.type });
//             newItems.push({
//               id: Math.random().toString(36).substring(2, 9),
//               file,
//               status: 'pending',
//               progress: 0,
//             });
//           }
//         }
//       }

//       if (newItems.length > 0) {
//         setFileItems((prev) => [...prev, ...newItems]);
//         setStatus(`${newItems.length} ta rasm qo'shildi.`);
//         setError('');
//         event.preventDefault();
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');
//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
//           return;
//         }
//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   function removeFileItem(id: string) {
//     setFileItems((prev) => {
//       const updated = prev.filter((item) => item.id !== id);
//       if (updated.length === 0 && fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return updated;
//     });
//   }

//   // Bitta faylni yuklash va Telegram'ga yuborib, darhol ro'yxatdan o'chirish
//   async function uploadAndSendSingleFile(item: FileItem) {
//     setFileItems((prev) =>
//       prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
//     );

//     try {
//       // 1. Session olish
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Sessiya yaratilmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f))
//       );

//       // 2. Vercel Blob'ga yuklash
//       await upload(session.pathname, item.file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => {
//           setFileItems((prev) =>
//             prev.map((f) => (f.id === item.id ? { ...f, progress: 40 + Math.round(percentage * 0.4) } : f))
//           );
//         },
//       });

//       // 3. Complete qilish
//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Tekshirish amalga oshmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100, jobId: session.jobId } : f))
//       );

//       setStatus(`${item.file.name} yuklandi, Telegram'ga yuborilmoqda...`);

//       // 4. Telegram'ga yuborish (joriy caption bilan)
//       const sendResponse = await fetch('/api/telegram/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId, caption }),
//       });
//       const sendResult = (await sendResponse.json()) as ApiResult;

//       if (!sendResponse.ok) {
//         throw new Error(sendResult.message ?? 'Telegram’ga yuborish amalga oshmadi.');
//       }

//       setStatus(`${item.file.name} Telegram'ga yuborildi.`);

//       // 5. Muvaffaqiyatli yuborilgach ro'yxatdan o'chirish
//       setFileItems((prev) => {
//         const updated = prev.filter((f) => f.id !== item.id);
//         if (updated.length === 0) {
//           if (fileInputRef.current) fileInputRef.current.value = '';
//           setCaption(''); // Xabar maydonini tozalash
//         }
//         return updated;
//       });

//     } catch (err) {
//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Xatolik' } : f))
//       );
//       setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
//     }
//   }

//   // "Hamma fayllarni alohida yuklash" tugmasi bosilganda
//   async function handleStartAllUploads(e: FormEvent) {
//     e.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');
//     if (pendingItems.length === 0) return;

//     setBusy(true);
//     setStatus('Fayllar yuklanmoqda va avtomatik yuborilmoqda...');

//     await Promise.all(pendingItems.map((item) => uploadAndSendSingleFile(item)));

//     setBusy(false);
//     setStatus('Barcha jarayonlar yakunlandi va tozalandi.');
//     setCaption(''); // Xabar maydonini tozalash
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }

//   // "Telegram’ga yuborish" tugmasi bosilganda
//   async function sendFilesToTelegram(event: FormEvent) {
//     event.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');

//     if (pendingItems.length === 0) {
//       setError('Yuklanadigan fayllar yo‘q.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Fayllar yuklanib, Telegram’ga yuborilmoqda...');

//     for (const item of pendingItems) {
//       await uploadAndSendSingleFile(item);
//     }

//     setBusy(false);
//     setStatus('Barcha tanlanganlar yuborildi va tozalandi.');
//     setCaption(''); // Xabar maydonini tozalash
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setFileItems([]);
//     setCaption('');
//     setStatus('');
//     setError('');
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   const hasPendingFiles = fileItems.some((f) => f.status === 'pending' || f.status === 'error');

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header">
//           <div className="brand-row"><span className="brand-mark"></span><div><p className="eyebrow"></p><h1></h1></div></div>
//           <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//         </header>

//         <form className="stack" onSubmit={handleStartAllUploads}>
//           <label>
//             <input
//               ref={fileInputRef}
//               type="file"
//               multiple
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 const selected = event.target.files ? Array.from(event.target.files) : [];
//                 const newItems: FileItem[] = selected.map((file) => ({
//                   id: Math.random().toString(36).substring(2, 9),
//                   file,
//                   status: 'pending',
//                   progress: 0,
//                 }));
//                 setFileItems((prev) => [...prev, ...newItems]);
//                 setStatus('');
//                 setError('');
//               }}
//             />
//           </label>

//           {fileItems.length > 0 && (
//             <div className="file-list" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
//               <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Fayllar ro‘yxati ({fileItems.length} ta):</p>
//               <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                 {fileItems.map((item) => (
//                   <li key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '6px', background: '#f9f9f9', padding: '6px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: item.status === 'done' ? 'bold' : 'normal' }}>
//                         {item.file.name}
//                       </span>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                         <span style={{ fontSize: '11px', color: item.status === 'done' ? 'green' : item.status === 'uploading' ? 'blue' : item.status === 'error' ? 'red' : '#666' }}>
//                           {item.status === 'done' ? 'Yuborildi' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'error' ? 'Xato' : 'Navbatda'}
//                         </span>

//                         {/* Ko'zcha */}
//                         {item.file.type.startsWith('image/') && (
//                           <button
//                             type="button"
//                             onClick={() => setPreviewImage(URL.createObjectURL(item.file))}
//                             style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
//                             title="Ko'rish"
//                           >
//                             👁️
//                           </button>
//                         )}

//                         {/* O'chirish */}
//                         <button
//                           type="button"
//                           onClick={() => removeFileItem(item.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '14px', fontWeight: 'bold' }}
//                           title="O'chirish"
//                         >
//                           ❌
//                         </button>
//                       </div>
//                     </div>
//                     {item.status === 'uploading' && (
//                       <div style={{ width: '100%', background: '#ddd', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
//                         <div style={{ width: `${item.progress}%`, background: '#0070f3', height: '100%', borderRadius: '2px', transition: 'width 0.2s' }}></div>
//                       </div>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Xabar yozish maydoni */}
//           <label style={{ marginTop: '10px' }}>
//             Xabar (ixtiyoriy)
//             <textarea maxLength={1024} rows={2} value={caption} onChange={(event) => setCaption(event.target.value)} />
//           </label>

//           {/* Tugmalar yonma-yon */}
//           <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
//             <button type="submit" disabled={busy || !hasPendingFiles} style={{ flex: 1 }}>
//               {busy ? 'Yuklanmoqda...' : 'Hamma fayllarni alohida yuklash'}
//             </button>
            
//             <button 
//               type="button" 
//               onClick={sendFilesToTelegram} 
//               disabled={busy || !hasPendingFiles} 
//               style={{ flex: 1, backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               Telegram’ga yuborish
//             </button>
//           </div>
//         </form>

//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>

//       {/* Rasmni kattalashtirib ko'rish oynasi (Modal) */}
//       {previewImage && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', textAlign: 'center', position: 'relative' }}>
//             <button
//               onClick={() => setPreviewImage(null)}
//               style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '4px', marginTop: '15px' }} />
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }












// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useRef, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// type FileItem = {
//   id: string;
//   file: File;
//   status: 'pending' | 'uploading' | 'done' | 'error';
//   progress: number;
//   jobId?: string;
//   errorMsg?: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
//   const [fileItems, setFileItems] = useState<FileItem[]>([]);
//   const [caption, setCaption] = useState('');
//   const [previewImage, setPreviewImage] = useState<string | null>(null);

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));
//   }, []);

//   // Skrinshotni Ctrl + V orqali qabul qilish
//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       const newItems: FileItem[] = [];
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             const fileName = `screenshot_${Date.now()}_${i}.png`;
//             const file = new File([blob], fileName, { type: blob.type });
//             newItems.push({
//               id: Math.random().toString(36).substring(2, 9),
//               file,
//               status: 'pending',
//               progress: 0,
//             });
//           }
//         }
//       }

//       if (newItems.length > 0) {
//         setFileItems((prev) => [...prev, ...newItems]);
//         setStatus(`${newItems.length} ta rasm qo'shildi.`);
//         setError('');
//         event.preventDefault();
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');
//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
//           return;
//         }
//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   function removeFileItem(id: string) {
//     setFileItems((prev) => {
//       const updated = prev.filter((item) => item.id !== id);
//       if (updated.length === 0 && fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return updated;
//     });
//   }

//   // Bitta faylni yuklash va Telegram'ga darhol yuborib, ro'yxatdan o'chirish
//   async function uploadAndSendSingleFile(item: FileItem) {
//     setFileItems((prev) =>
//       prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
//     );

//     try {
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Sessiya yaratilmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f))
//       );

//       await upload(session.pathname, item.file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => {
//           setFileItems((prev) =>
//             prev.map((f) => (f.id === item.id ? { ...f, progress: 40 + Math.round(percentage * 0.4) } : f))
//           );
//         },
//       });

//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Tekshirish amalga oshmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100, jobId: session.jobId } : f))
//       );

//       // Telegram'ga yuborish
//       const sendResponse = await fetch('/api/telegram/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId, caption }),
//       });
//       const sendResult = (await sendResponse.json()) as ApiResult;

//       if (!sendResponse.ok) {
//         throw new Error(sendResult.message ?? 'Telegram’ga yuborish amalga oshmadi.');
//       }

//       setStatus(`${item.file.name} Telegram'ga yuborildi.`);

//       // Muvaffaqiyatli yuborilgach darhol ro'yxatdan o'chirish (tozalash)
//       setFileItems((prev) => {
//         const updated = prev.filter((f) => f.id !== item.id);
//         if (updated.length === 0) {
//           if (fileInputRef.current) fileInputRef.current.value = '';
//           setCaption('');
//         }
//         return updated;
//       });

//     } catch (err) {
//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Xatolik' } : f))
//       );
//       setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
//     }
//   }

//   // "Hamma fayllarni alohida yuklash" - barchasi bir vaqtning o'zida parallel yuklanadi
//   async function handleStartAllUploads(e: FormEvent) {
//     e.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');
//     if (pendingItems.length === 0) return;

//     setBusy(true);
//     setStatus('Fayllar parallel ravishda yuklanmoqda...');

//     // Promise.all orqali barcha fayllar BIR VAQTNING O'ZIDA yuklana boshlaydi
//     await Promise.all(pendingItems.map((item) => uploadAndSendSingleFile(item)));

//     setBusy(false);
//     setStatus('Barcha jarayonlar yakunlandi.');
//   }

//   // "Telegram’ga yuborish" tugmasi bosilganda ham barchasini parallel yuklaymiz
//   async function sendFilesToTelegram(event: FormEvent) {
//     event.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');

//     setBusy(true);
//     setError('');

//     try {
//       if (pendingItems.length > 0) {
//         setStatus('Fayllar parallel yuklanib, Telegram’ga yuborilmoqda...');
//         // Barcha fayllar bir vaqtning o'zida yuklanadi
//         await Promise.all(pendingItems.map((item) => uploadAndSendSingleFile(item)));
//       } else if (caption.trim().length > 0) {
//         setStatus('Xabar Telegram’ga yuborilmoqda...');
//         const response = await fetch('/api/telegram/send', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ caption }),
//         });
//         const result = (await response.json()) as ApiResult;

//         if (!response.ok) {
//           throw new Error(result.message ?? 'Xabar yuborish amalga oshmadi.');
//         }

//         setStatus('Xabar Telegram’ga yuborildi.');
//         setCaption('');
//       } else {
//         setError('Yuborish uchun fayl yoki xabar kiriting.');
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Yuborishda xatolik yuz berdi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setFileItems([]);
//     setCaption('');
//     setStatus('');
//     setError('');
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   const hasPendingFiles = fileItems.some((f) => f.status === 'pending' || f.status === 'error');

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header">
//           <div className="brand-row"><span className="brand-mark"></span><div><p className="eyebrow"></p><h1></h1></div></div>
//           <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//         </header>

//         <form className="stack" onSubmit={handleStartAllUploads}>
//           <label>
//             <input
//               ref={fileInputRef}
//               type="file"
//               multiple
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 const selected = event.target.files ? Array.from(event.target.files) : [];
//                 const newItems: FileItem[] = selected.map((file) => ({
//                   id: Math.random().toString(36).substring(2, 9),
//                   file,
//                   status: 'pending',
//                   progress: 0,
//                 }));
//                 setFileItems((prev) => [...prev, ...newItems]);
//                 setStatus('');
//                 setError('');
//               }}
//             />
//           </label>

//           {fileItems.length > 0 && (
//             <div className="file-list" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
//               <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Fayllar ro‘yxati ({fileItems.length} ta):</p>
//               <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                 {fileItems.map((item) => (
//                   <li key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '6px', background: '#f9f9f9', padding: '6px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: item.status === 'done' ? 'bold' : 'normal' }}>
//                         {item.file.name}
//                       </span>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//                         <span style={{ fontSize: '11px', color: item.status === 'done' ? 'green' : item.status === 'uploading' ? 'blue' : item.status === 'error' ? 'red' : '#666' }}>
//                           {item.status === 'done' ? 'Yuborildi' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'error' ? 'Xato' : 'Navbatda'}
//                         </span>

//                         {/* Ko'zcha */}
//                         {item.file.type.startsWith('image/') && (
//                           <button
//                             type="button"
//                             onClick={() => setPreviewImage(URL.createObjectURL(item.file))}
//                             style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
//                             title="Ko'rish"
//                           >
//                             👁️
//                           </button>
//                         )}

//                         {/* O'chirish */}
//                         <button
//                           type="button"
//                           onClick={() => removeFileItem(item.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '14px', fontWeight: 'bold' }}
//                           title="O'chirish"
//                         >
//                           🗑
//                         </button>
//                       </div>
//                     </div>
//                     {item.status === 'uploading' && (
//                       <div style={{ width: '100%', background: '#ddd', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
//                         <div style={{ width: `${item.progress}%`, background: '#0070f3', height: '100%', borderRadius: '2px', transition: 'width 0.2s' }}></div>
//                       </div>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Xabar yozish maydoni */}
//           <label style={{ marginTop: '10px' }}>
//             Xabar (ixtiyoriy)
//             <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
//           </label>

//           {/* Tugmalar yonma-yon */}
//           <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
//             <button type="submit" disabled={busy || !hasPendingFiles} style={{ flex: 1 }}>
//               {busy ? 'Yuklanmoqda...' : 'Hamma fayllarni alohida yuklash'}
//             </button>
            
//             <button 
//               type="button" 
//               onClick={sendFilesToTelegram} 
//               disabled={busy || (!hasPendingFiles && !caption.trim())} 
//               style={{ flex: 1, backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               Telegram’ga yuborish
//             </button>
//           </div>
//         </form>

//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>

//       {/* Rasmni kattalashtirib ko'rish oynasi (Modal) */}
//       {previewImage && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', textAlign: 'center', position: 'relative' }}>
//             <button
//               onClick={() => setPreviewImage(null)}
//               style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '4px', marginTop: '15px' }} />
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }



















// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useRef, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// type FileItem = {
//   id: string;
//   file: File;
//   status: 'pending' | 'uploading' | 'done' | 'error';
//   progress: number;
//   jobId?: string;
//   errorMsg?: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
//   const [fileItems, setFileItems] = useState<FileItem[]>([]);
//   const [caption, setCaption] = useState('');
//   const [previewImage, setPreviewImage] = useState<string | null>(null);

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));
//   }, []);

//   // Skrinshotni Ctrl + V orqali qabul qilish
//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       const newItems: FileItem[] = [];
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             const fileName = `screenshot_${Date.now()}_${i}.png`;
//             const file = new File([blob], fileName, { type: blob.type });
//             newItems.push({
//               id: Math.random().toString(36).substring(2, 9),
//               file,
//               status: 'pending',
//               progress: 0,
//             });
//           }
//         }
//       }

//       if (newItems.length > 0) {
//         setFileItems((prev) => [...prev, ...newItems]);
//         setStatus(`${newItems.length} ta rasm qo'shildi.`);
//         setError('');
//         event.preventDefault();
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');
//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
//           return;
//         }
//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   function removeFileItem(id: string) {
//     setFileItems((prev) => {
//       const updated = prev.filter((item) => item.id !== id);
//       if (updated.length === 0 && fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return updated;
//     });
//   }

//   async function uploadAndSendSingleFile(item: FileItem) {
//     setFileItems((prev) =>
//       prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
//     );

//     try {
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Sessiya yaratilmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f))
//       );

//       await upload(session.pathname, item.file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => {
//           setFileItems((prev) =>
//             prev.map((f) => (f.id === item.id ? { ...f, progress: 40 + Math.round(percentage * 0.4) } : f))
//           );
//         },
//       });

//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Tekshirish amalga oshmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100, jobId: session.jobId } : f))
//       );

//       const sendResponse = await fetch('/api/telegram/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId, caption }),
//       });
//       const sendResult = (await sendResponse.json()) as ApiResult;

//       if (!sendResponse.ok) {
//         throw new Error(sendResult.message ?? 'Telegram’ga yuborish amalga oshmadi.');
//       }

//       setFileItems((prev) => {
//         const updated = prev.filter((f) => f.id !== item.id);
//         if (updated.length === 0) {
//           if (fileInputRef.current) fileInputRef.current.value = '';
//           setCaption('');
//         }
//         return updated;
//       });

//     } catch (err) {
//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Xatolik' } : f))
//       );
//       setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
//     }
//   }

//   // Asosiy yuborish funksiyasi (fayl bo'lsa parallel yuklaydi, bo'lmasa matnni yuboradi)
//   async function handleStartUploadsAndSend(e: FormEvent) {
//     e.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');

//     setBusy(true);
//     setError('');

//     try {
//       if (pendingItems.length > 0) {
//         setStatus('Fayllar parallel yuklanib, Telegram’ga yuborilmoqda...');
//         await Promise.all(pendingItems.map((item) => uploadAndSendSingleFile(item)));
//         setStatus('Barcha jarayonlar yakunlandi va tozalandi.');
//       } else if (caption.trim().length > 0) {
//         setStatus('Xabar Telegram’ga yuborilmoqda...');
//         const response = await fetch('/api/telegram/send', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ caption }),
//         });
//         const result = (await response.json()) as ApiResult;

//         if (!response.ok) {
//           throw new Error(result.message ?? 'Xabar yuborish amalga oshmadi.');
//         }

//         setStatus('Xabar Telegram’ga yuborildi.');
//         setCaption('');
//       } else {
//         setError('Yuborish uchun fayl yoki xabar kiriting.');
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Yuborishda xatolik yuz berdi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setFileItems([]);
//     setCaption('');
//     setStatus('');
//     setError('');
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   const hasPendingFiles = fileItems.some((f) => f.status === 'pending' || f.status === 'error');

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header">
//           <div className="brand-row"><div><p className="eyebrow">Ctrl+V ni bosib skreshotni tashla bo'ldi</p></div></div>
//           <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//         </header>

//         <form className="stack" onSubmit={handleStartUploadsAndSend}>
//           <label>
//             <input
//               ref={fileInputRef}
//               type="file"
//               multiple
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 const selected = event.target.files ? Array.from(event.target.files) : [];
//                 const newItems: FileItem[] = selected.map((file) => ({
//                   id: Math.random().toString(36).substring(2, 9),
//                   file,
//                   status: 'pending',
//                   progress: 0,
//                 }));
//                 setFileItems((prev) => [...prev, ...newItems]);
//                 setStatus('');
//                 setError('');
//               }}
//             />
//           </label>

//           {fileItems.length > 0 && (
//             <div className="file-list" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
//               <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Fayllar ro‘yxati ({fileItems.length} ta):</p>
//               <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                 {fileItems.map((item) => (
//                   <li key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '6px', background: '#f9f9f9', padding: '6px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: item.status === 'done' ? 'bold' : 'normal' }}>
//                         {item.file.name}
//                       </span>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                         <span style={{ fontSize: '11px', color: item.status === 'done' ? 'green' : item.status === 'uploading' ? 'blue' : item.status === 'error' ? 'red' : '#666' }}>
//                           {item.status === 'done' ? 'Yuborildi' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'error' ? 'Xato' : 'Navbatda'}
//                         </span>

//                         {/* Zamonaviy SVG Ko'zcha iconi */}
//                         {item.file.type.startsWith('image/') && (
//                           <button
//                             type="button"
//                             onClick={() => setPreviewImage(URL.createObjectURL(item.file))}
//                             style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                             title="Ko'rish"
//                           >
//                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                               <circle cx="12" cy="12" r="3"></circle>
//                             </svg>
//                           </button>
//                         )}

//                         {/* Zamonaviy SVG O'chirish (Savatcha) iconi */}
//                         <button
//                           type="button"
//                           onClick={() => removeFileItem(item.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="O'chirish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="3 6 5 6 21 6"></polyline>
//                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                             <line x1="10" y1="11" x2="10" y2="17"></line>
//                             <line x1="14" y1="11" x2="14" y2="17"></line>
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                     {item.status === 'uploading' && (
//                       <div style={{ width: '100%', background: '#ddd', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
//                         <div style={{ width: `${item.progress}%`, background: '#2563eb', height: '100%', borderRadius: '2px', transition: 'width 0.2s' }}></div>
//                       </div>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Xabar yozish maydoni */}
//           <label style={{ marginTop: '10px' }}>
//             Xabar (ixtiyoriy)
//             <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
//           </label>

//           {/* Bitta yagona zamonaviy yuborish tugmasi */}
//           <button 
//             type="submit" 
//             disabled={busy || (!hasPendingFiles && !caption.trim())} 
//             style={{ 
//               marginTop: '10px', 
//               width: '100%', 
//               backgroundColor: '#2563eb', 
//               color: 'white', 
//               padding: '10px', 
//               border: 'none', 
//               borderRadius: '6px', 
//               cursor: 'pointer', 
//               fontWeight: 'bold',
//               fontSize: '14px'
//             }}
//           >
//             {busy ? 'Yuborilmoqda...' : 'Telegram’ga yuborish'}
//           </button>
//         </form>

//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>

//       {/* Rasmni kattalashtirib ko'rish oynasi (Modal) */}
//       {previewImage && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', textAlign: 'center', position: 'relative' }}>
//             <button
//               onClick={() => setPreviewImage(null)}
//               style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '4px', marginTop: '15px' }} />
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }
























// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useRef, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// type FileItem = {
//   id: string;
//   file: File;
//   status: 'pending' | 'uploading' | 'done' | 'error';
//   progress: number;
//   jobId?: string;
//   errorMsg?: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
//   const [fileItems, setFileItems] = useState<FileItem[]>([]);
//   const [caption, setCaption] = useState('');
//   const [previewImage, setPreviewImage] = useState<string | null>(null);

//   // Shaxsiy eslatmalar paneli uchun state'lar
//   const [showNotesModal, setShowNotesModal] = useState(false);
//   const [notesUnlocked, setNotesUnlocked] = useState(false);
//   const [notesPasswordInput, setNotesPasswordInput] = useState('');
//   const [notesImages, setNotesImages] = useState<string[]>([]);
//   const [notesError, setNotesError] = useState('');

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));

//     // Brauzerdan saqlangan eslatma rasmlarini o'qib olish
//     const saved = localStorage.getItem('user_private_notes');
//     if (saved) {
//       try {
//         setNotesImages(JSON.parse(saved));
//       } catch (e) {
//         console.error(e);
//       }
//     }
//   }, []);

//   // Skrinshotni Ctrl + V orqali qabul qilish
//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       const newItems: FileItem[] = [];
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             const fileName = `screenshot_${Date.now()}_${i}.png`;
//             const file = new File([blob], fileName, { type: blob.type });
//             newItems.push({
//               id: Math.random().toString(36).substring(2, 9),
//               file,
//               status: 'pending',
//               progress: 0,
//             });
//           }
//         }
//       }

//       if (newItems.length > 0) {
//         setFileItems((prev) => [...prev, ...newItems]);
//         setStatus(`${newItems.length} ta rasm qo'shildi.`);
//         setError('');
//         event.preventDefault();
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');
//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
//           return;
//         }
//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   function removeFileItem(id: string) {
//     setFileItems((prev) => {
//       const updated = prev.filter((item) => item.id !== id);
//       if (updated.length === 0 && fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return updated;
//     });
//   }

//   async function uploadAndSendSingleFile(item: FileItem) {
//     setFileItems((prev) =>
//       prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
//     );

//     try {
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Sessiya yaratilmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f))
//       );

//       await upload(session.pathname, item.file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => {
//           setFileItems((prev) =>
//             prev.map((f) => (f.id === item.id ? { ...f, progress: 40 + Math.round(percentage * 0.4) } : f))
//           );
//         },
//       });

//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Tekshirish amalga oshmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100, jobId: session.jobId } : f))
//       );

//       const sendResponse = await fetch('/api/telegram/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId, caption }),
//       });
//       const sendResult = (await sendResponse.json()) as ApiResult;

//       if (!sendResponse.ok) {
//         throw new Error(sendResult.message ?? 'Telegram’ga yuborish amalga oshmadi.');
//       }

//       setFileItems((prev) => {
//         const updated = prev.filter((f) => f.id !== item.id);
//         if (updated.length === 0) {
//           if (fileInputRef.current) fileInputRef.current.value = '';
//           setCaption('');
//         }
//         return updated;
//       });

//     } catch (err) {
//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Xatolik' } : f))
//       );
//       setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
//     }
//   }

//   async function handleStartUploadsAndSend(e: FormEvent) {
//     e.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');

//     setBusy(true);
//     setError('');

//     try {
//       if (pendingItems.length > 0) {
//         setStatus('Fayllar parallel yuklanib, Telegram’ga yuborilmoqda...');
//         await Promise.all(pendingItems.map((item) => uploadAndSendSingleFile(item)));
//         setStatus('Barcha jarayonlar yakunlandi va tozalandi.');
//       } else if (caption.trim().length > 0) {
//         setStatus('Xabar Telegram’ga yuborilmoqda...');
//         const response = await fetch('/api/telegram/send', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ caption }),
//         });
//         const result = (await response.json()) as ApiResult;

//         if (!response.ok) {
//           throw new Error(result.message ?? 'Xabar yuborish amalga oshmadi.');
//         }

//         setStatus('Xabar Telegram’ga yuborildi.');
//         setCaption('');
//       } else {
//         setError('Yuborish uchun fayl yoki xabar kiriting.');
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Yuborishda xatolik yuz berdi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setFileItems([]);
//     setCaption('');
//     setStatus('');
//     setError('');
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }

//   // Eslatmalar uchun parol tekshirish va rasmlarni qo'shish/o'chirish
//   async function handleNotesUnlock(e: FormEvent) {
//     e.preventDefault();
//     setNotesError('');
//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password: notesPasswordInput }),
//       });
//       if (!response.ok) {
//         throw new Error('Parol noto‘g‘ri.');
//       }
//       setNotesUnlocked(true);
//       setNotesPasswordInput('');
//     } catch (err) {
//       setNotesError('Parol noto‘g‘ri kiritildi.');
//     }
//   }

//   function handleAddNoteImage(e: React.ChangeEvent<HTMLInputElement>) {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;

//     if (notesImages.length >= 3) {
//       alert('Ko‘pi bilan 3 ta rasm saqlash mumkin!');
//       return;
//     }

//     const file = files[0];
//     const reader = new FileReader();
//     reader.onload = (uploadEvent) => {
//       const result = uploadEvent.target?.result as string;
//       if (result) {
//         const updated = [...notesImages, result].slice(0, 3);
//         setNotesImages(updated);
//         localStorage.setItem('user_private_notes', JSON.stringify(updated));
//       }
//     };
//     reader.readAsDataURL(file);
//     e.target.value = '';
//   }

//   function removeNoteImage(indexToRemove: number) {
//     const updated = notesImages.filter((_, idx) => idx !== indexToRemove);
//     setNotesImages(updated);
//     localStorage.setItem('user_private_notes', JSON.stringify(updated));
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   const hasPendingFiles = fileItems.some((f) => f.status === 'pending' || f.status === 'error');

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <div className="brand-row"><div><p className="eyebrow">CTRL+V NI BOSIB SKRESHOTNI TAShLA BO'LDI</p></div></div>
//           <div style={{ display: 'flex', gap: '8px' }}>
//             {/* Eslatmalar tugmasi Chiqish tugmasining chap tarafida */}
//             <button 
//               className="secondary-button" 
//               type="button" 
//               onClick={() => { setShowNotesModal(true); setNotesUnlocked(false); setNotesError(''); }}
//               style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer' }}
//             >
//               🔒 Eslatmalar
//             </button>
//             <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//           </div>
//         </header>

//         <form className="stack" onSubmit={handleStartUploadsAndSend}>
//           <label>
//             <input
//               ref={fileInputRef}
//               type="file"
//               multiple
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 const selected = event.target.files ? Array.from(event.target.files) : [];
//                 const newItems: FileItem[] = selected.map((file) => ({
//                   id: Math.random().toString(36).substring(2, 9),
//                   file,
//                   status: 'pending',
//                   progress: 0,
//                 }));
//                 setFileItems((prev) => [...prev, ...newItems]);
//                 setStatus('');
//                 setError('');
//               }}
//             />
//           </label>

//           {fileItems.length > 0 && (
//             <div className="file-list" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
//               <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Fayllar ro‘yxati ({fileItems.length} ta):</p>
//               <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                 {fileItems.map((item) => (
//                   <li key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '6px', background: '#f9f9f9', padding: '6px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: item.status === 'done' ? 'bold' : 'normal' }}>
//                         {item.file.name}
//                       </span>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                         <span style={{ fontSize: '11px', color: item.status === 'done' ? 'green' : item.status === 'uploading' ? 'blue' : item.status === 'error' ? 'red' : '#666' }}>
//                           {item.status === 'done' ? 'Yuborildi' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'error' ? 'Xato' : 'Navbatda'}
//                         </span>

//                         {/* Ko'zcha iconi */}
//                         {item.file.type.startsWith('image/') && (
//                           <button
//                             type="button"
//                             onClick={() => setPreviewImage(URL.createObjectURL(item.file))}
//                             style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                             title="Ko'rish"
//                           >
//                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                               <circle cx="12" cy="12" r="3"></circle>
//                             </svg>
//                           </button>
//                         )}

//                         {/* O'chirish iconi */}
//                         <button
//                           type="button"
//                           onClick={() => removeFileItem(item.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="O'chirish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="3 6 5 6 21 6"></polyline>
//                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                             <line x1="10" y1="11" x2="10" y2="17"></line>
//                             <line x1="14" y1="11" x2="14" y2="17"></line>
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                     {item.status === 'uploading' && (
//                       <div style={{ width: '100%', background: '#ddd', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
//                         <div style={{ width: `${item.progress}%`, background: '#2563eb', height: '100%', borderRadius: '2px', transition: 'width 0.2s' }}></div>
//                       </div>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Xabar yozish maydoni */}
//           <label style={{ marginTop: '10px' }}>
//             Xabar (ixtiyoriy)
//             <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
//           </label>

//           {/* Yuborish tugmasi */}
//           <button 
//             type="submit" 
//             disabled={busy || (!hasPendingFiles && !caption.trim())} 
//             style={{ 
//               marginTop: '10px', 
//               width: '100%', 
//               backgroundColor: '#2563eb', 
//               color: 'white', 
//               padding: '10px', 
//               border: 'none', 
//               borderRadius: '6px', 
//               cursor: 'pointer', 
//               fontWeight: 'bold',
//               fontSize: '14px'
//             }}
//           >
//             {busy ? 'Yuborilmoqda...' : 'Telegram’ga yuborish'}
//           </button>
//         </form>

//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>

//       {/* Rasmni kattalashtirib ko'rish oynasi (Modal) */}
//       {previewImage && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', textAlign: 'center', position: 'relative' }}>
//             <button
//               onClick={() => setPreviewImage(null)}
//               style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '4px', marginTop: '15px' }} />
//           </div>
//         </div>
//       )}

//       {/* Shaxsiy Eslatmalar Modal Oynasi */}
//       {showNotesModal && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '400px', position: 'relative' }}>
//             <button
//               onClick={() => setShowNotesModal(false)}
//               style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>🔒 Shaxsiy eslatmalar (Parollar va rasmlar)</h3>

//             {!notesUnlocked ? (
//               <form onSubmit={handleNotesUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                 <label style={{ fontSize: '13px' }}>
//                   Kirish parolini kiriting:
//                   <input
//                     type="password"
//                     value={notesPasswordInput}
//                     onChange={(e) => setNotesPasswordInput(e.target.value)}
//                     required
//                     style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   />
//                 </label>
//                 {notesError && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{notesError}</p>}
//                 <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
//                   Ochish
//                 </button>
//               </form>
//             ) : (
//               <div>
//                 <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
//                   Maksimal 3 ta rasm saqlashingiz mumkin ({notesImages.length}/3):
//                 </p>

//                 {notesImages.length < 3 && (
//                   <label style={{ display: 'block', marginBottom: '15px', border: '2px dashed #cbd5e1', padding: '10px', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', background: '#f8fafc', fontSize: '13px' }}>
//                     📁 Rasm qo‘shish (Tanlash)
//                     <input type="file" accept="image/*" onChange={handleAddNoteImage} style={{ display: 'none' }} />
//                   </label>
//                 )}

//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
//                   {notesImages.map((imgSrc, idx) => (
//                     <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '4px' }}>
//                       <span style={{ fontSize: '13px', fontWeight: '500' }}>Rasm #{idx + 1}</span>
//                       <div style={{ display: 'flex', gap: '8px' }}>
//                         <button
//                           type="button"
//                           onClick={() => setPreviewImage(imgSrc)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
//                           title="Ko'rish"
//                         >
//                           👁️
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => removeNoteImage(idx)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red', fontSize: '14px', fontWeight: 'bold' }}
//                           title="O'chirish"
//                         >
//                           ❌
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                   {notesImages.length === 0 && (
//                     <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Hozircha rasmlar yo‘q.</p>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }






















// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useRef, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// type FileItem = {
//   id: string;
//   file: File;
//   status: 'pending' | 'uploading' | 'done' | 'error';
//   progress: number;
//   jobId?: string;
//   errorMsg?: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
//   const [fileItems, setFileItems] = useState<FileItem[]>([]);
//   const [caption, setCaption] = useState('');
//   const [previewImage, setPreviewImage] = useState<string | null>(null);

//   // Shaxsiy eslatmalar paneli uchun state'lar
//   const [showNotesModal, setShowNotesModal] = useState(false);
//   const [notesUnlocked, setNotesUnlocked] = useState(false);
//   const [notesPasswordInput, setNotesPasswordInput] = useState('');
//   const [notesImages, setNotesImages] = useState<string[]>([]);
//   const [notesError, setNotesError] = useState('');

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));

//     // Brauzerdan saqlangan eslatma rasmlarini o'qib olish
//     const saved = localStorage.getItem('user_private_notes');
//     if (saved) {
//       try {
//         setNotesImages(JSON.parse(saved));
//       } catch (e) {
//         console.error(e);
//       }
//     }
//   }, []);

//   // Skrinshotni Ctrl + V orqali qabul qilish
//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       const newItems: FileItem[] = [];
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             const fileName = `screenshot_${Date.now()}_${i}.png`;
//             const file = new File([blob], fileName, { type: blob.type });
//             newItems.push({
//               id: Math.random().toString(36).substring(2, 9),
//               file,
//               status: 'pending',
//               progress: 0,
//             });
//           }
//         }
//       }

//       if (newItems.length > 0) {
//         setFileItems((prev) => [...prev, ...newItems]);
//         setStatus(`${newItems.length} ta rasm qo'shildi.`);
//         setError('');
//         event.preventDefault();
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');
//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
//           return;
//         }
//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   function removeFileItem(id: string) {
//     setFileItems((prev) => {
//       const updated = prev.filter((item) => item.id !== id);
//       if (updated.length === 0 && fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return updated;
//     });
//   }

//   async function uploadAndSendSingleFile(item: FileItem) {
//     setFileItems((prev) =>
//       prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
//     );

//     try {
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Sessiya yaratilmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f))
//       );

//       await upload(session.pathname, item.file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => {
//           setFileItems((prev) =>
//             prev.map((f) => (f.id === item.id ? { ...f, progress: 40 + Math.round(percentage * 0.4) } : f))
//           );
//         },
//       });

//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Tekshirish amalga oshmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100, jobId: session.jobId } : f))
//       );

//       const sendResponse = await fetch('/api/telegram/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId, caption }),
//       });
//       const sendResult = (await sendResponse.json()) as ApiResult;

//       if (!sendResponse.ok) {
//         throw new Error(sendResult.message ?? 'Telegram’ga yuborish amalga oshmadi.');
//       }

//       setFileItems((prev) => {
//         const updated = prev.filter((f) => f.id !== item.id);
//         if (updated.length === 0) {
//           if (fileInputRef.current) fileInputRef.current.value = '';
//           setCaption('');
//         }
//         return updated;
//       });

//     } catch (err) {
//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Xatolik' } : f))
//       );
//       setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
//     }
//   }

//   async function handleStartUploadsAndSend(e: FormEvent) {
//     e.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');

//     setBusy(true);
//     setError('');

//     try {
//       if (pendingItems.length > 0) {
//         setStatus('Fayllar parallel yuklanib, Telegram’ga yuborilmoqda...');
//         await Promise.all(pendingItems.map((item) => uploadAndSendSingleFile(item)));
//         setStatus('Barcha jarayonlar yakunlandi va tozalandi.');
//       } else if (caption.trim().length > 0) {
//         setStatus('Xabar Telegram’ga yuborilmoqda...');
//         const response = await fetch('/api/telegram/send', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ caption }),
//         });
//         const result = (await response.json()) as ApiResult;

//         if (!response.ok) {
//           throw new Error(result.message ?? 'Xabar yuborish amalga oshmadi.');
//         }

//         setStatus('Xabar Telegram’ga yuborildi.');
//         setCaption('');
//       } else {
//         setError('Yuborish uchun fayl yoki xabar kiriting.');
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Yuborishda xatolik yuz berdi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setFileItems([]);
//     setCaption('');
//     setStatus('');
//     setError('');
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }

//   // Eslatmalar uchun parol tekshirish va rasmlarni qo'shish/o'chirish
//   async function handleNotesUnlock(e: FormEvent) {
//     e.preventDefault();
//     setNotesError('');
//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password: notesPasswordInput }),
//       });
//       if (!response.ok) {
//         throw new Error('Parol noto‘g‘ri.');
//       }
//       setNotesUnlocked(true);
//       setNotesPasswordInput('');
//     } catch (err) {
//       setNotesError('Parol noto‘g‘ri kiritildi.');
//     }
//   }

//   function handleAddNoteImage(e: React.ChangeEvent<HTMLInputElement>) {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;

//     if (notesImages.length >= 3) {
//       alert('Ko‘pi bilan 3 ta rasm saqlash mumkin!');
//       return;
//     }

//     const file = files[0];
//     const reader = new FileReader();
//     reader.onload = (uploadEvent) => {
//       const result = uploadEvent.target?.result as string;
//       if (result) {
//         const updated = [...notesImages, result].slice(0, 3);
//         setNotesImages(updated);
//         localStorage.setItem('user_private_notes', JSON.stringify(updated));
//       }
//     };
//     reader.readAsDataURL(file);
//     e.target.value = '';
//   }

//   function removeNoteImage(indexToRemove: number) {
//     const updated = notesImages.filter((_, idx) => idx !== indexToRemove);
//     setNotesImages(updated);
//     localStorage.setItem('user_private_notes', JSON.stringify(updated));
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   const hasPendingFiles = fileItems.some((f) => f.status === 'pending' || f.status === 'error');

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <div className="brand-row"><div><p className="eyebrow">CTRL+V NI BOSIB SKRESHOTNI TAShLA BO'LDI</p></div></div>
//           <div style={{ display: 'flex', gap: '8px' }}>
//             {/* Eslatmalar tugmasi (qulf ikonkalik) */}
//             <button 
//               className="secondary-button" 
//               type="button" 
//               onClick={() => { setShowNotesModal(true); setNotesUnlocked(false); setNotesError(''); }}
//               style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
//             >
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                 <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
//                 <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
//               </svg>
//               Eslatmalar
//             </button>
//             <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//           </div>
//         </header>

//         <form className="stack" onSubmit={handleStartUploadsAndSend}>
//           <label>
//             <input
//               ref={fileInputRef}
//               type="file"
//               multiple
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 const selected = event.target.files ? Array.from(event.target.files) : [];
//                 const newItems: FileItem[] = selected.map((file) => ({
//                   id: Math.random().toString(36).substring(2, 9),
//                   file,
//                   status: 'pending',
//                   progress: 0,
//                 }));
//                 setFileItems((prev) => [...prev, ...newItems]);
//                 setStatus('');
//                 setError('');
//               }}
//             />
//           </label>

//           {fileItems.length > 0 && (
//             <div className="file-list" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
//               <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Fayllar ro‘yxati ({fileItems.length} ta):</p>
//               <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                 {fileItems.map((item) => (
//                   <li key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '6px', background: '#f9f9f9', padding: '6px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: item.status === 'done' ? 'bold' : 'normal' }}>
//                         {item.file.name}
//                       </span>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                         <span style={{ fontSize: '11px', color: item.status === 'done' ? 'green' : item.status === 'uploading' ? 'blue' : item.status === 'error' ? 'red' : '#666' }}>
//                           {item.status === 'done' ? 'Yuborildi' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'error' ? 'Xato' : 'Navbatda'}
//                         </span>

//                         {/* Zamonaviy ko'k ko'zcha ikonasi */}
//                         {item.file.type.startsWith('image/') && (
//                           <button
//                             type="button"
//                             onClick={() => setPreviewImage(URL.createObjectURL(item.file))}
//                             style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                             title="Ko'rish"
//                           >
//                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                               <circle cx="12" cy="12" r="3"></circle>
//                             </svg>
//                           </button>
//                         )}

//                         {/* Zamonaviy qizil savatcha (o'chirish) ikonasi */}
//                         <button
//                           type="button"
//                           onClick={() => removeFileItem(item.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="O'chirish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="3 6 5 6 21 6"></polyline>
//                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                             <line x1="10" y1="11" x2="10" y2="17"></line>
//                             <line x1="14" y1="11" x2="14" y2="17"></line>
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                     {item.status === 'uploading' && (
//                       <div style={{ width: '100%', background: '#ddd', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
//                         <div style={{ width: `${item.progress}%`, background: '#2563eb', height: '100%', borderRadius: '2px', transition: 'width 0.2s' }}></div>
//                       </div>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Xabar yozish maydoni */}
//           <label style={{ marginTop: '10px' }}>
//             Xabar (ixtiyoriy)
//             <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
//           </label>

//           {/* Yuborish tugmasi */}
//           <button 
//             type="submit" 
//             disabled={busy || (!hasPendingFiles && !caption.trim())} 
//             style={{ 
//               marginTop: '10px', 
//               width: '100%', 
//               backgroundColor: '#2563eb', 
//               color: 'white', 
//               padding: '10px', 
//               border: 'none', 
//               borderRadius: '6px', 
//               cursor: 'pointer', 
//               fontWeight: 'bold',
//               fontSize: '14px'
//             }}
//           >
//             {busy ? 'Yuborilmoqda...' : 'Telegram’ga yuborish'}
//           </button>
//         </form>

//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>

//       {/* Rasmni kattalashtirib ko'rish oynasi (Modal) */}
//       {previewImage && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', textAlign: 'center', position: 'relative' }}>
//             <button
//               onClick={() => setPreviewImage(null)}
//               style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '4px', marginTop: '15px' }} />
//           </div>
//         </div>
//       )}

//       {/* Shaxsiy Eslatmalar Modal Oynasi */}
//       {showNotesModal && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '400px', position: 'relative' }}>
//             <button
//               onClick={() => setShowNotesModal(false)}
//               style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>🔒 Shaxsiy eslatmalar (Parollar va rasmlar)</h3>

//             {!notesUnlocked ? (
//               <form onSubmit={handleNotesUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                 <label style={{ fontSize: '13px' }}>
//                   Kirish parolini kiriting:
//                   <input
//                     type="password"
//                     value={notesPasswordInput}
//                     onChange={(e) => setNotesPasswordInput(e.target.value)}
//                     required
//                     style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   />
//                 </label>
//                 {notesError && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{notesError}</p>}
//                 <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
//                   Ochish
//                 </button>
//               </form>
//             ) : (
//               <div>
//                 <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
//                   Maksimal 3 ta rasm saqlashingiz mumkin ({notesImages.length}/3):
//                 </p>

//                 {notesImages.length < 3 && (
//                   <label style={{ display: 'block', marginBottom: '15px', border: '2px dashed #cbd5e1', padding: '10px', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', background: '#f8fafc', fontSize: '13px' }}>
//                     📁 Rasm qo‘shish (Tanlash)
//                     <input type="file" accept="image/*" onChange={handleAddNoteImage} style={{ display: 'none' }} />
//                   </label>
//                 )}

//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
//                   {notesImages.map((imgSrc, idx) => (
//                     <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '4px' }}>
//                       <span style={{ fontSize: '13px', fontWeight: '500' }}>Rasm #{idx + 1}</span>
//                       <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
//                         {/* Zamonaviy ko'k ko'zcha ikonasi */}
//                         <button
//                           type="button"
//                           onClick={() => setPreviewImage(imgSrc)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="Ko'rish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                             <circle cx="12" cy="12" r="3"></circle>
//                           </svg>
//                         </button>
//                         {/* Zamonaviy qizil savatcha ikonasi */}
//                         <button
//                           type="button"
//                           onClick={() => removeNoteImage(idx)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="O'chirish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="3 6 5 6 21 6"></polyline>
//                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                             <line x1="10" y1="11" x2="10" y2="17"></line>
//                             <line x1="14" y1="11" x2="14" y2="17"></line>
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                   {notesImages.length === 0 && (
//                     <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Hozircha rasmlar yo‘q.</p>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }




















// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useRef, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// type FileItem = {
//   id: string;
//   file: File;
//   status: 'pending' | 'uploading' | 'done' | 'error';
//   progress: number;
//   jobId?: string;
//   errorMsg?: string;
// };

// type NoteImage = {
//   id: number;
//   url: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
//   const [fileItems, setFileItems] = useState<FileItem[]>([]);
//   const [caption, setCaption] = useState('');
//   const [previewImage, setPreviewImage] = useState<string | null>(null);

//   // Shaxsiy eslatmalar uchun state'lar (bazadan o'qiladi)
//   const [showNotesModal, setShowNotesModal] = useState(false);
//   const [notesUnlocked, setNotesUnlocked] = useState(false);
//   const [notesPasswordInput, setNotesPasswordInput] = useState('');
//   const [notesImages, setNotesImages] = useState<NoteImage[]>([]);
//   const [notesError, setNotesError] = useState('');

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));

//     // Server bazasidan eslatma rasmlarini yuklab olish
//     fetchNotesImages();
//   }, []);

//   async function fetchNotesImages() {
//     try {
//       const res = await fetch('/api/notes', { cache: 'no-store' });
//       const data = await res.json();
//       if (data.ok && data.images) {
//         setNotesImages(data.images);
//       }
//     } catch (e) {
//       console.error(e);
//     }
//   }

//   // Skrinshotni Ctrl + V orqali qabul qilish
//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       const newItems: FileItem[] = [];
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             const fileName = `screenshot_${Date.now()}_${i}.png`;
//             const file = new File([blob], fileName, { type: blob.type });
//             newItems.push({
//               id: Math.random().toString(36).substring(2, 9),
//               file,
//               status: 'pending',
//               progress: 0,
//             });
//           }
//         }
//       }

//       if (newItems.length > 0) {
//         setFileItems((prev) => [...prev, ...newItems]);
//         setStatus(`${newItems.length} ta rasm qo'shildi.`);
//         setError('');
//         event.preventDefault();
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');
//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi abbosnorqulov666@gmail.com emailingizga yuborildi.');
//           return;
//         }
//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   function removeFileItem(id: string) {
//     setFileItems((prev) => {
//       const updated = prev.filter((item) => item.id !== id);
//       if (updated.length === 0 && fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return updated;
//     });
//   }

//   async function uploadAndSendSingleFile(item: FileItem) {
//     setFileItems((prev) =>
//       prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
//     );

//     try {
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Sessiya yaratilmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f))
//       );

//       await upload(session.pathname, item.file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => {
//           setFileItems((prev) =>
//             prev.map((f) => (f.id === item.id ? { ...f, progress: 40 + Math.round(percentage * 0.4) } : f))
//           );
//         },
//       });

//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Tekshirish amalga oshmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100, jobId: session.jobId } : f))
//       );

//       const sendResponse = await fetch('/api/telegram/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId, caption }),
//       });
//       const sendResult = (await sendResponse.json()) as ApiResult;

//       if (!sendResponse.ok) {
//         throw new Error(sendResult.message ?? 'Yuborish amalga oshmadi.');
//       }

//       setFileItems((prev) => {
//         const updated = prev.filter((f) => f.id !== item.id);
//         if (updated.length === 0) {
//           if (fileInputRef.current) fileInputRef.current.value = '';
//           setCaption('');
//         }
//         return updated;
//       });

//     } catch (err) {
//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Xatolik' } : f))
//       );
//       setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
//     }
//   }

//   async function handleStartUploadsAndSend(e: FormEvent) {
//     e.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');

//     setBusy(true);
//     setError('');

//     try {
//       if (pendingItems.length > 0) {
//         setStatus('Fayllar yuborilmoqda...');
//         await Promise.all(pendingItems.map((item) => uploadAndSendSingleFile(item)));
//         setStatus('Barcha jarayonlar yakunlandi va tozalandi.');
//       } else if (caption.trim().length > 0) {
//         setStatus('Xabar yuborilmoqda...');
//         const response = await fetch('/api/telegram/send', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ caption }),
//         });
//         const result = (await response.json()) as ApiResult;

//         if (!response.ok) {
//           throw new Error(result.message ?? 'Xabar yuborish amalga oshmadi.');
//         }

//         setStatus('Xabar yuborildi.');
//         setCaption('');
//       } else {
//         setError('Yuborish uchun fayl yoki xabar kiriting.');
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Yuborishda xatolik yuz berdi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setFileItems([]);
//     setCaption('');
//     setStatus('');
//     setError('');
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }

//   // Eslatmalar uchun parol tekshirish
//   async function handleNotesUnlock(e: FormEvent) {
//     e.preventDefault();
//     setNotesError('');
//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password: notesPasswordInput }),
//       });
//       if (!response.ok) {
//         throw new Error('Parol noto‘g‘ri.');
//       }
//       setNotesUnlocked(true);
//       setNotesPasswordInput('');
//       await fetchNotesImages();
//     } catch (err) {
//       setNotesError('Parol noto‘g‘ri kiritildi.');
//     }
//   }

//   // Rasmni bazaga qo'shish
//   function handleAddNoteImage(e: React.ChangeEvent<HTMLInputElement>) {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;

//     if (notesImages.length >= 3) {
//       alert('Ko‘pi bilan 3 ta rasm saqlash mumkin!');
//       return;
//     }

//     const file = files[0];
//     const reader = new FileReader();
//     reader.onload = async (uploadEvent) => {
//       const result = uploadEvent.target?.result as string;
//       if (result) {
//         try {
//           const res = await fetch('/api/notes', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ imageUrl: result }),
//           });
//           const data = await res.json();
//           if (data.ok) {
//             await fetchNotesImages();
//           } else {
//             alert(data.message || 'Saqlashda xatolik.');
//           }
//         } catch (err) {
//           alert('Server bilan xatolik yuz berdi.');
//         }
//       }
//     };
//     reader.readAsDataURL(file);
//     e.target.value = '';
//   }

//   // Rasmni bazadan o'chirish
//   async function removeNoteImage(id: number) {
//     try {
//       const res = await fetch(`/api/notes?id=${id}`, {
//         method: 'DELETE',
//       });
//       const data = await res.json();
//       if (data.ok) {
//         await fetchNotesImages();
//       } else {
//         alert(data.message || 'O‘chirishda xatolik.');
//       }
//     } catch (err) {
//       alert('Server bilan xatolik yuz berdi.');
//     }
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   const hasPendingFiles = fileItems.some((f) => f.status === 'pending' || f.status === 'error');

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <div className="brand-row"><div><p className="eyebrow">CTRL+V NI BOSIB SKRESHOTNI TAShLA BO'LDI</p></div></div>
//           <div style={{ display: 'flex', gap: '8px' }}>
//             {/* Eslatmalar tugmasi */}
//             <button 
//               className="secondary-button" 
//               type="button" 
//               onClick={() => { setShowNotesModal(true); setNotesUnlocked(false); setNotesError(''); }}
//               style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
//             >
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                 <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
//                 <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
//               </svg>
//               Eslatmalar
//             </button>
//             <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//           </div>
//         </header>

//         <form className="stack" onSubmit={handleStartUploadsAndSend}>
//           <label>
//             <input
//               ref={fileInputRef}
//               type="file"
//               multiple
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 const selected = event.target.files ? Array.from(event.target.files) : [];
//                 const newItems: FileItem[] = selected.map((file) => ({
//                   id: Math.random().toString(36).substring(2, 9),
//                   file,
//                   status: 'pending',
//                   progress: 0,
//                 }));
//                 setFileItems((prev) => [...prev, ...newItems]);
//                 setStatus('');
//                 setError('');
//               }}
//             />
//           </label>

//           {fileItems.length > 0 && (
//             <div className="file-list" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
//               <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Fayllar ro‘yxati ({fileItems.length} ta):</p>
//               <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                 {fileItems.map((item) => (
//                   <li key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '6px', background: '#f9f9f9', padding: '6px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: item.status === 'done' ? 'bold' : 'normal' }}>
//                         {item.file.name}
//                       </span>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                         <span style={{ fontSize: '11px', color: item.status === 'done' ? 'green' : item.status === 'uploading' ? 'blue' : item.status === 'error' ? 'red' : '#666' }}>
//                           {item.status === 'done' ? 'Yuborildi' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'error' ? 'Xato' : 'Navbatda'}
//                         </span>

//                         {item.file.type.startsWith('image/') && (
//                           <button
//                             type="button"
//                             onClick={() => setPreviewImage(URL.createObjectURL(item.file))}
//                             style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                             title="Ko'rish"
//                           >
//                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                               <circle cx="12" cy="12" r="3"></circle>
//                             </svg>
//                           </button>
//                         )}

//                         <button
//                           type="button"
//                           onClick={() => removeFileItem(item.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="O'chirish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="3 6 5 6 21 6"></polyline>
//                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                             <line x1="10" y1="11" x2="10" y2="17"></line>
//                             <line x1="14" y1="11" x2="14" y2="17"></line>
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                     {item.status === 'uploading' && (
//                       <div style={{ width: '100%', background: '#ddd', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
//                         <div style={{ width: `${item.progress}%`, background: '#2563eb', height: '100%', borderRadius: '2px', transition: 'width 0.2s' }}></div>
//                       </div>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           <label style={{ marginTop: '10px' }}>
//             Xabar (ixtiyoriy)
//             <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
//           </label>

//           <button 
//             type="submit" 
//             disabled={busy || (!hasPendingFiles && !caption.trim())} 
//             style={{ 
//               marginTop: '10px', 
//               width: '100%', 
//               backgroundColor: '#2563eb', 
//               color: 'white', 
//               padding: '10px', 
//               border: 'none', 
//               borderRadius: '6px', 
//               cursor: 'pointer', 
//               fontWeight: 'bold',
//               fontSize: '14px'
//             }}
//           >
//             {busy ? 'Yuborilmoqda...' : 'Yuborish'}
//           </button>
//         </form>

//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>

//       {previewImage && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', textAlign: 'center', position: 'relative' }}>
//             <button
//               onClick={() => setPreviewImage(null)}
//               style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '4px', marginTop: '15px' }} />
//           </div>
//         </div>
//       )}

//       {showNotesModal && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '400px', position: 'relative' }}>
//             <button
//               onClick={() => setShowNotesModal(false)}
//               style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>🔒 Shaxsiy eslatmalar (Parollar va rasmlar)</h3>

//             {!notesUnlocked ? (
//               <form onSubmit={handleNotesUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                 <label style={{ fontSize: '13px' }}>
//                   Kirish parolini kiriting:
//                   <input
//                     type="password"
//                     value={notesPasswordInput}
//                     onChange={(e) => setNotesPasswordInput(e.target.value)}
//                     required
//                     style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   />
//                 </label>
//                 {notesError && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{notesError}</p>}
//                 <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
//                   Ochish
//                 </button>
//               </form>
//             ) : (
//               <div>
//                 <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
//                   Maksimal 3 ta rasm saqlashingiz mumkin ({notesImages.length}/3):
//                 </p>

//                 {notesImages.length < 3 && (
//                   <label style={{ display: 'block', marginBottom: '15px', border: '2px dashed #cbd5e1', padding: '10px', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', background: '#f8fafc', fontSize: '13px' }}>
//                     📁 Rasm qo‘shish (Tanlash)
//                     <input type="file" accept="image/*" onChange={handleAddNoteImage} style={{ display: 'none' }} />
//                   </label>
//                 )}

//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
//                   {notesImages.map((img, idx) => (
//                     <div key={img.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '4px' }}>
//                       <span style={{ fontSize: '13px', fontWeight: '500' }}>Rasm #{idx + 1}</span>
//                       <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
//                         <button
//                           type="button"
//                           onClick={() => setPreviewImage(img.url)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="Ko'rish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                             <circle cx="12" cy="12" r="3"></circle>
//                           </svg>
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => removeNoteImage(img.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="O'chirish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="3 6 5 6 21 6"></polyline>
//                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                             <line x1="10" y1="11" x2="10" y2="17"></line>
//                             <line x1="14" y1="11" x2="14" y2="17"></line>
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                   {notesImages.length === 0 && (
//                     <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Hozircha rasmlar yo‘q.</p>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }



























// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useRef, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// type FileItem = {
//   id: string;
//   file: File;
//   status: 'pending' | 'uploading' | 'done' | 'error';
//   progress: number;
//   jobId?: string;
//   errorMsg?: string;
// };

// type NoteImage = {
//   id: number;
//   url: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
//   const [fileItems, setFileItems] = useState<FileItem[]>([]);
//   const [caption, setCaption] = useState('');
//   const [previewImage, setPreviewImage] = useState<string | null>(null);

//   // Shaxsiy eslatmalar uchun state'lar
//   const [showNotesModal, setShowNotesModal] = useState(false);
//   const [notesUnlocked, setNotesUnlocked] = useState(false);
//   const [notesPasswordInput, setNotesPasswordInput] = useState('');
//   const [notesImages, setNotesImages] = useState<NoteImage[]>([]);
//   const [notesError, setNotesError] = useState('');

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));

//     fetchNotesImages();
//   }, []);

//   // 5 daqiqa harakatsizlik (inactivity) taymeri
//   useEffect(() => {
//     if (!authenticated) return;

//     let timer: NodeJS.Timeout;

//     const resetTimer = () => {
//       clearTimeout(timer);
//       timer = setTimeout(() => {
//         logout();
//       }, 5 * 60 * 1000); // 5 daqiqa (milli sekundda)
//     };

//     // Foydalanuvchi amal bajarishini kuzatish uchun hodisalar
//     const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
//     events.forEach((event) => {
//       window.addEventListener(event, resetTimer);
//     });

//     // Dastlabki taymerni boshlash
//     resetTimer();

//     return () => {
//       clearTimeout(timer);
//       events.forEach((event) => {
//         window.removeEventListener(event, resetTimer);
//       });
//     };
//   }, [authenticated]);

//   async function fetchNotesImages() {
//     try {
//       const res = await fetch('/api/notes', { cache: 'no-store' });
//       const data = await res.json();
//       if (data.ok && data.images) {
//         setNotesImages(data.images);
//       }
//     } catch (e) {
//       console.error(e);
//     }
//   }

//   // Skrinshotni Ctrl + V orqali qabul qilish
//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       const newItems: FileItem[] = [];
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             const fileName = `screenshot_${Date.now()}_${i}.png`;
//             const file = new File([blob], fileName, { type: blob.type });
//             newItems.push({
//               id: Math.random().toString(36).substring(2, 9),
//               file,
//               status: 'pending',
//               progress: 0,
//             });
//           }
//         }
//       }

//       if (newItems.length > 0) {
//         setFileItems((prev) => [...prev, ...newItems]);
//         setStatus(`${newItems.length} ta rasm qo'shildi.`);
//         setError('');
//         event.preventDefault();
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');
//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
//           return;
//         }
//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   function removeFileItem(id: string) {
//     setFileItems((prev) => {
//       const updated = prev.filter((item) => item.id !== id);
//       if (updated.length === 0 && fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return updated;
//     });
//   }

//   async function uploadAndSendSingleFile(item: FileItem) {
//     setFileItems((prev) =>
//       prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
//     );

//     try {
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Sessiya yaratilmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f))
//       );

//       await upload(session.pathname, item.file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => {
//           setFileItems((prev) =>
//             prev.map((f) => (f.id === item.id ? { ...f, progress: 40 + Math.round(percentage * 0.4) } : f))
//           );
//         },
//       });

//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Tekshirish amalga oshmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100, jobId: session.jobId } : f))
//       );

//       const sendResponse = await fetch('/api/telegram/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId, caption }),
//       });
//       const sendResult = (await sendResponse.json()) as ApiResult;

//       if (!sendResponse.ok) {
//         throw new Error(sendResult.message ?? 'Telegram’ga yuborish amalga oshmadi.');
//       }

//       setFileItems((prev) => {
//         const updated = prev.filter((f) => f.id !== item.id);
//         if (updated.length === 0) {
//           if (fileInputRef.current) fileInputRef.current.value = '';
//           setCaption('');
//         }
//         return updated;
//       });

//     } catch (err) {
//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Xatolik' } : f))
//       );
//       setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
//     }
//   }

//   async function handleStartUploadsAndSend(e: FormEvent) {
//     e.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');

//     setBusy(true);
//     setError('');

//     try {
//       if (pendingItems.length > 0) {
//         setStatus('Fayllar parallel yuklanib, Telegram’ga yuborilmoqda...');
//         await Promise.all(pendingItems.map((item) => uploadAndSendSingleFile(item)));
//         setStatus('Barcha jarayonlar yakunlandi va tozalandi.');
//       } else if (caption.trim().length > 0) {
//         setStatus('Xabar Telegram’ga yuborilmoqda...');
//         const response = await fetch('/api/telegram/send', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ caption }),
//         });
//         const result = (await response.json()) as ApiResult;

//         if (!response.ok) {
//           throw new Error(result.message ?? 'Xabar yuborish amalga oshmadi.');
//         }

//         setStatus('Xabar Telegram’ga yuborildi.');
//         setCaption('');
//       } else {
//         setError('Yuborish uchun fayl yoki xabar kiriting.');
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Yuborishda xatolik yuz berdi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setFileItems([]);
//     setCaption('');
//     setStatus('');
//     setError('');
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }

//   async function handleNotesUnlock(e: FormEvent) {
//     e.preventDefault();
//     setNotesError('');
//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password: notesPasswordInput }),
//       });
//       if (!response.ok) {
//         throw new Error('Parol noto‘g‘ri.');
//       }
//       setNotesUnlocked(true);
//       setNotesPasswordInput('');
//       await fetchNotesImages();
//     } catch (err) {
//       setNotesError('Parol noto‘g‘ri kiritildi.');
//     }
//   }

//   function handleAddNoteImage(e: React.ChangeEvent<HTMLInputElement>) {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;

//     if (notesImages.length >= 3) {
//       alert('Ko‘pi bilan 3 ta rasm saqlash mumkin!');
//       return;
//     }

//     const file = files[0];
//     const reader = new FileReader();
//     reader.onload = async (uploadEvent) => {
//       const result = uploadEvent.target?.result as string;
//       if (result) {
//         try {
//           const res = await fetch('/api/notes', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ imageUrl: result }),
//           });
//           const data = await res.json();
//           if (data.ok) {
//             await fetchNotesImages();
//           } else {
//             alert(data.message || 'Saqlashda xatolik.');
//           }
//         } catch (err) {
//           alert('Server bilan xatolik yuz berdi.');
//         }
//       }
//     };
//     reader.readAsDataURL(file);
//     e.target.value = '';
//   }

//   async function removeNoteImage(id: number) {
//     try {
//       const res = await fetch(`/api/notes?id=${id}`, {
//         method: 'DELETE',
//       });
//       const data = await res.json();
//       if (data.ok) {
//         await fetchNotesImages();
//       } else {
//         alert(data.message || 'O‘chirishda xatolik.');
//       }
//     } catch (err) {
//       alert('Server bilan xatolik yuz berdi.');
//     }
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parol
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
//               </label>
//               <label>
//                 Yangi parolni takrorlang
//                 <input type="password" autoComplete="new-password" minLength={5} maxLength={128} value={confirmNewPassword} onChange={(event) => setConfirmNewPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
//                 Parol
//                 <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   const hasPendingFiles = fileItems.some((f) => f.status === 'pending' || f.status === 'error');

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <div className="brand-row"><div><p className="eyebrow">CTRL+V NI BOSIB SKRESHOTNI TAShLA BO'LDI</p></div></div>
//           <div style={{ display: 'flex', gap: '8px' }}>
//             <button 
//               className="secondary-button" 
//               type="button" 
//               onClick={() => { setShowNotesModal(true); setNotesUnlocked(false); setNotesError(''); }}
//               style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
//             >
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                 <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
//                 <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
//               </svg>
//               Eslatmalar
//             </button>
//             <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//           </div>
//         </header>

//         <form className="stack" onSubmit={handleStartUploadsAndSend}>
//           <label>
//             <input
//               ref={fileInputRef}
//               type="file"
//               multiple
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 const selected = event.target.files ? Array.from(event.target.files) : [];
//                 const newItems: FileItem[] = selected.map((file) => ({
//                   id: Math.random().toString(36).substring(2, 9),
//                   file,
//                   status: 'pending',
//                   progress: 0,
//                 }));
//                 setFileItems((prev) => [...prev, ...newItems]);
//                 setStatus('');
//                 setError('');
//               }}
//             />
//           </label>

//           {fileItems.length > 0 && (
//             <div className="file-list" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
//               <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Fayllar ro‘yxati ({fileItems.length} ta):</p>
//               <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                 {fileItems.map((item) => (
//                   <li key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '6px', background: '#f9f9f9', padding: '6px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: item.status === 'done' ? 'bold' : 'normal' }}>
//                         {item.file.name}
//                       </span>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                         <span style={{ fontSize: '11px', color: item.status === 'done' ? 'green' : item.status === 'uploading' ? 'blue' : item.status === 'error' ? 'red' : '#666' }}>
//                           {item.status === 'done' ? 'Yuborildi' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'error' ? 'Xato' : 'Navbatda'}
//                         </span>

//                         {item.file.type.startsWith('image/') && (
//                           <button
//                             type="button"
//                             onClick={() => setPreviewImage(URL.createObjectURL(item.file))}
//                             style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                             title="Ko'rish"
//                           >
//                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                               <circle cx="12" cy="12" r="3"></circle>
//                             </svg>
//                           </button>
//                         )}

//                         <button
//                           type="button"
//                           onClick={() => removeFileItem(item.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="O'chirish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="3 6 5 6 21 6"></polyline>
//                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                             <line x1="10" y1="11" x2="10" y2="17"></line>
//                             <line x1="14" y1="11" x2="14" y2="17"></line>
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                     {item.status === 'uploading' && (
//                       <div style={{ width: '100%', background: '#ddd', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
//                         <div style={{ width: `${item.progress}%`, background: '#2563eb', height: '100%', borderRadius: '2px', transition: 'width 0.2s' }}></div>
//                       </div>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           <label style={{ marginTop: '10px' }}>
//             Xabar (ixtiyoriy)
//             <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
//           </label>

//           <button 
//             type="submit" 
//             disabled={busy || (!hasPendingFiles && !caption.trim())} 
//             style={{ 
//               marginTop: '10px', 
//               width: '100%', 
//               backgroundColor: '#2563eb', 
//               color: 'white', 
//               padding: '10px', 
//               border: 'none', 
//               borderRadius: '6px', 
//               cursor: 'pointer', 
//               fontWeight: 'bold',
//               fontSize: '14px'
//             }}
//           >
//             {busy ? 'Yuborilmoqda...' : 'Yuborish'}
//           </button>
//         </form>

//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>

//       {previewImage && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', textAlign: 'center', position: 'relative' }}>
//             <button
//               onClick={() => setPreviewImage(null)}
//               style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '4px', marginTop: '15px' }} />
//           </div>
//         </div>
//       )}

//       {showNotesModal && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '400px', position: 'relative' }}>
//             <button
//               onClick={() => setShowNotesModal(false)}
//               style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>🔒 Shaxsiy eslatmalar (Parollar va rasmlar)</h3>

//             {!notesUnlocked ? (
//               <form onSubmit={handleNotesUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                 <label style={{ fontSize: '13px' }}>
//                   Kirish parolini kiriting:
//                   <input
//                     type="password"
//                     value={notesPasswordInput}
//                     onChange={(e) => setNotesPasswordInput(e.target.value)}
//                     required
//                     style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   />
//                 </label>
//                 {notesError && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{notesError}</p>}
//                 <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
//                   Ochish
//                 </button>
//               </form>
//             ) : (
//               <div>
//                 <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
//                   Maksimal 3 ta rasm saqlashingiz mumkin ({notesImages.length}/3):
//                 </p>

//                 {notesImages.length < 3 && (
//                   <label style={{ display: 'block', marginBottom: '15px', border: '2px dashed #cbd5e1', padding: '10px', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', background: '#f8fafc', fontSize: '13px' }}>
//                     📁 Rasm qo‘shish (Tanlash)
//                     <input type="file" accept="image/*" onChange={handleAddNoteImage} style={{ display: 'none' }} />
//                   </label>
//                 )}

//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
//                   {notesImages.map((img, idx) => (
//                     <div key={img.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '4px' }}>
//                       <span style={{ fontSize: '13px', fontWeight: '500' }}>Rasm #{idx + 1}</span>
//                       <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
//                         <button
//                           type="button"
//                           onClick={() => setPreviewImage(img.url)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="Ko'rish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                             <circle cx="12" cy="12" r="3"></circle>
//                           </svg>
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => removeNoteImage(img.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="O'chirish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="3 6 5 6 21 6"></polyline>
//                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                             <line x1="10" y1="11" x2="10" y2="17"></line>
//                             <line x1="14" y1="11" x2="14" y2="17"></line>
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                   {notesImages.length === 0 && (
//                     <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Hozircha rasmlar yo‘q.</p>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }
























// 'use client';

// import { upload } from '@vercel/blob/client';
// import { FormEvent, useEffect, useRef, useState } from 'react';

// type ApiResult = {
//   ok: boolean;
//   message?: string;
//   recoveryCodeSent?: boolean;
//   jobId?: string;
//   pathname?: string;
// };

// type FileItem = {
//   id: string;
//   file: File;
//   status: 'pending' | 'uploading' | 'done' | 'error';
//   progress: number;
//   jobId?: string;
//   errorMsg?: string;
// };

// type NoteImage = {
//   id: number;
//   url: string;
// };

// export default function HomePage() {
//   const [authenticated, setAuthenticated] = useState<boolean | null>(null);
//   const [password, setPassword] = useState('');
//   const [recoveryMode, setRecoveryMode] = useState(false);
//   const [recoveryCode, setRecoveryCode] = useState('');
//   const [newPassword, setNewPassword] = useState('');
//   const [confirmNewPassword, setConfirmNewPassword] = useState('');

//   // Parolni ko'rsatish/yashirish state'lari
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
//   const [fileItems, setFileItems] = useState<FileItem[]>([]);
//   const [caption, setCaption] = useState('');
//   const [previewImage, setPreviewImage] = useState<string | null>(null);

//   // Shaxsiy eslatmalar uchun state'lar
//   const [showNotesModal, setShowNotesModal] = useState(false);
//   const [notesUnlocked, setNotesUnlocked] = useState(false);
//   const [notesPasswordInput, setNotesPasswordInput] = useState('');
//   const [notesImages, setNotesImages] = useState<NoteImage[]>([]);
//   const [notesError, setNotesError] = useState('');

//   const [busy, setBusy] = useState(false);
//   const [status, setStatus] = useState('');
//   const [error, setError] = useState('');

//   const fileInputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     fetch('/api/auth/session', { cache: 'no-store' })
//       .then((response) => setAuthenticated(response.ok))
//       .catch(() => setAuthenticated(false));

//     fetchNotesImages();
//   }, []);

//   // 5 daqiqa harakatsizlik (inactivity) taymeri
//   useEffect(() => {
//     if (!authenticated) return;

//     let timer: NodeJS.Timeout;

//     const resetTimer = () => {
//       clearTimeout(timer);
//       timer = setTimeout(() => {
//         logout();
//       }, 5 * 60 * 1000);
//     };

//     const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
//     events.forEach((event) => {
//       window.addEventListener(event, resetTimer);
//     });

//     resetTimer();

//     return () => {
//       clearTimeout(timer);
//       events.forEach((event) => {
//         window.removeEventListener(event, resetTimer);
//       });
//     };
//   }, [authenticated]);

//   async function fetchNotesImages() {
//     try {
//       const res = await fetch('/api/notes', { cache: 'no-store' });
//       const data = await res.json();
//       if (data.ok && data.images) {
//         setNotesImages(data.images);
//       }
//     } catch (e) {
//       console.error(e);
//     }
//   }

//   useEffect(() => {
//     if (!authenticated) return;

//     const handleGlobalPaste = (event: ClipboardEvent) => {
//       const items = event.clipboardData?.items;
//       if (!items) return;

//       const newItems: FileItem[] = [];
//       for (let i = 0; i < items.length; i++) {
//         if (items[i].type.indexOf('image') !== -1) {
//           const blob = items[i].getAsFile();
//           if (blob) {
//             const fileName = `screenshot_${Date.now()}_${i}.png`;
//             const file = new File([blob], fileName, { type: blob.type });
//             newItems.push({
//               id: Math.random().toString(36).substring(2, 9),
//               file,
//               status: 'pending',
//               progress: 0,
//             });
//           }
//         }
//       }

//       if (newItems.length > 0) {
//         setFileItems((prev) => [...prev, ...newItems]);
//         setStatus(`${newItems.length} ta rasm qo'shildi.`);
//         setError('');
//         event.preventDefault();
//       }
//     };

//     window.addEventListener('paste', handleGlobalPaste);
//     return () => {
//       window.removeEventListener('paste', handleGlobalPaste);
//     };
//   }, [authenticated]);

//   async function login(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setBusy(true);
//     setError('');

//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         setPassword('');
//         if (result.recoveryCodeSent) {
//           setRecoveryMode(true);
//           setError('');
//           setStatus(result.message ?? 'Tiklash kodi abbosnorqulov666@gmail.com emailingizga yuborildi.');
//           return;
//         }
//         throw new Error(result.message ?? 'Kirish amalga oshmadi.');
//       }

//       setPassword('');
//       setAuthenticated(true);
//       setStatus('Tizimga kirdingiz.');
//     } catch (loginError) {
//       setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
//       setPassword('');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function resetPassword(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     if (newPassword !== confirmNewPassword) {
//       setError('Yangi parollar mos kelmadi.');
//       return;
//     }

//     setBusy(true);
//     setError('');
//     setStatus('Parol yangilanmoqda...');

//     try {
//       const response = await fetch('/api/auth/recovery', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: recoveryCode, password: newPassword }),
//       });
//       const result = (await response.json()) as ApiResult;

//       if (!response.ok) {
//         throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
//       }

//       setRecoveryMode(false);
//       setRecoveryCode('');
//       setNewPassword('');
//       setConfirmNewPassword('');
//       setPassword('');
//       setStatus(result.message ?? 'Parol yangilandi.');
//     } catch (recoveryError) {
//       setStatus('');
//       setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   function removeFileItem(id: string) {
//     setFileItems((prev) => {
//       const updated = prev.filter((item) => item.id !== id);
//       if (updated.length === 0 && fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return updated;
//     });
//   }

//   async function uploadAndSendSingleFile(item: FileItem) {
//     setFileItems((prev) =>
//       prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
//     );

//     try {
//       const sessionResponse = await fetch('/api/upload/session', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ name: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }),
//       });
//       const session = (await sessionResponse.json()) as ApiResult;

//       if (!sessionResponse.ok || !session.jobId || !session.pathname) {
//         throw new Error(session.message ?? 'Sessiya yaratilmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f))
//       );

//       await upload(session.pathname, item.file, {
//         access: 'private',
//         handleUploadUrl: '/api/upload/blob',
//         clientPayload: JSON.stringify({ jobId: session.jobId }),
//         onUploadProgress: ({ percentage }) => {
//           setFileItems((prev) =>
//             prev.map((f) => (f.id === item.id ? { ...f, progress: 40 + Math.round(percentage * 0.4) } : f))
//           );
//         },
//       });

//       const completeResponse = await fetch('/api/upload/complete', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId }),
//       });
//       const complete = (await completeResponse.json()) as ApiResult;

//       if (!completeResponse.ok) {
//         throw new Error(complete.message ?? 'Tekshirish amalga oshmadi.');
//       }

//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100, jobId: session.jobId } : f))
//       );

//       const sendResponse = await fetch('/api/telegram/send', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ jobId: session.jobId, caption }),
//       });
//       const sendResult = (await sendResponse.json()) as ApiResult;

//       if (!sendResponse.ok) {
//         throw new Error(sendResult.message ?? 'Yuborish amalga oshmadi.');
//       }

//       setFileItems((prev) => {
//         const updated = prev.filter((f) => f.id !== item.id);
//         if (updated.length === 0) {
//           if (fileInputRef.current) fileInputRef.current.value = '';
//           setCaption('');
//         }
//         return updated;
//       });

//     } catch (err) {
//       setFileItems((prev) =>
//         prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Xatolik' } : f))
//       );
//       setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
//     }
//   }

//   async function handleStartUploadsAndSend(e: FormEvent) {
//     e.preventDefault();
//     const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');

//     setBusy(true);
//     setError('');

//     try {
//       if (pendingItems.length > 0) {
//         setStatus('Fayllar parallel yuklanib, yuborilmoqda...');
//         await Promise.all(pendingItems.map((item) => uploadAndSendSingleFile(item)));
//         setStatus('Barcha jarayonlar yakunlandi va tozalandi.');
//       } else if (caption.trim().length > 0) {
//         setStatus('Xabar yuborilmoqda...');
//         const response = await fetch('/api/telegram/send', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({ caption }),
//         });
//         const result = (await response.json()) as ApiResult;

//         if (!response.ok) {
//           throw new Error(result.message ?? 'Xabar yuborish amalga oshmadi.');
//         }

//         setStatus('Xabar yuborildi.');
//         setCaption('');
//       } else {
//         setError('Yuborish uchun fayl yoki xabar kiriting.');
//       }
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Yuborishda xatolik yuz berdi.');
//     } finally {
//       setBusy(false);
//     }
//   }

//   async function logout() {
//     await fetch('/api/auth/logout', { method: 'POST' });
//     setAuthenticated(false);
//     setFileItems([]);
//     setCaption('');
//     setStatus('');
//     setError('');
//     if (fileInputRef.current) fileInputRef.current.value = '';
//   }

//   async function handleNotesUnlock(e: FormEvent) {
//     e.preventDefault();
//     setNotesError('');
//     try {
//       const response = await fetch('/api/auth/login', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ password: notesPasswordInput }),
//       });
//       if (!response.ok) {
//         throw new Error('Parol noto‘g‘ri.');
//       }
//       setNotesUnlocked(true);
//       setNotesPasswordInput('');
//       await fetchNotesImages();
//     } catch (err) {
//       setNotesError('Parol noto‘g‘ri kiritildi.');
//     }
//   }

//   function handleAddNoteImage(e: React.ChangeEvent<HTMLInputElement>) {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;

//     if (notesImages.length >= 3) {
//       alert('Ko‘pi bilan 3 ta rasm saqlash mumkin!');
//       return;
//     }

//     const file = files[0];
//     const reader = new FileReader();
//     reader.onload = async (uploadEvent) => {
//       const result = uploadEvent.target?.result as string;
//       if (result) {
//         try {
//           const res = await fetch('/api/notes', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ imageUrl: result }),
//           });
//           const data = await res.json();
//           if (data.ok) {
//             await fetchNotesImages();
//           } else {
//             alert(data.message || 'Saqlashda xatolik.');
//           }
//         } catch (err) {
//           alert('Server bilan xatolik yuz berdi.');
//         }
//       }
//     };
//     reader.readAsDataURL(file);
//     e.target.value = '';
//   }

//   async function removeNoteImage(id: number) {
//     try {
//       const res = await fetch(`/api/notes?id=${id}`, {
//         method: 'DELETE',
//       });
//       const data = await res.json();
//       if (data.ok) {
//         await fetchNotesImages();
//       } else {
//         alert(data.message || 'O‘chirishda xatolik.');
//       }
//     } catch (err) {
//       alert('Server bilan xatolik yuz berdi.');
//     }
//   }

//   if (authenticated === null) {
//     return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
//   }

//   if (!authenticated) {
//     return (
//       <main className="page-shell">
//         <section className="card auth-card">
//           {recoveryMode ? (
//             <form className="stack" onSubmit={resetPassword}>
//               <label>
//                 Email kodi (abbosnorqulov666@gmail.com)
//                 <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
//               </label>

//               {/* Yangi parol va ko'z ikonkasi */}
//               <label style={{ position: 'relative' }}>
//                 Yangi parol
//                 <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
//                   <input 
//                     type={showNewPassword ? "text" : "password"} 
//                     autoComplete="new-password" 
//                     minLength={5} 
//                     maxLength={128} 
//                     value={newPassword} 
//                     onChange={(event) => setNewPassword(event.target.value)} 
//                     required 
//                     style={{ width: '100%', paddingRight: '35px' }}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowNewPassword(!showNewPassword)}
//                     style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
//                   >
//                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       {showNewPassword ? (
//                         <>
//                           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
//                           <line x1="1" y1="1" x2="23" y2="23"></line>
//                         </>
//                       ) : (
//                         <>
//                           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                           <circle cx="12" cy="12" r="3"></circle>
//                         </>
//                       )}
//                     </svg>
//                   </button>
//                 </div>
//               </label>

//               {/* Yangi parolni takrorlang va ko'z ikonkasi */}
//               <label style={{ position: 'relative' }}>
//                 Yangi parolni takrorlang
//                 <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
//                   <input 
//                     type={showConfirmPassword ? "text" : "password"} 
//                     autoComplete="new-password" 
//                     minLength={5} 
//                     maxLength={128} 
//                     value={confirmNewPassword} 
//                     onChange={(event) => setConfirmNewPassword(event.target.value)} 
//                     required 
//                     style={{ width: '100%', paddingRight: '35px' }}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                     style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
//                   >
//                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                       {showConfirmPassword ? (
//                         <>
//                           <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
//                           <line x1="1" y1="1" x2="23" y2="23"></line>
//                         </>
//                       ) : (
//                         <>
//                           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                           <circle cx="12" cy="12" r="3"></circle>
//                         </>
//                       )}
//                     </svg>
//                   </button>
//                 </div>
//               </label>

//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
//               <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
//             </form>
//           ) : (
//             <form className="stack" onSubmit={login}>
//               <label>
                
//                 <input type="password" placeholder="Parolni kiriting agar bilmasangiz Abbosdan so'rang" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
//               </label>
//               <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
//             </form>
//           )}
//           {status && <p className="notice status" role="status">{status}</p>}
//           {error && <p className="notice error" role="alert">{error}</p>}
//         </section>
//       </main>
//     );
//   }

//   const hasPendingFiles = fileItems.some((f) => f.status === 'pending' || f.status === 'error');

//   return (
//     <main className="page-shell">
//       <section className="card workspace-card">
//         <header className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <div className="brand-row"><div><p className="eyebrow">CTRL+V NI BOSIB SKRESHOTNI TAShLA BO'LDI</p></div></div>
//           <div style={{ display: 'flex', gap: '8px' }}>
//             <button 
//               className="secondary-button" 
//               type="button" 
//               onClick={() => { setShowNotesModal(true); setNotesUnlocked(false); setNotesError(''); }}
//               style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
//             >
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                 <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
//                 <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
//               </svg>
//               Eslatmalar
//             </button>
//             <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
//           </div>
//         </header>

//         <form className="stack" onSubmit={handleStartUploadsAndSend}>
//           <label>
//             <input
//               ref={fileInputRef}
//               type="file"
//               multiple
//               accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
//               onChange={(event) => {
//                 const selected = event.target.files ? Array.from(event.target.files) : [];
//                 const newItems: FileItem[] = selected.map((file) => ({
//                   id: Math.random().toString(36).substring(2, 9),
//                   file,
//                   status: 'pending',
//                   progress: 0,
//                 }));
//                 setFileItems((prev) => [...prev, ...newItems]);
//                 setStatus('');
//                 setError('');
//               }}
//             />
//           </label>

//           {fileItems.length > 0 && (
//             <div className="file-list" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
//               <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Fayllar ro‘yxati ({fileItems.length} ta):</p>
//               <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
//                 {fileItems.map((item) => (
//                   <li key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '6px', background: '#f9f9f9', padding: '6px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                       <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: item.status === 'done' ? 'bold' : 'normal' }}>
//                         {item.file.name}
//                       </span>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                         <span style={{ fontSize: '11px', color: item.status === 'done' ? 'green' : item.status === 'uploading' ? 'blue' : item.status === 'error' ? 'red' : '#666' }}>
//                           {item.status === 'done' ? 'Yuborildi' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'error' ? 'Xato' : 'Navbatda'}
//                         </span>

//                         {item.file.type.startsWith('image/') && (
//                           <button
//                             type="button"
//                             onClick={() => setPreviewImage(URL.createObjectURL(item.file))}
//                             style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                             title="Ko'rish"
//                           >
//                             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                               <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                               <circle cx="12" cy="12" r="3"></circle>
//                             </svg>
//                           </button>
//                         )}

//                         <button
//                           type="button"
//                           onClick={() => removeFileItem(item.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="O'chirish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="3 6 5 6 21 6"></polyline>
//                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                             <line x1="10" y1="11" x2="10" y2="17"></line>
//                             <line x1="14" y1="11" x2="14" y2="17"></line>
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                     {item.status === 'uploading' && (
//                       <div style={{ width: '100%', background: '#ddd', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
//                         <div style={{ width: `${item.progress}%`, background: '#2563eb', height: '100%', borderRadius: '2px', transition: 'width 0.2s' }}></div>
//                       </div>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           <label style={{ marginTop: '10px' }}>
//             Xabar (ixtiyoriy)
//             <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
//           </label>

//           <button 
//             type="submit" 
//             disabled={busy || (!hasPendingFiles && !caption.trim())} 
//             style={{ 
//               marginTop: '10px', 
//               width: '100%', 
//               backgroundColor: '#2563eb', 
//               color: 'white', 
//               padding: '10px', 
//               border: 'none', 
//               borderRadius: '6px', 
//               cursor: 'pointer', 
//               fontWeight: 'bold',
//               fontSize: '14px'
//             }}
//           >
//             {busy ? 'Yuborilmoqda...' : 'Yuborish'}
//           </button>
//         </form>

//         {status && <p className="notice status" role="status">{status}</p>}
//         {error && <p className="notice error" role="alert">{error}</p>}
//       </section>

//       {previewImage && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', textAlign: 'center', position: 'relative' }}>
//             <button
//               onClick={() => setPreviewImage(null)}
//               style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '4px', marginTop: '15px' }} />
//           </div>
//         </div>
//       )}

//       {showNotesModal && (
//         <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '400px', position: 'relative' }}>
//             <button
//               onClick={() => setShowNotesModal(false)}
//               style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
//             >
//               ✕
//             </button>
//             <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>🔒 Shaxsiy eslatmalar (Parollar va rasmlar)</h3>

//             {!notesUnlocked ? (
//               <form onSubmit={handleNotesUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
//                 <label style={{ fontSize: '13px' }}>
//                   Kirish parolini kiriting:
//                   <input
//                     type="password"
//                     value={notesPasswordInput}
//                     onChange={(e) => setNotesPasswordInput(e.target.value)}
//                     required
//                     style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
//                   />
//                 </label>
//                 {notesError && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{notesError}</p>}
//                 <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
//                   Ochish
//                 </button>
//               </form>
//             ) : (
//               <div>
//                 <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
//                   Maksimal 3 ta rasm saqlashingiz mumkin ({notesImages.length}/3):
//                 </p>

//                 {notesImages.length < 3 && (
//                   <label style={{ display: 'block', marginBottom: '15px', border: '2px dashed #cbd5e1', padding: '10px', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', background: '#f8fafc', fontSize: '13px' }}>
//                     📁 Rasm qo‘shish (Tanlash)
//                     <input type="file" accept="image/*" onChange={handleAddNoteImage} style={{ display: 'none' }} />
//                   </label>
//                 )}

//                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
//                   {notesImages.map((img, idx) => (
//                     <div key={img.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '4px' }}>
//                       <span style={{ fontSize: '13px', fontWeight: '500' }}>Rasm #{idx + 1}</span>
//                       <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
//                         <button
//                           type="button"
//                           onClick={() => setPreviewImage(img.url)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="Ko'rish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//                             <circle cx="12" cy="12" r="3"></circle>
//                           </svg>
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => removeNoteImage(img.id)}
//                           style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
//                           title="O'chirish"
//                         >
//                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <polyline points="3 6 5 6 21 6"></polyline>
//                             <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//                             <line x1="10" y1="11" x2="10" y2="17"></line>
//                             <line x1="14" y1="11" x2="14" y2="17"></line>
//                           </svg>
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                   {notesImages.length === 0 && (
//                     <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Hozircha rasmlar yo‘q.</p>
//                   )}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </main>
//   );
// }



'use client';

import { upload } from '@vercel/blob/client';
import { FormEvent, useEffect, useRef, useState } from 'react';

type ApiResult = {
  ok: boolean;
  message?: string;
  recoveryCodeSent?: boolean;
  jobId?: string;
  pathname?: string;
};

type FileItem = {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  jobId?: string;
  errorMsg?: string;
};

type NoteImage = {
  id: number;
  url: string;
};

export default function HomePage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [caption, setCaption] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Shaxsiy eslatmalar uchun state'lar
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesUnlocked, setNotesUnlocked] = useState(false);
  const [notesPasswordInput, setNotesPasswordInput] = useState('');
  const [notesImages, setNotesImages] = useState<NoteImage[]>([]);
  const [noteText, setNoteText] = useState('');
  const [savingNoteText, setSavingNoteText] = useState(false);
  const [noteTextStatus, setNoteTextStatus] = useState('');
  const [notesError, setNotesError] = useState('');

  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/session', { cache: 'no-store' })
      .then((response) => setAuthenticated(response.ok))
      .catch(() => setAuthenticated(false));

    fetchNotesData();
  }, []);

  // 5 daqiqa harakatsizlik (inactivity) taymeri
  useEffect(() => {
    if (!authenticated) return;

    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
      }, 5 * 60 * 1000);
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [authenticated]);

  async function fetchNotesData() {
    try {
      const res = await fetch('/api/notes', { cache: 'no-store' });
      const data = await res.json();
      if (data.ok) {
        if (data.images) setNotesImages(data.images);
        if (typeof data.noteText === 'string') setNoteText(data.noteText);
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (!authenticated) return;

    const handleGlobalPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const newItems: FileItem[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const fileName = `screenshot_${Date.now()}_${i}.png`;
            const file = new File([blob], fileName, { type: blob.type });
            newItems.push({
              id: Math.random().toString(36).substring(2, 9),
              file,
              status: 'pending',
              progress: 0,
            });
          }
        }
      }

      if (newItems.length > 0) {
        setFileItems((prev) => [...prev, ...newItems]);
        setStatus(`${newItems.length} ta rasm qo'shildi.`);
        setError('');
        event.preventDefault();
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => {
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, [authenticated]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as ApiResult;

      if (!response.ok) {
        setPassword('');
        if (result.recoveryCodeSent) {
          setRecoveryMode(true);
          setError('');
          setStatus(result.message ?? 'Tiklash kodi emailingizga yuborildi.');
          return;
        }
        throw new Error(result.message ?? 'Kirish amalga oshmadi.');
      }

      setPassword('');
      setAuthenticated(true);
      setStatus('Tizimga kirdingiz.');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Kirish amalga oshmadi.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('Yangi parollar mos kelmadi.');
      return;
    }

    setBusy(true);
    setError('');
    setStatus('Parol yangilanmoqda...');

    try {
      const response = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: recoveryCode, password: newPassword }),
      });
      const result = (await response.json()) as ApiResult;

      if (!response.ok) {
        throw new Error(result.message ?? 'Parolni tiklash amalga oshmadi.');
      }

      setRecoveryMode(false);
      setRecoveryCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPassword('');
      setStatus(result.message ?? 'Parol yangilandi.');
    } catch (recoveryError) {
      setStatus('');
      setError(recoveryError instanceof Error ? recoveryError.message : 'Parolni tiklash amalga oshmadi.');
    } finally {
      setBusy(false);
    }
  }

  function removeFileItem(id: string) {
    setFileItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (updated.length === 0 && fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return updated;
    });
  }

  async function uploadAndSendSingleFile(item: FileItem) {
    setFileItems((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', progress: 10 } : f))
    );

    try {
      const sessionResponse = await fetch('/api/upload/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: item.file.name, mimeType: item.file.type, sizeBytes: item.file.size }),
      });
      const session = (await sessionResponse.json()) as ApiResult;

      if (!sessionResponse.ok || !session.jobId || !session.pathname) {
        throw new Error(session.message ?? 'Sessiya yaratilmadi.');
      }

      setFileItems((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, progress: 40 } : f))
      );

      await upload(session.pathname, item.file, {
        access: 'private',
        handleUploadUrl: '/api/upload/blob',
        clientPayload: JSON.stringify({ jobId: session.jobId }),
        onUploadProgress: ({ percentage }) => {
          setFileItems((prev) =>
            prev.map((f) => (f.id === item.id ? { ...f, progress: 40 + Math.round(percentage * 0.4) } : f))
          );
        },
      });

      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: session.jobId }),
      });
      const complete = (await completeResponse.json()) as ApiResult;

      if (!completeResponse.ok) {
        throw new Error(complete.message ?? 'Tekshirish amalga oshmadi.');
      }

      setFileItems((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'done', progress: 100, jobId: session.jobId } : f))
      );

      const sendResponse = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: session.jobId, caption }),
      });
      const sendResult = (await sendResponse.json()) as ApiResult;

      if (!sendResponse.ok) {
        throw new Error(sendResult.message ?? 'yuborish amalga oshmadi.');
      }

      setFileItems((prev) => {
        const updated = prev.filter((f) => f.id !== item.id);
        if (updated.length === 0) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          setCaption('');
        }
        return updated;
      });

    } catch (err) {
      setFileItems((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMsg: err instanceof Error ? err.message : 'Xatolik' } : f))
      );
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    }
  }

  async function handleStartUploadsAndSend(e: FormEvent) {
    e.preventDefault();
    const pendingItems = fileItems.filter((f) => f.status === 'pending' || f.status === 'error');

    setBusy(true);
    setError('');

    try {
      if (pendingItems.length > 0) {
        setStatus('Fayllar parallel yuklanib, yuborilmoqda...');
        await Promise.all(pendingItems.map((item) => uploadAndSendSingleFile(item)));
        setStatus('Barcha jarayonlar yakunlandi va tozalandi.');
      } else if (caption.trim().length > 0) {
        setStatus('Xabar yuborilmoqda...');
        const response = await fetch('/api/telegram/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ caption }),
        });
        const result = (await response.json()) as ApiResult;

        if (!response.ok) {
          throw new Error(result.message ?? 'Xabar yuborish amalga oshmadi.');
        }

        setStatus('Xabar yuborildi.');
        setCaption('');
      } else {
        setError('Yuborish uchun fayl yoki xabar kiriting.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yuborishda xatolik yuz berdi.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAuthenticated(false);
    setFileItems([]);
    setCaption('');
    setStatus('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleNotesUnlock(e: FormEvent) {
    e.preventDefault();
    setNotesError('');
    setNoteTextStatus('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: notesPasswordInput }),
      });
      if (!response.ok) {
        throw new Error('Parol noto‘g‘ri.');
      }
      setNotesUnlocked(true);
      setNotesPasswordInput('');
      await fetchNotesData();
    } catch (err) {
      setNotesError('Parol noto‘g‘ri kiritildi.');
    }
  }

  // Matnli eslatmani bazaga saqlash
  async function handleSaveNoteText() {
    setSavingNoteText(true);
    setNoteTextStatus('');
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteText }),
      });
      const data = await res.json();
      if (data.ok) {
        setNoteTextStatus('Saqlandi!');
        setTimeout(() => setNoteTextStatus(''), 2500);
      } else {
        alert(data.message || 'Saqlashda xatolik.');
      }
    } catch (err) {
      alert('Server bilan xatolik yuz berdi.');
    } finally {
      setSavingNoteText(false);
    }
  }

  function handleCopyNoteText() {
    if (!noteText) return;
    navigator.clipboard.writeText(noteText);
    setNoteTextStatus('Nusxalandi!');
    setTimeout(() => setNoteTextStatus(''), 2000);
  }

  function handleAddNoteImage(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (notesImages.length >= 3) {
      alert('Ko‘pi bilan 3 ta rasm saqlash mumkin!');
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        try {
          const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: result }),
          });
          const data = await res.json();
          if (data.ok) {
            await fetchNotesData();
          } else {
            alert(data.message || 'Saqlashda xatolik.');
          }
        } catch (err) {
          alert('Server bilan xatolik yuz berdi.');
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function removeNoteImage(id: number) {
    try {
      const res = await fetch(`/api/notes?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.ok) {
        await fetchNotesData();
      } else {
        alert(data.message || 'O‘chirishda xatolik.');
      }
    } catch (err) {
      alert('Server bilan xatolik yuz berdi.');
    }
  }

  if (authenticated === null) {
    return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
  }

  if (!authenticated) {
    return (
      <main className="page-shell">
        <section className="card auth-card">
          {recoveryMode ? (
            <form className="stack" onSubmit={resetPassword}>
              <label>
                Email kodi (abbosnorqulov666@gmail.com)ga yuborilgan
                <input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={recoveryCode} onChange={(event) => setRecoveryCode(event.target.value)} required />
              </label>

              <label style={{ position: 'relative' }}>
                Yangi parol
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    autoComplete="new-password" 
                    minLength={5} 
                    maxLength={128} 
                    value={newPassword} 
                    onChange={(event) => setNewPassword(event.target.value)} 
                    required 
                    style={{ width: '100%', paddingRight: '35px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showNewPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </label>

              <label style={{ position: 'relative' }}>
                Yangi parolni takrorlang
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    autoComplete="new-password" 
                    minLength={5} 
                    maxLength={128} 
                    value={confirmNewPassword} 
                    onChange={(event) => setConfirmNewPassword(event.target.value)} 
                    required 
                    style={{ width: '100%', paddingRight: '35px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {showConfirmPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </label>

              <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Parolni yangilash'}</button>
              <button className="recovery-link" type="button" onClick={() => { setRecoveryMode(false); setError(''); setStatus(''); }}>Kirishga qaytish</button>
            </form>
          ) : (
            <form className="stack" onSubmit={login}>
              <label>
                
                <input type="password" placeholder="Parolni kiriting agar bilmasangiz Abbosdan so'rang" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              </label>
              <button type="submit" disabled={busy}>{busy ? 'Tekshirilmoqda...' : 'Kirish'}</button>
            </form>
          )}
          {status && <p className="notice status" role="status">{status}</p>}
          {error && <p className="notice error" role="alert">{error}</p>}
        </section>
      </main>
    );
  }

  const hasPendingFiles = fileItems.some((f) => f.status === 'pending' || f.status === 'error');

  return (
    <main className="page-shell">
      <section className="card workspace-card">
        <header className="workspace-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="brand-row"><div><p className="eyebrow">CTRL+V NI BOSIB SKRESHOTNI TAShLA BO'LDI</p></div></div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="secondary-button" 
              type="button" 
              onClick={() => { setShowNotesModal(true); setNotesUnlocked(false); setNotesError(''); setNoteTextStatus(''); }}
              style={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Eslatmalar
            </button>
            <button className="secondary-button" type="button" onClick={logout}>Chiqish</button>
          </div>
        </header>

        <form className="stack" onSubmit={handleStartUploadsAndSend}>
          <label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.mov,.mp3,.wav"
              onChange={(event) => {
                const selected = event.target.files ? Array.from(event.target.files) : [];
                const newItems: FileItem[] = selected.map((file) => ({
                  id: Math.random().toString(36).substring(2, 9),
                  file,
                  status: 'pending',
                  progress: 0,
                }));
                setFileItems((prev) => [...prev, ...newItems]);
                setStatus('');
                setError('');
              }}
            />
          </label>

          {fileItems.length > 0 && (
            <div className="file-list" style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid #ddd', padding: '8px', borderRadius: '6px' }}>
              <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Fayllar ro‘yxati ({fileItems.length} ta):</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {fileItems.map((item) => (
                  <li key={item.id} style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', marginBottom: '6px', background: '#f9f9f9', padding: '6px 8px', borderRadius: '4px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px', fontWeight: item.status === 'done' ? 'bold' : 'normal' }}>
                        {item.file.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: item.status === 'done' ? 'green' : item.status === 'uploading' ? 'blue' : item.status === 'error' ? 'red' : '#666' }}>
                          {item.status === 'done' ? 'Yuborildi' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'error' ? 'Xato' : 'Navbatda'}
                        </span>

                        {item.file.type.startsWith('image/') && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(URL.createObjectURL(item.file))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                            title="Ko'rish"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => removeFileItem(item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                          title="O'chirish"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                    {item.status === 'uploading' && (
                      <div style={{ width: '100%', background: '#ddd', height: '4px', borderRadius: '2px', marginTop: '4px' }}>
                        <div style={{ width: `${item.progress}%`, background: '#2563eb', height: '100%', borderRadius: '2px', transition: 'width 0.2s' }}></div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <label style={{ marginTop: '10px' }}>
            Xabar (ixtiyoriy)
            <textarea maxLength={1024} rows={3} value={caption} onChange={(event) => setCaption(event.target.value)} />
          </label>

          <button 
            type="submit" 
            disabled={busy || (!hasPendingFiles && !caption.trim())} 
            style={{ 
              marginTop: '10px', 
              width: '100%', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              padding: '10px', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            {busy ? 'Yuborilmoqda...' : 'Yuborish'}
          </button>
        </form>

        {status && <p className="notice status" role="status">{status}</p>}
        {error && <p className="notice error" role="alert">{error}</p>}
      </section>

      {previewImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', maxWidth: '90%', maxHeight: '90%', textAlign: 'center', position: 'relative' }}>
            <button
              onClick={() => setPreviewImage(null)}
              style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
            <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '4px', marginTop: '15px' }} />
          </div>
        </div>
      )}

      {showNotesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button
              onClick={() => setShowNotesModal(false)}
              style={{ position: 'absolute', top: '10px', right: '15px', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
            <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>🔒 Shaxsiy eslatmalar (Parollar va rasmlar)</h3>

            {!notesUnlocked ? (
              <form onSubmit={handleNotesUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '13px' }}>
                  Kirish parolini kiriting:
                  <input
                    type="password"
                    value={notesPasswordInput}
                    onChange={(e) => setNotesPasswordInput(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </label>
                {notesError && <p style={{ color: 'red', fontSize: '12px', margin: 0 }}>{notesError}</p>}
                <button type="submit" style={{ backgroundColor: '#2563eb', color: 'white', padding: '8px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Ochish
                </button>
              </form>
            ) : (
              <div>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                  Maksimal 3 ta rasm saqlashingiz mumkin ({notesImages.length}/3):
                </p>

                {notesImages.length < 3 && (
                  <label style={{ display: 'block', marginBottom: '15px', border: '2px dashed #cbd5e1', padding: '10px', textAlign: 'center', borderRadius: '6px', cursor: 'pointer', background: '#f8fafc', fontSize: '13px' }}>
                    📁 Rasm qo‘shish (Tanlash)
                    <input type="file" accept="image/*" onChange={handleAddNoteImage} style={{ display: 'none' }} />
                  </label>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {notesImages.map((img, idx) => (
                    <div key={img.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '6px 10px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '500' }}>Rasm #{idx + 1}</span>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setPreviewImage(img.url)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                          title="Ko'rish"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeNoteImage(img.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                          title="O'chirish"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {notesImages.length === 0 && (
                    <p style={{ fontSize: '13px', color: '#888', textAlign: 'center', margin: '4px 0' }}>Hozircha rasmlar yo‘q.</p>
                  )}
                </div>

                {/* Matnli xabar / eslatma saqlash qismi */}
                <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b' }}>
                      Xabar / Eslatma (ixtiyoriy)
                    </label>
                    {noteTextStatus && (
                      <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '500' }}>{noteTextStatus}</span>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    maxLength={4000}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Parol, havola yoki muhim eslatmalarni shu yerga yozib saqlang..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      type="button"
                      onClick={handleSaveNoteText}
                      disabled={savingNoteText}
                      style={{
                        flex: 1,
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '13px',
                      }}
                    >
                      {savingNoteText ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyNoteText}
                      disabled={!noteText}
                      style={{
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        padding: '8px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        cursor: noteText ? 'pointer' : 'not-allowed',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      Nusxalash
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}