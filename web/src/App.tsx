/**
 * Salifz web — routage et coquille.
 *
 * Les fonctionnalités reprennent celles de l'application mobile et parlent au
 * même backend : Mushaf avec masquage progressif, traduction mot à mot,
 * halaqat avec discussion temps réel et appels de groupe, validation des
 * récitations par l'enseignant.
 */

import { useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store';
import Shell from './components/Shell';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import MushafPage from './pages/MushafPage';
import WordByWordPage from './pages/WordByWordPage';
import HalaqatPage from './pages/HalaqatPage';
import HalaqaRoomPage from './pages/HalaqaRoomPage';
import RecitationsPage from './pages/RecitationsPage';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Chargement…</div>;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  const restore = useAuth((s) => s.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <Protected>
              <Shell>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/mushaf" element={<MushafPage />} />
                  <Route path="/mot-a-mot/:surah/:ayah" element={<WordByWordPage />} />
                  <Route path="/halaqat" element={<HalaqatPage />} />
                  <Route path="/halaqa/:id" element={<HalaqaRoomPage />} />
                  <Route path="/recitations" element={<RecitationsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Shell>
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
