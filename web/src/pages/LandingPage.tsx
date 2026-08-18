/**
 * Page de présentation — le seul écran que voit quelqu'un qui ne connaît pas
 * encore Salifz.
 *
 * Elle décrit ce que l'application fait réellement aujourd'hui. Les
 * fonctionnalités listées ici existent toutes et sont vérifiables dans le
 * produit : annoncer une reconnaissance de récitation par IA, par exemple,
 * serait une promesse que le code ne tient pas.
 */

import { Link } from 'react-router-dom';
import { LandingArtwork, PatternPaths } from '../components/Artwork';

const FONCTIONS = [
  {
    icone: '📗',
    titre: 'Mushaf avec masquage progressif',
    texte:
      'Les 604 pages, ligne à ligne. Quatre niveaux de masquage — texte complet, premier mot de chaque ligne, premières lettres, puis rien — pour passer de la lecture au rappel sans changer d’écran.',
  },
  {
    icone: '🔤',
    titre: 'Mot à mot',
    texte:
      'Un appui long sur un mot en donne la traduction et la prononciation, avec l’audio du mot isolé. Utile quand un verset bloque sur un terme précis.',
  },
  {
    icone: '🔄',
    titre: 'Révision espacée',
    texte:
      'Les versets reviennent quand vous êtes sur le point de les oublier, pas dans l’ordre du Coran. La file de révision se construit à partir de vos réponses passées.',
  },
  {
    icone: '🕌',
    titre: 'Halaqat',
    texte:
      'Un groupe, une discussion en temps réel, des appels audio et vidéo. L’enseignant écoute une récitation envoyée et la valide ou la renvoie avec un commentaire.',
  },
  {
    icone: '📖',
    titre: 'Khatam collaboratif',
    texte:
      'Les 60 hizb répartis entre les membres : le groupe achève une lecture complète que personne n’aurait finie seul.',
  },
  {
    icone: '🧭',
    titre: 'Heures de prière et qibla',
    texte:
      'Calculées depuis votre position, avec la direction et la distance vers La Mecque. Quand le magnétomètre manque, l’application le dit au lieu de faire semblant.',
  },
];

