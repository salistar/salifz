/**
 * Badge Component - Salifz
 * Badges et indicateurs
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  content?: string | number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  dot?: boolean;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  content,
  variant = 'default',
  size = 'medium',
  dot = false,
  style,
}) => {
  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'info': return '#2196F3';
      default: return '#9E9E9E';
    }
  };

  const getSize = () => {
    if (dot) {
      switch (size) {
        case 'small': return { width: 6, height: 6 };
        case 'large': return { width: 12, height: 12 };
        default: return { width: 8, height: 8 };
      }
    }

    switch (size) {
      case 'small': return { minWidth: 16, height: 16, fontSize: 10, paddingHorizontal: 4 };
      case 'large': return { minWidth: 24, height: 24, fontSize: 14, paddingHorizontal: 8 };
      default: return { minWidth: 20, height: 20, fontSize: 12, paddingHorizontal: 6 };
    }
  };

  const sizeStyle = getSize();

  if (dot) {
    return (
      <View
        style={[
          styles.dot,
          {
            backgroundColor: getBackgroundColor(),
            width: sizeStyle.width,
            height: sizeStyle.height,
            borderRadius: sizeStyle.width! / 2,
          },
          style,
        ]}
      />
    );
  }

  const displayContent = typeof content === 'number' && content > 99 ? '99+' : content;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          minWidth: sizeStyle.minWidth,
          height: sizeStyle.height,
          borderRadius: sizeStyle.height! / 2,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize: sizeStyle.fontSize }]}>
        {displayContent}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dot: {},
});

export default Badge;
