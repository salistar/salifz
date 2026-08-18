/**
 * Confidentialité.
 *
 * Le texte de référence est `CONFIDENTIALITE.md` à la racine du dépôt ; cette
 * page en reprend le contenu pour que les liens des pieds de page mènent
 * quelque part. Elle est accessible avec ou sans compte : quelqu'un doit
 * pouvoir lire ce qu'on collecte *avant* de s'inscrire.
 */

const SECTIONS = [
  {
    titre: 'Ce qui est enregistré',
    points: [
      'Votre adresse email, votre nom d’utilisateur et, si vous le renseignez, votre nom affiché.',
      'Votre progression : versets mémorisés, révisions, séries, XP et gemmes.',
      'Les récitations que vous envoyez à un enseignant, jusqu’à ce que vous les supprimiez.',
      'Vos réglages d’application.',
    ],
  },
  {
    titre: 'Ce qui n’est pas enregistré',
    points: [
      'Aucune durée de session : rien dans l’application ne mesure le temps passé.',
      'Aucune position n’est conservée. Les coordonnées servent au calcul des heures de prière et de la qibla, puis sont oubliées.',
      'Aucun traceur publicitaire, aucun partage de données à des fins commerciales.',
    ],
  },
  {
    titre: 'Comptes enfants',
    points: [
      'Un compte enfant est créé par un parent, depuis un compte famille.',
      'Le rapport d’activité affiché au parent ne contient que des données mesurées : jours actifs, versets, XP.',
      'La discussion et les appels vidéo y sont restreints par défaut.',
    ],
  },
  {
    titre: 'Vos droits',
    points: [
      'Exporter l’ensemble de vos données depuis les réglages, dans un format lisible.',
      'Supprimer votre compte, ce qui efface vos données de progression et vos récitations.',
      'Corriger vos informations de profil à tout moment.',
    ],
  },
  {
    titre: 'Sources externes',
    points: [
      'Le texte coranique et les traductions proviennent de quran.com.',
      'Les récitations audio sont servies par islamic.network.',
      'Ces services reçoivent l’adresse IP de votre appareil au moment où vous chargez un verset ou un audio, comme pour toute requête web.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px', display: 'grid', gap: 24 }}>
      <header>
        <h1 style={{ margin: '0 0 8px' }}>Confidentialité</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Ce document décrit ce que Salifz enregistre et ce qu’il n’enregistre
          pas. Il correspond au comportement réel du code, pas à une intention.
        </p>
      </header>

      {SECTIONS.map((s) => (
        <section key={s.titre} className="card">
          <h2 style={{ margin: '0 0 12px', fontSize: 17 }}>{s.titre}</h2>
          <ul style={{ margin: 0, paddingInlineStart: 20, display: 'grid', gap: 8 }}>
            {s.points.map((p) => (
              <li key={p} style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                {p}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
        Cette instance est hébergée par la personne qui l’a déployée. Sur une
        installation locale, vos données ne quittent pas votre machine.
      </p>
    </div>
  );
}
