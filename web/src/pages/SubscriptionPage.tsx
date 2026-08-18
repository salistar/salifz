/**
 * Abonnement.
 *
 * Aucun paiement ne part d'ici, et c'est délibéré : les offres passent par
 * l'App Store et Google Play, dont le reçu est ensuite validé par le serveur.
 * Un bouton « payer » sur le web donnerait un parcours que rien n'honore, et
 * les deux boutiques refusent qu'un contenu numérique soit vendu hors de leur
 * système de facturation.
 *
 * La page assume donc son rôle : elle *présente*, elle ne vend pas. La carte
 * de la formule active porte le filet d'or, les autres restent neutres, et
 * l'explication figure en clair au lieu d'un bouton grisé qu'on croirait
 * cassé.
 */

import { useTranslation } from 'react-i18next';
import { subscriptionsAPI } from '../services/api';
import { useResource, asList, unwrap, StateBlock } from '../components/useResource';
import { useLabel } from '../services/i18n';
import { HizbStar, ZelligeField } from '../components/Ornements';
import { IconeAbonnement } from '../components/Icones';
import { structuralNumber } from '../i18n/nombres';
import { formaterDate } from '../i18n';

export default function SubscriptionPage() {
  const label = useLabel();
  const { t, i18n } = useTranslation(['subscription', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  const offres = useResource<any>(() => subscriptionsAPI.plans(), []);
  const etat = useResource<any>(() => subscriptionsAPI.status(), []);

  const liste = asList(offres.data, 'plans', 'items');
  const abonnement = unwrap(etat.data)?.subscription ?? unwrap(etat.data) ?? {};
  const plan = abonnement.plan ?? 'free';
  const actif = abonnement.status === 'active';

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <h1 className="display-md" style={{ margin: 0 }}>{t('title')}</h1>

      <StateBlock loading={etat.loading} error={etat.error} onRetry={etat.reload} />

      {/* --- Formule actuelle ---------------------------------------------- */}
      <section
        className="sacred-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <ZelligeField style={{ position: 'absolute', inset: 0, color: 'var(--accent)' }} opacity={0.035} />

        <span style={{ position: 'relative', color: 'var(--brand)' }} aria-hidden="true">
          <IconeAbonnement size={26} />
        </span>

        <div style={{ position: 'relative', flex: 1, minInlineSize: 190 }}>
          <span className="overline">{t('current')}</span>
          <strong className="title-lg" style={{ display: 'block', marginBlockStart: 2 }}>
            {plan === 'free' ? t('free') : label(abonnement.planName) || plan}
          </strong>
          {actif && abonnement.renewsAt && (
            <span className="caption">
              {t('renewsOn', { date: formaterDate(abonnement.renewsAt, locale) })}
            </span>
          )}
        </div>

        <span
          className="caption"
          style={{
            position: 'relative',
            padding: '5px 14px',
            borderRadius: 'var(--radius-pill)',
            border: `1px solid ${actif ? 'var(--border-gold)' : 'var(--border)'}`,
            color: actif ? 'var(--accent-text)' : 'var(--text-muted)',
          }}
        >
          {actif ? t('active') : t('none')}
        </span>
      </section>

      <StateBlock
        loading={offres.loading}
        error={offres.error}
        empty={!offres.loading && liste.length === 0}
        emptyText={t('empty')}
        onRetry={offres.reload}
      />

      {/* --- Les formules --------------------------------------------------- */}
      <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(248px, 1fr))' }}>
        {liste.map((o: any, i: number) => {
          const id = o.id ?? o.planId ?? String(i);
          const courant = id === plan;
          const avantages: any[] = o.features ?? o.benefits ?? [];

          return (
            <article
              key={id}
              className={courant ? 'sacred-card' : 'card'}
              style={{ display: 'grid', gap: 14, alignContent: 'start' }}
            >
              <div>
                <h2 className="title-md" style={{ margin: '0 0 6px' }}>{label(o.name) || id}</h2>
                <p className="data-xl" style={{ margin: 0, fontSize: 26, color: 'var(--accent-text)' }}>
                  {o.price != null
                    ? `${structuralNumber(o.price, locale)} ${o.currency ?? '€'}`
                    : '—'}
                  {o.period && (
                    <span className="caption" style={{ fontSize: 14 }}> / {o.period}</span>
                  )}
                </p>
              </div>

              {avantages.length > 0 && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <span className="overline">{t('benefits')}</span>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 7 }}>
                    {avantages.map((f, k) => (
                      <li
                        key={k}
                        style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14 }}
                      >
                        {/* L'étoile de hizb à la place du crochet : la même
                            marque que partout ailleurs dans le produit. */}
                        <span style={{ flexShrink: 0, marginBlockStart: 3 }} aria-hidden="true">
                          <HizbStar size={11} quarters={4} color="var(--accent)" />
                        </span>
                        <span style={{ color: 'var(--text-secondary)' }}>{label(f)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {courant ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    color: 'var(--accent-text)',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  <HizbStar size={14} quarters={4} color="var(--accent)" />
                  {t('active')}
                </span>
              ) : (
                <span className="caption" style={{ lineHeight: 1.6 }}>{t('mobileOnly')}</span>
              )}
            </article>
          );
        })}
      </div>

      <p className="caption" style={{ margin: 0, lineHeight: 1.75, maxInlineSize: 620 }}>
        {t('whyNoPayment')}
      </p>
    </div>
  );
}
