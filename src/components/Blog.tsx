import React, { useEffect, useState } from 'react';
import Toast, { ToastMsg } from './Toast';
import { addPost, getPosts, removePost } from '../lib/storage.ts';
import type { Post } from '../lib/storage.ts';
import { currentUser } from '../lib/auth.ts';

function makeId() { return Math.random().toString(36).slice(2,9); }

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [statusMsg, setStatusMsg] = useState<ToastMsg[]>([]);

  useEffect(() => {
    (async () => {
      const p = await getPosts();
      setPosts(p);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 5) {
      setStatusMsg((msgs) => [
        ...msgs,
        { id: Date.now(), text: 'Tytuł musi mieć co najmniej 5 znaków.', type: 'error' }
      ]);
      return;
    }
    if (body.trim().length < 20) {
      setStatusMsg((msgs) => [
        ...msgs,
        { id: Date.now(), text: 'Opis musi mieć co najmniej 20 znaków.', type: 'error' }
      ]);
      return;
    }
    const user = currentUser();
    const p: Post = { id: makeId(), author: user?.username ?? 'Anonymous', title: title || 'Untitled', body, createdAt: new Date().toISOString() };
    await addPost(p);
    const updated = await getPosts();
    setPosts(updated);
    setTitle(''); setBody('');
    setStatusMsg((msgs) => [
      ...msgs,
      { id: Date.now(), text: 'Post został opublikowany!', type: 'success' }
    ]);
  }

  // Remove toasts after 3 seconds
  useEffect(() => {
    if (statusMsg.length === 0) return;
    const timer = setTimeout(() => {
      setStatusMsg((msgs) => msgs.slice(1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  return (
    <>
      <Toast statusMsg={statusMsg} />
      <section>
      <h2>Blog & Forum Retro</h2>
      <form onSubmit={submit} style={{ marginBottom: 12, width: '100%' }}>
        <input placeholder="Tytuł posta" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Podziel się swoją historią" value={body} onChange={(e) => setBody(e.target.value)} style={{ display: 'block', marginTop: 8 }} />
        <div style={{ marginTop: 8 }}><button type="submit">Opublikuj</button></div>
      </form>

      <div>
        {posts.length === 0 && <div>Brak postów — bądź pierwszy!</div>}
        {posts.map((p) => (
          <article key={p.id} style={{ padding: 8, borderBottom: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', flex: '1 1 auto' }}>{p.title}</h3>
              {p.author === currentUser()?.username && (
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
          </article>
        ))}
      </div>
    </section>
  );
}
