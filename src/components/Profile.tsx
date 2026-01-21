
import { useEffect, useState } from 'react';
import { currentUser } from '../lib/auth.ts';
import { getPlates, removePlate } from '../lib/storage.ts';
import type { Plate } from '../lib/storage.ts';
import type { ToastMsg } from './Toast';

export default function Profile({ setStatusMsg }: { setStatusMsg: React.Dispatch<React.SetStateAction<ToastMsg | null>> }) {  const user = currentUser();
  const [plates, setPlates] = useState<Plate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReg, setEditReg] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    (async () => {
      if (!user) return;
      const all = await getPlates();
      setPlates(all.filter((p) => p.owner === user.username));
    })();
  }, [user]);

  if (!user) return <div>Zaloguj się, aby zobaczyć swój profil.</div>;

  return (
    <section>
      <h2>Profil: {user.username}</h2>
      <h3>Twoje zgłoszone tablice</h3>
      {plates.length === 0 && <div>Nie zgłosiłeś jeszcze żadnej tablicy.</div>}
      {plates.map((p) => (
        <div key={p.id} style={{ padding: 8, borderBottom: '1px solid #333' }}>
          {editingId === p.id ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // TODO: Add updatePlate logic to persist changes in DB
                const updatedList = plates.map((plate) =>
                  plate.id === p.id ? { ...plate, registration: editReg, notes: editNotes } : plate
                );
                setPlates(updatedList);
                setEditingId(null);
                setStatusMsg({ id: Date.now(), text: 'Tablica zaktualizowana!', type: 'success' });
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <input value={editReg} onChange={e => setEditReg(e.target.value)} />
              <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} />
              <div>
                <button type="submit">Zapisz</button>
                <button type="button" onClick={() => setEditingId(null)} style={{ marginLeft: 8 }}>Anuluj</button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{p.registration}</div>
                <div>
                  <button
                    onClick={async () => {
                      if (window.confirm('Na pewno chcesz usunąć tę tablicę?')) {
                        await removePlate(p.id);
                        const all = await getPlates();
                        setPlates(all.filter((pl) => pl.owner === user!.username));
                                setStatusMsg({ id: Date.now(), text: 'Tablica usunięta!', type: 'success' });
                      }
                    }}
                  >
                    Usuń
                  </button>
                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                      setEditingId(p.id);
                      setEditReg(p.registration);
                      setEditNotes(p.notes || '');
                    }}
                  >Edytuj</button>
                </div>
              </div>
              {p.notes && <div style={{ marginTop: 6 }}>{p.notes}</div>}
            </>
          )}
        </div>
      ))}
    </section>
  );
}
