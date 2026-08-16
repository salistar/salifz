/**
 * SurahCard Component - Salifz
 * Carte d'une sourate
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '../common/ProgressBar';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

interface SurahCardProps {
  number: number;
  name: string;
  englishName: string;
  versesCount: number;
  revelationType: 'Meccan' | 'Medinan';
  progress?: number;
  memorizedCount?: number;
  onPress: () => void;
  isLocked?: boolean;
  isCompleted?: boolean;
}

export const SurahCard: React.FC<SurahCardProps> = ({
  number,
  name,
  englishName,
  versesCount,
  revelationType,
  progress = 0,
  memorizedCount = 0,
  onPress,
  isLocked = false,
  isCompleted = false,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <TouchableOpacity accessible accessibilityRole="button"
      style={[styles.container, isLocked && styles.locked]}
      onPress={onPress}
      disabled={isLocked}
      activeOpacity={0.7}
    >
      <View style={[styles.numberContainer, isCompleted && styles.numberCompleted]}>
        <Text style={[styles.number, isCompleted && styles.numberTextCompleted]}>
          {number}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.arabicName}>{name}</Text>
        <Text style={styles.englishName}>{englishName}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name={revelationType === 'Meccan' ? 'moon-outline' : 'sunny-outline'}
              size={12}
              color={colors.textMuted}
            />
            <Text style={styles.metaText}>{revelationType}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{versesCount} verses</Text>
          </View>
        </View>
      </View>

      <View style={styles.progressSection}>
        {isLocked ? (
          <Ionicons name="lock-closed" size={24} color={colors.textMuted} />
        ) : isCompleted ? (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </View>
        ) : (
          <>
            <Text style={styles.progressText}>
              {memorizedCount}/{versesCount}
            </Text>
            <ProgressBar
              progress={progress}
              height={4}
              style={styles.progressBar}
              variant="gradient"
            />
          </>
        )}
      </View>

      {!isLocked && (
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
};

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  locked: {
    opacity: 0.5,
  },
  numberContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  numberCompleted: {
    backgroundColor: c.primarySoft,
  },
  number: {
    fontSize: 16,
    fontWeight: '700',
    color: c.textSecondary,
  },
  numberTextCompleted: {
    color: c.primary,
  },
  info: {
    flex: 1,
  },
  arabicName: {
    fontSize: 18,
    fontWeight: '600',
    color: c.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  englishName: {
    fontSize: 14,
    color: c.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  metaText: {
    fontSize: 11,
    color: c.textMuted,
    marginLeft: 4,
  },
  progressSection: {
    alignItems: 'flex-end',
    marginRight: 8,
    minWidth: 60,
  },
  progressText: {
    fontSize: 12,
    color: c.textSecondary,
    marginBottom: 4,
  },
  progressBar: {
    width: 60,
  },
  completedBadge: {
    alignItems: 'center',
  },
});

export default SurahCard;
