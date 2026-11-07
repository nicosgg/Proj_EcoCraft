import { useEffect, useState, type FormEvent } from 'react';
import { Clock, MapPin, Navigation, Pencil, Plus, Trash2 } from 'lucide-react';
import { dropPointApi } from '../api/endpoints';
import { getErrorMessage, getFieldErrors } from '../api/axiosClient';
import type { DropPoint, DropPointInput, MaterialKey } from '../types/data_type';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MATERIALS, MATERIAL_KEYS } from '../utils/format';
import { MaterialBadge } from '../components/Badges';
import { ConfirmDialog, Modal } from '../components/Modal';
import { EmptyState, ErrorState, Loading } from '../components/StateViews';

const EMPTY_FORM: DropPointInput = { name: '', type: 'Bank sampah', address: '', latitude: 0, longitude: 0, materials: [], openingHours: '' };

/** Form tambah/ubah titik setor (admin). */
function DropPointForm({ initial, onSaved, onClose }: { initial: DropPoint | null; onSaved: (d: DropPoint, isNew: boolean) => void; onClose: () => void }) {
  const [form, setForm] = useState<DropPointInput>(initial ? {
    name: initial.name, type: initial.type, address: initial.address ?? '', latitude: initial.latitude, longitude: initial.longitude,
    materials: initial.materials, openingHours: initial.openingHours ?? '',
  } : EMPTY_FORM);
  const [lat, setLat] = useState<string>(initial ? String(initial.latitude) : '');
  const [lng, setLng] = useState<string>(initial ? String(initial.longitude) : '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = <K extends keyof DropPointInput>(key: K, value: DropPointInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleMaterial = (k: MaterialKey) => set('materials', form.materials.includes(k) ? form.materials.filter((m) => m !== k) : [...form.materials, k]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});
    // Kolom kosong dikirim null agar server membalas "wajib diisi" (bukan dianggap 0)
    const body = { ...form, latitude: lat.trim() ? Number(lat) : null, longitude: lng.trim() ? Number(lng) : null };
    try {
      // POST /api/drop-points atau PUT /api/drop-points/:id
      const saved = initial ? await dropPointApi.update(initial.id, body) : await dropPointApi.create(body);
      onSaved(saved, !initial);
    } catch (error) {
      setErrorMsg(getErrorMessage(error));
      setFieldErrors(getFieldErrors(error));
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title={initial ? 'Ubah titik setor' : 'Tambah titik setor'} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {errorMsg && <div className="alert alert-error">{errorMsg}</div>}
          <label className="field"><span>Nama</span>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} />
            {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
          </label>
          <div className="field-row">
            <label className="field"><span>Jenis mitra</span>
              <input value={form.type} onChange={(e) => set('type', e.target.value)} list="dp-types" />
              <datalist id="dp-types"><option value="Bank sampah" /><option value="TPS3R" /><option value="Drop box mitra" /><option value="Pengepul" /></datalist>
              {fieldErrors.type && <small className="field-error">{fieldErrors.type}</small>}
            </label>
            <label className="field"><span>Jam buka</span>
              <input value={form.openingHours} onChange={(e) => set('openingHours', e.target.value)} placeholder="Senin–Sabtu, 08.00–15.00" />
            </label>
          </div>
          <label className="field"><span>Alamat</span>
            <input value={form.address} onChange={(e) => set('address', e.target.value)} />
          </label>
          <div className="field-row">
            <label className="field"><span>Latitude</span>
              <input type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-6.2440" />
              {fieldErrors.latitude && <small className="field-error">{fieldErrors.latitude}</small>}
            </label>
            <label className="field"><span>Longitude</span>
              <input type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="106.7990" />
              {fieldErrors.longitude && <small className="field-error">{fieldErrors.longitude}</small>}
            </label>
          </div>
          <fieldset className="field">
            <legend>Bahan yang diterima</legend>
            <div className="chips">
              {MATERIAL_KEYS.map((k) => (
                <button key={k} type="button" className="chip" aria-pressed={form.materials.includes(k)} onClick={() => toggleMaterial(k)}
                  style={{ ['--c' as string]: MATERIALS[k].color }}><span className="dot" />{MATERIALS[k].label}</button>
              ))}
            </div>
            {fieldErrors.materials && <small className="field-error">{fieldErrors.materials}</small>}
          </fieldset>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function DropPointsPage() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [points, setPoints] = useState<DropPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [material, setMaterial] = useState<MaterialKey | ''>('');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [editing, setEditing] = useState<DropPoint | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<DropPoint | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // GET /api/drop-points?material=
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMsg(null);
    dropPointApi.list(material || undefined)
      .then((data) => { if (active) setPoints(data); })
      .catch((error) => { if (active) setErrorMsg(getErrorMessage(error, 'Gagal mengambil titik setor.')); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [material, reloadKey]);

  const handleSaved = (saved: DropPoint, isNew: boolean) => {
    setEditing(null);
    toast(isNew ? 'Titik setor ditambahkan.' : 'Titik setor diperbarui.');
    if (material && !saved.materials.includes(material)) { setReloadKey((k) => k + 1); return; }
    setPoints((list) => (isNew ? [...list, saved] : list.map((p) => (p.id === saved.id ? saved : p))));
  };

  // DELETE /api/drop-points/:id
  const confirmDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await dropPointApi.remove(toDelete.id);
      setPoints((list) => list.filter((p) => p.id !== toDelete.id));
      toast('Titik setor dihapus.');
    } catch (error) {
      toast(getErrorMessage(error), 'err');
    } finally {
      setIsDeleting(false);
      setToDelete(null);
    }
  };

  return (
    <main className="container page">
      <div className="page-head">
        <div>
          <h1>Titik setor</h1>
          <p className="muted">Serahkan limbah yang belum bisa kamu olah ke bank sampah atau mitra daur ulang terdekat.</p>
        </div>
        {isAdmin && <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={18} />Tambah titik setor</button>}
      </div>

      <div className="chips" role="group" aria-label="Saring bahan yang diterima">
        <button type="button" className="chip" aria-pressed={material === ''} onClick={() => setMaterial('')}>Semua bahan</button>
        {MATERIAL_KEYS.map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={material === k} onClick={() => setMaterial(material === k ? '' : k)}
            style={{ ['--c' as string]: MATERIALS[k].color }}><span className="dot" />{MATERIALS[k].label}</button>
        ))}
      </div>
      <p className="note">Nama dan lokasi mitra pada prototipe ini adalah data contoh.</p>

      {isLoading && <Loading text="Memuat titik setor..." />}
      {!isLoading && errorMsg && <ErrorState message={errorMsg} onRetry={() => setReloadKey((k) => k + 1)} />}
      {!isLoading && !errorMsg && points.length === 0 && (
        <EmptyState icon={<MapPin size={30} />} title="Belum ada titik setor" text="Belum ada mitra yang menerima bahan ini." />
      )}
      {!isLoading && !errorMsg && points.length > 0 && (
        <div className="grid grid-drops">
          {points.map((p) => (
            <article key={p.id} className="card drop">
              <div className="drop-top">
                <div>
                  <h3>{p.name}</h3>
                  <p className="muted small">{p.type}{p.address ? ` · ${p.address}` : ''}</p>
                </div>
              </div>
              {p.openingHours && <p className="drop-hours"><Clock size={15} />{p.openingHours}</p>}
              <div className="chips-row">{p.materials.map((m) => <MaterialBadge key={m} material={m} />)}</div>
              <div className="drop-actions">
                <a className="btn btn-primary btn-sm" href={p.mapsUrl} target="_blank" rel="noreferrer"><Navigation size={15} />Rute</a>
                {isAdmin && (
                  <>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}><Pencil size={15} />Ubah</button>
                    <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setToDelete(p)}><Trash2 size={15} />Hapus</button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && <DropPointForm initial={editing === 'new' ? null : editing} onSaved={handleSaved} onClose={() => setEditing(null)} />}
      {toDelete && (
        <ConfirmDialog title="Hapus titik setor?" text={<><strong>{toDelete.name}</strong> akan dihapus dari daftar.</>}
          confirmLabel="Hapus" danger busy={isDeleting} onConfirm={confirmDelete} onClose={() => setToDelete(null)} />
      )}
    </main>
  );
}
