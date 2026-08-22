/**
 * ============================================
 * 📱 FriendsScreen.tsx - Salifz
 * ============================================
 * ✅ COMPLETE: Friends list, requests, search with proper API integration
 * ✅ CONVERTED: i18n integration
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { socialAPI, chatAPI, avatarAPI } from '../../services/api';
import { t, isRTL } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors, fixedColors } from '../../contexts/ThemeContext';
import { HizbStar, MihrabArch, ZelligeField } from '../../components/common/Ornements';
import {
  IconeAmis,
  IconeNotifications,
  IconeRecherche,
  IconeSerie,
} from '../../components/common/Icones';

const LOG_PREFIX = '[FriendsScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

/**
 * Avatar — l'initiale du nom.
 *
 * L'ecran tirait un emoji humain dans une liste de dix selon l'index de
 * l'avatar enregistre : il attribuait a chaque personne un genre, un age et
 * une coiffe qu'elle n'avait pas choisis. L'initiale identifie sans rien
 * inventer, et c'est deja ce que fait le web.
 */
const Avatar = ({
  nom,
  userId,
  size = 50,
  isOnline = false,
}: {
  nom?: string;
  userId?: string;
  size?: number;
  isOnline?: boolean;
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);
  // 404 = pas de photo : on retombe sur l'initiale sans re-tenter à chaque rendu.
  const [photoAbsente, setPhotoAbsente] = useState(false);

  const initiale = (nom ?? '').trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {userId && !photoAbsente ? (
        <Image
          source={{ uri: avatarAPI.urlListe(userId) }}
          onError={() => setPhotoAbsente(true)}
          style={{ width: size, height: size, borderRadius: size / 2 }}
        />
      ) : (
        <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: colors.primary }}>
          {initiale}
        </Text>
      )}
      {isOnline && (
        <View style={[styles.onlineIndicator, {
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: size * 0.14,
          bottom: 0,
          right: 0
        }]} />
      )}
    </View>
  );
};

// League badge component
const LeagueBadge = ({ league }: { league?: string }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  // Les metaux restent fixes dans les deux themes : un bronze inverse n'est
  // plus reconnaissable comme du bronze. Seule la forme change — l'etoile de
  // hizb au lieu d'une medaille, pour rester dans le langage du produit.
  const metaux: Record<string, string> = {
    bronze: fixedColors.bronze,
    silver: fixedColors.silver,
    gold: fixedColors.gold,
    diamond: fixedColors.diamond,
    hafiz: fixedColors.gold,
  };
  const teinte = metaux[league || 'bronze'];
  return (
    <View style={styles.leagueBadge}>
      <HizbStar size={15} quarters={4} color={teinte} />
    </View>
  );
};

interface Friend {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  level?: number;
  currentStreak?: number;
  streaks?: { current: number };
  totalXP?: number;
  isOnline?: boolean;
  league?: string;
  country?: string;
}

interface FriendRequestUser {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  level?: number;
  currentStreak?: number;
}

interface FriendRequest {
  _id: string;
  from?: FriendRequestUser;
  username?: string;
  displayName?: string;
  avatar?: string;
  level?: number;
  currentStreak?: number;
}

interface SearchUser {
  _id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  level?: number;
  totalXP?: number;
  currentStreak?: number;
  isFriend?: boolean;
  requestSent?: boolean;
  requestReceived?: boolean;
}

