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
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const { width } = Dimensions.get('window');

// ✅ Constante pour les logs
const LOG_PREFIX = '[AchievementsScreen.tsx]';

// ✅ CATEGORIES avec clés i18n au lieu de texte hardcodé
const CATEGORIES = [
  { id: 'all', nameKey: 'achievements.categories.all', icon: '🏆' },
  { id: 'memorization', nameKey: 'achievements.categories.memorization', icon: '📖' },
  { id: 'streak', nameKey: 'achievements.categories.streak', icon: '🔥' },
  { id: 'social', nameKey: 'achievements.categories.social', icon: '👥' },
  { id: 'special', nameKey: 'achievements.categories.special', icon: '⭐' }
];

// ✅ ACHIEVEMENTS avec clés i18n au lieu de texte hardcodé
const ACHIEVEMENTS_DATA = [
  { id: 'first_ayah', category: 'memorization', nameKey: 'achievements.items.firstAyah', icon: '📖', xp: 50, rarity: 'common' },
  { id: 'surah_fatiha', category: 'memorization', nameKey: 'achievements.items.surahFatiha', icon: '🌟', xp: 100, rarity: 'common' },
  { id: 'first_juz', category: 'memorization', nameKey: 'achievements.items.firstJuz', icon: '📚', xp: 500, rarity: 'rare' },
  { id: 'hafiz_100', category: 'memorization', nameKey: 'achievements.items.hafiz100', icon: '💯', xp: 200, rarity: 'uncommon' },
  { id: 'streak_7', category: 'streak', nameKey: 'achievements.items.streak7', icon: '🔥', xp: 100, rarity: 'common' },
  { id: 'streak_30', category: 'streak', nameKey: 'achievements.items.streak30', icon: '💪', xp: 500, rarity: 'rare' },
  { id: 'streak_100', category: 'streak', nameKey: 'achievements.items.streak100', icon: '🏆', xp: 2000, rarity: 'epic' },
  { id: 'first_friend', category: 'social', nameKey: 'achievements.items.firstFriend', icon: '🤝', xp: 50, rarity: 'common' },
  { id: 'league_gold', category: 'social', nameKey: 'achievements.items.leagueGold', icon: '🥇', xp: 500, rarity: 'rare' },
  { id: 'early_bird', category: 'special', nameKey: 'achievements.items.earlyBird', icon: '🌅', xp: 100, rarity: 'uncommon' },
  { id: 'night_owl', category: 'special', nameKey: 'achievements.items.nightOwl', icon: '🦉', xp: 100, rarity: 'uncommon' },
  { id: 'perfect_week', category: 'special', nameKey: 'achievements.items.perfectWeek', icon: '✨', xp: 300, rarity: 'rare' }
];

