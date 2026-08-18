/**
 * Statistiques — activité réelle, jamais estimée.
 *
 * Les séries viennent de `Streak.history`, la seule trace que l'application
 * écrit effectivement. Le serveur ne conserve que 90 jours et ne mesure aucune
 * durée : la page l'affiche plutôt que de combler les trous.
 */

import { analyticsAPI } from '../services/api';
import { useResource, unwrap, StateBlock } from '../components/useResource';

export default function StatsPage() {
  const apercu = useResource<any>(() => analyticsAPI.overview(), []);
  const semaine = useResource<any>(() => analyticsAPI.weekly(), []);
  const calendrier = useResource<any>(() => analyticsAPI.heatmap(3), []);

  const o = unwrap(apercu.data)?.overview ?? {};
  const jours: any[] = unwrap(semaine.data)?.weeklyData ?? [];
  const cal = unwrap(calendrier.data) ?? {};
  const cases: any[] = cal.heatmap ?? [];

  const maxVersets = Math.max(1, ...jours.map((j) => j.versesLearned ?? 0));
  const maxCase = Math.max(1, ...cases.map((c) => c.count ?? 0));

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <h1 style={{ margin: 0 }}>Statistiques</h1>

      <StateBlock loading={apercu.loading} error={apercu.error} onRetry={apercu.reload} />

      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <Bloc valeur={o.progress?.totalVersesMemorized ?? 0} libelle="Versets mémorisés" />
        <Bloc valeur={`${o.progress?.percentComplete ?? 0} %`} libelle="Du Coran" />
        <Bloc valeur={o.streaks?.current ?? 0} libelle="Série en cours" />
        <Bloc valeur={o.streaks?.longest ?? 0} libelle="Plus longue série" />
      </section>

      <section className="card">
        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Cette semaine</h2>
        <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', fontSize: 14 }}>
          {o.thisWeek?.activeDays ?? 0} jour(s) actif(s) · {o.thisWeek?.versesLearned ?? 0} verset(s) ·{' '}
          {o.thisWeek?.xpEarned ?? 0} XP
        </p>

        <StateBlock loading={semaine.loading} error={semaine.error} onRetry={semaine.reload} />

        {/* Histogramme en CSS : sept barres ne justifient pas une bibliothèque
            de graphiques, et sa taille pèserait sur chaque chargement. */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150 }}>
          {jours.map((j) => (
            <div key={j.date} style={{ flex: 1, display: 'grid', justifyItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{j.versesLearned ?? 0}</span>
              <div
                title={`${j.date} — ${j.versesLearned ?? 0} verset(s), ${j.xpEarned ?? 0} XP`}
                style={{
                  width: '100%',
                  height: `${Math.max(4, ((j.versesLearned ?? 0) / maxVersets) * 100)}px`,
                  borderRadius: '6px 6px 0 0',
                  background: j.active ? 'var(--primary)' : 'var(--border)',
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{j.day}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>Assiduité</h2>
        <p style={{ margin: '0 0 14px', color: 'var(--text-secondary)', fontSize: 14 }}>
          {cal.truncated
            ? `Le serveur ne conserve que ${cal.availableDays} jours d’historique — la période demandée a été réduite.`
            : `${cases.filter((c) => c.count > 0).length} jour(s) d’activité sur la période.`}
        </p>

        <StateBlock loading={calendrier.loading} error={calendrier.error} onRetry={calendrier.reload} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {cases.map((c) => {
            const intensite = c.count ? 0.25 + (c.count / maxCase) * 0.75 : 0;
            return (
              <div
                key={c.date}
                title={`${c.date} — ${c.count} verset(s)`}
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: 3,
                  background: intensite ? 'var(--primary)' : 'var(--background-alt)',
                  opacity: intensite || 1,
                  border: intensite ? 'none' : '1px solid var(--border)',
                }}
              />
            );
          })}
        </div>
      </section>

      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
        Aucune durée n’est affichée : rien dans l’application ne mesure le temps
        passé. Ces chiffres comptent des versets et des jours, pas des minutes.
      </p>
    </div>
  );
}

function Bloc({ valeur, libelle }: { valeur: number | string; libelle: string }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-dark)' }}>{valeur}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{libelle}</div>
    </div>
  );
}
