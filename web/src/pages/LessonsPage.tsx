/**
 * Leçons — l'index du mushaf.
 *
 * C'était une liste plate de 114 cartes identiques : progression invisible,
 * recherche reléguée sur le côté, aucun regroupement. On ne retrouvait rien.
 *
 * Ce qui change :
 *
 * **La liste devient un index.** Numéro de sourate dans un octogone à filet
 * d'or, nom arabe en typographie coranique, translittération et nombre de
 * versets en légende, progression en barre à jalon.
 *
 * **La structure du mushaf devient visible.** Des séparateurs de juz sont
 * insérés dans le défilement : la découpe réelle du codex apparaît au lieu
 * d'une suite indifférenciée.
 *
 * **La recherche accepte les trois entrées** — arabe, translittération et
 * numéro. Quelqu'un qui cherche « البقرة », « Al-Baqara » ou « 2 » doit
 * trouver la même chose.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { quranAPI, progressAPI } from '../services/api';
import { useResource, asList, unwrap, StateBlock } from '../components/useResource';
import { HizbStar, SeparateurSection } from '../components/Ornements';
import { structuralNumber } from '../i18n/nombres';

interface Sourate {
  number: number;
  name: string;
  englishName: string;
  ayahs: number;
  type: 'Meccan' | 'Medinan';
}

type Filtre = 'toutes' | 'encours' | 'faites' | 'jamais';

/**
 * Première sourate de chaque juz. Sert à insérer les séparateurs : le juz ne
 * commence pas toujours sur une frontière de sourate, mais c'est le repère
 * qu'utilisent les mémorisateurs pour se situer.
 */
const DEBUTS_DE_JUZ: Record<number, number> = {
  1: 1, 2: 2, 4: 3, 6: 4, 7: 5, 8: 6, 10: 7, 11: 8, 13: 9, 15: 10,
  17: 11, 18: 12, 21: 13, 23: 14, 25: 15, 27: 16, 29: 17, 33: 18,
  36: 19, 39: 20, 41: 21, 46: 22, 51: 23, 58: 24, 67: 25, 78: 26,
};

