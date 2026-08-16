/**
 * Loading Component - Salifz
 * Indicateurs de chargement
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface LoadingProps {
  visible?: boolean;
  text?: string;
  variant?: 'spinner' | 'overlay' | 'fullscreen' | 'inline';
  size?: 'small' | 'large';
  color?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  visible = true,
  text,
  variant = 'spinner',
  size = 'large',
  color,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const tint = color ?? colors.primary;

  if (!visible) return null;

  const spinner = (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={tint} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );

  if (variant === 'inline') {
    return spinner;
  }

  if (variant === 'overlay') {
    return (
      <Modal transparent visible={visible} statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator size="large" color={tint} />
            {text && <Text style={styles.overlayText}>{text}</Text>}
          </View>
        </View>
      </Modal>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <View style={styles.fullscreen}>
        <LinearGradient
          colors={[colors.primaryDark, colors.primary, colors.primaryLight]}
          style={styles.gradient}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>📖</Text>
            <Text style={styles.appName}>حِفْظ سالي</Text>
            <Text style={styles.appNameEn}>Salifz</Text>
          </View>
          <ActivityIndicator size="large" color={colors.onDeep} />
          {text && <Text style={styles.fullscreenText}>{text}</Text>}
        </LinearGradient>
      </View>
    );
  }

  return spinner;
};

// Skeleton Loading
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 4,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

// Skeleton Card
export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonHeader}>
        <Skeleton width={48} height={48} borderRadius={24} />
        <View style={styles.skeletonHeaderText}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? '70%' : '100%'}
          height={14}
          style={{ marginTop: 12 }}
        />
      ))}
    </View>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: c.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 150,
  },
  overlayText: {
    marginTop: 16,
    fontSize: 14,
    color: c.text,
    textAlign: 'center',
  },
  fullscreen: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: c.onDeep,
    marginBottom: 4,
  },
  appNameEn: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  fullscreenText: {
    marginTop: 24,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  skeleton: {
    backgroundColor: c.border,
    overflow: 'hidden',
  },
  skeletonCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
});

export default Loading;
