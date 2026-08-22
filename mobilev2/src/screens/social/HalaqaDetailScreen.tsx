/**
 * ============================================
 * 📱 HalaqaDetailScreen.tsx - Salifz
 * ============================================
 * ✅ COMPLETE: Full halaqa detail with activity management
 * ✅ CONVERTED: i18n integration
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { halaqaAPI } from '../../services/api';
import { useAuthStore } from '../../stores';
// ✅ AJOUT: Import i18n
import { t, isRTL } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';
import { HizbStar, MihrabArch, ZelligeField } from '../../components/common/Ornements';
import {
  IconeMushaf,
  IconeRevision,
  IconeDefis,
  IconeLecons,
  IconeRecitations,
  IconeClassement,
  IconeVersetDuJour,
  IconeHalaqat,
  IconeRecompense,
  IconeAmis,
  IconeProps,
} from '../../components/common/Icones';
import { getLocale } from '../../services/i18n';

const LOG_PREFIX = '[HalaqaDetailScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

const { width } = Dimensions.get('window');

/**
 * Les douze types d'activite.
 *
 * Chacun portait un emoji. Un emoji se rend differemment sur chaque appareil,
 * et douze styles de dessin cote a cote donnent l'impression d'un assemblage
 * plutot que d'un produit. L'icone du jeu maison remplace le pictogramme, et
 * elle est la meme que sur le web pour la meme notion.
 */
const ICONES_ACTIVITE: Record<string, React.ComponentType<IconeProps>> = {
  memorize: IconeMushaf,
  review: IconeRevision,
  tajweed: IconeDefis,
  tafseer: IconeLecons,
  recitation: IconeRecitations,
  competition: IconeClassement,
  lesson: IconeLecons,
  quiz: IconeVersetDuJour,
  discussion: IconeHalaqat,
  challenge: IconeDefis,
  workshop: IconeAmis,
  achievement: IconeRecompense,
};

