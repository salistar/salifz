/**
 * Profil, réglages et notifications — version web.
 *
 * Regroupés sur une page : sur un écran large, trois pages séparées pour
 * quelques réglages obligeraient à naviguer sans rien gagner.
 *
 * La suppression de compte et l'export des données sont ici parce qu'ils sont
 * exigés par le RGPD et par les deux magasins d'applications — et parce qu'un
 * parcours de suppression caché revient à ne pas en avoir.
 */

import { useState } from 'react';
import { settingsAPI, notificationsAPI, api } from '../services/api';
import { useResource, asList, unwrap, StateBlock } from '../components/useResource';
import { useAuth, useTheme } from '../store';

export default function ProfilePage() {
  const { user, logout, restore } = useAuth();
  const { theme, toggle } = useTheme();

  const settings = useResource<any>(() => settingsAPI.get(), []);
  const notifications = useResource<any>(() => notificationsAPI.list(), []);

  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState('');

  const g = user?.gamification ?? {};
  const notes = asList(notifications.data, 'notifications', 'items');
  const prefs = unwrap(settings.data)?.settings ?? unwrap(settings.data) ?? {};

  const updatePref = async (key: string, value: any) => {
    try {
      await settingsAPI.update({ [key]: value });
      settings.reload();
      setNotice('Réglage enregistré');
    } catch (e: any) {
      setNotice(e?.error ?? 'Enregistrement impossible');
    }
  };

  const exportData = async () => {
    try {
      const data: any = await api.get('/account/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'salifz-mes-donnees.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setNotice(e?.error ?? 'Export impossible');
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/account', { data: { password, confirm: 'SUPPRIMER' } });
      logout();
    } catch (e: any) {
      setNotice(e?.error ?? 'Suppression impossible');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <section className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 64, height: 64, borderRadius: 32,
            background: 'var(--primary)', color: 'var(--on-deep)',
            display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 700,
          }}
        >
          {(user?.displayName ?? user?.username ?? '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0 }}>{user?.displayName ?? user?.username}</h1>
          <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
        </div>
        <span className="card" style={{ padding: '6px 12px' }}>Niveau {g.level ?? 1}</span>
      </section>

      {notice && (
        <div className="card" role="status" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)' }}>
          {notice}
        </div>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        {[
          ['XP', g.totalXP ?? 0],
          ['Gemmes', g.gems ?? 0],
          ['Série', g.currentStreak ?? 0],
          ['Cœurs', `${g.hearts?.current ?? 0}/${g.hearts?.max ?? 5}`],
          ['Versets', user?.quranProgress?.totalVersesMemorized ?? 0],
        ].map(([label, value]) => (
          <div key={String(label)} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)' }}>{value}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</div>
          </div>
        ))}
      </section>

      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <strong>Réglages</strong>

        <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 1 }}>Thème sombre</span>
          <input type="checkbox" checked={theme === 'dark'} onChange={toggle} aria-label="Thème sombre" />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 1 }}>Rappel quotidien</span>
          <input
            type="checkbox"
            checked={Boolean(prefs.notificationsEnabled ?? true)}
            onChange={(e) => updatePref('notificationsEnabled', e.target.checked)}
            aria-label="Rappel quotidien"
          />
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ flex: 1 }}>Objectif quotidien (versets)</span>
          <input
            type="number" min={1} max={50} style={{ width: 90 }}
            defaultValue={prefs.dailyGoal ?? 5}
            onBlur={(e) => updatePref('dailyGoal', Number(e.target.value))}
            aria-label="Objectif quotidien en versets"
          />
        </label>
      </section>

      <section className="card" style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <strong style={{ flex: 1 }}>Notifications</strong>
          {notes.length > 0 && (
            <button
              className="btn-ghost"
              onClick={async () => {
                await notificationsAPI.markAllRead();
                notifications.reload();
              }}
            >
              Tout marquer comme lu
            </button>
          )}
        </div>

        <StateBlock
          loading={notifications.loading}
          error={notifications.error}
          empty={!notifications.loading && notes.length === 0}
          emptyText="Aucune notification."
          onRetry={notifications.reload}
        />

        {notes.slice(0, 12).map((n: any, i: number) => (
          <div
            key={n._id ?? i}
            style={{
              padding: '8px 10px', borderRadius: 8,
              background: n.read ? 'transparent' : 'var(--primary-soft)',
              borderBottom: '1px solid var(--divider)',
            }}
          >
            <strong style={{ fontSize: 14 }}>{n.title ?? 'Notification'}</strong>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{n.body ?? n.message}</div>
          </div>
        ))}
      </section>

      <section className="card" style={{ display: 'grid', gap: 10 }}>
        <strong>Mes données</strong>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={exportData}>
            Exporter mes données
          </button>
          <button className="btn-danger" onClick={() => setConfirming(!confirming)}>
            Supprimer mon compte
          </button>
        </div>

        {confirming && (
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            <span style={{ color: 'var(--error)' }}>
              Cette action est définitive : compte, progression et récitations sont effacés.
            </span>
            <input
              type="password"
              placeholder="Confirmez avec votre mot de passe"
              aria-label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn-danger" onClick={deleteAccount} disabled={!password}>
              Supprimer définitivement
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
