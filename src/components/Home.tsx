import React from 'react';
import EditableContent from './EditableContent';

export default function Home({ onNavigate }: { onNavigate: React.Dispatch<React.SetStateAction<any>> }) {
  return (
    <section>
      <EditableContent
        pageKey="home"
        sectionKey="hero-title"
        elementType="h2"
        defaultContent="Witaj w społeczności miłośników czarnych tablic!"
      >
        <h2>Witaj w społeczności miłośników czarnych tablic!</h2>
      </EditableContent>
      <EditableContent
        pageKey="home"
        sectionKey="hero-description"
        elementType="p"
        defaultContent="Miejsce dla fanów starych aut i legendarnych czarnych tablic z Przemyśla. Dziel się historiami, przeglądaj bazę tablic i poznawaj innych pasjonatów."
      >
        <p>
          Miejsce dla fanów starych aut i legendarnych czarnych tablic z Przemyśla. Dziel się historiami, przeglądaj bazę tablic i poznawaj innych pasjonatów.
        </p>
      </EditableContent>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button onClick={() => onNavigate('plates')}>
          <EditableContent
            pageKey="home"
            sectionKey="cta-plates"
            elementType="span"
            defaultContent="Przeglądaj tablice"
          />
        </button>
        <button onClick={() => onNavigate('forum')}>
          <EditableContent
            pageKey="home"
            sectionKey="cta-forum"
            elementType="span"
            defaultContent="Odwiedź forum"
          />
        </button>
      </div>
    </section>
  );
}
