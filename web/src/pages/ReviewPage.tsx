/**
 * Révision — la file de répétition espacée.
 *
 * C'est le cœur de la promesse du produit — « sans perdre ce qui est acquis » —
 * et c'était l'écran le plus pauvre : un croissant, une phrase, un bouton.
 * L'utilisateur ne comprenait ni comment la file se remplit, ni quand revenir.
 *
 * Ce qui change : rendre l'algorithme **lisible**, parce que la confiance dans
 * la révision est ce qui fait revenir.
 *
 * Un calendrier de charge sur quatorze jours ouvre l'écran — une étoile par
 * jour, remplie à proportion de ce qu'il y a à revoir. C'est le seul graphique
 * de la page, et il dit une chose vraie : ce qui vient.
 *
 * « En retard » est en safran, jamais en rouge. On ne culpabilise pas
 * quelqu'un sur sa pratique religieuse.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { progressAPI } from '../services/api';
import { useResource, asList, StateBlock } from '../components/useResource';
import { HizbStar, MihrabArch } from '../components/Ornements';
import { structuralNumber } from '../i18n/nombres';

export default function ReviewPage() {
  const { t, i18n } = useTranslation(['review', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  const file = useResource<any>(() => progressAPI.reviewQueue(), []);
  const [index, setIndex] = useState(0);
  const [devoile, setDevoile] = useState(false);
  const [occupe, setOccupe] = useState(false);

  const versets = asList(file.data, 'queue', 'reviewQueue', 'verses', 'items');
  const courant = versets[index];

  /**
   * Charge par jour sur quatorze jours. Un verset sans échéance compte pour
   * aujourd'hui : mieux vaut le proposer que le laisser disparaître de la vue.
   */
  const charge = useMemo(() => {
    const jours: { date: Date; nombre: number; passe: boolean }[] = [];
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(aujourdhui);
      d.setDate(d.getDate() + i);
      jours.push({ date: d, nombre: 0, passe: false });
    }

    for (const v of versets) {
      const brut = v.nextReviewAt ?? v.dueAt ?? v.nextReview;
      const echeance = brut ? new Date(brut) : aujourdhui;
      echeance.setHours(0, 0, 0, 0);
      const ecart = Math.round((echeance.getTime() - aujourdhui.getTime()) / 86400000);
      // Le retard s'ajoute à aujourd'hui : c'est bien ce qu'il reste à faire.
      const cible = ecart < 0 ? 0 : ecart;
      if (cible < 14) jours[cible].nombre += 1;
    }

    return jours;
  }, [versets]);

  const enRetard = useMemo(
    () =>
      versets.filter((v: any) => {
        const brut = v.nextReviewAt ?? v.dueAt ?? v.nextReview;
        return brut && new Date(brut).getTime() < Date.now();
      }).length,
    [versets]
  );

  const maxCharge = Math.max(1, ...charge.map((j) => j.nombre));
  const dues = charge[0]?.nombre ?? 0;
  // Une révision prend une trentaine de secondes en moyenne ; l'estimation
  // vaut mieux qu'un nombre nu pour décider de commencer maintenant ou non.
  const minutes = Math.max(1, Math.round((dues * 30) / 60));

  const repondre = async (facile: boolean) => {
    if (!courant) return;
    setOccupe(true);
    try {
      const surah = courant.surahNumber ?? courant.surah ?? courant.number;
      const ayah = courant.ayahNumber ?? courant.verseNumber ?? courant.ayah;
      if (surah && ayah) {
        await progressAPI.markVerse(surah, ayah, { quality: facile ? 5 : 2, reviewed: true });
      }
    } catch {
      /* Une réponse perdue vaut mieux qu'un écran bloqué : on avance. */
    } finally {
      setOccupe(false);
      setDevoile(false);
      setIndex((i) => i + 1);
    }
  };

  /* ------------------------------------------------------------------ */
  /* État vide — le cas courant tant qu'on n'a rien mémorisé            */
  /* ------------------------------------------------------------------ */
  if (!file.loading && versets.length === 0) {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <h1 className="display-md" style={{ margin: 0 }}>{t('title')}</h1>

        <div
          className="sacred-card"
          style={{ display: 'grid', gap: 16, justifyItems: 'center', padding: 40, textAlign: 'center' }}
        >
          <MihrabArch style={{ width: 130 }} />
          <strong className="title-lg">{t('emptyTitle')}</strong>
          <p style={{ margin: 0, maxWidth: 440, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {t('emptyBody')}
          </p>
          <Link to="/lecons" className="btn-primary" style={{ textDecoration: 'none' }}>
            {t('goToLessons')}
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Série terminée                                                      */
  /* ------------------------------------------------------------------ */
  if (index >= versets.length && versets.length > 0) {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <h1 className="display-md" style={{ margin: 0 }}>{t('title')}</h1>
        <div
          className="sacred-card"
          style={{ display: 'grid', gap: 16, justifyItems: 'center', padding: 40 }}
        >
          <HizbStar size={56} quarters={4} color="var(--accent)" />
          <strong className="title-lg">{t('sessionDone')}</strong>
          <p className="caption" style={{ margin: 0 }}>
            {t('verses', { count: versets.length, ns: 'lessons' })}
          </p>
          <button className="btn-ghost" onClick={() => { setIndex(0); file.reload(); }}>
            {t('common:retry')}
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Session de révision                                                 */
  /* ------------------------------------------------------------------ */
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 className="display-md" style={{ margin: 0, flex: 1 }}>{t('title')}</h1>
        {versets.length > 0 && (
          <span className="data caption">
            {structuralNumber(index + 1, locale)} / {structuralNumber(versets.length, locale)}
          </span>
        )}
      </div>

      {/* --- Calendrier de charge : le seul graphique, et il est vrai ----- */}
      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <Chiffre valeur={dues} libelle={t('dueToday')} />
          <Chiffre valeur={enRetard} libelle={t('overdue')} couleur="var(--warning)" />
          <Chiffre valeur={t('estimate', { minutes })} libelle={t('nextDue')} />
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
          {charge.map((j, i) => (
            <div key={i} style={{ flex: 1, display: 'grid', justifyItems: 'center', gap: 4 }}>
              <HizbStar
                size={18}
                quarters={Math.min(4, Math.ceil((j.nombre / maxCharge) * 4)) as 0 | 1 | 2 | 3 | 4}
                color={i === 0 ? 'var(--accent)' : 'var(--brand)'}
                label={`${j.nombre}`}
              />
              {/* Aujourd'hui est souligné d'or : le repère se lit sans compter. */}
              <span
                style={{
                  inlineSize: '100%',
                  blockSize: 2,
                  background: i === 0 ? 'var(--accent)' : 'transparent',
                }}
              />
            </div>
          ))}
        </div>
      </section>

      <StateBlock loading={file.loading} error={file.error} onRetry={file.reload} />

      {courant && (
        <section className="sacred-card" style={{ display: 'grid', gap: 20 }}>
          <span className="overline">
            {t('lessons:juz', { n: '' }).trim()} {structuralNumber(courant.surahNumber ?? courant.surah, locale)}
            {' · '}
            {structuralNumber(courant.ayahNumber ?? courant.verseNumber ?? courant.ayah, locale)}
          </span>

          {devoile ? (
            <p lang="ar" dir="rtl" className="quran quran-md" style={{ margin: 0, textAlign: 'center' }}>
              {courant.text ?? courant.textArabic ?? courant.arabic ?? '—'}
            </p>
          ) : (
            // Le texte reste masqué jusqu'à la demande : réviser consiste à se
            // souvenir d'abord, vérifier ensuite. L'inverse n'apprend rien.
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                minHeight: 140,
                background: 'var(--surface-sunken)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-faint)',
                textAlign: 'center',
                padding: 20,
              }}
            >
              {t('reciteFirst')}
            </div>
          )}

          {devoile ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-danger" style={{ flex: 1 }} disabled={occupe} onClick={() => repondre(false)}>
                {t('reviewSoon')}
              </button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={occupe} onClick={() => repondre(true)}>
                {t('knewIt')}
              </button>
            </div>
          ) : (
            <button className="btn-ghost" onClick={() => setDevoile(true)}>
              {t('reveal')}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

function Chiffre({
  valeur,
  libelle,
  couleur = 'var(--text)',
}: {
  valeur: number | string;
  libelle: string;
  couleur?: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 110 }}>
      <div className="data-xl" style={{ color: couleur, fontSize: 26 }}>{valeur}</div>
      <div className="overline">{libelle}</div>
    </div>
  );
}
