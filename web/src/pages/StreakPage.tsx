/**
 * Série — la constance, pas le compteur.
 *
 * L'écran affichait un grand nombre sur fond vert et une bande de carrés des
 * deux derniers mois. Trois choses le desservaient :
 *
 * **Le chiffre ne disait pas la même chose que l'en-tête.** Deux calculs de
 * série coexistaient dans le serveur, chacun écrivant dans son propre champ.
 * C'est corrigé côté serveur : `Streak` calcule, `User` recopie.
 *
 * **Deux mois ne racontent rien.** La grille passe à douze mois, en semaines
 * verticales — la forme habituelle, celle qui laisse voir les trous et les
 * reprises. Les jours antérieurs à ce que le serveur conserve sont neutres et
 * non « manqués » : l'absence de donnée n'est pas une absence de pratique.
 *
 * **Les jalons ressemblaient à des cases grises.** Ils deviennent des étoiles
 * de hizb, remplies par quarts au fur et à mesure de l'approche du palier.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { streaksAPI, analyticsAPI } from '../services/api';
import { useResource, unwrap, StateBlock } from '../components/useResource';
import { HizbStar, SeparateurSection, ZelligeField } from '../components/Ornements';
import { structuralNumber } from '../i18n/nombres';

const JALONS = [3, 7, 14, 30, 60, 100, 180, 365];
const SEMAINES = 53;

export default function StreakPage() {
  const { t, i18n } = useTranslation(['streak', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  const serie = useResource<any>(() => streaksAPI.get(), []);
  const calendrier = useResource<any>(() => analyticsAPI.heatmap(12), []);
  const [occupe, setOccupe] = useState(false);
  const [avis, setAvis] = useState<string | null>(null);

  const s = unwrap(serie.data)?.streak ?? unwrap(serie.data) ?? {};
  const charge = unwrap(calendrier.data) ?? {};
  const cases: any[] = charge.heatmap ?? [];
  const joursConserves: number = charge.availableDays ?? cases.length;
  const jalonsAtteints: any[] = s.milestones ?? [];

  const actuel = s.current ?? 0;
  const record = s.longest ?? 0;
  const gels = s.freezesAvailable ?? 0;

  const agir = async (fn: () => Promise<any>, message: string) => {
    setOccupe(true);
    setAvis(null);
    try {
      await fn();
      setAvis(message);
      serie.reload();
    } catch (e: any) {
      setAvis(e?.error ?? t('common:errorGeneric'));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 className="display-md" style={{ margin: 0, flex: 1 }}>{t('title')}</h1>
        {avis && <span role="status" className="caption">{avis}</span>}
      </div>

      <StateBlock loading={serie.loading} error={serie.error} onRetry={serie.reload} />

      {/* --- Le compteur ---------------------------------------------------- */}
      <section
        className="sacred-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'grid',
          justifyItems: 'center',
          gap: 4,
          padding: '36px 24px',
          textAlign: 'center',
        }}
      >
        <ZelligeField style={{ position: 'absolute', inset: 0, color: 'var(--accent)' }} opacity={0.035} />

        <div style={{ position: 'relative', display: 'grid', justifyItems: 'center', gap: 6 }}>
          <HizbStar size={44} quarters={Math.min(4, actuel) as 0 | 1 | 2 | 3 | 4} color="var(--accent)" />
          <div className="data-xl" style={{ fontSize: 52, lineHeight: 1.1, color: 'var(--text)' }}>
            {structuralNumber(actuel, locale)}
          </div>
          <div className="title-md" style={{ color: 'var(--text-secondary)' }}>
            {actuel > 0 ? t('current', { count: actuel }) : t('noneYet')}
          </div>
          {record > 0 && (
            <div className="caption" style={{ marginTop: 6 }}>{t('record', { count: record })}</div>
          )}
        </div>
      </section>

      {/* --- Douze mois ------------------------------------------------------ */}
      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <h2 className="title-md" style={{ margin: 0 }}>{t('annualCalendar')}</h2>
        <StateBlock loading={calendrier.loading} error={calendrier.error} onRetry={calendrier.reload} />
        <CalendrierAnnuel cases={cases} joursConserves={joursConserves} locale={locale} />
        <p className="caption" style={{ margin: 0 }}>{t('coverage', { count: joursConserves })}</p>
      </section>

      <SeparateurSection />

      {/* --- Gels ------------------------------------------------------------ */}
      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <h2 className="title-md" style={{ margin: 0 }}>{t('freezes')}</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          {t('freezeExplain', { count: gels })}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn-ghost"
            disabled={occupe}
            onClick={() => agir(() => streaksAPI.buyFreeze(), t('freezeBought'))}
          >
            {t('buyFreeze')}
          </button>
          <button
            className="btn-ghost"
            disabled={occupe || gels === 0}
            title={gels === 0 ? t('noFreeze') : undefined}
            onClick={() => agir(() => streaksAPI.freeze(), t('freezeApplied'))}
          >
            {t('useFreeze')}
          </button>
        </div>
      </section>

      {/* --- Jalons ---------------------------------------------------------- */}
      <section className="card" style={{ display: 'grid', gap: 14 }}>
        <div>
          <h2 className="title-md" style={{ margin: '0 0 4px' }}>{t('milestones')}</h2>
          <p className="caption" style={{ margin: 0 }}>{t('milestoneExplain')}</p>
        </div>

        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))' }}>
          {JALONS.map((j, index) => {
            const atteint = actuel >= j;
            const enregistre = jalonsAtteints.find((m: any) => m.days === j);
            const aReclamer = atteint && enregistre && !enregistre.rewardClaimed;

            // Remplissage par quarts depuis le palier précédent : le jalon
            // suivant se remplit à mesure qu'on s'en approche, plutôt que de
            // rester éteint jusqu'au jour où il s'allume d'un coup.
            const precedent = index === 0 ? 0 : JALONS[index - 1];
            const part = atteint
              ? 1
              : Math.max(0, (actuel - precedent) / (j - precedent));
            const quarts = (atteint ? 4 : Math.floor(part * 4)) as 0 | 1 | 2 | 3 | 4;

            return (
              <div
                key={j}
                className="card"
                style={{
                  display: 'grid',
                  justifyItems: 'center',
                  gap: 6,
                  padding: 14,
                  borderColor: aReclamer ? 'var(--border-gold)' : 'var(--border)',
                }}
              >
                <HizbStar
                  size={26}
                  quarters={quarts}
                  color={atteint ? 'var(--accent)' : 'var(--border-strong)'}
                />
                <div
                  className="data"
                  style={{ fontSize: 20, color: atteint ? 'var(--text)' : 'var(--text-muted)' }}
                >
                  {structuralNumber(j, locale)}
                </div>
                <div className="overline">{t('days')}</div>

                {aReclamer && (
                  <button
                    className="btn-primary"
                    style={{ marginTop: 4, padding: '6px 12px', fontSize: 13, minHeight: 32 }}
                    disabled={occupe}
                    onClick={() => agir(() => streaksAPI.claimMilestone(j), t('claimed'))}
                  >
                    {t('claim')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/**
 * Grille de douze mois, en colonnes d'une semaine.
 *
 * Trois états, et le troisième est celui qui manquait : *pratiqué*, *manqué*,
 * et *hors historique*. Le serveur ne conserve qu'une fenêtre glissante ; peindre
 * le reste comme des jours manqués accuserait l'utilisateur d'une inactivité
 * qui n'est qu'une absence d'enregistrement.
 */
function CalendrierAnnuel({
  cases,
  joursConserves,
  locale,
}: {
  cases: any[];
  joursConserves: number;
  locale: string;
}) {
  const { t } = useTranslation('streak');

  const { colonnes, debutCouverture } = useMemo(() => {
    const parJour = new Map<string, number>(cases.map((c) => [c.date, c.count ?? 0]));

    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const couverture = new Date(aujourdhui);
    couverture.setDate(couverture.getDate() - joursConserves + 1);

    // On remonte jusqu'au dimanche précédant la première semaine affichée,
    // pour que chaque colonne soit une semaine entière.
    const depart = new Date(aujourdhui);
    depart.setDate(depart.getDate() - (SEMAINES - 1) * 7 - aujourdhui.getDay());

    const cols: { jour: Date; compte: number; horsHistorique: boolean; futur: boolean }[][] = [];
    for (let sem = 0; sem < SEMAINES; sem++) {
      const colonne = [];
      for (let j = 0; j < 7; j++) {
        const jour = new Date(depart);
        jour.setDate(jour.getDate() + sem * 7 + j);
        const cle = jour.toISOString().split('T')[0];
        colonne.push({
          jour,
          compte: parJour.get(cle) ?? 0,
          horsHistorique: jour < couverture,
          futur: jour > aujourdhui,
        });
      }
      cols.push(colonne);
    }
    return { colonnes: cols, debutCouverture: couverture };
  }, [cases, joursConserves]);

  const max = Math.max(1, ...cases.map((c) => c.count ?? 0));
  const formatJour = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div
        style={{ display: 'flex', gap: 3, minInlineSize: 'max-content' }}
        role="img"
        aria-label={`${t('annualCalendar')} — ${formatJour.format(debutCouverture)}`}
      >
        {colonnes.map((colonne, i) => (
          <div key={i} style={{ display: 'grid', gap: 3 }}>
            {colonne.map((c, j) => {
              // L'intensité suit le volume, bornée à quatre paliers : au-delà,
              // l'œil ne distingue plus les nuances.
              const palier = c.compte === 0 ? 0 : Math.min(4, Math.ceil((c.compte / max) * 4));

              return (
                <div
                  key={j}
                  title={
                    c.futur || c.horsHistorique
                      ? undefined
                      : `${formatJour.format(c.jour)} — ${structuralNumber(c.compte, locale)}`
                  }
                  style={{
                    inlineSize: 11,
                    blockSize: 11,
                    borderRadius: 2,
                    background:
                      c.futur || c.horsHistorique
                        ? 'transparent'
                        : palier === 0
                          ? 'var(--surface-sunken)'
                          : 'var(--brand)',
                    opacity: c.futur || c.horsHistorique ? 0.25 : palier === 0 ? 1 : 0.35 + palier * 0.16,
                    border:
                      c.horsHistorique || c.futur
                        ? '1px dashed var(--border)'
                        : palier === 0
                          ? '1px solid var(--border)'
                          : 'none',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
