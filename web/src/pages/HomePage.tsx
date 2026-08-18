/**
 * Accueil du tableau de bord.
 *
 * La version précédente n'affichait que ce qui se trouvait déjà dans la
 * session : cinq compteurs et trois liens. Elle ne disait donc rien de ce
 * qu'il y avait à faire *aujourd'hui* — qui est justement la question qu'on se
 * pose en ouvrant l'application.
 *
 * Cet écran répond à trois questions, dans cet ordre :
 *   1. Où en étais-je ? (reprise à la position exacte)
 *   2. Que me reste-t-il pour aujourd'hui ? (objectifs, révisions dues)
 *   3. Où aller ensuite ? (raccourcis)
 */

import { Link } from 'react-router-dom';
import { progressAPI, gamificationAPI, quranAPI } from '../services/api';
import { useResource, asList, unwrap } from '../components/useResource';
import { useAuth } from '../store';
import { label } from '../services/i18n';

const RACCOURCIS = [
  { to: '/mushaf', titre: 'Mushaf', desc: '604 pages, masquage progressif', icone: '📗' },
  { to: '/halaqat', titre: 'Halaqat', desc: 'Discussion et appels de groupe', icone: '🕌' },
  { to: '/verset-du-jour', titre: 'Verset du jour', desc: 'Traduction et audio', icone: '✨' },
  { to: '/classement', titre: 'Classement', desc: 'Votre ligue et vos succès', icone: '🏆' },
];

export default function HomePage() {
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
    (s: any) => Number(s.number ?? s.id) === Number(qp.currentSurah)
  );

  const versets = qp.totalVersesMemorized ?? user?.quranProgress?.totalVersesMemorized ?? 0;
  const pourcentCoran = ((versets / 6236) * 100).toFixed(1);
  const quetesFaites = listeQuetes.filter((q: any) => q.completed).length;
  const restantes = listeQuetes.length - quetesFaites;

  // Une seule phrase, choisie par ce qui est le plus urgent : réviser passe
  // avant apprendre, parce qu'un verset non révisé se perd.
  const phrase =
    aReviser > 0
      ? `${aReviser} verset${aReviser > 1 ? 's' : ''} à réviser aujourd’hui.`
      : restantes > 0
        ? `${restantes} objectif${restantes > 1 ? 's' : ''} restant${restantes > 1 ? 's' : ''} pour aujourd’hui.`
        : 'Rien d’urgent aujourd’hui — le bon moment pour avancer.';

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {/* --- Salutation et progression du jour -------------------------- */}
      <section
        className="card"
        style={{
          background: 'var(--primary-dark)',
          color: 'var(--on-deep)',
          border: 'none',
          display: 'flex',
          gap: 20,
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: 24,
        }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 24 }}>
            Assalamu alaykum, {user?.displayName ?? user?.username}
          </h1>
          <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.6 }}>{phrase}</p>
        </div>

        {listeQuetes.length > 0 && <Anneau fait={quetesFaites} total={listeQuetes.length} />}
      </section>

      {/* --- Reprendre là où l'on s'est arrêté --------------------------- */}
      {qp.currentSurah ? (
        <Link
          to={`/mot-a-mot/${qp.currentSurah}/${qp.currentAyah ?? 1}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <section
            className="card carte-lien"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              borderColor: 'var(--primary)',
              borderWidth: 2,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 32 }}>▶️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Reprendre</span>
              <strong style={{ display: 'block', fontSize: 18 }}>
                {sourateCourante?.name ?? sourateCourante?.englishName ?? `Sourate ${qp.currentSurah}`}
                {` · verset ${qp.currentAyah ?? 1}`}
              </strong>
            </div>
            <span aria-hidden="true" style={{ color: 'var(--primary)', fontSize: 22 }}>→</span>
          </section>
        </Link>
      ) : null}

      {/* --- Objectifs du jour ------------------------------------------- */}
      {listeQuetes.length > 0 && (
        <section className="card">
          <h2 style={{ margin: '0 0 14px', fontSize: 16 }}>Objectifs du jour</h2>
          <div style={{ display: 'grid', gap: 14 }}>
            {listeQuetes.map((q: any) => {
              const cible = q.target ?? 1;
              const fait = Math.min(q.current ?? 0, cible);
              const pourcent = Math.round((fait / cible) * 100);

              return (
                <div key={q.questId ?? q._id}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 5 }}>
                    <span style={{ flex: 1, fontSize: 15 }}>
                      {q.completed && <span aria-hidden="true">✓ </span>}
                      {label(q.description)}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {fait}/{cible}
                    </span>
                    {q.xpReward != null && (
                      <span style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 600 }}>
                        +{q.xpReward} XP
                      </span>
                    )}
                  </div>

                  <div style={{ height: 7, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${pourcent}%`,
                        height: '100%',
                        background: q.completed ? 'var(--primary-dark)' : 'var(--primary)',
                        transition: 'width .2s',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* --- Chiffres ----------------------------------------------------- */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
        <Chiffre valeur={g.level ?? 1} libelle="Niveau" />
        <Chiffre valeur={g.totalXP ?? 0} libelle="XP" />
        <Chiffre valeur={g.gems ?? 0} libelle="Gemmes" />
        <Chiffre valeur={g.currentStreak ?? 0} libelle="Série" lien="/serie" />
        <Chiffre valeur={versets} libelle={`Versets · ${pourcentCoran} %`} lien="/statistiques" />
      </section>

      {/* --- Raccourcis --------------------------------------------------- */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
        {RACCOURCIS.map((r) => (
          <Link key={r.to} to={r.to} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card carte-lien" style={{ height: '100%' }}>
              <div aria-hidden="true" style={{ fontSize: 28 }}>{r.icone}</div>
              <h3 style={{ margin: '8px 0 4px', fontSize: 16 }}>{r.titre}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{r.desc}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}

/** Anneau de progression des objectifs, dessiné en SVG : un cercle se lit d'un
 *  coup d'œil là où « 1/3 » demande une lecture. */
function Anneau({ fait, total }: { fait: number; total: number }) {
  const rayon = 30;
  const circonference = 2 * Math.PI * rayon;
  const part = total > 0 ? fait / total : 0;

  return (
    <div style={{ display: 'grid', placeItems: 'center', width: 76, height: 76, position: 'relative' }}>
      <svg width="76" height="76" style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle cx="38" cy="38" r={rayon} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="7" />
        <circle
          cx="38"
          cy="38"
          r={rayon}
          fill="none"
          stroke="#ffffff"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={circonference * (1 - part)}
        />
      </svg>
      <span
        style={{ position: 'absolute', fontWeight: 700, fontSize: 15 }}
        aria-label={`${fait} objectif(s) sur ${total} atteint(s)`}
      >
        {fait}/{total}
      </span>
    </div>
  );
}

function Chiffre({ valeur, libelle, lien }: { valeur: number | string; libelle: string; lien?: string }) {
  const contenu = (
    <div className={lien ? 'card carte-lien' : 'card'} style={{ textAlign: 'center', height: '100%' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--primary-dark)' }}>{valeur}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{libelle}</div>
    </div>
  );

  return lien ? (
    <Link to={lien} style={{ textDecoration: 'none', color: 'inherit' }}>
      {contenu}
    </Link>
  ) : (
    contenu
  );
}
