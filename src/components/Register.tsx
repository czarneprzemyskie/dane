import React, { useState } from 'react';
import { register } from '../lib/auth.ts';


export default function Register({ onRegistered }: { onRegistered?: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await register(username, password);
    if (!res.ok) setMsg(res.error || 'Error');
    else {
      setMsg('Registered — please login');
      setUsername(''); setPassword('');
      if (onRegistered) onRegistered();
    }
  };

  return (
    <section>
      <h2>Utwórz konto</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: '100%' }}>
        <input placeholder="Nazwa użytkownika" value={username} onChange={(e) => setUsername(e.target.value)} />
        <div style={{ fontSize: 12, color: '#666' }}>Proszę używać tylko liter, cyfr, '-' '_' '.'; polskie znaki zostaną znormalizowane.</div>
        <input placeholder="Hasło" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ fontSize: 12, color: '#666' }}>Hasło musi mieć co najmniej 6 znaków.</div>
        <div>
          <button type="submit">Zarejestruj</button>
        </div>
        {msg && <div style={{ marginTop: 8 }}>{msg}</div>}
      </form>
    </section>
  );
}
