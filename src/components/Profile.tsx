import { useEffect, useState } from 'react';
import { currentUser } from '../lib/auth.ts';
import { getPlates, removePlate } from '../lib/storage.ts';
import type { Plate } from '../lib/storage.ts';

export default function Profile() {
  const user = currentUser();
  const [plates, setPlates] = useState<Plate[]>([]);

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 'bold' }}>{p.registration}</div>
            <div>
              <button
                onClick={async () => {
                  if (window.confirm('Na pewno chcesz usunąć tę tablicę?')) {
                    await removePlate(p.id);
                    const all = await getPlates();
                    setPlates(all.filter((pl) => pl.owner === user!.username));
                  }
                }}
              >
                Usuń
              </button>
            </div>
          </div>
          {p.notes && <div style={{ marginTop: 6 }}>{p.notes}</div>}
        </div>
      ))}
    </section>
  );
}