export default function AchievementsScreen() {
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
      case 'common': return '#9E9E9E';
      case 'uncommon': return '#4CAF50';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  // ✅ AVANT: hardcoded Arabic rarity names
  // ✅ APRÈS: i18n keys
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
      <LinearGradient colors={['#FFD700', '#FFA000']} style={styles.header}>
        <Text style={styles.headerIcon}>🏆</Text>
        {/* ✅ AVANT: 'الإنجازات' */}
        <Text style={styles.headerTitle}>{t('achievements.title')}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{unlockedCount}/{achievements.length}</Text>
            {/* ✅ AVANT: 'مفتوح' */}
            <Text style={styles.statLabel}>{t('achievements.unlocked')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalXp}</Text>
            {/* ✅ AVANT: 'XP مكتسب' */}
            <Text style={styles.statLabel}>{t('achievements.xpEarned')}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContainer}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.categoryButton, activeCategory === cat.id && styles.categoryButtonActive]} 
            onPress={() => handleCategoryChange(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            {/* ✅ AVANT: {cat.name} hardcodé */}
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
              <TouchableOpacity
                key={achievement.id}
                style={[styles.achievementCard, !isUnlocked && styles.achievementLocked]}
                onPress={() => handleAchievementPress(achievement)}
              >
                <View style={[styles.achievementIconBg, { backgroundColor: isUnlocked ? getRarityColor(achievement.rarity) + '30' : '#f0f0f0' }]}>
                  <Text style={[styles.achievementIcon, !isUnlocked && styles.achievementIconLocked]}>
                    {isUnlocked ? achievement.icon : '🔒'}
                  </Text>
                </View>
                {/* ✅ AVANT: {achievement.name} hardcodé */}
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
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleModalClose}>
          {selectedAchievement && (
            <View style={styles.modalContent}>
              <View style={[styles.modalIconBg, { backgroundColor: getRarityColor(selectedAchievement.rarity) + '30' }]}>
                <Text style={styles.modalIcon}>{selectedAchievement.icon}</Text>
              </View>
              {/* ✅ AVANT: {selectedAchievement.name} hardcodé */}
              <Text style={styles.modalTitle}>{t(selectedAchievement.nameKey)}</Text>
              <View style={[styles.modalRarityBadge, { backgroundColor: getRarityColor(selectedAchievement.rarity) }]}>
                <Text style={styles.modalRarityText}>{getRarityName(selectedAchievement.rarity)}</Text>
              </View>
              <View style={styles.modalReward}>
                {/* ✅ AVANT: 'المكافأة:' */}
                <Text style={styles.modalRewardLabel}>{t('achievements.reward')}:</Text>
                <Text style={styles.modalRewardValue}>+{selectedAchievement.xp} XP</Text>
              </View>
              {userAchievements.includes(selectedAchievement.id) ? (
                <View style={styles.unlockedBadge}>
                  {/* ✅ AVANT: '✓ مفتوح' */}
                  <Text style={styles.unlockedText}>✓ {t('achievements.unlockedStatus')}</Text>
                </View>
              ) : (
                <View style={styles.lockedBadge}>
                  {/* ✅ AVANT: '🔒 مقفل' */}
                  <Text style={styles.lockedText}>🔒 {t('achievements.lockedStatus')}</Text>
                </View>
              )}
              <TouchableOpacity style={styles.closeButton} onPress={handleModalClose}>
                {/* ✅ AVANT: 'إغلاق' */}
                <Text style={styles.closeButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingTop: 50, paddingBottom: 30, alignItems: 'center' },
  headerIcon: { fontSize: 50 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  statsRow: { flexDirection: 'row', marginTop: 20, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 15, padding: 15 },
  statItem: { alignItems: 'center', paddingHorizontal: 25 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  categoriesContainer: { paddingHorizontal: 10, paddingVertical: 15 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginHorizontal: 5, elevation: 1 },
  categoryButtonActive: { backgroundColor: COLORS.primary },
  categoryIcon: { fontSize: 18, marginRight: 6 },
  categoryText: { color: '#666', fontWeight: '600' },
  categoryTextActive: { color: '#fff' },
  gridContainer: { padding: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  achievementCard: { width: (width - 40) / 3, backgroundColor: '#fff', borderRadius: 15, padding: 12, alignItems: 'center', marginBottom: 10, elevation: 2 },
  achievementLocked: { opacity: 0.6 },
  achievementIconBg: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  achievementIcon: { fontSize: 28 },
  achievementIconLocked: { opacity: 0.5 },
  achievementName: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'center' },
  achievementNameLocked: { color: '#999' },
  rarityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 6 },
  rarityText: { color: '#fff', fontSize: 9, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center', width: width - 60, elevation: 10 },
  modalIconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  modalIcon: { fontSize: 45 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  modalRarityBadge: { paddingHorizontal: 15, paddingVertical: 5, borderRadius: 15, marginTop: 10 },
  modalRarityText: { color: '#fff', fontWeight: '600' },
  modalReward: { flexDirection: 'row', alignItems: 'center', marginTop: 20, backgroundColor: '#f5f5f5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15 },
  modalRewardLabel: { color: '#666', marginRight: 5 },
  modalRewardValue: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  unlockedBadge: { backgroundColor: '#E8F5E9', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, marginTop: 15 },
  unlockedText: { color: '#4CAF50', fontWeight: 'bold' },
  lockedBadge: { backgroundColor: '#f5f5f5', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 15, marginTop: 15 },
  lockedText: { color: '#999' },
  closeButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 40, backgroundColor: COLORS.primary, borderRadius: 25 },
  closeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});