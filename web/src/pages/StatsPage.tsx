/**
 * Statistiques — mesurer la progression réelle.
 *
 * L'écran affichait quatre tuiles et un histogramme de sept jours entièrement
 * à zéro, avec les jours en anglais au milieu d'une interface française.
 *
 * Ce qui change :
 *
 * **La carte du Coran devient l'élément central.** Cent quatorze rectangles
 * proportionnels au nombre de versets, remplis selon ce qui est mémorisé. On
 * voit sa mémorisation d'un seul regard — c'est la seule représentation qui
 * dit à la fois ce qui est fait et ce qui reste.
 *
 * **Douze semaines au lieu de sept jours.** Sept jours ne signifient rien pour
 * une pratique dont l'unité est le mois ; l'écran donnait surtout l'impression
 * d'un produit vide.
 *
 * **Les dates passent par `Intl` avec la locale active.** Les jours
 * s'affichaient en anglais parce qu'un `toLocaleDateString` n'avait pas reçu
 * de locale.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsAPI, quranAPI, progressAPI } from '../services/api';
import { useResource, asList, unwrap, StateBlock } from '../components/useResource';
import { SeparateurSection } from '../components/Ornements';
import { jourAbrege } from '../i18n';

type Periode = 4 | 12 | 52;

export default function StatsPage() {
  const { t, i18n } = useTranslation(['stats', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';
  const [periode, setPeriode] = useState<Periode>(12);

  const apercu = useResource<any>(() => analyticsAPI.overview(), []);
  const semaine = useResource<any>(() => analyticsAPI.weekly(), []);
  const calendrier = useResource<any>(() => analyticsAPI.heatmap(3), []);
  const sourates = useResource<any>(() => quranAPI.surahs(), []);
  const avancement = useResource<any>(() => progressAPI.overview(), []);

  const o = unwrap(apercu.data)?.overview ?? {};
  const jours: any[] = unwrap(semaine.data)?.weeklyData ?? [];
  const cases: any[] = unwrap(calendrier.data)?.heatmap ?? [];

  const listeSourates = asList(sourates.data, 'surahs');
  const parSourate = useMemo(() => {
    const charge = unwrap(avancement.data) ?? {};
    const table: Record<number, any> = {};
    for (const s of charge.surahs ?? []) table[s.surahNumber ?? s.number] = s;
    return table;
  }, [avancement.data]);

  /**
   * Semaines agrégées depuis le calendrier quotidien. Le serveur ne conserve
   * que 90 jours : au-delà, la période demandée est simplement plus courte
   * que ce qu'on affiche, et il vaut mieux le montrer que le combler.
   */
  const semaines = useMemo(() => {
    const seaux: { debut: Date; total: number }[] = [];
    const parJour = new Map(cases.map((c) => [c.date, c.count ?? 0]));

    for (let s = periode - 1; s >= 0; s--) {
      const debut = new Date();
      debut.setHours(0, 0, 0, 0);
      debut.setDate(debut.getDate() - s * 7 - debut.getDay());
      let total = 0;
      for (let j = 0; j < 7; j++) {
        const d = new Date(debut);
        d.setDate(d.getDate() + j);
        total += parJour.get(d.toISOString().split('T')[0]) ?? 0;
      }
      seaux.push({ debut, total });
    }
    return seaux;
  }, [cases, periode]);

  const maxSemaine = Math.max(1, ...semaines.map((s) => s.total));
  const moyenne = semaines.length
    ? semaines.reduce((a, s) => a + s.total, 0) / semaines.length
    : 0;

  const versets = o.progress?.totalVersesMemorized ?? 0;
  const pourcentCoran = o.progress?.percentComplete ?? '0';

  // Moins d'une semaine d'historique : les graphiques ne diraient rien, et
  // des barres à zéro donnent l'impression d'un produit cassé.
  const troptot = cases.filter((c) => c.count > 0).length < 3;

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <h1 className="display-md" style={{ margin: 0 }}>{t('title')}</h1>

      <StateBlock loading={apercu.loading} error={apercu.error} onRetry={apercu.reload} />

      {/* --- 1. La carte du Coran ----------------------------------------- */}
      <section className="sacred-card" style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h2 className="title-md" style={{ margin: 0, flex: 1 }}>{t('quranMap')}</h2>
          <span className="data caption">
            {versets} · {pourcentCoran} %
          </span>
        </div>

        <CarteDuCoran sourates={listeSourates} parSourate={parSourate} />

        <p className="caption" style={{ margin: 0 }}>
          {t('versesMemorized')} · {t('ofQuran')}
        </p>
      </section>

      {/* --- 2. Régularité -------------------------------------------------- */}
      <section className="card" style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 className="title-md" style={{ margin: 0, flex: 1 }}>{t('consistency')}</h2>

          <div role="tablist" style={{ display: 'flex', gap: 4 }}>
            {([[4, t('period4w')], [12, t('period12w')], [52, t('period1y')]] as const).map(
              ([v, libelle]) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={periode === v}
                  className={periode === v ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '4px 12px', fontSize: 13, minHeight: 32 }}
                  onClick={() => setPeriode(v as Periode)}
                >
                  {libelle}
                </button>
              )
            )}
          </div>
        </div>

        {troptot ? (
          <p className="caption" style={{ margin: 0, textAlign: 'center', padding: 24 }}>
            {t('tooEarly')}
          </p>
        ) : (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 3, height: 150 }}>
            {/* Moyenne en filet d'or : le repère qui donne son sens à la barre. */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                insetInline: 0,
                bottom: `${(moyenne / maxSemaine) * 100}%`,
                borderTop: '1px dashed var(--border-gold)',
              }}
            />
            {semaines.map((s, i) => (
              <div
                key={i}
                title={`${new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(s.debut)} — ${s.total}`}
                style={{
                  flex: 1,
                  blockSize: `${Math.max(2, (s.total / maxSemaine) * 100)}%`,
                  background: s.total > 0 ? 'var(--brand)' : 'var(--border)',
                  borderRadius: '3px 3px 0 0',
                }}
              />
            ))}
          </div>
        )}
      </section>

      <SeparateurSection />

      {/* --- 3. Détail ------------------------------------------------------ */}
      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
        <Tuile valeur={versets} libelle={t('versesMemorized')} />
        <Tuile valeur={`${pourcentCoran} %`} libelle={t('ofQuran')} />
        <Tuile valeur={o.streaks?.current ?? 0} libelle={t('currentStreak')} />
        <Tuile valeur={o.streaks?.longest ?? 0} libelle={t('longestStreak')} />
        <Tuile valeur={o.thisWeek?.activeDays ?? 0} libelle={t('thisWeek')} />
        <Tuile valeur={o.progress?.juzCompleted ?? 0} libelle={t('juzDone')} />
      </section>

      {/* Semaine détaillée, avec les jours dans la langue de l'interface. */}
      {jours.length > 0 && !troptot && (
        <section className="card" style={{ display: 'grid', gap: 12 }}>
          <h2 className="title-md" style={{ margin: 0 }}>{t('thisWeek')}</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 110 }}>
            {jours.map((j) => (
              <div key={j.date} style={{ flex: 1, display: 'grid', justifyItems: 'center', gap: 6 }}>
                <span className="caption data">{j.versesLearned ?? 0}</span>
                <div
                  style={{
                    inlineSize: '100%',
                    blockSize: `${Math.max(3, ((j.versesLearned ?? 0) / Math.max(1, ...jours.map((x) => x.versesLearned ?? 0))) * 70)}px`,
                    background: j.active ? 'var(--brand)' : 'var(--border)',
                    borderRadius: '3px 3px 0 0',
                  }}
                />
                <span className="caption">{jourAbrege(j.date, locale)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="caption" style={{ margin: 0, lineHeight: 1.7 }}>
        {t('noDuration')}
      </p>
    </div>
  );
}

/**
 * Carte du Coran : cent quatorze rectangles proportionnels au nombre de
 * versets de chaque sourate.
 *
 * Un simple `flex` pondéré plutôt qu'un vrai treemap : la surface reste
 * proportionnelle, la lecture reste ordonnée par numéro de sourate — ce qui
 * compte ici, puisqu'on cherche « où j'en suis dans le mushaf », pas « quelle
 * est la plus grosse sourate ».
 */
function CarteDuCoran({
  sourates,
  parSourate,
}: {
  sourates: any[];
  parSourate: Record<number, any>;
}) {
  const { t } = useTranslation('stats');

  if (sourates.length === 0) {
    return <div style={{ height: 90, background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }} />;
  }

  return (
    <div
      style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}
      role="img"
      aria-label={t('quranMap')}
    >
      {sourates.map((s: any) => {
        const p = parSourate[s.number];
        const memorises = p?.versesMemorized ?? p?.memorized ?? 0;
        const part = s.ayahs > 0 ? Math.min(1, memorises / s.ayahs) : 0;

        return (
          <div
            key={s.number}
            title={`${s.englishName} — ${Math.round(part * 100)} %`}
            style={{
              // La largeur suit le nombre de versets : Al-Baqara occupe
              // visiblement plus de place qu'Al-Kawthar, ce qui est vrai.
              flexGrow: Math.max(1, s.ayahs),
              flexBasis: 0,
              minInlineSize: 4,
              blockSize: 26,
              background: 'var(--surface-sunken)',
              border: '1px solid var(--border)',
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                insetBlockEnd: 0,
                insetInline: 0,
                blockSize: `${part * 100}%`,
                background: part >= 1 ? 'var(--accent)' : 'var(--brand)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

function Tuile({ valeur, libelle }: { valeur: number | string; libelle: string }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="data-xl" style={{ fontSize: 26, color: 'var(--text)' }}>{valeur}</div>
      <div className="overline" style={{ marginTop: 4 }}>{libelle}</div>
    </div>
  );
}
