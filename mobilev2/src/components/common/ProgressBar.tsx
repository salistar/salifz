/**
 * ProgressBar Component - Salifz
 * Barre de progression animée
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  showLabel?: boolean;
  labelPosition?: 'inside' | 'outside' | 'top';
  variant?: 'default' | 'gradient' | 'striped';
  color?: string;
  gradientColors?: string[];
  backgroundColor?: string;
  animated?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  showLabel = false,
  labelPosition = 'outside',
  variant = 'default',
  color,
  gradientColors,
  backgroundColor,
  animated = true,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // Les valeurs par défaut sont résolues depuis le thème, et non figées à la
  // déstructuration où le contexte n'est pas encore disponible.
  const tint = color ?? colors.primary;
  const gradient = gradientColors ?? [colors.primary, colors.primaryLight];
  const track = backgroundColor ?? colors.border;

  const animatedValue = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(100, Math.max(0, progress));

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: clampedProgress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(clampedProgress);
    }
  }, [clampedProgress, animated]);

  const width = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const renderProgress = () => {
    if (variant === 'gradient') {
      return (
        <Animated.View style={{ width, height, overflow: 'hidden', borderRadius: height / 2 }}>
          <LinearGradient
            colors={gradient as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      );
    }

    return (
      <Animated.View
        style={[
          styles.progress,
          {
            width,
            height,
            backgroundColor: tint,
            borderRadius: height / 2,
          },
        ]}
      />
    );
  };

  const renderLabel = () => {
    if (!showLabel) return null;

    const label = `${Math.round(clampedProgress)}%`;

    if (labelPosition === 'inside' && height >= 16) {
      return (
        <Text style={[styles.labelInside, { fontSize: height * 0.7 }]}>
          {label}
        </Text>
      );
    }

    if (labelPosition === 'top') {
      return (
        <Text style={styles.labelTop}>{label}</Text>
      );
    }

    return (
      <Text style={styles.labelOutside}>{label}</Text>
    );
  };

  return (
    // Une barre de progression muette n'apprend rien à un lecteur d'écran :
    // le rôle et la valeur permettent d'annoncer « progression, 62 % ».
    <View
      style={style}
      accessible
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedProgress) }}
    >
      {labelPosition === 'top' && renderLabel()}
      
      <View style={styles.row}>
        <View
          style={[
            styles.container,
            {
              height,
              backgroundColor: track,
              borderRadius: height / 2,
            },
          ]}
        >
          {renderProgress()}
          {labelPosition === 'inside' && renderLabel()}
        </View>
        
        {labelPosition === 'outside' && renderLabel()}
      </View>
    </View>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelInside: {
    position: 'absolute',
    alignSelf: 'center',
    color: c.onDeep,
    fontWeight: '700',
  },
  labelOutside: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
  },
  labelTop: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
    marginBottom: 4,
    textAlign: 'right',
  },
});

export default ProgressBar;
