// Form unggah bukti aksi (POST /api/actions) dan ubah aksi (PATCH /api/actions/:id).
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Leaf, Coins, Send, Trash2 } from 'lucide-react';
import { actionApi, tutorialApi, uploadApi } from '../api/endpoints';
import { getErrorMessage, getFieldErrors } from '../api/axiosClient';
import type { MaterialKey, Tutorial } from '../types/data_type';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MATERIALS, MATERIAL_KEYS, estimateCo2, estimateCoins, fmt1 } from '../utils/format';
import { ErrorState, Loading } from '../components/StateViews';

const MAX_MB = 3;

export default function ActionFormPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  // Controlled components: setiap input disimpan di state
  const [title, setTitle] = useState<string>('');
  const [material, setMaterial] = useState<MaterialKey>('plastik');
  const [weightKg, setWeightKg] = useState<string>('');
  const [tutorialId, setTutorialId] = useState<string>(searchParams.get('tutorial') ?? '');
  const [imageUrl, setImageUrl] = useState<string>('');

  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Ambil daftar tutorial (untuk pilihan) dan, saat mengubah, data aksi yang ada
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const list = await tutorialApi.list();
        if (!active) return;
        setTutorials(list);
        if (editId) {
          const a = await actionApi.get(editId);
          if (!active) return;
          if (a.user.id !== user?.id) throw new Error('Kamu hanya dapat mengubah aksi milikmu sendiri.');
          if (a.status !== 'pending') throw new Error('Aksi yang sudah diverifikasi atau ditolak tidak dapat diubah.');
          setTitle(a.title);
          setMaterial(a.material);
          setWeightKg(String(a.weightKg));
          setTutorialId(a.tutorial ? String(a.tutorial.id) : '');
          setImageUrl(a.imageUrl ?? '');
        } else {
          const preset = list.find((t) => String(t.id) === searchParams.get('tutorial'));
          if (preset) { setMaterial(preset.material); setTitle(`Selesai membuat ${preset.title.toLowerCase()}`); }
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error && !('isAxiosError' in error) ? error.message : getErrorMessage(error));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [editId, user?.id, searchParams]);

  const handleTutorialChange = (value: string) => {
    setTutorialId(value);
    const t = tutorials.find((x) => String(x.id) === value);
    if (t) setMaterial(t.material); // bahan mengikuti tutorial yang dipilih
  };

  // POST /api/uploads (multipart/form-data)
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast('Format foto harus JPG, PNG, atau WEBP.', 'err'); return; }
    if (file.size > MAX_MB * 1024 * 1024) { toast(`Ukuran foto maksimal ${MAX_MB} MB.`, 'err'); return; }
    setIsUploading(true);
    try {
      const result = await uploadApi.image(file);
      setImageUrl(result.url);
      setFieldErrors(({ imageUrl: _ignored, ...rest }) => rest);
      toast('Foto berhasil diunggah.');
    } catch (error) {
      toast(getErrorMessage(error, 'Unggah foto gagal.'), 'err');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});
    setIsSubmitting(true);
    const payload = {
      title: title.trim(),
      material,
      weightKg: Number(weightKg),
      imageUrl: imageUrl.trim(),
      tutorialId: tutorialId ? Number(tutorialId) : null,
    };
    try {
      if (editId) {
        const { tutorialId: _t, ...patch } = payload; // tutorial tidak diubah lewat PATCH
        await actionApi.update(editId, patch);
        toast('Aksi berhasil diperbarui.');
      } else {
        await actionApi.create(payload);
        toast('Aksi terkirim! Menunggu 5 Eco-Kudos dari komunitas.');
      }
      refreshUser();
      navigate('/komunitas');
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'Gagal menyimpan aksi.'));
      setFieldErrors(getFieldErrors(error));
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <main className="container page narrow"><Loading /></main>;
  if (loadError) {
    return (
      <main className="container page narrow">
        <Link to="/komunitas" className="back-link"><ArrowLeft size={17} />Kembali ke Komunitas</Link>
        <ErrorState message={loadError} />
      </main>
    );
  }

  const weight = Number(weightKg);
  const validWeight = weight >= 0.1 && weight <= 10;

  return (
    <main className="container page narrow">
      <Link to="/komunitas" className="back-link"><ArrowLeft size={17} />Kembali ke Komunitas</Link>
      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h1>{editId ? 'Ubah aksi' : 'Unggah bukti aksi'}</h1>
        <p className="muted">Foto hasil karyamu akan diverifikasi komunitas. Eco-Coins cair setelah 5 Eco-Kudos.</p>

        {errorMsg && <div className="alert alert-error" role="alert">{errorMsg}</div>}

        <div className="field">
          <span>Foto bukti</span>
          {imageUrl ? (
            <div className="photo-preview">
              <img src={imageUrl} alt="Pratinjau foto bukti" />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setImageUrl('')}><Trash2 size={15} />Ganti foto</button>
            </div>
          ) : (
            <button type="button" className={`dropzone${fieldErrors.imageUrl ? ' invalid' : ''}`} onClick={() => fileInput.current?.click()} disabled={isUploading}>
              <ImagePlus size={26} />
              <strong>{isUploading ? 'Mengunggah...' : 'Pilih foto hasil karya'}</strong>
              <small>JPG, PNG, atau WEBP, maks. {MAX_MB} MB</small>
            </button>
          )}
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} />
          {fieldErrors.imageUrl && <small className="field-error">{fieldErrors.imageUrl}</small>}
        </div>

        <label className="field">
          <span>Judul aksi</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contoh: Pot gantung dari botol bekas" maxLength={120} />
          {fieldErrors.title && <small className="field-error">{fieldErrors.title}</small>}
        </label>

        {!editId && (
          <label className="field">
            <span>Mengikuti tutorial (opsional)</span>
            <select value={tutorialId} onChange={(e) => handleTutorialChange(e.target.value)}>
              <option value="">Karya sendiri, tanpa tutorial</option>
              {tutorials.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
            {fieldErrors.tutorialId && <small className="field-error">{fieldErrors.tutorialId}</small>}
          </label>
        )}

        <div className="field-row">
          <label className="field">
            <span>Jenis bahan</span>
            <select value={material} onChange={(e) => setMaterial(e.target.value as MaterialKey)}>
              {MATERIAL_KEYS.map((k) => <option key={k} value={k}>{MATERIALS[k].label}</option>)}
            </select>
            {fieldErrors.material && <small className="field-error">{fieldErrors.material}</small>}
          </label>
          <label className="field">
            <span>Berat limbah (kg)</span>
            <input type="number" inputMode="decimal" min={0.1} max={10} step={0.1} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="0,5" />
            {fieldErrors.weightKg ? <small className="field-error">{fieldErrors.weightKg}</small> : <small className="hint">0,1 sampai 10 kg</small>}
          </label>
        </div>

        {validWeight && (
          <div className="estimate">
            <span><Coins size={16} />+{estimateCoins(weight)} Eco-Coins</span>
            <span><Leaf size={16} />±{fmt1(estimateCo2(weight, material))} kg CO₂e</span>
            <small>Perkiraan. Nilai akhir dihitung oleh server.</small>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting || isUploading}>
          <Send size={18} />{isSubmitting ? 'Menyimpan...' : editId ? 'Simpan perubahan' : 'Kirim untuk verifikasi'}
        </button>
      </form>
    </main>
  );
}
