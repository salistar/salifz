/**
 * Accueil — un écran à trois temps décroissants.
 *
 * Il répond à une seule question : *qu'est-ce que je fais maintenant ?* Tout
 * le reste est secondaire, et la hiérarchie visuelle doit le dire.
 *
 * Le bandeau vert plein qui écrasait la salutation a disparu. La reprise
 * devient l'élément dominant — carte à filet d'or, arche en filigrane, un
 * seul appel à l'action au-dessus de la ligne de flottaison. Les objectifs
 * viennent ensuite, les chiffres en dernier, sans carte.
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { progressAPI, gamificationAPI, quranAPI } from '../services/api';
import { useResource, asList, unwrap } from '../components/useResource';
import { useAuth } from '../store';
import { useLabel } from '../services/i18n';
import { HizbStar, HizbProgress, ZelligeField, MihrabArch } from '../components/Ornements';
import { structuralNumber } from '../i18n/nombres';
import { dateHegirienne } from '../i18n';

export default function HomePage() {
  const label = useLabel();
  const { t, i18n } = useTranslation(['home', 'common', 'nav']);
  const locale = i18n.resolvedLanguage ?? 'fr';
  const user = useAuth((s) => s.user);
  const g: any = user?.gamification ?? {};

  const avancement = useResource<any>(() => progressAPI.overview(), []);
  const quetes = useResource<any>(() => gamificationAPI.dailyQuests(), []);
  const fileRevision = useResource<any>(() => progressAPI.reviewQueue(), []);
  const sourates = useResource<any>(() => quranAPI.surahs(), []);

  const qp = unwrap(avancement.data)?.quranProgress ?? {};
  const listeQuetes = asList(quetes.data, 'quests');
  const aReviser = asList(fileRevision.data, 'queue', 'reviewQueue', 'verses', 'items').length;

  const sourateCourante = asList(sourates.data, 'surahs').find(
    (s: any) => Number(s.number) === Number(qp.currentSurah)
  );

  const versets = qp.totalVersesMemorized ?? user?.quranProgress?.totalVersesMemorized ?? 0;
  const quetesFaites = listeQuetes.filter((q: any) => q.completed).length;
  const restantes = listeQuetes.length - quetesFaites;
  const toutFait = listeQuetes.length > 0 && restantes === 0;

  // Une seule phrase, choisie par ce qui presse le plus : réviser passe avant
  // apprendre, parce qu'un verset non révisé se perd.
  const phrase =
    aReviser > 0
      ? t('toReview', { count: aReviser })
      : restantes > 0
        ? t('goalsLeft', { count: restantes })
        : t('nothingUrgent');

  const hegire = dateHegirienne(new Date(), locale);

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {/* --- Salutation, sans bandeau ------------------------------------- */}
      <header>
        {hegire && <p className="overline" style={{ margin: '0 0 6px' }}>{hegire}</p>}
        <h1 className="display-lg" style={{ margin: '0 0 8px' }}>
          {t('greeting', { name: user?.displayName ?? user?.username })}
        </h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 17 }}>{phrase}</p>
      </header>

      {/* --- 1. La reprise, élément dominant ------------------------------ */}
      {qp.currentSurah ? (
        <Link
          to={`/mot-a-mot/${qp.currentSurah}/${qp.currentAyah ?? 1}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <section
            className="sacred-card carte-lien"
            style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 20 }}
          >
            <ZelligeField
              style={{ position: 'absolute', inset: 0, color: 'var(--accent)' }}
              opacity={0.03}
            />

            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <span className="overline">{t('resume')}</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginTop: 6 }}>
                <span lang="ar" dir="rtl" className="quran quran-sm" style={{ lineHeight: 1.5 }}>
                  {sourateCourante?.name ?? ''}
                </span>
                <strong className="title-lg">
                  {sourateCourante?.englishName ?? `${qp.currentSurah}`}
                </strong>
              </div>
              <p className="caption" style={{ margin: '4px 0 0' }}>
                {t('resumeAt', {
                  surah: sourateCourante?.englishName ?? qp.currentSurah,
                  ayah: structuralNumber(qp.currentAyah ?? 1, locale),
                })}
              </p>
            </div>

            <span
              aria-hidden="true"
              className="chevron"
              style={{ position: 'relative', color: 'var(--brand)', fontSize: 26 }}
            >
              →
            </span>
          </section>
        </Link>
      ) : (
        <Link to="/mot-a-mot/1/1" style={{ textDecoration: 'none', color: 'inherit' }}>
          <section
            className="sacred-card carte-lien"
            style={{ display: 'flex', alignItems: 'center', gap: 20 }}
          >
            <MihrabArch style={{ width: 72, flexShrink: 0 }} />
            <div>
              <span className="overline">{t('resume')}</span>
              <strong className="title-lg" style={{ display: 'block', marginTop: 4 }}>
                {t('start')}
              </strong>
            </div>
          </section>
        </Link>
      )}

      {/* --- 2. Les objectifs du jour ------------------------------------- */}
      {listeQuetes.length > 0 && (
        <section className="card" style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className="title-md" style={{ margin: 0, flex: 1 }}>{t('todayGoals')}</h2>
            {toutFait && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent-text)' }}>
                <HizbStar size={18} quarters={4} color="var(--accent)" />
                <span className="caption" style={{ color: 'inherit' }}>{t('goalsDone')}</span>
              </span>
            )}
          </div>

          {listeQuetes.map((q: any) => (
            <HizbProgress
              key={q.questId ?? q._id}
              value={Math.min(q.current ?? 0, q.target ?? 1)}
              max={q.target ?? 1}
              label={label(q.description)}
            />
          ))}
        </section>
      )}

      {/* --- 3. Le rappel discret : pas de cartes, juste un filet --------- */}
      <section
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
        }}
      >
        <Mesure valeur={g.level ?? 1} libelle={t('nav:profile')} />
        <Mesure valeur={g.totalXP ?? 0} libelle="XP" />
        <Mesure valeur={g.currentStreak ?? 0} libelle={t('common:streak')} lien="/serie" />
        <Mesure valeur={versets} libelle={t('nav:lessons')} lien="/statistiques" />
      </section>
    </div>
  );
}

/**
 * Chiffre secondaire. Sans carte, volontairement : ces valeurs accompagnent,
 * elles ne demandent pas d'action. Leur donner une surface les mettrait au
 * même niveau que la reprise.
 */
function Mesure({
  valeur,
  libelle,
  lien,
}: {
  valeur: number | string;
  libelle: string;
  lien?: string;
}) {
  const contenu = (
    <div>
      <div className="data" style={{ fontSize: 22, color: 'var(--text)' }}>{valeur}</div>
      <div className="overline">{libelle}</div>
    </div>
  );

  return lien ? (
    <Link to={lien} style={{ textDecoration: 'none', color: 'inherit' }}>{contenu}</Link>
  ) : (
    contenu
  );
}
