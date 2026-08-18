/**
 * Série — jours consécutifs de pratique.
 *
 * L'écran montre le calendrier réel plutôt qu'un simple compteur : voir où se
 * situent les trous est plus utile que lire « 6 ». Les gels servent à couvrir
 * un jour manqué, et l'application dit combien il en reste — un gel consommé
 * sans que l'utilisateur le sache donne l'illusion d'une série intacte.
 */

import { useState } from 'react';
import { streaksAPI, analyticsAPI } from '../services/api';
import { useResource, unwrap, StateBlock } from '../components/useResource';

export default function StreakPage() {
  const serie = useResource<any>(() => streaksAPI.get(), []);
  const calendrier = useResource<any>(() => analyticsAPI.heatmap(2), []);
  const [occupe, setOccupe] = useState(false);
  const [avis, setAvis] = useState<string | null>(null);

  const s = unwrap(serie.data)?.streak ?? unwrap(serie.data) ?? {};
  const cases: any[] = unwrap(calendrier.data)?.heatmap ?? [];
  const jalons: any[] = s.milestones ?? [];

  const JALONS = [3, 7, 14, 30, 60, 100, 180, 365];
  const actuel = s.current ?? 0;

  const agir = async (fn: () => Promise<any>, message: string) => {
    setOccupe(true);
    setAvis(null);
    try {
      await fn();
      setAvis(message);
      serie.reload();
    } catch (e: any) {
      setAvis(e?.error ?? 'Action impossible');
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, flex: 1 }}>Série</h1>
        {avis && (
          <span role="status" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {avis}
          </span>
        )}
      </div>

      <StateBlock loading={serie.loading} error={serie.error} onRetry={serie.reload} />

      <section
        className="card"
        style={{
          display: 'grid',
          gap: 6,
          justifyItems: 'center',
          padding: 32,
          background: 'var(--primary-soft)',
          borderColor: 'var(--primary)',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: 46 }}>🔥</span>
        <div style={{ fontSize: 44, fontWeight: 700, color: 'var(--primary-dark)' }}>{actuel}</div>
        <div style={{ color: 'var(--primary-dark)' }}>
          jour{actuel > 1 ? 's' : ''} d’affilée
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
          Record : {s.longest ?? 0} jour(s)
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Gels de série</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          Un gel couvre une journée sans pratique et empêche la série de
          retomber à zéro. Il vous en reste <strong>{s.freezesAvailable ?? 0}</strong>.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn-ghost"
            disabled={occupe}
            onClick={() => agir(() => streaksAPI.buyFreeze(), 'Gel acheté')}
          >
            Acheter un gel
          </button>
          <button
            className="btn-ghost"
            disabled={occupe || (s.freezesAvailable ?? 0) === 0}
            title={(s.freezesAvailable ?? 0) === 0 ? 'Aucun gel disponible' : undefined}
            onClick={() => agir(() => streaksAPI.freeze(), 'Gel appliqué')}
          >
            Utiliser un gel
          </button>
        </div>
      </section>

      <section className="card">
        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Jalons</h2>
        <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: 14 }}>
          Chaque palier atteint donne une récompense à récupérer.
        </p>

        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
          {JALONS.map((j) => {
            const atteint = actuel >= j;
            const enregistre = jalons.find((m: any) => m.days === j);
            const aReclamer = atteint && enregistre && !enregistre.rewardClaimed;

            return (
              <div
                key={j}
                className="card"
                style={{
                  textAlign: 'center',
                  padding: 14,
                  opacity: atteint ? 1 : 0.5,
                  borderColor: aReclamer ? 'var(--primary)' : 'var(--border)',
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 700, color: atteint ? 'var(--primary-dark)' : 'var(--text-muted)' }}>
                  {j}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>jours</div>

                {aReclamer && (
                  <button
                    className="btn-primary"
                    style={{ marginTop: 8, padding: '6px 10px', fontSize: 13 }}
                    disabled={occupe}
                    onClick={() => agir(() => streaksAPI.claimMilestone(j), 'Récompense récupérée')}
                  >
                    Récupérer
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Deux derniers mois</h2>
        <StateBlock loading={calendrier.loading} error={calendrier.error} onRetry={calendrier.reload} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {cases.map((c) => (
            <div
              key={c.date}
              title={`${c.date} — ${c.count} verset(s)`}
              style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: c.count > 0 ? 'var(--primary)' : 'var(--background-alt)',
                border: c.count > 0 ? 'none' : '1px solid var(--border)',
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
