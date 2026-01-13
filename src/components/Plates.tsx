import React, { useEffect, useMemo, useState } from 'react';
import { addPlate, getPlates, searchPlates, removePlate } from '../lib/storage.ts';
import type { Plate } from '../lib/storage.ts';
import { currentUser } from '../lib/auth.ts';

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Plates() {
  const [query, setQuery] = useState('');
  const [list, setList] = useState<Plate[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setList(getPlates());
  }, []);

  const results = useMemo(() => (query ? searchPlates(query) : list), [query, list]);

  function submitNew(reg: string, notes: string) {
    const user = currentUser();
    const p: Plate = { id: makeId(), registration: reg.toUpperCase(), owner: user?.username ?? null, notes, createdAt: new Date().toISOString() };
    addPlate(p);
    setList(getPlates());
    setShowForm(false);
  }

  return (
    <section>
      <h2>Czarne tablice rejestracyjne — Przemyśl</h2>
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
        <input placeholder="Szukaj po tablicy lub notatce" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: 1 }} />
        <button onClick={() => setShowForm((s) => !s)} style={{ marginLeft: 0 }}>Zgłoś tablicę</button>
      </div>

      {showForm && <PlateForm onSubmit={submitNew} onCancel={() => setShowForm(false)} />}

      <div>
        {results.length === 0 && <div>Brak tablic w bazie.</div>}
        {results.map((p) => (
          <div key={p.id} style={{ padding: 8, borderBottom: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold' }}>{p.registration}</div>
              <div>
                {p.owner === currentUser()?.username && (
                  <button
                    onClick={() => {
                      if (window.confirm('Na pewno chcesz usunąć tę tablicę?')) {
                        removePlate(p.id);
                        setList(getPlates());
                      }
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    Usuń
                  </button>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#ccc' }}>{p.owner ? `Dodane przez ${p.owner}` : 'Anonimowo'}</div>
            {p.notes && <div style={{ marginTop: 6 }}>{p.notes}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

function PlateForm({ onSubmit, onCancel }: { onSubmit: (r: string, notes: string) => void; onCancel: () => void }) {
  const [reg, setReg] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(reg, notes); }} style={{ marginBottom: 12, width: '100%' }}>
      <input placeholder="Tablica (np. PRZ 1234)" value={reg} onChange={(e) => setReg(e.target.value)} required />
      <textarea placeholder="Notatki (opcjonalnie)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ display: 'block', marginTop: 8 }} />
      <div style={{ marginTop: 8 }}>
        <button type="submit">Dodaj tablicę</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>Anuluj</button>
      </div>
    </form>
  );
}
