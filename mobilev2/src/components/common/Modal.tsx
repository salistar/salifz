/**
 * Modal Component - Salifz
 * Modal réutilisable
 */

import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: 'center' | 'bottom' | 'fullscreen';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  style?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  variant = 'center',
  showCloseButton = true,
  closeOnBackdrop = true,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'bottom':
        return styles.bottomContainer;
      case 'fullscreen':
        return styles.fullscreenContainer;
      default:
        return styles.centerContainer;
    }
  };

  const getContentStyle = (): ViewStyle => {
    switch (variant) {
      case 'bottom':
        return styles.bottomContent;
      case 'fullscreen':
        return styles.fullscreenContent;
      default:
        return styles.centerContent;
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={variant === 'bottom' ? 'slide' : 'fade'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback
        onPress={closeOnBackdrop ? onClose : undefined}
      >
        <View style={[styles.backdrop, getContainerStyle()]}>
          <TouchableWithoutFeedback>
            <View style={[getContentStyle(), style]}>
              {/* Header */}
              {(title || showCloseButton) && (
                <View style={styles.header}>
                  {title && (
                    <Text style={styles.title}>{title}</Text>
                  )}
                  {showCloseButton && (
                    <TouchableOpacity accessible accessibilityRole="button"
                      onPress={onClose}
                      style={styles.closeButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close" size={24} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Content */}
              <ScrollView
                style={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  bottomContainer: {
    justifyContent: 'flex-end',
  },
  fullscreenContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    backgroundColor: c.surface,
    borderRadius: 20,
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.8,
    overflow: 'hidden',
  },
  bottomContent: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
    overflow: 'hidden',
  },
  fullscreenContent: {
    backgroundColor: c.surface,
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: c.backgroundAlt,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: c.text,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
  },
});

export default Modal;
