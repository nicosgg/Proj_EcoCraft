// Menampilkan daftar endpoint langsung dari server (GET /api), sehingga dokumentasi selalu sesuai kode.
import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { metaApi } from '../api/endpoints';
import { getErrorMessage } from '../api/axiosClient';
import type { ApiIndex, EndpointDoc } from '../types/data_type';
import { MethodBadge } from '../components/Badges';
import { ErrorState, Loading } from '../components/StateViews';

const AUTH_LABEL: Record<EndpointDoc['auth'], string> = {
  publik: 'Publik', opsional: 'Token opsional', login: 'Wajib login', admin: 'Admin',
};

export default function ApiDocsPage() {
  const [index, setIndex] = useState<ApiIndex | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);

  useEffect(() => {
    setIsLoading(true);
    setErrorMsg(null);
    metaApi.index()
      .then(setIndex)
      .catch((e) => setErrorMsg(getErrorMessage(e, 'Gagal mengambil daftar endpoint.')))
      .finally(() => setIsLoading(false));
  }, [reloadKey]);

  if (isLoading) return <main className="container page"><Loading text="Mengambil daftar endpoint..." /></main>;
  if (errorMsg || !index) return <main className="container page"><ErrorState message={errorMsg || 'Tidak ada data.'} onRetry={() => setReloadKey((k) => k + 1)} /></main>;

  const groups = index.endpoints.reduce<Record<string, EndpointDoc[]>>((acc, e) => {
    (acc[e.group] ||= []).push(e);
    return acc;
  }, {});

  return (
    <main className="container page">
      <div className="page-head">
        <div>
          <h1>Endpoint REST API</h1>
          <p className="muted">Satu API untuk Web, Mobile, dan Desktop. Daftar ini diambil langsung dari <code>GET /api</code>.</p>
        </div>
        <a className="btn btn-secondary" href={`${index.baseUrl}/api`} target="_blank" rel="noreferrer"><ExternalLink size={16} />Lihat JSON</a>
      </div>

      <div className="card api-meta">
        <div><span className="muted small">Base URL</span><code>{index.baseUrl}</code></div>
        <div><span className="muted small">Autentikasi</span><span>{index.auth}</span></div>
        <div><span className="muted small">Format respons</span><span>Sukses <code>{index.responseFormat.success}</code>, error <code>{index.responseFormat.error}</code></span></div>
      </div>

      {Object.entries(groups).map(([group, items]) => (
        <section key={group} className="section">
          <h2>{group}</h2>
          <div className="card table-wrap">
            <table className="table api-table">
              <thead><tr><th>Method</th><th>Endpoint</th><th>Akses</th><th>Keterangan</th></tr></thead>
              <tbody>
                {items.map((e) => (
                  <tr key={`${e.method} ${e.path}`}>
                    <td><MethodBadge method={e.method} /></td>
                    <td><code>{e.path}</code></td>
                    <td><span className={`access access-${e.auth}`}>{AUTH_LABEL[e.auth]}</span></td>
                    <td>
                      {e.description}
                      {e.query && <div className="muted small">Query: <code>{e.query}</code></div>}
                      {e.body && <div className="muted small">Body: <code>{e.body}</code></div>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  );
}
