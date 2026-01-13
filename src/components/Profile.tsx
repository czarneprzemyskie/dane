import React, { useEffect, useState } from 'react';
import { currentUser } from '../lib/auth.ts';
import { getPlates } from '../lib/storage.ts';
import type { Plate } from '../lib/storage.ts';

export default function Profile() {
  const user = currentUser();
  const [plates, setPlates] = useState<Plate[]>([]);

  useEffect(() => {
    if (user) setPlates(getPlates().filter((p) => p.owner === user.username));
  }, [user]);

  if (!user) return <div>Zaloguj się, aby zobaczyć swój profil.</div>;

  return (
    <section>
      <h2>Profil: {user.username}</h2>
      <h3>Twoje zgłoszone tablice</h3>
      {plates.length === 0 && <div>Nie zgłosiłeś jeszcze żadnej tablicy.</div>}
      {plates.map((p) => (
        <div key={p.id} style={{ padding: 8, borderBottom: '1px solid #333' }}>
          <div style={{ fontWeight: 'bold' }}>{p.registration}</div>
          {p.notes && <div style={{ marginTop: 6 }}>{p.notes}</div>}
        </div>
      ))}
    </section>
  );
}
