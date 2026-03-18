
import './styles/retro-full.css';
import './styles/admin-editing.css';
import { useState } from 'react';
import Home from './components/Home';
import { Plates } from './components/Plates';
import Toast from './components/Toast';
import type { ToastMsg } from './components/Toast';
import History from './components/History';
import Rejonizacja from './components/Rejonizacja';
import Register from './components/Register';
import Login from './components/Login';
import Profile from './components/Profile';
import { useEffect } from 'react';
import { getVisitorCount, incrementVisitorCount } from './lib/visitorCount';
import Blog from './components/Blog';
import Header from './components/Header';
import Admin from './components/Admin';
import AdminContentDashboard from './components/AdminContentDashboard';
import { getPlates } from './lib/storage';
import { currentUser } from './lib/auth';
import { AdminProvider, useAdmin } from './lib/adminContext';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

type Route = 'home' | 'plates' | 'forum' | 'register' | 'login' | 'profile' | 'history' | 'rejonizacja' | 'admin' | 'admin-content';

function AppContent() {
  const [route, setRoute] = useState<Route>('home');
  const [userKey, setUserKey] = useState(0);
  const user = currentUser();
  const { isAdmin: _isAdmin } = useAdmin();
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [latestPlate, setLatestPlate] = useState<string>('PRW 5737');
  const [statusMsg, setStatusMsg] = useState<ToastMsg | null>(null);

  // Force re-render when user changes (login/logout)
  const refreshUser = () => setUserKey(k => k + 1);

  useEffect(() => {
    // Increment visitor count on mount
    incrementVisitorCount()
      .then(() => getVisitorCount())
      .then(setVisitorCount)
      .catch(() => setVisitorCount(null));

    // Fetch latest plate
    getPlates()
      .then((plates) => {
        if (plates && plates.length > 0) {
          setLatestPlate(plates[0].registration);
        }
      })
      .catch(() => setLatestPlate('PRW 5737'));
  }, []);

  // Debug: log toast state in dev
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('App statusMsg changed:', statusMsg);
    }
  }, [statusMsg]);

  return (
    <div className="retro-bg">
      <div className="container">
        <Header key={userKey} onNavigate={(r: string) => setRoute(r as Route)} latestPlate={latestPlate} refreshUser={refreshUser} />
        <nav className="retro-nav">
          <button className="nav-link" onClick={() => setRoute('plates')}>Baza tablic</button>
          <button className="nav-link" onClick={() => setRoute('forum')}>Forum</button>
          <button className="nav-link" onClick={() => setRoute('history')}>Historia</button>
          <button className="nav-link" onClick={() => setRoute('rejonizacja')}>Rejonizacja</button>
          {user ? null : (
            <>
              <button className="nav-link" onClick={() => setRoute('register')}>Rejestracja</button>
            </>
          )}
        </nav>

        <main className="retro-main">
          {route === 'home' && <Home onNavigate={setRoute} />}
          {route === 'plates' && <Plates setStatusMsg={setStatusMsg} />}
          {route === 'history' && <History />}
          {route === 'rejonizacja' && <Rejonizacja />}
          {route === 'register' && <Register onRegistered={() => setRoute('login')} />}
          {route === 'login' && <Login onLoggedIn={() => setRoute('profile')} refreshUser={refreshUser} />}
          {route === 'profile' && <Profile setStatusMsg={setStatusMsg} />}
          {route === 'forum' && <Blog setStatusMsg={setStatusMsg} />}
          {route === 'admin' && (
            <ProtectedAdminRoute>
              <Admin />
            </ProtectedAdminRoute>
          )}
          {route === 'admin-content' && (
            <ProtectedAdminRoute>
              <AdminContentDashboard />
            </ProtectedAdminRoute>
          )}
        </main>

        <footer className="retro-footer">
            &copy; 2026 Czarne Przemyskie — Wszelkie prawa zastrzeżone
            <br />
            <span>Odwiedziny: {visitorCount !== null ? visitorCount : '...'}</span>
            <br />
            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Ta strona jest chroniona przez reCAPTCHA i podlega Polityce prywatności oraz Warunkom korzystania z usług Google.</span>
        </footer>
      </div>
      <Toast statusMsg={statusMsg} setStatusMsg={setStatusMsg} />
    </div>
  );
}

function App() {
  return (
    <AdminProvider>
      <AppContent />
    </AdminProvider>
  );
}

export default App;
