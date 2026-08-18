/**
 * Mushaf — lecture des 604 pages avec masquage progressif.
 *
 * C'est l'écran le plus important du produit, et celui qui exige le plus de
 * soin typographique. Le texte coranique y était rendu comme du texte
 * ordinaire, sans encadrement ni respect de la mise en page du codex.
 *
 * Ce qui change :
 *
 * **La page devient une page.** Bloc centré à 720 px, fond en creux, encadré
 * d'un double filet — extérieur or, intérieur neutre, 6 px d'écart — comme
 * l'encadrement d'un mushaf imprimé.
 *
 * **Les numéros structurels passent en chiffres arabo-indiens en locale
 * arabe** : page, juz et hizb. Les statistiques restent en chiffres latins
 * partout, car un chiffre mal lu y coûte plus cher qu'une incohérence.
 *
 * **La justification est refusée.** Le kashida — l'étirement des liaisons qui
 * justifie une ligne arabe — ne se simule pas avec `text-justify`. Le
 * navigateur écarterait les mots, ce qui donne une page cassée. Chaque ligne
 * du mushaf est donc centrée telle qu'elle est découpée par la source.
 *
 * **RTL toujours**, quelle que soit la locale de l'interface : un francophone
 * lisant l'application en français voit le mushaf dans son sens.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { quranAPI } from '../services/api';
import { structuralNumber } from '../i18n/nombres';
import { HizbStar } from '../components/Ornements';

const TOTAL_PAGES = 604;

interface Word {
  text: string;
  position: number;
  isEnd?: boolean;
  verseKey: string;
}

interface Page {
  page: number;
  juz: number | null;
  hizb: number | null;
  lines: { line: number; words: Word[] }[];
}

type NiveauMasquage = 0 | 1 | 2 | 3;

/**
 * Quatre niveaux, du texte complet au silence total. Chaque niveau retire un
 * appui : c'est la progression que décrit la méthode, pas un simple
 * interrupteur.
 */
const NIVEAUX: { cle: string; reveler: (i: number) => 'plein' | 'indice' | 'masque' }[] = [
  { cle: 'maskNone', reveler: () => 'plein' },
  { cle: 'maskPartial', reveler: (i) => (i === 0 ? 'plein' : 'indice') },
  { cle: 'maskFirst', reveler: () => 'indice' },
  { cle: 'maskAll', reveler: () => 'masque' },
];

