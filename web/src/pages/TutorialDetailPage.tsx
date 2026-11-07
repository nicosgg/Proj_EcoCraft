import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Clock, Gauge, Leaf, Users } from 'lucide-react';
import { actionApi, tutorialApi } from '../api/endpoints';
import { getErrorMessage } from '../api/axiosClient';
import type { Action, Tutorial } from '../types/data_type';
import { fmt1 } from '../utils/format';
import { MaterialBadge, StatusBadge } from '../components/Badges';
import SmartImage from '../components/SmartImage';
import { EmptyState, ErrorState, Loading } from '../components/StateViews';

export default function TutorialDetailPage() {
  const { id } = useParams();
  const tutorialId = Number(id);

  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [makers, setMakers] = useState<Action[]>([]);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        // GET /api/tutorials/:id dan GET /api/actions?tutorialId=:id berjalan bersamaan
        const [t, a] = await Promise.all([tutorialApi.get(tutorialId), actionApi.list({ tutorialId })]);
        if (!active) return;
        setTutorial(t);
        setMakers(a);
      } catch (error) {
        if (active) setErrorMsg(getErrorMessage(error, 'Gagal mengambil detail tutorial.'));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [tutorialId, reloadKey]);

  if (isLoading) return <main className="container page"><Loading text="Memuat tutorial..." /></main>;
  if (errorMsg || !tutorial) {
    return (
      <main className="container page">
        <Link to="/" className="back-link"><ArrowLeft size={17} />Kembali ke Jelajah</Link>
        <ErrorState message={errorMsg || 'Tutorial tidak ditemukan.'} onRetry={() => setReloadKey((k) => k + 1)} />
      </main>
    );
  }

  return (
    <main className="container page">
      <Link to="/" className="back-link"><ArrowLeft size={17} />Kembali ke Jelajah</Link>

      <div className="detail">
        <div className="detail-media card">
          <SmartImage src={tutorial.imageUrl} alt={tutorial.title} material={tutorial.material} />
        </div>

        <div className="detail-info">
          <MaterialBadge material={tutorial.material} />
          <h1>{tutorial.title}</h1>
          {tutorial.description && <p className="lede">{tutorial.description}</p>}
          {tutorial.author && <p className="muted">Tutorial oleh <strong>{tutorial.author.name}</strong></p>}

          <dl className="facts">
            <div><dt><Clock size={15} />Waktu</dt><dd>{tutorial.durationMinutes} menit</dd></div>
            <div><dt><Gauge size={15} />Kesulitan</dt><dd>{tutorial.difficulty}</dd></div>
            <div><dt><Leaf size={15} />CO₂e dicegah</dt><dd>±{fmt1(tutorial.co2SavedKg)} kg</dd></div>
          </dl>

          <Link to={`/komunitas/baru?tutorial=${tutorial.id}`} className="btn btn-primary">
            <Camera size={18} />Unggah hasil karya <span className="xp-light">+{tutorial.xpReward} XP</span>
          </Link>
        </div>
      </div>

      <section className="section">
        <h2>Langkah pengerjaan</h2>
        <ol className="steps">
          {(tutorial.steps ?? []).map((s) => (
            <li key={s.id} className="card step">
              <span className="step-num">{s.stepOrder}</span>
              <div>
                <p>{s.description}</p>
                {s.imageUrl && <SmartImage src={s.imageUrl} alt={`Langkah ${s.stepOrder}`} className="step-img" />}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="section">
        <h2>Hasil karya komunitas</h2>
        {makers.length === 0 ? (
          <EmptyState icon={<Users size={28} />} title="Belum ada hasil karya" text="Jadilah yang pertama mengunggah hasil dari tutorial ini." />
        ) : (
          <div className="grid grid-makers">
            {makers.map((a) => (
              <Link key={a.id} to={`/komunitas#aksi-${a.id}`} className="card maker">
                <SmartImage src={a.imageUrl} alt={a.title} material={a.material} />
                <div className="maker-body">
                  <strong>{a.user.name}</strong>
                  <StatusBadge status={a.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
