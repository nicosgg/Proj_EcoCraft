// Notifikasi singkat di pojok layar.
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CircleAlert, CircleCheck } from 'lucide-react';

type ToastKind = 'ok' | 'err';
interface Toast { id: number; text: string; kind: ToastKind }

const ToastContext = createContext<(text: string, kind?: ToastKind) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const show = useCallback((text: string, kind: ToastKind = 'ok') => {
    seq.current += 1;
    const id = seq.current;
    setToasts((list) => [...list.slice(-2), { id, text, kind }]);
    window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3800);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.kind === 'ok' ? <CircleCheck size={18} /> : <CircleAlert size={18} />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
