// Tiga kondisi status API: Loading, Error, dan data kosong.
import type { ReactNode } from 'react';
import { CircleAlert, LoaderCircle, RotateCw } from 'lucide-react';

export function Loading({ text = 'Memuat data...' }: { text?: string }) {
  return (
    <div className="state" role="status">
      <LoaderCircle className="spin" size={26} />
      <p>{text}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state state-error" role="alert">
      <CircleAlert size={26} />
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          <RotateCw size={16} />Coba lagi
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="state state-empty">
      {icon}
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
