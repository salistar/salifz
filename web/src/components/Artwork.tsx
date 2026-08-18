/**
 * Illustrations — Salifz
 *
 * Dessins vectoriels écrits à la main plutôt qu'images importées, pour trois
 * raisons : rien à télécharger (l'application doit rester utilisable hors
 * ligne), une netteté indépendante de la densité d'écran, et surtout des
 * couleurs qui suivent le thème — une photographie lumineuse posée sur un
 * fond sombre trahit immédiatement le changement de thème.
 *
 * Le registre visuel est délibéré : géométrie, arabesque et architecture. Une
 * application de mémorisation du Coran n'illustre pas ses écrans avec des
 * représentations de personnes, et encore moins de figures religieuses.
 */

import { CSSProperties } from 'react';

interface ArtProps {
  style?: CSSProperties;
  className?: string;
}

/**
 * Motif à seize branches, construit par rotation d'un même losange — la
 * mécanique du *girih* : une seule forme, répétée par symétrie.
 *
 * Les traits sont exposés sans conteneur. Séparer les deux permet de réutiliser
 * le dessin à l'intérieur d'un autre SVG : imbriquer un `<svg>` dans un `<svg>`
 * crée un nouveau viewport dont le dimensionnement varie selon le moteur de
 * rendu, et la figure se retrouve tronquée ou décentrée.
 * Le motif est centré sur (0,0) : l'appelant le place par `transform`.
 */
export function PatternPaths({ opacity = 1 }: { opacity?: number }) {
  const branches = Array.from({ length: 16 }, (_, i) => i * 22.5);

  return (
    <g opacity={opacity}>
      {branches.map((angle) => (
        <path
          key={angle}
          d="M0,-78 L16,-42 L0,-6 L-16,-42 Z"
          transform={`rotate(${angle})`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.55"
        />
      ))}
      <circle r="78" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      <circle r="42" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.45" />
      <circle r="6" fill="currentColor" opacity="0.5" />
    </g>
  );
}

export function GeometricPattern({ style, className }: ArtProps) {
  return (
    <svg viewBox="-100 -100 200 200" style={style} className={className} aria-hidden="true">
      <PatternPaths />
    </svg>
  );
}

/**
 * Illustration de connexion : une arcade en arc brisé ouvrant sur un ciel
 * étoilé. L'arcade — le *mihrab* — oriente le regard vers l'avant, ce qui
 * convient à un écran d'entrée.
 */
export function AuthArtwork({ style, className }: ArtProps) {
  // Positions fixes plutôt que tirées au hasard : une étoile qui se déplace à
  // chaque rendu attire l'œil pour rien.
  const stars = [
    [52, 96, 1.6], [86, 62, 1.1], [120, 88, 1.8], [150, 58, 1.2],
    [70, 140, 1.3], [132, 148, 1.5], [178, 112, 1.1], [38, 168, 1.2],
    [104, 44, 1.4], [164, 176, 1.3],
  ];

  return (
    <svg viewBox="0 0 240 320" style={style} className={className} role="img"
         aria-label="Arcade ouvrant sur un ciel étoilé">
      <defs>
        <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--canvas-deep)" />
          <stop offset="100%" stopColor="var(--primary-dark)" />
        </linearGradient>
        <linearGradient id="lueur" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
        {/* L'arc brisé sert à la fois de contour et de masque pour le ciel. */}
        <path id="arcade"
          d="M40,300 L40,140 Q40,60 120,26 Q200,60 200,140 L200,300 Z" />
        <clipPath id="dansArcade"><use href="#arcade" /></clipPath>
      </defs>

      <use href="#arcade" fill="url(#ciel)" />

      <g clipPath="url(#dansArcade)">
        {stars.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#ffffff"
                  opacity={0.45 + (i % 3) * 0.18} />
        ))}
        {/* Croissant obtenu par soustraction : un disque masqué par un second,
            décalé — c'est ainsi qu'on évite une forme approximative. */}
        <g transform="translate(158 74)">
          <circle r="20" fill="#ffffff" opacity="0.9" />
          <circle r="20" cx="8" cy="-6" fill="url(#ciel)" />
        </g>
        <rect x="40" y="200" width="160" height="100" fill="url(#lueur)" />
        <g transform="translate(120 190) scale(0.62)" color="#ffffff">
          <PatternPaths opacity={0.28} />
        </g>
      </g>

      <use href="#arcade" fill="none" stroke="var(--primary)" strokeWidth="3" />
      <rect x="28" y="298" width="184" height="12" rx="4" fill="var(--primary-dark)" />
    </svg>
  );
}

/**
 * Illustration d'inscription : un mushaf ouvert d'où s'élèvent des versets.
 * Le mouvement est ascendant, là où l'écran de connexion est un seuil — on
 * ne commence pas un parcours de mémorisation sur la même image que celle qui
 * accueille un retour.
 */
