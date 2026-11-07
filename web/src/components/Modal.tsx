import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ title, onClose, children, width = 520 }: {
  title: string; onClose: () => void; children: ReactNode; width?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Dialog konfirmasi sebelum aksi yang tidak bisa dibatalkan (hapus, tukar koin). */
export function ConfirmDialog({ title, text, confirmLabel = 'Ya, lanjutkan', danger = false, busy = false, onConfirm, onClose }: {
  title: string; text: ReactNode; confirmLabel?: string; danger?: boolean; busy?: boolean;
  onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose} width={420}>
      <div className="modal-body"><p>{text}</p></div>
      <div className="modal-foot">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>Batal</button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
          {busy ? 'Memproses...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
