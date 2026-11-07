import { Link } from 'react-router-dom';
import { BadgeCheck, Ban, BookOpen, Leaf, Pencil, Scale, Sprout, Trash2 } from 'lucide-react';
import type { Action } from '../types/data_type';
import { useAuth } from '../context/AuthContext';
import { fmt1, initials, timeAgo } from '../utils/format';
import { MaterialBadge, StatusBadge } from './Badges';
import SmartImage from './SmartImage';

interface Props {
  action: Action;
  busy?: boolean;
  onKudos?: (action: Action) => void;
  onDelete?: (action: Action) => void;
  onModerate?: (action: Action, status: 'verified' | 'rejected') => void;
}

/** Kartu aksi komunitas: bukti foto, status verifikasi, dan tombol Eco-Kudos. */
export default function ActionCard({ action, busy = false, onKudos, onDelete, onModerate }: Props) {
  const { user, isAdmin } = useAuth();
  const isOwner = user?.id === action.user.id;
  const progress = Math.min(action.kudosCount, action.kudosNeeded);

  return (
    <article className="card action-card" id={`aksi-${action.id}`}>
      <header className="action-head">
        <span className="avatar">{initials(action.user.name)}</span>
        <div className="who">
          <strong>{action.user.name}{isOwner && <em> (kamu)</em>}</strong>
          <span>{timeAgo(action.createdAt)}</span>
        </div>
        <StatusBadge status={action.status} />
      </header>

      <div className="action-media">
        <SmartImage src={action.imageUrl} alt={`Bukti aksi: ${action.title}`} material={action.material} />
      </div>

      <div className="action-body">
        <p className="action-title">{action.title}</p>
        <div className="chips-row">
          <MaterialBadge material={action.material} />
          <span className="chip-info"><Scale size={14} />{fmt1(action.weightKg)} kg</span>
          <span className="chip-info"><Leaf size={14} />±{fmt1(action.co2Kg)} kg CO₂e</span>
          {action.tutorial && (
            <Link className="chip-info chip-link" to={`/tutorial/${action.tutorial.id}`}><BookOpen size={14} />{action.tutorial.title}</Link>
          )}
        </div>

        {action.status === 'pending' && (
          <div className="verify">
            <div className="verify-top"><strong>{progress} dari {action.kudosNeeded} Eco-Kudos</strong> untuk terverifikasi</div>
            <div className="bar"><span style={{ width: `${(progress / action.kudosNeeded) * 100}%` }} /></div>
            <p className="verify-note">+{action.coins} Eco-Coins cair ke pemilik setelah terverifikasi.</p>
          </div>
        )}
      </div>

      <footer className="action-foot">
        <button
          type="button"
          className={`kudos-btn${action.likedByMe ? ' on' : ''}`}
          onClick={() => onKudos?.(action)}
          disabled={busy || isOwner || action.status === 'rejected'}
          aria-pressed={action.likedByMe}
          title={isOwner ? 'Tidak bisa memberi kudos ke aksi sendiri' : action.likedByMe ? 'Batalkan Eco-Kudos' : 'Beri Eco-Kudos'}
        >
          <Sprout size={18} />{action.kudosCount}<span className="kudos-label">{action.likedByMe ? 'Kudos terkirim' : 'Beri kudos'}</span>
        </button>

        <div className="foot-actions">
          {isOwner && action.status === 'pending' && (
            <Link to={`/komunitas/${action.id}/ubah`} className="btn btn-ghost btn-sm"><Pencil size={15} />Ubah</Link>
          )}
          {isAdmin && action.status !== 'verified' && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onModerate?.(action, 'verified')}><BadgeCheck size={15} />Verifikasi</button>
          )}
          {isAdmin && action.status !== 'rejected' && (
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => onModerate?.(action, 'rejected')}><Ban size={15} />Tolak</button>
          )}
          {((isOwner && action.status === 'pending') || isAdmin) && (
            <button type="button" className="btn btn-ghost btn-sm danger" disabled={busy} onClick={() => onDelete?.(action)}><Trash2 size={15} />Hapus</button>
          )}
        </div>
      </footer>
    </article>
  );
}
