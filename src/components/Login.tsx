import React, { useState } from 'react';
import { login } from '../lib/auth.ts';

export default function Login({ onLoggedIn }: { onLoggedIn?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await login(username, password);
    if (!res.ok) setMsg(res.error || 'Error');
    else {
      setMsg('Logged in');
      if (onLoggedIn) onLoggedIn();
    }
  };

  return (
    <section>
      <h2>Logowanie</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: '100%' }}>
        <input placeholder="Nazwa użytkownika" value={username} onChange={(e) => setUsername(e.target.value)} />
        <div style={{ fontSize: 12, color: '#666' }}>Polskie znaki zostaną znormalizowane; użyj liter i cyfr.</div>
        <input placeholder="Hasło" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div>
          <button type="submit">Zaloguj</button>
        </div>
        {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
      </form>
    </section>
  );
}
