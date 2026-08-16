import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, useTheme } from '../store';

const LINKS = [
  { to: '/', label: 'Accueil' },
  { to: '/mushaf', label: 'Mushaf' },
  { to: '/halaqat', label: 'Halaqat' },
  { to: '/recitations', label: 'Récitations' },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          background: 'var(--primary-dark)',
          color: 'var(--on-deep)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <strong style={{ fontSize: 20 }}>Salifz</strong>

        <nav style={{ display: 'flex', gap: 6, flex: 1 }}>
          {LINKS.map((link) => {
            const active =
              pathname === link.to || (link.to !== '/' && pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? 'page' : undefined}
                style={{
                  color: 'var(--on-deep)',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: active ? 'rgba(255,255,255,0.22)' : 'transparent',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          className="btn-ghost"
          onClick={toggle}
          aria-label={theme === 'light' ? 'Passer en thème sombre' : 'Passer en thème clair'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <span style={{ opacity: 0.9 }}>{user?.displayName ?? user?.username}</span>
        <button className="btn-ghost" onClick={logout}>
          Déconnexion
        </button>
      </header>

      <main style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>{children}</main>
    </div>
  );
}
