/**
 * ============================================
 * 📱 UserProfileScreen.tsx - Salifz
 * ============================================
 * ✅ View another user's profile
 * ✅ CONVERTED: i18n integration
 * ✅ FIXED: LinearGradient TypeScript error
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { socialAPI, chatAPI } from '../../services/api';
import { COLORS } from '../../config';
import { t, getLocale } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';
import { HizbStar } from '../../components/common/Ornements';
import { IconeSerie, IconeMushaf, IconeRecompense } from '../../components/common/Icones';

const LOG_PREFIX = '[UserProfileScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

interface UserProfile {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  country?: string;
  level: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  league: string;
  totalVersesMemorized: number;
  totalSurahCompleted: number;
  achievementsCount: number;
  joinedAt: string;
  isFriend: boolean;
  requestSent: boolean;
  requestReceived: boolean;
}

type GradientColors = readonly [string, string, ...string[]];

interface LeagueConfig {
  name: string;
  color: string;
  gradient: GradientColors;
}

const getLeagueConfig = (): Record<string, LeagueConfig> => ({
  bronze: {
    name: t('userProfile.leagues.bronze'),
    color: fixedColors.bronze,
    gradient: [fixedColors.bronze, '#8B4513'] as const
  },
  silver: {
    name: t('userProfile.leagues.silver'),
    color: fixedColors.silver,
    gradient: [fixedColors.silver, '#808080'] as const
  },
  gold: {
    name: t('userProfile.leagues.gold'),
    color: fixedColors.gold,
    gradient: [fixedColors.gold, '#FFA500'] as const
  },
  diamond: {
    name: t('userProfile.leagues.diamond'),
    color: fixedColors.diamond,
    gradient: ['#00BCD4', '#0097A7'] as const
  },
  hafiz: {
    name: t('userProfile.leagues.hafiz'),
    color: fixedColors.gold,
    gradient: [fixedColors.diamond, fixedColors.silver] as const
  }
});

// Helper function to safely format numbers
const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toLocaleString();
};

export default function UserProfileScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering`);

  const { userId } = route.params;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const leagueConfig = getLeagueConfig();

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect - Loading profile for ${userId}`);
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    console.log(`${LOG_PREFIX} 📥 loadProfile()`);

    try {
      const response = await socialAPI.getUserProfile(userId);
      const data = response?.data || response;
      console.log(`${LOG_PREFIX} ✅ Profile loaded: ${data?.displayName}`);
      setProfile(data);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Load profile error:`, error);
      Alert.alert(t('common.error'), t('userProfile.errors.notFound'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!profile) return;

    setActionLoading(true);
    console.log(`${LOG_PREFIX} ➕ Adding friend: ${profile._id}`);

    try {
      await socialAPI.sendRequest(profile._id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProfile({ ...profile, requestSent: true });
      Alert.alert(t('common.done'), t('userProfile.friendRequest.sent'));
      console.log(`${LOG_PREFIX} ✅ Friend request sent`);
    } catch (error: any) {
      Alert.alert(t('common.error'), error?.error || t('common.errorOccurred'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profile) return;

    setActionLoading(true);
    console.log(`${LOG_PREFIX} ✅ Accepting friend request from: ${profile._id}`);

    try {
      await socialAPI.acceptRequest(profile._id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProfile({ ...profile, isFriend: true, requestReceived: false });
      Alert.alert(t('common.done'), t('userProfile.friendRequest.accepted'));
      console.log(`${LOG_PREFIX} ✅ Friend request accepted`);
    } catch (error) {
      Alert.alert(t('common.error'), t('common.errorOccurred'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = () => {
    if (!profile) return;

    Alert.alert(
      t('userProfile.removeFriend.title'),
      t('userProfile.removeFriend.confirm', { name: profile.displayName || profile.username }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('userProfile.removeFriend.remove'),
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            console.log(`${LOG_PREFIX} 🗑️ Removing friend: ${profile._id}`);

            try {
              await socialAPI.removeFriend(profile._id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setProfile({ ...profile, isFriend: false });
              console.log(`${LOG_PREFIX} ✅ Friend removed`);
            } catch (error) {
              Alert.alert(t('common.error'), t('common.errorOccurred'));
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleStartChat = async () => {
    if (!profile) return;

    console.log(`${LOG_PREFIX} 💬 Starting chat with: ${profile._id}`);

    try {
      const response = await chatAPI.createConversation(profile._id);
      const conversationId = response?.data?._id || response?._id;
      if (conversationId) {
        navigation.navigate('Chat', { conversationId, recipientId: profile._id });
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Start chat error:`, error);
    }
  };

  const formatDate = (dateString: string): string => {
    const locale = getLocale();
    const localeMap: Record<string, string> = {
      ar: 'ar-SA',
      fr: 'fr-FR',
      en: 'en-US',
    };

    return new Date(dateString).toLocaleDateString(localeMap[locale] || 'ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{t('userProfile.errors.notFound')}</Text>
      </View>
    );
  }

  const league = leagueConfig[profile.league] || leagueConfig.bronze;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - ✅ FIXED: Cast gradient to proper type */}
        <LinearGradient colors={league.gradient} style={styles.header}>
          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.onDeep} />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(profile?.displayName || profile?.username || '?').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{profile.level}</Text>
            </View>
          </View>

          {/* Name & Username */}
          <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
          <Text style={styles.username}>@{profile.username}</Text>

          {/* League Badge */}
          <View style={styles.leagueBadge}>
            <HizbStar size={22} quarters={4} color={league.color} />
            <Text style={styles.leagueName}>{league.name}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>{t('userProfile.stats.streak')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatNumber(profile.totalXP)}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.totalVersesMemorized || 0}</Text>
              <Text style={styles.statLabel}>{t('userProfile.stats.verse')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {profile.isFriend ? (
            <>
              <TouchableOpacity accessible accessibilityRole="button"
                style={styles.chatButton}
                onPress={handleStartChat}
              >
                <Ionicons name="chatbubble" size={20} color={colors.onDeep} />
                <Text style={styles.chatButtonText}>{t('userProfile.actions.chat')}</Text>
              </TouchableOpacity>
              <TouchableOpacity accessible accessibilityRole="button"
                style={styles.removeButton}
                onPress={handleRemoveFriend}
                disabled={actionLoading}
              >
                <Ionicons name="person-remove" size={20} color={colors.error} />
                <Text style={styles.removeButtonText}>{t('userProfile.actions.remove')}</Text>
              </TouchableOpacity>
            </>
          ) : profile.requestSent ? (
            <View style={styles.pendingButton}>
              <Ionicons name="time" size={20} color={colors.textSecondary} />
              <Text style={styles.pendingButtonText}>{t('userProfile.actions.pending')}</Text>
            </View>
          ) : profile.requestReceived ? (
            <TouchableOpacity accessible accessibilityRole="button"
              style={styles.acceptButton}
              onPress={handleAcceptRequest}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.onDeep} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={colors.onDeep} />
                  <Text style={styles.acceptButtonText}>{t('userProfile.actions.acceptRequest')}</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity accessible accessibilityRole="button"
              style={styles.addButton}
              onPress={handleAddFriend}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color={colors.onDeep} />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color={colors.onDeep} />
                  <Text style={styles.addButtonText}>{t('userProfile.actions.addFriend')}</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Detailed Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('userProfile.sections.statistics')}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <IconeMushaf size={22} color={colors.primary} />
              <Text style={styles.statCardValue}>{profile.totalVersesMemorized || 0}</Text>
              <Text style={styles.statCardLabel}>{t('userProfile.stats.versesMemorized')}</Text>
            </View>
            <View style={styles.statCard}>
              <IconeMushaf size={22} color={colors.primary} />
              <Text style={styles.statCardValue}>{profile.totalSurahCompleted || 0}</Text>
              <Text style={styles.statCardLabel}>{t('userProfile.stats.surahCompleted')}</Text>
            </View>
            <View style={styles.statCard}>
              <IconeSerie size={22} color={colors.warning} />
              <Text style={styles.statCardValue}>{profile.longestStreak || 0}</Text>
              <Text style={styles.statCardLabel}>{t('userProfile.stats.longestStreak')}</Text>
            </View>
            <View style={styles.statCard}>
              <IconeRecompense size={22} color={colors.accent} />
              <Text style={styles.statCardValue}>{profile.achievementsCount || 0}</Text>
              <Text style={styles.statCardLabel}>{t('userProfile.stats.achievements')}</Text>
            </View>
          </View>
        </View>

        {/* Join Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('userProfile.sections.info')}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('userProfile.info.joinDate')}</Text>
            <Text style={styles.infoValue}>
              {formatDate(profile.joinedAt)}
            </Text>
          </View>
          {profile.country && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('userProfile.info.country')}</Text>
              <Text style={styles.infoValue}>{profile.country}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.background,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 15,
    padding: 5,
    zIndex: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: c.surface,
  },
  avatarText: {
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: c.surface,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: fixedColors.gold,
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: c.text,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.onDeep,
  },
  username: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  leagueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  leagueEmoji: {
    marginRight: 8,
  },
  leagueName: {
    color: c.onDeep,
    fontWeight: 'bold',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: c.onDeep,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -15,
    marginBottom: 20,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    paddingVertical: 14,
    borderRadius: 15,
    marginRight: 10,
    elevation: 3,
  },
  chatButtonText: {
    color: c.onDeep,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 15,
    elevation: 3,
  },
  removeButtonText: {
    color: c.error,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    paddingVertical: 14,
    borderRadius: 15,
    elevation: 3,
  },
  addButtonText: {
    color: c.onDeep,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    paddingVertical: 14,
    borderRadius: 15,
    elevation: 3,
  },
  acceptButtonText: {
    color: c.onDeep,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  pendingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.border,
    paddingVertical: 14,
    borderRadius: 15,
  },
  pendingButtonText: {
    color: c.textSecondary,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  section: {
    backgroundColor: c.surface,
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  statCard: {
    width: '50%',
    padding: 5,
  },
  statCardIcon: {
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.text,
    textAlign: 'center',
    marginTop: 5,
  },
  statCardLabel: {
    fontSize: 12,
    color: c.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.backgroundAlt,
  },
  infoLabel: {
    fontSize: 14,
    color: c.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },
});