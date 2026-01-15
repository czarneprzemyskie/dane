import { useEffect, useState } from 'react';
import Toast from './Toast';
import { addPlate, getPlates, searchPlates, removePlate } from '../lib/storage.ts';
import type { Plate } from '../lib/storage.ts';
import { currentUser } from '../lib/auth.ts';

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export function Plates() {
  const [query, setQuery] = useState('');
  const [list, setList] = useState<Plate[]>([]);
  const [results, setResults] = useState<Plate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ id: number, text: string, type: 'error' | 'success' }[]>([]);

  useEffect(() => {
    (async () => {
      const data = await getPlates();
      setList(data);
      setResults(data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!query) {
        setResults(list);
        return;
      }
      const res = await searchPlates(query);
      setResults(res);
    })();
  }, [query, list]);

  async function submitNew(reg: string, notes: string) {
    const formattedReg = reg.toUpperCase();
    // Check for duplicates
    if (list.some((p) => p.registration === formattedReg)) {
      setStatusMsg((msgs) => [
        ...msgs,
        { id: Date.now(), text: 'Tablica o takim numerze już istnieje w bazie.', type: 'error' }
      ]);
      return;
    }
    const user = currentUser();
    const p: Plate = { id: makeId(), registration: formattedReg, owner: user?.username ?? null, notes, createdAt: new Date().toISOString() };
    await addPlate(p);
    const updated = await getPlates();
    setList(updated);
    setShowForm(false);
    setStatusMsg((msgs) => [
      ...msgs,
      { id: Date.now(), text: 'Tablica została dodana!', type: 'success' }
    ]);
  }

  // Remove toasts after 3 seconds
  useEffect(() => {
    if (statusMsg.length === 0) return;
    const timer = setTimeout(() => {
      setStatusMsg((msgs) => msgs.slice(1));
    }, 3000);
    return () => clearTimeout(timer);
  }, [statusMsg]);

  return (
    <>
      <Toast statusMsg={statusMsg} />
      <section>
      <h2>Czarne tablice rejestracyjne — Przemyśl</h2>
      <div style={{ marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input placeholder="Szukaj po tablicy lub notatce" value={query} onChange={(e) => setQuery(e.target.value)} style={{ flex: '1 1 200px', minWidth: 0 }} />
        <button onClick={() => setShowForm((s) => !s)} style={{ flexShrink: 0 }}>Zgłoś tablicę</button>
      </div>

      {showForm && <PlateForm onSubmit={submitNew} onCancel={() => setShowForm(false)} />}

      <div>
        {results.length === 0 && <div>Brak tablic w bazie.</div>}
        {results.map((p) => (
          <div key={p.id} style={{ padding: 8, borderBottom: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontWeight: 'bold', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.registration}</div>
              <div style={{ flexShrink: 0 }}>
                {p.owner === currentUser()?.username && (
                  <button
                    onClick={async () => {
                      if (window.confirm('Na pewno chcesz usunąć tę tablicę?')) {
                        await removePlate(p.id);
                        const updated = await getPlates();
                        setList(updated);
                      }
                    }}
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
    </>
  );
}

function PlateForm({ onSubmit, onCancel }: { onSubmit: (r: string, notes: string) => void; onCancel: () => void }) {
  const [reg, setReg] = useState('');
  const [notes, setNotes] = useState('');

  // Format registration input: e.g. 'prz1234' -> 'PRZ 1234'
  function formatRegInput(val: string) {
    // Remove spaces, uppercase, then insert space after 3 letters if pattern matches
    const cleaned = val.replace(/\s+/g, '').toUpperCase();
    if (/^[A-Z]{3}\d{1,4}$/.test(cleaned)) {
      return cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
    }
    return val.toUpperCase();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(reg, notes); }} style={{ marginBottom: 12, width: '100%' }}>
      <input
        placeholder="Tablica (np. PRZ 1234)"
        value={reg}
        onChange={(e) => setReg(formatRegInput(e.target.value))}
        required
      />
      <textarea placeholder="Notatki (opcjonalnie)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ display: 'block', marginTop: 8 }} />
      <div style={{ marginTop: 8 }}>
        <button type="submit">Dodaj tablicę</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>Anuluj</button>
      </div>
    </form>
  );
}
