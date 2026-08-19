/**
 * ============================================
 * 📱 AchievementsScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Modal, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { rewardsAPI } from '../../services/api';
import { COLORS } from '../../config';
import { t } from '../../services/i18n';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';
import { HizbStar } from '../../components/common/Ornements';
import { IconeMushaf, IconeSerie, IconeAmis, IconeRecompense } from '../../components/common/Icones';

const { width } = Dimensions.get('window');

const LOG_PREFIX = '[AchievementsScreen.tsx]';

const CATEGORIES = [
  { id: 'all', nameKey: 'achievements.categories.all', Icone: IconeRecompense },
  { id: 'memorization', nameKey: 'achievements.categories.memorization', Icone: IconeMushaf },
  { id: 'streak', nameKey: 'achievements.categories.streak', Icone: IconeSerie },
  { id: 'social', nameKey: 'achievements.categories.social', Icone: IconeAmis },
  { id: 'special', nameKey: 'achievements.categories.special', Icone: HizbStar }
];

const ACHIEVEMENTS_DATA = [
  { id: 'first_ayah', category: 'memorization', nameKey: 'achievements.items.firstAyah', xp: 50, rarity: 'common' },
  { id: 'surah_fatiha', category: 'memorization', nameKey: 'achievements.items.surahFatiha', xp: 100, rarity: 'common' },
  { id: 'first_juz', category: 'memorization', nameKey: 'achievements.items.firstJuz', xp: 500, rarity: 'rare' },
  { id: 'hafiz_100', category: 'memorization', nameKey: 'achievements.items.hafiz100', xp: 200, rarity: 'uncommon' },
  { id: 'streak_7', category: 'streak', nameKey: 'achievements.items.streak7', xp: 100, rarity: 'common' },
  { id: 'streak_30', category: 'streak', nameKey: 'achievements.items.streak30', xp: 500, rarity: 'rare' },
  { id: 'streak_100', category: 'streak', nameKey: 'achievements.items.streak100', xp: 2000, rarity: 'epic' },
  { id: 'first_friend', category: 'social', nameKey: 'achievements.items.firstFriend', xp: 50, rarity: 'common' },
  { id: 'league_gold', category: 'social', nameKey: 'achievements.items.leagueGold', xp: 500, rarity: 'rare' },
  { id: 'early_bird', category: 'special', nameKey: 'achievements.items.earlyBird', xp: 100, rarity: 'uncommon' },
  { id: 'night_owl', category: 'special', nameKey: 'achievements.items.nightOwl', xp: 100, rarity: 'uncommon' },
  { id: 'perfect_week', category: 'special', nameKey: 'achievements.items.perfectWeek', xp: 300, rarity: 'rare' }
];

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);

  const [achievements] = useState<any[]>(ACHIEVEMENTS_DATA);
  const [userAchievements, setUserAchievements] = useState<string[]>(['first_ayah', 'streak_7']);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadAchievements = async () => {
    console.log(`${LOG_PREFIX} 📥 ========== LOAD ACHIEVEMENTS START ==========`);
    try {
      console.log(`${LOG_PREFIX} 📤 Calling rewardsAPI.getAchievements()...`);
      const response: any = await rewardsAPI.getAchievements();
      const unlockedIds = response.achievements?.filter((a: any) => a.isUnlocked).map((a: any) => a._id) || [];
      setUserAchievements(unlockedIds);
      console.log(`${LOG_PREFIX} ✅ Loaded ${unlockedIds.length} unlocked achievements`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Load achievements error:`, error);
    }
    console.log(`${LOG_PREFIX} 📥 ========== LOAD ACHIEVEMENTS END ==========`);
  };

  const onRefresh = async () => {
    console.log(`${LOG_PREFIX} 🔄 Pull to refresh triggered`);
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  };

  const filteredAchievements = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeCategory);

  const unlockedCount = achievements.filter(a => userAchievements.includes(a.id)).length;
  const totalXp = achievements.filter(a => userAchievements.includes(a.id)).reduce((sum, a) => sum + a.xp, 0);

  console.log(`${LOG_PREFIX} 📊 Stats: ${unlockedCount}/${achievements.length} unlocked, ${totalXp} XP earned`);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return colors.textMuted;
      case 'uncommon': return colors.primary;
      case 'rare': return colors.info;
      case 'epic': return colors.accentDeep;
      case 'legendary': return colors.warning;
      default: return colors.textMuted;
    }
  };

  const getRarityName = (rarity: string) => {
    switch (rarity) {
      case 'common': return t('achievements.rarity.common');
      case 'uncommon': return t('achievements.rarity.uncommon');
      case 'rare': return t('achievements.rarity.rare');
      case 'epic': return t('achievements.rarity.epic');
      case 'legendary': return t('achievements.rarity.legendary');
      default: return '';
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    console.log(`${LOG_PREFIX} 📂 Category changed: ${categoryId}`);
    setActiveCategory(categoryId);
  };

  const handleAchievementPress = (achievement: any) => {
    console.log(`${LOG_PREFIX} 🏅 Achievement pressed: ${achievement.id}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAchievement(achievement);
  };

  const handleModalClose = () => {
    console.log(`${LOG_PREFIX} ✖️ Modal closed`);
    setSelectedAchievement(null);
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (category: ${activeCategory}, filtered: ${filteredAchievements.length})...`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[fixedColors.gold, colors.warningStrong]} style={styles.header}>
        <IconeRecompense size={44} color={colors.onDeep} />
        <Text style={styles.headerTitle}>{t('achievements.title')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedCount}/{achievements.length}</Text>
            <Text style={styles.statLabel}>{t('achievements.unlocked')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalXp}</Text>
            <Text style={styles.statLabel}>{t('achievements.xpEarned')}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity accessible accessibilityRole="button"
            key={cat.id}
            style={[styles.categoryButton, activeCategory === cat.id && styles.categoryButtonActive]}
            onPress={() => handleCategoryChange(cat.id)}
          >
            <View style={styles.categoryIcon}>
              <cat.Icone size={16} color={activeCategory === cat.id ? colors.primary : colors.textMuted} />
            </View>
            <Text style={[styles.categoryText, activeCategory === cat.id && styles.categoryTextActive]}>
              {t(cat.nameKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievements Grid */}
      <ScrollView
        contentContainerStyle={styles.gridContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.grid}>
          {filteredAchievements.map((achievement) => {
            const isUnlocked = userAchievements.includes(achievement.id);
            return (
              <TouchableOpacity accessible accessibilityRole="button"
                key={achievement.id}
                style={[styles.achievementCard, !isUnlocked && styles.achievementLocked]}
                onPress={() => handleAchievementPress(achievement)}
              >
                <View style={[styles.achievementIconBg, { backgroundColor: isUnlocked ? getRarityColor(achievement.rarity) + '30' : colors.backgroundAlt }]}>
                  <Text style={[styles.achievementIcon, !isUnlocked && styles.achievementIconLocked]}>
                    <HizbStar
                  size={26}
                  quarters={isUnlocked ? 4 : 0}
                  color={isUnlocked ? colors.accent : colors.border}
                />
                  </Text>
                </View>
                <Text style={[styles.achievementName, !isUnlocked && styles.achievementNameLocked]} numberOfLines={1}>
                  {t(achievement.nameKey)}
                </Text>
                <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(achievement.rarity) }]}>
                  <Text style={styles.rarityText}>{getRarityName(achievement.rarity)}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Achievement Detail Modal */}
      <Modal visible={!!selectedAchievement} transparent animationType="fade" onRequestClose={handleModalClose}>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.modalOverlay} activeOpacity={1} onPress={handleModalClose}>
          {selectedAchievement && (
            <View style={styles.modalContent}>
              <View style={[styles.modalIconBg, { backgroundColor: getRarityColor(selectedAchievement.rarity) + '30' }]}>
                <Text style={styles.modalIcon}>{selectedAchievement.icon}</Text>
              </View>
              <Text style={styles.modalTitle}>{t(selectedAchievement.nameKey)}</Text>
              <View style={[styles.modalRarityBadge, { backgroundColor: getRarityColor(selectedAchievement.rarity) }]}>
                <Text style={styles.modalRarityText}>{getRarityName(selectedAchievement.rarity)}</Text>
              </View>
              <View style={styles.modalReward}>
                <Text style={styles.modalRewardLabel}>{t('achievements.reward')}:</Text>
                <Text style={styles.modalRewardValue}>+{selectedAchievement.xp} XP</Text>
              </View>
              {userAchievements.includes(selectedAchievement.id) ? (
                <View style={styles.unlockedBadge}>
                  <Text style={styles.unlockedText}>{t('achievements.unlockedStatus')}</Text>
                </View>
              ) : (
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedText}>{t('achievements.lockedStatus')}</Text>
                </View>
              )}
              <TouchableOpacity accessible accessibilityRole="button" style={styles.closeButton} onPress={handleModalClose}>
                <Text style={styles.closeButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  headerIcon: {},
  headerTitle: { color: c.onDeep, fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  statsRow: { flexDirection: 'row', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 15, padding: 15 },
  statItem: { alignItems: 'center', paddingHorizontal: 25 },
  statValue: { color: c.onDeep, fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  categoriesContainer: { paddingHorizontal: 10, paddingVertical: 15 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginHorizontal: 5, elevation: 1 },
  categoryButtonActive: { backgroundColor: c.primary },
  categoryIcon: { marginRight: 6 },
  categoryText: { color: c.textSecondary, fontWeight: '600' },
  categoryTextActive: { color: c.onDeep },
  gridContainer: { padding: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  achievementCard: { width: (width - 40) / 3, backgroundColor: c.surface, borderRadius: 15, padding: 12, alignItems: 'center', marginBottom: 10, elevation: 2 },
  achievementLocked: { opacity: 0.6 },
  achievementIconBg: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  achievementIcon: { fontSize: 28 },
  achievementIconLocked: { opacity: 0.5 },
  achievementName: { fontSize: 12, fontWeight: '600', color: c.text, textAlign: 'center' },
  achievementNameLocked: { color: c.textMuted },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 6 },
  rarityText: { color: c.onDeep, fontSize: 9, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: c.surface, borderRadius: 20, padding: 25, alignItems: 'center', width: width - 60, elevation: 10 },
  modalIconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalIcon: { fontSize: 45 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: c.text },
  modalRarityBadge: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginTop: 10 },
  modalRarityText: { color: c.onDeep, fontWeight: '600' },
  modalReward: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: c.background, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15 },
  modalRewardLabel: { color: c.textSecondary, marginRight: 5 },
  modalRewardValue: { color: c.primary, fontWeight: 'bold', fontSize: 16 },
  unlockedBadge: { backgroundColor: c.primarySoft, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, marginTop: 15 },
  unlockedText: { color: c.primary, fontWeight: 'bold' },
  lockedBadge: { backgroundColor: c.background, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, marginTop: 15 },
  lockedText: { color: c.textMuted },
  closeButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 40, backgroundColor: c.primary, borderRadius: 25 },
  closeButtonText: { color: c.onDeep, fontWeight: 'bold', fontSize: 16 }
});