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
  color = '#4CAF50',
}) => {
  if (!visible) return null;

  const spinner = (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size={size} color={color} />
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
            <ActivityIndicator size="large" color={color} />
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
          colors={['#2E7D32', '#4CAF50', '#81C784']}
          style={styles.gradient}
        >
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>📖</Text>
            <Text style={styles.appName}>حِفْظ سالي</Text>
            <Text style={styles.appNameEn}>Salifz</Text>
          </View>
          <ActivityIndicator size="large" color="#FFFFFF" />
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

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 150,
  },
  overlayText: {
    marginTop: 16,
    fontSize: 14,
    color: '#333',
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
    color: '#FFFFFF',
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
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
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
