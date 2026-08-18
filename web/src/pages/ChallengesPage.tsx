/**
 * Défis — objectifs à durée limitée, distincts des succès.
 *
 * Un succès récompense un état atteint une fois pour toutes ; un défi demande
 * une action dans une fenêtre de temps. Les mélanger rendrait illisible ce qui
 * expire et ce qui ne le fait pas.
 *
 * Ce qui change :
 *
 * **Les trois familles sont séparées.** Quotidien, hebdomadaire, entre amis :
 * elles n'ont ni la même durée ni le même enjeu, et les empiler dans une seule
 * grille effaçait la seule information qui compte — dans combien de temps ça
 * disparaît.
 *
 * **L'échéance est portée par la carte.** Le temps restant se lit avant le
 * titre : c'est lui qui décide si on s'y met maintenant.
 *
 * **L'état vide dit ce qui va se passer.** « Aucun défi disponible » laissait
 * croire à un produit cassé ; les défis quotidiens arrivent à minuit, et le
 * dire suffit.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { challengesAPI } from '../services/api';
import { useResource, asList, StateBlock } from '../components/useResource';
import { useLabel } from '../services/i18n';
import { HizbStar, MihrabArch, HizbProgress } from '../components/Ornements';
import { IconeDefis, IconeGemmes, IconeAmis } from '../components/Icones';
import { structuralNumber } from '../i18n/nombres';

type Famille = 'tous' | 'daily' | 'weekly' | 'friend';

/**
 * Le serveur nomme la famille de plusieurs façons selon la route d'origine ;
 * on ramène tout à trois valeurs plutôt que de multiplier les tests à
 * l'affichage.
 */
function famille(d: any): Exclude<Famille, 'tous'> {
  const brut = String(d.type ?? d.category ?? d.frequency ?? '').toLowerCase();
  if (brut.includes('week') || brut.includes('hebdo')) return 'weekly';
  if (brut.includes('friend') || brut.includes('ami') || d.opponent || d.challenger) return 'friend';
  return 'daily';
}

