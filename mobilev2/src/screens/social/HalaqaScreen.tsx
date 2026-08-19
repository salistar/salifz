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
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';
import { HizbStar, MihrabArch } from '../../components/common/Ornements';
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

const LOG_PREFIX = '[HalaqaScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

const { width } = Dimensions.get('window');

/**
 * Les douze types d'activite.
 *
 * Chacun portait un emoji. Douze styles de dessin cote a cote donnent
 * l'impression d'un assemblage plutot que d'un produit, et le rendu change
 * d'un appareil a l'autre. La table ci-dessous est la meme que celle de
 * l'ecran de detail : une notion, une icone, partout.
 */
export const ICONES_ACTIVITE: Record<string, React.ComponentType<IconeProps>> = {
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

export const getActivityTypes = () => [
  { id: 'memorize', name: t('halaqa.activityTypes.memorize'), description: t('halaqa.activityTypes.memorizeDesc'), xpReward: 50 },
  { id: 'review', name: t('halaqa.activityTypes.review'), description: t('halaqa.activityTypes.reviewDesc'), xpReward: 30 },
  { id: 'tajweed', name: t('halaqa.activityTypes.tajweed'), description: t('halaqa.activityTypes.tajweedDesc'), xpReward: 40 },
  { id: 'tafseer', name: t('halaqa.activityTypes.tafseer'), description: t('halaqa.activityTypes.tafseerDesc'), xpReward: 35 },
  { id: 'recitation', name: t('halaqa.activityTypes.recitation'), description: t('halaqa.activityTypes.recitationDesc'), xpReward: 25 },
  { id: 'competition', name: t('halaqa.activityTypes.competition'), description: t('halaqa.activityTypes.competitionDesc'), xpReward: 100 },
  { id: 'lesson', name: t('halaqa.activityTypes.lesson'), description: t('halaqa.activityTypes.lessonDesc'), xpReward: 45 },
  { id: 'quiz', name: t('halaqa.activityTypes.quiz'), description: t('halaqa.activityTypes.quizDesc'), xpReward: 60 },
  { id: 'discussion', name: t('halaqa.activityTypes.discussion'), description: t('halaqa.activityTypes.discussionDesc'), xpReward: 20 },
  { id: 'challenge', name: t('halaqa.activityTypes.challenge'), description: t('halaqa.activityTypes.challengeDesc'), xpReward: 80 },
  { id: 'workshop', name: t('halaqa.activityTypes.workshop'), description: t('halaqa.activityTypes.workshopDesc'), xpReward: 55 },
  { id: 'achievement', name: t('halaqa.activityTypes.achievement'), description: t('halaqa.activityTypes.achievementDesc'), xpReward: 70 },
];

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
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

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
      Alert.alert(t('common.error'), t('halaqa.create.errors.nameRequired'));
      return;
    }

    if (selectedActivityTypes.length === 0) {
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
        Alert.alert(t('common.done'), t('halaqa.create.success'), [
          {
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
      Alert.alert(t('common.error'), error?.error || error?.message || t('halaqa.join.errors.invalidCode'));
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinPublicHalaqa = async (halaqa: Halaqa) => {
    Alert.alert(
      t('halaqa.join.title'),
      t('halaqa.join.confirmMessage', { name: halaqa.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
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
  const getName = (h: Halaqa): string => h?.name || t('halaqa.defaultName');
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
      <TouchableOpacity accessible accessibilityRole="button"
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
              <HizbStar size={12} quarters={4} color={fixedColors.gold} />
            </View>
          )}
        </View>

        <View style={styles.halaqaInfo}>
          <View style={styles.halaqaNameRow}>
            <Text style={styles.halaqaName} numberOfLines={1}>{name}</Text>
            {isAdmin && <Text style={styles.adminLabel}>{t('halaqa.admin')}</Text>}
          </View>
          <Text style={styles.halaqaDescription} numberOfLines={1}>
            {description}
          </Text>

          <View style={styles.activityTypesPreview}>
            {activityTypes.slice(0, 4).map((typeId, index) => {
              const Icone = ICONES_ACTIVITE[typeId];
              return Icone ? (
                <View key={index} style={styles.activityTypeIcon}>
                  <Icone size={14} color={colors.textMuted} />
                </View>
              ) : null;
            })}
            {activityTypes.length > 4 && (
              <Text style={styles.moreActivities}>{'+' + (activityTypes.length - 4)}</Text>
            )}
          </View>

          <View style={styles.halaqaStats}>
            <View style={styles.statLigne}>
              <IconeAmis size={13} color={colors.textSecondary} />
              <Text style={styles.halaqaStat}>
                {String(memberCount)}/{String(maxMembersCount)}
              </Text>
            </View>
            <View style={styles.statLigne}>
              <IconeMushaf size={13} color={colors.textSecondary} />
              <Text style={styles.halaqaStat}>
                {String(totalVerses)} {t('halaqa.stats.verse')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.halaqaRight}>
          {/* Publique ou privee : le cadenas dit la fermeture, son absence
              dit l'ouverture. Le globe ne disait rien de plus. */}
          <Ionicons
            name={isPublicHalaqa ? 'earth-outline' : 'lock-closed-outline'}
            size={16}
            color={colors.textMuted}
          />
          {isPublicList ? (
            <TouchableOpacity accessible accessibilityRole="button"
              style={styles.joinButtonSmall}
              onPress={() => handleJoinPublicHalaqa(item)}
            >
              <Text style={styles.joinButtonSmallText}>{t('halaqa.join.button')}</Text>
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = (type: TabType) => {
    const messages = {
      my: {
        title: t('halaqa.empty.my.title'),
        subtitle: t('halaqa.empty.my.subtitle')
      },
      public: {
        title: t('halaqa.empty.public.title'),
        subtitle: t('halaqa.empty.public.subtitle')
      },
      join: {
        title: t('halaqa.empty.join.title'),
        subtitle: t('halaqa.empty.join.subtitle')
      }
    };
    const msg = messages[type];

    return (
      <View style={styles.emptyState}>
        <MihrabArch width={74} color={colors.border} />
        <Text style={styles.emptyTitle}>{msg.title}</Text>
        <Text style={styles.emptyText}>{msg.subtitle}</Text>

        {type === 'my' && (
          <View style={styles.emptyActions}>
            <TouchableOpacity accessible accessibilityRole="button" style={styles.emptyButton} onPress={() => setShowCreateModal(true)}>
              <Text style={styles.emptyButtonText}>{t('halaqa.empty.createButton')}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessible accessibilityRole="button" style={[styles.emptyButton, styles.emptyButtonSecondary]} onPress={() => setActiveTab('join')}>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      />
    );
  };

  const renderPublicHalaqatTab = () => {
    if (publicHalaqat.length === 0) {
      return (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      />
    );
  };

  const renderJoinTab = () => (
    <ScrollView
      style={styles.joinScrollView}
      contentContainerStyle={styles.joinContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.joinCard}>
        {/* L'arche encadre l'entree dans un cercle : c'est la meme forme
            que sur le web au meme moment. */}
        <View style={styles.joinIcon}>
          <MihrabArch width={64} color={colors.primary} />
        </View>
        <Text style={styles.joinTitle}>{t('halaqa.join.privateTitle')}</Text>
        <Text style={styles.joinSubtitle}>{t('halaqa.join.privateSubtitle')}</Text>

        <TextInput
          style={styles.inviteCodeInput}
          placeholder={t('halaqa.join.codePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={inviteCode}
          onChangeText={(text) => setInviteCode(text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={10}
        />

        <TouchableOpacity accessible accessibilityRole="button"
          style={[styles.joinButton, isJoining && styles.buttonDisabled]}
          onPress={handleJoinByCode}
          disabled={isJoining || !inviteCode.trim()}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color={colors.onDeep} />
          ) : (
            <>
              <Ionicons name="enter-outline" size={20} color={colors.onDeep} />
              <Text style={styles.joinButtonText}>{t('halaqa.join.button')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.orDivider}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>{t('common.or')}</Text>
        <View style={styles.orLine} />
      </View>

      <TouchableOpacity accessible accessibilityRole="button" style={styles.browsePublicButton} onPress={() => setActiveTab('public')}>
        <IconeHalaqat size={20} color={colors.primary} />
        <Text style={styles.browsePublicText}>{t('halaqa.join.browsePublic')}</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.primary} />
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
              <Text style={styles.createModalTitle}>{t('halaqa.create.title')}</Text>
              <TouchableOpacity accessible accessibilityRole="button" onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>{t('halaqa.create.basicInfo')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('halaqa.create.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={newHalaqaName}
              onChangeText={setNewHalaqaName}
              maxLength={50}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('halaqa.create.descriptionPlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={newHalaqaDescription}
              onChangeText={setNewHalaqaDescription}
              multiline
              maxLength={200}
            />

            <Text style={styles.sectionTitle}>{t('halaqa.create.settings')}</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('halaqa.create.publicHalaqa')}</Text>
                <Text style={styles.settingDescription}>{t('halaqa.create.publicDescription')}</Text>
              </View>
              <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: '#ddd', true: colors.primary + '50' }} thumbColor={isPublic ? colors.primary : colors.textMuted} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('halaqa.create.allowChat')}</Text>
                <Text style={styles.settingDescription}>{t('halaqa.create.allowChatDescription')}</Text>
              </View>
              <Switch value={allowChat} onValueChange={setAllowChat} trackColor={{ false: '#ddd', true: colors.primary + '50' }} thumbColor={allowChat ? colors.primary : colors.textMuted} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>{t('halaqa.create.allowVoice')}</Text>
                <Text style={styles.settingDescription}>{t('halaqa.create.allowVoiceDescription')}</Text>
              </View>
              <Switch value={allowVoice} onValueChange={setAllowVoice} trackColor={{ false: '#ddd', true: colors.primary + '50' }} thumbColor={allowVoice ? colors.primary : colors.textMuted} />
            </View>

            <View style={styles.numberInputsRow}>
              <View style={styles.numberInputContainer}>
                <Text style={styles.numberInputLabel}>{t('halaqa.create.dailyGoal')}</Text>
                <TextInput style={styles.numberInput} value={dailyGoal} onChangeText={setDailyGoal} keyboardType="number-pad" maxLength={3} />
              </View>
              <View style={styles.numberInputContainer}>
                <Text style={styles.numberInputLabel}>{t('halaqa.create.maxMembers')}</Text>
                <TextInput style={styles.numberInput} value={maxMembers} onChangeText={setMaxMembers} keyboardType="number-pad" maxLength={3} />
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('halaqa.create.activityTypesTitle')}</Text>
            <Text style={styles.sectionSubtitle}>{t('halaqa.create.activityTypesSubtitle')}</Text>

            <View style={styles.activityTypesGrid}>
              {ACTIVITY_TYPES_LIST.map((type) => (
                <TouchableOpacity accessible accessibilityRole="button"
                  key={type.id}
                  style={[styles.activityTypeItem, selectedActivityTypes.includes(type.id) && styles.activityTypeItemSelected]}
                  onPress={() => toggleActivityType(type.id)}
                >
                  <View style={styles.activityTypeItemIcon}>
                    {(() => {
                      const Icone = ICONES_ACTIVITE[type.id];
                      return Icone ? (
                        <Icone
                          size={20}
                          color={selectedActivityTypes.includes(type.id) ? colors.primary : colors.textSecondary}
                        />
                      ) : null;
                    })()}
                  </View>
                  <Text style={[styles.activityTypeItemName, selectedActivityTypes.includes(type.id) && styles.activityTypeItemNameSelected]}>{type.name}</Text>
                  <Text style={styles.activityTypeItemXP}>{'+' + type.xpReward + ' XP'}</Text>
                  {selectedActivityTypes.includes(type.id) && (
                    <View style={styles.activityTypeCheck}>
                      <Ionicons name="checkmark" size={14} color={colors.onDeep} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.createModalButtons}>
              <TouchableOpacity accessible accessibilityRole="button" style={styles.cancelButton} onPress={() => setShowCreateModal(false)} disabled={isCreating}>
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity accessible accessibilityRole="button" style={[styles.createButton, isCreating && styles.buttonDisabled]} onPress={handleCreateHalaqa} disabled={isCreating}>
                {isCreating ? (
                  <ActivityIndicator size="small" color={colors.onDeep} />
                ) : (
                  <>
                    <Ionicons name="add" size={20} color={colors.onDeep} />
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
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.onDeep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('halaqa.title')}</Text>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.addButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={24} color={colors.onDeep} />
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <TouchableOpacity accessible accessibilityRole="button" style={[styles.tab, activeTab === 'my' && styles.activeTab]} onPress={() => setActiveTab('my')}>
          <Ionicons name="people" size={18} color={activeTab === 'my' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>{t('halaqa.tabs.my')}</Text>
          {myHalaqat.length > 0 && (
            <View style={styles.tabBadge}><Text style={styles.tabBadgeText}>{String(myHalaqat.length)}</Text></View>
          )}
        </TouchableOpacity>

        <TouchableOpacity accessible accessibilityRole="button" style={[styles.tab, activeTab === 'public' && styles.activeTab]} onPress={() => setActiveTab('public')}>
          <Ionicons name="globe" size={18} color={activeTab === 'public' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'public' && styles.activeTabText]}>{t('halaqa.tabs.public')}</Text>
        </TouchableOpacity>

        <TouchableOpacity accessible accessibilityRole="button" style={[styles.tab, activeTab === 'join' && styles.activeTab]} onPress={() => setActiveTab('join')}>
          <Ionicons name="enter" size={18} color={activeTab === 'join' ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'join' && styles.activeTabText]}>{t('halaqa.tabs.join')}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15, paddingHorizontal: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: c.onDeep, fontSize: 20, fontWeight: 'bold' },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  tabsContainer: { flexDirection: 'row', backgroundColor: c.surface, marginHorizontal: 15, marginTop: 15, borderRadius: 15, padding: 5 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 5 },
  activeTab: { backgroundColor: c.primarySoft },
  tabText: { fontSize: 13, color: c.textMuted, fontWeight: '500' },
  activeTabText: { color: c.primary, fontWeight: '600' },
  tabBadge: { backgroundColor: c.primary, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 3 },
  tabBadgeText: { color: c.onDeep, fontSize: 10, fontWeight: 'bold' },
  content: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: c.textSecondary },
  listContent: { padding: 15, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  halaqaCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, padding: 15, borderRadius: 15, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  halaqaAvatar: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: c.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12, position: 'relative' },
  halaqaAvatarText: { color: c.onDeep, fontSize: 22, fontWeight: 'bold' },
  adminBadgeSmall: { position: 'absolute', bottom: -2, right: -2, backgroundColor: c.surface, borderRadius: 10, padding: 2 },
  adminBadgeSmallText: { fontSize: 12 },
  halaqaInfo: { flex: 1 },
  halaqaNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  halaqaName: { fontSize: 17, fontWeight: 'bold', color: c.text, flex: 1, textAlign: 'right' },
  adminLabel: { fontSize: 10, color: c.warning, backgroundColor: c.warningSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, fontWeight: '600' },
  halaqaDescription: { fontSize: 13, color: c.textSecondary, marginTop: 2, textAlign: 'right' },
  activityTypesPreview: { flexDirection: 'row', marginTop: 5, gap: 3 },
  activityTypeIcon: { marginRight: 4 },
  moreActivities: { fontSize: 10, color: c.textMuted, marginLeft: 3 },
  halaqaStats: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15, marginTop: 5 },
  statLigne: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  halaqaStat: { fontSize: 12, color: c.textMuted },
  halaqaRight: { alignItems: 'center', marginLeft: 10 },
  halaqaBadgeText: { fontSize: 20, marginBottom: 5 },
  joinButtonSmall: { backgroundColor: c.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginTop: 5 },
  joinButtonSmallText: { color: c.onDeep, fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyTitle: {
    marginTop: 14, fontSize: 18, fontWeight: 'bold', color: c.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 20 },
  emptyActions: { flexDirection: 'row', gap: 10 },
  emptyButton: { backgroundColor: c.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  emptyButtonSecondary: { backgroundColor: c.surface, borderWidth: 2, borderColor: c.primary },
  emptyButtonText: { color: c.onDeep, fontWeight: '600' },
  emptyButtonTextSecondary: { color: c.primary, fontWeight: '600' },
  joinContainer: { padding: 20 },
  joinCard: { backgroundColor: c.surface, borderRadius: 20, padding: 25, alignItems: 'center' },
  joinIcon: { fontSize: 50, marginBottom: 15 },
  joinTitle: { fontSize: 20, fontWeight: 'bold', color: c.text, marginBottom: 8 },
  joinSubtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginBottom: 20 },
  inviteCodeInput: { backgroundColor: c.background, borderRadius: 15, padding: 15, fontSize: 22, fontWeight: 'bold', textAlign: 'center', letterSpacing: 4, width: '100%', marginBottom: 15, color: c.text },
  joinButton: { flexDirection: 'row', backgroundColor: c.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25, alignItems: 'center', gap: 8 },
  joinButtonText: { color: c.onDeep, fontSize: 16, fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.6 },
  orDivider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  orLine: { flex: 1, height: 1, backgroundColor: '#ddd' },
  orText: { marginHorizontal: 15, color: c.textMuted, fontSize: 14 },
  browsePublicButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, padding: 20, borderRadius: 15, gap: 10 },
  browsePublicIcon: { fontSize: 24 },
  browsePublicText: { flex: 1, fontSize: 16, fontWeight: '600', color: c.text },
  joinScrollView: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  createModalContent: { backgroundColor: c.surface, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '90%' },
  createModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  createModalTitle: { fontSize: 22, fontWeight: 'bold', color: c.text },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: c.text, marginTop: 20, marginBottom: 10 },
  sectionSubtitle: { fontSize: 12, color: c.textSecondary, marginBottom: 10 },
  input: { backgroundColor: c.background, borderRadius: 12, padding: 15, fontSize: 16, marginBottom: 10, textAlign: 'right', color: c.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.backgroundAlt },
  settingInfo: { flex: 1, marginRight: 10 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: c.text },
  settingDescription: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  numberInputsRow: { flexDirection: 'row', gap: 15, marginTop: 15 },
  numberInputContainer: { flex: 1 },
  numberInputLabel: { fontSize: 13, color: c.textSecondary, marginBottom: 5 },
  numberInput: { backgroundColor: c.background, borderRadius: 12, padding: 12, fontSize: 16, textAlign: 'center', color: c.text },
  activityTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  activityTypeItem: { width: (width - 70) / 3, backgroundColor: c.background, borderRadius: 12, padding: 12, alignItems: 'center', position: 'relative' },
  activityTypeItemSelected: { backgroundColor: c.primarySoft, borderWidth: 2, borderColor: c.primary },
  activityTypeItemIcon: { marginBottom: 5 },
  activityTypeItemName: { fontSize: 11, fontWeight: '600', color: c.textSecondary, textAlign: 'center' },
  activityTypeItemNameSelected: { color: c.primary },
  activityTypeItemXP: { fontSize: 9, color: c.textMuted, marginTop: 2 },
  activityTypeCheck: { position: 'absolute', top: 5, right: 5, backgroundColor: c.primary, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  createModalButtons: { flexDirection: 'row', gap: 10, marginTop: 10, marginBottom: 30 },
  cancelButton: { flex: 1, paddingVertical: 15, borderRadius: 12, backgroundColor: c.background, alignItems: 'center' },
  cancelButtonText: { color: c.textSecondary, fontWeight: '600', fontSize: 16 },
  createButton: { flex: 2, flexDirection: 'row', paddingVertical: 15, borderRadius: 12, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', gap: 5 },
  createButtonText: { color: c.onDeep, fontWeight: 'bold', fontSize: 16 },
});