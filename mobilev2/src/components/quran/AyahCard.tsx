/**
 * AyahCard Component - Salifz
 * Affichage d'un verset du Coran
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface AyahCardProps {
  ayahNumber: number;
  arabicText: string;
  translation?: string;
  transliteration?: string;
  showTranslation?: boolean;
  showTransliteration?: boolean;
  status?: 'not_started' | 'learning' | 'memorized' | 'mastered';
  confidence?: number;
  onPress?: () => void;
  onPlayAudio?: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  isPlaying?: boolean;
  isRTL?: boolean;
}

export const AyahCard: React.FC<AyahCardProps> = ({
  ayahNumber,
  arabicText,
  translation,
  transliteration,
  showTranslation = true,
  showTransliteration = false,
  status = 'not_started',
  confidence,
  onPress,
  onPlayAudio,
  onBookmark,
  isBookmarked = false,
  isPlaying = false,
  isRTL = true,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const getStatusColor = (): string => {
    switch (status) {
      case 'mastered': return colors.primary;
      case 'memorized': return '#8BC34A';
      case 'learning': return colors.warning;
      default: return colors.border;
    }
  };

  const getStatusIcon = (): string => {
    switch (status) {
      case 'mastered': return 'checkmark-done-circle';
      case 'memorized': return 'checkmark-circle';
      case 'learning': return 'time';
      default: return 'ellipse-outline';
    }
  };

  return (
    <TouchableOpacity accessible accessibilityRole="button"
      style={styles.container}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.ayahNumber}>
          <Text style={styles.ayahNumberText}>{ayahNumber}</Text>
        </View>
        
        <View style={styles.actions}>
          {onPlayAudio && (
            <TouchableOpacity accessible accessibilityRole="button" onPress={onPlayAudio} style={styles.actionButton}>
              <Ionicons
                name={isPlaying ? 'pause-circle' : 'play-circle'}
                size={28}
                color={isPlaying ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          
          {onBookmark && (
            <TouchableOpacity accessible accessibilityRole="button" onPress={onBookmark} style={styles.actionButton}>
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isBookmarked ? colors.warning : colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]}>
            <Ionicons name={getStatusIcon() as any} size={16} color={colors.onDeep} />
          </View>
        </View>
      </View>

      {/* Arabic Text */}
      <Text style={[styles.arabicText, isRTL && styles.rtlText]}>
        {arabicText}
      </Text>

      {/* Transliteration */}
      {showTransliteration && transliteration && (
        <Text style={styles.transliteration}>{transliteration}</Text>
      )}

      {/* Translation */}
      {showTranslation && translation && (
        <Text style={styles.translation}>{translation}</Text>
      )}

      {/* Confidence Bar */}
      {confidence !== undefined && status !== 'not_started' && (
        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceLabel}>Confidence</Text>
          <View style={styles.confidenceBar}>
            <View
              style={[
                styles.confidenceFill,
                {
                  width: `${confidence}%`,
                  backgroundColor: confidence >= 80 ? colors.primary : confidence >= 50 ? colors.warning : colors.error,
                },
              ]}
            />
          </View>
          <Text style={styles.confidenceValue}>{confidence}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ayahNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: c.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginLeft: 8,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  arabicText: {
    fontSize: 28,
    lineHeight: 50,
    color: '#1A1A1A',
    fontFamily: 'System',
    marginBottom: 12,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  transliteration: {
    fontSize: 14,
    color: c.textSecondary,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  translation: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.backgroundAlt,
  },
  confidenceLabel: {
    fontSize: 12,
    color: c.textMuted,
    marginRight: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 6,
    backgroundColor: c.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 3,
  },
  confidenceValue: {
    fontSize: 12,
    fontWeight: '600',
    color: c.textSecondary,
    marginLeft: 8,
    minWidth: 35,
    textAlign: 'right',
  },
});

export default AyahCard;
