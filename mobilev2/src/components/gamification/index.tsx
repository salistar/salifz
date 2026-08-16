/**
 * Gamification Components - Salifz
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ProgressBar } from '../common/ProgressBar';

// ============================================
// STREAK CARD
// ============================================
interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  onPress?: () => void;
}

export const StreakCard: React.FC<StreakCardProps> = ({
  currentStreak,
  longestStreak,
  streakFreezes,
  onPress,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={['#FF6B35', '#FF9F1C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.streakCard}
      >
        <View style={styles.streakIconContainer}>
          <Text style={styles.streakIcon}>🔥</Text>
        </View>
        
        <View style={styles.streakInfo}>
          <Text style={styles.streakCount}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>

        <View style={styles.streakStats}>
          <View style={styles.streakStat}>
            <Ionicons name="trophy-outline" size={16} color="#FFF" />
            <Text style={styles.streakStatText}>Best: {longestStreak}</Text>
          </View>
          <View style={styles.streakStat}>
            <Ionicons name="snow-outline" size={16} color="#FFF" />
            <Text style={styles.streakStatText}>Freezes: {streakFreezes}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// ============================================
// XP PROGRESS
// ============================================
interface XPProgressProps {
  currentXP: number;
  requiredXP: number;
  level: number;
  onPress?: () => void;
}

export const XPProgress: React.FC<XPProgressProps> = ({
  currentXP,
  requiredXP,
  level,
  onPress,
}) => {
  const progress = (currentXP / requiredXP) * 100;

  return (
    <TouchableOpacity style={styles.xpContainer} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.xpHeader}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
        <View style={styles.xpInfo}>
          <Text style={styles.xpTitle}>Level {level}</Text>
          <Text style={styles.xpSubtitle}>{currentXP} / {requiredXP} XP</Text>
        </View>
        <View style={styles.xpNext}>
          <Ionicons name="arrow-forward-circle" size={24} color="#4CAF50" />
        </View>
      </View>
      <ProgressBar progress={progress} height={8} variant="gradient" />
    </TouchableOpacity>
  );
};

// ============================================
// HEARTS DISPLAY
// ============================================
interface HeartsDisplayProps {
  current: number;
  max: number;
  onPress?: () => void;
}

export const HeartsDisplay: React.FC<HeartsDisplayProps> = ({
  current,
  max,
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.heartsContainer} onPress={onPress}>
      {Array.from({ length: max }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < current ? 'heart' : 'heart-outline'}
          size={20}
          color={index < current ? '#F44336' : '#CCC'}
          style={styles.heartIcon}
        />
      ))}
    </TouchableOpacity>
  );
};

// ============================================
// GEMS DISPLAY
// ============================================
interface GemsDisplayProps {
  amount: number;
  onPress?: () => void;
}

export const GemsDisplay: React.FC<GemsDisplayProps> = ({ amount, onPress }) => {
  return (
    <TouchableOpacity style={styles.gemsContainer} onPress={onPress}>
      <Text style={styles.gemIcon}>💎</Text>
      <Text style={styles.gemAmount}>{amount.toLocaleString()}</Text>
    </TouchableOpacity>
  );
};

// ============================================
// ACHIEVEMENT BADGE
// ============================================
interface AchievementBadgeProps {
  name: string;
  icon: string;
  description: string;
  progress: number;
  unlocked: boolean;
  onPress?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  name,
  icon,
  description,
  progress,
  unlocked,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.achievementContainer, !unlocked && styles.achievementLocked]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.achievementIcon, unlocked && styles.achievementIconUnlocked]}>
        <Text style={styles.achievementEmoji}>{icon}</Text>
      </View>
      <Text style={styles.achievementName} numberOfLines={1}>{name}</Text>
      {!unlocked && (
        <View style={styles.achievementProgress}>
          <ProgressBar progress={progress} height={4} />
        </View>
      )}
      {unlocked && (
        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );
};

// ============================================
// CHALLENGE CARD
// ============================================
interface ChallengeCardProps {
  title: string;
  description: string;
  current: number;
  target: number;
  xpReward: number;
  timeLeft?: string;
  completed: boolean;
  onPress?: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  title,
  description,
  current,
  target,
  xpReward,
  timeLeft,
  completed,
  onPress,
}) => {
  const progress = (current / target) * 100;

  return (
    <TouchableOpacity
      style={[styles.challengeCard, completed && styles.challengeCompleted]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.challengeHeader}>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeTitle}>{title}</Text>
          <Text style={styles.challengeDescription}>{description}</Text>
        </View>
        {completed ? (
          <View style={styles.challengeCheckmark}>
            <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
          </View>
        ) : (
          <View style={styles.challengeReward}>
            <Text style={styles.challengeXP}>+{xpReward}</Text>
            <Text style={styles.challengeXPLabel}>XP</Text>
          </View>
        )}
      </View>

      <View style={styles.challengeProgressSection}>
        <ProgressBar progress={progress} height={8} showLabel />
        <Text style={styles.challengeProgressText}>
          {current} / {target}
        </Text>
      </View>

      {timeLeft && !completed && (
        <View style={styles.challengeTimeLeft}>
          <Ionicons name="time-outline" size={14} color="#999" />
          <Text style={styles.challengeTimeText}>{timeLeft}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================
// LEAGUE BADGE
// ============================================
interface LeagueBadgeProps {
  league: 'bronze' | 'silver' | 'gold' | 'diamond' | 'hafiz';
  rank?: number;
  size?: 'small' | 'medium' | 'large';
}

export const LeagueBadge: React.FC<LeagueBadgeProps> = ({
  league,
  rank,
  size = 'medium',
}) => {
  const getLeagueConfig = () => {
    const configs = {
      bronze: { color: '#CD7F32', icon: '🥉', name: 'Bronze' },
      silver: { color: '#C0C0C0', icon: '🥈', name: 'Silver' },
      gold: { color: '#FFD700', icon: '🥇', name: 'Gold' },
      diamond: { color: '#B9F2FF', icon: '💎', name: 'Diamond' },
      hafiz: { color: '#9C27B0', icon: '👑', name: 'Hafiz' },
    };
    return configs[league];
  };

  const config = getLeagueConfig();
  const iconSize = size === 'small' ? 20 : size === 'large' ? 40 : 28;

  return (
    <View style={[styles.leagueBadge, { backgroundColor: config.color + '20' }]}>
      <Text style={{ fontSize: iconSize }}>{config.icon}</Text>
      {rank && (
        <Text style={[styles.leagueRank, { fontSize: size === 'small' ? 10 : 12 }]}>
          #{rank}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Streak Card
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  streakIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakIcon: {
    fontSize: 28,
  },
  streakInfo: {
    flex: 1,
    marginLeft: 12,
  },
  streakCount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  streakStats: {
    alignItems: 'flex-end',
  },
  streakStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  streakStatText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },

  // XP Progress
  xpContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  xpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  xpInfo: {
    flex: 1,
    marginLeft: 12,
  },
  xpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  xpSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  xpNext: {},

  // Hearts
  heartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartIcon: {
    marginHorizontal: 2,
  },

  // Gems
  gemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gemIcon: {
    fontSize: 16,
  },
  gemAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1976D2',
    marginLeft: 4,
  },

  // Achievement
  achievementContainer: {
    alignItems: 'center',
    padding: 12,
    width: 100,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementIconUnlocked: {
    backgroundColor: '#E8F5E9',
  },
  achievementEmoji: {
    fontSize: 28,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  achievementProgress: {
    width: '100%',
    marginTop: 4,
  },

  // Challenge
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  challengeCompleted: {
    backgroundColor: '#E8F5E9',
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  challengeDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  challengeReward: {
    alignItems: 'center',
  },
  challengeXP: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  challengeXPLabel: {
    fontSize: 10,
    color: '#999',
  },
  challengeCheckmark: {},
  challengeProgressSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeProgressText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  challengeTimeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  challengeTimeText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },

  // League Badge
  leagueBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 12,
  },
  leagueRank: {
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
  },
});

// Ces sept composants sont déjà exportés à leur déclaration (`export const`).
// Cette ligne les réexportait une seconde fois : doublon d'export, refusé au
// bundle. Elle est supprimée.
