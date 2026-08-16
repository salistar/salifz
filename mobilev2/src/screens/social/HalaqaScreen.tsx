/**
 * ============================================
 * 📱 HalaqaScreen.tsx - Salifz
 * ============================================
 * ✅ COMPLETE: Full halaqa management system
 * ✅ CONVERTED: i18n integration
 * ✅ FEATURES:
 *    - 3 tabs: My Halaqat (admin), Public Halaqat, Join by Code
 *    - Create halaqa with activity types
 *    - Navigate to HalaqaDetail
 *    - Join public halaqat directly
 *    - Join private halaqat with invite code
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { halaqaAPI, isAuthenticated } from '../../services/api';
import { useAuthStore } from '../../stores';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const LOG_PREFIX = '[HalaqaScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

const { width } = Dimensions.get('window');

// ✅ 12 Activity Types available for Halaqat - Fonction dynamique pour i18n
export const getActivityTypes = () => [
  { id: 'memorize', name: t('halaqa.activityTypes.memorize'), icon: '📖', description: t('halaqa.activityTypes.memorizeDesc'), xpReward: 50 },
  { id: 'review', name: t('halaqa.activityTypes.review'), icon: '🔄', description: t('halaqa.activityTypes.reviewDesc'), xpReward: 30 },
  { id: 'tajweed', name: t('halaqa.activityTypes.tajweed'), icon: '🎯', description: t('halaqa.activityTypes.tajweedDesc'), xpReward: 40 },
  { id: 'tafseer', name: t('halaqa.activityTypes.tafseer'), icon: '📚', description: t('halaqa.activityTypes.tafseerDesc'), xpReward: 35 },
  { id: 'recitation', name: t('halaqa.activityTypes.recitation'), icon: '🎙️', description: t('halaqa.activityTypes.recitationDesc'), xpReward: 25 },
  { id: 'competition', name: t('halaqa.activityTypes.competition'), icon: '🏆', description: t('halaqa.activityTypes.competitionDesc'), xpReward: 100 },
  { id: 'lesson', name: t('halaqa.activityTypes.lesson'), icon: '📝', description: t('halaqa.activityTypes.lessonDesc'), xpReward: 45 },
  { id: 'quiz', name: t('halaqa.activityTypes.quiz'), icon: '❓', description: t('halaqa.activityTypes.quizDesc'), xpReward: 60 },
  { id: 'discussion', name: t('halaqa.activityTypes.discussion'), icon: '💬', description: t('halaqa.activityTypes.discussionDesc'), xpReward: 20 },
  { id: 'challenge', name: t('halaqa.activityTypes.challenge'), icon: '⚡', description: t('halaqa.activityTypes.challengeDesc'), xpReward: 80 },
  { id: 'workshop', name: t('halaqa.activityTypes.workshop'), icon: '🛠️', description: t('halaqa.activityTypes.workshopDesc'), xpReward: 55 },
  { id: 'achievement', name: t('halaqa.activityTypes.achievement'), icon: '🏅', description: t('halaqa.activityTypes.achievementDesc'), xpReward: 70 },
];

// ✅ Export pour compatibilité (appelé dynamiquement)
export const ACTIVITY_TYPES = getActivityTypes();

interface Halaqa {
  _id: string;
  name: string;
  description?: string;
  memberCount?: number;
  membersCount?: number;
  maxMembers?: number;
  creator?: {
    _id: string;
    username?: string;
    displayName?: string;
  };
  settings?: {
    isPublic?: boolean;
    dailyGoal?: number;
    allowChat?: boolean;
    allowVoice?: boolean;
    activityTypes?: string[];
  };
  stats?: {
    totalVersesMemorized?: number;
    weeklyXP?: number;
    totalXP?: number;
    activitiesCount?: number;
  };
  inviteCode?: string;
  members?: any[];
  isAdmin?: boolean;
  isMember?: boolean;
}

type TabType = 'my' | 'public' | 'join';

export default function HalaqaScreen({ navigation }: any) {
  console.log(`${LOG_PREFIX} 🚀 Component rendering`);
  
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [myHalaqat, setMyHalaqat] = useState<Halaqa[]>([]);
  const [publicHalaqat, setPublicHalaqat] = useState<Halaqa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  
  // Create form
  const [newHalaqaName, setNewHalaqaName] = useState('');
  const [newHalaqaDescription, setNewHalaqaDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowChat, setAllowChat] = useState(true);
  const [allowVoice, setAllowVoice] = useState(false);
  const [dailyGoal, setDailyGoal] = useState('5');
  const [maxMembers, setMaxMembers] = useState('50');
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>([
    'memorize', 'review', 'tajweed', 'recitation', 'quiz'
  ]);
  
  // Join form
  const [inviteCode, setInviteCode] = useState('');

  // ✅ Récupérer les types d'activités avec i18n
  const ACTIVITY_TYPES_LIST = getActivityTypes();

  useFocusEffect(
    useCallback(() => {
      console.log(`${LOG_PREFIX} ⚡ useFocusEffect`);
      loadHalaqat();
    }, [])
  );

  const loadHalaqat = async () => {
    console.log(`${LOG_PREFIX} 📥 loadHalaqat()`);
    
    try {
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!isAuthenticated()) {
        console.log(`${LOG_PREFIX} ⚠️ Not authenticated`);
        setMyHalaqat([]);
        setPublicHalaqat([]);
        return;
      }
      
      // Load my halaqat
      try {
        const myResponse = await halaqaAPI.getHalaqat();
        let myData: Halaqa[] = [];
        if (myResponse?.data && Array.isArray(myResponse.data)) {
          myData = myResponse.data;
        } else if (myResponse?.halaqat && Array.isArray(myResponse.halaqat)) {
          myData = myResponse.halaqat;
        } else if (Array.isArray(myResponse)) {
          myData = myResponse;
        }
        
        myData = myData.map(h => ({
          ...h,
          isAdmin: h.creator?._id === user?._id,
          isMember: true
        }));
        
        setMyHalaqat(myData);
        console.log(`${LOG_PREFIX} ✅ My halaqat loaded: ${myData.length}`);
      } catch (e) {
        console.log(`${LOG_PREFIX} ❌ Error loading my halaqat:`, e);
        setMyHalaqat([]);
      }
      
      // Load public halaqat
      try {
        const publicResponse = await halaqaAPI.discoverHalaqat();
        let publicData: Halaqa[] = [];
        if (publicResponse?.data && Array.isArray(publicResponse.data)) {
          publicData = publicResponse.data;
        } else if (publicResponse?.halaqat && Array.isArray(publicResponse.halaqat)) {
          publicData = publicResponse.halaqat;
        } else if (Array.isArray(publicResponse)) {
          publicData = publicResponse;
        }
        
        const myIds = myHalaqat.map(h => h._id);
        publicData = publicData.filter(h => !myIds.includes(h._id));
        
        setPublicHalaqat(publicData);
        console.log(`${LOG_PREFIX} ✅ Public halaqat loaded: ${publicData.length}`);
      } catch (e) {
        console.log(`${LOG_PREFIX} ❌ Error loading public halaqat:`, e);
        setPublicHalaqat([]);
      }
      
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Load error:`, error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    console.log(`${LOG_PREFIX} 🔄 onRefresh()`);
    setRefreshing(true);
    await loadHalaqat();
  };

  const toggleActivityType = (typeId: string) => {
    setSelectedActivityTypes(prev => {
      if (prev.includes(typeId)) {
        return prev.filter(id => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  const handleCreateHalaqa = async () => {
    if (!newHalaqaName.trim()) {
      // ✅ AVANT: Alert.alert('خطأ', 'اسم الحلقة مطلوب')
      Alert.alert(t('common.error'), t('halaqa.create.errors.nameRequired'));
      return;
    }
    
    if (selectedActivityTypes.length === 0) {
      // ✅ AVANT: Alert.alert('خطأ', 'اختر نوع نشاط واحد على الأقل')
      Alert.alert(t('common.error'), t('halaqa.create.errors.selectActivity'));
      return;
    }

    try {
      setIsCreating(true);
      console.log(`${LOG_PREFIX} ➕ Creating halaqa: ${newHalaqaName}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const halaqaData = {
        name: newHalaqaName.trim(),
        description: newHalaqaDescription.trim(),
        settings: {
          isPublic,
          allowChat,
          allowVoice,
          dailyGoal: parseInt(dailyGoal) || 5,
          activityTypes: selectedActivityTypes,
        },
        maxMembers: parseInt(maxMembers) || 50,
      };
      
      const response = await halaqaAPI.createHalaqa(halaqaData);
      
      setShowCreateModal(false);
      resetCreateForm();
      await loadHalaqat();
      
      const newHalaqa = response?.data || response?.halaqa || response;
      if (newHalaqa?._id) {
        // ✅ AVANT: Alert.alert('تم ✅', 'تم إنشاء الحلقة بنجاح', [...])
        Alert.alert(t('common.done'), t('halaqa.create.success'), [
          {
            // ✅ AVANT: 'عرض الحلقة'
            text: t('halaqa.create.viewHalaqa'),
            onPress: () => navigation.navigate('HalaqaDetail', { 
              halaqaId: newHalaqa._id,
              halaqaData: newHalaqa 
            })
          },
          { text: t('common.ok') }
        ]);
      } else {
        Alert.alert(t('common.done'), t('halaqa.create.success'));
      }
      console.log(`${LOG_PREFIX} ✅ Halaqa created`);
    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Create error:`, error);
      // ✅ AVANT: Alert.alert('خطأ', error?.error || error?.message || 'فشل في إنشاء الحلقة')
      Alert.alert(t('common.error'), error?.error || error?.message || t('halaqa.create.errors.failed'));
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewHalaqaName('');
    setNewHalaqaDescription('');
    setIsPublic(true);
    setAllowChat(true);
    setAllowVoice(false);
    setDailyGoal('5');
    setMaxMembers('50');
    setSelectedActivityTypes(['memorize', 'review', 'tajweed', 'recitation', 'quiz']);
  };

  const handleJoinByCode = async () => {
    if (!inviteCode.trim()) {
      // ✅ AVANT: Alert.alert('خطأ', 'رمز الدعوة مطلوب')
      Alert.alert(t('common.error'), t('halaqa.join.errors.codeRequired'));
      return;
    }

    try {
      setIsJoining(true);
      console.log(`${LOG_PREFIX} 🔗 Joining by code: ${inviteCode}`);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await halaqaAPI.joinHalaqa(inviteCode.trim().toUpperCase());
      
      setInviteCode('');
      await loadHalaqat();
      
      const joinedHalaqa = response?.data || response?.halaqa || response;
      if (joinedHalaqa?._id) {
        // ✅ AVANT: Alert.alert('تم ✅', 'تم الانضمام للحلقة بنجاح', [...])
        Alert.alert(t('common.done'), t('halaqa.join.success'), [
          {
            text: t('halaqa.create.viewHalaqa'),
            onPress: () => {
              setActiveTab('my');
              navigation.navigate('HalaqaDetail', { 
                halaqaId: joinedHalaqa._id,
                halaqaData: joinedHalaqa 
              });
            }
          },
          { text: t('common.ok'), onPress: () => setActiveTab('my') }
        ]);
      } else {
        Alert.alert(t('common.done'), t('halaqa.join.success'));
        setActiveTab('my');
      }
      console.log(`${LOG_PREFIX} ✅ Joined halaqa`);
    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Join error:`, error);
      // ✅ AVANT: Alert.alert('خطأ', error?.error || error?.message || 'رمز الدعوة غير صحيح')
      Alert.alert(t('common.error'), error?.error || error?.message || t('halaqa.join.errors.invalidCode'));
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinPublicHalaqa = async (halaqa: Halaqa) => {
    // ✅ AVANT: Alert.alert('انضمام للحلقة', `هل تريد الانضمام إلى "${halaqa.name}"؟`, [...])
    Alert.alert(
      t('halaqa.join.title'),
      t('halaqa.join.confirmMessage', { name: halaqa.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          // ✅ AVANT: 'انضمام'
          text: t('halaqa.join.button'),
          onPress: async () => {
            try {
              console.log(`${LOG_PREFIX} 🔗 Joining public halaqa: ${halaqa._id}`);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await halaqaAPI.joinById(halaqa._id);
              await loadHalaqat();
              
              Alert.alert(t('common.done'), t('halaqa.join.success'), [
                {
                  text: t('halaqa.create.viewHalaqa'),
                  onPress: () => {
                    setActiveTab('my');
                    navigation.navigate('HalaqaDetail', { 
                      halaqaId: halaqa._id,
                      halaqaData: halaqa 
                    });
                  }
                },
                { text: t('common.ok'), onPress: () => setActiveTab('my') }
              ]);
              console.log(`${LOG_PREFIX} ✅ Joined public halaqa`);
            } catch (error: any) {
              // ✅ AVANT: Alert.alert('خطأ', error?.error || 'فشل في الانضمام')
              Alert.alert(t('common.error'), error?.error || t('halaqa.join.errors.failed'));
            }
          }
        }
      ]
    );
  };

  const navigateToHalaqaDetail = (halaqa: Halaqa) => {
    console.log(`${LOG_PREFIX} 📍 Navigate to detail: ${halaqa._id}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('HalaqaDetail', {
      halaqaId: halaqa._id,
      halaqaData: halaqa,
    });
  };

  // Safe getters
  // ✅ AVANT: 'حلقة'
  const getName = (h: Halaqa): string => h?.name || t('halaqa.defaultName');
  // ✅ AVANT: 'حلقة لحفظ القرآن'
  const getDescription = (h: Halaqa): string => h?.description || t('halaqa.defaultDescription');
  const getMemberCount = (h: Halaqa): number => h?.membersCount || h?.memberCount || h?.members?.length || 1;
  const getMaxMembers = (h: Halaqa): number => h?.maxMembers || 50;
  const getTotalVerses = (h: Halaqa): number => h?.stats?.totalVersesMemorized || 0;
  const getIsPublic = (h: Halaqa): boolean => h?.settings?.isPublic !== false;
  const getHalaqaActivityTypes = (h: Halaqa): string[] => h?.settings?.activityTypes || ['memorize', 'review'];
  const isCreator = (h: Halaqa): boolean => h?.creator?._id === user?._id;

  const renderHalaqaCard = ({ item, isPublicList = false }: { item: Halaqa; isPublicList?: boolean }) => {
    const name = getName(item);
    const description = getDescription(item);
    const memberCount = getMemberCount(item);
    const maxMembersCount = getMaxMembers(item);
    const totalVerses = getTotalVerses(item);
    const isPublicHalaqa = getIsPublic(item);
    const activityTypes = getHalaqaActivityTypes(item);
    const isAdmin = isCreator(item);

    return (
      <TouchableOpacity
        style={styles.halaqaCard}
        onPress={() => isPublicList ? handleJoinPublicHalaqa(item) : navigateToHalaqaDetail(item)}
        activeOpacity={0.7}
      >
        <View style={styles.halaqaAvatar}>
          <Text style={styles.halaqaAvatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
          {isAdmin && (
            <View style={styles.adminBadgeSmall}>
              <Text style={styles.adminBadgeSmallText}>{'👑'}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.halaqaInfo}>
          <View style={styles.halaqaNameRow}>
            <Text style={styles.halaqaName} numberOfLines={1}>{name}</Text>
            {/* ✅ AVANT: 'مدير' */}
            {isAdmin && <Text style={styles.adminLabel}>{t('halaqa.admin')}</Text>}
          </View>
          <Text style={styles.halaqaDescription} numberOfLines={1}>
            {description}
          </Text>
          
          <View style={styles.activityTypesPreview}>
            {activityTypes.slice(0, 4).map((typeId, index) => {
              const actType = ACTIVITY_TYPES_LIST.find(t => t.id === typeId);
              return actType ? (
                <Text key={index} style={styles.activityTypeIcon}>{actType.icon}</Text>
              ) : null;
            })}
            {activityTypes.length > 4 && (
              <Text style={styles.moreActivities}>{'+' + (activityTypes.length - 4)}</Text>
            )}
          </View>
          
          <View style={styles.halaqaStats}>
            <Text style={styles.halaqaStat}>
              {'👥 '}{String(memberCount)}{'/'}{String(maxMembersCount)}
            </Text>
            {/* ✅ AVANT: 'آية' */}
            <Text style={styles.halaqaStat}>
              {'📖 '}{String(totalVerses)} {t('halaqa.stats.verse')}
            </Text>
          </View>
        </View>
        
        <View style={styles.halaqaRight}>
          <Text style={styles.halaqaBadgeText}>
            {isPublicHalaqa ? '🌍' : '🔒'}
          </Text>
          {isPublicList ? (
            <TouchableOpacity 
              style={styles.joinButtonSmall}
              onPress={() => handleJoinPublicHalaqa(item)}
            >
              {/* ✅ AVANT: 'انضمام' */}
              <Text style={styles.joinButtonSmallText}>{t('halaqa.join.button')}</Text>
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: TabType) => {
    // ✅ AVANT: Messages hardcodés
    const messages = {
      my: { 
        icon: '🕌', 
        title: t('halaqa.empty.my.title'), 
        subtitle: t('halaqa.empty.my.subtitle') 
      },
      public: { 
        icon: '🌍', 
        title: t('halaqa.empty.public.title'), 
        subtitle: t('halaqa.empty.public.subtitle') 
      },
      join: { 
        icon: '🔗', 
        title: t('halaqa.empty.join.title'), 
        subtitle: t('halaqa.empty.join.subtitle') 
      }
    };
    const msg = messages[type];

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>{msg.icon}</Text>
        <Text style={styles.emptyTitle}>{msg.title}</Text>
        <Text style={styles.emptyText}>{msg.subtitle}</Text>
        
        {type === 'my' && (
          <View style={styles.emptyActions}>
            <TouchableOpacity style={styles.emptyButton} onPress={() => setShowCreateModal(true)}>
              {/* ✅ AVANT: '➕ إنشاء حلقة' */}
              <Text style={styles.emptyButtonText}>{t('halaqa.empty.createButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.emptyButton, styles.emptyButtonSecondary]} onPress={() => setActiveTab('join')}>
              {/* ✅ AVANT: '🔗 انضمام' */}
              <Text style={styles.emptyButtonTextSecondary}>{t('halaqa.empty.joinButton')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderMyHalaqatTab = () => {
    const adminHalaqat = myHalaqat.filter(h => isCreator(h));
    const memberHalaqat = myHalaqat.filter(h => !isCreator(h));
    const sortedHalaqat = [...adminHalaqat, ...memberHalaqat];

    if (sortedHalaqat.length === 0) {
      return (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {renderEmptyState('my')}
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={sortedHalaqat}
        renderItem={({ item }) => renderHalaqaCard({ item, isPublicList: false })}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      />
    );
  };

  const renderPublicHalaqatTab = () => {
    if (publicHalaqat.length === 0) {
      return (
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
        >
          {renderEmptyState('public')}
        </ScrollView>
      );
    }

    return (
      <FlatList
        data={publicHalaqat}
        renderItem={({ item }) => renderHalaqaCard({ item, isPublicList: true })}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      />
    );
  };

  const renderJoinTab = () => (
    <ScrollView 
      style={styles.joinScrollView}
      contentContainerStyle={styles.joinContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.joinCard}>
        <Text style={styles.joinIcon}>{'🔗'}</Text>
        {/* ✅ AVANT: 'انضم لحلقة خاصة' */}
        <Text style={styles.joinTitle}>{t('halaqa.join.privateTitle')}</Text>
        {/* ✅ AVANT: 'أدخل رمز الدعوة الذي حصلت عليه من مدير الحلقة' */}
        <Text style={styles.joinSubtitle}>{t('halaqa.join.privateSubtitle')}</Text>
        
        <TextInput
          style={styles.inviteCodeInput}
          // ✅ AVANT: 'مثال: ABC123'
          placeholder={t('halaqa.join.codePlaceholder')}
          placeholderTextColor="#999"
          value={inviteCode}
          onChangeText={(text) => setInviteCode(text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={10}
        />
        
        <TouchableOpacity
          style={[styles.joinButton, isJoining && styles.buttonDisabled]}
          onPress={handleJoinByCode}
          disabled={isJoining || !inviteCode.trim()}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="enter-outline" size={20} color="#fff" />
              {/* ✅ AVANT: 'انضمام' */}
              <Text style={styles.joinButtonText}>{t('halaqa.join.button')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.orDivider}>
        <View style={styles.orLine} />
        {/* ✅ AVANT: 'أو' */}
        <Text style={styles.orText}>{t('common.or')}</Text>
        <View style={styles.orLine} />
      </View>
      
      <TouchableOpacity style={styles.browsePublicButton} onPress={() => setActiveTab('public')}>
        <Text style={styles.browsePublicIcon}>{'🌍'}</Text>
        {/* ✅ AVANT: 'تصفح الحلقات العامة' */}
        <Text style={styles.browsePublicText}>{t('halaqa.join.browsePublic')}</Text>
        <Ionicons name="arrow-forward" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'my': return renderMyHalaqatTab();
      case 'public': return renderPublicHalaqatTab();
      case 'join': return renderJoinTab();
      default: return null;
    }
  };

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.createModalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.createModalHeader}>
              {/* ✅ AVANT: 'إنشاء حلقة جديدة' */}
              <Text style={styles.createModalTitle}>{t('halaqa.create.title')}</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* ✅ AVANT: 'المعلومات الأساسية' */}
            <Text style={styles.sectionTitle}>{t('halaqa.create.basicInfo')}</Text>
            
            <TextInput 
              style={styles.input} 
              // ✅ AVANT: 'اسم الحلقة *'
              placeholder={t('halaqa.create.namePlaceholder')} 
              placeholderTextColor="#999" 
              value={newHalaqaName} 
              onChangeText={setNewHalaqaName} 
              maxLength={50} 
            />
            <TextInput 
              style={[styles.input, styles.textArea]} 
              // ✅ AVANT: 'وصف الحلقة (اختياري)'
              placeholder={t('halaqa.create.descriptionPlaceholder')} 
              placeholderTextColor="#999" 
              value={newHalaqaDescription} 
              onChangeText={setNewHalaqaDescription} 
              multiline 
              maxLength={200} 
            />
            
            {/* ✅ AVANT: 'الإعدادات' */}
            <Text style={styles.sectionTitle}>{t('halaqa.create.settings')}</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                {/* ✅ AVANT: 'حلقة عامة' */}
                <Text style={styles.settingLabel}>{t('halaqa.create.publicHalaqa')}</Text>
                {/* ✅ AVANT: 'يمكن لأي شخص العثور عليها والانضمام' */}
                <Text style={styles.settingDescription}>{t('halaqa.create.publicDescription')}</Text>
              </View>
              <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: '#ddd', true: COLORS.primary + '50' }} thumbColor={isPublic ? COLORS.primary : '#999'} />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                {/* ✅ AVANT: 'السماح بالمحادثة' */}
                <Text style={styles.settingLabel}>{t('halaqa.create.allowChat')}</Text>
                {/* ✅ AVANT: 'تفعيل الدردشة بين الأعضاء' */}
                <Text style={styles.settingDescription}>{t('halaqa.create.allowChatDescription')}</Text>
              </View>
              <Switch value={allowChat} onValueChange={setAllowChat} trackColor={{ false: '#ddd', true: COLORS.primary + '50' }} thumbColor={allowChat ? COLORS.primary : '#999'} />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                {/* ✅ AVANT: 'المكالمات الصوتية' */}
                <Text style={styles.settingLabel}>{t('halaqa.create.allowVoice')}</Text>
                {/* ✅ AVANT: 'السماح بالمكالمات الصوتية' */}
                <Text style={styles.settingDescription}>{t('halaqa.create.allowVoiceDescription')}</Text>
              </View>
              <Switch value={allowVoice} onValueChange={setAllowVoice} trackColor={{ false: '#ddd', true: COLORS.primary + '50' }} thumbColor={allowVoice ? COLORS.primary : '#999'} />
            </View>
            
            <View style={styles.numberInputsRow}>
              <View style={styles.numberInputContainer}>
                {/* ✅ AVANT: 'الهدف اليومي (آيات)' */}
                <Text style={styles.numberInputLabel}>{t('halaqa.create.dailyGoal')}</Text>
                <TextInput style={styles.numberInput} value={dailyGoal} onChangeText={setDailyGoal} keyboardType="number-pad" maxLength={3} />
              </View>
              <View style={styles.numberInputContainer}>
                {/* ✅ AVANT: 'الحد الأقصى للأعضاء' */}
                <Text style={styles.numberInputLabel}>{t('halaqa.create.maxMembers')}</Text>
                <TextInput style={styles.numberInput} value={maxMembers} onChangeText={setMaxMembers} keyboardType="number-pad" maxLength={3} />
              </View>
            </View>
            
            {/* ✅ AVANT: 'أنواع الأنشطة' */}
            <Text style={styles.sectionTitle}>{t('halaqa.create.activityTypesTitle')}</Text>
            {/* ✅ AVANT: 'اختر الأنشطة المتاحة في حلقتك (اختر واحداً على الأقل)' */}
            <Text style={styles.sectionSubtitle}>{t('halaqa.create.activityTypesSubtitle')}</Text>
            
            <View style={styles.activityTypesGrid}>
              {ACTIVITY_TYPES_LIST.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.activityTypeItem, selectedActivityTypes.includes(type.id) && styles.activityTypeItemSelected]}
                  onPress={() => toggleActivityType(type.id)}
                >
                  <Text style={styles.activityTypeItemIcon}>{type.icon}</Text>
                  <Text style={[styles.activityTypeItemName, selectedActivityTypes.includes(type.id) && styles.activityTypeItemNameSelected]}>{type.name}</Text>
                  <Text style={styles.activityTypeItemXP}>{'+' + type.xpReward + ' XP'}</Text>
                  {selectedActivityTypes.includes(type.id) && (
                    <View style={styles.activityTypeCheck}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.createModalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowCreateModal(false)} disabled={isCreating}>
                {/* ✅ AVANT: 'إلغاء' */}
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.createButton, isCreating && styles.buttonDisabled]} onPress={handleCreateHalaqa} disabled={isCreating}>
                {isCreating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add" size={20} color="#fff" />
                    {/* ✅ AVANT: 'إنشاء' */}
                    <Text style={styles.createButtonText}>{t('common.create')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        {/* ✅ AVANT: 'الحلقات' */}
        <Text style={styles.headerTitle}>{t('halaqa.title')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'my' && styles.activeTab]} onPress={() => setActiveTab('my')}>
          <Ionicons name="people" size={18} color={activeTab === 'my' ? COLORS.primary : '#999'} />
          {/* ✅ AVANT: 'حلقاتي' */}
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>{t('halaqa.tabs.my')}</Text>
          {myHalaqat.length > 0 && (
            <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{String(myHalaqat.length)}</Text></View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, activeTab === 'public' && styles.activeTab]} onPress={() => setActiveTab('public')}>
          <Ionicons name="globe" size={18} color={activeTab === 'public' ? COLORS.primary : '#999'} />
          {/* ✅ AVANT: 'عامة' */}
          <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>{t('halaqa.tabs.public')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, activeTab === 'join' && styles.activeTab]} onPress={() => setActiveTab('join')}>
          <Ionicons name="enter" size={18} color={activeTab === 'join' ? COLORS.primary : '#999'} />
          {/* ✅ AVANT: 'انضمام' */}
          <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>{t('halaqa.tabs.join')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          {/* ✅ AVANT: 'جاري التحميل...' */}
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {renderTabContent()}
        </View>
      )}

      {renderCreateModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 15, marginTop: 15, borderRadius: 15, padding: 5 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 5 },
  activeTab: { backgroundColor: '#E8F5E9' },
  tabText: { fontSize: 13, color: '#999', fontWeight: '500' },
  activeTabText: { color: COLORS.primary, fontWeight: '600' },
  tabBadge: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 3 },
  tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
  listContent: { padding: 15, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  halaqaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  halaqaAvatar: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  halaqaAvatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  adminBadgeSmall: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#fff', borderRadius: 10, padding: 2 },
  adminBadgeSmallText: { fontSize: 12 },
  halaqaInfo: { flex: 1 },
  halaqaNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  halaqaName: { fontSize: 17, fontWeight: 'bold', color: '#333', flex: 1, textAlign: 'right' },
  adminLabel: { fontSize: 10, color: '#FF9800', backgroundColor: '#FFF3E0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, fontWeight: '600' },
  halaqaDescription: { fontSize: 13, color: '#666', marginTop: 2, textAlign: 'right' },
  activityTypesPreview: { flexDirection: 'row', marginTop: 5, gap: 3 },
  activityTypeIcon: { fontSize: 14 },
  moreActivities: { fontSize: 10, color: '#999', marginLeft: 3 },
  halaqaStats: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 5 },
  halaqaStat: { fontSize: 12, color: '#999' },
  halaqaRight: { alignItems: 'center', marginLeft: 10 },
  halaqaBadgeText: { fontSize: 20, marginBottom: 5 },
  joinButtonSmall: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginTop: 5 },
  joinButtonSmallText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  emptyActions: { flexDirection: 'row', gap: 10 },
  emptyButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  emptyButtonSecondary: { backgroundColor: '#fff', borderWidth: 2, borderColor: COLORS.primary },
  emptyButtonText: { color: '#fff', fontWeight: '600' },
  emptyButtonTextSecondary: { color: COLORS.primary, fontWeight: '600' },
  joinContainer: { padding: 20 },
  joinCard: { backgroundColor: '#fff', borderRadius: 20, padding: 25, alignItems: 'center' },
  joinIcon: { fontSize: 50, marginBottom: 15 },
  joinTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  joinSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  inviteCodeInput: { backgroundColor: '#f5f5f5', borderRadius: 15, padding: 15, fontSize: 22, fontWeight: 'bold', textAlign: 'center', letterSpacing: 4, width: '100%', marginBottom: 15, color: '#333' },
  joinButton: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, alignItems: 'center', gap: 8 },
  joinButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.6 },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  orLine: { flex: 1, height: 1, backgroundColor: '#ddd' },
  orText: { marginHorizontal: 15, color: '#999', fontSize: 14 },
  browsePublicButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 15, gap: 10 },
  browsePublicIcon: { fontSize: 24 },
  browsePublicText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  joinScrollView: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  createModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
  createModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  createModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginTop: 20, marginBottom: 10 },
  sectionSubtitle: { fontSize: 12, color: '#666', marginBottom: 10 },
  input: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 10, textAlign: 'right', color: '#333' },
  textArea: { height: 80, textAlignVertical: 'top' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingInfo: { flex: 1, marginRight: 10 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#333' },
  settingDescription: { fontSize: 12, color: '#999', marginTop: 2 },
  numberInputsRow: { flexDirection: 'row', gap: 15, marginTop: 15 },
  numberInputContainer: { flex: 1 },
  numberInputLabel: { fontSize: 13, color: '#666', marginBottom: 5 },
  numberInput: { backgroundColor: '#f5f5f5', borderRadius: 12, padding: 12, fontSize: 16, textAlign: 'center', color: '#333' },
  activityTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  activityTypeItem: { width: (width - 70) / 3, backgroundColor: '#f5f5f5', borderRadius: 12, padding: 12, alignItems: 'center', position: 'relative' },
  activityTypeItemSelected: { backgroundColor: '#E8F5E9', borderWidth: 2, borderColor: COLORS.primary },
  activityTypeItemIcon: { fontSize: 24, marginBottom: 5 },
  activityTypeItemName: { fontSize: 11, fontWeight: '600', color: '#666', textAlign: 'center' },
  activityTypeItemNameSelected: { color: COLORS.primary },
  activityTypeItemXP: { fontSize: 9, color: '#999', marginTop: 2 },
  activityTypeCheck: { position: 'absolute', top: 5, right: 5, backgroundColor: COLORS.primary, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  createModalButtons: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 30 },
  cancelButton: { flex: 1, paddingVertical: 15, borderRadius: 12, backgroundColor: '#f5f5f5', alignItems: 'center' },
  cancelButtonText: { color: '#666', fontWeight: '600', fontSize: 16 },
  createButton: { flex: 2, flexDirection: 'row', paddingVertical: 15, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', gap: 5 },
  createButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});