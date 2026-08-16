import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, RefreshControl
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useGamificationStore } from '../../stores';
import { rewardsAPI } from '../../services/api';
import { COLORS } from '../../config';

const DAILY_REWARDS = [
  { day: 1, gems: 5 },
  { day: 2, gems: 10 },
  { day: 3, gems: 15 },
  { day: 4, gems: 20 },
  { day: 5, gems: 25 },
  { day: 6, gems: 35 },
  { day: 7, gems: 50, bonus: '❄️' }
];

const SHOP_ITEMS = [
  { id: 'heart_refill', name: 'إعادة القلوب', nameEn: 'Heart Refill', icon: '❤️', price: 350, description: 'استعادة كل القلوب' },
  { id: 'streak_freeze', name: 'تجميد السلسلة', nameEn: 'Streak Freeze', icon: '❄️', price: 200, description: 'حماية سلسلتك ليوم واحد' },
  { id: 'xp_boost', name: 'مضاعف XP', nameEn: 'XP Boost', icon: '⚡', price: 500, description: 'مضاعفة XP لمدة ساعة' },
  { id: 'avatar_gold', name: 'إطار ذهبي', nameEn: 'Gold Frame', icon: '🖼️', price: 1000, description: 'إطار ذهبي للصورة الشخصية' },
  { id: 'gems_100', name: '100 جوهرة', nameEn: '100 Gems', icon: '💎', price: 0, realPrice: '$0.99' },
  { id: 'gems_500', name: '500 جوهرة', nameEn: '500 Gems', icon: '💎💎', price: 0, realPrice: '$3.99' }
];

export default function ShopScreen({ navigation }: any) {
  const { gems, addGems, refillHearts } = useGamificationStore();
  const [currentDay, setCurrentDay] = useState(3);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDailyReward();
  }, []);

  const loadDailyReward = async () => {
    try {
      const response = await rewardsAPI.getDailyReward();
      const data = response as any;
      setCurrentDay(data.currentDay || 1);
      setDailyClaimed(data.claimed || false);
    } catch (error) {
      console.error('Load daily reward error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDailyReward();
    setRefreshing(false);
  };

  const handleClaimDaily = async () => {
    if (dailyClaimed) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const response = await rewardsAPI.claimDailyReward();
      const data = response as any;
      addGems(data.gems || DAILY_REWARDS[currentDay - 1].gems);
      setDailyClaimed(true);
      Alert.alert('🎉 مبروك!', `حصلت على ${data.gems || DAILY_REWARDS[currentDay - 1].gems} جوهرة!`);
    } catch (error) {
      console.error('Claim daily error:', error);
    }
  };

  const handleBuyItem = async (item: any) => {
    if (item.price > gems) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('جواهر غير كافية!', `تحتاج ${item.price} جوهرة لشراء ${item.name}`);
      return;
    }

    Alert.alert(
      'تأكيد الشراء',
      `هل تريد شراء ${item.name} بـ ${item.price} جوهرة؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'شراء',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            try {
              await rewardsAPI.buyItem(item.id);
              addGems(-item.price);
              
              // Apply item effect
              if (item.id === 'heart_refill') {
                refillHearts();
              }
              
              Alert.alert('✓ تم!', `تم شراء ${item.name} بنجاح!`);
            } catch (error) {
              console.error('Buy item error:', error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#9C27B0', '#7B1FA2']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏪 المتجر</Text>
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
          <Text style={styles.dailyTitle}>🎁 المكافأة اليومية</Text>
          <Text style={styles.dailySubtitle}>اجمع المكافآت كل يوم!</Text>
          
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
                  <Text style={styles.dayNumber}>يوم {reward.day}</Text>
                  <Text style={styles.dayReward}>
                    {reward.bonus || '💎'} {reward.gems}
                  </Text>
                  {isPast && <Text style={styles.dayCheck}>✓</Text>}
                </View>
              );
            })}
          </View>

          <TouchableOpacity 
            style={[styles.claimButton, dailyClaimed && styles.claimButtonDisabled]}
            onPress={handleClaimDaily}
            disabled={dailyClaimed}
          >
            <LinearGradient 
              colors={dailyClaimed ? ['#9E9E9E', '#757575'] : ['#FFD700', '#FFA000']} 
              style={styles.claimGradient}
            >
              <Text style={styles.claimText}>
                {dailyClaimed ? '✓ تم الاستلام' : 'استلم المكافأة'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Shop Items */}
        <Text style={styles.sectionTitle}>🛒 العناصر</Text>
        <View style={styles.itemsGrid}>
          {SHOP_ITEMS.map((item, index) => (
            <TouchableOpacity 
              key={index}
              style={[styles.itemCard, item.price > gems && item.price > 0 && styles.itemCardDisabled]}
              onPress={() => item.price > 0 && handleBuyItem(item)}
              disabled={item.price === 0}
            >
              <View style={styles.itemIconContainer}>
                <Text style={styles.itemIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemNameEn}>{item.nameEn}</Text>
              
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingTop: 50, 
    paddingBottom: 20, 
    paddingHorizontal: 20 
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  backIcon: { color: '#fff', fontSize: 28 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  gemsDisplay: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 20 
  },
  gemsIcon: { fontSize: 18, marginRight: 5 },
  gemsCount: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  content: { padding: 20 },
  dailyCard: { 
    backgroundColor: '#fff', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 25, 
    elevation: 3 
  },
  dailyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  dailySubtitle: { color: '#666', marginBottom: 20 },
  dailyDays: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  dayItem: { 
    alignItems: 'center', 
    padding: 8, 
    borderRadius: 10, 
    backgroundColor: '#f5f5f5',
    minWidth: 45
  },
  dayItemPast: { backgroundColor: '#E8F5E9' },
  dayItemCurrent: { backgroundColor: '#FFF3E0', borderWidth: 2, borderColor: '#FFD700' },
  dayItemFuture: { backgroundColor: '#f5f5f5' },
  dayNumber: { fontSize: 9, color: '#666', marginBottom: 3 },
  dayReward: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  dayCheck: { color: COLORS.primary, fontWeight: 'bold', marginTop: 2 },
  claimButton: { borderRadius: 15, overflow: 'hidden' },
  claimButtonDisabled: { opacity: 0.7 },
  claimGradient: { paddingVertical: 15, alignItems: 'center' },
  claimText: { color: '#333', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  itemsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between' 
  },
  itemCard: { 
    width: '48%', 
    backgroundColor: '#fff', 
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
    backgroundColor: '#f5f5f5', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  itemIcon: { fontSize: 30 },
  itemName: { fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  itemNameEn: { fontSize: 10, color: '#999', marginTop: 2 },
  priceContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 10, 
    backgroundColor: '#E8F5E9', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 10 
  },
  priceIcon: { fontSize: 14, marginRight: 4 },
  priceText: { color: COLORS.primary, fontWeight: 'bold' },
  realPriceContainer: { 
    marginTop: 10, 
    backgroundColor: '#E3F2FD', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 10 
  },
  realPriceText: { color: '#1976D2', fontWeight: 'bold' }
});