export default function LessonsPage() {
  const { t, i18n } = useTranslation(['lessons', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  const sourates = useResource<any>(() => quranAPI.surahs(), []);
  const avancement = useResource<any>(() => progressAPI.overview(), []);

  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('toutes');

  const liste: Sourate[] = useMemo(() => asList(sourates.data, 'surahs'), [sourates.data]);

  // Progression indexée : une recherche linéaire par ligne coûterait 114 × n.
  const parNumero = useMemo(() => {
    const charge = unwrap(avancement.data) ?? {};
    const entrees = Array.isArray(charge.surahs) ? charge.surahs : [];
    const table: Record<number, any> = {};
    for (const s of entrees) table[s.surahNumber ?? s.number] = s;
    return table;
  }, [avancement.data]);

  const pourcentDe = (s: Sourate) => {
    const p = parNumero[s.number];
    const memorises = p?.versesMemorized ?? p?.memorized ?? 0;
    return s.ayahs > 0 ? Math.min(100, Math.round((memorises / s.ayahs) * 100)) : 0;
  };

  const filtrees = useMemo(() => {
    const q = recherche.trim().toLowerCase();

    return liste.filter((s) => {
      if (q) {
        const correspond =
          String(s.number) === q ||
          (s.englishName ?? '').toLowerCase().includes(q) ||
          (s.name ?? '').includes(recherche.trim());
        if (!correspond) return false;
      }

      if (filtre === 'toutes') return true;
      const p = pourcentDe(s);
      if (filtre === 'faites') return p >= 100;
      if (filtre === 'encours') return p > 0 && p < 100;
      return p === 0;
    });
  }, [liste, recherche, filtre, parNumero]);

  const FILTRES: { cle: Filtre; libelle: string }[] = [
    { cle: 'toutes', libelle: t('filterAll') },
    { cle: 'encours', libelle: t('filterInProgress') },
    { cle: 'faites', libelle: t('filterDone') },
    { cle: 'jamais', libelle: t('filterNotStarted') },
  ];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <h1 className="display-md" style={{ margin: 0 }}>{t('title')}</h1>

      {/* --- Barre d'outils collante -------------------------------------- */}
      <div
        style={{
          position: 'sticky',
          top: 56,
          zIndex: 10,
          background: 'var(--bg)',
          paddingBlock: 12,
          display: 'grid',
          gap: 10,
        }}
      >
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          style={{ width: '100%' }}
        />

        <div role="tablist" aria-label={t('title')} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTRES.map((f) => (
            <button
              key={f.cle}
              role="tab"
              aria-selected={filtre === f.cle}
              className={filtre === f.cle ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '6px 14px', fontSize: 14, minHeight: 36 }}
              onClick={() => setFiltre(f.cle)}
            >
              {f.libelle}
            </button>
          ))}
        </div>
      </div>

      <StateBlock loading={sourates.loading} error={sourates.error} onRetry={sourates.reload} />

      {!sourates.loading && filtrees.length === 0 && (
        <div className="card" style={{ display: 'grid', gap: 14, justifyItems: 'center', padding: 40 }}>
          <HizbStar size={44} quarters={0} color="var(--text-faint)" />
          <p style={{ margin: 0, textAlign: 'center' }}>
            {recherche ? t('noResult', { q: recherche }) : t('common:empty')}
          </p>
          {recherche && (
            <button className="btn-ghost" onClick={() => setRecherche('')}>
              {t('clearSearch')}
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'grid', gap: 6 }}>
        {filtrees.map((s) => {
          const pourcent = pourcentDe(s);
          const juz = DEBUTS_DE_JUZ[s.number];
          // Le séparateur ne s'affiche que sur la liste complète : au milieu
          // d'un filtrage, il annoncerait une structure que la liste ne suit
          // plus.
          const montrerJuz = juz && filtre === 'toutes' && !recherche;

          return (
            <div key={s.number}>
              {montrerJuz && (
                <div style={{ margin: '20px 0 12px' }}>
                  <SeparateurSection />
                  <p className="overline" style={{ textAlign: 'center', margin: '8px 0 0' }}>
                    {t('juz', { n: structuralNumber(juz, locale) })}
                  </p>
                </div>
              )}

              <Link to={`/mot-a-mot/${s.number}/1`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <article
                  className="card carte-lien"
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14 }}
                >
                  {/* Numéro dans un octogone à filet d'or — le cartouche du
                      mushaf, repris comme repère de liste. */}
                  <span
                    aria-hidden="true"
                    className="data"
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      inlineSize: 42,
                      blockSize: 42,
                      flexShrink: 0,
                      border: '1px solid var(--border-gold)',
                      color: 'var(--accent-text)',
                      // Octogone : quatre coins coupés, pas un cercle.
                      clipPath:
                        'polygon(30% 0, 70% 0, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0 70%, 0 30%)',
                      background: 'var(--surface-sunken)',
                    }}
                  >
                    {structuralNumber(s.number, locale)}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span lang="ar" dir="rtl" className="quran quran-sm" style={{ lineHeight: 1.6 }}>
                        {s.name}
                      </span>
                      <strong style={{ fontSize: 15 }}>{s.englishName}</strong>
                      <span
                        className="caption"
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '1px 8px',
                        }}
                      >
                        {s.type === 'Meccan' ? t('meccan') : t('medinan')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                      <span className="caption">{t('verses', { count: s.ayahs })}</span>
                      <div
                        role="progressbar"
                        aria-valuenow={pourcent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t('progress', { percent: pourcent })}
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          background: 'var(--surface-sunken)',
                          border: '1px solid var(--border)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            // Propriété logique : la barre se remplit de droite
                            // à gauche en arabe, sans code conditionnel.
                            inlineSize: `${pourcent}%`,
                            blockSize: '100%',
                            background: 'var(--brand)',
                          }}
                        />
                      </div>
                      <span className="caption data" style={{ minWidth: 42, textAlign: 'end' }}>
                        {pourcent} %
                      </span>
                    </div>
                  </div>

                  <HizbStar
                    size={20}
                    quarters={Math.min(4, Math.floor(pourcent / 25)) as 0 | 1 | 2 | 3 | 4}
                    color={pourcent >= 100 ? 'var(--accent)' : 'var(--text-faint)'}
                  />
                </article>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
