import { useEffect, useState } from 'react';
import { addPlate, getPlates, searchPlates, removePlate, uploadImage } from '../lib/storage.ts';
import { supabase } from '../lib/db';
import type { Plate } from '../lib/storage.ts';
import { currentUser } from '../lib/auth.ts';
import type { ToastMsg } from './Toast';

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export function Plates({ setStatusMsg }: { setStatusMsg: React.Dispatch<React.SetStateAction<ToastMsg | null>> }) {
  const [query, setQuery] = useState('');
  const [list, setList] = useState<Plate[]>([]);
  const [results, setResults] = useState<Plate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  useEffect(() => {
    (async () => {
      const data = await getPlates();
      setList(data);
      setResults(data);
      // determine if current user is admin
      try {
        const { data } = await supabase.auth.getUser();
        const uid = data?.user?.id;
        if (uid) {
          const { data: profile } = await supabase.from('profiles').select('is_admin,username').eq('id', uid).limit(1).single();
          if (profile && profile.is_admin) setIsAdmin(true);
          if (profile && profile.username) setCurrentUsername(profile.username);
        }
      } catch (e) {
        // ignore
      }
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

  async function submitNew(reg: string, notes: string, photoFile: File | null) {
    const formattedReg = reg.toUpperCase();
    // Check for duplicates
    if (list.some((p) => p.registration === formattedReg)) {
      setStatusMsg({ id: Date.now(), text: 'Tablica o takim numerze już istnieje w bazie.', type: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      const user = currentUser();
      const id = makeId();
      let photoUrl: string | undefined;
      if (photoFile) {
        photoUrl = await uploadImage(photoFile, 'plates', id);
      }
      const p: Plate = { id, registration: formattedReg, owner: user?.username ?? null, notes, photoUrl, createdAt: new Date().toISOString() };
      await addPlate(p);
      const updated = await getPlates();
      setList(updated);
      setShowForm(false);
      setStatusMsg({ id: Date.now(), text: 'Tablica została dodana!', type: 'success' });
    } catch (err) {
      setStatusMsg({ id: Date.now(), text: 'Nie udało się dodać tablicy. Spróbuj ponownie.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  }



  return (
    <>
      <section>
      <h2>Czarne tablice rejestracyjne — Przemyśl</h2>
      <div className="section-toolbar" style={{ marginBottom: 12 }}>
        <input
          className="grow"
          placeholder="Szukaj po tablicy lub notatce"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="toolbar-actions">
          {query && (
            <button type="button" onClick={() => setQuery('')}>Wyczyść</button>
          )}
          <button onClick={() => setShowForm((s) => !s)} style={{ flexShrink: 0 }}>
            {showForm ? 'Zamknij formularz' : 'Zgłoś tablicę'}
          </button>
        </div>
      </div>

      <div className="result-meta">Wyniki: {results.length}</div>

      {showForm && (
        <PlateForm
          onSubmit={submitNew}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
          maxImageSize={MAX_IMAGE_SIZE}
        />
      )}

      <div>
        {results.length === 0 && <div>Brak tablic w bazie.</div>}
        {results.map((p) => (
          <div key={p.id} style={{ padding: 8, borderBottom: '1px solid #333' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontWeight: 'bold', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.registration}</div>
              <div style={{ flexShrink: 0 }}>
                {(p.owner === currentUsername || isAdmin) && (
                  <button
                    onClick={async () => {
                      if (!window.confirm('Na pewno chcesz usunąć tę tablicę?')) return;
                      const ok = await removePlate(p.id);
                      if (ok) {
                        const updated = await getPlates();
                        setList(updated);
                        setResults(updated);
                        setStatusMsg({ id: Date.now(), text: 'Usunięto tablicę', type: 'success' });
                      } else {
                        setStatusMsg({ id: Date.now(), text: 'Błąd podczas usuwania', type: 'error' });
                      }
                    }}
                  >Usuń</button>
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#ccc' }}>{p.owner ? `Dodane przez ${p.owner}` : 'Anonimowo'}</div>
            {p.notes && <div style={{ marginTop: 6 }}>{p.notes}</div>}
            {p.photoUrl && (
              <div className="plate-media">
                <img src={p.photoUrl} alt={`Zdjęcie tablicy ${p.registration}`} loading="lazy" />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
    </>
  );
}

function PlateForm({
  onSubmit,
  onCancel,
  isSubmitting,
  maxImageSize,
}: {
  onSubmit: (r: string, notes: string, photoFile: File | null) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  maxImageSize: number;
}) {
  const [reg, setReg] = useState('');
  const [notes, setNotes] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Format registration input: e.g. 'prz1234' -> 'PRZ 1234'
  function formatRegInput(val: string) {
    // Remove spaces, uppercase, then insert space after 3 letters if pattern matches
    const cleaned = val.replace(/\s+/g, '').toUpperCase();
    if (/^[A-Z]{3}\d{1,4}$/.test(cleaned)) {
      return cleaned.slice(0, 3) + ' ' + cleaned.slice(3);
    }
    return val.toUpperCase();
  }

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  function handlePhotoChange(file: File | null) {
    if (!file) {
      setPhotoFile(null);
      setPhotoError(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setPhotoError('Wybierz plik graficzny.');
      setPhotoFile(null);
      return;
    }
    if (file.size > maxImageSize) {
      setPhotoError('Zdjęcie jest za duże (maks. 5 MB).');
      setPhotoFile(null);
      return;
    }
    setPhotoError(null);
    setPhotoFile(file);
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(reg, notes, photoFile); }} style={{ marginBottom: 12, width: '100%' }}>
      <input
        placeholder="Tablica (np. PRZ 1234)"
        value={reg}
        onChange={(e) => setReg(formatRegInput(e.target.value))}
        required
      />
      <textarea placeholder="Notatki (opcjonalnie)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ display: 'block', marginTop: 8 }} />
      <div className="form-grid" style={{ marginTop: 8 }}>
        <label>
          Dodaj zdjęcie (opcjonalnie)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
          />
        </label>
        <div className="input-help">Maksymalny rozmiar: 5 MB</div>
        {photoError && <div className="input-error">{photoError}</div>}
        {photoPreview && (
          <div className="media-preview">
            <img src={photoPreview} alt="Podgląd zdjęcia" />
            <div className="media-meta">
              <div>{photoFile?.name}</div>
              <button type="button" onClick={() => handlePhotoChange(null)}>Usuń zdjęcie</button>
            </div>
          </div>
        )}
      </div>
      <div style={{ marginTop: 8 }}>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Dodawanie...' : 'Dodaj tablicę'}</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }} disabled={isSubmitting}>Anuluj</button>
      </div>
    </form>
  );
}
