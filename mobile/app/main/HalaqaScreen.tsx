/**
 * Halaqa Screen - Salifz
 * ✅ COMPLETE: Full halaqa management system
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

const { width } = Dimensions.get('window');

// ✅ 12 Activity Types available for Halaqat
export const ACTIVITY_TYPES = [
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

  useFocusEffect(
    useCallback(() => {
      loadHalaqat();
    }, [])
  );

  const loadHalaqat = async () => {
    try {
      setIsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!isAuthenticated()) {
        console.log('[Halaqa] Not authenticated');
        setMyHalaqat([]);
        setPublicHalaqat([]);
        return;
      }
      
      console.log('[Halaqa] Loading halaqat...');
      
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
        console.log('[Halaqa] My halaqat loaded:', myData.length);
      } catch (e) {
        console.log('[Halaqa] Error loading my halaqat:', e);
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
        console.log('[Halaqa] Public halaqat loaded:', publicData.length);
      } catch (e) {
        console.log('[Halaqa] Error loading public halaqat:', e);
        setPublicHalaqat([]);
      }
      
    } catch (error) {
      console.error('[Halaqa] Load error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
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
      Alert.alert('خطأ', 'اسم الحلقة مطلوب');
      return;
    }
    
    if (selectedActivityTypes.length === 0) {
      Alert.alert('خطأ', 'اختر نوع نشاط واحد على الأقل');
      return;
    }

    try {
      setIsCreating(true);
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
      
      console.log('[Halaqa] Creating with data:', halaqaData);
      
      const response = await halaqaAPI.createHalaqa(halaqaData);
      
      setShowCreateModal(false);
      resetCreateForm();
      await loadHalaqat();
      
      const newHalaqa = response?.data || response?.halaqa || response;
      if (newHalaqa?._id) {
        Alert.alert('تم ✅', 'تم إنشاء الحلقة بنجاح', [
          {
            text: 'عرض الحلقة',
            onPress: () => navigation.navigate('HalaqaDetail', { 
              halaqaId: newHalaqa._id,
              halaqaData: newHalaqa 
            })
          },
          { text: 'حسناً' }
        ]);
      } else {
        Alert.alert('تم ✅', 'تم إنشاء الحلقة بنجاح');
      }
    } catch (error: any) {
      console.error('[Halaqa] Create error:', error);
      Alert.alert('خطأ', error?.error || error?.message || 'فشل في إنشاء الحلقة');
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
      Alert.alert('خطأ', 'رمز الدعوة مطلوب');
      return;
    }

    try {
      setIsJoining(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const response = await halaqaAPI.joinHalaqa(inviteCode.trim().toUpperCase());
      
      setInviteCode('');
      await loadHalaqat();
      
      const joinedHalaqa = response?.data || response?.halaqa || response;
      if (joinedHalaqa?._id) {
        Alert.alert('تم ✅', 'تم الانضمام للحلقة بنجاح', [
          {
            text: 'عرض الحلقة',
            onPress: () => {
              setActiveTab('my');
              navigation.navigate('HalaqaDetail', { 
                halaqaId: joinedHalaqa._id,
                halaqaData: joinedHalaqa 
              });
            }
          },
          { text: 'حسناً', onPress: () => setActiveTab('my') }
        ]);
      } else {
        Alert.alert('تم ✅', 'تم الانضمام للحلقة بنجاح');
        setActiveTab('my');
      }
    } catch (error: any) {
      console.error('[Halaqa] Join error:', error);
      Alert.alert('خطأ', error?.error || error?.message || 'رمز الدعوة غير صحيح');
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinPublicHalaqa = async (halaqa: Halaqa) => {
    Alert.alert(
      'انضمام للحلقة',
      `هل تريد الانضمام إلى "${halaqa.name}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'انضمام',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await halaqaAPI.joinById(halaqa._id);
              await loadHalaqat();
              
              Alert.alert('تم ✅', 'تم الانضمام للحلقة بنجاح', [
                {
                  text: 'عرض الحلقة',
                  onPress: () => {
                    setActiveTab('my');
                    navigation.navigate('HalaqaDetail', { 
                      halaqaId: halaqa._id,
                      halaqaData: halaqa 
                    });
                  }
                },
                { text: 'حسناً', onPress: () => setActiveTab('my') }
              ]);
            } catch (error: any) {
              Alert.alert('خطأ', error?.error || 'فشل في الانضمام');
            }
          }
        }
      ]
    );
  };

  const navigateToHalaqaDetail = (halaqa: Halaqa) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('HalaqaDetail', {
      halaqaId: halaqa._id,
      halaqaData: halaqa,
    });
  };

  // Safe getters
  const getName = (h: Halaqa): string => h?.name || 'حلقة';
  const getDescription = (h: Halaqa): string => h?.description || 'حلقة لحفظ القرآن';
  const getMemberCount = (h: Halaqa): number => h?.membersCount || h?.memberCount || h?.members?.length || 1;
  const getMaxMembers = (h: Halaqa): number => h?.maxMembers || 50;
  const getTotalVerses = (h: Halaqa): number => h?.stats?.totalVersesMemorized || 0;
  const getIsPublic = (h: Halaqa): boolean => h?.settings?.isPublic !== false;
  const getActivityTypes = (h: Halaqa): string[] => h?.settings?.activityTypes || ['memorize', 'review'];
  const isCreator = (h: Halaqa): boolean => h?.creator?._id === user?._id;

  const renderHalaqaCard = ({ item, isPublicList = false }: { item: Halaqa; isPublicList?: boolean }) => {
    const name = getName(item);
    const description = getDescription(item);
    const memberCount = getMemberCount(item);
    const maxMembersCount = getMaxMembers(item);
    const totalVerses = getTotalVerses(item);
    const isPublicHalaqa = getIsPublic(item);
    const activityTypes = getActivityTypes(item);
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
            {isAdmin && <Text style={styles.adminLabel}>{'مدير'}</Text>}
          </View>
          <Text style={styles.halaqaDescription} numberOfLines={1}>
            {description}
          </Text>
          
          <View style={styles.activityTypesPreview}>
            {activityTypes.slice(0, 4).map((typeId, index) => {
              const actType = ACTIVITY_TYPES.find(t => t.id === typeId);
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
            <Text style={styles.halaqaStat}>
              {'📖 '}{String(totalVerses)}{' آية'}
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
              <Text style={styles.joinButtonSmallText}>{'انضمام'}</Text>
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: TabType) => {
    const messages = {
      my: { icon: '🕌', title: 'لا توجد حلقات', subtitle: 'أنشئ حلقة جديدة أو انضم لحلقة موجودة' },
      public: { icon: '🌍', title: 'لا توجد حلقات عامة', subtitle: 'لا توجد حلقات عامة متاحة حالياً' },
      join: { icon: '🔗', title: 'انضم لحلقة', subtitle: 'أدخل رمز الدعوة للانضمام لحلقة خاصة' }
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
              <Text style={styles.emptyButtonText}>{'➕ إنشاء حلقة'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.emptyButton, styles.emptyButtonSecondary]} onPress={() => setActiveTab('join')}>
              <Text style={styles.emptyButtonTextSecondary}>{'🔗 انضمام'}</Text>
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
        <Text style={styles.joinTitle}>{'انضم لحلقة خاصة'}</Text>
        <Text style={styles.joinSubtitle}>{'أدخل رمز الدعوة الذي حصلت عليه من مدير الحلقة'}</Text>
        
        <TextInput
          style={styles.inviteCodeInput}
          placeholder="مثال: ABC123"
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
              <Text style={styles.joinButtonText}>{'انضمام'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.orDivider}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>{'أو'}</Text>
        <View style={styles.orLine} />
      </View>
      
      <TouchableOpacity style={styles.browsePublicButton} onPress={() => setActiveTab('public')}>
        <Text style={styles.browsePublicIcon}>{'🌍'}</Text>
        <Text style={styles.browsePublicText}>{'تصفح الحلقات العامة'}</Text>
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
              <Text style={styles.createModalTitle}>{'إنشاء حلقة جديدة'}</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionTitle}>{'المعلومات الأساسية'}</Text>
            
            <TextInput style={styles.input} placeholder="اسم الحلقة *" placeholderTextColor="#999" value={newHalaqaName} onChangeText={setNewHalaqaName} maxLength={50} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="وصف الحلقة (اختياري)" placeholderTextColor="#999" value={newHalaqaDescription} onChangeText={setNewHalaqaDescription} multiline maxLength={200} />
            
            <Text style={styles.sectionTitle}>{'الإعدادات'}</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{'حلقة عامة'}</Text>
                <Text style={styles.settingDescription}>{'يمكن لأي شخص العثور عليها والانضمام'}</Text>
              </View>
              <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: '#ddd', true: COLORS.primary + '50' }} thumbColor={isPublic ? COLORS.primary : '#999'} />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{'السماح بالمحادثة'}</Text>
                <Text style={styles.settingDescription}>{'تفعيل الدردشة بين الأعضاء'}</Text>
              </View>
              <Switch value={allowChat} onValueChange={setAllowChat} trackColor={{ false: '#ddd', true: COLORS.primary + '50' }} thumbColor={allowChat ? COLORS.primary : '#999'} />
            </View>
            
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{'المكالمات الصوتية'}</Text>
                <Text style={styles.settingDescription}>{'السماح بالمكالمات الصوتية'}</Text>
              </View>
              <Switch value={allowVoice} onValueChange={setAllowVoice} trackColor={{ false: '#ddd', true: COLORS.primary + '50' }} thumbColor={allowVoice ? COLORS.primary : '#999'} />
            </View>
            
            <View style={styles.numberInputsRow}>
              <View style={styles.numberInputContainer}>
                <Text style={styles.numberInputLabel}>{'الهدف اليومي (آيات)'}</Text>
                <TextInput style={styles.numberInput} value={dailyGoal} onChangeText={setDailyGoal} keyboardType="number-pad" maxLength={3} />
              </View>
              <View style={styles.numberInputContainer}>
                <Text style={styles.numberInputLabel}>{'الحد الأقصى للأعضاء'}</Text>
                <TextInput style={styles.numberInput} value={maxMembers} onChangeText={setMaxMembers} keyboardType="number-pad" maxLength={3} />
              </View>
            </View>
            
            <Text style={styles.sectionTitle}>{'أنواع الأنشطة'}</Text>
            <Text style={styles.sectionSubtitle}>{'اختر الأنشطة المتاحة في حلقتك (اختر واحداً على الأقل)'}</Text>
            
            <View style={styles.activityTypesGrid}>
              {ACTIVITY_TYPES.map((type) => (
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
                <Text style={styles.cancelButtonText}>{'إلغاء'}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.createButton, isCreating && styles.buttonDisabled]} onPress={handleCreateHalaqa} disabled={isCreating}>
                {isCreating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.createButtonText}>{'إنشاء'}</Text>
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
        <Text style={styles.headerTitle}>{'الحلقات'}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'my' && styles.activeTab]} onPress={() => setActiveTab('my')}>
          <Ionicons name="people" size={18} color={activeTab === 'my' ? COLORS.primary : '#999'} />
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>{'حلقاتي'}</Text>
          {myHalaqat.length > 0 && (
            <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{String(myHalaqat.length)}</Text></View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, activeTab === 'public' && styles.activeTab]} onPress={() => setActiveTab('public')}>
          <Ionicons name="globe" size={18} color={activeTab === 'public' ? COLORS.primary : '#999'} />
          <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>{'عامة'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.tab, activeTab === 'join' && styles.activeTab]} onPress={() => setActiveTab('join')}>
          <Ionicons name="enter" size={18} color={activeTab === 'join' ? COLORS.primary : '#999'} />
          <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>{'انضمام'}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{'جاري التحميل...'}</Text>
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