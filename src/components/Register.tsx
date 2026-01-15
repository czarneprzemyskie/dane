import React, { useState } from 'react';
// Google reCAPTCHA v3 integration
// Add this script to your public/index.html or load dynamically if needed:
// <script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
import { register } from '../lib/auth.ts';


export default function Register({ onRegistered }: { onRegistered?: () => void }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    // Add grecaptcha type to window
    type Grecaptcha = {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
    const grecaptcha = (window as typeof window & { grecaptcha?: Grecaptcha }).grecaptcha;
    if (grecaptcha) {
      grecaptcha.ready(function() {
        const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
        grecaptcha.execute(siteKey, {action: 'submit'}).then(async function(token: string) {
          // Send token to backend for verification
          const res = await register(username, email, password, token);
          if (!res.ok) setMsg(res.error || 'Error');
          else {
            setMsg('Registered — please login');
            setUsername(''); setEmail(''); setPassword('');
            if (onRegistered) onRegistered();
          }
        });
      });
    } else {
      setMsg('reCAPTCHA not loaded. Please try again.');
    }
  };

  return (
    <section>
      <h2>Utwórz konto</h2>
      <form onSubmit={submit} style={{ display: 'grid', gap: 8, width: '100%' }}>
        <input placeholder="Nazwa użytkownika" value={username} onChange={(e) => setUsername(e.target.value)} />
        <div style={{ fontSize: 12, color: '#666' }}>Proszę używać tylko liter, cyfr, '-' '_' '.'; polskie znaki zostaną znormalizowane.</div>
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div style={{ fontSize: 12, color: '#666' }}>Podaj prawidłowy adres email.</div>
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
