/**
 * Coquille du tableau de bord — en-tête, barre latérale, pied de page.
 *
 * La navigation était auparavant une seule rangée de liens dans l'en-tête.
 * À onze entrées elle débordait déjà ; à dix-huit elle devenait illisible. Une
 * barre latérale groupée par thème permet de croître sans se réorganiser, et
 * laisse à l'en-tête ce qu'il fait bien : l'identité, l'état du compte et les
 * actions permanentes.
 *
 * Sur écran étroit la barre latérale devient un tiroir : la superposer au
 * contenu vaut mieux que de comprimer les deux.
 */

import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Artwork';
import { useAuth, useTheme } from '../store';

interface Entree {
  to: string;
  label: string;
  icone: string;
}

const GROUPES: { titre: string; entrees: Entree[] }[] = [
  {
    titre: 'Apprendre',
    entrees: [
      { to: '/accueil', label: 'Accueil', icone: '🏠' },
      { to: '/lecons', label: 'Leçons', icone: '📚' },
      { to: '/revision', label: 'Révision', icone: '🔄' },
      { to: '/mushaf', label: 'Mushaf', icone: '📗' },
      { to: '/verset-du-jour', label: 'Verset du jour', icone: '✨' },
    ],
  },
  {
    titre: 'Communauté',
    entrees: [
      { to: '/halaqat', label: 'Halaqat', icone: '🕌' },
      { to: '/khatam', label: 'Khatam', icone: '📖' },
      { to: '/amis', label: 'Amis', icone: '👥' },
      { to: '/recitations', label: 'Récitations', icone: '🎙️' },
    ],
  },
  {
    titre: 'Progression',
    entrees: [
      { to: '/classement', label: 'Classement', icone: '🏆' },
      { to: '/defis', label: 'Défis', icone: '🎯' },
      { to: '/serie', label: 'Série', icone: '🔥' },
      { to: '/statistiques', label: 'Statistiques', icone: '📊' },
      { to: '/boutique', label: 'Boutique', icone: '🛍️' },
    ],
  },
  {
    titre: 'Compte',
    entrees: [
      { to: '/priere', label: 'Prière & Qibla', icone: '🧭' },
      { to: '/notifications', label: 'Notifications', icone: '🔔' },
      { to: '/abonnement', label: 'Abonnement', icone: '💳' },
      { to: '/profil', label: 'Profil', icone: '👤' },
      { to: '/reglages', label: 'Réglages', icone: '⚙️' },
    ],
  },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  // Refermer le tiroir après navigation : le laisser ouvert masquerait la page
  // que l'on vient d'ouvrir.
  useEffect(() => setTiroirOuvert(false), [pathname]);

  const g: any = user?.gamification ?? {};

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'var(--primary-dark)',
          color: 'var(--on-deep)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
        }}
      >
        <button
          className="bascule-tiroir"
          onClick={() => setTiroirOuvert((v) => !v)}
          aria-expanded={tiroirOuvert}
          aria-label="Afficher la navigation"
          style={{ display: 'none', background: 'rgba(255,255,255,0.18)', color: 'inherit', padding: '8px 12px' }}
        >
          ☰
        </button>

        <Link
          to="/accueil"
          style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }}
        >
          <Logo size={32} />
          <strong style={{ fontSize: 18 }}>Salifz</strong>
        </Link>

        <div style={{ flex: 1 }} />

        {/* Les mêmes trois compteurs que le mobile affiche en permanence, pour
            que l'état du compte se lise sans changer d'écran. */}
        <div className="compteurs" style={{ display: 'flex', gap: 8 }}>
          <Compteur icone="🔥" valeur={g.currentStreak ?? 0} titre="Série" />
          <Compteur icone="💎" valeur={g.gems ?? 0} titre="Gemmes" />
          <Compteur icone="❤️" valeur={`${g.hearts?.current ?? 0}/${g.hearts?.max ?? 5}`} titre="Cœurs" />
        </div>

        <button
          onClick={toggle}
          aria-label={theme === 'light' ? 'Passer en thème sombre' : 'Passer en thème clair'}
          style={{ background: 'rgba(255,255,255,0.18)', color: 'inherit', padding: '8px 12px' }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <Link
          to="/profil"
          style={{ color: 'inherit', textDecoration: 'none', opacity: 0.92 }}
          className="nom-compte"
        >
          {user?.displayName ?? user?.username}
        </Link>

        <button
          onClick={logout}
          style={{ background: 'rgba(255,255,255,0.18)', color: 'inherit', padding: '8px 14px' }}
        >
          Quitter
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
        {/* Voile du tiroir : cliquer à côté referme, ce qu'on attend d'un
            panneau superposé. */}
        {tiroirOuvert && (
          <div
            onClick={() => setTiroirOuvert(false)}
            style={{ position: 'fixed', inset: 0, top: 56, background: 'rgba(0,0,0,0.45)', zIndex: 18 }}
          />
        )}

        <aside
          className={tiroirOuvert ? 'barre-laterale ouverte' : 'barre-laterale'}
          aria-label="Navigation principale"
          style={{
            width: 232,
            flexShrink: 0,
            background: 'var(--surface)',
            borderInlineEnd: '1px solid var(--border)',
            padding: '16px 10px',
            overflowY: 'auto',
          }}
        >
          {GROUPES.map((groupe) => (
            <nav key={groupe.titre} style={{ marginBottom: 18 }}>
              <h2
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  color: 'var(--text-muted)',
                  margin: '0 0 6px 12px',
                }}
              >
                {groupe.titre}
              </h2>

              {groupe.entrees.map((e) => {
                const actif = pathname === e.to || (e.to !== '/accueil' && pathname.startsWith(e.to));
                return (
                  <Link
                    key={e.to}
                    to={e.to}
                    aria-current={actif ? 'page' : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 8,
                      textDecoration: 'none',
                      fontWeight: actif ? 600 : 400,
                      color: actif ? 'var(--primary-dark)' : 'var(--text-secondary)',
                      background: actif ? 'var(--primary-soft)' : 'transparent',
                    }}
                  >
                    <span aria-hidden="true" style={{ width: 20, textAlign: 'center' }}>{e.icone}</span>
                    {e.label}
                  </Link>
                );
              })}
            </nav>
          ))}
        </aside>

        <main style={{ flex: 1, minWidth: 0, padding: 20 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>{children}</div>
        </main>
      </div>

      <footer
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: '14px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          color: 'var(--text-muted)',
          fontSize: 13,
        }}
      >
        <span>Salifz — instance locale</span>
        <div style={{ flex: 1 }} />
        <Link to="/confidentialite" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Confidentialité
        </Link>
        <Link to="/reglages" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          Réglages
        </Link>
        <a
          href="https://github.com/salistar/salifz"
          style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          Code source
        </a>
      </footer>

      <style>{`
        @media (max-width: 900px) {
          .bascule-tiroir { display: inline-flex !important; }
          .barre-laterale {
            position: fixed; top: 56px; bottom: 0; inset-inline-start: 0;
            z-index: 19; transform: translateX(-105%); transition: transform .18s ease;
          }
          .barre-laterale.ouverte { transform: translateX(0); }
        }
        @media (max-width: 620px) {
          .compteurs, .nom-compte { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Compteur({ icone, valeur, titre }: { icone: string; valeur: number | string; titre: string }) {
  return (
    <span
      title={titre}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'rgba(255,255,255,0.18)',
        borderRadius: 20,
        padding: '5px 11px',
        fontWeight: 600,
        fontSize: 14,
      }}
    >
      <span aria-hidden="true">{icone}</span>
      <span aria-label={titre}>{valeur}</span>
    </span>
  );
}
