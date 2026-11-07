import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { EmptyState, Loading } from './StateViews';

/** Halaman yang hanya bisa dibuka setelah login (adminOnly: hanya admin). */
export default function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) return <Loading text="Memeriksa sesi login..." />;
  if (!user) return <Navigate to="/masuk" replace state={{ from: location.pathname + location.search }} />;
  if (adminOnly && !isAdmin) {
    return (
      <main className="container page">
        <EmptyState icon={<ShieldAlert size={30} />} title="Khusus admin" text="Halaman ini hanya dapat dibuka oleh akun admin." />
      </main>
    );
  }
  return <>{children}</>;
}