const getActivityTypes = () => [
  { id: 'memorize', name: t('halaqaDetail.activityTypes.memorize'), description: t('halaqaDetail.activityTypes.memorizeDesc'), xpReward: 50 },
  { id: 'review', name: t('halaqaDetail.activityTypes.review'), description: t('halaqaDetail.activityTypes.reviewDesc'), xpReward: 30 },
  { id: 'tajweed', name: t('halaqaDetail.activityTypes.tajweed'), description: t('halaqaDetail.activityTypes.tajweedDesc'), xpReward: 40 },
  { id: 'tafseer', name: t('halaqaDetail.activityTypes.tafseer'), description: t('halaqaDetail.activityTypes.tafseerDesc'), xpReward: 35 },
  { id: 'recitation', name: t('halaqaDetail.activityTypes.recitation'), description: t('halaqaDetail.activityTypes.recitationDesc'), xpReward: 25 },
  { id: 'competition', name: t('halaqaDetail.activityTypes.competition'), description: t('halaqaDetail.activityTypes.competitionDesc'), xpReward: 100 },
  { id: 'lesson', name: t('halaqaDetail.activityTypes.lesson'), description: t('halaqaDetail.activityTypes.lessonDesc'), xpReward: 45 },
  { id: 'quiz', name: t('halaqaDetail.activityTypes.quiz'), description: t('halaqaDetail.activityTypes.quizDesc'), xpReward: 60 },
  { id: 'discussion', name: t('halaqaDetail.activityTypes.discussion'), description: t('halaqaDetail.activityTypes.discussionDesc'), xpReward: 20 },
  { id: 'challenge', name: t('halaqaDetail.activityTypes.challenge'), description: t('halaqaDetail.activityTypes.challengeDesc'), xpReward: 80 },
  { id: 'workshop', name: t('halaqaDetail.activityTypes.workshop'), description: t('halaqaDetail.activityTypes.workshopDesc'), xpReward: 55 },
  { id: 'achievement', name: t('halaqaDetail.activityTypes.achievement'), description: t('halaqaDetail.activityTypes.achievementDesc'), xpReward: 70 },
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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering`);
  
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

  // ✅ Récupérer les types d'activités avec i18n
  const ACTIVITY_TYPES = getActivityTypes();

  useFocusEffect(
    useCallback(() => {
      console.log(`${LOG_PREFIX} ⚡ useFocusEffect - halaqaId: ${halaqaId}`);
      loadHalaqaData();
    }, [halaqaId])
  );

  const loadHalaqaData = async () => {
    if (!halaqaId) {
      // ✅ AVANT: Alert.alert('خطأ', 'معرف الحلقة غير موجود')
      Alert.alert(t('common.error'), t('halaqaDetail.errors.noHalaqaId'));
      navigation.goBack();
      return;
    }
    
    console.log(`${LOG_PREFIX} 📥 loadHalaqaData()`);
    
    try {
      setIsLoading(true);

      // Load halaqa details
      try {
        const res = await halaqaAPI.getHalaqa(halaqaId);
        setHalaqa(res?.data || res?.halaqa || res);
        console.log(`${LOG_PREFIX} ✅ Halaqa loaded`);
      } catch (e) {
        console.log(`${LOG_PREFIX} ❌ Error loading halaqa:`, e);
      }

      // Load members
      try {
        const res = await halaqaAPI.getMembers(halaqaId);
        const data = res?.data || res?.members || res;
        setMembers(Array.isArray(data) ? data : []);
        console.log(`${LOG_PREFIX} ✅ Members loaded: ${Array.isArray(data) ? data.length : 0}`);
      } catch (e) {
        setMembers([]);
      }

      // Load activities
      try {
        const res = await halaqaAPI.getActivities(halaqaId);
        const data = res?.data || res?.activities || res;
        setActivities(Array.isArray(data) ? data : []);
        console.log(`${LOG_PREFIX} ✅ Activities loaded: ${Array.isArray(data) ? data.length : 0}`);
      } catch (e) {
        setActivities([]);
      }

      // Load leaderboard
      try {
        const res = await halaqaAPI.getLeaderboard(halaqaId);
        const data = res?.data || res?.leaderboard || res;
        setLeaderboard(Array.isArray(data) ? data : []);
        console.log(`${LOG_PREFIX} ✅ Leaderboard loaded: ${Array.isArray(data) ? data.length : 0}`);
      } catch (e) {
        setLeaderboard([]);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log(`${LOG_PREFIX} 🔄 onRefresh()`);
    setRefreshing(true);
    loadHalaqaData();
  };

  // Helper functions
  // ✅ AVANT: 'حلقة'
  const getName = (): string => halaqa?.name || t('halaqaDetail.defaultName');
  // ✅ AVANT: 'حلقة لحفظ القرآن'
  const getDescription = (): string => halaqa?.description || t('halaqaDetail.defaultDescription');
  const getMemberCount = (): number => halaqa?.membersCount || halaqa?.memberCount || members.length || 1;
  const getTotalVerses = (): number => halaqa?.stats?.totalVersesMemorized || 0;
  const getWeeklyXP = (): number => halaqa?.stats?.weeklyXP || 0;
  const getInviteCode = (): string => halaqa?.inviteCode || 'N/A';
  // ✅ AVANT: 'مدير'
  const getCreatorName = (): string => halaqa?.creator?.displayName || halaqa?.creator?.username || t('halaqaDetail.admin');
  // `creator` et les entrées de `admins` arrivent tantôt peuplés (objet),
  // tantôt sous forme d'identifiant brut selon l'endpoint appelé. Comparer
  // seulement `creator._id` faisait passer le créateur lui-même pour un simple
  // membre : il voyait « Réciter » au lieu de « Valider les récitations ».
  const sameId = (a: any, b: any): boolean => {
    const idOf = (v: any) => (typeof v === 'string' ? v : v?._id ?? v?.id);
    const left = idOf(a);
    const right = idOf(b);
    return Boolean(left && right && String(left) === String(right));
  };

  const currentUserId = user?._id || (user as any)?.id;
  const isCreatorUser = (): boolean => sameId(halaqa?.creator, currentUserId);
  const isAdminUser = (): boolean =>
    isCreatorUser() ||
    (halaqa?.admins || []).some((a: any) => sameId(a, currentUserId)) ||
    (halaqa?.members || []).some(
      (m: any) => sameId(m?.user ?? m?.userId ?? m, currentUserId) &&
        ['admin', 'moderator', 'teacher', 'creator'].includes(m?.role)
    );
  const isPublicHalaqa = (): boolean => halaqa?.settings?.isPublic !== false;
  const isChatAllowed = (): boolean => halaqa?.settings?.allowChat !== false;
  const getHalaqaActivityTypes = (): string[] => halaqa?.settings?.activityTypes || ['memorize', 'review'];
  
  /** L'icone suit le type ; un type inconnu retombe sur l'etoile de hizb,
   *  qui est neutre et reste dans le langage du produit. */
  const IconeDuType = (id: string) => ICONES_ACTIVITE[id];

  const getActivityTypeInfo = (id: string) => {
    return ACTIVITY_TYPES.find((t) => t.id === id) || {
      id,
      // ✅ AVANT: 'نشاط'
      name: t('halaqaDetail.activity'),
      xpReward: 0,
      description: '',
    };
  };

  // ✅ Navigate to Chat
  const navigateToChat = () => {
    if (!isChatAllowed()) {
      // ✅ AVANT: Alert.alert('تنبيه', 'المحادثة معطلة في هذه الحلقة')
      Alert.alert(t('common.notice'), t('halaqaDetail.errors.chatDisabled'));
      return;
    }
    console.log(`${LOG_PREFIX} 💬 navigateToChat()`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('HalaqaChat', { 
      halaqaId, 
      halaqaName: getName() 
    });
  };

  /**
   * Validation par l'enseignant : l'élève soumet un passage récité, le
   * responsable de la halaqa écoute et valide. C'est le cœur de
   * l'apprentissage traditionnel, et il manquait entièrement.
   */
  const navigateToRecitation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isAdminUser()) {
      navigation.navigate('TeacherReview', { halaqaId });
    } else {
      navigation.navigate('SubmitRecitation', { halaqaId, halaqaName: getName() });
    }
  };

  // Handlers
  const handleLeaveHalaqa = () => {
    if (isCreatorUser()) {
      // ✅ AVANT: Alert.alert('تنبيه', 'لا يمكنك مغادرة الحلقة لأنك المنشئ')
      Alert.alert(t('common.notice'), t('halaqaDetail.errors.creatorCannotLeave'));
      return;
    }
    // ✅ AVANT: Alert.alert('مغادرة الحلقة', 'هل أنت متأكد?', [...])
    Alert.alert(t('halaqaDetail.leaveHalaqa.title'), t('halaqaDetail.leaveHalaqa.confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        // ✅ AVANT: 'مغادرة'
        text: t('halaqaDetail.leaveHalaqa.leave'),
        style: 'destructive',
        onPress: async () => {
          try {
            console.log(`${LOG_PREFIX} 🚪 Leaving halaqa...`);
            await halaqaAPI.leaveHalaqa(halaqaId);
            // ✅ AVANT: Alert.alert('تم', 'تم مغادرة الحلقة')
            Alert.alert(t('common.done'), t('halaqaDetail.leaveHalaqa.success'));
            navigation.goBack();
          } catch (e: any) {
            // ✅ AVANT: Alert.alert('خطأ', e?.error || 'فشل')
            Alert.alert(t('common.error'), e?.error || t('common.failed'));
          }
        },
      },
    ]);
  };

  const handleDeleteHalaqa = () => {
    if (!isCreatorUser()) return;
    // ✅ AVANT: Alert.alert('حذف الحلقة', 'هل أنت متأكد؟ لا يمكن التراجع', [...])
    Alert.alert(t('halaqaDetail.deleteHalaqa.title'), t('halaqaDetail.deleteHalaqa.confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        // ✅ AVANT: 'حذف'
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            console.log(`${LOG_PREFIX} 🗑️ Deleting halaqa...`);
            await halaqaAPI.deleteHalaqa(halaqaId);
            // ✅ AVANT: Alert.alert('تم', 'تم حذف الحلقة')
            Alert.alert(t('common.done'), t('halaqaDetail.deleteHalaqa.success'));
            navigation.goBack();
          } catch (e: any) {
            Alert.alert(t('common.error'), e?.error || t('common.failed'));
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
      // ✅ AVANT: Alert.alert('تم النسخ ✅', code)
      Alert.alert(t('halaqaDetail.inviteCode.copied'), code);
    }
  };

  const shareInviteCode = async () => {
    try {
      await Share.share({
        // ✅ AVANT: `انضم إلى حلقة "${getName()}" في Salifz!\nرمز الدعوة: ${getInviteCode()}`
        message: t('halaqaDetail.inviteCode.shareMessage', { 
          name: getName(), 
          code: getInviteCode() 
        }),
      });
    } catch {
      copyInviteCode();
    }
  };

  const handleCreateActivity = async () => {
    if (!selectedActivityType || !activityTitle.trim()) {
      // ✅ AVANT: Alert.alert('خطأ', 'أكمل البيانات المطلوبة')
      Alert.alert(t('common.error'), t('halaqaDetail.createActivity.errors.fillRequired'));
      return;
    }
    try {
      setIsCreatingActivity(true);
      console.log(`${LOG_PREFIX} ➕ Creating activity: ${selectedActivityType}`);
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
      // ✅ AVANT: Alert.alert('تم ✅', 'تم إنشاء النشاط')
      Alert.alert(t('common.done'), t('halaqaDetail.createActivity.success'));
      console.log(`${LOG_PREFIX} ✅ Activity created`);
    } catch (e: any) {
      console.log(`${LOG_PREFIX} ❌ Create activity error:`, e);
      Alert.alert(t('common.error'), e?.error || t('common.failed'));
    } finally {
      setIsCreatingActivity(false);
    }
  };

  const handleCompleteActivity = async (activity: Activity) => {
    try {
      console.log(`${LOG_PREFIX} ✅ Completing activity: ${activity._id}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await halaqaAPI.completeActivity(halaqaId, activity._id);
      await loadHalaqaData();
      const xp = activity.xpReward || getActivityTypeInfo(activity.type).xpReward;
      // ✅ AVANT: Alert.alert('أحسنت! 🎉', `حصلت على ${xp} XP`)
      Alert.alert(t('halaqaDetail.completeActivity.title'), t('halaqaDetail.completeActivity.message', { xp }));
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.error || t('common.failed'));
    }
  };

  // ✅ Format time avec i18n
  const formatTime = (d?: string): string => {
    if (!d) return '';
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    // ✅ AVANT: 'الآن', 'منذ X دقيقة', etc.
    if (mins < 1) return t('halaqaDetail.time.now');
    if (mins < 60) return t('halaqaDetail.time.minutesAgo', { count: mins });
    if (hrs < 24) return t('halaqaDetail.time.hoursAgo', { count: hrs });
    if (days < 7) return t('halaqaDetail.time.daysAgo', { count: days });
    // La locale de l'interface, pas `ar-SA` en dur : un francophone voyait
    // une date au format arabe au milieu de son ecran.
    return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' }).format(new Date(d));
  };

  // ✅ FIXED: Separate render functions with proper types
  const renderActivity: ListRenderItem<Activity> = ({ item }) => {
    const actType = getActivityTypeInfo(item.type);
    const isCompleted = item.status === 'completed' || item.completedBy?.includes(user?._id || '');
    // ✅ AVANT: 'مدير'
    const creator = item.createdBy?.displayName || item.createdBy?.username || item.user?.displayName || t('halaqaDetail.admin');
    
    return (
      <View style={[styles.activityItem, isCompleted && styles.activityItemCompleted]}>
        <View style={[styles.activityIcon, isCompleted && styles.activityIconCompleted]}>
          {(() => {
            const Icone = IconeDuType(item.type);
            return Icone ? (
              <Icone size={20} color={isCompleted ? colors.primary : colors.accent} />
            ) : (
              <HizbStar size={18} quarters={isCompleted ? 4 : 0} color={colors.accent} />
            );
          })()}
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{item.title || actType.name}</Text>
          <Text style={styles.activityDescription} numberOfLines={2}>
            {item.description || actType.description}
          </Text>
          <View style={styles.activityMeta}>
            <Text style={styles.activityCreator} numberOfLines={1}>{t('halaqaDetail.createdBy')} {creator}</Text>
            <Text style={styles.activityTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.activityRight}>
          <View style={styles.activityXP}>
            <Text style={styles.activityXPText}>{'+' + (item.xpReward || actType.xpReward)}</Text>
            <Text style={styles.activityXPLabel}>{'XP'}</Text>
          </View>
          {!isCompleted ? (
            <TouchableOpacity accessible accessibilityRole="button" style={styles.completeButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} onPress={() => handleCompleteActivity(item)}>
              <Ionicons name="checkmark" size={16} color={colors.onDeep} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </View>
      </View>
    );
  };

  const renderMember: ListRenderItem<Member> = ({ item }) => {
    // ✅ AVANT: 'عضو'
    const name = item.user?.displayName || item.user?.username || t('halaqaDetail.member');
    const isAdmin = item.role === 'admin' || item.role === 'creator' || item.user?._id === halaqa?.creator?._id;
    
    return (
      <View style={styles.memberItem}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>{name.charAt(0).toUpperCase()}</Text>
          {/* La couronne faisait doublon avec la pastille « responsable »
              affichee juste a cote, et disait « roi » la ou il s'agit d'un
              enseignant. Un liseret dore suffit. */}
          {isAdmin && <View style={styles.memberAdminRing} />}
        </View>
        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <Text style={styles.memberName} numberOfLines={1}>{name}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>{t('halaqaDetail.admin')}</Text>
              </View>
            )}
          </View>
          <Text style={styles.memberStats}>
            {item.stats?.versesMemorized || 0} {t('halaqaDetail.stats.verses')} • {item.stats?.totalXP || 0} XP
          </Text>
        </View>
      </View>
    );
  };

  const renderLeaderboardItem: ListRenderItem<Member> = ({ item, index }) => {
    // ✅ AVANT: 'عضو'
    const name = item.user?.displayName || item.user?.username || t('halaqaDetail.member');
    const rank = index + 1;
    const rankStyle = rank === 1 ? styles.rank1 : rank === 2 ? styles.rank2 : rank === 3 ? styles.rank3 : {};
    // Les trois premiers portent une etoile pleine plutot qu'une medaille :
    // le rang reste ecrit, l'etoile marque le podium sans changer d'univers.
    const podium = rank <= 3;
    
    return (
      <View style={[styles.leaderboardItem, rankStyle]}>
        <View style={styles.rankContainer}>
          {podium && (
            <HizbStar
              size={26}
              quarters={4}
              color={rank === 1 ? fixedColors.gold : rank === 2 ? fixedColors.silver : fixedColors.bronze}
            />
          )}
          <Text style={[styles.rankText, podium && styles.rankTextPodium]}>{rank}</Text>
        </View>
        <View style={styles.leaderboardAvatar}>
          <Text style={styles.leaderboardAvatarText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.leaderboardInfo}>
          <Text style={styles.leaderboardName} numberOfLines={1}>{name}</Text>
          <Text style={styles.leaderboardActivities}>
            {item.stats?.activitiesCompleted || 0} {t('halaqaDetail.stats.activities')}
          </Text>
        </View>
        <View style={styles.leaderboardXP}>
          <Text style={styles.leaderboardXPValue}>{item.stats?.weeklyXP || item.stats?.totalXP || 0}</Text>
          <Text style={styles.leaderboardXPLabel}>{'XP'}</Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = (type: TabType) => {
    // ✅ AVANT: hardcoded
    const titres: Record<TabType, string> = {
      activities: t('halaqaDetail.empty.activities'),
      members: t('halaqaDetail.empty.members'),
      leaderboard: t('halaqaDetail.empty.leaderboard'),
    };

    return (
      <View style={styles.emptyState}>
        {/* L'arche remplace l'emoji : c'est la meme forme que sur le web pour
            le meme moment, et elle donne au vide une contenance. */}
        <MihrabArch width={78} color={colors.border} />
        <Text style={styles.emptyTitle}>{titres[type]}</Text>
        {type === 'activities' && isAdminUser() && (
          <TouchableOpacity accessible accessibilityRole="button" style={styles.createActivityButton} onPress={() => setShowCreateActivityModal(true)}>
            <Ionicons name="add" size={20} color={colors.onDeep} />
            <Text style={styles.createActivityButtonText}>{t('halaqaDetail.createActivity.button')}</Text>
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
          {/* Récitation : soumettre pour l'élève, file d'attente pour le responsable */}
          <TouchableOpacity
            accessible
            accessibilityRole="button"
            accessibilityLabel={
              isAdminUser() ? t('recitation.openReview') : t('recitation.openSubmit')
            }
            style={styles.addActivityButton}
            onPress={navigateToRecitation}
          >
            <Ionicons
              name={isAdminUser() ? 'headset' : 'mic'}
              size={24}
              color={colors.primary}
            />
            <Text style={styles.addActivityButtonText}>
              {isAdminUser() ? t('recitation.openReview') : t('recitation.openSubmit')}
            </Text>
          </TouchableOpacity>

          {isAdminUser() && (
            <TouchableOpacity accessible accessibilityRole="button" style={styles.addActivityButton} onPress={() => setShowCreateActivityModal(true)}>
              <Ionicons name="add-circle" size={24} color={colors.primary} />
              <Text style={styles.addActivityButtonText}>{t('halaqaDetail.createActivity.newButton')}</Text>
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
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
          <TouchableOpacity accessible accessibilityRole="button" style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.onDeep} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('halaqaDetail.title')}</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        {/* Le motif en filigrane : c'est le seul endroit de l'ecran ou la
            couleur porte, et il rattache la banniere aux cartes du web. */}
        <ZelligeField color={colors.onDeep} opacity={0.05} />
        <TouchableOpacity accessible accessibilityRole="button" style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.onDeep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{getName()}</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Header Content */}
        <View style={styles.headerContent}>
          <View style={styles.halaqaAvatar}>
            <Text style={styles.halaqaAvatarText}>{getName().charAt(0).toUpperCase()}</Text>
            {isAdminUser() && (
              <View style={styles.adminCrown}>
                <HizbStar size={16} quarters={4} color={fixedColors.gold} />
              </View>
            )}
          </View>
          <Text style={styles.halaqaName}>{getName()}</Text>
          <Text style={styles.halaqaDescription}>{getDescription()}</Text>
          
          <View style={styles.creatorRow}>
            <Text style={styles.creatorLabel}>{t('halaqaDetail.createdByLabel')}</Text>
            <Text style={styles.creatorName}>{getCreatorName()}</Text>
            <Text style={isPublicHalaqa() ? styles.publicBadge : styles.privateBadge}>
              {isPublicHalaqa() ? t('halaqaDetail.public') : t('halaqaDetail.private')}
            </Text>
          </View>

          {/* Activity Types */}
          <View style={styles.activityTypesRow}>
            {getHalaqaActivityTypes().slice(0, 6).map((id, i) => {
              const actType = getActivityTypeInfo(id);
              return (
                <View key={i} style={styles.activityTypeBadge}>
                  {(() => {
                    const Icone = IconeDuType(id);
                    return Icone ? <Icone size={13} color={colors.onDeep} /> : null;
                  })()}
                  <Text style={styles.activityTypeBadgeName}>{actType.name}</Text>
                </View>
              );
            })}
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getMemberCount()}</Text>
              <Text style={styles.statLabel}>{t('halaqaDetail.stats.member')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getTotalVerses()}</Text>
              <Text style={styles.statLabel}>{t('halaqaDetail.stats.verse')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getWeeklyXP()}</Text>
              <Text style={styles.statLabel}>{'XP'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{activities.length}</Text>
              <Text style={styles.statLabel}>{t('halaqaDetail.stats.activity')}</Text>
            </View>
          </View>

          {/* Invite Code */}
          <View style={styles.inviteSection}>
            <Text style={styles.inviteLabel}>{t('halaqaDetail.inviteCode.label')}</Text>
            <TouchableOpacity accessible accessibilityRole="button" onPress={copyInviteCode} style={styles.inviteCodeBox}>
              {/* Le code d'invitation est toujours latin : sans direction
                  forcee, il s'inverse a l'affichage en interface arabe — le
                  meme defaut que le web avait avant correction. */}
              <Text style={styles.inviteCode} accessibilityLanguage="en">
                {getInviteCode()}
              </Text>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.shareButton} onPress={shareInviteCode}>
              <Ionicons name="share-social-outline" size={18} color={colors.onDeep} />
              <Text style={styles.shareButtonText}>{t('common.share')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            {/* Chat Button - Always visible if allowed */}
            {isChatAllowed() && (
              <TouchableOpacity accessible accessibilityRole="button" style={styles.chatButton} onPress={navigateToChat}>
                <Ionicons name="chatbubbles-outline" size={18} color={colors.onDeep} />
                <Text style={styles.chatButtonText}>{t('halaqaDetail.chat')}</Text>
              </TouchableOpacity>
            )}
            
            {!isCreatorUser() && (
              <TouchableOpacity accessible accessibilityRole="button" style={styles.leaveButton} onPress={handleLeaveHalaqa}>
                <Ionicons name="exit-outline" size={18} color={colors.error} />
                <Text style={styles.leaveButtonText}>{t('halaqaDetail.leave')}</Text>
              </TouchableOpacity>
            )}
            {isCreatorUser() && (
              <TouchableOpacity accessible accessibilityRole="button" style={styles.deleteButton} onPress={handleDeleteHalaqa}>
                <Ionicons name="trash-outline" size={18} color={colors.error} />
                <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          {(['activities', 'members', 'leaderboard'] as TabType[]).map((tab) => (
            <TouchableOpacity accessible accessibilityRole="button"
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Ionicons
                name={tab === 'activities' ? 'pulse-outline' : tab === 'members' ? 'people-outline' : 'trophy-outline'}
                size={18}
                color={activeTab === tab ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab === 'activities' 
                  ? t('halaqaDetail.tabs.activities') 
                  : tab === 'members' 
                    ? t('halaqaDetail.tabs.members') 
                    : t('halaqaDetail.tabs.leaderboard')}
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
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('halaqaDetail.createActivity.modalTitle')}</Text>
                <TouchableOpacity accessible accessibilityRole="button" onPress={() => setShowCreateActivityModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>{t('halaqaDetail.createActivity.typeLabel')}</Text>
              <View style={styles.activityTypesGrid}>
                {ACTIVITY_TYPES.filter((actType) => getHalaqaActivityTypes().includes(actType.id)).map((type) => (
                  <TouchableOpacity accessible accessibilityRole="button"
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
                    {(() => {
                      const Icone = IconeDuType(type.id);
                      return Icone ? (
                        <Icone
                          size={22}
                          color={selectedActivityType === type.id ? colors.primary : colors.textSecondary}
                        />
                      ) : null;
                    })()}
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
                        <Ionicons name="checkmark" size={12} color={colors.onDeep} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.sectionTitle}>{t('halaqaDetail.createActivity.detailsLabel')}</Text>
              <TextInput
                style={styles.input}
                // ✅ AVANT: 'عنوان النشاط *'
                placeholder={t('halaqaDetail.createActivity.titlePlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={activityTitle}
                onChangeText={setActivityTitle}
                maxLength={100}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                // ✅ AVANT: 'وصف (اختياري)'
                placeholder={t('halaqaDetail.createActivity.descriptionPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={activityDescription}
                onChangeText={setActivityDescription}
                multiline
                maxLength={300}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity accessible accessibilityRole="button"
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCreateActivityModal(false);
                    setSelectedActivityType(null);
                    setActivityTitle('');
                    setActivityDescription('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity accessible accessibilityRole="button"
                  style={[styles.confirmButton, isCreatingActivity && styles.buttonDisabled]}
                  onPress={handleCreateActivity}
                  disabled={isCreatingActivity || !selectedActivityType || !activityTitle.trim()}
                >
                  {isCreatingActivity ? (
                    <ActivityIndicator size="small" color={colors.onDeep} />
                  ) : (
                    <>
                      <Ionicons name="add" size={20} color={colors.onDeep} />
                      <Text style={styles.confirmButtonText}>{t('common.create')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: c.onDeep, fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: c.textSecondary },
  scrollView: { flex: 1 },
  headerContent: { backgroundColor: c.surface, padding: 20, alignItems: 'center', borderBottomLeftRadius: 25, borderBottomRightRadius: 25, marginBottom: 10 },
  halaqaAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15, position: 'relative' },
  halaqaAvatarText: { color: c.onDeep, fontSize: 32, fontWeight: 'bold' },
  adminCrown: { position: 'absolute', top: -8, right: -8 },
  halaqaName: { fontSize: 24, fontWeight: 'bold', color: c.text, marginBottom: 5 },
  halaqaDescription: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 10 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 15 },
  creatorLabel: { fontSize: 13, color: c.textMuted },
  creatorName: { fontSize: 13, color: c.textSecondary, fontWeight: '500' },
  publicBadge: { fontSize: 12, color: c.primary, marginLeft: 10 },
  privateBadge: { fontSize: 12, color: c.warning, marginLeft: 10 },
  activityTypesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 15 },
  activityTypeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.backgroundAlt, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, gap: 4 },
  activityTypeBadgeName: { fontSize: 11, color: c.textSecondary },
  statsContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surfaceAlt, borderRadius: 15, padding: 15, marginBottom: 20, width: '100%' },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: '#ddd' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: c.primary },
  statLabel: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
  inviteSection: { alignItems: 'center', marginBottom: 15, width: '100%' },
  inviteLabel: { fontSize: 12, color: c.textMuted, marginBottom: 8 },
  inviteCodeBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.backgroundAlt, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginBottom: 10 },
  inviteCode: { fontSize: 22, fontWeight: 'bold', color: c.primary, letterSpacing: 3, marginRight: 10 },
  shareButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 8 },
  shareButtonText: { color: c.onDeep, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  chatButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 5 },
  chatButtonText: { color: c.onDeep, fontWeight: '600' },
  leaveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.errorSoft, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 5 },
  leaveButtonText: { color: c.error, fontWeight: '600' },
  deleteButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.errorSoft, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 5 },
  deleteButtonText: { color: c.error, fontWeight: '600' },
  tabsContainer: { flexDirection: 'row', backgroundColor: c.surface, marginHorizontal: 15, borderRadius: 15, padding: 5, marginBottom: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 5 },
  activeTab: { backgroundColor: c.primarySoft },
  tabText: { fontSize: 12, color: c.textMuted, fontWeight: '500' },
  activeTabText: { color: c.primary, fontWeight: '600' },
  tabContent: { flex: 1, minHeight: 300 },
  listContent: { padding: 15 },
  addActivityButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: c.surface, marginHorizontal: 15, marginBottom: 10, padding: 15, borderRadius: 12, borderWidth: 2, borderColor: c.primary, borderStyle: 'dashed', gap: 8 },
  addActivityButtonText: { color: c.primary, fontSize: 15, fontWeight: '600' },
  activityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, padding: 15, borderRadius: 12, marginBottom: 10 },
  activityItemCompleted: { opacity: 0.7 },
  activityIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: c.primarySoft, justifyContent: 'center', alignItems: 'center' },
  activityIconCompleted: { backgroundColor: c.backgroundAlt },
  activityContent: { flex: 1, marginLeft: 12 },
  activityTitle: { fontSize: 15, fontWeight: '600', color: c.text },
  activityDescription: { fontSize: 12, color: c.textSecondary, marginTop: 3 },
  activityMeta: { flexDirection: 'row', marginTop: 5, gap: 10, alignItems: 'center' },
  // flexShrink:1 : un nom de créateur long ne pousse plus l'heure hors carte.
  activityCreator: { fontSize: 10, color: c.textSecondary, flexShrink: 1 },
  activityTime: { fontSize: 10, color: c.textSecondary },
  activityRight: { alignItems: 'center', gap: 8 },
  activityXP: { alignItems: 'center', backgroundColor: c.primarySoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  activityXPText: { fontSize: 14, fontWeight: 'bold', color: c.primary },
  activityXPLabel: { fontSize: 9, color: c.primary },
  completeButton: { backgroundColor: c.primary, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  memberItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, padding: 15, borderRadius: 12, marginBottom: 10 },
  memberAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  memberAvatarText: { color: c.onDeep, fontSize: 20, fontWeight: 'bold' },
  memberAdminRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: c.accent,
  },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 16, fontWeight: '600', color: c.text, flexShrink: 1 },
  adminBadge: { backgroundColor: c.warningSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  adminBadgeText: { fontSize: 10, color: c.warning, fontWeight: '600' },
  memberStats: { fontSize: 12, color: c.textMuted, marginTop: 3 },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, padding: 15, borderRadius: 12, marginBottom: 10 },
  rank1: { borderWidth: 2, borderColor: fixedColors.gold },
  rank2: { borderWidth: 2, borderColor: fixedColors.silver },
  rank3: { borderWidth: 2, borderColor: fixedColors.bronze },
  rankContainer: { width: 35, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 18, fontWeight: 'bold', color: c.textSecondary },
  // Sur le podium, le chiffre se pose au centre de l'etoile : la couleur
  // du metal reste lisible derriere lui.
  rankTextPodium: { position: 'absolute', fontSize: 11, color: c.text },
  leaderboardAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  leaderboardAvatarText: { color: c.onDeep, fontSize: 18, fontWeight: 'bold' },
  leaderboardInfo: { flex: 1, marginLeft: 12 },
  leaderboardName: { fontSize: 16, fontWeight: '600', color: c.text, flexShrink: 1 },
  leaderboardActivities: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  leaderboardXP: { alignItems: 'center' },
  leaderboardXPValue: { fontSize: 18, fontWeight: 'bold', color: c.primary },
  leaderboardXPLabel: { fontSize: 10, color: c.textMuted },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: {
    marginTop: 14, fontSize: 18, fontWeight: 'bold', color: c.text, marginBottom: 15 },
  createActivityButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, gap: 8 },
  createActivityButtonText: { color: c.onDeep, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: c.surface, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: c.text },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginTop: 15, marginBottom: 10 },
  activityTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  activityTypeOption: { width: (width - 70) / 3, backgroundColor: c.background, borderRadius: 12, padding: 12, alignItems: 'center', position: 'relative' },
  activityTypeOptionSelected: { backgroundColor: c.primarySoft, borderWidth: 2, borderColor: c.primary },
  activityTypeOptionIcon: { fontSize: 24, marginBottom: 5 },
  activityTypeOptionName: { fontSize: 11, fontWeight: '600', color: c.textSecondary, textAlign: 'center' },
  activityTypeOptionNameSelected: { color: c.primary },
  activityTypeOptionXP: { fontSize: 9, color: c.textMuted, marginTop: 2 },
  selectedCheck: { position: 'absolute', top: 5, right: 5, backgroundColor: c.primary, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  input: { backgroundColor: c.background, borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 10, textAlign: isRTL() ? 'right' : 'left', color: c.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 30 },
  cancelButton: { flex: 1, paddingVertical: 15, borderRadius: 12, backgroundColor: c.background, alignItems: 'center' },
  cancelButtonText: { color: c.textSecondary, fontWeight: '600', fontSize: 16 },
  confirmButton: { flex: 2, flexDirection: 'row', paddingVertical: 15, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', gap: 5 },
  confirmButtonText: { color: c.onDeep, fontWeight: 'bold', fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
});