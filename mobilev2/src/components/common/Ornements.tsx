/**
 * Ornements — Salifz mobile
 *
 * Portage des ornements du web (`web/src/components/Ornements.tsx`) en
 * `react-native-svg`. Le dessin est identique au trait près : le même compte
 * ouvre les deux applications, et une étoile de hizb qui change de forme d'un
 * écran à l'autre cesse d'être une signature.
 *
 * Le rub' el hizb (۞) est l'élément qui revient partout : il marque les quarts
 * de hizb dans le mushaf imprimé, et sert ici d'unité de progression. Une
 * étoile remplie de deux quarts dit « à moitié » sans qu'on ait à lire un
 * pourcentage.
 */

import React from 'react';
import Svg, { Path, G, Circle, Defs, ClipPath, Rect } from 'react-native-svg';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type Quarts = 0 | 1 | 2 | 3 | 4;

/**
 * Étoile à huit branches du rub' el hizb : deux carrés superposés, l'un
 * tourné de 45°. C'est la construction du motif réel, pas une étoile
 * générique — les branches sont donc à angle droit, pas pointues.
 */
const CHEMIN_ETOILE =
  'M12 2.6 L15.1 8.9 L21.4 12 L15.1 15.1 L12 21.4 L8.9 15.1 L2.6 12 L8.9 8.9 Z';
const CHEMIN_CARRE = 'M4.4 4.4 H19.6 V19.6 H4.4 Z';

export function HizbStar({
  size = 24,
  quarters = 0,
  color,
}: {
  size?: number;
  quarters?: Quarts;
  color?: string;
}) {
  const { colors } = useTheme();
  const teinte = color ?? colors.accent;

  // Le remplissage se fait par quarts, dans le sens horaire depuis le haut.
  // Un rectangle de découpe par quart : plus lisible qu'un arc, et exact.
  const decoupes: Record<Quarts, { x: number; y: number; w: number; h: number }[]> = {
    0: [],
    1: [{ x: 12, y: 0, w: 12, h: 12 }],
    2: [{ x: 12, y: 0, w: 12, h: 24 }],
    3: [{ x: 12, y: 0, w: 12, h: 24 }, { x: 0, y: 12, w: 12, h: 12 }],
    4: [{ x: 0, y: 0, w: 24, h: 24 }],
  };

  const id = `hizb-${quarters}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <ClipPath id={id}>
          {decoupes[quarters].map((r, i) => (
            <Rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} />
          ))}
        </ClipPath>
      </Defs>

      {/* Contour toujours visible : une étoile vide reste une étoile. */}
      <G stroke={teinte} strokeWidth={1.3} fill="none" opacity={0.9}>
        <Path d={CHEMIN_ETOILE} />
        <Path d={CHEMIN_CARRE} />
      </G>

      {quarters > 0 && (
        <G clipPath={`url(#${id})`}>
          <Path d={CHEMIN_ETOILE} fill={teinte} opacity={0.9} />
          <Path d={CHEMIN_CARRE} fill={teinte} opacity={0.55} />
        </G>
      )}
    </Svg>
  );
}

/**
 * Champ de zellige — motif géométrique en fond.
 *
 * L'opacité est plafonnée volontairement : au-delà, le motif concurrence le
 * texte qu'il est censé porter. C'est un fond, pas une illustration.
 */
export function ZelligeField({
  style,
  color,
  opacity = 0.04,
}: {
  style?: ViewStyle;
  color?: string;
  opacity?: number;
}) {
  const { colors } = useTheme();
  const teinte = color ?? colors.accent;
  const opacite = Math.min(opacity, 0.06);

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice">
        <G stroke={teinte} strokeWidth={0.8} fill="none" opacity={opacite}>
          {[0, 40, 80].map((x) =>
            [0, 40, 80].map((y) => (
              <G key={`${x}-${y}`} transform={`translate(${x + 20}, ${y + 20})`}>
                <Path d="M0 -14 L4 -4 L14 0 L4 4 L0 14 L-4 4 L-14 0 L-4 -4 Z" />
                <Path d="M-9 -9 H9 V9 H-9 Z" />
              </G>
            ))
          )}
        </G>
      </Svg>
    </View>
  );
}