export default function ChallengesPage() {
  const label = useLabel();
  const { t, i18n } = useTranslation(['challenges', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  const encours = useResource<any>(() => challengesAPI.all(), []);
  const finis = useResource<any>(() => challengesAPI.completed(), []);

  const [onglet, setOnglet] = useState<'encours' | 'finis'>('encours');
  const [filtre, setFiltre] = useState<Famille>('tous');
  const [occupe, setOccupe] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);

  const actif = onglet === 'encours' ? encours : finis;
  const items = asList(actif.data, 'challenges', 'items', 'completed');

  const affiches = useMemo(
    () => (filtre === 'tous' ? items : items.filter((d: any) => famille(d) === filtre)),
    [items, filtre]
  );

  const agir = async (id: string, fn: () => Promise<any>, message: string) => {
    setOccupe(id);
    setAvis(null);
    try {
      await fn();
      setAvis(message);
      encours.reload();
      finis.reload();
    } catch (e: any) {
      setAvis(e?.error ?? t('common:errorGeneric'));
    } finally {
      setOccupe(null);
    }
  };

  const vide = !actif.loading && !actif.error && affiches.length === 0;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 className="display-md" style={{ margin: 0, flex: 1 }}>{t('title')}</h1>
        {avis && <span role="status" className="caption">{avis}</span>}
      </div>

      <div role="tablist" style={{ display: 'flex', gap: 6 }}>
        {([['encours', t('active')], ['finis', t('done')]] as const).map(([cle, libelle]) => (
          <button
            key={cle}
            role="tab"
            aria-selected={onglet === cle}
            className={onglet === cle ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '6px 16px', fontSize: 14, minHeight: 36 }}
            onClick={() => setOnglet(cle)}
          >
            {libelle}
          </button>
        ))}
      </div>

      {/* --- Familles ------------------------------------------------------- */}
      {onglet === 'encours' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([
            ['tous', t('all')],
            ['daily', t('daily')],
            ['weekly', t('weekly')],
            ['friend', t('friend')],
          ] as const).map(([cle, libelle]) => {
            const choisi = filtre === cle;
            const nombre = cle === 'tous' ? items.length : items.filter((d: any) => famille(d) === cle).length;

            return (
              <button
                key={cle}
                aria-pressed={choisi}
                onClick={() => setFiltre(cle as Famille)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  minHeight: 32,
                  fontSize: 13,
                  borderRadius: 'var(--radius-pill)',
                  border: `1px solid ${choisi ? 'var(--border-gold)' : 'var(--border)'}`,
                  background: choisi ? 'var(--accent-wash)' : 'transparent',
                  color: choisi ? 'var(--accent-text)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {cle === 'friend' && <IconeAmis size={14} />}
                {libelle}
                {nombre > 0 && (
                  <span className="data" style={{ fontSize: 12, opacity: 0.7 }}>
                    {structuralNumber(nombre, locale)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Une phrase par famille : ce qui la renouvelle, donc quand revenir. */}
      {onglet === 'encours' && filtre !== 'tous' && (
        <p className="caption" style={{ margin: 0 }}>
          {t(filtre === 'daily' ? 'familyDaily' : filtre === 'weekly' ? 'familyWeekly' : 'familyFriend')}
        </p>
      )}

      <StateBlock loading={actif.loading} error={actif.error} onRetry={actif.reload} />

      {/* --- État vide ------------------------------------------------------ */}
      {vide && (
        <section
          className="sacred-card"
          style={{ display: 'grid', justifyItems: 'center', gap: 14, padding: 40, textAlign: 'center' }}
        >
          <MihrabArch style={{ width: 110 }} />
          <strong className="title-lg">
            {onglet === 'finis'
              ? t('emptyDone')
              : filtre === 'tous'
                ? t('emptyTitle')
                : t('noneInFamily')}
          </strong>
          {onglet === 'encours' && (
            <p style={{ margin: 0, maxWidth: 420, color: 'var(--text-muted)', lineHeight: 1.7 }}>
              {t('emptyBody')}
            </p>
          )}
        </section>
      )}

      {/* --- Cartes --------------------------------------------------------- */}
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))' }}>
        {affiches.map((d: any, i: number) => {
          const id = d._id ?? d.id ?? d.challengeId ?? String(i);
          const cible = d.target ?? d.goal ?? d.requirement ?? 0;
          const fait = d.progress ?? d.current ?? 0;
          const pourcent = cible > 0 ? Math.min(100, Math.round((fait / cible) * 100)) : 0;
          const termine = d.completed ?? d.isCompleted ?? pourcent >= 100;
          const reclame = d.claimed ?? d.rewardClaimed;
          const xp = d.reward?.xp ?? d.xpReward;
          const gemmes = d.reward?.gems ?? d.gemsReward;
          const echeance = d.expiresAt ?? d.endsAt ?? d.deadline;

          return (
            <article
              key={id}
              className="card"
              style={{
                display: 'grid',
                gap: 12,
                alignContent: 'start',
                borderColor: termine && !reclame ? 'var(--border-gold)' : 'var(--border)',
              }}
            >
              {/* L'échéance en premier : c'est elle qui décide de l'urgence. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="overline" style={{ flex: 1 }}>
                  {t(famille(d) === 'weekly' ? 'weekly' : famille(d) === 'friend' ? 'friend' : 'daily')}
                </span>
                {echeance && <Echeance date={echeance} locale={locale} />}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, color: 'var(--brand)', marginTop: 2 }} aria-hidden="true">
                  <IconeDefis size={22} />
                </span>
                <div style={{ flex: 1, minInlineSize: 0 }}>
                  <strong style={{ display: 'block' }}>{label(d.name ?? d.title) || t('challenge')}</strong>
                  {label(d.description) && (
                    <span className="caption">{label(d.description)}</span>
                  )}
                </div>
              </div>

              {cible > 0 && (
                <HizbProgress
                  value={Math.min(fait, cible)}
                  max={cible}
                  label={`${structuralNumber(fait, locale)} / ${structuralNumber(cible, locale)}`}
                />
              )}

              {(xp || gemmes) && (
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span className="overline">{t('reward')}</span>
                  {xp ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <HizbStar size={13} quarters={4} color="var(--accent)" />
                      <span className="caption data">{structuralNumber(xp, locale)} XP</span>
                    </span>
                  ) : null}
                  {gemmes ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <IconeGemmes size={13} color="var(--info)" />
                      <span className="caption data">{structuralNumber(gemmes, locale)}</span>
                    </span>
                  ) : null}
                </div>
              )}

              {termine && !reclame ? (
                <button
                  className="btn-primary"
                  disabled={occupe === id}
                  onClick={() => agir(id, () => challengesAPI.claim(id), t('claimed'))}
                >
                  {occupe === id ? `${t('wait')}…` : t('claim')}
                </button>
              ) : termine ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--accent-text)',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  <HizbStar size={14} quarters={4} color="var(--accent)" />
                  {t('claimed')}
                </span>
              ) : (d.started ?? d.isStarted) ? (
                <span className="caption">{t('inProgress')}</span>
              ) : (
                <button
                  className="btn-ghost"
                  disabled={occupe === id}
                  onClick={() => agir(id, () => challengesAPI.start(id), t('startedMsg'))}
                >
                  {t('start')}
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Temps restant.
 *
 * Exprimé en heures sous la journée, en jours au-delà : une échéance à
 * quarante heures ne se lit pas en minutes, et une échéance à trois heures ne
 * se lit pas en jours.
 */
function Echeance({ date, locale }: { date: string; locale: string }) {
  const { t } = useTranslation('challenges');

  const restant = new Date(date).getTime() - Date.now();
  if (Number.isNaN(restant)) return null;

  if (restant <= 0) {
    return <span className="caption" style={{ color: 'var(--danger)' }}>{t('expired')}</span>;
  }

  const heures = Math.floor(restant / 3_600_000);
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const texte =
    heures < 24
      ? format.format(Math.max(1, heures), 'hour')
      : format.format(Math.round(heures / 24), 'day');

  return (
    <span className="caption" style={{ color: heures < 6 ? 'var(--warning)' : 'var(--text-muted)' }}>
      {t('timeLeft', { time: texte })}
    </span>
  );
}
