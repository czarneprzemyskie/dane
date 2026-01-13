
import './styles/retro-full.css';
import { useState } from 'react';
import Home from './components/Home.tsx';
import Plates from './components/Plates.tsx';
import Register from './components/Register.tsx';
import Login from './components/Login.tsx';
import Profile from './components/Profile.tsx';
import Blog from './components/Blog.tsx';
import { currentUser, logout } from './lib/auth.ts';

type Route = 'home' | 'plates' | 'forum' | 'register' | 'login' | 'profile';

function App() {
  const [route, setRoute] = useState<Route>('home');
  const user = currentUser();

  return (
    <div className="retro-bg">
      <div className="container">
        <header className="retro-header">
          <img className="logo" src="/src/assets/ikona.png" alt="ikona" />
          <div className="brand">
            <h1>Czarne Przemyskie</h1>
            <p className="subtitle">Blog i forum miłośników zabytkowych aut</p>
          </div>
          <a className="social-link" href="https://www.facebook.com/czarneprzemyskie" target="_blank" rel="noopener noreferrer">Facebook</a>
          <div className="plate-demo">PRZ 1234</div>
        </header>
        <nav className="retro-nav">
          <button className="nav-link" onClick={() => setRoute('plates')}>Baza tablic</button>
          <button className="nav-link" onClick={() => setRoute('forum')}>Forum</button>
          {user ? (
            <>
              <button className="nav-link" onClick={() => setRoute('profile')}>Profil</button>
              <button className="nav-link" onClick={() => { logout(); setRoute('home'); }}>Wyloguj</button>
            </>
          ) : (
            <>
              <button className="nav-link" onClick={() => setRoute('register')}>Rejestracja</button>
              <button className="nav-link" onClick={() => setRoute('login')}>Logowanie</button>
            </>
          )}
        </nav>

        <main className="retro-main">
          {route === 'home' && <Home onNavigate={setRoute} />}
          {route === 'plates' && <Plates />}
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
