import { NavLink, Link, useNavigate } from 'react-router-dom';
import { BookOpen, Coins, FileCode2, LogOut, MapPin, Settings2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fmt, initials } from '../utils/format';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/masuk');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="EcoCraft, ke beranda">
          <span className="brand-mark"><img src="/favicon.svg" alt="" width={30} height={30} /></span>
          EcoCraft
        </Link>

        <nav className="nav-links" aria-label="Menu utama">
          <NavLink to="/" end><BookOpen size={17} />Jelajah</NavLink>
          <NavLink to="/komunitas"><Users size={17} />Komunitas</NavLink>
          <NavLink to="/titik-setor"><MapPin size={17} />Titik setor</NavLink>
          {isAdmin && <NavLink to="/admin/tutorial"><Settings2 size={17} />Kelola</NavLink>}
          <NavLink to="/api-docs"><FileCode2 size={17} />API</NavLink>
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <Link to="/profil" className="coin-pill" title="Saldo Eco-Coins">
                <Coins size={16} />{fmt(user.coins)}
              </Link>
              <Link to="/profil" className="avatar-chip" title={`${user.name}${isAdmin ? ' (admin)' : ''}`}>
                <span className="avatar">{initials(user.name)}</span>
                <span className="avatar-name">{user.name.split(' ')[0]}</span>
              </Link>
              <button type="button" className="icon-btn" onClick={handleLogout} aria-label="Keluar" title="Keluar">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/masuk" className="btn btn-primary btn-sm">Masuk</Link>
          )}
        </div>
      </div>
    </header>
  );
}
