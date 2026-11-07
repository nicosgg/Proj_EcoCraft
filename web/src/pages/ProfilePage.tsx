import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Copy, Gift, History, Hourglass, Leaf, Recycle, Scale, Ticket } from 'lucide-react';
import { authApi, rewardApi } from '../api/endpoints';
import { getErrorMessage } from '../api/axiosClient';
import type { Action, Me, Redemption, RedeemResult, Reward } from '../types/data_type';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fmt, fmt1, formatDate, initials, timeAgo } from '../utils/format';
import { MaterialBadge, StatusBadge } from '../components/Badges';
import SmartImage from '../components/SmartImage';
import { ConfirmDialog, Modal } from '../components/Modal';
import { EmptyState, ErrorState, Loading } from '../components/StateViews';

type Tab = 'aksi' | 'reward' | 'riwayat';

export default function ProfilePage() {
  const { refreshUser } = useAuth();
  const toast = useToast();

  const [me, setMe] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('aksi');

  const [myActions, setMyActions] = useState<Action[] | null>(null);
  const [rewards, setRewards] = useState<Reward[] | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[] | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);
  const [tabReload, setTabReload] = useState<number>(0);

  const [toRedeem, setToRedeem] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState<boolean>(false);
  const [result, setResult] = useState<RedeemResult | null>(null);

  // GET /api/me
  const loadMe = useCallback(async () => {
    setErrorMsg(null);
    try {
      setMe(await authApi.me());
    } catch (error) {
      setErrorMsg(getErrorMessage(error, 'Gagal mengambil profil.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  // Data per tab diambil saat tab dibuka: GET /api/me/actions, /api/rewards, /api/me/redemptions
  useEffect(() => {
    let active = true;
    setTabError(null);
    const run = async () => {
      try {
        if (tab === 'aksi') { const d = await authApi.myActions(); if (active) setMyActions(d); }
        if (tab === 'reward') { const d = await rewardApi.list(); if (active) setRewards(d); }
        if (tab === 'riwayat') { const d = await authApi.myRedemptions(); if (active) setRedemptions(d); }
      } catch (error) {
        if (active) setTabError(getErrorMessage(error));
      }
    };
    run();
    return () => { active = false; };
  }, [tab, tabReload]);

  // POST /api/rewards/:id/redeem
  const confirmRedeem = async () => {
    if (!toRedeem) return;
    setIsRedeeming(true);
    try {
      const res = await rewardApi.redeem(toRedeem.id);
      setResult(res);
      setRewards((list) => list && list.map((r) => (r.id === toRedeem.id ? { ...r, stock: r.stock - 1 } : r)));
      setRedemptions(null);
      await Promise.all([loadMe(), refreshUser()]);
    } catch (error) {
      toast(getErrorMessage(error), 'err');
    } finally {
      setIsRedeeming(false);
      setToRedeem(null);
    }
  };

  const copyCode = async (code: string) => {
    try { await navigator.clipboard.writeText(code); toast('Kode voucher disalin.'); } catch { toast(`Kode voucher: ${code}`); }
  };

  if (isLoading) return <main className="container page"><Loading text="Memuat profil..." /></main>;
  if (errorMsg || !me) return <main className="container page"><ErrorState message={errorMsg || 'Profil tidak ditemukan.'} onRetry={loadMe} /></main>;

  const xpInLevel = me.xp % me.xpPerLevel;

  return (
    <main className="container page">
      <section className="profile-head">
        <span className="avatar xl">{initials(me.name)}</span>
        <div className="profile-id">
          <h1>{me.name} {me.role === 'admin' && <span className="badge badge-dark">Admin</span>}</h1>
          <p className="muted">{me.email}</p>
          <div className="level">
            <span>Level {me.level}</span>
            <div className="bar"><span style={{ width: `${(xpInLevel / me.xpPerLevel) * 100}%` }} /></div>
            <span className="muted small">{fmt(me.xp)} XP, {fmt(me.xpPerLevel - xpInLevel)} XP lagi</span>
          </div>
        </div>
      </section>

      <section className="profile-grid">
        <div className="card coin-card">
          <span className="coin-label"><Coins size={16} />Eco-Coins</span>
          <strong className="amount">{fmt(me.coins)}</strong>
          <span className="coin-sub">{me.stats.pendingCoins ? <><Hourglass size={13} />+{fmt(me.stats.pendingCoins)} menunggu verifikasi</> : 'Tidak ada koin tertunda'}</span>
          <button type="button" className="btn btn-dark btn-sm" onClick={() => setTab('reward')}><Gift size={16} />Tukar koin</button>
        </div>
        <div className="card stats">
          <div><Recycle size={18} /><strong>{me.stats.verifiedActions}</strong><span>aksi terverifikasi</span></div>
          <div><Hourglass size={18} /><strong>{me.stats.pendingActions}</strong><span>menunggu</span></div>
          <div><Scale size={18} /><strong>{fmt1(me.stats.totalWeightKg)} kg</strong><span>limbah diolah</span></div>
          <div><Leaf size={18} /><strong>{fmt1(me.stats.totalCo2Kg)} kg</strong><span>CO₂e dicegah</span></div>
        </div>
      </section>

      <div className="seg seg-wide" role="tablist" aria-label="Bagian profil">
        <button type="button" role="tab" aria-selected={tab === 'aksi'} onClick={() => setTab('aksi')}><Recycle size={16} />Aksiku</button>
        <button type="button" role="tab" aria-selected={tab === 'reward'} onClick={() => setTab('reward')}><Gift size={16} />Tukar reward</button>
        <button type="button" role="tab" aria-selected={tab === 'riwayat'} onClick={() => setTab('riwayat')}><History size={16} />Riwayat penukaran</button>
      </div>

      {tabError && <ErrorState message={tabError} onRetry={() => setTabReload((k) => k + 1)} />}

      {!tabError && tab === 'aksi' && (myActions === null ? <Loading /> : myActions.length === 0 ? (
        <EmptyState icon={<Recycle size={28} />} title="Belum ada aksi" text="Unggah hasil karya pertamamu untuk mulai mengumpulkan Eco-Coins."
          action={<Link to="/komunitas/baru" className="btn btn-primary btn-sm">Unggah aksi</Link>} />
      ) : (
        <div className="list">
          {myActions.map((a) => (
            <Link key={a.id} to={`/komunitas#aksi-${a.id}`} className="card list-row">
              <SmartImage src={a.imageUrl} alt={a.title} material={a.material} className="thumb" />
              <div className="list-main">
                <strong>{a.title}</strong>
                <div className="chips-row"><MaterialBadge material={a.material} /><span className="muted small">{fmt1(a.weightKg)} kg · {timeAgo(a.createdAt)}</span></div>
              </div>
              <div className="list-end">
                <StatusBadge status={a.status} />
                <span className={`amt ${a.status}`}>+{a.coins}</span>
              </div>
            </Link>
          ))}
        </div>
      ))}

      {!tabError && tab === 'reward' && (rewards === null ? <Loading /> : (
        <div className="grid grid-rewards">
          {rewards.map((r) => {
            const short = me.coins < r.costCoins;
            return (
              <article key={r.id} className="card reward">
                <span className="reward-ico"><Ticket size={20} /></span>
                <div className="reward-info">
                  <strong>{r.name}</strong>
                  <span className="muted small">{r.partner}{r.stock ? ` · stok ${r.stock}` : ' · stok habis'}</span>
                  <span className="cost"><Coins size={14} />{fmt(r.costCoins)}</span>
                </div>
                <button type="button" className="btn btn-secondary btn-sm" disabled={short || r.stock === 0} onClick={() => setToRedeem(r)}
                  title={short ? `Kurang ${fmt(r.costCoins - me.coins)} koin` : undefined}>
                  {r.stock === 0 ? 'Habis' : short ? `Kurang ${fmt(r.costCoins - me.coins)}` : 'Tukar'}
                </button>
              </article>
            );
          })}
        </div>
      ))}

      {!tabError && tab === 'riwayat' && (redemptions === null ? <Loading /> : redemptions.length === 0 ? (
        <EmptyState icon={<History size={28} />} title="Belum ada penukaran" />
      ) : (
        <div className="list">
          {redemptions.map((r) => (
            <div key={r.id} className="card list-row">
              <span className="reward-ico"><Ticket size={18} /></span>
              <div className="list-main">
                <strong>{r.reward.name}</strong>
                <span className="muted small">{formatDate(r.createdAt)}</span>
              </div>
              <div className="list-end">
                <button type="button" className="code" onClick={() => copyCode(r.voucherCode)} title="Salin kode"><Copy size={14} />{r.voucherCode}</button>
                <span className="amt out">−{fmt(r.costCoins)}</span>
              </div>
            </div>
          ))}
        </div>
      ))}

      {toRedeem && (
        <ConfirmDialog title="Tukar Eco-Coins?" busy={isRedeeming} confirmLabel={`Tukar ${fmt(toRedeem.costCoins)} koin`}
          text={<>Kamu akan menukar <strong>{fmt(toRedeem.costCoins)} Eco-Coins</strong> dengan <strong>{toRedeem.name}</strong>. Sisa saldo: {fmt(me.coins - toRedeem.costCoins)}.</>}
          onConfirm={confirmRedeem} onClose={() => setToRedeem(null)} />
      )}
      {result && (
        <Modal title="Penukaran berhasil" onClose={() => setResult(null)} width={420}>
          <div className="modal-body center">
            <p>{result.redemption.reward.name}</p>
            <button type="button" className="code big" onClick={() => copyCode(result.redemption.voucherCode)}><Copy size={16} />{result.redemption.voucherCode}</button>
            <p className="muted small">Saldo sekarang {fmt(result.balance)} Eco-Coins. Kode juga tersimpan di Riwayat penukaran.</p>
          </div>
          <div className="modal-foot"><button type="button" className="btn btn-primary" onClick={() => setResult(null)}>Selesai</button></div>
        </Modal>
      )}
    </main>
  );
}
