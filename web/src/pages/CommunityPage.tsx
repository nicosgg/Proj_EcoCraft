import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Camera, Users } from 'lucide-react';
import { actionApi } from '../api/endpoints';
import { getErrorMessage } from '../api/axiosClient';
import type { Action, ActionStatus, MaterialKey } from '../types/data_type';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MATERIALS, MATERIAL_KEYS } from '../utils/format';
import ActionCard from '../components/ActionCard';
import { ConfirmDialog } from '../components/Modal';
import { EmptyState, ErrorState, Loading } from '../components/StateViews';

const TABS: { key: ActionStatus | ''; label: string }[] = [
  { key: '', label: 'Semua' },
  { key: 'pending', label: 'Perlu verifikasi' },
  { key: 'verified', label: 'Terverifikasi' },
];

export default function CommunityPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [actions, setActions] = useState<Action[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [status, setStatus] = useState<ActionStatus | ''>('');
  const [material, setMaterial] = useState<MaterialKey | ''>('');
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Action | null>(null);

  // GET /api/actions?status=&material=
  useEffect(() => {
    let active = true;
    const getActions = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await actionApi.list({ status: status || undefined, material: material || undefined });
        if (active) setActions(data);
      } catch (error) {
        if (active) setErrorMsg(getErrorMessage(error, 'Gagal mengambil feed komunitas.'));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    getActions();
    return () => { active = false; };
  }, [status, material, reloadKey, user?.id]);

  // Gulir ke aksi tertentu bila datang dari tautan /komunitas#aksi-ID
  useEffect(() => {
    if (!isLoading && location.hash) document.querySelector(location.hash)?.scrollIntoView({ block: 'center' });
  }, [isLoading, location.hash]);

  const replaceAction = (updated: Action) => setActions((list) => list.map((a) => (a.id === updated.id ? updated : a)));

  // POST atau DELETE /api/actions/:id/kudos
  const handleKudos = async (action: Action) => {
    if (!user) { navigate('/masuk', { state: { from: '/komunitas' } }); return; }
    setBusyId(action.id);
    try {
      if (action.likedByMe) {
        replaceAction(await actionApi.removeKudos(action.id));
      } else {
        const res = await actionApi.giveKudos(action.id);
        replaceAction(res.data);
        if (res.data.status === 'verified' && action.status === 'pending') toast(res.message);
      }
    } catch (error) {
      toast(getErrorMessage(error), 'err');
    } finally {
      setBusyId(null);
    }
  };

  // PATCH /api/actions/:id/status (admin)
  const handleModerate = async (action: Action, next: 'verified' | 'rejected') => {
    setBusyId(action.id);
    try {
      const updated = await actionApi.setStatus(action.id, next);
      if (next === 'rejected') setActions((list) => list.filter((a) => a.id !== action.id));
      else replaceAction(updated);
      toast(next === 'verified' ? 'Aksi diverifikasi, koin pemilik sudah cair.' : 'Aksi ditolak dan disembunyikan dari feed.');
      refreshUser();
    } catch (error) {
      toast(getErrorMessage(error), 'err');
    } finally {
      setBusyId(null);
    }
  };

  // DELETE /api/actions/:id
  const confirmDelete = async () => {
    if (!toDelete) return;
    setBusyId(toDelete.id);
    try {
      await actionApi.remove(toDelete.id);
      setActions((list) => list.filter((a) => a.id !== toDelete.id));
      toast('Aksi berhasil dihapus.');
      refreshUser();
    } catch (error) {
      toast(getErrorMessage(error), 'err');
    } finally {
      setBusyId(null);
      setToDelete(null);
    }
  };

  return (
    <main className="container page">
      <div className="page-head">
        <div>
          <h1>Komunitas</h1>
          <p className="muted">Beri Eco-Kudos untuk hasil karya yang asli. Lima kudos memverifikasi sebuah aksi.</p>
        </div>
        <Link to="/komunitas/baru" className="btn btn-primary"><Camera size={18} />Unggah aksi</Link>
      </div>

      <div className="toolbar">
        <div className="seg" role="tablist" aria-label="Saring status">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={status === t.key} onClick={() => setStatus(t.key)}>{t.label}</button>
          ))}
        </div>
        <label className="select">
          <span className="sr-only">Bahan</span>
          <select value={material} onChange={(e) => setMaterial(e.target.value as MaterialKey | '')}>
            <option value="">Semua bahan</option>
            {MATERIAL_KEYS.map((k) => <option key={k} value={k}>{MATERIALS[k].label}</option>)}
          </select>
        </label>
      </div>

      {isLoading && <Loading text="Memuat feed komunitas..." />}
      {!isLoading && errorMsg && <ErrorState message={errorMsg} onRetry={() => setReloadKey((k) => k + 1)} />}
      {!isLoading && !errorMsg && actions.length === 0 && (
        <EmptyState icon={<Users size={30} />} title="Belum ada aksi" text="Belum ada unggahan untuk filter ini." />
      )}
      {!isLoading && !errorMsg && actions.length > 0 && (
        <div className="grid grid-feed">
          {actions.map((a) => (
            <ActionCard key={a.id} action={a} busy={busyId === a.id} onKudos={handleKudos} onDelete={setToDelete} onModerate={handleModerate} />
          ))}
        </div>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Hapus aksi ini?"
          text={<>Aksi <strong>{toDelete.title}</strong> akan dihapus permanen{toDelete.status === 'verified' ? ' dan Eco-Coins yang sudah cair akan ditarik kembali' : ''}.</>}
          confirmLabel="Hapus"
          danger
          busy={busyId === toDelete.id}
          onConfirm={confirmDelete}
          onClose={() => setToDelete(null)}
        />
      )}
    </main>
  );
}
