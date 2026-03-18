import React, { useState } from 'react';
import { supabase } from '../lib/db';
import { useAdmin } from '../lib/adminContext';

export default function Admin(): React.ReactElement {
  const { adminUser } = useAdmin();
  const [message, setMessage] = useState('');
  const [targetId, setTargetId] = useState('');
  const [contentToEdit, setContentToEdit] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  async function deletePlate() {
    if (!targetId) { setMessage('Podaj ID'); return; }
    setMessage('Usuwanie...');
    const { error } = await supabase.from('plates').delete().eq('id', targetId);
    if (error) setMessage(error.message);
    else { setMessage('Usunięto'); setTargetId(''); }
  }

  async function deletePost() {
    if (!targetId) { setMessage('Podaj ID'); return; }
    setMessage('Usuwanie...');
    const { error } = await supabase.from('posts').delete().eq('id', targetId);
    if (error) setMessage(error.message);
    else { setMessage('Usunięto'); setTargetId(''); }
  }

  async function saveContent() {
    if (!contentToEdit || !editContent) { setMessage('Brak treści do zapisania'); return; }
    setMessage('Zapisywanie...');
    
    const [pageKey, sectionKey] = contentToEdit.split('/');
    
    // Check if content exists
    const { data: existing } = await supabase
      .from('content_items')
      .select('id')
      .eq('page_key', pageKey)
      .eq('section_key', sectionKey)
      .single();
    
    if (existing) {
      // Update
      const { error } = await supabase
        .from('content_items')
        .update({ content: editContent, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      if (error) setMessage(error.message);
      else { setMessage('Zapisano!'); setContentToEdit(null); }
    } else {
      // Insert
      const { error } = await supabase
        .from('content_items')
        .insert({ page_key: pageKey, section_key: sectionKey, content: editContent, status: 'published' });
      if (error) setMessage(error.message);
      else { setMessage('Zapisano!'); setContentToEdit(null); }
    }
  }

  // Show content editor
  if (contentToEdit) {
    return (
      <section>
        <h2>Edycja treści: {contentToEdit}</h2>
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={10}
          style={{ width: '100%', padding: '8px', marginTop: '8px' }}
        />
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
          <button onClick={saveContent}>Zapisz</button>
          <button onClick={() => setContentToEdit(null)}>Anuluj</button>
        </div>
        {message && <p>{message}</p>}
      </section>
    );
  }

  return (
    <section>
      <h2>Panel Administratora</h2>
      <p>Zalogowany jako: <strong>{adminUser?.username}</strong></p>
      
      <div style={{ marginTop: '24px' }}>
        <h3>Edycja treści</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <button onClick={() => { setContentToEdit('history/intro-text'); setEditContent('Tutaj znajdziesz krótką historię czarnych tablic rejestracyjnych na terenie województwa Przemyskiego.'); }}>
            Edytuj: Historia - Wstęp
          </button>
          <button onClick={() => { setContentToEdit('history/pre-1975-intro'); setEditContent('Utworzone 1.06.1975 r. woj. przemyskie dzieliło się na następujące miasta, miasta i gminy oraz gminy:'); }}>
            Edytuj: Historia - Podział 1975
          </button>
          <button onClick={() => { setContentToEdit('rejonizacja/intro-text-1'); setEditContent('Każdy polski pojazd ma przypisany konkretny symbol regionu — to te dwie litery na tablicy, które od razu zdradzają, skąd pochodzi auto.'); }}>
            Edytuj: Rejonizacja - Wstęp 1
          </button>
          <button onClick={() => { setContentToEdit('rejonizacja/intro-text-2'); setEditContent('Na stronie znajdziesz pełną listę kodów z podziałem na województwa, interaktywną mapkę oraz informacje o tym, jak zmieniały się granice administracyjne na przestrzeni lat.'); }}>
            Edytuj: Rejonizacja - Wstęp 2
          </button>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <h3>Zarządzanie</h3>
        <div style={{ marginTop: '8px' }}>
          <label>ID elementu: </label>
          <input 
            value={targetId} 
            onChange={(e) => setTargetId(e.target.value)} 
            placeholder="Wpisz ID"
            style={{ padding: '4px', marginLeft: '8px' }}
          />
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button onClick={deletePlate}>Usuń tablicę</button>
            <button onClick={deletePost}>Usuń post</button>
          </div>
        </div>
      </div>

      {message && <p style={{ marginTop: '16px' }}>{message}</p>}
    </section>
  );
}
