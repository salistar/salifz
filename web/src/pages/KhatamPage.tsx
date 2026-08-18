/**
 * Khatam collaboratif — le plateau des 60 hizb.
 *
 * C'est le concept le plus fort du produit : les 60 hizb répartis entre les
 * membres d'une halaqa, chacun lit sa part, le groupe achève le Coran
 * ensemble. Il n'était pas montré — un champ « Titre du khatam » posé sans
 * contexte et une phrase d'état vide.
 *
 * Ce qui change : **le plateau devient l'écran**. Soixante étoiles en grille,
 * chacune remplie par quarts selon l'avancée de son hizb. On voit le concept
 * avant même de l'utiliser — la grille s'affiche en contour désaturé derrière
 * l'état vide.
 *
 * Les événements temps réel restent ceux du mobile : une progression
 * enregistrée depuis le téléphone apparaît ici sans rechargement.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { khatamAPI } from '../services/api';
import { connectRealtime } from '../services/realtime';
import { useResource, asList, StateBlock } from '../components/useResource';
import { HizbStar, SeparateurSection } from '../components/Ornements';
import { structuralNumber } from '../i18n/nombres';

const TOTAL_HIZB = 60;

interface Khatam {
  _id: string;
  title?: string;
  name?: string;
  progress?: { currentKhatamProgress?: number; totalCompleted?: number; khatamCount?: number };
  readingConfig?: { unit?: string; amountPerDay?: number };
  participants?: any[];
  hizbs?: { number: number; status?: string; assignedTo?: { displayName?: string; username?: string } }[];
}

export default function KhatamPage() {
  const { t, i18n } = useTranslation(['khatam', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  const mien = useResource<any>(() => khatamAPI.mine(), []);
  const [direct, setDirect] = useState<Record<string, number>>({});
  const [titre, setTitre] = useState('');
  const [avis, setAvis] = useState<string | null>(null);

  const liste: Khatam[] = asList(mien.data, 'khatams', 'khatam');

  useEffect(() => {
    const socket = connectRealtime();

    const surProgression = (charge: any) => {
      if (!charge?.khatamId) return;
      setDirect((prec) => ({ ...prec, [charge.khatamId]: charge.progress ?? 0 }));
    };
    const surAchevement = () => setAvis(t('completed'));

    socket.on('khatamProgressUpdate', surProgression);
    socket.on('khatamCompleted', surAchevement);
    liste.forEach((k) => socket.emit('joinKhatam', { khatamId: k._id }));

    return () => {
      socket.off('khatamProgressUpdate', surProgression);
      socket.off('khatamCompleted', surAchevement);
      liste.forEach((k) => socket.emit('leaveKhatam', { khatamId: k._id }));
    };
  }, [liste, t]);

  const creer = async () => {
    if (!titre.trim()) return;
    try {
      await khatamAPI.create({
        title: titre.trim(),
        readingConfig: { unit: 'hizb', amountPerDay: 1 },
      });
      setTitre('');
      mien.reload();
    } catch (e: any) {
      setAvis(e?.error ?? t('common:errorGeneric'));
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <header>
        <h1 className="display-md" style={{ margin: '0 0 6px' }}>{t('title')}</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: 620, lineHeight: 1.7 }}>
          {t('intro')}
        </p>
      </header>

      {avis && (
        <div className="card" role="status" style={{ borderColor: 'var(--border-gold)' }}>
          {avis}
        </div>
      )}

      <StateBlock loading={mien.loading} error={mien.error} onRetry={mien.reload} />

      {/* --- Aucun khatam : on montre le plateau quand même ---------------- */}
      {!mien.loading && liste.length === 0 && (
        <section className="sacred-card" style={{ display: 'grid', gap: 20, justifyItems: 'center' }}>
          {/* La grille désaturée derrière le texte fait comprendre le concept
              sans l'avoir utilisé — c'est ce qui manquait le plus. */}
          <PlateauHizb khatam={null} locale={locale} attenue />

          <div style={{ textAlign: 'center', maxWidth: 460 }}>
            <strong className="title-lg" style={{ display: 'block', marginBottom: 8 }}>
              {t('emptyTitle')}
            </strong>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.7 }}>{t('emptyBody')}</p>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', maxWidth: 460 }}>
            <input
              style={{ flex: 1, minWidth: 200 }}
              placeholder={t('name')}
              aria-label={t('name')}
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
            <button className="btn-primary" onClick={creer} disabled={!titre.trim()}>
              {t('create')}
            </button>
          </div>
        </section>
      )}

      {/* --- Khatams en cours --------------------------------------------- */}
      {liste.map((k) => {
        const pourcent = Math.round(direct[k._id] ?? k.progress?.currentKhatamProgress ?? 0);
        const acheves = Math.round((pourcent / 100) * TOTAL_HIZB);

        return (
          <section key={k._id} className="sacred-card" style={{ display: 'grid', gap: 18 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <strong className="title-lg" style={{ flex: 1 }}>
                {k.title ?? k.name ?? t('title')}
              </strong>
              <span className="caption">
                {t('halaqat:members', { count: k.participants?.length ?? 0 })}
              </span>
            </div>

            {/* Anneau de progression : le chiffre global avant le détail. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <AnneauKhatam pourcent={pourcent} />
              <div>
                <div className="data-xl" style={{ color: 'var(--accent-text)' }}>
                  {structuralNumber(acheves, locale)} / {structuralNumber(TOTAL_HIZB, locale)}
                </div>
                <div className="overline">{t('progress', { done: acheves })}</div>
              </div>
            </div>

            <SeparateurSection />

            <PlateauHizb khatam={k} locale={locale} acheves={acheves} />

            <button className="btn-ghost" style={{ justifySelf: 'start' }}>
              {t('takeHizb')}
            </button>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Le plateau : soixante étoiles en grille.
 *
 * Une étoile par hizb, remplie par quarts. C'est la même unité visuelle que
 * partout ailleurs dans le produit, et ici elle correspond exactement à la
 * réalité : le rub' el hizb marque les quarts de hizb dans le mushaf.
 */
function PlateauHizb({
  khatam,
  locale,
  acheves = 0,
  attenue = false,
}: {
  khatam: Khatam | null;
  locale: string;
  acheves?: number;
  attenue?: boolean;
}) {
  const { t } = useTranslation('khatam');

  const parNumero = useMemo(() => {
    const table: Record<number, any> = {};
    for (const h of khatam?.hizbs ?? []) table[h.number] = h;
    return table;
  }, [khatam]);

  return (
    <div
      style={{
        display: 'grid',
        // Six colonnes sur dix rangées : la grille reste lisible d'un coup
        // d'œil et tient sur un écran étroit en se resserrant.
        gridTemplateColumns: 'repeat(auto-fit, minmax(34px, 1fr))',
        gap: 6,
        maxWidth: 420,
        margin: '0 auto',
        opacity: attenue ? 0.45 : 1,
      }}
      role="group"
      aria-label={t('progress', { done: acheves })}
    >
      {Array.from({ length: TOTAL_HIZB }, (_, i) => {
        const numero = i + 1;
        const h = parNumero[numero];
        const pris = Boolean(h?.assignedTo);
        const fait = h?.status === 'completed' || h?.status === 'verified' || numero <= acheves;
        const nom = h?.assignedTo?.displayName ?? h?.assignedTo?.username;

        return (
          <div
            key={numero}
            title={
              fait ? `${numero} — ${t('completed')}`
                : pris ? `${numero} — ${t('hizbTaken', { name: nom })}`
                : `${numero} — ${t('hizbFree')}`
            }
            style={{ display: 'grid', placeItems: 'center', aspectRatio: '1' }}
          >
            <HizbStar
              size={30}
              quarters={fait ? 4 : pris ? 2 : 0}
              color={fait ? 'var(--accent)' : pris ? 'var(--brand)' : 'var(--border-strong)'}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Anneau global. Le SVG plutôt qu'une barre : le khatam est un cycle, pas une
 *  ligne — et la forme le dit sans qu'on l'explique. */
function AnneauKhatam({ pourcent }: { pourcent: number }) {
  const rayon = 34;
  const circonference = 2 * Math.PI * rayon;

  return (
    <div style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 84, height: 84 }}>
      <svg width="84" height="84" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx="42" cy="42" r={rayon} fill="none" stroke="var(--surface-sunken)" strokeWidth="7" />
        <circle
          cx="42" cy="42" r={rayon} fill="none"
          stroke="var(--accent)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - pourcent / 100)}
          style={{ transition: 'stroke-dashoffset 320ms var(--ease)' }}
        />
      </svg>
      <span className="data" style={{ position: 'absolute', fontSize: 16 }}>{pourcent} %</span>
    </div>
  );
}
