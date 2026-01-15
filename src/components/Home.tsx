import React from 'react';

export default function Home({ onNavigate }: { onNavigate: React.Dispatch<React.SetStateAction<any>> }) {
  return (
    <section>
      <h2>Witaj w społeczności miłośników czarnych tablic!</h2>
      <p>
        Miejsce dla fanów starych aut i legendarnych czarnych tablic z Przemyśla. Dziel się historiami, przeglądaj bazę tablic i poznawaj innych pasjonatów.
      </p>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => onNavigate('plates')}>Przeglądaj tablice</button>
        <button onClick={() => onNavigate('forum')}>Odwiedź forum</button>
      </div>
    </section>
  );
}
