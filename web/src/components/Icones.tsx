/**
 * Icônes — Salifz
 *
 * Remplace les 38 emojis relevés dans l'interface. Un emoji se rend
 * différemment sur chaque plateforme, ne porte aucune identité, et n'est pas
 * lisible par un lecteur d'écran autrement que par son nom Unicode — « livre
 * vert fermé » n'aide personne à comprendre qu'il s'agit du mushaf.
 *
 * Trait 1.5 px, grille 24, coins arrondis. Dessinées sur mesure là où aucun
 * jeu générique ne dit la chose : le mushaf, le hizb, la halaqa, la qibla.
 */

import { SVGProps } from 'react';

interface IconeProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number;
  /** Étiquette lue à voix haute. Sans elle, l'icône est décorative et masquée. */
  label?: string;
}

function Base({ size = 24, label, children, ...rest }: IconeProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Accueil — maison à arc en ogive, et non le pignon triangulaire habituel. */
export const IconeAccueil = (p: IconeProps) => (
  <Base {...p}>
    <path d="M4 21V11.5C4 7.4 7.6 4 12 4s8 3.4 8 7.5V21" />
    <path d="M9.5 21v-5a2.5 2.5 0 0 1 5 0v5" />
    <path d="M2.5 21h19" />
  </Base>
);

/** Leçons — pile de feuillets. */
export const IconeLecons = (p: IconeProps) => (
  <Base {...p}>
    <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5H19a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 0 4 19.5z" />
    <path d="M4 6.5A1.5 1.5 0 0 0 5.5 8H20" />
    <path d="M8 12h8M8 15h5" />
  </Base>
);

/** Révision — flèche cyclique autour d'un point : le retour, pas la boucle. */
export const IconeRevision = (p: IconeProps) => (
  <Base {...p}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20 3v4h-4" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </Base>
);

/** Mushaf — codex ouvert vu de face, filet central. */
export const IconeMushaf = (p: IconeProps) => (
  <Base {...p}>
    <path d="M12 6.5v13" />
    <path d="M12 6.5C10 5 7.5 4.5 4 4.8V18c3.5-.3 6 .2 8 1.5" />
    <path d="M12 6.5C14 5 16.5 4.5 20 4.8V18c-3.5-.3-6 .2-8 1.5" />
  </Base>
);

/** Verset du jour — le rub' el hizb plein. */
export const IconeVersetDuJour = (p: IconeProps) => (
  <Base {...p}>
    <path d="M12 3.5 20.5 12 12 20.5 3.5 12z" />
    <path d="M12 3.5 20.5 12 12 20.5 3.5 12z" transform="rotate(45 12 12)" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </Base>
);

/** Halaqat — trois arcs concentriques : le cercle assis autour du maître. */
export const IconeHalaqat = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="2" />
    <path d="M6.5 16.5a7 7 0 0 1 0-9" />
    <path d="M17.5 7.5a7 7 0 0 1 0 9" />
    <path d="M3.5 19a11 11 0 0 1 0-14" />
    <path d="M20.5 5a11 11 0 0 1 0 14" />
  </Base>
);

/** Khatam — anneau de traits : les 60 hizb, suggérés par 12. */
export const IconeKhatam = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" strokeDasharray="1.6 2.6" />
    <circle cx="12" cy="12" r="4" />
  </Base>
);

/** Amis — deux silhouettes. */
export const IconeAmis = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.5a3.2 3.2 0 0 1 0 6" />
    <path d="M17.5 14.5A6 6 0 0 1 21 20" />
  </Base>
);

/** Récitations — onde sur ligne de base : la voix, pas le matériel. */
export const IconeRecitations = (p: IconeProps) => (
  <Base {...p}>
    <path d="M3 12h2M19 12h2" />
    <path d="M7 8.5v7M10.5 5v14M14 8v8M17.5 10v4" />
  </Base>
);

/** Classement — trois barres inégales couronnées. */
export const IconeClassement = (p: IconeProps) => (
  <Base {...p}>
    <path d="M4 20v-5M12 20V8M20 20v-8" />
    <path d="M12 4.5 13 6.5 15 6.8 13.5 8.2 13.9 10.3 12 9.3 10.1 10.3 10.5 8.2 9 6.8 11 6.5z" />
  </Base>
);

/** Défis — cible à huit branches. */
export const IconeDefis = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3" />
  </Base>
);

/** Série — flamme géométrique à facettes, pas la flamme organique de l'emoji. */
export const IconeSerie = (p: IconeProps) => (
  <Base {...p}>
    <path d="M12 3c3 3.2 5.5 6 5.5 9.4A5.5 5.5 0 0 1 12 18a5.5 5.5 0 0 1-5.5-5.6C6.5 9 9 6.2 12 3z" />
    <path d="M12 18a2.6 2.6 0 0 0 2.6-2.7c0-1.6-1.2-2.8-2.6-4.3-1.4 1.5-2.6 2.7-2.6 4.3A2.6 2.6 0 0 0 12 18z" />
  </Base>
);

/** Statistiques — courbe sur axes. */
export const IconeStatistiques = (p: IconeProps) => (
  <Base {...p}>
    <path d="M4 4v16h16" />
    <path d="M7.5 15.5 11 11l3 2.5 4-6" />
  </Base>
);