const ETAPES = [
  {
    n: '01',
    titre: 'Écouter avant de mémoriser',
    texte:
      'Le verset est joué par le récitateur de votre choix. L’oreille prend l’empreinte du rythme avant que l’œil ne travaille.',
  },
  {
    n: '02',
    titre: 'Masquer par degrés',
    texte:
      'Le texte disparaît progressivement. Chaque niveau retire un appui, jusqu’à ce qu’il n’en reste aucun.',
  },
  {
    n: '03',
    titre: 'Revenir au bon moment',
    texte:
      'Ce que vous récitez sans hésiter revient plus tard ; ce qui accroche revient vite. C’est le principe de la répétition espacée.',
  },
  {
    n: '04',
    titre: 'Faire valider',
    texte:
      'Un enregistrement envoyé à votre enseignant, écouté, puis validé ou commenté. La correction vient d’une personne, pas d’un score automatique.',
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* ---------------------------------------------------------------- */}
      {/* Bandeau d'ouverture                                              */}
      {/* ---------------------------------------------------------------- */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--background-alt)' }}>
        <LandingArtwork
          style={{
            position: 'absolute',
            insetInline: 0,
            bottom: 0,
            width: '100%',
            height: '58%',
            opacity: 0.38,
          }}
        />

        <div
          style={{
            position: 'relative',
            maxWidth: 1180,
            margin: '0 auto',
            padding: '72px 20px 88px',
            display: 'grid',
            gap: 40,
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            alignItems: 'center',
          }}
        >
          <div>
            <p
              style={{
                display: 'inline-block',
                margin: '0 0 16px',
                padding: '6px 14px',
                borderRadius: 20,
                background: 'var(--primary-soft)',
                color: 'var(--primary-dark)',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              Mémorisation du Coran
            </p>

            <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.1rem)', lineHeight: 1.15, margin: '0 0 18px' }}>
              Mémoriser le Coran,{' '}
              <span style={{ color: 'var(--primary-dark)' }}>sans perdre ce qui est acquis</span>
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                margin: '0 0 28px',
                maxWidth: 540,
              }}
            >
              Le mushaf complet avec masquage progressif, une révision qui revient
              au bon moment, et une halaqa où un enseignant écoute vraiment ce
              que vous récitez.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                to="/inscription"
                className="btn-primary"
                style={{ textDecoration: 'none', padding: '14px 26px', fontSize: 16 }}
              >
                Créer un compte
              </Link>
              <a
                href="#fonctionnalites"
                className="btn-ghost"
                style={{ textDecoration: 'none', padding: '14px 26px', fontSize: 16 }}
              >
                Voir les fonctionnalités
              </a>
            </div>

            <p style={{ marginTop: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
              Application web et mobile — un seul compte, les mêmes données.
            </p>
          </div>

          <Chiffres />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Fonctionnalités                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section id="fonctionnalites" style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 20px 0' }}>
        <EnTeteSection
          surtitre="Fonctionnalités"
          titre="Ce que l’application fait aujourd’hui"
          sous="Chaque point ci-dessous est en service — rien n’y est annoncé pour plus tard."
        />

        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          }}
        >
          {FONCTIONS.map((f) => (
            <article key={f.titre} className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              <span aria-hidden="true" style={{ fontSize: 30 }}>{f.icone}</span>
              <h3 style={{ margin: 0, fontSize: 17 }}>{f.titre}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>
                {f.texte}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Méthode                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section id="methode" style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 20px 0' }}>
        <EnTeteSection
          surtitre="Méthode"
          titre="Quatre gestes, répétés"
          sous="La mémorisation ne tient pas à un outil mais à un cycle. L’application se contente de le rendre régulier."
        />

        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          {ETAPES.map((e) => (
            <li key={e.n} className="card" style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--primary)',
                }}
              >
                {e.n}
              </span>
              <h3 style={{ margin: 0, fontSize: 16 }}>{e.titre}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: 15 }}>
                {e.texte}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Tarifs                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section id="tarifs" style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 20px 0' }}>
        <EnTeteSection
          surtitre="Tarifs"
          titre="Le Coran d’abord"
          sous="La lecture, la mémorisation et la révision ne sont pas derrière un paiement, et ne le seront pas."
        />

        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          }}
        >
          <Offre
            nom="Gratuit"
            prix="0 €"
            details={[
              'Le mushaf complet, 604 pages',
              'Masquage progressif et mot à mot',
              'Révision espacée',
              'Heures de prière et qibla',
              'Rejoindre une halaqa',
            ]}
            action={{ to: '/inscription', label: 'Commencer' }}
            mise
          />
          <Offre
            nom="Salifz+"
            prix="à venir"
            details={[
              'Audio hors ligne par sourate',
              'Statistiques détaillées',
              'Thèmes et avatars',
              'Création de halaqat sans limite',
            ]}
            note="Les offres passeront par l’App Store et Google Play. Aucun paiement n’est actif pour l’instant."
          />
          <Offre
            nom="Famille"
            prix="à venir"
            details={[
              'Jusqu’à cinq comptes enfants',
              'Suivi d’activité réel, jour par jour',
              'Limites de temps et restrictions',
            ]}
            note="Le tableau de bord parental n’affiche que des données mesurées."
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Appel final                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '72px 20px 0' }}>
        <div
          className="card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--primary-dark)',
            borderColor: 'transparent',
            color: 'var(--on-deep)',
            padding: '48px 28px',
            textAlign: 'center',
          }}
        >
          <svg
            viewBox="-100 -100 200 200"
            aria-hidden="true"
            style={{ position: 'absolute', right: -40, top: -40, width: 240, height: 240, color: '#ffffff' }}
          >
            <PatternPaths opacity={0.14} />
          </svg>

          <div style={{ position: 'relative' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
              Commencez par une sourate
            </h2>
            <p style={{ margin: '0 auto 24px', maxWidth: 520, opacity: 0.9, lineHeight: 1.6 }}>
              Al-Fatiha fait sept versets. C’est assez pour voir si la méthode
              vous convient.
            </p>
            <Link
              to="/inscription"
              style={{
                display: 'inline-block',
                background: 'var(--surface)',
                color: 'var(--primary-dark)',
                padding: '14px 30px',
                borderRadius: 8,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function EnTeteSection({ surtitre, titre, sous }: { surtitre: string; titre: string; sous: string }) {
  return (
    <header style={{ marginBottom: 28, maxWidth: 640 }}>
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--primary)',
        }}
      >
        {surtitre}
      </p>
      <h2 style={{ margin: '0 0 10px', fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}>{titre}</h2>
      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{sous}</p>
    </header>
  );
}

/** Repères chiffrés, tous vérifiables : ce sont des constantes du Coran et du
 *  produit, pas des mesures d'usage qu'on ne pourrait pas justifier. */
function Chiffres() {
  const items = [
    ['604', 'pages du mushaf'],
    ['6 236', 'versets'],
    ['114', 'sourates'],
    ['3', 'langues d’interface'],
  ];

  return (
    <div
      className="card"
      style={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: '1fr 1fr',
        padding: 0,
        overflow: 'hidden',
        background: 'var(--border)',
      }}
    >
      {items.map(([valeur, libelle]) => (
        <div key={libelle} style={{ background: 'var(--surface)', padding: '26px 18px', textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--primary-dark)' }}>{valeur}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>{libelle}</div>
        </div>
      ))}
    </div>
  );
}

function Offre({
  nom,
  prix,
  details,
  action,
  note,
  mise,
}: {
  nom: string;
  prix: string;
  details: string[];
  action?: { to: string; label: string };
  note?: string;
  mise?: boolean;
}) {
  return (
    <div
      className="card"
      style={{
        display: 'grid',
        gap: 14,
        alignContent: 'start',
        borderColor: mise ? 'var(--primary)' : 'var(--border)',
        borderWidth: mise ? 2 : 1,
      }}
    >
      <div>
        <h3 style={{ margin: '0 0 4px', fontSize: 17 }}>{nom}</h3>
        <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--primary-dark)' }}>{prix}</p>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
        {details.map((d) => (
          <li key={d} style={{ display: 'flex', gap: 8, color: 'var(--text-secondary)', fontSize: 15 }}>
            <span aria-hidden="true" style={{ color: 'var(--primary)' }}>✓</span>
            {d}
          </li>
        ))}
      </ul>

      {action && (
        <Link to={action.to} className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
          {action.label}
        </Link>
      )}
      {note && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>{note}</p>}
    </div>
  );
}
