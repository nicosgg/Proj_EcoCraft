import { Link, Outlet, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { EmptyState } from './components/StateViews';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TutorialsPage from './pages/TutorialsPage';
import TutorialDetailPage from './pages/TutorialDetailPage';
import CommunityPage from './pages/CommunityPage';
import ActionFormPage from './pages/ActionFormPage';
import DropPointsPage from './pages/DropPointsPage';
import ProfilePage from './pages/ProfilePage';
import AdminTutorialsPage from './pages/AdminTutorialsPage';
import TutorialFormPage from './pages/TutorialFormPage';
import ApiDocsPage from './pages/ApiDocsPage';
import { API_BASE_URL } from './api/axiosClient';

function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <footer className="footer">
        <div className="container">EcoCraft Web Client · terhubung ke API <code>{API_BASE_URL}</code></div>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Publik */}
        <Route path="/" element={<TutorialsPage />} />
        <Route path="/tutorial/:id" element={<TutorialDetailPage />} />
        <Route path="/komunitas" element={<CommunityPage />} />
        <Route path="/titik-setor" element={<DropPointsPage />} />
        <Route path="/api-docs" element={<ApiDocsPage />} />
        <Route path="/masuk" element={<LoginPage />} />
        <Route path="/daftar" element={<RegisterPage />} />

        {/* Wajib login */}
        <Route path="/komunitas/baru" element={<ProtectedRoute><ActionFormPage /></ProtectedRoute>} />
        <Route path="/komunitas/:id/ubah" element={<ProtectedRoute><ActionFormPage /></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Khusus admin */}
        <Route path="/admin/tutorial" element={<ProtectedRoute adminOnly><AdminTutorialsPage /></ProtectedRoute>} />
        <Route path="/admin/tutorial/baru" element={<ProtectedRoute adminOnly><TutorialFormPage /></ProtectedRoute>} />
        <Route path="/admin/tutorial/:id/ubah" element={<ProtectedRoute adminOnly><TutorialFormPage /></ProtectedRoute>} />

        <Route path="*" element={(
          <main className="container page">
            <EmptyState title="Halaman tidak ditemukan" action={<Link to="/" className="btn btn-primary btn-sm">Ke beranda</Link>} />
          </main>
        )} />
      </Route>
    </Routes>
  );
}
