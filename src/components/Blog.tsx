import React, { useEffect, useState } from 'react';
import type { ToastMsg } from './Toast';
import { addPost, getPosts, removePost, uploadImage } from '../lib/storage.ts';
import { supabase } from '../lib/db';
import type { Post } from '../lib/storage.ts';
import { currentUser } from '../lib/auth.ts';

function makeId() { return Math.random().toString(36).slice(2,9); }

export default function Blog({ setStatusMsg }: { setStatusMsg?: React.Dispatch<React.SetStateAction<ToastMsg | null>> }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    (async () => {
      const p = await getPosts();
      setPosts(p);
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (uid) {
          const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', uid).limit(1).single();
          if (profile && profile.is_admin) setIsAdmin(true);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function handlePhotoChange(file: File | null) {
    if (!file) {
      setPhotoFile(null);
      setPhotoError(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Wybierz plik graficzny.');
      setPhotoFile(null);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setPhotoError('Zdjęcie jest za duże (maks. 5 MB).');
      setPhotoFile(null);
      return;
    }
    setPhotoError(null);
    setPhotoFile(file);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 5) {
      setStatusMsg?.({ id: Date.now(), text: 'Tytuł musi mieć co najmniej 5 znaków.', type: 'error' });
      return;
    }
    if (body.trim().length < 20) {
      setStatusMsg?.({ id: Date.now(), text: 'Opis musi mieć co najmniej 20 znaków.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const user = currentUser();
      const id = makeId();
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadImage(photoFile, 'posts', id);
      }
      const p: Post = { id, author: user?.username ?? 'Anonymous', title: title || 'Untitled', body, photoUrl, createdAt: new Date().toISOString() };
      await addPost(p);
      const updated = await getPosts();
      setPosts(updated);
      setTitle('');
      setBody('');
      setPhotoFile(null);
      setPhotoError(null);
      setStatusMsg?.({ id: Date.now(), text: 'Post został opublikowany!', type: 'success' });
    } catch (err) {
      setStatusMsg?.({ id: Date.now(), text: 'Nie udało się opublikować posta. Spróbuj ponownie.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section>
        <h2>Blog i Forum</h2>
        <form onSubmit={submit} style={{ marginBottom: 12, width: '100%' }}>
          <div className="form-grid">
            <input placeholder="Tytuł posta" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea placeholder="Podziel się swoją historią" value={body} onChange={(e) => setBody(e.target.value)} style={{ display: 'block' }} />
            <label>
              Dodaj zdjęcie (opcjonalnie)
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
              />
            </label>
            <div className="input-help">Maksymalny rozmiar: 5 MB</div>
            {photoError && <div className="input-error">{photoError}</div>}
            {photoPreview && (
              <div className="media-preview">
                <img src={photoPreview} alt="Podgląd zdjęcia" />
                <div className="media-meta">
                  <div>{photoFile?.name}</div>
                  <button type="button" onClick={() => handlePhotoChange(null)}>Usuń zdjęcie</button>
                </div>
              </div>
            )}
          </div>
          <div className="form-actions" style={{ marginTop: 8 }}>
            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Publikowanie...' : 'Opublikuj'}</button>
            <button type="button" onClick={() => { setTitle(''); setBody(''); setPhotoFile(null); setPhotoError(null); }} disabled={isSubmitting}>Wyczyść</button>
          </div>
        </form>

        <div>
          {posts.length === 0 && <div>Brak postów — bądź pierwszy!</div>}
          {posts.map((p) => (
            <article key={p.id} style={{ padding: 8, borderBottom: '1px solid #333' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 auto' }}>{p.title}</h3>
                {(p.author === currentUser()?.username || isAdmin) && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Na pewno chcesz usunąć ten post?')) {
                        await removePost(p.id);
                        const updated = await getPosts();
                        setPosts(updated);
                      }
                    }}
                    style={{ flexShrink: 0 }}
                  >
                    Usuń
                  </button>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#ccc' }}>autor: {p.author} • {new Date(p.createdAt).toLocaleString()}</div>
              <p style={{ marginTop: 8 }}>{p.body}</p>
              {p.photoUrl && (
                <div className="post-media">
                  <img src={p.photoUrl} alt={`Zdjęcie do posta ${p.title}`} loading="lazy" />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
