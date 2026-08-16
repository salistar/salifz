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
  badgeColor = '#4CAF50',
  isOnline,
  level,
}) => {
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

  const getGradientColors = (): string[] => {
    if (!name) return ['#9E9E9E', '#757575'];
    const colors = [
      ['#4CAF50', '#2E7D32'],
      ['#2196F3', '#1565C0'],
      ['#FF9800', '#F57C00'],
      ['#9C27B0', '#7B1FA2'],
      ['#F44336', '#C62828'],
      ['#00BCD4', '#0097A7'],
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <View style={[{ position: 'relative' }, style]}>
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
          colors={getGradientColors()}
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
              backgroundColor: isOnline ? '#4CAF50' : '#9E9E9E',
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
              backgroundColor: badgeColor,
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

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#E0E0E0',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  onlineIndicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  levelBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    color: '#333',
    fontWeight: '700',
  },
});

export default Avatar;
