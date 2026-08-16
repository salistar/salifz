/**
 * Card Component - Salifz
 * Carte réutilisable avec différents styles
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'gradient';
  onPress?: () => void;
  style?: ViewStyle;
  gradientColors?: string[];
  padding?: number;
  borderRadius?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  gradientColors = ['#4CAF50', '#2E7D32'],
  padding = 16,
  borderRadius = 16,
}) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius,
      padding,
      backgroundColor: '#FFFFFF',
    };

    switch (variant) {
      case 'elevated':
        baseStyle.shadowColor = '#000';
        baseStyle.shadowOffset = { width: 0, height: 4 };
        baseStyle.shadowOpacity = 0.1;
        baseStyle.shadowRadius = 8;
        baseStyle.elevation = 4;
        break;
      case 'outlined':
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = '#E0E0E0';
        break;
      case 'gradient':
        baseStyle.backgroundColor = undefined;
        break;
    }

    return baseStyle;
  };

  const content = (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );

  if (variant === 'gradient') {
    const gradientContent = (
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[{ borderRadius, padding }, style]}
      >
        {children}
      </LinearGradient>
    );

    if (onPress) {
      return (
        <TouchableOpacity accessible accessibilityRole="button" onPress={onPress} activeOpacity={0.9}>
          {gradientContent}
        </TouchableOpacity>
      );
    }

    return gradientContent;
  }

  if (onPress) {
    return (
      <TouchableOpacity accessible accessibilityRole="button" onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default Card;
