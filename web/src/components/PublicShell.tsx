/**
 * Coquille publique — en-tête et pied de page des écrans accessibles sans
 * compte : présentation, connexion, inscription, mot de passe oublié.
 *
 * Elle est distincte de la coquille du tableau de bord parce que les deux
 * répondent à des besoins opposés : ici on explique et on rassure, là on
 * navigue vite entre des outils. Partager un seul en-tête obligerait à le
 * remplir de conditions.
 */

import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Artwork';
import { useAuth, useTheme } from '../store';

const LIENS = [
  { to: '/#fonctionnalites', label: 'Fonctionnalités' },
  { to: '/#methode', label: 'Méthode' },
  { to: '/#tarifs', label: 'Tarifs' },
];

export default function PublicShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const user = useAuth((s) => s.user);
  const { pathname } = useLocation();
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'var(--text)' }}
          >
            <Logo size={34} />
            <strong style={{ fontSize: 19 }}>Salifz</strong>
          </Link>

          {/* Les ancres n'ont de sens que sur la page de présentation ; sur
              /login elles pointeraient vers des sections absentes. */}
          {pathname === '/' && (
            <nav
              aria-label="Sections"
              style={{ display: 'flex', gap: 4, marginInlineStart: 12 }}
              className="liens-publics"
            >
              {LIENS.map((l) => (
                <a
                  key={l.to}
                  href={l.to}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    color: 'var(--text-secondary)',
                    fontWeight: 500,
                  }}
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}

          <div style={{ flex: 1 }} />

          <button
            className="btn-ghost"
            onClick={toggle}
            aria-label={theme === 'light' ? 'Passer en thème sombre' : 'Passer en thème clair'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {user ? (
            <Link to="/accueil" className="btn-primary" style={{ textDecoration: 'none' }}>
              Ouvrir l’application
            </Link>
          ) : (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {pathname !== '/login' && (
                <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none' }}>
                  Connexion
                </Link>
              )}
              {pathname !== '/inscription' && (
                <Link to="/inscription" className="btn-primary" style={{ textDecoration: 'none' }}>
                  Commencer
                </Link>
              )}
            </div>
          )}

          <button
            className="btn-ghost menu-compact"
            aria-expanded={menuOuvert}
            aria-label="Menu"
            onClick={() => setMenuOuvert((v) => !v)}
            style={{ display: 'none' }}
          >
            ☰
          </button>
        </div>

        {menuOuvert && pathname === '/' && (
          <nav
            aria-label="Sections"
            style={{
              display: 'grid',
              padding: '4px 20px 12px',
              borderTop: '1px solid var(--divider)',
            }}
          >
            {LIENS.map((l) => (
              <a
                key={l.to}
                href={l.to}
                onClick={() => setMenuOuvert(false)}
                style={{ padding: '10px 4px', textDecoration: 'none', color: 'var(--text-secondary)' }}
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <footer
        style={{
          background: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          marginTop: 48,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            padding: '32px 20px',
            display: 'grid',
            gap: 28,
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Logo size={30} />
              <strong>Salifz</strong>
            </div>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              Mémoriser le Coran, seul ou en halaqa, avec un suivi qui mesure
              vraiment ce que vous faites.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: 14, margin: '0 0 10px' }}>Produit</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <li><a href="/#fonctionnalites" style={lienPied}>Fonctionnalités</a></li>
              <li><a href="/#methode" style={lienPied}>Méthode</a></li>
              <li><a href="/#tarifs" style={lienPied}>Tarifs</a></li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: 14, margin: '0 0 10px' }}>Compte</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              <li><Link to="/login" style={lienPied}>Connexion</Link></li>
              <li><Link to="/inscription" style={lienPied}>Créer un compte</Link></li>
              <li><Link to="/mot-de-passe-oublie" style={lienPied}>Mot de passe oublié</Link></li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: 14, margin: '0 0 10px' }}>À propos</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {/* Ces documents existent à la racine du dépôt ; les lier ici
                  évite d'annoncer des pages qui n'ont pas été écrites. */}
              <li><a href="https://github.com/salistar/salifz" style={lienPied}>Code source</a></li>
              <li><Link to="/confidentialite" style={lienPied}>Confidentialité</Link></li>
            </ul>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--divider)',
            padding: '16px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Salifz — les textes coraniques proviennent de quran.com et de
          islamic.network.
        </div>
      </footer>

      <style>{`
        @media (max-width: 720px) {
          .liens-publics { display: none !important; }
          .menu-compact { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}

const lienPied = {
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: 14,
} as const;
