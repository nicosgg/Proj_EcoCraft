// Form admin: POST /api/tutorials (baru) atau PUT /api/tutorials/:id (ubah).
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, X } from 'lucide-react';
import { tutorialApi } from '../api/endpoints';
import { getErrorMessage, getFieldErrors } from '../api/axiosClient';
import type { Difficulty, MaterialKey, TutorialInput } from '../types/data_type';
import { useToast } from '../context/ToastContext';
import { DIFFICULTIES, MATERIALS, MATERIAL_KEYS } from '../utils/format';
import { ErrorState, Loading } from '../components/StateViews';

interface FormState {
  title: string; description: string; material: MaterialKey; difficulty: Difficulty;
  durationMinutes: string; co2SavedKg: string; xpReward: string; imageUrl: string; steps: string[];
}

const EMPTY: FormState = {
  title: '', description: '', material: 'plastik', difficulty: 'Mudah',
  durationMinutes: '5', co2SavedKg: '0.2', xpReward: '50', imageUrl: '', steps: [''],
};

export default function TutorialFormPage() {
  const { id } = useParams();
  const editId = id ? Number(id) : null;
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [isLoading, setIsLoading] = useState<boolean>(!!editId);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!editId) return;
    tutorialApi.get(editId)
      .then((t) => setForm({
        title: t.title, description: t.description ?? '', material: t.material, difficulty: t.difficulty,
        durationMinutes: String(t.durationMinutes), co2SavedKg: String(t.co2SavedKg), xpReward: String(t.xpReward),
        imageUrl: t.imageUrl ?? '', steps: (t.steps ?? []).map((s) => s.description),
      }))
      .catch((e) => setLoadError(getErrorMessage(e, 'Gagal mengambil tutorial.')))
      .finally(() => setIsLoading(false));
  }, [editId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setStep = (i: number, value: string) => setForm((f) => ({ ...f, steps: f.steps.map((s, k) => (k === i ? value : s)) }));
  const addStep = () => setForm((f) => ({ ...f, steps: [...f.steps, ''] }));
  const removeStep = (i: number) => setForm((f) => ({ ...f, steps: f.steps.filter((_, k) => k !== i) }));
  const moveStep = (i: number, dir: -1 | 1) => setForm((f) => {
    const steps = [...f.steps];
    [steps[i], steps[i + dir]] = [steps[i + dir], steps[i]];
    return { ...f, steps };
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});
    const body: TutorialInput = {
      title: form.title.trim(),
      description: form.description.trim(),
      material: form.material,
      difficulty: form.difficulty,
      durationMinutes: Number(form.durationMinutes),
      co2SavedKg: Number(form.co2SavedKg),
      xpReward: Number(form.xpReward),
      imageUrl: form.imageUrl.trim() || null,
      steps: form.steps.map((description) => ({ description: description.trim() })),
    };
    try {
      const saved = editId ? await tutorialApi.update(editId, body) : await tutorialApi.create(body);
      toast(editId ? 'Tutorial diperbarui.' : 'Tutorial ditambahkan.');
      navigate(`/tutorial/${saved.id}`);
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'Gagal menyimpan tutorial.'));
      setFieldErrors(getFieldErrors(error));
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <main className="container page narrow"><Loading /></main>;
  if (loadError) return <main className="container page narrow"><ErrorState message={loadError} /></main>;

  const err = (k: string) => fieldErrors[k] && <small className="field-error">{fieldErrors[k]}</small>;

  return (
    <main className="container page narrow">
      <Link to="/admin/tutorial" className="back-link"><ArrowLeft size={17} />Kembali ke Kelola tutorial</Link>
      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <h1>{editId ? `Ubah tutorial #${editId}` : 'Tambah tutorial'}</h1>
        {errorMsg && <div className="alert alert-error" role="alert">{errorMsg}</div>}

        <label className="field"><span>Judul</span>
          <input value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={120} />{err('title')}
        </label>
        <label className="field"><span>Deskripsi singkat</span>
          <textarea rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={1000} />{err('description')}
        </label>
        <div className="field-row">
          <label className="field"><span>Bahan</span>
            <select value={form.material} onChange={(e) => set('material', e.target.value as MaterialKey)}>
              {MATERIAL_KEYS.map((k) => <option key={k} value={k}>{MATERIALS[k].label}</option>)}
            </select>{err('material')}
          </label>
          <label className="field"><span>Kesulitan</span>
            <select value={form.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}>
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>{err('difficulty')}
          </label>
        </div>
        <div className="field-row three">
          <label className="field"><span>Durasi (menit)</span>
            <input type="number" min={1} value={form.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} />{err('durationMinutes')}
          </label>
          <label className="field"><span>CO₂e dicegah (kg)</span>
            <input type="number" min={0} step={0.1} value={form.co2SavedKg} onChange={(e) => set('co2SavedKg', e.target.value)} />{err('co2SavedKg')}
          </label>
          <label className="field"><span>Hadiah XP</span>
            <input type="number" min={0} value={form.xpReward} onChange={(e) => set('xpReward', e.target.value)} />{err('xpReward')}
          </label>
        </div>
        <label className="field"><span>URL gambar sampul (opsional)</span>
          <input value={form.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="http://localhost:3000/static/illustrations/pot.svg" />
        </label>

        <fieldset className="field">
          <legend>Langkah pengerjaan</legend>
          {err('steps')}
          <ol className="step-editor">
            {form.steps.map((s, i) => (
              <li key={i}>
                <span className="step-num sm">{i + 1}</span>
                <textarea rows={2} value={s} onChange={(e) => setStep(i, e.target.value)} placeholder={`Jelaskan langkah ${i + 1}`} aria-label={`Langkah ${i + 1}`} />
                <div className="step-tools">
                  <button type="button" className="icon-btn sm" onClick={() => moveStep(i, -1)} disabled={i === 0} aria-label="Naikkan"><ArrowUp size={15} /></button>
                  <button type="button" className="icon-btn sm" onClick={() => moveStep(i, 1)} disabled={i === form.steps.length - 1} aria-label="Turunkan"><ArrowDown size={15} /></button>
                  <button type="button" className="icon-btn sm" onClick={() => removeStep(i)} disabled={form.steps.length === 1} aria-label="Hapus langkah"><X size={15} /></button>
                </div>
                {fieldErrors[`steps[${i}].description`] && <small className="field-error">{fieldErrors[`steps[${i}].description`]}</small>}
              </li>
            ))}
          </ol>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addStep} disabled={form.steps.length >= 20}><Plus size={15} />Tambah langkah</button>
        </fieldset>

        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          <Save size={18} />{isSubmitting ? 'Menyimpan...' : editId ? 'Simpan perubahan (PUT)' : 'Simpan tutorial (POST)'}
        </button>
      </form>
    </main>
  );
}
