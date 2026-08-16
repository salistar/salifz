/**
 * Avatar Component - Salifz
 * Affichage d'avatar utilisateur
 */

import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: ViewStyle;
  showBadge?: boolean;
  badgeContent?: string | number;
  badgeColor?: string;
  isOnline?: boolean;
  level?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'medium',
  style,
  showBadge = false,
  badgeContent,
  // La valeur par défaut ne peut plus être une couleur figée : elle est
  // résolue depuis le thème dans le corps du composant.
  badgeColor,
  isOnline,
  level,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const getSize = (): number => {
    switch (size) {
      case 'small': return 32;
      case 'large': return 64;
      case 'xlarge': return 96;
      default: return 48;
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'small': return 12;
      case 'large': return 24;
      case 'xlarge': return 36;
      default: return 18;
    }
  };

  const avatarSize = getSize();
  const fontSize = getFontSize();

  const getInitials = (): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const badgeTint = badgeColor ?? colors.primary;

  // Dégradé déterministe déduit de l'initiale, pour que le même nom garde
  // toujours la même couleur. La liste locale s'appelait `colors` et masquait
  // le thème du même nom.
  const getGradientColors = (): string[] => {
    if (!name) return [colors.textMuted, colors.textSecondary];
    const palettes = [
      [colors.primary, colors.primaryDark],
      [colors.info, colors.infoStrong],
      [colors.warning, colors.warningStrong],
      [colors.accent, colors.accentDeep],
      [colors.error, colors.error],
      [colors.primaryLight, colors.primary],
    ];
    const index = name.charCodeAt(0) % palettes.length;
    return palettes[index];
  };

  return (
    // Regroupé en un seul élément : sans cela, le lecteur d'écran énumère
    // séparément les initiales, le badge et l'indicateur de présence.
    <View
      style={[{ position: 'relative' }, style]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={name ? `Avatar de ${name}` : undefined}
    >
      {source ? (
        <Image
          source={{ uri: source }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <LinearGradient
          colors={getGradientColors() as [string, string, ...string[]]}
          style={[
            styles.placeholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize }]}>
            {getInitials()}
          </Text>
        </LinearGradient>
      )}

      {/* Online indicator */}
      {isOnline !== undefined && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: avatarSize * 0.25,
              height: avatarSize * 0.25,
              borderRadius: avatarSize * 0.125,
              backgroundColor: isOnline ? colors.primary : colors.textMuted,
              right: 0,
              bottom: 0,
            },
          ]}
        />
      )}

      {/* Badge */}
      {showBadge && badgeContent !== undefined && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: badgeTint,
              minWidth: avatarSize * 0.4,
              height: avatarSize * 0.4,
              borderRadius: avatarSize * 0.2,
              right: -avatarSize * 0.1,
              top: -avatarSize * 0.1,
            },
          ]}
        >
          <Text style={[styles.badgeText, { fontSize: avatarSize * 0.2 }]}>
            {typeof badgeContent === 'number' && badgeContent > 99 ? '99+' : badgeContent}
          </Text>
        </View>
      )}

      {/* Level badge */}
      {level !== undefined && (
        <View
          style={[
            styles.levelBadge,
            {
              width: avatarSize * 0.5,
              height: avatarSize * 0.35,
              borderRadius: avatarSize * 0.1,
              bottom: -avatarSize * 0.1,
            },
          ]}
        >
          <Text style={[styles.levelText, { fontSize: avatarSize * 0.18 }]}>
            Lv.{level}
          </Text>
        </View>
      )}
    </View>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  image: {
    backgroundColor: c.border,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: c.onDeep,
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: c.surface,
  },
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: c.onDeep,
    fontWeight: '700',
  },
  levelBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: c.warning,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    color: c.text,
    fontWeight: '700',
  },
});

export default Avatar;
