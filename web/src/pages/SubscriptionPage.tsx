/**
 * Abonnement.
 *
 * Aucun paiement ne part d'ici, et c'est délibéré : les offres passent par
 * l'App Store et Google Play, dont le reçu est ensuite validé par le serveur.
 * Un bouton « payer » sur le web donnerait un parcours que rien n'honore, et
 * les deux boutiques refusent qu'un contenu numérique soit vendu hors de leur
 * système de facturation.
 */

import { subscriptionsAPI } from '../services/api';
import { useResource, asList, unwrap, StateBlock } from '../components/useResource';
import { label } from '../services/i18n';


export default function SubscriptionPage() {
  const offres = useResource<any>(() => subscriptionsAPI.plans(), []);
  const etat = useResource<any>(() => subscriptionsAPI.status(), []);

  const liste = asList(offres.data, 'plans', 'items');
  const abonnement = unwrap(etat.data)?.subscription ?? unwrap(etat.data) ?? {};
  const plan = abonnement.plan ?? 'free';

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Abonnement</h1>

      <StateBlock loading={etat.loading} error={etat.error} onRetry={etat.reload} />

      <section
        className="card"
        style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Formule actuelle</span>
          <strong style={{ display: 'block', fontSize: 20 }}>
            {plan === 'free' ? 'Gratuite' : label(abonnement.planName) || plan}
          </strong>
        </div>

        <span
          style={{
            padding: '6px 14px',
            borderRadius: 20,
            background: abonnement.status === 'active' ? 'var(--primary-soft)' : 'var(--background-alt)',
            color: abonnement.status === 'active' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {abonnement.status === 'active' ? 'Active' : 'Aucun abonnement payant'}
        </span>
      </section>

      <StateBlock
        loading={offres.loading}
        error={offres.error}
        empty={!offres.loading && liste.length === 0}
        emptyText="Aucune formule publiée pour le moment."
        onRetry={offres.reload}
      />

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {liste.map((o: any, i: number) => {
          const id = o.id ?? o.planId ?? String(i);
          const courant = id === plan;
          const avantages: any[] = o.features ?? o.benefits ?? [];

          return (
            <article
              key={id}
              className="card"
              style={{
                display: 'grid',
                gap: 12,
                alignContent: 'start',
                borderColor: courant ? 'var(--primary)' : 'var(--border)',
                borderWidth: courant ? 2 : 1,
              }}
            >
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>{label(o.name) || id}</h2>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--primary-dark)' }}>
                  {o.price != null ? `${o.price} ${o.currency ?? '€'}` : '—'}
                  {o.period && (
                    <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>
                      {' '}/ {o.period}
                    </span>
                  )}
                </p>
              </div>

              {avantages.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                  {avantages.map((f, k) => (
                    <li key={k} style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)', fontSize: 14 }}>
                      <span aria-hidden="true" style={{ color: 'var(--primary)' }}>✓</span>
                      {label(f)}
                    </li>
                  ))}
                </ul>
              )}

              {courant ? (
                <span style={{ color: 'var(--primary-dark)', fontWeight: 600, fontSize: 14 }}>
                  ✓ Formule active
                </span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
                  Souscription depuis l’application mobile.
                </span>
              )}
            </article>
          );
        })}
      </div>

      <p
        className="card"
        style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}
      >
        Les abonnements se souscrivent et se résilient depuis l’App Store ou
        Google Play. Le serveur n’accorde une formule qu’après avoir validé le
        reçu auprès de la boutique : aucune offre ne peut être obtenue en
        appelant l’API directement.
      </p>
    </div>
  );
}
