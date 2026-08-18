/**
 * Classement et succès — version web.
 *
 * Deux onglets : la ligue en cours (avec le rang de l'utilisateur) et les
 * badges. Les couleurs des ligues sont volontairement fixes — inverser un
 * métal en thème sombre le rendrait méconnaissable.
 */

import { useState } from 'react';
import { leaguesAPI, badgesAPI } from '../services/api';
import { useResource, asList, unwrap, StateBlock } from '../components/useResource';
import { useAuth } from '../store';
import { label } from '../services/i18n';


const LEAGUE_COLORS: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
  master: '#9B59B6',
};

type Tab = 'league' | 'global' | 'badges';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>('league');
  const user = useAuth((s) => s.user);
  const myId = user?._id ?? user?.id;

  const league = useResource<any>(() => leaguesAPI.leaderboard(), []);
  const global = useResource<any>(() => leaguesAPI.global(), []);
  const badges = useResource<any>(() => badgesAPI.all(), []);

  const active = tab === 'badges' ? badges : tab === 'global' ? global : league;
  const rows = asList(active.data, 'leaderboard', 'users', 'badges', 'items');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Classement</h1>

      <div style={{ display: 'flex', gap: 8 }} role="tablist">
        {([
          ['league', 'Ma ligue'],
          ['global', 'Global'],
          ['badges', 'Succès'],
        ] as const).map(([key, tabLabel]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={tab === key ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setTab(key)}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      <StateBlock
        loading={active.loading}
        error={active.error}
        empty={!active.loading && rows.length === 0}
        emptyText={
          tab === 'badges'
            ? 'Aucun succès disponible pour l’instant.'
            : 'Le classement est encore vide — il se remplit avec l’activité.'
        }
        onRetry={active.reload}
      />

      {tab === 'badges' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {rows.map((b: any, i: number) => {
            const unlocked = b.unlocked ?? b.isUnlocked ?? false;
            return (
              <div
                key={b._id ?? b.id ?? i}
                className="card"
                style={{ textAlign: 'center', opacity: unlocked ? 1 : 0.5 }}
              >
                <div style={{ fontSize: 34 }}>{b.icon ?? '🏅'}</div>
                <strong style={{ display: 'block', marginTop: 6, fontSize: 14 }}>
                  {label(b.name ?? b.title) || 'Succès'}
                </strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  {label(b.description) || (unlocked ? 'Débloqué' : 'À débloquer')}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 6 }}>
          {rows.map((row: any, index: number) => {
            const id = row._id ?? row.userId ?? row.id;
            const isMe = myId && String(id) === String(myId);
            const leagueKey = String(row.league ?? '').toLowerCase();

            return (
              <div
                key={id ?? index}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: 12,
                  // Se repérer dans un classement long : sa propre ligne doit
                  // sauter aux yeux.
                  borderColor: isMe ? 'var(--primary)' : 'var(--border)',
                  background: isMe ? 'var(--primary-soft)' : 'var(--surface)',
                }}
              >
                <span style={{ width: 34, fontWeight: 700, color: 'var(--text-secondary)' }}>
                  {row.rank ?? index + 1}
                </span>

                <span style={{ flex: 1, fontWeight: isMe ? 700 : 400 }}>
                  {label(row.displayName ?? row.username) || 'Membre'}
                  {isMe && <span style={{ color: 'var(--primary-dark)' }}> — vous</span>}
                </span>

                {leagueKey && (
                  <span
                    style={{
                      width: 12, height: 12, borderRadius: 6,
                      background: LEAGUE_COLORS[leagueKey] ?? 'var(--text-muted)',
                    }}
                    title={leagueKey}
                    aria-label={`Ligue ${leagueKey}`}
                  />
                )}

                <strong style={{ color: 'var(--primary)' }}>
                  {row.weeklyXP ?? row.totalXP ?? row.xp ?? 0} XP
                </strong>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
