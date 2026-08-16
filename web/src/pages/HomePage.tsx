import { Link } from 'react-router-dom';
import { useAuth } from '../store';

const SHORTCUTS = [
  { to: '/mushaf', title: 'Mushaf', desc: '604 pages, avec masquage progressif', icon: '📗' },
  { to: '/halaqat', title: 'Halaqat', desc: 'Discussion et appels de groupe', icon: '🕌' },
  { to: '/recitations', title: 'Récitations', desc: 'Soumettre ou valider un passage', icon: '🎙️' },
];

export default function HomePage() {
  const user = useAuth((s) => s.user);
  const g = user?.gamification ?? {};

  const stats = [
    { label: 'Niveau', value: g.level ?? 1 },
    { label: 'XP', value: g.totalXP ?? 0 },
    { label: 'Gemmes', value: g.gems ?? 0 },
    { label: 'Série', value: g.currentStreak ?? 0 },
    { label: 'Versets mémorisés', value: user?.quranProgress?.totalVersesMemorized ?? 0 },
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section
        className="card"
        style={{ background: 'var(--primary-dark)', color: 'var(--on-deep)', border: 'none' }}
      >
        <h1 style={{ margin: '0 0 4px' }}>
          Assalamu alaykum, {user?.displayName ?? user?.username}
        </h1>
        <p style={{ margin: 0, opacity: 0.9 }}>
          Les mêmes données que sur le téléphone — un seul compte, un seul serveur.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 12,
        }}
      >
        {stats.map((s) => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)' }}>{s.value}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{s.label}</div>
          </div>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
        }}
      >
        {SHORTCUTS.map((s) => (
          <Link key={s.to} to={s.to} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ height: '100%' }}>
              <div style={{ fontSize: 32 }}>{s.icon}</div>
              <h3 style={{ margin: '8px 0 4px' }}>{s.title}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{s.desc}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
