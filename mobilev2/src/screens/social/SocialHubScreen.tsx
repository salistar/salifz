/**
 * ============================================
 * 📱 SocialHubScreen.tsx - Salifz
 * ============================================
 * Hub central pour Chat, Halaqa, Friends
 * ✅ CONVERTED: i18n integration
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { chatAPI, halaqaAPI, socialAPI } from '../../services/api';
import { t, getLocale } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';
import { MihrabArch } from '../../components/common/Ornements';
import { IconeHalaqat, IconeAmis } from '../../components/common/Icones';

const LOG_PREFIX = '[SocialHubScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

export default function SocialHubScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering`);

  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [enTraitement, setEnTraitement] = useState<string | null>(null);

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect - Loading data`);
    loadData();
  }, []);

  const loadData = async () => {
    console.log(`${LOG_PREFIX} 📥 loadData()`);

    try {
      const [convosRes, halaqatRes, friendsRes, requestsRes] = await Promise.all([
        chatAPI.getConversations().catch(() => ({ data: [] })),
        halaqaAPI.getMyHalaqat().catch(() => ({ data: [] })),
        socialAPI.getFriends().catch(() => ({ data: [] })),
        socialAPI.getFriendRequests().catch(() => ({ data: [] })),
      ]);

      const convos = convosRes.data || convosRes || [];
      setConversations(Array.isArray(convos) ? convos.slice(0, 5) : []);
      setUnreadMessages(
        Array.isArray(convos)
          ? convos.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0)
          : 0
      );

      const hList = halaqatRes.data || halaqatRes || [];
      setHalaqat(Array.isArray(hList) ? hList : []);

      const fList = friendsRes.data?.friends || friendsRes.friends || friendsRes.data || [];
      setFriends(Array.isArray(fList) ? fList.slice(0, 10) : []);

      const rList = requestsRes.data?.requests || requestsRes.requests || requestsRes.data || [];
      setFriendRequests(Array.isArray(rList) ? rList : []);

      console.log(`${LOG_PREFIX} ✅ Data loaded - convos: ${convos.length}, halaqat: ${hList.length}, friends: ${fList.length}`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Load social data error:`, error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Acceptation d'une demande d'ami : on attend la réponse serveur AVANT de
  // retirer la carte (elle disparaissait même en cas d'échec), la promesse
  // est correctement gérée, et un double-tap est verrouillé.
  const handleAcceptRequest = async (request: any) => {
    const userId = request.from?._id || request._id;
    if (!userId || enTraitement) return;
    setEnTraitement(request._id);
    try {
      await socialAPI.acceptFriendRequest(userId);
      setFriendRequests((prev) => prev.filter((r) => r._id !== request._id));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadData();
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.error || e?.message || t('common.retry'));
    } finally {
      setEnTraitement(null);
    }
  };

  const onRefresh = () => {
    console.log(`${LOG_PREFIX} 🔄 onRefresh()`);
    setRefreshing(true);
    loadData();
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const locale = getLocale();
    const localeMap: Record<string, string> = {
      ar: 'ar-SA',
      fr: 'fr-FR',
      en: 'en-US',
    };

    if (days === 0) {
      return date.toLocaleTimeString(localeMap[locale] || 'fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return t('socialHub.time.yesterday');
    } else if (days < 7) {
      return t('socialHub.time.daysAgo', { count: days });
    } else {
      return date.toLocaleDateString(localeMap[locale] || 'fr-FR', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <Text style={styles.headerTitle}>{t('socialHub.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('socialHub.subtitle')}</Text>
      </LinearGradient>

      {isLoading ? (
        // Un seul indicateur au montage, au lieu de trois états vides
        // (« aucune conversation », « aucune halaqa »…) qui clignotaient
        // avant la première réponse du serveur.
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.quickAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('ConversationsList');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.infoSoft }]}>
              <IconeHalaqat size={26} color={colors.primary} />
              {unreadMessages > 0 && (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.quickActionLabel}>{t('socialHub.quickActions.conversations')}</Text>
          </TouchableOpacity>

          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.quickAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Halaqa');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primarySoft }]}>
              <IconeHalaqat size={26} color={colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{t('socialHub.quickActions.halaqat')}</Text>
          </TouchableOpacity>

          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.quickAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Friends');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.warningSoft }]}>
              <IconeAmis size={26} color={colors.primary} />
              {friendRequests.length > 0 && (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>{friendRequests.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.quickActionLabel}>{t('socialHub.quickActions.friends')}</Text>
          </TouchableOpacity>

          <TouchableOpacity accessible accessibilityRole="button"
            style={styles.quickAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // La route s'appelle 'Leaderboard' (écran de pile), pas
              // 'LeaderboardTab' : le raccourci ne faisait rien.
              navigation.navigate('Leaderboard');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.accentSoft }]}>
              <IconeAmis size={26} color={colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>{t('socialHub.quickActions.leaderboard')}</Text>
          </TouchableOpacity>
        </View>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('socialHub.sections.friendRequests')}</Text>
              <View style={styles.requestsBadge}>
                <Text style={styles.requestsBadgeText}>{friendRequests.length}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {friendRequests.map((request, index) => (
                <View key={request._id || index} style={styles.requestCard}>
                  <View style={styles.requestAvatar}>
                    <Text style={styles.requestAvatarText}>
                  {(request.from?.displayName || request.from?.username || '?')
                    .charAt(0)
                    .toUpperCase()}
                </Text>
                  </View>
                  <Text style={styles.requestName} numberOfLines={1}>
                    {request.from?.displayName || request.from?.username || t('socialHub.user')}
                  </Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity accessible accessibilityRole="button"
                      style={[styles.requestButton, styles.acceptButton]}
                      disabled={enTraitement === request._id}
                      onPress={() => handleAcceptRequest(request)}
                    >
                      {enTraitement === request._id ? (
                        <ActivityIndicator size="small" color={colors.onDeep} />
                      ) : (
                        <Text style={styles.acceptButtonText}>{t('socialHub.accept')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recent Conversations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('socialHub.sections.recentConversations')}</Text>
            <TouchableOpacity accessible accessibilityRole="button" onPress={() => navigation.navigate('ConversationsList')}>
              <Text style={styles.seeAll}>{t('socialHub.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {conversations.length > 0 ? (
            conversations.map((conv, index) => (
              <TouchableOpacity accessible accessibilityRole="button"
                key={conv._id || index}
                style={styles.conversationItem}
                onPress={() =>
                  navigation.navigate('Chat', {
                    conversationId: conv._id,
                    recipientId: conv.participants?.[0]?._id,
                  })
                }
              >
                <View style={styles.conversationAvatar}>
                  <Text style={styles.conversationAvatarText}>
                    {conv.type === 'group' ? '👥' : '👤'}
                  </Text>
                </View>
                <View style={styles.conversationInfo}>
                  <Text style={styles.conversationName} numberOfLines={1}>
                    {conv.type === 'group'
                      ? conv.name
                      : conv.participants?.[0]?.displayName ||
                        conv.participants?.[0]?.username ||
                        t('socialHub.conversation')}
                  </Text>
                  <Text style={styles.conversationLastMessage} numberOfLines={1}>
                    {conv.lastMessageText || t('socialHub.noMessages')}
                  </Text>
                </View>
                <View style={styles.conversationMeta}>
                  <Text style={styles.conversationTime}>
                    {formatTime(conv.lastMessageAt)}
                  </Text>
                  {conv.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{conv.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MihrabArch width={70} color={colors.border} />
              <Text style={styles.emptyText}>{t('socialHub.empty.conversations')}</Text>
              <TouchableOpacity accessible accessibilityRole="button"
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Friends')}
              >
                <Text style={styles.emptyButtonText}>{t('socialHub.startNewConversation')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* My Halaqat */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('socialHub.sections.myHalaqat')}</Text>
            <TouchableOpacity accessible accessibilityRole="button" onPress={() => navigation.navigate('Halaqa')}>
              <Text style={styles.seeAll}>{t('socialHub.seeAll')}</Text>
            </TouchableOpacity>
          </View>

          {halaqat.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {halaqat.map((halaqa, index) => (
                <TouchableOpacity accessible accessibilityRole="button"
                  key={halaqa._id || index}
                  style={styles.halaqaCard}
                  onPress={() => navigation.navigate('HalaqaDetail', { halaqaId: halaqa._id })}
                >
                  <View style={styles.halaqaIconContainer}>
                    <IconeHalaqat size={20} color={colors.primary} />
                  </View>
                  <Text style={styles.halaqaName} numberOfLines={1}>
                    {halaqa.name}
                  </Text>
                  <Text style={styles.halaqaMembers}>
                    {halaqa.membersCount || halaqa.participants?.length || 0} {t('socialHub.member')}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity accessible accessibilityRole="button"
                style={[styles.halaqaCard, styles.createHalaqaCard]}
                onPress={() => navigation.navigate('Halaqa')}
              >
                <View style={[styles.halaqaIconContainer, { backgroundColor: colors.border }]}>
                  <Ionicons name="add" size={28} color={colors.textSecondary} />
                </View>
                <Text style={styles.halaqaName}>{t('socialHub.joinOrCreate')}</Text>
                <Text style={styles.halaqaMembers}>{t('socialHub.newHalaqa')}</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <MihrabArch width={70} color={colors.border} />
              <Text style={styles.emptyText}>{t('socialHub.empty.halaqat')}</Text>
              <TouchableOpacity accessible accessibilityRole="button"
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Halaqa')}
              >
                <Text style={styles.emptyButtonText}>{t('socialHub.exploreHalaqat')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Online Friends */}
        {friends.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('socialHub.sections.friends')}</Text>
              <TouchableOpacity accessible accessibilityRole="button" onPress={() => navigation.navigate('Friends')}>
                <Text style={styles.seeAll}>
                  {t('socialHub.seeAllCount', { count: friends.length })}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {friends.map((friend, index) => (
                <TouchableOpacity accessible accessibilityRole="button"
                  key={friend._id || index}
                  style={styles.friendItem}
                  onPress={() => navigation.navigate('UserProfile', { userId: friend._id })}
                >
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>
                  {(friend.displayName || friend.username || '?').charAt(0).toUpperCase()}
                </Text>
                    {friend.isOnline && <View style={styles.onlineIndicator} />}
                  </View>
                  <Text style={styles.friendName} numberOfLines={1}>
                    {friend.displayName || friend.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      )}
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
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: c.onDeep,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  content: {
    padding: 15,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: c.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  quickActionEmoji: {
  },
  quickActionBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: c.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  quickActionBadgeText: {
    color: c.onDeep,
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActionLabel: {
    fontSize: 12,
    color: c.textSecondary,
    fontWeight: '600',
  },
  section: {
    backgroundColor: c.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: c.text,
  },
  seeAll: {
    color: c.primary,
    fontWeight: '600',
  },
  requestsBadge: {
    backgroundColor: c.error,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  requestsBadgeText: {
    color: c.onDeep,
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestCard: {
    backgroundColor: c.surfaceAlt,
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    width: 140,
    alignItems: 'center',
  },
  requestAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: c.infoSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  requestAvatarText: {
    fontSize: 24,
  },
  requestName: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  requestActions: {
    flexDirection: 'row',
  },
  requestButton: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 15,
  },
  acceptButton: {
    backgroundColor: c.primary,
  },
  acceptButtonText: {
    color: c.onDeep,
    fontWeight: '600',
    fontSize: 12,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.backgroundAlt,
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: c.infoSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationAvatarText: {
    fontSize: 24,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationName: {
    fontSize: 15,
    fontWeight: '600',
    color: c.text,
  },
  conversationLastMessage: {
    fontSize: 13,
    color: c.textMuted,
    marginTop: 3,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  conversationTime: {
    fontSize: 11,
    color: c.textMuted,
    marginBottom: 5,
  },
  unreadBadge: {
    backgroundColor: c.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: c.onDeep,
    fontSize: 11,
    fontWeight: 'bold',
  },
  halaqaCard: {
    backgroundColor: c.surfaceAlt,
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
  },
  createHalaqaCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: c.border,
    backgroundColor: 'transparent',
  },
  halaqaIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: c.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  halaqaIcon: {
  },
  halaqaName: {
    fontSize: 13,
    fontWeight: '600',
    color: c.text,
    textAlign: 'center',
  },
  halaqaMembers: {
    fontSize: 11,
    color: c.textMuted,
    marginTop: 4,
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 15,
    width: 70,
  },
  friendAvatar: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: c.infoSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  friendAvatarText: {
    fontSize: 26,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: c.primary,
    borderWidth: 2,
    borderColor: c.surface,
  },
  friendName: {
    fontSize: 12,
    color: c.textSecondary,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    color: c.textMuted,
    marginBottom: 15,
  },
  emptyButton: {
    backgroundColor: c.primary,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: c.onDeep,
    fontWeight: '600',
  },
});