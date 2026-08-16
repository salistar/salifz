/**
 * SocialHubScreen - Salifz
 * Hub central pour Chat, Halaqa, Friends
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { chatAPI, halaqaAPI, socialAPI } from '../../services/api';
import { COLORS } from '../../config';

export default function SocialHubScreen({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [halaqat, setHalaqat] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
    } catch (error) {
      console.error('Load social data error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'أمس';
    } else if (days < 7) {
      return `${days} أيام`;
    } else {
      return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.header}>
        <Text style={styles.headerTitle}>التواصل</Text>
        <Text style={styles.headerSubtitle}>تواصل مع أصدقائك وحلقاتك</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('ConversationsList');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Text style={styles.quickActionEmoji}>💬</Text>
              {unreadMessages > 0 && (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.quickActionLabel}>المحادثات</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Halaqa');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E9' }]}>
              <Text style={styles.quickActionEmoji}>🕌</Text>
            </View>
            <Text style={styles.quickActionLabel}>الحلقات</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('Friends');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFF3E0' }]}>
              <Text style={styles.quickActionEmoji}>👥</Text>
              {friendRequests.length > 0 && (
                <View style={styles.quickActionBadge}>
                  <Text style={styles.quickActionBadgeText}>{friendRequests.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.quickActionLabel}>الأصدقاء</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('LeaderboardTab');
            }}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#F3E5F5' }]}>
              <Text style={styles.quickActionEmoji}>🏆</Text>
            </View>
            <Text style={styles.quickActionLabel}>الترتيب</Text>
          </TouchableOpacity>
        </View>

        {/* Friend Requests */}
        {friendRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>📬 طلبات الصداقة</Text>
              <View style={styles.requestsBadge}>
                <Text style={styles.requestsBadgeText}>{friendRequests.length}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {friendRequests.map((request, index) => (
                <View key={request._id || index} style={styles.requestCard}>
                  <View style={styles.requestAvatar}>
                    <Text style={styles.requestAvatarText}>👤</Text>
                  </View>
                  <Text style={styles.requestName} numberOfLines={1}>
                    {request.from?.displayName || request.from?.username || 'مستخدم'}
                  </Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={[styles.requestButton, styles.acceptButton]}
                      onPress={() => {
                        socialAPI.acceptFriendRequest(request.from?._id || request._id);
                        setFriendRequests((prev) => prev.filter((r) => r._id !== request._id));
                      }}
                    >
                      <Text style={styles.acceptButtonText}>قبول</Text>
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
            <Text style={styles.sectionTitle}>💬 المحادثات الأخيرة</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ConversationsList')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          {conversations.length > 0 ? (
            conversations.map((conv, index) => (
              <TouchableOpacity
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
                        'محادثة'}
                  </Text>
                  <Text style={styles.conversationLastMessage} numberOfLines={1}>
                    {conv.lastMessageText || 'لا توجد رسائل'}
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
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>لا توجد محادثات بعد</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Friends')}
              >
                <Text style={styles.emptyButtonText}>ابدأ محادثة جديدة</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* My Halaqat */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🕌 حلقاتي</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Halaqa')}>
              <Text style={styles.seeAll}>عرض الكل</Text>
            </TouchableOpacity>
          </View>

          {halaqat.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {halaqat.map((halaqa, index) => (
                <TouchableOpacity
                  key={halaqa._id || index}
                  style={styles.halaqaCard}
                  onPress={() => navigation.navigate('HalaqaDetail', { halaqaId: halaqa._id })}
                >
                  <View style={styles.halaqaIconContainer}>
                    <Text style={styles.halaqaIcon}>🕌</Text>
                  </View>
                  <Text style={styles.halaqaName} numberOfLines={1}>
                    {halaqa.name}
                  </Text>
                  <Text style={styles.halaqaMembers}>
                    {halaqa.membersCount || halaqa.participants?.length || 0} عضو
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.halaqaCard, styles.createHalaqaCard]}
                onPress={() => navigation.navigate('Halaqa')}
              >
                <View style={[styles.halaqaIconContainer, { backgroundColor: '#E0E0E0' }]}>
                  <Ionicons name="add" size={28} color="#666" />
                </View>
                <Text style={styles.halaqaName}>انضم أو أنشئ</Text>
                <Text style={styles.halaqaMembers}>حلقة جديدة</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🕌</Text>
              <Text style={styles.emptyText}>لم تنضم لأي حلقة بعد</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => navigation.navigate('Halaqa')}
              >
                <Text style={styles.emptyButtonText}>استكشف الحلقات</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Online Friends */}
        {friends.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👥 الأصدقاء</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Friends')}>
                <Text style={styles.seeAll}>عرض الكل ({friends.length})</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {friends.map((friend, index) => (
                <TouchableOpacity
                  key={friend._id || index}
                  style={styles.friendItem}
                  onPress={() => navigation.navigate('UserProfile', { userId: friend._id })}
                >
                  <View style={styles.friendAvatar}>
                    <Text style={styles.friendAvatarText}>👤</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
    backgroundColor: '#fff',
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
    fontSize: 28,
  },
  quickActionBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  quickActionBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
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
    color: '#333',
  },
  seeAll: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  requestsBadge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  requestsBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestCard: {
    backgroundColor: '#f9f9f9',
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
    backgroundColor: '#E3F2FD',
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
    color: '#333',
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
    backgroundColor: COLORS.primary,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
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
    color: '#333',
  },
  conversationLastMessage: {
    fontSize: 13,
    color: '#999',
    marginTop: 3,
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  conversationTime: {
    fontSize: 11,
    color: '#999',
    marginBottom: 5,
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  halaqaCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    marginRight: 12,
    width: 120,
    alignItems: 'center',
  },
  createHalaqaCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'transparent',
  },
  halaqaIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  halaqaIcon: {
    fontSize: 24,
  },
  halaqaName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  halaqaMembers: {
    fontSize: 11,
    color: '#999',
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
    backgroundColor: '#E3F2FD',
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
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  friendName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});