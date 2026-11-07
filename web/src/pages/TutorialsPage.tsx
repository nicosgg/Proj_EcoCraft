import { useEffect, useState } from 'react';
import { Leaf, Recycle, Scale, Search, SearchX, Timer, X } from 'lucide-react';
import { tutorialApi, metaApi } from '../api/endpoints';
import { getErrorMessage } from '../api/axiosClient';
import type { MaterialKey, Stats, Tutorial } from '../types/data_type';
import { MATERIALS, MATERIAL_KEYS, fmt, fmt1 } from '../utils/format';
import TutorialCard from '../components/TutorialCard';
import { EmptyState, ErrorState, Loading } from '../components/StateViews';

export default function TutorialsPage() {
  // Data dari API dengan pola Data-Loading-Error
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  // Filter pencarian majemuk: bahan + durasi + kata kunci
  const [material, setMaterial] = useState<MaterialKey | ''>('');
  const [quick, setQuick] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Tunda pencarian 300 ms agar tidak memanggil API di setiap ketukan
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  // GET /api/tutorials setiap filter berubah
  useEffect(() => {
    let active = true;
    const getTutorials = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const data = await tutorialApi.list({
          material: material || undefined,
          q: debouncedQuery || undefined,
          maxDuration: quick ? 5 : undefined,
        });
        if (active) setTutorials(data);
      } catch (error) {
        if (active) setErrorMsg(getErrorMessage(error, 'Gagal mengambil data tutorial.'));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    getTutorials();
    return () => { active = false; };
  }, [material, debouncedQuery, quick, reloadKey]);

  // GET /api/stats sekali saat halaman dibuka (tidak wajib berhasil)
  useEffect(() => {
    metaApi.stats().then(setStats).catch(() => setStats(null));
  }, []);

  const filtering = !!material || quick || !!debouncedQuery;
  const resetFilters = () => { setMaterial(''); setQuick(false); setQuery(''); };

  return (
    <main className="container page">
      <section className="hero">
        <div>
          <p className="eyebrow">Jelajah ide upcycling</p>
          <h1>Mau mengolah apa hari ini?</h1>
          <p className="muted">Pilih bahan bekas yang kamu punya, ikuti langkahnya, lalu unggah hasil karyamu ke komunitas.</p>
        </div>
        {stats && (
          <div className="hero-stats" aria-label="Dampak komunitas">
            <div><Recycle size={18} /><strong>{fmt(stats.actions.verified)}</strong><span>aksi terverifikasi</span></div>
            <div><Scale size={18} /><strong>{fmt1(stats.totalWeightKg)} kg</strong><span>limbah diolah</span></div>
            <div><Leaf size={18} /><strong>{fmt1(stats.totalCo2Kg)} kg</strong><span>CO₂e dicegah</span></div>
          </div>
        )}
      </section>

      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <span className="sr-only">Cari tutorial</span>
          <input type="search" placeholder="Cari ide, bahan, atau kreator" value={query} onChange={(e) => setQuery(e.target.value)} />
          {query && <button type="button" className="icon-btn sm" onClick={() => setQuery('')} aria-label="Hapus kata kunci"><X size={16} /></button>}
        </label>
        <button type="button" className="chip" aria-pressed={quick} onClick={() => setQuick((v) => !v)}><Timer size={15} />Maks. 5 menit</button>
      </div>

      <div className="chips" role="group" aria-label="Saring bahan">
        <button type="button" className="chip" aria-pressed={material === ''} onClick={() => setMaterial('')}>Semua bahan</button>
        {MATERIAL_KEYS.map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={material === k} onClick={() => setMaterial(material === k ? '' : k)}
            style={{ ['--c' as string]: MATERIALS[k].color }}>
            <span className="dot" />{MATERIALS[k].label}
          </button>
        ))}
      </div>

      <div className="section-head">
        <h2>{filtering ? 'Hasil pencarian' : 'Semua ide'}</h2>
        {!isLoading && !errorMsg && <span className="muted">{tutorials.length} tutorial</span>}
      </div>

      {isLoading && <Loading text="Memuat tutorial..." />}
      {!isLoading && errorMsg && <ErrorState message={errorMsg} onRetry={() => setReloadKey((k) => k + 1)} />}
      {!isLoading && !errorMsg && tutorials.length === 0 && (
        <EmptyState icon={<SearchX size={30} />} title="Belum ada ide yang cocok" text="Coba kata kunci lain atau hapus sebagian filter."
          action={<button type="button" className="btn btn-secondary btn-sm" onClick={resetFilters}>Hapus filter</button>} />
      )}
      {!isLoading && !errorMsg && tutorials.length > 0 && (
        <div className="grid grid-tutorials">
          {tutorials.map((t) => <TutorialCard key={t.id} tutorial={t} />)}
        </div>
      )}
    </main>
  );
}
