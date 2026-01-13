import React from 'react';

export default function Home({ onNavigate }: { onNavigate: React.Dispatch<React.SetStateAction<any>> }) {
  return (
    <section>
      <h2>Witaj w społeczności miłośników klasyków!</h2>
      <p>
        Miejsce dla fanów starych aut i legendarnych czarnych tablic z Przemyśla. Dziel się historiami, przeglądaj bazę tablic i poznawaj innych pasjonatów.
      </p>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => onNavigate('plates')} style={{ marginRight: 12 }}>Przeglądaj tablice</button>
        <button onClick={() => onNavigate('forum')}>Odwiedź forum</button>
      </div>
    </section>
  );
}
