import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { tutorialApi } from '../api/endpoints';
import { getErrorMessage } from '../api/axiosClient';
import type { Tutorial } from '../types/data_type';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../utils/format';
import { MaterialBadge } from '../components/Badges';
import { ConfirmDialog } from '../components/Modal';
import { EmptyState, ErrorState, Loading } from '../components/StateViews';

/** Halaman admin: daftar tutorial dengan aksi ubah dan hapus. */
export default function AdminTutorialsPage() {
  const toast = useToast();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [toDelete, setToDelete] = useState<Tutorial | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMsg(null);
    tutorialApi.list()
      .then((d) => { if (active) setTutorials(d); })
      .catch((e) => { if (active) setErrorMsg(getErrorMessage(e, 'Gagal mengambil tutorial.')); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  // DELETE /api/tutorials/:id
  const confirmDelete = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      await tutorialApi.remove(toDelete.id);
      setTutorials((list) => list.filter((t) => t.id !== toDelete.id));
      toast('Tutorial dihapus.');
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
          <h1>Kelola tutorial</h1>
          <p className="muted">Tambah, ubah, atau hapus tutorial. Perubahan langsung terlihat di semua platform.</p>
        </div>
        <Link to="/admin/tutorial/baru" className="btn btn-primary"><Plus size={18} />Tambah tutorial</Link>
      </div>

      {isLoading && <Loading />}
      {!isLoading && errorMsg && <ErrorState message={errorMsg} onRetry={() => setReloadKey((k) => k + 1)} />}
      {!isLoading && !errorMsg && tutorials.length === 0 && <EmptyState title="Belum ada tutorial" />}
      {!isLoading && !errorMsg && tutorials.length > 0 && (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr><th>ID</th><th>Judul</th><th>Bahan</th><th>Durasi</th><th>Langkah</th><th>XP</th><th>Diperbarui</th><th aria-label="Aksi" /></tr>
            </thead>
            <tbody>
              {tutorials.map((t) => (
                <tr key={t.id}>
                  <td className="muted">#{t.id}</td>
                  <td><Link to={`/tutorial/${t.id}`}>{t.title}</Link></td>
                  <td><MaterialBadge material={t.material} /></td>
                  <td>{t.durationMinutes} mnt</td>
                  <td>{t.stepCount}</td>
                  <td>{t.xpReward}</td>
                  <td className="muted small">{formatDate(t.updatedAt)}</td>
                  <td className="row-actions">
                    <Link to={`/admin/tutorial/${t.id}/ubah`} className="btn btn-ghost btn-sm"><Pencil size={15} />Ubah</Link>
                    <button type="button" className="btn btn-ghost btn-sm danger" onClick={() => setToDelete(t)}><Trash2 size={15} />Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {toDelete && (
        <ConfirmDialog title="Hapus tutorial?" danger busy={isDeleting} confirmLabel="Hapus"
          text={<>Tutorial <strong>{toDelete.title}</strong> beserta langkahnya akan dihapus. Aksi yang sudah mengacu ke tutorial ini tetap tersimpan.</>}
          onConfirm={confirmDelete} onClose={() => setToDelete(null)} />
      )}
    </main>
  );
}
