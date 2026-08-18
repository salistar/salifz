/**
 * Salifz web — routage.
 *
 * Deux territoires, deux coquilles :
 *   - le public (présentation, connexion, inscription) porte un en-tête qui
 *     explique et un pied de page complet ;
 *   - le tableau de bord porte un en-tête d'état, une barre latérale groupée
 *     et un pied de page bref.
 *
 * Les fonctionnalités reprennent celles de l'application mobile et parlent au
 * même backend : un seul compte, une seule base.
 */

import { useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './store';
import Shell from './components/Shell';
import PublicShell from './components/PublicShell';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PrivacyPage from './pages/PrivacyPage';

import HomePage from './pages/HomePage';
import MushafPage from './pages/MushafPage';
import WordByWordPage from './pages/WordByWordPage';
import HalaqatPage from './pages/HalaqatPage';
import HalaqaRoomPage from './pages/HalaqaRoomPage';
import RecitationsPage from './pages/RecitationsPage';
import LessonsPage from './pages/LessonsPage';
import ReviewPage from './pages/ReviewPage';
import DailyVersePage from './pages/DailyVersePage';
import KhatamPage from './pages/KhatamPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ChallengesPage from './pages/ChallengesPage';
import StreakPage from './pages/StreakPage';
import StatsPage from './pages/StatsPage';
import ShopPage from './pages/ShopPage';
import FriendsPage from './pages/FriendsPage';
import NotificationsPage from './pages/NotificationsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import ProfilePage from './pages/ProfilePage';
import PrayerPage from './pages/PrayerPage';
import SettingsPage from './pages/SettingsPage';

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 40 }}>Chargement…</div>;

  // On mémorise la destination : après connexion, l'utilisateur revient là où
  // il allait plutôt que sur un accueil générique.
  return user ? <>{children}</> : <Navigate to="/login" replace state={{ depuis: location.pathname }} />;
}

/** La page de présentation n'a d'intérêt que pour un visiteur : quelqu'un de
 *  déjà connecté est envoyé directement dans l'application. */
function Landing() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Chargement…</div>;
  if (user) return <Navigate to="/accueil" replace />;
  return (
    <PublicShell>
      <LandingPage />
    </PublicShell>
  );
}

export default function App() {
  const restore = useAuth((s) => s.restore);

  useEffect(() => {
    restore();
  }, [restore]);

  return (
    <BrowserRouter>
      <Routes>
        {/* --- Public ---------------------------------------------------- */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicShell><LoginPage /></PublicShell>} />
        <Route path="/inscription" element={<PublicShell><RegisterPage /></PublicShell>} />
        <Route path="/mot-de-passe-oublie" element={<PublicShell><ForgotPasswordPage /></PublicShell>} />
        <Route path="/confidentialite" element={<PublicShell><PrivacyPage /></PublicShell>} />

        {/* --- Tableau de bord ------------------------------------------- */}
        <Route
          path="/*"
          element={
            <Protected>
              <Shell>
                <Routes>
                  <Route path="/accueil" element={<HomePage />} />

                  <Route path="/lecons" element={<LessonsPage />} />
                  <Route path="/revision" element={<ReviewPage />} />
                  <Route path="/mushaf" element={<MushafPage />} />
                  <Route path="/verset-du-jour" element={<DailyVersePage />} />
                  <Route path="/mot-a-mot/:surah/:ayah" element={<WordByWordPage />} />

                  <Route path="/halaqat" element={<HalaqatPage />} />
                  <Route path="/halaqa/:id" element={<HalaqaRoomPage />} />
                  <Route path="/khatam" element={<KhatamPage />} />
                  <Route path="/amis" element={<FriendsPage />} />
                  <Route path="/recitations" element={<RecitationsPage />} />

                  <Route path="/classement" element={<LeaderboardPage />} />
                  <Route path="/defis" element={<ChallengesPage />} />
                  <Route path="/serie" element={<StreakPage />} />
                  <Route path="/statistiques" element={<StatsPage />} />
                  <Route path="/boutique" element={<ShopPage />} />

                  <Route path="/priere" element={<PrayerPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/abonnement" element={<SubscriptionPage />} />
                  <Route path="/profil" element={<ProfilePage />} />
                  <Route path="/reglages" element={<SettingsPage />} />

                  <Route path="*" element={<Navigate to="/accueil" replace />} />
                </Routes>
              </Shell>
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
