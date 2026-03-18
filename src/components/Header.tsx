import { useEffect, useRef, useState } from 'react';
import { currentUser, logout } from '../lib/auth';
import { useAdmin } from '../lib/adminContext';
import EditableContent from './EditableContent';

export default function Header({ onNavigate, latestPlate }: { onNavigate: (r: string) => void, latestPlate: string }) {
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
    onNavigate('home');
  }

  return (
    <header className="retro-header header-component" role="banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
        <img className="logo" src="/ikona.png" alt="ikona" onClick={() => onNavigate('home')} style={{ cursor: 'pointer', flexShrink: 0 }} />
        <div className="brand" style={{ minWidth: 0, overflow: 'hidden' }}>
          <h1 onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
            <EditableContent
              pageKey="header"
              sectionKey="site-title"
              elementType="span"
              defaultContent="Czarne Przemyskie"
            />
          </h1>
          <p className="subtitle">
            <EditableContent
              pageKey="header"
              sectionKey="site-subtitle"
              elementType="span"
              defaultContent="Blog i forum miłośników czarnych tablic z woj. Przemyskiego"
            />
          </p>
        </div>
      </div>

      <div className="header-actions desktop-only">
        <a className="social-link" href="https://www.facebook.com/czarneprzemyskie" target="_blank" rel="noopener noreferrer">
          <EditableContent
            pageKey="header"
            sectionKey="facebook-label"
            elementType="span"
            defaultContent="Facebook"
          />
        </a>
        <div className="plate-demo">{latestPlate}</div>
        {isAdmin && (
          <button className="nav-link admin-btn" onClick={() => onNavigate('admin')}>
            <EditableContent
              pageKey="header"
              sectionKey="admin-button"
              elementType="span"
              defaultContent="Admin"
            />
          </button>
        )}
        {user ? (
          <>
            <button className="nav-link profile-btn" onClick={() => onNavigate('profile')}>{user.username}</button>
            <button className="nav-link" onClick={handleLogout}>
              <EditableContent
                pageKey="header"
                sectionKey="logout-button"
                elementType="span"
                defaultContent="Wyloguj"
              />
            </button>
          </>
        ) : (
          <button className="nav-link login-btn" onClick={() => onNavigate('login')}>
            <EditableContent
              pageKey="header"
              sectionKey="login-button"
              elementType="span"
              defaultContent="Logowanie"
            />
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
              <a className="nav-link" onClick={() => { onNavigate('history'); setOpen(false); }}>
                <EditableContent
                  pageKey="header"
                  sectionKey="nav-history"
                  elementType="span"
                  defaultContent="Historia"
                />
              </a>
              <a className="nav-link" onClick={() => { onNavigate('rejonizacja'); setOpen(false); }}>
                <EditableContent
                  pageKey="header"
                  sectionKey="nav-rejonizacja"
                  elementType="span"
                  defaultContent="Rejonizacja"
                />
              </a>
              <a className="nav-link" onClick={() => { onNavigate('plates'); setOpen(false); }}>
                <EditableContent
                  pageKey="header"
                  sectionKey="nav-plates"
                  elementType="span"
                  defaultContent="Baza tablic"
                />
              </a>
              <a className="nav-link" onClick={() => { onNavigate('forum'); setOpen(false); }}>
                <EditableContent
                  pageKey="header"
                  sectionKey="nav-forum"
                  elementType="span"
                  defaultContent="Forum"
                />
              </a>
              {isAdmin && (
                <button className="nav-link" onClick={() => { onNavigate('admin'); setOpen(false); }}>
                  <EditableContent
                    pageKey="header"
                    sectionKey="admin-button-mobile"
                    elementType="span"
                    defaultContent="Admin"
                  />
                </button>
              )}
              {user ? (
                <>
                  <button className="nav-link" onClick={() => { onNavigate('profile'); setOpen(false); }}>{user.username}</button>
                  <button className="nav-link" onClick={() => { handleLogout(); setOpen(false); }}>
                    <EditableContent
                      pageKey="header"
                      sectionKey="logout-button-mobile"
                      elementType="span"
                      defaultContent="Wyloguj"
                    />
                  </button>
                </>
              ) : (
                <button className="nav-link" onClick={() => { onNavigate('login'); setOpen(false); }}>
                  <EditableContent
                    pageKey="header"
                    sectionKey="login-button-mobile"
                    elementType="span"
                    defaultContent="Logowanie"
                  />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
