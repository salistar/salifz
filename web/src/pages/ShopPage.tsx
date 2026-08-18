/**
 * Boutique — achats en gemmes.
 *
 * Les gemmes sont une monnaie interne, gagnée par l'usage : rien ici ne touche
 * à un paiement réel. Le solde affiché vient du serveur après chaque achat —
 * le décrémenter localement afficherait un solde optimiste qui divergerait au
 * premier échec.
 *
 * Ce qui change : le solde devient un bandeau, avec la phrase qui manquait —
 * *comment* on gagne des gemmes. Les articles sont regroupés par catégorie,
 * et un article trop cher indique ce qui manque au lieu d'un bouton grisé sans
 * raison.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shopAPI } from '../services/api';
import { useResource, asList, unwrap, StateBlock } from '../components/useResource';
import { useAuth } from '../store';
import { useLabel } from '../services/i18n';
import { HizbStar, ZelligeField, SeparateurSection } from '../components/Ornements';
import { IconeGemmes, IconeRecompense, IconeBoutique } from '../components/Icones';
import { structuralNumber } from '../i18n/nombres';

type Categorie = 'tout' | 'progress' | 'look' | 'bundles';

/** Le serveur nomme les catégories de plusieurs façons ; on ramène à trois. */
function categorie(item: any): Exclude<Categorie, 'tout'> {
  const brut = String(item.category ?? item.type ?? '').toLowerCase();
  if (brut.includes('bundle') || brut.includes('pack') || brut.includes('lot')) return 'bundles';
  if (brut.includes('theme') || brut.includes('avatar') || brut.includes('look') || brut.includes('cosmetic'))
    return 'look';
  return 'progress';
}

