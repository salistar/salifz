/**
 * Ornements — Salifz
 *
 * Trois motifs, générés en code et jamais en image : ils suivent le thème,
 * restent nets à toute densité d'écran, et ne coûtent aucun téléchargement.
 *
 * L'élément signature est le **rub' el hizb** (۞). Dans le mushaf réel, il
 * marque les quarts de hizb : ce n'est donc pas un ornement, il encode une
 * information vraie sur la découpe du texte. C'est pour cela qu'il devient
 * l'unité visuelle du produit — jalons, progression, séparateurs — plutôt
 * qu'une forme choisie pour son allure.
 *
 * Une seule audace, tenue partout. Le reste de l'interface reste géométrique
 * et silencieux : un élément décoratif qui ne sert ni la lecture ni la
 * progression saute.
 */

import { CSSProperties } from 'react';

interface OrnementProps {
  style?: CSSProperties;
  className?: string;
}

/* ------------------------------------------------------------------ */
/* HizbStar — étoile à huit branches, remplie par quarts               */
/* ------------------------------------------------------------------ */

interface HizbStarProps extends OrnementProps {
  /** Taille en pixels. */
  size?: number;
  /** Quarts remplis, de 0 à 4 — comme les quarts de hizb du mushaf. */
  quarters?: 0 | 1 | 2 | 3 | 4;
  /** Couleur du remplissage. Par défaut, la couleur d'accent héritée. */
  color?: string;
  /** Étiquette lue par les lecteurs d'écran. Sans elle, l'étoile est décorative. */
  label?: string;
}

/**
 * Le rub' el hizb : deux carrés superposés à 45°, comme dans le glyphe ۞.
 * Le remplissage par quarts se fait par un masque angulaire, ce qui permet
 * d'animer la progression sans redessiner la forme.
 */