export function RegisterArtwork({ style, className }: ArtProps) {
  const lignes = [0, 1, 2, 3, 4];

  return (
    <svg viewBox="0 0 260 300" style={style} className={className} role="img"
         aria-label="Mushaf ouvert d'où s'élèvent des versets">
      <defs>
        <linearGradient id="pageG" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--surface-alt)" />
          <stop offset="100%" stopColor="var(--surface)" />
        </linearGradient>
        <linearGradient id="pageD" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--surface-alt)" />
          <stop offset="100%" stopColor="var(--surface)" />
        </linearGradient>
      </defs>

      {/* Versets qui s'élèvent : opacité décroissante avec la hauteur, pour
          suggérer la mémorisation plutôt que la simple lecture. */}
      <g opacity="0.9">
        {[[90, 92], [130, 58], [170, 86], [110, 34], [152, 26]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`} opacity={0.75 - i * 0.12}>
            <rect x="-26" y="-6" width="52" height="4" rx="2" fill="var(--primary)" />
            <rect x="-18" y="2" width="36" height="4" rx="2" fill="var(--accent)" />
          </g>
        ))}
      </g>

      <g transform="translate(130 210)">
        <ellipse cy="62" rx="112" ry="12" fill="var(--canvas-deep)" opacity="0.16" />

        <path d="M-6,-52 L-104,-34 Q-108,-33 -108,-28 L-108,36 Q-108,41 -103,40 L-6,24 Z"
              fill="url(#pageG)" stroke="var(--border)" strokeWidth="1.5" />
        <path d="M6,-52 L104,-34 Q108,-33 108,-28 L108,36 Q108,41 103,40 L6,24 Z"
              fill="url(#pageD)" stroke="var(--border)" strokeWidth="1.5" />

        {/* Lignes de texte : plus courtes vers le bas, comme une page réelle. */}
        {lignes.map((l) => (
          <g key={l}>
            <rect x={-96} y={-24 + l * 12} width={78 - l * 5} height="3.4" rx="1.7"
                  fill="var(--text-muted)" opacity="0.5" />
            <rect x={18 + l * 5} y={-24 + l * 12} width={78 - l * 5} height="3.4" rx="1.7"
                  fill="var(--text-muted)" opacity="0.5" />
          </g>
        ))}

        <path d="M0,-54 L0,26" stroke="var(--primary-dark)" strokeWidth="3" strokeLinecap="round" />
        {/* Signet */}
        <path d="M0,26 L0,58 L-9,48 L-18,58 L-18,22 Z" fill="var(--primary)" />
      </g>
    </svg>
  );
}

/**
 * Bandeau de la page d'accueil publique : silhouette urbaine avec coupoles et
 * minarets, posée sur un dégradé. Rendue en une seule passe de chemins pour
 * rester légère à l'affichage.
 */
export function LandingArtwork({ style, className }: ArtProps) {
  return (
    <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice"
         style={style} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="aube" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary-dark)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--primary-dark)" stopOpacity="0.42" />
        </linearGradient>
      </defs>

      <rect width="800" height="300" fill="url(#aube)" />

      <g fill="var(--primary-dark)" opacity="0.5">
        {/* Minarets */}
        {[120, 300, 520, 690].map((x, i) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <rect x="-7" y={128 + i * 8} width="14" height={172 - i * 8} />
            <rect x="-11" y={150 + i * 8} width="22" height="5" />
            <path d={`M0,${112 + i * 8} L9,${130 + i * 8} L-9,${130 + i * 8} Z`} />
          </g>
        ))}
        {/* Coupoles */}
        {[[210, 62], [420, 78], [600, 54]].map(([x, r], i) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <path d={`M${-r},240 Q${-r},${240 - r * 1.5} 0,${240 - r * 1.5} Q${r},${240 - r * 1.5} ${r},240 Z`} />
            <rect x={-r} y="240" width={r * 2} height="60" />
            <path d={`M0,${238 - r * 1.5} l0,-14 M-5,${230 - r * 1.5} l10,0`}
                  stroke="var(--primary-dark)" strokeWidth="3" fill="none" />
          </g>
        ))}
        <rect y="272" width="800" height="28" />
      </g>
    </svg>
  );
}

/** Marque de l'application, utilisée par les deux en-têtes. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} role="img" aria-label="Salifz">
      <rect width="48" height="48" rx="12" fill="var(--primary-dark)" />
      <g transform="translate(24 24) scale(0.3)" color="#ffffff">
        <PatternPaths opacity={0.35} />
      </g>
      <text x="24" y="33" textAnchor="middle" fontSize="24" fontWeight="700" fill="#ffffff">
        س
      </text>
    </svg>
  );
}
