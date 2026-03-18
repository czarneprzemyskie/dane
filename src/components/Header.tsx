import { useEffect, useRef, useState } from 'react';
import { currentUser, logout } from '../lib/auth';
import { useAdmin } from '../lib/adminContext';

export default function Header({ onNavigate, latestPlate, refreshUser }: { onNavigate: (r: string) => void, latestPlate: string, refreshUser?: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const user = currentUser();
  const { isAdmin } = useAdmin();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  async function handleLogout() {
    await logout();
    if (refreshUser) refreshUser();
    onNavigate('home');
  }

  return (
    <header className="retro-header header-component" role="banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
        <img className="logo" src="/ikona.png" alt="ikona" onClick={() => onNavigate('home')} style={{ cursor: 'pointer', flexShrink: 0 }} />
        <div className="brand" style={{ minWidth: 0, overflow: 'hidden' }}>
          <h1 onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
            <span>Czarne Przemyskie</span>
          </h1>
          <p className="subtitle">
            <span>Blog i forum miłośników czarnych tablic z woj. Przemyskiego</span>
          </p>
        </div>
      </div>

      <div className="header-actions desktop-only">
        <a className="social-link" href="https://www.facebook.com/czarneprzemyskie" target="_blank" rel="noopener noreferrer">
          <span>Facebook</span>
        </a>
        <div className="plate-demo">{latestPlate}</div>
        {isAdmin && (
          <button className="nav-link admin-btn" onClick={() => onNavigate('admin')}>
            Admin
          </button>
        )}
        {user ? (
          <>
            <button className="nav-link profile-btn" onClick={() => onNavigate('profile')}>{user.username}</button>
            <button className="nav-link" onClick={handleLogout}>
              Wyloguj
            </button>
          </>
        ) : (
          <button className="nav-link login-btn" onClick={() => onNavigate('login')}>
            Logowanie
          </button>
        )}
      </div>

      <div ref={menuRef} style={{ marginLeft: 'auto' }}>
        <div className="mobile-only">
          <button aria-expanded={open} aria-haspopup="true" className="nav-link" onClick={() => setOpen((s) => !s)}>☰</button>
        </div>

        {open && (
          <div className="header-menu">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className="nav-link" onClick={() => { onNavigate('history'); setOpen(false); }}>
                Historia
              </button>
              <button className="nav-link" onClick={() => { onNavigate('rejonizacja'); setOpen(false); }}>
                Rejonizacja
              </button>
              <button className="nav-link" onClick={() => { onNavigate('plates'); setOpen(false); }}>
                Baza tablic
              </button>
              <button className="nav-link" onClick={() => { onNavigate('forum'); setOpen(false); }}>
                Forum
              </button>
              {isAdmin && (
                <button className="nav-link" onClick={() => { onNavigate('admin'); setOpen(false); }}>
                  Admin
                </button>
              )}
              {user ? (
                <>
                  <button className="nav-link" onClick={() => { onNavigate('profile'); setOpen(false); }}>{user.username}</button>
                  <button className="nav-link" onClick={() => { handleLogout(); setOpen(false); }}>
                    Wyloguj
                  </button>
                </>
              ) : (
                <button className="nav-link" onClick={() => { onNavigate('login'); setOpen(false); }}>
                  Logowanie
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