export default function ShopPage() {
  const label = useLabel();
  const { t, i18n } = useTranslation(['shop', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  const boutique = useResource<any>(() => shopAPI.items(), []);
  const quotidien = useResource<any>(() => shopAPI.daily(), []);
  const { user, restore } = useAuth();

  const [occupe, setOccupe] = useState<string | null>(null);
  const [avis, setAvis] = useState<string | null>(null);
  const [filtre, setFiltre] = useState<Categorie>('tout');

  const articles = asList(boutique.data, 'items', 'shop');
  const gemmes = user?.gamification?.gems ?? 0;

  const affiches = useMemo(
    () => (filtre === 'tout' ? articles : articles.filter((a: any) => categorie(a) === filtre)),
    [articles, filtre]
  );

  const acheter = async (article: any) => {
    const id = article._id ?? article.id ?? article.itemId;
    setOccupe(id);
    setAvis(null);
    try {
      await shopAPI.buy(id);
      setAvis(t('purchased', { item: label(article.name) || t('item') }));
      // On relit le compte : le solde fait autorité côté serveur.
      await restore();
      boutique.reload();
    } catch (e: any) {
      setAvis(e?.error ?? t('buyError'));
    } finally {
      setOccupe(null);
    }
  };

  const recuperer = async () => {
    try {
      await shopAPI.claimDaily();
      setAvis(t('rewardClaimed'));
      await restore();
      quotidien.reload();
    } catch (e: any) {
      setAvis(e?.error ?? t('buyError'));
    }
  };

  const chargeQuotidienne = unwrap(quotidien.data) ?? {};
  const recuperable = chargeQuotidienne.available ?? chargeQuotidienne.canClaim ?? false;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 className="display-md" style={{ margin: 0, flex: 1 }}>{t('title')}</h1>
        {avis && <span role="status" className="caption">{avis}</span>}
      </div>

      {/* --- Le solde, et comment il se remplit ----------------------------- */}
      <section
        className="sacred-card"
        style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          flexWrap: 'wrap',
        }}
      >
        <ZelligeField style={{ position: 'absolute', inset: 0, color: 'var(--accent)' }} opacity={0.035} />

        <span style={{ position: 'relative', color: 'var(--info)' }} aria-hidden="true">
          <IconeGemmes size={30} />
        </span>

        <div style={{ position: 'relative' }}>
          <span className="overline">{t('balanceLabel')}</span>
          <div className="data-xl" style={{ fontSize: 30, lineHeight: 1.2 }}>
            {structuralNumber(gemmes, locale)}
          </div>
        </div>

        <p className="caption" style={{ position: 'relative', flex: 1, minInlineSize: 220, margin: 0, lineHeight: 1.7 }}>
          {t('earnHint')}
        </p>
      </section>

      {/* --- Récompense du jour --------------------------------------------- */}
      {recuperable && (
        <div
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: 14, borderColor: 'var(--border-gold)' }}
        >
          <span style={{ color: 'var(--accent)' }} aria-hidden="true">
            <IconeRecompense size={24} />
          </span>
          <span style={{ flex: 1 }}>{t('dailyReward')}</span>
          <button className="btn-primary" onClick={recuperer}>{t('claimReward')}</button>
        </div>
      )}

      <SeparateurSection />

      {/* --- Catégories ------------------------------------------------------ */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([
          ['tout', t('all')],
          ['progress', t('categoryProgress')],
          ['look', t('categoryLook')],
          ['bundles', t('categoryBundles')],
        ] as const).map(([cle, libelle]) => {
          const choisi = filtre === cle;
          const nombre = cle === 'tout' ? articles.length : articles.filter((a: any) => categorie(a) === cle).length;
          if (nombre === 0 && cle !== 'tout') return null;

          return (
            <button
              key={cle}
              aria-pressed={choisi}
              onClick={() => setFiltre(cle as Categorie)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 14px',
                minHeight: 32,
                fontSize: 13,
                borderRadius: 'var(--radius-pill)',
                border: `1px solid ${choisi ? 'var(--border-gold)' : 'var(--border)'}`,
                background: choisi ? 'var(--accent-wash)' : 'transparent',
                color: choisi ? 'var(--accent-text)' : 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {libelle}
              <span className="data" style={{ fontSize: 12, opacity: 0.7 }}>
                {structuralNumber(nombre, locale)}
              </span>
            </button>
          );
        })}
      </div>

      <StateBlock
        loading={boutique.loading}
        error={boutique.error}
        empty={!boutique.loading && affiches.length === 0}
        emptyText={t('empty')}
        onRetry={boutique.reload}
      />

      {/* --- Articles -------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(208px, 1fr))', gap: 12 }}>
        {affiches.map((article: any, i: number) => {
          const id = article._id ?? article.id ?? article.itemId ?? i;
          const prix = article.price ?? article.cost ?? 0;
          const tropCher = prix > gemmes;
          const possede = article.owned ?? article.isOwned ?? false;

          return (
            <article
              key={id}
              className="card"
              style={{
                display: 'grid',
                gap: 10,
                alignContent: 'start',
                borderColor: possede ? 'var(--border-gold)' : 'var(--border)',
              }}
            >
              <span style={{ color: 'var(--brand)' }} aria-hidden="true">
                <IconeBoutique size={22} />
              </span>

              <strong>{label(article.name ?? article.title) || t('item')}</strong>

              {label(article.description) && (
                <span className="caption">{label(article.description)}</span>
              )}

              {possede ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--accent-text)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <HizbStar size={13} quarters={4} color="var(--accent)" />
                  {t('owned')}
                </span>
              ) : (
                <>
                  <button
                    className="btn-primary"
                    onClick={() => acheter(article)}
                    disabled={occupe === id || tropCher}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                  >
                    {occupe === id ? (
                      `${t('buying')}…`
                    ) : (
                      <>
                        <IconeGemmes size={14} />
                        <span className="data">{structuralNumber(prix, locale)}</span>
                      </>
                    )}
                  </button>

                  {/* Un bouton grisé sans explication laisse deviner ; on dit
                      exactement ce qui manque. */}
                  {tropCher && (
                    <small style={{ color: 'var(--text-muted)' }}>
                      {t('missingGems', { count: prix - gemmes })}
                    </small>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
