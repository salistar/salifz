/**
 * ============================================
 * 📱 ShopScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useGamificationStore } from '../../stores';
import { rewardsAPI } from '../../services/api';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';

// ✅ Constante pour les logs
const LOG_PREFIX = '[ShopScreen.tsx]';

const DAILY_REWARDS = [
  { day: 1, gems: 5 },
  { day: 2, gems: 10 },
  { day: 3, gems: 15 },
  { day: 4, gems: 20 },
  { day: 5, gems: 25 },
  { day: 6, gems: 35 },
  { day: 7, gems: 50, bonus: '❄️' }
];

// ✅ SHOP_ITEMS avec clés i18n au lieu de texte hardcodé
const SHOP_ITEMS = [
  { id: 'heart_refill', nameKey: 'shop.items.heartRefill.name', nameEnKey: 'shop.items.heartRefill.nameEn', icon: '❤️', price: 350, descriptionKey: 'shop.items.heartRefill.description' },
  { id: 'streak_freeze', nameKey: 'shop.items.streakFreeze.name', nameEnKey: 'shop.items.streakFreeze.nameEn', icon: '❄️', price: 200, descriptionKey: 'shop.items.streakFreeze.description' },
  { id: 'xp_boost', nameKey: 'shop.items.xpBoost.name', nameEnKey: 'shop.items.xpBoost.nameEn', icon: '⚡', price: 500, descriptionKey: 'shop.items.xpBoost.description' },
  { id: 'avatar_gold', nameKey: 'shop.items.avatarGold.name', nameEnKey: 'shop.items.avatarGold.nameEn', icon: '🖼️', price: 1000, descriptionKey: 'shop.items.avatarGold.description' },
  { id: 'gems_100', nameKey: 'shop.items.gems100.name', nameEnKey: 'shop.items.gems100.nameEn', icon: '💎', price: 0, realPrice: '$0.99' },
  { id: 'gems_500', nameKey: 'shop.items.gems500.name', nameEnKey: 'shop.items.gems500.nameEn', icon: '💎💎', price: 0, realPrice: '$3.99' }
];

export default function ShopScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  
  const { gems, addGems, refillHearts } = useGamificationStore();
  const [currentDay, setCurrentDay] = useState(3);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  console.log(`${LOG_PREFIX} 💎 Current gems: ${gems}`);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🔄 useEffect: Loading daily reward...`);
    loadDailyReward();
  }, []);

  const loadDailyReward = async () => {
    console.log(`${LOG_PREFIX} 📥 ========== LOAD DAILY REWARD START ==========`);
    try {
      console.log(`${LOG_PREFIX} 📤 Calling rewardsAPI.getDailyReward()...`);
      const response = await rewardsAPI.getDailyReward();
      const data = response as any;
      setCurrentDay(data.currentDay || 1);
      setDailyClaimed(data.claimed || false);
      console.log(`${LOG_PREFIX} ✅ Daily reward loaded: day=${data.currentDay}, claimed=${data.claimed}`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Load daily reward error:`, error);
    }
    console.log(`${LOG_PREFIX} 📥 ========== LOAD DAILY REWARD END ==========`);
  };

  const onRefresh = async () => {
    console.log(`${LOG_PREFIX} 🔄 Pull to refresh triggered`);
    setRefreshing(true);
    await loadDailyReward();
    setRefreshing(false);
  };

  const handleClaimDaily = async () => {
    if (dailyClaimed) {
      console.log(`${LOG_PREFIX} ⚠️ Daily reward already claimed`);
      return;
    }
    
    console.log(`${LOG_PREFIX} 🎁 Claiming daily reward for day ${currentDay}...`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      console.log(`${LOG_PREFIX} 📤 Calling rewardsAPI.claimDailyReward()...`);
      const response = await rewardsAPI.claimDailyReward();
      const data = response as any;
      const gemsEarned = data.gems || DAILY_REWARDS[currentDay - 1].gems;
      addGems(gemsEarned);
      setDailyClaimed(true);
      console.log(`${LOG_PREFIX} ✅ Daily reward claimed: ${gemsEarned} gems`);
      // ✅ AVANT: Alert.alert('🎉 مبروك!', `حصلت على ${...} جوهرة!`);
      Alert.alert(
        `🎉 ${t('shop.congratulations')}`,
        t('shop.dailyRewardMessage', { gems: gemsEarned })
      );
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Claim daily error:`, error);
    }
  };

  const handleBuyItem = async (item: any) => {
    const itemName = t(item.nameKey);
    console.log(`${LOG_PREFIX} 🛒 Attempting to buy: ${item.id} (${itemName})`);
    
    if (item.price > gems) {
      console.log(`${LOG_PREFIX} ❌ Not enough gems: need ${item.price}, have ${gems}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      // ✅ AVANT: Alert.alert('جواهر غير كافية!', `تحتاج ${item.price} جوهرة لشراء ${item.name}`);
      Alert.alert(
        t('shop.notEnoughGems'),
        t('shop.needGemsMessage', { price: item.price, item: itemName })
      );
      return;
    }

    // ✅ AVANT: Alert.alert('تأكيد الشراء', `هل تريد شراء ${item.name} بـ ${item.price} جوهرة؟`, ...);
    Alert.alert(
      t('shop.confirmPurchase'),
      t('shop.confirmPurchaseMessage', { item: itemName, price: item.price }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          // ✅ AVANT: text: 'شراء'
          text: t('shop.buy'),
          onPress: async () => {
            console.log(`${LOG_PREFIX} 💰 Purchase confirmed for ${item.id}`);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              console.log(`${LOG_PREFIX} 📤 Calling rewardsAPI.buyItem(${item.id})...`);
              await rewardsAPI.buyItem(item.id);
              addGems(-item.price);
              console.log(`${LOG_PREFIX} ✅ Purchase successful: -${item.price} gems`);
              
              // Apply item effect
              if (item.id === 'heart_refill') {
                console.log(`${LOG_PREFIX} ❤️ Applying heart refill effect...`);
                refillHearts();
              }
              
              // ✅ AVANT: Alert.alert('✓ تم!', `تم شراء ${item.name} بنجاح!`);
              Alert.alert(
                `✓ ${t('shop.done')}`,
                t('shop.purchaseSuccessMessage', { item: itemName })
              );
            } catch (error) {
              console.error(`${LOG_PREFIX} ❌ Buy item error:`, error);
            }
          }
        }
      ]
    );
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (gems: ${gems}, day: ${currentDay}, claimed: ${dailyClaimed})...`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[colors.accentDeep, colors.accentDeep]} style={styles.header}>
        <TouchableOpacity accessible accessibilityRole="button" 
          style={styles.backButton} 
          onPress={() => {
            console.log(`${LOG_PREFIX} 🔙 Back button pressed`);
            navigation.goBack();
          }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        {/* ✅ AVANT: '🏪 المتجر' */}
        <Text style={styles.headerTitle}>🏪 {t('shop.title')}</Text>
        <View style={styles.gemsDisplay}>
          <Text style={styles.gemsIcon}>💎</Text>
          <Text style={styles.gemsCount}>{gems}</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Daily Reward */}
        <View style={styles.dailyCard}>
          {/* ✅ AVANT: '🎁 المكافأة اليومية' */}
          <Text style={styles.dailyTitle}>🎁 {t('shop.dailyReward')}</Text>
          {/* ✅ AVANT: 'اجمع المكافآت كل يوم!' */}
          <Text style={styles.dailySubtitle}>{t('shop.collectDaily')}</Text>
          
          <View style={styles.dailyDays}>
            {DAILY_REWARDS.map((reward, index) => {
              const isPast = index < currentDay - 1;
              const isCurrent = index === currentDay - 1;
              const isFuture = index > currentDay - 1;
              
              return (
                <View 
                  key={index}
                  style={[
                    styles.dayItem,
                    isPast && styles.dayItemPast,
                    isCurrent && styles.dayItemCurrent,
                    isFuture && styles.dayItemFuture
                  ]}
                >
                  {/* ✅ AVANT: 'يوم X' */}
                  <Text style={styles.dayNumber}>{t('shop.dayX', { day: reward.day })}</Text>
                  <Text style={styles.dayReward}>
                    {reward.bonus || '💎'} {reward.gems}
                  </Text>
                  {isPast && <Text style={styles.dayCheck}>✓</Text>}
                </View>
              );
            })}
          </View>

          <TouchableOpacity accessible accessibilityRole="button" 
            style={[styles.claimButton, dailyClaimed && styles.claimButtonDisabled]}
            onPress={handleClaimDaily}
            disabled={dailyClaimed}
          >
            <LinearGradient 
              colors={dailyClaimed ? [colors.textMuted, colors.textSecondary] : [fixedColors.gold, colors.warningStrong]} 
              style={styles.claimGradient}
            >
              <Text style={styles.claimText}>
                {/* ✅ AVANT: '✓ تم الاستلام' / 'استلم المكافأة' */}
                {dailyClaimed ? `✓ ${t('shop.claimed')}` : t('shop.claimReward')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Shop Items */}
        {/* ✅ AVANT: '🛒 العناصر' */}
        <Text style={styles.sectionTitle}>🛒 {t('shop.items')}</Text>
        <View style={styles.itemsGrid}>
          {SHOP_ITEMS.map((item, index) => (
            <TouchableOpacity accessible accessibilityRole="button" 
              key={index}
              style={[styles.itemCard, item.price > gems && item.price > 0 && styles.itemCardDisabled]}
              onPress={() => item.price > 0 && handleBuyItem(item)}
              disabled={item.price === 0}
            >
              <View style={styles.itemIconContainer}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
              </View>
              {/* ✅ AVANT: {item.name} hardcodé */}
              <Text style={styles.itemName}>{t(item.nameKey)}</Text>
              {/* ✅ AVANT: {item.nameEn} hardcodé */}
              <Text style={styles.itemNameEn}>{t(item.nameEnKey)}</Text>
              
              {item.price > 0 ? (
                <View style={styles.priceContainer}>
                  <Text style={styles.priceIcon}>💎</Text>
                  <Text style={styles.priceText}>{item.price}</Text>
                </View>
              ) : (
                <View style={styles.realPriceContainer}>
                  <Text style={styles.realPriceText}>{item.realPrice}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 50, 
    paddingBottom: 20, 
    paddingHorizontal: 20 
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { color: c.onDeep, fontSize: 28 },
  headerTitle: { color: c.onDeep, fontSize: 20, fontWeight: 'bold' },
  gemsDisplay: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  gemsIcon: { fontSize: 18, marginRight: 5 },
  gemsCount: { color: c.onDeep, fontWeight: 'bold', fontSize: 16 },
  content: { padding: 20 },
  dailyCard: { 
    backgroundColor: c.surface, 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 25, 
    elevation: 3 
  },
  dailyTitle: { fontSize: 18, fontWeight: 'bold', color: c.text, marginBottom: 5 },
  dailySubtitle: { color: c.textSecondary, marginBottom: 20 },
  dailyDays: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  dayItem: { 
    alignItems: 'center', 
    padding: 8, 
    borderRadius: 10, 
    backgroundColor: c.background,
    minWidth: 45
  },
  dayItemPast: { backgroundColor: c.primarySoft },
  dayItemCurrent: { backgroundColor: c.warningSoft, borderWidth: 2, borderColor: fixedColors.gold },
  dayItemFuture: { backgroundColor: c.background },
  dayNumber: { fontSize: 9, color: c.textSecondary, marginBottom: 3 },
  dayReward: { fontSize: 12, fontWeight: 'bold', color: c.text },
  dayCheck: { color: c.primary, fontWeight: 'bold', marginTop: 2 },
  claimButton: { borderRadius: 15, overflow: 'hidden' },
  claimButtonDisabled: { opacity: 0.7 },
  claimGradient: { paddingVertical: 15, alignItems: 'center' },
  claimText: { color: c.text, fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  itemsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  itemCard: { 
    width: '48%', 
    backgroundColor: c.surface, 
    borderRadius: 15, 
    padding: 15, 
    alignItems: 'center', 
    marginBottom: 15, 
    elevation: 2 
  },
  itemCardDisabled: { opacity: 0.5 },
  itemIconContainer: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: c.background, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  itemIcon: { fontSize: 30 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: c.text, textAlign: 'center' },
  itemNameEn: { fontSize: 10, color: c.textMuted, marginTop: 2 },
  priceContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    backgroundColor: c.primarySoft, 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 10 
  },
  priceIcon: { fontSize: 14, marginRight: 4 },
  priceText: { color: c.primary, fontWeight: 'bold' },
  realPriceContainer: { 
    marginTop: 10, 
    backgroundColor: c.infoSoft, 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 10 
  },
  realPriceText: { color: c.infoStrong, fontWeight: 'bold' }
});