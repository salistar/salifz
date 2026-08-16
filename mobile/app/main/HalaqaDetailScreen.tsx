/**
 * HalaqaDetailScreen - Salifz
 * ✅ COMPLETE: Full halaqa detail with activity management
 * ✅ FIXED: TypeScript FlatList type errors
 * ✅ FIXED: Chat button navigation
 * ✅ FEATURES:
 *    - View halaqa details, members, leaderboard
 *    - Admin can create activities (12 types)
 *    - Members can see and participate in activities
 *    - Copy/share invite code
 *    - Navigate to HalaqaChat
 *    - Leave halaqa / Delete halaqa (admin)
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Alert,
  Share,
  Modal,
  TextInput,
  Dimensions,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { halaqaAPI } from '../../services/api';
import { useAuthStore } from '../../stores';
import { COLORS } from '../../config';

const { width } = Dimensions.get('window');

// 12 Activity Types
const ACTIVITY_TYPES = [
  { id: 'memorize', name: 'حفظ جديد', icon: '📖', description: 'حفظ آيات جديدة', xpReward: 50 },
  { id: 'review', name: 'مراجعة', icon: '🔄', description: 'مراجعة الآيات المحفوظة', xpReward: 30 },
  { id: 'tajweed', name: 'تجويد', icon: '🎯', description: 'تعلم أحكام التجويد', xpReward: 40 },
  { id: 'tafseer', name: 'تفسير', icon: '📚', description: 'دراسة تفسير الآيات', xpReward: 35 },
  { id: 'recitation', name: 'تلاوة', icon: '🎙️', description: 'تلاوة وتسميع', xpReward: 25 },
  { id: 'competition', name: 'مسابقة', icon: '🏆', description: 'مسابقة بين الأعضاء', xpReward: 100 },
  { id: 'lesson', name: 'درس', icon: '📝', description: 'درس تعليمي', xpReward: 45 },
  { id: 'quiz', name: 'اختبار', icon: '❓', description: 'اختبار الحفظ', xpReward: 60 },
  { id: 'discussion', name: 'نقاش', icon: '💬', description: 'نقاش ومدارسة', xpReward: 20 },
  { id: 'challenge', name: 'تحدي', icon: '⚡', description: 'تحدي أسبوعي', xpReward: 80 },
  { id: 'workshop', name: 'ورشة عمل', icon: '🛠️', description: 'ورشة تدريبية', xpReward: 55 },
  { id: 'achievement', name: 'إنجاز', icon: '🏅', description: 'تحقيق إنجاز', xpReward: 70 },
];

interface MemberUser {
  _id: string;
  username?: string;
  displayName?: string;
}

interface Member {
  _id?: string;
  user: MemberUser;
  role?: string;
  stats?: {
    weeklyXP?: number;
    totalXP?: number;
    versesMemorized?: number;
    activitiesCompleted?: number;
  };
}

interface Activity {
  _id: string;
  type: string;
  title?: string;
  description?: string;
  user?: MemberUser;
  createdBy?: MemberUser;
  xpReward?: number;
  status?: 'active' | 'completed' | 'cancelled';
  completedBy?: string[];
  createdAt: string;
}

interface HalaqaCreator {
  _id: string;
  username?: string;
  displayName?: string;
}

interface Halaqa {
  _id: string;
  name: string;
  description?: string;
  membersCount?: number;
  memberCount?: number;
  maxMembers?: number;
  creator?: HalaqaCreator;
  admins?: string[];
  settings?: {
    isPublic?: boolean;
    dailyGoal?: number;
    allowChat?: boolean;
    activityTypes?: string[];
  };
  stats?: {
    totalVersesMemorized?: number;
    weeklyXP?: number;
    activitiesCount?: number;
  };
  inviteCode?: string;
  members?: Member[];
}

type TabType = 'activities' | 'members' | 'leaderboard';

export default function HalaqaDetailScreen({ route, navigation }: any) {
  const { halaqaId, halaqaData } = route.params || {};
  const { user } = useAuthStore();

  const [halaqa, setHalaqa] = useState<Halaqa | null>(halaqaData || null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leaderboard, setLeaderboard] = useState<Member[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('activities');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreateActivityModal, setShowCreateActivityModal] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<string | null>(null);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDescription, setActivityDescription] = useState('');
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHalaqaData();
    }, [halaqaId])
  );

  const loadHalaqaData = async () => {
    if (!halaqaId) {
      Alert.alert('خطأ', 'معرف الحلقة غير موجود');
      navigation.goBack();
      return;
    }
    try {
      setIsLoading(true);

      // Load halaqa details
      try {
        const res = await halaqaAPI.getHalaqa(halaqaId);
        setHalaqa(res?.data || res?.halaqa || res);
      } catch (e) {
        console.log('Error loading halaqa:', e);
      }

      // Load members
      try {
        const res = await halaqaAPI.getMembers(halaqaId);
        const data = res?.data || res?.members || res;
        setMembers(Array.isArray(data) ? data : []);
      } catch (e) {
        setMembers([]);
      }

      // Load activities
      try {
        const res = await halaqaAPI.getActivities(halaqaId);
        const data = res?.data || res?.activities || res;
        setActivities(Array.isArray(data) ? data : []);
      } catch (e) {
        setActivities([]);
      }

      // Load leaderboard
      try {
        const res = await halaqaAPI.getLeaderboard(halaqaId);
        const data = res?.data || res?.leaderboard || res;
        setLeaderboard(Array.isArray(data) ? data : []);
      } catch (e) {
        setLeaderboard([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHalaqaData();
  };

  // Helper functions
  const getName = (): string => halaqa?.name || 'حلقة';
  const getDescription = (): string => halaqa?.description || 'حلقة لحفظ القرآن';
  const getMemberCount = (): number => halaqa?.membersCount || halaqa?.memberCount || members.length || 1;
  const getTotalVerses = (): number => halaqa?.stats?.totalVersesMemorized || 0;
  const getWeeklyXP = (): number => halaqa?.stats?.weeklyXP || 0;
  const getInviteCode = (): string => halaqa?.inviteCode || 'N/A';
  const getCreatorName = (): string => halaqa?.creator?.displayName || halaqa?.creator?.username || 'مدير';
  const isCreatorUser = (): boolean => halaqa?.creator?._id === user?._id;
  const isAdminUser = (): boolean => isCreatorUser() || (halaqa?.admins?.includes(user?._id || '') || false);
  const isPublicHalaqa = (): boolean => halaqa?.settings?.isPublic !== false;
  const isChatAllowed = (): boolean => halaqa?.settings?.allowChat !== false;
  const getActivityTypes = (): string[] => halaqa?.settings?.activityTypes || ['memorize', 'review'];
  
  const getActivityTypeInfo = (id: string) => {
    return ACTIVITY_TYPES.find((t) => t.id === id) || {
      id,
      name: 'نشاط',
      icon: '📌',
      xpReward: 0,
      description: '',
    };
  };

  // ✅ Navigate to Chat
  const navigateToChat = () => {
    if (!isChatAllowed()) {
      Alert.alert('تنبيه', 'المحادثة معطلة في هذه الحلقة');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('HalaqaChat', { 
      halaqaId, 
      halaqaName: getName() 
    });
  };

  // Handlers
  const handleLeaveHalaqa = () => {
    if (isCreatorUser()) {
      Alert.alert('تنبيه', 'لا يمكنك مغادرة الحلقة لأنك المنشئ');
      return;
    }
    Alert.alert('مغادرة الحلقة', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'مغادرة',
        style: 'destructive',
        onPress: async () => {
          try {
            await halaqaAPI.leaveHalaqa(halaqaId);
            Alert.alert('تم', 'تم مغادرة الحلقة');
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('خطأ', e?.error || 'فشل');
          }
        },
      },
    ]);
  };

  const handleDeleteHalaqa = () => {
    if (!isCreatorUser()) return;
    Alert.alert('حذف الحلقة', 'هل أنت متأكد؟ لا يمكن التراجع', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          try {
            await halaqaAPI.deleteHalaqa(halaqaId);
            Alert.alert('تم', 'تم حذف الحلقة');
            navigation.goBack();
          } catch (e: any) {
            Alert.alert('خطأ', e?.error || 'فشل');
          }
        },
      },
    ]);
  };

  const copyInviteCode = async () => {
    const code = getInviteCode();
    if (code !== 'N/A') {
      await Clipboard.setStringAsync(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('تم النسخ ✅', code);
    }
  };

  const shareInviteCode = async () => {
    try {
      await Share.share({
        message: `انضم إلى حلقة "${getName()}" في Salifz!\nرمز الدعوة: ${getInviteCode()}`,
      });
    } catch {
      copyInviteCode();
    }
  };

  const handleCreateActivity = async () => {
    if (!selectedActivityType || !activityTitle.trim()) {
      Alert.alert('خطأ', 'أكمل البيانات المطلوبة');
      return;
    }
    try {
      setIsCreatingActivity(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const actType = getActivityTypeInfo(selectedActivityType);
      await halaqaAPI.createActivity(halaqaId, {
        type: selectedActivityType,
        title: activityTitle.trim(),
        description: activityDescription.trim() || actType.description,
        xpReward: actType.xpReward,
      });
      setShowCreateActivityModal(false);
      setSelectedActivityType(null);
      setActivityTitle('');
      setActivityDescription('');
      await loadHalaqaData();
      Alert.alert('تم ✅', 'تم إنشاء النشاط');
    } catch (e: any) {
      Alert.alert('خطأ', e?.error || 'فشل');
    } finally {
      setIsCreatingActivity(false);
    }
  };

  const handleCompleteActivity = async (activity: Activity) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await halaqaAPI.completeActivity(halaqaId, activity._id);
      await loadHalaqaData();
      Alert.alert('أحسنت! 🎉', `حصلت على ${activity.xpReward || getActivityTypeInfo(activity.type).xpReward} XP`);
    } catch (e: any) {
      Alert.alert('خطأ', e?.error || 'فشل');
    }
  };

  const formatTime = (d?: string): string => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hrs < 24) return `منذ ${hrs} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return new Date(d).toLocaleDateString('ar-SA');
  };

  // ✅ FIXED: Separate render functions with proper types
  const renderActivity: ListRenderItem<Activity> = ({ item }) => {
    const actType = getActivityTypeInfo(item.type);
    const isCompleted = item.status === 'completed' || item.completedBy?.includes(user?._id || '');
    const creator = item.createdBy?.displayName || item.createdBy?.username || item.user?.displayName || 'مدير';
    
    return (
      <View style={[styles.activityItem, isCompleted && styles.activityItemCompleted]}>
        <View style={[styles.activityIcon, isCompleted && styles.activityIconCompleted]}>
          <Text style={styles.activityIconText}>{actType.icon}</Text>
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.title || actType.name}</Text>
          <Text style={styles.activityDescription} numberOfLines={2}>
            {item.description || actType.description}
          </Text>
          <View style={styles.activityMeta}>
            <Text style={styles.activityCreator}>{'بواسطة: '}{creator}</Text>
            <Text style={styles.activityTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.activityRight}>
          <View style={styles.activityXP}>
            <Text style={styles.activityXPText}>{'+' + (item.xpReward || actType.xpReward)}</Text>
            <Text style={styles.activityXPLabel}>{'XP'}</Text>
          </View>
          {!isCompleted ? (
            <TouchableOpacity style={styles.completeButton} onPress={() => handleCompleteActivity(item)}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
          )}
        </View>
      </View>
    );
  };

  const renderMember: ListRenderItem<Member> = ({ item }) => {
    const name = item.user?.displayName || item.user?.username || 'عضو';
    const isAdmin = item.role === 'admin' || item.role === 'creator' || item.user?._id === halaqa?.creator?._id;
    
    return (
      <View style={styles.memberItem}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>{name.charAt(0).toUpperCase()}</Text>
          {isAdmin && (
            <View style={styles.memberAdminBadge}>
              <Text>{'👑'}</Text>
            </View>
          )}
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName}>{name}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>{'مدير'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberStats}>
            {item.stats?.versesMemorized || 0}{' آية • '}{item.stats?.totalXP || 0}{' XP'}
          </Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem: ListRenderItem<Member> = ({ item, index }) => {
    const name = item.user?.displayName || item.user?.username || 'عضو';
    const rank = index + 1;
    const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : String(rank);
    const rankStyle = rank === 1 ? styles.rank1 : rank === 2 ? styles.rank2 : rank === 3 ? styles.rank3 : {};
    
    return (
      <View style={[styles.leaderboardItem, rankStyle]}>
        <View style={styles.rankContainer}>
          <Text style={styles.rankText}>{rankIcon}</Text>
        </View>
        <View style={styles.leaderboardAvatar}>
          <Text style={styles.leaderboardAvatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName}>{name}</Text>
          <Text style={styles.leaderboardActivities}>{item.stats?.activitiesCompleted || 0}{' نشاط'}</Text>
        </View>
        <View style={styles.leaderboardXP}>
          <Text style={styles.leaderboardXPValue}>{item.stats?.weeklyXP || item.stats?.totalXP || 0}</Text>
          <Text style={styles.leaderboardXPLabel}>{'XP'}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = (type: TabType) => {
    const config = {
      activities: { icon: '📊', title: 'لا توجد أنشطة' },
      members: { icon: '👥', title: 'لا يوجد أعضاء' },
      leaderboard: { icon: '🏆', title: 'لا توجد بيانات' },
    };
    const msg = config[type];
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>{msg.icon}</Text>
        <Text style={styles.emptyTitle}>{msg.title}</Text>
        {type === 'activities' && isAdminUser() && (
          <TouchableOpacity style={styles.createActivityButton} onPress={() => setShowCreateActivityModal(true)}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.createActivityButtonText}>{'إنشاء نشاط'}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // ✅ FIXED: Separate FlatList components for each tab
  const renderTabContent = () => {
    if (activeTab === 'activities') {
      return (
        <View>
          {isAdminUser() && (
            <TouchableOpacity style={styles.addActivityButton} onPress={() => setShowCreateActivityModal(true)}>
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              <Text style={styles.addActivityButtonText}>{'إنشاء نشاط جديد'}</Text>
            </TouchableOpacity>
          )}
          {activities.length > 0 ? (
            <FlatList<Activity>
              data={activities}
              renderItem={renderActivity}
              keyExtractor={(item, i) => item._id || `activity-${i}`}
              contentContainerStyle={styles.listContent}
              scrollEnabled={false}
            />
          ) : (
            renderEmptyState('activities')
          )}
        </View>
      );
    }

    if (activeTab === 'members') {
      return members.length > 0 ? (
        <FlatList<Member>
          data={members}
          renderItem={renderMember}
          keyExtractor={(item, i) => item._id || item.user?._id || `member-${i}`}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : (
        renderEmptyState('members')
      );
    }

    if (activeTab === 'leaderboard') {
      return leaderboard.length > 0 ? (
        <FlatList<Member>
          data={leaderboard}
          renderItem={renderLeaderboardItem}
          keyExtractor={(item, i) => item._id || item.user?._id || `leader-${i}`}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : (
        renderEmptyState('leaderboard')
      );
    }

    return null;
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'تفاصيل الحلقة'}</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{'جاري التحميل...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{getName()}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Header Content */}
        <View style={styles.headerContent}>
          <View style={styles.halaqaAvatar}>
            <Text style={styles.halaqaAvatarText}>{getName().charAt(0).toUpperCase()}</Text>
            {isAdminUser() && (
              <View style={styles.adminCrown}>
                <Text>{'👑'}</Text>
              </View>
            )}
          </View>
          <Text style={styles.halaqaName}>{getName()}</Text>
          <Text style={styles.halaqaDescription}>{getDescription()}</Text>
          
          <View style={styles.creatorRow}>
            <Text style={styles.creatorLabel}>{'أنشأها: '}</Text>
            <Text style={styles.creatorName}>{getCreatorName()}</Text>
            <Text style={isPublicHalaqa() ? styles.publicBadge : styles.privateBadge}>
              {isPublicHalaqa() ? '🌍 عامة' : '🔒 خاصة'}
            </Text>
          </View>

          {/* Activity Types */}
          <View style={styles.activityTypesRow}>
            {getActivityTypes().slice(0, 6).map((id, i) => {
              const t = getActivityTypeInfo(id);
              return (
                <View key={i} style={styles.activityTypeBadge}>
                  <Text style={styles.activityTypeBadgeIcon}>{t.icon}</Text>
                  <Text style={styles.activityTypeBadgeName}>{t.name}</Text>
                </View>
              );
            })}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getMemberCount()}</Text>
              <Text style={styles.statLabel}>{'عضو'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getTotalVerses()}</Text>
              <Text style={styles.statLabel}>{'آية'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getWeeklyXP()}</Text>
              <Text style={styles.statLabel}>{'XP'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activities.length}</Text>
              <Text style={styles.statLabel}>{'نشاط'}</Text>
            </View>
          </View>

          {/* Invite Code */}
          <View style={styles.inviteSection}>
            <Text style={styles.inviteLabel}>{'رمز الدعوة'}</Text>
            <TouchableOpacity onPress={copyInviteCode} style={styles.inviteCodeBox}>
              <Text style={styles.inviteCode}>{getInviteCode()}</Text>
              <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={shareInviteCode}>
              <Ionicons name="share-social-outline" size={18} color="#fff" />
              <Text style={styles.shareButtonText}>{'مشاركة'}</Text>
            </TouchableOpacity>
          </View>

          {/* ✅ Actions with Chat Button */}
          <View style={styles.actionsRow}>
            {/* Chat Button - Always visible if allowed */}
            {isChatAllowed() && (
              <TouchableOpacity style={styles.chatButton} onPress={navigateToChat}>
                <Ionicons name="chatbubbles-outline" size={18} color="#fff" />
                <Text style={styles.chatButtonText}>{'محادثة'}</Text>
              </TouchableOpacity>
            )}
            
            {!isCreatorUser() && (
              <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveHalaqa}>
                <Ionicons name="exit-outline" size={18} color="#F44336" />
                <Text style={styles.leaveButtonText}>{'مغادرة'}</Text>
              </TouchableOpacity>
            )}
            {isCreatorUser() && (
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteHalaqa}>
                <Ionicons name="trash-outline" size={18} color="#F44336" />
                <Text style={styles.deleteButtonText}>{'حذف'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['activities', 'members', 'leaderboard'] as TabType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={tab === 'activities' ? 'pulse-outline' : tab === 'members' ? 'people-outline' : 'trophy-outline'}
                size={18}
                color={activeTab === tab ? COLORS.primary : '#999'}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'activities' ? 'الأنشطة' : tab === 'members' ? 'الأعضاء' : 'المتصدرين'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>{renderTabContent()}</View>
      </ScrollView>

      {/* Create Activity Modal */}
      <Modal
        visible={showCreateActivityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateActivityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{'إنشاء نشاط جديد'}</Text>
                <TouchableOpacity onPress={() => setShowCreateActivityModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>{'نوع النشاط *'}</Text>
              <View style={styles.activityTypesGrid}>
                {ACTIVITY_TYPES.filter((t) => getActivityTypes().includes(t.id)).map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.activityTypeOption,
                      selectedActivityType === type.id && styles.activityTypeOptionSelected,
                    ]}
                    onPress={() => {
                      setSelectedActivityType(type.id);
                      if (!activityTitle) setActivityTitle(type.name);
                    }}
                  >
                    <Text style={styles.activityTypeOptionIcon}>{type.icon}</Text>
                    <Text
                      style={[
                        styles.activityTypeOptionName,
                        selectedActivityType === type.id && styles.activityTypeOptionNameSelected,
                      ]}
                    >
                      {type.name}
                    </Text>
                    <Text style={styles.activityTypeOptionXP}>{'+' + type.xpReward}</Text>
                    {selectedActivityType === type.id && (
                      <View style={styles.selectedCheck}>
                        <Ionicons name="checkmark" size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>{'التفاصيل'}</Text>
              <TextInput
                style={styles.input}
                placeholder="عنوان النشاط *"
                placeholderTextColor="#999"
                value={activityTitle}
                onChangeText={setActivityTitle}
                maxLength={100}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="وصف (اختياري)"
                placeholderTextColor="#999"
                value={activityDescription}
                onChangeText={setActivityDescription}
                multiline
                maxLength={300}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCreateActivityModal(false);
                    setSelectedActivityType(null);
                    setActivityTitle('');
                    setActivityDescription('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>{'إلغاء'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isCreatingActivity && styles.buttonDisabled]}
                  onPress={handleCreateActivity}
                  disabled={isCreatingActivity || !selectedActivityType || !activityTitle.trim()}
                >
                  {isCreatingActivity ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="add" size={20} color="#fff" />
                      <Text style={styles.confirmButtonText}>{'إنشاء'}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
  scrollView: { flex: 1 },
  headerContent: { backgroundColor: '#fff', padding: 20, alignItems: 'center', borderBottomLeftRadius: 25, borderBottomRightRadius: 25, marginBottom: 10 },
  halaqaAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15, position: 'relative' },
  halaqaAvatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  adminCrown: { position: 'absolute', top: -8, right: -8 },
  halaqaName: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  halaqaDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 10 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  creatorLabel: { fontSize: 13, color: '#999' },
  creatorName: { fontSize: 13, color: '#666', fontWeight: '500' },
  publicBadge: { fontSize: 12, color: COLORS.primary, marginLeft: 10 },
  privateBadge: { fontSize: 12, color: '#FF9800', marginLeft: 10 },
  activityTypesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 15 },
  activityTypeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, gap: 4 },
  activityTypeBadgeIcon: { fontSize: 14 },
  activityTypeBadgeName: { fontSize: 11, color: '#666' },
  statsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 15, padding: 15, marginBottom: 20, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: '#ddd' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  inviteSection: { alignItems: 'center', marginBottom: 15, width: '100%' },
  inviteLabel: { fontSize: 12, color: '#999', marginBottom: 8 },
  inviteCodeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginBottom: 10 },
  inviteCode: { fontSize: 22, fontWeight: 'bold', color: COLORS.primary, letterSpacing: 3, marginRight: 10 },
  shareButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 8 },
  shareButtonText: { color: '#fff', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  chatButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 5 },
  chatButtonText: { color: '#fff', fontWeight: '600' },
  leaveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 5 },
  leaveButtonText: { color: '#F44336', fontWeight: '600' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 5 },
  deleteButtonText: { color: '#F44336', fontWeight: '600' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 15, borderRadius: 15, padding: 5, marginBottom: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 5 },
  activeTab: { backgroundColor: '#E8F5E9' },
  tabText: { fontSize: 12, color: '#999', fontWeight: '500' },
  activeTabText: { color: COLORS.primary, fontWeight: '600' },
  tabContent: { flex: 1, minHeight: 300 },
  listContent: { padding: 15 },
  addActivityButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 12, borderWidth: 2, borderColor: COLORS.primary, borderStyle: 'dashed', gap: 8 },
  addActivityButtonText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 },
  activityItemCompleted: { opacity: 0.7 },
  activityIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  activityIconCompleted: { backgroundColor: '#f0f0f0' },
  activityIconText: { fontSize: 22 },
  activityContent: { flex: 1, marginLeft: 12 },
  activityTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  activityDescription: { fontSize: 12, color: '#666', marginTop: 3 },
  activityMeta: { flexDirection: 'row', marginTop: 5, gap: 10 },
  activityCreator: { fontSize: 10, color: '#999' },
  activityTime: { fontSize: 10, color: '#999' },
  activityRight: { alignItems: 'center', gap: 8 },
  activityXP: { alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  activityXPText: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary },
  activityXPLabel: { fontSize: 9, color: COLORS.primary },
  completeButton: { backgroundColor: COLORS.primary, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  memberItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 },
  memberAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  memberAvatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  memberAdminBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#fff', borderRadius: 10, padding: 1 },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#333' },
  adminBadge: { backgroundColor: '#FFF3E0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  adminBadgeText: { fontSize: 10, color: '#FF9800', fontWeight: '600' },
  memberStats: { fontSize: 12, color: '#999', marginTop: 3 },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10 },
  rank1: { borderWidth: 2, borderColor: '#FFD700' },
  rank2: { borderWidth: 2, borderColor: '#C0C0C0' },
  rank3: { borderWidth: 2, borderColor: '#CD7F32' },
  rankContainer: { width: 35, alignItems: 'center' },
  rankText: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  leaderboardAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  leaderboardAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  leaderboardInfo: { flex: 1, marginLeft: 12 },
  leaderboardName: { fontSize: 16, fontWeight: '600', color: '#333' },
  leaderboardActivities: { fontSize: 11, color: '#999', marginTop: 2 },
  leaderboardXP: { alignItems: 'center' },
  leaderboardXPValue: { fontSize: 18, fontWeight: 'bold', color: COLORS.primary },
  leaderboardXPLabel: { fontSize: 10, color: '#999' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  createActivityButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, gap: 8 },
  createActivityButtonText: { color: '#fff', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 15, marginBottom: 10 },
  activityTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  activityTypeOption: { width: (width - 70) / 3, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 12, alignItems: 'center', position: 'relative' },
  activityTypeOptionSelected: { backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: COLORS.primary },
  activityTypeOptionIcon: { fontSize: 24, marginBottom: 5 },
  activityTypeOptionName: { fontSize: 11, fontWeight: '600', color: '#666', textAlign: 'center' },
  activityTypeOptionNameSelected: { color: COLORS.primary },
  activityTypeOptionXP: { fontSize: 9, color: '#999', marginTop: 2 },
  selectedCheck: { position: 'absolute', top: 5, right: 5, backgroundColor: COLORS.primary, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 10, textAlign: 'right', color: '#333' },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 30 },
  cancelButton: { flex: 1, paddingVertical: 15, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center' },
  cancelButtonText: { color: '#666', fontWeight: '600', fontSize: 16 },
  confirmButton: { flex: 2, flexDirection: 'row', paddingVertical: 15, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', gap: 5 },
  confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
});