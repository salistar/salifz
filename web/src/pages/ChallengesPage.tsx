/**
 * Défis — objectifs à durée limitée, distincts des succès.
 *
 * Un succès récompense un état atteint une fois pour toutes ; un défi demande
 * une action dans une fenêtre de temps. Les mélanger sur un même écran rendrait
 * illisible ce qui expire et ce qui ne le fait pas.
 */

import { useState } from 'react';
import { challengesAPI } from '../services/api';
import { useResource, asList, StateBlock } from '../components/useResource';
import { label } from '../services/i18n';


export default function ChallengesPage() {
  const encours = useResource<any>(() => challengesAPI.all(), []);
  const finis = useResource<any>(() => challengesAPI.completed(), []);
  const [onglet, setOnglet] = useState<'encours' | 'finis'>('encours');
  const [occupe, setOccupe] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);

  const actif = onglet === 'encours' ? encours : finis;
  const items = asList(actif.data, 'challenges', 'items', 'completed');

  const agir = async (id: string, fn: () => Promise<any>, message: string) => {
    setOccupe(id);
    setAvis(null);
    try {
      await fn();
      setAvis(message);
      encours.reload();
      finis.reload();
    } catch (e: any) {
      setAvis(e?.error ?? 'Action impossible');
    } finally {
      setOccupe(null);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, flex: 1 }}>Défis</h1>
        {avis && (
          <span role="status" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {avis}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }} role="tablist">
        {([
          ['encours', 'En cours'],
          ['finis', 'Terminés'],
        ] as const).map(([cle, libelle]) => (
          <button
            key={cle}
            role="tab"
            aria-selected={onglet === cle}
            className={onglet === cle ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setOnglet(cle)}
          >
            {libelle}
          </button>
        ))}
      </div>

      <StateBlock
        loading={actif.loading}
        error={actif.error}
        empty={!actif.loading && items.length === 0}
        emptyText={
          onglet === 'encours'
            ? 'Aucun défi disponible pour le moment.'
            : 'Aucun défi terminé pour l’instant.'
        }
        onRetry={actif.reload}
      />

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {items.map((d: any, i: number) => {
          const id = d._id ?? d.id ?? d.challengeId ?? String(i);
          const cible = d.target ?? d.goal ?? d.requirement ?? 0;
          const fait = d.progress ?? d.current ?? 0;
          const pourcent = cible > 0 ? Math.min(100, Math.round((fait / cible) * 100)) : 0;
          const termine = d.completed ?? d.isCompleted ?? pourcent >= 100;
          const reclame = d.claimed ?? d.rewardClaimed;

          return (
            <article key={id} className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span aria-hidden="true" style={{ fontSize: 26 }}>{d.icon ?? '🎯'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block' }}>{label(d.name ?? d.title) || 'Défi'}</strong>
                  {label(d.description) && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                      {label(d.description)}
                    </span>
                  )}
                </div>
              </div>

              {cible > 0 && (
                <div>
                  <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${pourcent}%`, height: '100%', background: 'var(--primary)' }} />
                  </div>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {fait} / {cible}
                  </small>
                </div>
              )}

              {(d.reward?.xp || d.reward?.gems || d.xpReward || d.gemsReward) && (
                <div style={{ display: 'flex', gap: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
                  {(d.reward?.xp ?? d.xpReward) ? <span>⭐ {d.reward?.xp ?? d.xpReward} XP</span> : null}
                  {(d.reward?.gems ?? d.gemsReward) ? <span>💎 {d.reward?.gems ?? d.gemsReward}</span> : null}
                </div>
              )}

              {termine && !reclame ? (
                <button
                  className="btn-primary"
                  disabled={occupe === id}
                  onClick={() => agir(id, () => challengesAPI.claim(id), 'Récompense récupérée')}
                >
                  {occupe === id ? 'Patientez…' : 'Récupérer la récompense'}
                </button>
              ) : termine ? (
                <span style={{ color: 'var(--primary-dark)', fontWeight: 600, fontSize: 14 }}>✓ Terminé</span>
              ) : d.started ?? d.isStarted ? (
                <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>En cours</span>
              ) : (
                <button
                  className="btn-ghost"
                  disabled={occupe === id}
                  onClick={() => agir(id, () => challengesAPI.start(id), 'Défi commencé')}
                >
                  Commencer
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