export function HizbStar({
  size = 24,
  quarters = 4,
  color = 'currentColor',
  label,
  style,
  className,
}: HizbStarProps) {
  const id = `hizb-${size}-${quarters}`;
  const carre = 'M50,8 L92,50 L50,92 L8,50 Z';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      style={style}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <defs>
        <clipPath id={`${id}-quarts`}>
          {/* Un rectangle par quart : 4/4 couvre tout, 1/4 le coin supérieur. */}
          {quarters >= 1 && <rect x="50" y="0" width="50" height="50" />}
          {quarters >= 2 && <rect x="50" y="50" width="50" height="50" />}
          {quarters >= 3 && <rect x="0" y="50" width="50" height="50" />}
          {quarters >= 4 && <rect x="0" y="0" width="50" height="50" />}
        </clipPath>
      </defs>

      {/* Contour : toujours visible, même à zéro quart. */}
      <g fill="none" stroke={color} strokeWidth="6" strokeLinejoin="round" opacity="0.55">
        <path d={carre} />
        <path d={carre} transform="rotate(45 50 50)" />
      </g>

      {/* Remplissage, découpé aux quarts atteints. */}
      {quarters > 0 && (
        <g clipPath={`url(#${id}-quarts)`} fill={color}>
          <path d={carre} />
          <path d={carre} transform="rotate(45 50 50)" />
        </g>
      )}

      <circle cx="50" cy="50" r="7" fill={color} opacity={quarters === 4 ? 1 : 0.4} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* ZelligeField — pavage de fond                                       */
/* ------------------------------------------------------------------ */

/**
 * Pavage à huit branches, en trait seul. Opacité plafonnée à 4 % et jamais
 * sous un paragraphe : au-delà, le motif entre en concurrence avec le texte,
 * ce qui est particulièrement coûteux en arabe où les diacritiques sont fins.
 */
export function ZelligeField({
  style,
  className,
  opacity = 0.03,
  tile = 88,
}: OrnementProps & { opacity?: number; tile?: number }) {
  const plafond = Math.min(opacity, 0.04);

  return (
    <svg style={style} className={className} aria-hidden="true" width="100%" height="100%">
      <defs>
        <pattern id={`zellige-${tile}`} width={tile} height={tile} patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="1" opacity={plafond}>
            <path d={`M${tile / 2},2 L${tile - 2},${tile / 2} L${tile / 2},${tile - 2} L2,${tile / 2} Z`} />
            <path
              d={`M${tile / 2},2 L${tile - 2},${tile / 2} L${tile / 2},${tile - 2} L2,${tile / 2} Z`}
              transform={`rotate(45 ${tile / 2} ${tile / 2})`}
            />
            <circle cx={tile / 2} cy={tile / 2} r={tile / 6} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#zellige-${tile})`} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* MihrabArch — arche en ogive                                         */
/* ------------------------------------------------------------------ */

/**
 * L'arche en ogive était déjà le meilleur geste graphique du produit, isolé
 * sur les écrans d'authentification. Elle devient un composant partagé : c'est
 * elle qui irrigue les héros et les états vides majeurs.
 */
export function MihrabArch({
  style,
  className,
  showCrescent = true,
  showRosette = true,
}: OrnementProps & { showCrescent?: boolean; showRosette?: boolean }) {
  const etoiles = [
    [52, 96, 1.6], [86, 62, 1.1], [120, 88, 1.8], [150, 58, 1.2],
    [70, 140, 1.3], [132, 148, 1.5], [178, 112, 1.1], [38, 168, 1.2],
  ];

  return (
    <svg viewBox="0 0 240 320" style={style} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mihrab-ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--surface-sunken)" />
          <stop offset="100%" stopColor="var(--brand-sunken)" />
        </linearGradient>
        <path id="mihrab-arc" d="M40,300 L40,140 Q40,60 120,26 Q200,60 200,140 L200,300 Z" />
        <clipPath id="mihrab-clip"><use href="#mihrab-arc" /></clipPath>
      </defs>

      <use href="#mihrab-arc" fill="url(#mihrab-ciel)" />

      <g clipPath="url(#mihrab-clip)">
        {etoiles.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="var(--accent-text)" opacity={0.4 + (i % 3) * 0.2} />
        ))}

        {showCrescent && (
          // Croissant par soustraction : un disque masqué par un second,
          // décalé. Une courbe dessinée à la main donnerait une forme fausse.
          <g transform="translate(158 74)">
            <circle r="20" fill="var(--accent-text)" opacity="0.9" />
            <circle r="20" cx="8" cy="-6" fill="url(#mihrab-ciel)" />
          </g>
        )}

        {showRosette && (
          <g transform="translate(120 200)" color="var(--accent)" opacity="0.28">
            <HizbStar size={120} quarters={4} color="currentColor" />
          </g>
        )}
      </g>

      <use href="#mihrab-arc" fill="none" stroke="var(--border-gold)" strokeWidth="2" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Séparateur de section                                               */
/* ------------------------------------------------------------------ */

/** Filet d'or dégradé avec une étoile centrée — la ponctuation du produit. */
export function SeparateurSection({ style, className }: OrnementProps) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }}
      className={className}
      role="separator"
    >
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, var(--border-gold))' }} />
      <HizbStar size={14} quarters={4} color="var(--accent)" />
      <span style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, var(--border-gold))' }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* HizbProgress — barre de progression à jalon                         */
/* ------------------------------------------------------------------ */

/**
 * Barre dont l'étoile de fin s'allume à 100 %. C'est la même unité visuelle
 * que le reste : la progression se lit dans le vocabulaire du mushaf.
 */
export function HizbProgress({
  value,
  max = 100,
  label,
  showValue = true,
}: {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
}) {
  const pourcent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const quarts = Math.min(4, Math.floor(pourcent / 25)) as 0 | 1 | 2 | 3 | 4;

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          {label && <span style={{ flex: 1, fontSize: 15 }}>{label}</span>}
          {showValue && (
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 13, color: 'var(--text-muted)' }}>
              {value}/{max}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label}
          style={{
            flex: 1,
            height: 8,
            borderRadius: 4,
            background: 'var(--surface-sunken)',
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              // `inline-size` plutôt que `width` : la barre se remplit de
              // droite à gauche en arabe sans code conditionnel.
              inlineSize: `${pourcent}%`,
              blockSize: '100%',
              background: 'var(--brand)',
              transition: 'inline-size 200ms cubic-bezier(0.2,0.8,0.2,1)',
            }}
          />
        </div>

        <HizbStar
          size={18}
          quarters={quarts}
          color={pourcent >= 100 ? 'var(--accent)' : 'var(--text-faint)'}
        />
      </div>
    </div>
  );
}
