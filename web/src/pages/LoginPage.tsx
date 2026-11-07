import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../api/axiosClient';

const DEMO_ACCOUNTS = [
  { label: 'Sarah (anggota)', email: 'sarah@ecocraft.id', password: 'eco12345' },
  { label: 'Rizky (anggota)', email: 'rizky@ecocraft.id', password: 'eco12345' },
  { label: 'Admin', email: 'admin@ecocraft.id', password: 'admin123' },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/';

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (user && !isSubmitting) return <Navigate to={from} replace />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      const u = await login(email.trim(), password);
      toast(`Selamat datang, ${u.name.split(' ')[0]}!`);
      navigate(from, { replace: true });
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'Login gagal.'));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit} noValidate>
        <h1>Masuk ke EcoCraft</h1>
        <p className="muted">Masuk untuk mengunggah hasil karya, memberi Eco-Kudos, dan menukar Eco-Coins.</p>

        {errorMsg && <div className="alert alert-error" role="alert">{errorMsg}</div>}

        <label className="field">
          <span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span>Kata sandi</span>
          <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting || !email || !password}>
          <LogIn size={18} />{isSubmitting ? 'Memproses...' : 'Masuk'}
        </button>

        <p className="center muted">Belum punya akun? <Link to="/daftar" state={location.state}>Daftar</Link></p>

        <div className="demo-box">
          <strong>Akun contoh (data awal server)</strong>
          <div className="demo-list">
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.email} type="button" className="chip" onClick={() => { setEmail(a.email); setPassword(a.password); }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </main>
  );
}
