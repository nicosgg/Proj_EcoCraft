import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../api/axiosClient';

export default function RegisterPage() {
  const { user, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (user && !isSubmitting) return <Navigate to={from} replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      toast('Akun berhasil dibuat. Selamat bergabung!');
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'Registrasi gagal.'));
      setFieldErrors(getFieldErrors(error));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Buat akun</h1>
        <p className="muted">Akun baru terdaftar sebagai anggota dengan saldo awal 0 Eco-Coins.</p>

        {errorMsg && <div className="alert alert-error" role="alert">{errorMsg}</div>}

        <label className="field">
          <span>Nama lengkap</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          {fieldErrors.email && <small className="field-error">{fieldErrors.email}</small>}
        </label>
        <label className="field">
          <span>Kata sandi</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <small className={fieldErrors.password ? 'field-error' : 'hint'}>{fieldErrors.password || 'Minimal 6 karakter.'}</small>
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
          <UserPlus size={18} />{isSubmitting ? 'Memproses...' : 'Daftar'}
        </button>
        <p className="center muted">Sudah punya akun? <Link to="/masuk" state={location.state}>Masuk</Link></p>
      </form>
    </main>
  );
}
