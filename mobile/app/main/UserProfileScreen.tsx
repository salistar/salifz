/**
 * UserProfileScreen - Salifz
 * ✅ View another user's profile
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

const FILE_NAME = '[UserProfileScreen]';

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

const leagueConfig: Record<string, { name: string; emoji: string; color: string; gradient: string[] }> = {
  bronze: { name: 'البرونزية', emoji: '🥉', color: '#CD7F32', gradient: ['#CD7F32', '#8B4513'] },
  silver: { name: 'الفضية', emoji: '🥈', color: '#C0C0C0', gradient: ['#C0C0C0', '#808080'] },
  gold: { name: 'الذهبية', emoji: '🥇', color: '#FFD700', gradient: ['#FFD700', '#FFA500'] },
  diamond: { name: 'الماسية', emoji: '💎', color: '#B9F2FF', gradient: ['#00BCD4', '#0097A7'] },
  hafiz: { name: 'الحافظ', emoji: '👑', color: '#FFD700', gradient: ['#9C27B0', '#7B1FA2'] }
};

// Helper function to safely format numbers
const formatNumber = (value: number | undefined | null): string => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return value.toLocaleString();
};

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    console.log(`${FILE_NAME} 🚀 Loading profile for ${userId}`);
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const response = await socialAPI.getUserProfile(userId);
      const data = response?.data || response;
      console.log(`${FILE_NAME} ✅ Profile loaded:`, data?.displayName);
      setProfile(data);
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Load profile error:`, error);
      Alert.alert('خطأ', 'لم يتم العثور على المستخدم');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!profile) return;
    
    setActionLoading(true);
    try {
      await socialAPI.sendRequest(profile._id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProfile({ ...profile, requestSent: true });
      Alert.alert('✓ تم!', 'تم إرسال طلب الصداقة');
    } catch (error: any) {
      Alert.alert('خطأ', error?.error || 'حدث خطأ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!profile) return;
    
    setActionLoading(true);
    try {
      await socialAPI.acceptRequest(profile._id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setProfile({ ...profile, isFriend: true, requestReceived: false });
      Alert.alert('✓ تم!', 'أصبحتما أصدقاء الآن');
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = () => {
    if (!profile) return;
    
    Alert.alert(
      'إزالة صديق',
      `هل تريد إزالة ${profile.displayName || profile.username} من قائمة الأصدقاء؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إزالة',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await socialAPI.removeFriend(profile._id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setProfile({ ...profile, isFriend: false });
            } catch (error) {
              Alert.alert('خطأ', 'حدث خطأ');
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
    
    try {
      const response = await chatAPI.createConversation(profile._id);
      const conversationId = response?.data?._id || response?._id;
      if (conversationId) {
        navigation.navigate('Chat', { conversationId, recipientId: profile._id });
      }
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Start chat error:`, error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <Text>المستخدم غير موجود</Text>
      </View>
    );
  }

  const league = leagueConfig[profile.league] || leagueConfig.bronze;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={league.gradient} style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
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
            <Text style={styles.leagueEmoji}>{league.emoji}</Text>
            <Text style={styles.leagueName}>{league.name}</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>🔥 {profile.currentStreak || 0}</Text>
              <Text style={styles.statLabel}>السلسلة</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>⚡ {formatNumber(profile.totalXP)}</Text>
              <Text style={styles.statLabel}>XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>📖 {profile.totalVersesMemorized || 0}</Text>
              <Text style={styles.statLabel}>آية</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {profile.isFriend ? (
            <>
              <TouchableOpacity 
                style={styles.chatButton}
                onPress={handleStartChat}
              >
                <Ionicons name="chatbubble" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>محادثة</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={handleRemoveFriend}
                disabled={actionLoading}
              >
                <Ionicons name="person-remove" size={20} color="#F44336" />
                <Text style={styles.removeButtonText}>إزالة</Text>
              </TouchableOpacity>
            </>
          ) : profile.requestSent ? (
            <View style={styles.pendingButton}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={styles.pendingButtonText}>طلب معلق</Text>
            </View>
          ) : profile.requestReceived ? (
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={handleAcceptRequest}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.acceptButtonText}>قبول الطلب</Text>
                </>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddFriend}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="person-add" size={20} color="#fff" />
                  <Text style={styles.addButtonText}>إضافة صديق</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Detailed Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 الإحصائيات</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statCardIcon}>📖</Text>
              <Text style={styles.statCardValue}>{profile.totalVersesMemorized || 0}</Text>
              <Text style={styles.statCardLabel}>آية محفوظة</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardIcon}>📚</Text>
              <Text style={styles.statCardValue}>{profile.totalSurahCompleted || 0}</Text>
              <Text style={styles.statCardLabel}>سورة كاملة</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardIcon}>🔥</Text>
              <Text style={styles.statCardValue}>{profile.longestStreak || 0}</Text>
              <Text style={styles.statCardLabel}>أطول سلسلة</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardIcon}>🏅</Text>
              <Text style={styles.statCardValue}>{profile.achievementsCount || 0}</Text>
              <Text style={styles.statCardLabel}>إنجاز</Text>
            </View>
          </View>
        </View>

        {/* Join Date */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 معلومات</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>تاريخ الانضمام</Text>
            <Text style={styles.infoValue}>
              {new Date(profile.joinedAt).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          {profile.country && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>البلد</Text>
              <Text style={styles.infoValue}>{profile.country}</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
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
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 50,
  },
  levelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  levelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    fontSize: 20,
    marginRight: 8,
  },
  leagueName: {
    color: '#fff',
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
    color: '#fff',
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
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 15,
    marginRight: 10,
    elevation: 3,
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 15,
    elevation: 3,
  },
  removeButtonText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 15,
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 15,
    elevation: 3,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  pendingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 15,
  },
  pendingButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 15,
    padding: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
    fontSize: 30,
    textAlign: 'center',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginTop: 5,
  },
  statCardLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});