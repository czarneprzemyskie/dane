import React, { useEffect, useState } from 'react';
import { addPost, getPosts } from '../lib/storage.ts';
import type { Post } from '../lib/storage.ts';
import { currentUser } from '../lib/auth.ts';

function makeId() { return Math.random().toString(36).slice(2,9); }

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => { setPosts(getPosts()); }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const user = currentUser();
    const p: Post = { id: makeId(), author: user?.username ?? 'Anonymous', title: title || 'Untitled', body, createdAt: new Date().toISOString() };
    addPost(p);
    setPosts(getPosts());
    setTitle(''); setBody('');
  }

  return (
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
            <h3 style={{ margin: 0 }}>{p.title}</h3>
            <div style={{ fontSize: 12, color: '#ccc' }}>autor: {p.author} • {new Date(p.createdAt).toLocaleString()}</div>
            <p style={{ marginTop: 8 }}>{p.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
