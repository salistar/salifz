/**
 * Icônes — Salifz mobile
 *
 * Portage du jeu du web (`web/src/components/Icones.tsx`). Les tracés sont
 * identiques : une icône de mushaf différente sur le téléphone et sur le web
 * cesse de désigner la même chose.
 *
 * Elles remplacent les emojis relevés dans les écrans. Un emoji se rend
 * différemment sur chaque appareil — 🕌 est plat sur Android, en relief sur
 * iOS, absent de certaines polices de rechange — ne porte aucune identité, et
 * un lecteur d'écran l'annonce par son nom Unicode : « mosquée » n'aide
 * personne à comprendre qu'il s'agit d'une halaqa.
 *
 * Trait 1,5 px, grille 24. Dessinées sur mesure là où aucun jeu générique ne
 * dit la chose : le mushaf, le hizb, la halaqa, la qibla.
 */

import React from 'react';
import Svg, { Path, Circle, Rect, SvgProps } from 'react-native-svg';
import { useTheme } from '../../contexts/ThemeContext';

export interface IconeProps {
  size?: number;
  color?: string;
  /** Étiquette lue à voix haute. Sans elle, l'icône est décorative. */
  label?: string;
  style?: SvgProps['style'];
}

function Base({
  size = 24,
  color,
  label,
  style,
  children,
}: IconeProps & { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? colors.text}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      accessible={Boolean(label)}
      accessibilityRole={label ? 'image' : undefined}
      accessibilityLabel={label}
      importantForAccessibility={label ? 'yes' : 'no-hide-descendants'}
    >
      {children}
    </Svg>
  );
}

/** Accueil — maison à arc en ogive, et non le pignon triangulaire habituel. */
export const IconeAccueil = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M4 21V11.5C4 7.4 7.6 4 12 4s8 3.4 8 7.5V21" />
    <Path d="M9.5 21v-5a2.5 2.5 0 0 1 5 0v5" />
    <Path d="M2.5 21h19" />
  </Base>
);

/** Leçons — pile de feuillets. */
export const IconeLecons = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M4 6.5A1.5 1.5 0 0 1 5.5 5H19a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 0 4 19.5z" />
    <Path d="M4 6.5A1.5 1.5 0 0 0 5.5 8H20" />
    <Path d="M8 12h8M8 15h5" />
  </Base>
);

/** Révision — flèche cyclique : le retour, pas la boucle infinie. */
export const IconeRevision = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <Path d="M20 4v4h-4" />
    <Circle cx={12} cy={12} r={1.6} />
  </Base>
);

/** Mushaf — le codex ouvert, avec sa reliure centrale. */
export const IconeMushaf = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M12 6.5C10 5 7.5 4.5 4 4.5v13c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-13c-3.5 0-6 .5-8 2z" />
    <Path d="M12 6.5v13" />
  </Base>
);

/** Verset du jour — étoile dans un cadre. */
export const IconeVersetDuJour = (p: IconeProps) => (
  <Base {...p}>
    <Rect x={4} y={4} width={16} height={16} rx={2.5} />
    <Path d="M12 8.2l1.5 2.9 3.1.4-2.3 2.2.6 3.1-2.9-1.6-2.9 1.6.6-3.1-2.3-2.2 3.1-.4z" />
  </Base>
);

/** Halaqat — le cercle d'étude : des personnes autour d'un centre. */
export const IconeHalaqat = (p: IconeProps) => (
  <Base {...p}>
    <Circle cx={12} cy={12} r={2.4} />
    <Circle cx={12} cy={4.6} r={1.6} />
    <Circle cx={12} cy={19.4} r={1.6} />
    <Circle cx={4.6} cy={12} r={1.6} />
    <Circle cx={19.4} cy={12} r={1.6} />
  </Base>
);

/** Khatam — l'anneau du cycle achevé, marqué de ses quatre quarts. */
export const IconeKhatam = (p: IconeProps) => (
  <Base {...p}>
    <Circle cx={12} cy={12} r={8} />
    <Path d="M12 4v3M12 17v3M4 12h3M17 12h3" />
    <Circle cx={12} cy={12} r={2.6} />
  </Base>
);

/** Amis — deux silhouettes. */
export const IconeAmis = (p: IconeProps) => (
  <Base {...p}>
    <Circle cx={9} cy={8} r={3.2} />
    <Path d="M3 20v-1.2A5 5 0 0 1 8 14h2a5 5 0 0 1 5 4.8V20" />
    <Path d="M16.5 5.4a3.2 3.2 0 0 1 0 5.2M17.5 14.2A4.4 4.4 0 0 1 21 18.5V20" />
  </Base>
);

/** Récitations — l'onde sonore, en barres inégales. */
export const IconeRecitations = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M3 12h1.6M7 8.5v7M10.5 5.5v13M14 9v6M17.5 7v10M21 11h-1.6" />
  </Base>
);

/** Classement — trois colonnes de hauteurs différentes. */
export const IconeClassement = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M5 20v-6M12 20V5M19 20v-9" />
    <Path d="M3 20h18" />
  </Base>
);

/** Défis — cible. */
export const IconeDefis = (p: IconeProps) => (
  <Base {...p}>
    <Circle cx={12} cy={12} r={8} />
    <Circle cx={12} cy={12} r={4.2} />
    <Circle cx={12} cy={12} r={1} />
  </Base>
);

/** Série — la goutte : le jour qui s'ajoute, pas la flamme de la compétition. */
export const IconeSerie = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M12 3.5c3.4 4 5.5 6.7 5.5 9.4a5.5 5.5 0 0 1-11 0c0-2.7 2.1-5.4 5.5-9.4z" />
  </Base>
);

