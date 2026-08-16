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
  color = '#4CAF50',
  gradientColors = ['#4CAF50', '#81C784'],
  backgroundColor = '#E0E0E0',
  animated = true,
  style,
}) => {
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
            colors={gradientColors as [string, string, ...string[]]}
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
            backgroundColor: color,
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
    <View style={style}>
      {labelPosition === 'top' && renderLabel()}
      
      <View style={styles.row}>
        <View
          style={[
            styles.container,
            {
              height,
              backgroundColor,
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

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
    fontWeight: '700',
  },
  labelOutside: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  labelTop: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
  },
});

export default ProgressBar;
