/**
 * Espacement, formes, élévation — Salifz
 */

/** Grille 4 px. Aucune valeur d'espacement hors de cette échelle. */
export const space = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 14: 56, 18: 72, 24: 96,
} as const;

export const radius = { sm: 6, md: 10, lg: 16, xl: 24, full: 999 } as const;

/**
 * L'élévation se marque surtout par la bordure ; l'ombre reste neutre et
 * discrète. Une ombre colorée trahirait le registre.
 */
export const elevation = {
  e0: { shadow: 'none', border: 'border' },
  e1: { shadow: '0 1px 2px rgba(0,0,0,.24)', border: 'border' },
  e2: { shadow: '0 4px 16px rgba(0,0,0,.28)', border: 'borderStrong' },
  // `e3` est réservé aux modales : c'est la seule élévation qui porte le filet d'or.
  e3: { shadow: '0 12px 32px rgba(0,0,0,.34)', border: 'borderGold' },
} as const;

/**
 * Forme mihrab — arc en ogive.
 *
 * Réservée aux conteneurs héros et aux illustrations, sur un bloc de ratio
 * proche de 3:4. Jamais sur un bouton ni un champ : l'ogive sur un contrôle
 * interactif brouille l'affordance.
 */
export const mihrabRadius = '999px 999px 16px 16px';

/** Largeur maximale du contenu. Le débordement horizontal constaté venait de
 *  l'absence de cette contrainte. */
export const contentMaxWidth = 880;
export const readingMaxWidth = 680;
export const mushafMaxWidth = 720;

/** Points de rupture vérifiés à la recette. */
export const breakpoints = { xs: 320, sm: 390, md: 768, lg: 1024, xl: 1280, xxl: 1440 } as const;

/**
 * Cibles tactiles. 44 px est le minimum praticable au doigt ; 32 px suffit à
 * la souris.
 */
export const hitTarget = { touch: 44, pointer: 32 } as const;

/** Durées et courbes. Une seule séquence orchestrée existe dans le produit —
 *  « la révélation » — et elle ne se produit nulle part ailleurs. */
export const motion = {
  micro: 120,
  standard: 200,
  page: 320,
  celebration: 600,
  easeStandard: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  easeExit: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Décalage entre deux mots lors de la révélation d'un verset masqué. */
  revealStaggerMs: 40,
} as const;
