import React, { useEffect, useRef, useState } from 'react';
import { currentUser, logout } from '../lib/auth';

export default function Header({ onNavigate }: { onNavigate: (r: string) => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const user = currentUser();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  function handleLogout() {
    logout();
    onNavigate('home');
  }

  return (
    <header className="retro-header header-component" role="banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
        <img className="logo" src="/src/assets/ikona.png" alt="ikona" onClick={() => onNavigate('home')} style={{ cursor: 'pointer', flexShrink: 0 }} />
        <div className="brand" style={{ minWidth: 0, overflow: 'hidden' }}>
          <h1 onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>Czarne Przemyskie</h1>
          <p className="subtitle">Blog i forum miłośników zabytkowych aut</p>
        </div>
      </div>

      <div className="header-actions desktop-only">
        <a className="social-link" href="https://www.facebook.com/czarneprzemyskie" target="_blank" rel="noopener noreferrer">Facebook</a>
        <div className="plate-demo">PRW 5737</div>
        {user ? (
          <>
            <button className="nav-link profile-btn" onClick={() => onNavigate('profile')}>{user.username}</button>
            <button className="nav-link" onClick={handleLogout}>Wyloguj</button>
          </>
        ) : (
          <button className="nav-link login-btn" onClick={() => onNavigate('login')}>Logowanie</button>
        )}
      </div>

      <div ref={menuRef} style={{ marginLeft: 'auto' }}>
        <div className="mobile-only">
          <button aria-expanded={open} aria-haspopup="true" className="nav-link" onClick={() => setOpen((s) => !s)}>☰</button>
        </div>

        {open && (
          <div className="header-menu">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <a className="nav-link" onClick={() => { onNavigate('history'); setOpen(false); }}>Historia</a>
              <a className="nav-link" onClick={() => { onNavigate('rejonizacja'); setOpen(false); }}>Rejonizacja</a>
              <a className="nav-link" onClick={() => { onNavigate('plates'); setOpen(false); }}>Baza tablic</a>
              <a className="nav-link" onClick={() => { onNavigate('forum'); setOpen(false); }}>Forum</a>
              {user ? (
                <>
                  <button className="nav-link" onClick={() => { onNavigate('profile'); setOpen(false); }}>{user.username}</button>
                  <button className="nav-link" onClick={() => { handleLogout(); setOpen(false); }}>Wyloguj</button>
                </>
              ) : (
                <button className="nav-link" onClick={() => { onNavigate('login'); setOpen(false); }}>Logowanie</button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
