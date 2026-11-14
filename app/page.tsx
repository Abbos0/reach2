
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

  // useEffect(() => {
  //   fetch('/api/auth/session', { cache: 'no-store' })
  //     .then((response) => setAuthenticated(response.ok))
  //     .catch(() => setAuthenticated(false));

  //   fetchNotesData();
  // }, []);



  useEffect(() => {
  // Sahifa har safar yangilanganda darhol logout qilamiz va parolni so'ratamiz
  logout();
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

  // if (authenticated === null) {
  //   return <main className="page-shell"><p className="status">Tekshirilmoqda...</p></main>;
  // }





if (authenticated === null) {
  return (
    <main className="page-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#fafafa' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        {/* Zamonaviy ikki qatlamli aylanma spinner */}
        <div style={{ position: 'relative', width: '42px', height: '42px' }}>
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '3px solid #e2e8f0',
            borderRadius: '50%'
          }} />
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '3px solid transparent',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'modernSpin 0.7s cubic-bezier(0.4, 0, 0.2, 1) infinite'
          }} />
        </div>
        <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', letterSpacing: '0.3px' }}></span>
      </div>
      <style jsx global>{`
        @keyframes modernSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
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
                
                {/* <input type="password" placeholder="Parolni kiriting bilmasangiz Abbosdan so'rang" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /> */}

                <input type="password"  placeholder="Parolni kiriting bilmasangiz Abbosdan so'rang" autoComplete="new-password" data-lpignore="true" aria-autocomplete="none" value={password}  onChange={(event) => setPassword(event.target.value)}  required />

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