/** Boutique — sacoche à rabat. */
export const IconeBoutique = (p: IconeProps) => (
  <Base {...p}>
    <path d="M4.5 8.5h15l-1 11.5h-13z" />
    <path d="M8.5 8.5V6.8a3.5 3.5 0 0 1 7 0v1.7" />
  </Base>
);

/** Prière & Qibla — boussole dont l'aiguille pointe vers la Kaaba. */
export const IconeQibla = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M14.8 9.2 10.5 10.5 9.2 14.8 13.5 13.5z" />
    <path d="M12 2.5v1.5" />
  </Base>
);

/** Gemmes — octogone facetté. */
export const IconeGemmes = (p: IconeProps) => (
  <Base {...p}>
    <path d="M8.5 3.5h7l4.5 4.5v7l-4.5 4.5h-7L4 15.5v-7z" />
    <path d="M8.5 3.5 12 12l3.5-8.5M4 8.5 12 12l-3.5 8.5M20 8.5 12 12l3.5 8.5" />
  </Base>
);

/** Cœurs — trait plein. */
export const IconeCoeurs = (p: IconeProps) => (
  <Base {...p}>
    <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8.4 3.8 3.8 0 0 1 19 10.8c0 4.8-7 9.2-7 9.2z" />
  </Base>
);

/** Notifications — cloche sobre. */
export const IconeNotifications = (p: IconeProps) => (
  <Base {...p}>
    <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10z" />
    <path d="M10.2 18.5a2 2 0 0 0 3.6 0" />
  </Base>
);

/** Abonnement — carte. */
export const IconeAbonnement = (p: IconeProps) => (
  <Base {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M3 10h18M6.5 14.5h3" />
  </Base>
);

/** Profil. */
export const IconeProfil = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Base>
);

/** Réglages. */
export const IconeReglages = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
  </Base>
);

/** Récompense — coffre octogonal, pour la boutique. */
export const IconeRecompense = (p: IconeProps) => (
  <Base {...p}>
    <path d="M4 9.5h16v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
    <path d="M3 6.5h18v3H3zM12 6.5v14" />
  </Base>
);

// ---------------------------------------------------------------------------
// Contrôles — thème, appels, capture
//
// Ces icônes remplacent les derniers emojis de l'interface. Elles ont un état
// « barré » explicite plutôt qu'un simple changement de couleur : couper son
// micro est une action dont on doit voir le résultat sans lire une étiquette,
// et le rouge seul n'est pas lisible pour tout le monde.
// ---------------------------------------------------------------------------

/** Thème clair — soleil à huit rayons, la forme du zellige. */
export const IconeSoleil = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
  </Base>
);

/** Thème sombre — croissant, orienté comme celui des coupoles. */
export const IconeLune = (p: IconeProps) => (
  <Base {...p}>
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2z" />
  </Base>
);

/** Appel audio. */
export const IconeAppel = (p: IconeProps) => (
  <Base {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
  </Base>
);

/** Appel vidéo. */
export const IconeVideo = (p: IconeProps) => (
  <Base {...p}>
    <rect x="2.8" y="6.5" width="12.4" height="11" rx="2" />
    <path d="M15.2 10.6l5-2.6v8l-5-2.6z" />
  </Base>
);

/** Micro ouvert. */
export const IconeMicro = (p: IconeProps) => (
  <Base {...p}>
    <rect x="9" y="2.8" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2" />
  </Base>
);

/** Micro coupé — la barre oblique dit l'état, pas seulement la couleur. */
export const IconeMicroCoupe = (p: IconeProps) => (
  <Base {...p}>
    <rect x="9" y="2.8" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2" />
    <path d="M3.5 3.5l17 17" />
  </Base>
);

/** Caméra coupée. */
export const IconeVideoCoupee = (p: IconeProps) => (
  <Base {...p}>
    <rect x="2.8" y="6.5" width="12.4" height="11" rx="2" />
    <path d="M15.2 10.6l5-2.6v8l-5-2.6z" />
    <path d="M3.5 3.5l17 17" />
  </Base>
);

/** Enregistrement en cours — disque plein, le seul de la série. */
export const IconeEnregistrer = (p: IconeProps) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="6.2" fill="currentColor" stroke="none" />
  </Base>
);

/** Arrêter l'enregistrement. */
export const IconeArret = (p: IconeProps) => (
  <Base {...p}>
    <rect x="6.5" y="6.5" width="11" height="11" rx="1.6" fill="currentColor" stroke="none" />
  </Base>
);

/** Correspondance des routes vers leur icône : la sidebar n'a plus d'emoji. */
export const iconesNavigation = {
  '/accueil': IconeAccueil,
  '/lecons': IconeLecons,
  '/revision': IconeRevision,
  '/mushaf': IconeMushaf,
  '/verset-du-jour': IconeVersetDuJour,
  '/halaqat': IconeHalaqat,
  '/khatam': IconeKhatam,
  '/amis': IconeAmis,
  '/recitations': IconeRecitations,
  '/classement': IconeClassement,
  '/defis': IconeDefis,
  '/serie': IconeSerie,
  '/statistiques': IconeStatistiques,
  '/boutique': IconeBoutique,
  '/priere': IconeQibla,
  '/notifications': IconeNotifications,
  '/abonnement': IconeAbonnement,
  '/profil': IconeProfil,
  '/reglages': IconeReglages,
} as const;
