/**
 * Coquille du tableau de bord — Salifz
 *
 * Ce qui change par rapport à la version précédente, et pourquoi :
 *
 * **Le bandeau vert plein disparaît.** Il occupait toute la largeur en aplat
 * criard, écrasait la page et n'évoquait rien du sujet. L'en-tête devient une
 * surface élevée discrète, tenue par un filet d'or : la couleur ne sert plus
 * de décor, elle redevient un signal.
 *
 * **Les emojis disparaissent.** Ils se rendaient différemment sur chaque
 * plateforme et ne disaient rien à un lecteur d'écran — « livre vert fermé »
 * n'aide personne à comprendre qu'il s'agit du mushaf.
 *
 * **Le contenu est contraint.** Le débordement horizontal constaté venait de
 * l'absence de largeur maximale.
 */

import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, useTheme } from '../store';
import SelecteurLangue from './SelecteurLangue';
import { HizbStar } from './Ornements';
import {
  iconesNavigation,
  IconeSerie,
  IconeGemmes,
  IconeCoeurs,
} from './Icones';

interface Entree {
  to: string;
  /** Clé i18n dans le namespace `nav`, jamais le libellé en dur. */
  cle: string;
}

const GROUPES: { titre: string; entrees: Entree[] }[] = [
  {
    titre: 'navLearn',
    entrees: [
      { to: '/accueil', cle: 'home' },
      { to: '/lecons', cle: 'lessons' },
      { to: '/revision', cle: 'review' },
      { to: '/mushaf', cle: 'mushaf' },
      { to: '/verset-du-jour', cle: 'daily' },
    ],
  },
  {
    titre: 'navCommunity',
    entrees: [
      { to: '/halaqat', cle: 'halaqat' },
      { to: '/khatam', cle: 'khatam' },
      { to: '/amis', cle: 'friends' },
      { to: '/recitations', cle: 'recitations' },
    ],
  },
  {
    titre: 'navProgress',
    entrees: [
      { to: '/classement', cle: 'leaderboard' },
      { to: '/defis', cle: 'challenges' },
      { to: '/serie', cle: 'streak' },
      { to: '/statistiques', cle: 'stats' },
      { to: '/boutique', cle: 'shop' },
    ],
  },
  {
    titre: 'navAccount',
    entrees: [
      { to: '/priere', cle: 'prayer' },
      { to: '/notifications', cle: 'notifications' },
      { to: '/abonnement', cle: 'subscription' },
      { to: '/profil', cle: 'profile' },
      { to: '/reglages', cle: 'settings' },
    ],
  },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const { t } = useTranslation(['common', 'nav']);
  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  useEffect(() => setTiroirOuvert(false), [pathname]);

  const g: any = user?.gamification ?? {};

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      <a href="#contenu" className="saut-contenu">{t('skipToContent')}</a>

      {/* --- En-tête : surface élevée, filet d'or, plus d'aplat vert -------- */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          background: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-gold)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          height: 56,
        }}
      >
        <button
          className="bascule-tiroir btn-ghost"
          onClick={() => setTiroirOuvert((v) => !v)}
          aria-expanded={tiroirOuvert}
          aria-label={t('showNavigation')}
          style={{ display: 'none', padding: '6px 10px', minHeight: 36 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <Link
          to="/accueil"
          style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', textDecoration: 'none' }}
        >
          <HizbStar size={26} quarters={4} color="var(--accent)" />
          <strong style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.01em' }}>
            Salifz
          </strong>
        </Link>

        <div style={{ flex: 1 }} />

        {/* Les compteurs deviennent des pastilles discrètes. Chaque valeur a sa
            couleur de rôle : la série en safran, les gemmes en or, les cœurs en
            grenat — l'émeraude reste réservée à l'action. */}
        <div className="compteurs" style={{ display: 'flex', gap: 6 }}>
          <Compteur icone={<IconeSerie size={15} />} valeur={g.currentStreak ?? 0} titre={t('streak')} couleur="var(--warning)" />
          <Compteur icone={<IconeGemmes size={15} />} valeur={g.gems ?? 0} titre={t('gems')} couleur="var(--accent-text)" />
          <Compteur
            icone={<IconeCoeurs size={15} />}
            valeur={`${g.hearts?.current ?? 0}/${g.hearts?.max ?? 5}`}
            titre={t('hearts')}
            couleur="var(--danger)"
          />
        </div>

        <SelecteurLangue compact />

        <button
          className="btn-ghost"
          onClick={toggle}
          aria-label={theme === 'light' ? t('themeToDark') : t('themeToLight')}
          style={{ padding: '6px 10px', minHeight: 36 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            {theme === 'light' ? (
              <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
            ) : (
              <>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.4 5.6l-1.4 1.4M7 17l-1.4 1.4M18.4 18.4L17 17M7 7 5.6 5.6" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>

        <Link
          to="/profil"
          className="nom-compte"
          style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 14 }}
        >
          {user?.displayName ?? user?.username}
        </Link>

        <button className="btn-ghost" onClick={logout} style={{ padding: '6px 12px', minHeight: 36 }}>
          {t('signOut')}
        </button>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
        {tiroirOuvert && (
          <div
            onClick={() => setTiroirOuvert(false)}
            style={{ position: 'fixed', inset: 0, top: 56, background: 'var(--overlay)', zIndex: 18 }}
          />
        )}

        <aside
          className={tiroirOuvert ? 'barre-laterale ouverte' : 'barre-laterale'}
          aria-label="Navigation principale"
          style={{
            width: 248,
            flexShrink: 0,
            background: 'var(--bg-elevated)',
            // Propriété logique : la barre passe à droite en arabe sans
            // condition dans le code.
            borderInlineEnd: '1px solid var(--border)',
            padding: '16px 10px',
            overflowY: 'auto',
          }}
        >
          {GROUPES.map((groupe) => (
            <nav key={groupe.titre} style={{ marginBottom: 20 }}>
              <h2 className="overline" style={{ margin: '0 0 6px 12px' }}>{t(groupe.titre)}</h2>

              {groupe.entrees.map((e) => {
                const actif = pathname === e.to || (e.to !== '/accueil' && pathname.startsWith(e.to));
                const Icone = iconesNavigation[e.to as keyof typeof iconesNavigation];

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
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none',
                      fontWeight: actif ? 600 : 400,
                      color: actif ? 'var(--brand-hover)' : 'var(--text-muted)',
                      background: actif ? 'var(--surface-hover)' : 'transparent',
                      // Le filet d'or marque l'entrée active, du côté du début
                      // de ligne : il passe à droite en arabe.
                      borderInlineStart: actif ? '2px solid var(--accent)' : '2px solid transparent',
                    }}
                  >
                    {Icone && <Icone size={19} />}
                    {t(`nav:${e.cle}`)}
                  </Link>
                );
              })}
            </nav>
          ))}
        </aside>

        <main
          id="contenu"
          tabIndex={-1}
          style={{ flex: 1, minWidth: 0, padding: 32, overflowX: 'hidden' }}
        >
          <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>{children}</div>
        </main>
      </div>

      <footer
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
          padding: '14px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <span className="caption">Salifz</span>
        <div style={{ flex: 1 }} />
        <Link to="/confidentialite" className="caption" style={{ textDecoration: 'none' }}>{t('privacy')}</Link>
        <Link to="/reglages" className="caption" style={{ textDecoration: 'none' }}>{t('nav:settings')}</Link>
      </footer>

      <style>{`
        @media (max-width: 1024px) {
          .bascule-tiroir { display: inline-flex !important; }
          .barre-laterale {
            position: fixed; top: 56px; bottom: 0; inset-inline-start: 0;
            z-index: 19; transform: translateX(-105%); transition: transform 180ms var(--ease);
          }
          [dir='rtl'] .barre-laterale { transform: translateX(105%); }
          .barre-laterale.ouverte, [dir='rtl'] .barre-laterale.ouverte { transform: translateX(0); }
          main { padding: 20px !important; }
        }
        @media (max-width: 620px) {
          .compteurs, .nom-compte { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function Compteur({
  icone,
  valeur,
  titre,
  couleur,
}: {
  icone: ReactNode;
  valeur: number | string;
  titre: string;
  couleur: string;
}) {
  return (
    <span
      title={titre}
      // `aria-live` : la valeur change en cours de session (XP gagné, cœur
      // perdu) et le changement doit être annoncé sans voler le focus.
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-full, 999px)',
        padding: '5px 11px',
        color: couleur,
      }}
    >
      <span aria-hidden="true" style={{ display: 'flex' }}>{icone}</span>
      <span className="data" style={{ color: 'var(--text)', fontSize: 14 }} aria-label={titre}>
        {valeur}
      </span>
    </span>
  );
}