export default function MushafPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['mushaf', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [niveau, setNiveau] = useState<NiveauMasquage>(0);
  const [devoiles, setDevoiles] = useState<Set<string>>(new Set());

  const charger = useCallback(async (cible: number) => {
    setChargement(true);
    setErreur(null);
    try {
      const reponse: any = await quranAPI.page(cible);
      setData(reponse?.data ?? reponse);
      setDevoiles(new Set());
    } catch {
      setErreur('indisponible');
      setData(null);
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    charger(page);
  }, [page, charger]);

  const actif = NIVEAUX[niveau];

  const basculerMot = (cle: string) => {
    if (niveau === 0) return;
    setDevoiles((prec) => {
      const suivant = new Set(prec);
      suivant.has(cle) ? suivant.delete(cle) : suivant.add(cle);
      return suivant;
    });
  };

  const rendreMot = (mot: Word, index: number) => {
    const cle = `${mot.verseKey}-${mot.position}`;

    // Le rond de fin de verset porte son numéro : il structure la page et
    // n'est jamais masqué, même au niveau le plus fort.
    if (mot.isEnd) {
      return (
        <span key={cle} style={{ color: 'var(--accent)', margin: '0 4px' }}>
          {mot.text}
        </span>
      );
    }

    const etat = devoiles.has(cle) ? 'plein' : actif.reveler(index);

    const commun = {
      onClick: () => basculerMot(cle),
      onDoubleClick: () => {
        const [s, a] = mot.verseKey.split(':');
        navigate(`/mot-a-mot/${s}/${a}`);
      },
      style: { cursor: niveau === 0 ? 'default' : 'pointer', margin: '0 4px' } as const,
    };

    if (etat === 'plein') {
      return <span key={cle} {...commun}>{mot.text}</span>;
    }

    return (
      <span
        key={cle}
        {...commun}
        // Le mot masqué garde sa largeur approximative : sans cela la ligne se
        // réorganise à chaque révélation et l'œil perd son repère.
        style={{
          ...commun.style,
          color: 'var(--text-faint)',
          background: 'var(--surface-hover)',
          borderRadius: 4,
          padding: '0 6px',
          minInlineSize: etat === 'masque' ? `${Math.max(1, mot.text.length) * 0.5}em` : undefined,
          display: etat === 'masque' ? 'inline-block' : undefined,
        }}
      >
        {etat === 'indice' ? `${Array.from(mot.text)[0] ?? ''}…` : ' '}
      </span>
    );
  };

  const num = (n: number | null | undefined) =>
    n == null ? '' : structuralNumber(n, locale);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* --- Situation dans le codex ------------------------------------- */}
      <header style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <h1 className="display-md" style={{ margin: 0, flex: 1 }}>
          {t('title')}
        </h1>
        <span className="caption">
          {t('pageOf', { page: num(data?.page ?? page), juz: num(data?.juz), hizb: num(data?.hizb) })}
        </span>
      </header>

      {/* --- La page ------------------------------------------------------ */}
      <div
        style={{
          maxWidth: 'var(--mushaf-max)',
          margin: '0 auto',
          width: '100%',
          // Double filet : extérieur or, intérieur neutre, 6 px d'écart.
          border: '1px solid var(--border-gold)',
          borderRadius: 'var(--radius-md)',
          padding: 6,
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--surface-sunken)',
            padding: '28px 24px',
            minHeight: 420,
          }}
        >
          {/* En-tête de page : le numéro dans un octogone doré, à la manière
              des cartouches du mushaf. */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingBottom: 16,
              marginBottom: 20,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <span className="overline" style={{ flex: 1 }}>
              {data?.juz ? `${t('juzLabel')} ${num(data.juz)}` : ''}
            </span>
            <span
              className="data"
              style={{
                display: 'grid',
                placeItems: 'center',
                minWidth: 40,
                height: 32,
                padding: '0 10px',
                border: '1px solid var(--border-gold)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-text)',
              }}
            >
              {num(data?.page ?? page)}
            </span>
          </div>

          {chargement ? (
            <div style={{ display: 'grid', gap: 14 }} aria-busy="true">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 30,
                    borderRadius: 6,
                    background: 'var(--surface-hover)',
                    inlineSize: `${95 - i * 7}%`,
                    marginInlineStart: 'auto',
                  }}
                />
              ))}
            </div>
          ) : erreur ? (
            <div role="alert" style={{ display: 'grid', gap: 12, justifyItems: 'center', padding: 32 }}>
              <HizbStar size={40} quarters={0} color="var(--text-faint)" />
              <p className="caption" style={{ margin: 0 }}>{t('unavailable')}</p>
              <button className="btn-ghost" onClick={() => charger(page)}>
                {t('common:retry')}
              </button>
            </div>
          ) : (
            <div
              // `lang` et `dir` explicites : le lecteur d'écran bascule de voix
              // et la page reste en RTL même quand l'interface est en français.
              lang="ar"
              dir="rtl"
              className="quran quran-lg"
              style={{ textAlign: 'center' }}
            >
              {data?.lines.map((ligne) => (
                <div key={ligne.line}>{ligne.words.map((m, i) => rendreMot(m, i))}</div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Contrôle de masquage ----------------------------------------- */}
      <div
        className="card"
        style={{
          position: 'sticky',
          bottom: 16,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
          maxWidth: 'var(--mushaf-max)',
          margin: '0 auto',
          width: '100%',
          boxShadow: 'var(--e2)',
        }}
      >
        <span className="overline" style={{ marginInlineEnd: 4 }}>{t('maskLabel')}</span>

        <div role="tablist" aria-label={t('maskLabel')} style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {NIVEAUX.map((n, i) => (
            <button
              key={n.cle}
              role="tab"
              aria-selected={niveau === i}
              className={niveau === i ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '6px 12px', fontSize: 14, minHeight: 36 }}
              onClick={() => {
                setNiveau(i as NiveauMasquage);
                setDevoiles(new Set());
              }}
            >
              {t(n.cle)}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {niveau > 0 && <span className="caption">{t('reveal')}</span>}
      </div>

      {/* --- Navigation ---------------------------------------------------- */}
      <nav
        style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}
        aria-label={t('jumpTo')}
      >
        <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <span className="chevron" aria-hidden="true">←</span> {t('previousPage')}
        </button>

        <input
          type="number"
          min={1}
          max={TOTAL_PAGES}
          value={page}
          onChange={(e) => {
            const suivant = Number(e.target.value);
            if (suivant >= 1 && suivant <= TOTAL_PAGES) setPage(suivant);
          }}
          aria-label={t('jumpTo')}
          className="data"
          style={{ width: 90, textAlign: 'center' }}
        />
        <span className="caption">/ {TOTAL_PAGES}</span>

        <button className="btn-ghost" disabled={page >= TOTAL_PAGES} onClick={() => setPage(page + 1)}>
          {t('nextPage')} <span className="chevron" aria-hidden="true">→</span>
        </button>
      </nav>
    </div>
  );
}