/** Statistiques — la courbe. */
export const IconeStatistiques = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M3 20h18" />
    <Path d="M4 16l4.5-5 3.5 3 7-8" />
  </Base>
);

/** Boutique — le cabas. */
export const IconeBoutique = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M5 8h14l-1 12H6z" />
    <Path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </Base>
);

/** Qibla — la boussole et son aiguille. */
export const IconeQibla = (p: IconeProps) => (
  <Base {...p}>
    <Circle cx={12} cy={12} r={8.5} />
    <Path d="M15 9l-2 5-4 1 2-5z" />
    <Path d="M12 2.2v1.6" />
  </Base>
);

/** Gemmes — la pierre taillée. */
export const IconeGemmes = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M7 4h10l4 5-9 11L3 9z" />
    <Path d="M3 9h18M9.5 4L7.5 9l4.5 11 4.5-11L14.5 4" />
  </Base>
);

/** Cœurs — les essais restants. */
export const IconeCoeurs = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8.4 3.8 3.8 0 0 1 19 10.8c0 4.8-7 9.2-7 9.2z" />
  </Base>
);

/** Notifications — la cloche. */
export const IconeNotifications = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.4 5.5 1.4 5.5H4.6S6 13.5 6 9.5z" />
    <Path d="M10.2 18.5a2 2 0 0 0 3.6 0" />
  </Base>
);

/** Abonnement — la carte. */
export const IconeAbonnement = (p: IconeProps) => (
  <Base {...p}>
    <Rect x={3} y={6} width={18} height={12} rx={2} />
    <Path d="M3 10h18M6.5 14.5h3" />
  </Base>
);

/** Profil — la silhouette. */
export const IconeProfil = (p: IconeProps) => (
  <Base {...p}>
    <Circle cx={12} cy={8} r={3.6} />
    <Path d="M4.5 20v-1.4A5.6 5.6 0 0 1 10 13.4h4a5.6 5.6 0 0 1 5.5 5.2V20" />
  </Base>
);

/** Réglages — le curseur. */
export const IconeReglages = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M4 8h10M18 8h2M4 16h4M12 16h8" />
    <Circle cx={16} cy={8} r={2.2} />
    <Circle cx={10} cy={16} r={2.2} />
  </Base>
);

/** Récompense — le coffret. */
export const IconeRecompense = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M4 9.5h16v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5z" />
    <Path d="M3 6.5h18v3H3zM12 6.5v14" />
  </Base>
);

// ---------------------------------------------------------------------------
// Contrôles — thème, appels, capture
//
// L'état « coupé » est une barre oblique explicite, pas un simple changement
// de couleur : couper son micro est une action dont on doit voir le résultat
// sans lire une étiquette, et le rouge seul n'est pas lisible pour tout le
// monde.
// ---------------------------------------------------------------------------

/** Thème clair — soleil à huit rayons, la forme du zellige. */
export const IconeSoleil = (p: IconeProps) => (
  <Base {...p}>
    <Circle cx={12} cy={12} r={4.2} />
    <Path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
  </Base>
);

/** Thème sombre — croissant, orienté comme celui des coupoles. */
export const IconeLune = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2z" />
  </Base>
);

/** Appel audio. */
export const IconeAppel = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
  </Base>
);

/** Appel vidéo. */
export const IconeVideo = (p: IconeProps) => (
  <Base {...p}>
    <Rect x={2.8} y={6.5} width={12.4} height={11} rx={2} />
    <Path d="M15.2 10.6l5-2.6v8l-5-2.6z" />
  </Base>
);

/** Caméra coupée. */
export const IconeVideoCoupee = (p: IconeProps) => (
  <Base {...p}>
    <Rect x={2.8} y={6.5} width={12.4} height={11} rx={2} />
    <Path d="M15.2 10.6l5-2.6v8l-5-2.6z" />
    <Path d="M3.5 3.5l17 17" />
  </Base>
);

/** Micro ouvert. */
export const IconeMicro = (p: IconeProps) => (
  <Base {...p}>
    <Rect x={9} y={2.8} width={6} height={11} rx={3} />
    <Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2" />
  </Base>
);

/** Micro coupé. */
export const IconeMicroCoupe = (p: IconeProps) => (
  <Base {...p}>
    <Rect x={9} y={2.8} width={6} height={11} rx={3} />
    <Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2" />
    <Path d="M3.5 3.5l17 17" />
  </Base>
);

/** Enregistrement en cours — disque plein, le seul de la série. */
export const IconeEnregistrer = ({ size = 24, color, style }: IconeProps) => {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Circle cx={12} cy={12} r={6.2} fill={color ?? colors.error} />
    </Svg>
  );
};

/** Arrêter l'enregistrement. */
export const IconeArret = ({ size = 24, color, style }: IconeProps) => {
  const { colors } = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Rect x={6.5} y={6.5} width={11} height={11} rx={1.6} fill={color ?? colors.text} />
    </Svg>
  );
};

/** Retour — la flèche suit le sens de lecture, d'où le miroir en arabe. */
export const IconeRetour = ({ rtl = false, ...p }: IconeProps & { rtl?: boolean }) => (
  <Base {...p}>
    {rtl ? <Path d="M9 5l7 7-7 7" /> : <Path d="M15 5l-7 7 7 7" />}
  </Base>
);

/** Fermer. */
export const IconeFermer = (p: IconeProps) => (
  <Base {...p}>
    <Path d="M6 6l12 12M18 6L6 18" />
  </Base>
);

/** Recherche. */
export const IconeRecherche = (p: IconeProps) => (
  <Base {...p}>
    <Circle cx={11} cy={11} r={6.5} />
    <Path d="M16 16l4.5 4.5" />
  </Base>
);