export default function FriendsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering`);

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect - Component mounted`);
    loadData();
  }, []);

  const loadData = async () => {
    console.log(`${LOG_PREFIX} 📥 loadData() called`);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        socialAPI.getFriends().catch(e => {
          console.log(`${LOG_PREFIX} ⚠️ getFriends error:`, e);
          return { data: [], friends: [] };
        }),
        socialAPI.getRequests().catch(e => {
          console.log(`${LOG_PREFIX} ⚠️ getRequests error:`, e);
          return { data: { received: [] }, requests: [] };
        })
      ]);

      const friendsList = friendsRes?.data || friendsRes?.friends || friendsRes || [];
      console.log(`${LOG_PREFIX} ✅ Friends loaded: ${Array.isArray(friendsList) ? friendsList.length : 0}`);
      setFriends(Array.isArray(friendsList) ? friendsList : []);

      const requestsList = requestsRes?.data?.received || requestsRes?.requests || requestsRes?.received || [];
      console.log(`${LOG_PREFIX} ✅ Requests loaded: ${Array.isArray(requestsList) ? requestsList.length : 0}`);
      setRequests(Array.isArray(requestsList) ? requestsList : []);

    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ loadData error:`, error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log(`${LOG_PREFIX} 🔄 onRefresh()`);
    setRefreshing(true);
    loadData();
  }, []);

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      Alert.alert(t('common.notice'), t('friends.search.minChars'));
      return;
    }

    console.log(`${LOG_PREFIX} 🔍 handleSearch("${searchQuery}")`);
    setSearching(true);

    try {
      const response = await socialAPI.searchUsers(searchQuery);
      const users = response?.data || response?.users || response || [];
      console.log(`${LOG_PREFIX} ✅ Search results: ${Array.isArray(users) ? users.length : 0}`);
      setSearchResults(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Search error:`, error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: string, userName: string) => {
    console.log(`${LOG_PREFIX} 📤 handleSendRequest("${userId}")`);

    try {
      await socialAPI.sendRequest(userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t('common.done'),
        t('friends.alerts.requestSentTo', { name: userName })
      );

      setSearchResults(prev => prev.map(u =>
        u._id === userId ? { ...u, requestSent: true } : u
      ));

      console.log(`${LOG_PREFIX} ✅ Request sent to ${userName}`);
    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Send request error:`, error);
      const errorMsg = error?.error || error?.message || t('common.errorOccurred');
      Alert.alert(t('common.error'), errorMsg);
    }
  };

  const handleAcceptRequest = async (userId: string, userName: string) => {
    console.log(`${LOG_PREFIX} ✅ handleAcceptRequest("${userId}")`);

    try {
      await socialAPI.acceptRequest(userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        t('common.done'),
        t('friends.alerts.nowFriendsWith', { name: userName })
      );

      loadData();

      console.log(`${LOG_PREFIX} ✅ Request accepted from ${userName}`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Accept request error:`, error);
      Alert.alert(t('common.error'), t('friends.alerts.acceptError'));
    }
  };

  const handleRejectRequest = async (userId: string) => {
    console.log(`${LOG_PREFIX} ❌ handleRejectRequest("${userId}")`);

    try {
      await socialAPI.rejectRequest(userId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      setRequests(prev => prev.filter(r => r.from?._id !== userId && r._id !== userId));

      console.log(`${LOG_PREFIX} ✅ Request rejected`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Reject request error:`, error);
    }
  };

  const handleRemoveFriend = (userId: string, userName: string) => {
    Alert.alert(
      t('friends.alerts.removeFriendTitle'),
      t('friends.alerts.removeFriendConfirm', { name: userName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('friends.actions.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await socialAPI.removeFriend(userId);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setFriends(prev => prev.filter(f => f._id !== userId));
              console.log(`${LOG_PREFIX} ✅ Friend removed`);
            } catch (error) {
              console.error(`${LOG_PREFIX} ❌ Remove friend error:`, error);
            }
          }
        }
      ]
    );
  };

  const handleStartChat = async (userId: string) => {
    console.log(`${LOG_PREFIX} 💬 handleStartChat("${userId}")`);

    try {
      const response = await chatAPI.createConversation(userId);
      const conversationId = response?.data?._id || response?._id;

      if (conversationId) {
        navigation.navigate('Chat', { conversationId, recipientId: userId });
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Start chat error:`, error);
    }
  };

  const handleViewProfile = (userId: string) => {
    console.log(`${LOG_PREFIX} 👤 handleViewProfile("${userId}")`);
    navigation.navigate('UserProfile', { userId });
  };

  const tabs = [
    { id: 'friends' as const, labelKey: 'friends.tabs.friends', Icone: IconeAmis, count: friends.length },
    { id: 'requests' as const, labelKey: 'friends.tabs.requests', Icone: IconeNotifications, count: requests.length },
    { id: 'search' as const, labelKey: 'friends.tabs.search', Icone: IconeRecherche, count: undefined },
  ];

  // Render friend item
  const renderFriendItem = (friend: Friend) => (
    <TouchableOpacity accessible accessibilityRole="button"
      key={friend._id}
      style={styles.friendItem}
      onPress={() => handleViewProfile(friend._id)}
      onLongPress={() => handleRemoveFriend(friend._id, friend.displayName || friend.username)}
    >
      <Avatar
        nom={friend.displayName || friend.username}
        userId={friend._id}
        size={55}
        isOnline={friend.isOnline}
      />

      <View style={styles.friendInfo}>
        <View style={styles.friendNameRow}>
          <Text style={styles.friendName} numberOfLines={1}>
            {friend.displayName || friend.username}
          </Text>
          <LeagueBadge league={friend.league} />
        </View>
        <Text style={styles.friendLevel}>
          {t('friends.level', { level: friend.level || 1 })}
        </Text>
        <View style={styles.friendStats}>
          <View style={styles.statLigne}>
            <IconeSerie size={13} color={colors.warning} />
            <Text style={styles.friendStreak}>
              {friend.currentStreak || friend.streaks?.current || 0}
            </Text>
          </View>
          <View style={styles.statLigne}>
            <HizbStar size={12} quarters={4} color={colors.accent} />
            <Text style={styles.friendXP}>
              {(friend.totalXP || 0).toLocaleString()} XP
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity accessible accessibilityRole="button"
        style={styles.chatButton}
        onPress={() => handleStartChat(friend._id)}
      >
        <Ionicons name="chatbubble-outline" size={22} color={colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render request item
  const renderRequestItem = (request: FriendRequest) => {
    const userId = request.from?._id || request._id;
    const userName = request.from?.displayName || request.from?.username || request.displayName || request.username || t('friends.unknownUser');
    const userAvatar = request.from?.avatar || request.avatar;
    const userLevel = request.from?.level || request.level || 1;
    const userStreak = request.from?.currentStreak || request.currentStreak;

    return (
      // Cliquable comme la carte d'ami : on doit pouvoir consulter le profil
      // de quelqu'un AVANT d'accepter sa demande.
      <TouchableOpacity accessible accessibilityRole="button"
        key={request._id}
        style={styles.requestItem}
        onPress={() => handleViewProfile(userId)}
      >
        <Avatar nom={userName} userId={userId} size={55} />

        <View style={styles.friendInfo}>
          <Text style={styles.friendName} numberOfLines={1}>{userName}</Text>
          <Text style={styles.friendLevel}>
            {t('friends.level', { level: userLevel })}
          </Text>
          {userStreak ? (
            <View style={styles.statLigne}>
              <IconeSerie size={13} color={colors.warning} />
              {/* Même forme que la liste d'amis : le nombre seul — la clé
                  streakDays ajoutait « jours 🔥 », donc une seconde flamme. */}
              <Text style={styles.friendStreak}>{userStreak}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.requestActions}>
          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(userId, userName)}
          >
            <Text style={styles.acceptText}>{t('friends.actions.accept')}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.rejectButton}
            onPress={() => handleRejectRequest(userId)}
          >
            <Text style={styles.rejectText}>{t('friends.actions.reject')}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render search result item
  const renderSearchItem = (user: SearchUser) => {
    const isFriend = user.isFriend;
    const requestSent = user.requestSent;
    const requestReceived = user.requestReceived;

    return (
      <View key={user._id} style={styles.friendItem}>
        <Avatar nom={user.displayName || user.username} userId={user._id} size={55} />

        <View style={styles.friendInfo}>
          <Text style={styles.friendName} numberOfLines={1}>
            {user.displayName || user.username}
          </Text>
          <Text style={styles.friendLevel}>
            {t('friends.level', { level: user.level || 1 })}
          </Text>
          {user.currentStreak ? (
            <View style={styles.statLigne}>
              <IconeSerie size={13} color={colors.warning} />
              <Text style={styles.friendStreak}>{user.currentStreak}</Text>
            </View>
          ) : null}
        </View>

        {isFriend ? (
          <View style={styles.alreadyFriendBadge}>
            <Ionicons name="checkmark" size={14} color={colors.primary} />
            <Text style={styles.alreadyFriendText}>{t('friends.status.friend')}</Text>
          </View>
        ) : requestSent ? (
          <View style={styles.sentButton}>
            <Text style={styles.sentText}>{t('friends.status.sent')}</Text>
          </View>
        ) : requestReceived ? (
          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(user._id, user.displayName || user.username)}
          >
            <Text style={styles.acceptText}>{t('friends.actions.accept')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.addButton}
            onPress={() => handleSendRequest(user._id, user.displayName || user.username)}
          >
            <Ionicons name="person-add" size={18} color={colors.onDeep} />
            <Text style={styles.addButtonText}>{t('friends.actions.add')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Empty state component
  const EmptyState = ({ titleKey, subtitleKey, action }: {
    titleKey: string;
    subtitleKey?: string;
    action?: { labelKey: string; onPress: () => void };
  }) => (
    <View style={styles.emptyState}>
      {/* L'arche remplace l'emoji : elle donne au vide une contenance, et
          c'est la meme forme que sur le web pour le meme moment. */}
      <MihrabArch width={76} color={colors.border} />
      <Text style={styles.emptyTitle}>{t(titleKey)}</Text>
      {subtitleKey && <Text style={styles.emptySubtitle}>{t(subtitleKey)}</Text>}
      {action && (
        <TouchableOpacity accessible accessibilityRole="button" style={styles.emptyButton} onPress={action.onPress}>
          <Text style={styles.emptyButtonText}>{t(action.labelKey)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      {/* Le bandeau etait bleu alors que rien d'autre ne l'est dans le
          produit : il passe au vert de la marque, avec le motif en filigrane
          comme sur les autres ecrans sociaux. */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <ZelligeField color={colors.onDeep} opacity={0.05} />
        <TouchableOpacity accessible accessibilityRole="button"
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.onDeep} />
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <IconeAmis size={30} color={colors.onDeep} />
        </View>
        <Text style={styles.headerTitle}>{t('friends.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('friends.friendCount', { count: friends.length })}
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity accessible accessibilityRole="button"
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.id);
            }}
          >
            <tab.Icone
              size={19}
              color={activeTab === tab.id ? colors.primary : colors.textMuted}
            />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {t(tab.labelKey)}
            </Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={[styles.tabBadge, tab.id === 'requests' && styles.tabBadgeRed]}>
                <Text style={styles.tabBadgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <EmptyState
                titleKey="friends.empty.noFriendsTitle"
                subtitleKey="friends.empty.noFriendsSubtitle"
                action={{ labelKey: 'friends.empty.searchFriends', onPress: () => setActiveTab('search') }}
              />
            ) : (
              friends.map(renderFriendItem)
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <>
            {requests.length === 0 ? (
              <EmptyState
                titleKey="friends.empty.noRequestsTitle"
                subtitleKey="friends.empty.noRequestsSubtitle"
              />
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  {t('friends.incomingRequests', { count: requests.length })}
                </Text>
                {requests.map(renderRequestItem)}
              </>
            )}
          </>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <>
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('friends.search.placeholder')}
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity accessible accessibilityRole="button" onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity accessible accessibilityRole="button"
                style={[styles.searchButton, searching && styles.searchButtonDisabled]}
                onPress={handleSearch}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color={colors.onDeep} />
                ) : (
                  <Ionicons name="search" size={22} color={colors.onDeep} />
                )}
              </TouchableOpacity>
            </View>

            {searchResults.length === 0 ? (
              <EmptyState
                titleKey={searchQuery ? 'friends.empty.noResultsTitle' : 'friends.empty.searchTitle'}
                subtitleKey={searchQuery ? 'friends.empty.noResultsSubtitle' : 'friends.empty.searchSubtitle'}
              />
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  {t('friends.searchResults', { count: searchResults.length })}
                </Text>
                {searchResults.map(renderSearchItem)}
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: c.background,
  },
  loadingText: {
    marginTop: 10,
    color: c.textSecondary,
    fontSize: 14,
  },
  header: {
    paddingTop: 10,
    paddingBottom: 30,
    alignItems: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 15,
    padding: 5,
  },
  headerIcon: {
    marginBottom: 4,
  },
  headerTitle: {
    color: c.onDeep,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: c.surface,
    marginHorizontal: 20,
    marginTop: -15,
    borderRadius: 15,
    padding: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: c.primary,
  },
  tabIcon: {
    marginRight: 5,
  },
  tabLabel: {
    color: c.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  tabLabelActive: {
    color: c.onDeep,
  },
  tabBadge: {
    backgroundColor: c.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    paddingHorizontal: 5,
  },
  tabBadgeRed: {
    backgroundColor: c.error,
  },
  tabBadgeText: {
    color: c.onDeep,
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatar: {
    backgroundColor: c.infoSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: c.primary,
    borderWidth: 2,
    borderColor: c.surface,
  },
  friendInfo: {
    flex: 1,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: c.text,
    marginRight: 5,
  },
  leagueBadge: {
    marginLeft: 6,
  },
  friendLevel: {
    color: c.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  friendStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 5,
  },
  statLigne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  friendStreak: {
    color: fixedColors.streak,
    fontSize: 12,
    fontWeight: '600',
    marginRight: 10,
  },
  friendXP: {
    // Assorti à l'étoile de hizb dorée qui le précède (c'était du bleu).
    color: c.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.infoSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  requestActions: {
    flexDirection: 'row',
  },
  acceptButton: {
    backgroundColor: c.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  acceptText: {
    color: c.onDeep,
    fontWeight: 'bold',
    fontSize: 13,
  },
  rejectButton: {
    backgroundColor: c.errorSoft,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectText: {
    color: c.error,
    fontWeight: 'bold',
    fontSize: 13,
  },
  addButton: {
    backgroundColor: c.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: c.onDeep,
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 5,
  },
  sentButton: {
    backgroundColor: c.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sentText: {
    color: c.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  alreadyFriendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: c.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  alreadyFriendText: {
    color: c.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 15,
    paddingHorizontal: 15,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: c.text,
    // L'alignement suit la langue de l'interface : à droite en arabe,
    // à gauche en français/anglais (le champ était figé à droite).
    textAlign: isRTL() ? 'right' : 'left',
  },
  searchButton: {
    backgroundColor: c.primary,
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchButtonDisabled: {
    backgroundColor: c.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: c.text,
  },
  emptySubtitle: {
    color: c.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  emptyButton: {
    backgroundColor: c.primary,
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  emptyButtonText: {
    color: c.onDeep,
    fontWeight: 'bold',
    fontSize: 14,
  },
});