/**
 * Arche de mihrab — la niche qui indique la direction de la prière.
 *
 * Sert de cadre aux états vides et aux portraits. Sa forme dit « lieu de
 * récitation » à quelqu'un qui l'a déjà vue, et reste un cadre neutre pour
 * les autres.
 */
export function MihrabArch({
  width = 96,
  height,
  color,
}: {
  width?: number;
  height?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  const teinte = color ?? colors.primary;
  const h = height ?? width * 1.35;

  return (
    <Svg width={width} height={h} viewBox="0 0 80 108">
      <Path
        d="M8 106 V44 C8 22 22 6 40 6 C58 6 72 22 72 44 V106"
        stroke={teinte}
        strokeWidth={1.6}
        fill="none"
      />
      <Path
        d="M18 106 V46 C18 30 28 18 40 18 C52 18 62 30 62 46 V106"
        stroke={teinte}
        strokeWidth={1}
        fill="none"
        opacity={0.4}
      />
      <Circle cx={40} cy={44} r={5} stroke={colors.accent} strokeWidth={1.2} fill="none" />
    </Svg>
  );
}

/**
 * Séparateur de section : un filet interrompu par une étoile.
 *
 * Remplace le trait plein, qui coupe la page en deux. Ici la ligne se retire
 * pour laisser passer l'ornement, comme dans un colophon.
 */
export function SeparateurSection({ style }: { style?: ViewStyle }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.separateur, style]}>
      <View style={[styles.filet, { backgroundColor: colors.border }]} />
      <HizbStar size={14} quarters={4} color={colors.accent} />
      <View style={[styles.filet, { backgroundColor: colors.border }]} />
    </View>
  );
}

/**
 * Barre de progression marquée d'une étoile.
 *
 * L'étoile se déplace avec la valeur et se remplit par quarts : elle donne le
 * niveau atteint même pour quelqu'un qui ne distingue pas le vert du gris.
 */
export function HizbProgress({
  value,
  max,
  label,
  style,
}: {
  value: number;
  max: number;
  label?: string;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const part = max > 0 ? Math.min(1, value / max) : 0;
  const quarts = Math.round(part * 4) as Quarts;

  return (
    <View style={style}>
      {label != null && (
        <View style={styles.ligneLibelle}>
          <Text style={[styles.libelle, { color: colors.text }]} numberOfLines={1}>
            {label}
          </Text>
          <Text style={[styles.valeur, { color: colors.textSecondary }]}>
            {value}/{max}
          </Text>
        </View>
      )}

      <View style={styles.piste}>
        <View style={[styles.rail, { backgroundColor: colors.surfaceAlt }]}>
          <View
            style={[styles.remplissage, { width: `${part * 100}%`, backgroundColor: colors.primary }]}
          />
        </View>
        {/* L'étoile suit la valeur. Elle est posée par-dessus le rail, pas
            dedans : sinon elle serait rognée aux extrémités. */}
        <View style={[styles.marqueur, { left: `${part * 100}%` }]}>
          <HizbStar size={14} quarters={quarts} color={colors.accent} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  separateur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  filet: { flex: 1, height: 1 },

  ligneLibelle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  libelle: { flex: 1, fontSize: 15 },
  valeur: { fontSize: 13, fontVariant: ['tabular-nums'] },

  piste: { justifyContent: 'center', height: 16 },
  rail: { height: 4, borderRadius: 2, overflow: 'hidden' },
  remplissage: { height: '100%', borderRadius: 2 },
  marqueur: { position: 'absolute', marginLeft: -7 },
});
