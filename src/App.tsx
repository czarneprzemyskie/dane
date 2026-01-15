
import './styles/retro-full.css';
import { useState } from 'react';
import Home from './components/Home';
import Plates from './components/Plates';
import History from './components/History';
import Rejonizacja from './components/Rejonizacja';
import Register from './components/Register';
import Login from './components/Login';
import Profile from './components/Profile';
import Blog from './components/Blog';
import Header from './components/Header';
import { currentUser } from './lib/auth';

type Route = 'home' | 'plates' | 'forum' | 'register' | 'login' | 'profile' | 'history' | 'rejonizacja';

function App() {
  const [route, setRoute] = useState<Route>('home');
  const user = currentUser();

  return (
    <div className="retro-bg">
      <div className="container">
        <Header onNavigate={(r: string) => setRoute(r as Route)} />
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
          {route === 'plates' && <Plates />}
          {route === 'history' && <History />}
          {route === 'rejonizacja' && <Rejonizacja />}
          {route === 'register' && <Register onRegistered={() => setRoute('login')} />}
          {route === 'login' && <Login onLoggedIn={() => setRoute('profile')} />}
          {route === 'profile' && <Profile />}
          {route === 'forum' && <Blog />}
        </main>

        <footer className="retro-footer">
          &copy; 2026 CzarnePrzemysl — Wszelkie prawa zastrzeżone
        </footer>
      </div>
    </div>
  );
}

export default App;
