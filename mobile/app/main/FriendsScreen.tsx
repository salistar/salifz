/**
 * FriendsScreen - Salifz
 * ✅ COMPLETE: Friends list, requests, search with proper API integration
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
import { socialAPI, chatAPI } from '../../services/api';
import { COLORS } from '../../config';

const FILE_NAME = '[FriendsScreen]';

// Avatar component
const Avatar = ({ avatar, size = 50, isOnline = false }: { avatar?: string; size?: number; isOnline?: boolean }) => {
  const avatarEmojis = ['👤', '👨', '👩', '🧑', '👦', '👧', '🧔', '👳', '👲', '🧕'];
  const index = avatar ? parseInt(avatar.replace('avatar_', '')) || 0 : 0;
  const emoji = avatarEmojis[index % avatarEmojis.length];
  
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={{ fontSize: size * 0.5 }}>{emoji}</Text>
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
  const badges: Record<string, { emoji: string; color: string }> = {
    bronze: { emoji: '🥉', color: '#CD7F32' },
    silver: { emoji: '🥈', color: '#C0C0C0' },
    gold: { emoji: '🥇', color: '#FFD700' },
    diamond: { emoji: '💎', color: '#B9F2FF' },
    hafiz: { emoji: '👑', color: '#FFD700' }
  };
  const badge = badges[league || 'bronze'];
  return <Text style={styles.leagueBadge}>{badge.emoji}</Text>;
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
  // Direct properties (when request IS the user)
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
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    console.log(`${FILE_NAME} 🚀 Component mounted`);
    loadData();
  }, []);

  const loadData = async () => {
    console.log(`${FILE_NAME} 📥 loadData() called`);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        socialAPI.getFriends().catch(e => {
          console.log(`${FILE_NAME} ⚠️ getFriends error:`, e);
          return { data: [], friends: [] };
        }),
        socialAPI.getRequests().catch(e => {
          console.log(`${FILE_NAME} ⚠️ getRequests error:`, e);
          return { data: { received: [] }, requests: [] };
        })
      ]);
      
      // Handle friends response
      const friendsList = friendsRes?.data || friendsRes?.friends || friendsRes || [];
      console.log(`${FILE_NAME} ✅ Friends loaded: ${Array.isArray(friendsList) ? friendsList.length : 0}`);
      setFriends(Array.isArray(friendsList) ? friendsList : []);
      
      // Handle requests response
      const requestsList = requestsRes?.data?.received || requestsRes?.requests || requestsRes?.received || [];
      console.log(`${FILE_NAME} ✅ Requests loaded: ${Array.isArray(requestsList) ? requestsList.length : 0}`);
      setRequests(Array.isArray(requestsList) ? requestsList : []);
      
    } catch (error) {
      console.error(`${FILE_NAME} ❌ loadData error:`, error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    console.log(`${FILE_NAME} 🔄 onRefresh()`);
    setRefreshing(true);
    loadData();
  }, []);

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      Alert.alert('تنبيه', 'أدخل حرفين على الأقل للبحث');
      return;
    }
    
    console.log(`${FILE_NAME} 🔍 handleSearch("${searchQuery}")`);
    setSearching(true);
    
    try {
      const response = await socialAPI.searchUsers(searchQuery);
      const users = response?.data || response?.users || response || [];
      console.log(`${FILE_NAME} ✅ Search results: ${Array.isArray(users) ? users.length : 0}`);
      setSearchResults(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Search error:`, error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId: string, userName: string) => {
    console.log(`${FILE_NAME} 📤 handleSendRequest("${userId}")`);
    
    try {
      await socialAPI.sendRequest(userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✓ تم!', `تم إرسال طلب الصداقة إلى ${userName}`);
      
      // Update search results
      setSearchResults(prev => prev.map(u => 
        u._id === userId ? { ...u, requestSent: true } : u
      ));
      
      console.log(`${FILE_NAME} ✅ Request sent to ${userName}`);
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ Send request error:`, error);
      const errorMsg = error?.error || error?.message || 'حدث خطأ';
      Alert.alert('خطأ', errorMsg);
    }
  };

  const handleAcceptRequest = async (userId: string, userName: string) => {
    console.log(`${FILE_NAME} ✅ handleAcceptRequest("${userId}")`);
    
    try {
      await socialAPI.acceptRequest(userId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('✓ تم!', `أصبحت صديقاً مع ${userName}`);
      
      // Reload data
      loadData();
      
      console.log(`${FILE_NAME} ✅ Request accepted from ${userName}`);
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Accept request error:`, error);
      Alert.alert('خطأ', 'حدث خطأ أثناء قبول الطلب');
    }
  };

  const handleRejectRequest = async (userId: string) => {
    console.log(`${FILE_NAME} ❌ handleRejectRequest("${userId}")`);
    
    try {
      await socialAPI.rejectRequest(userId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Remove from local state
      setRequests(prev => prev.filter(r => r.from?._id !== userId && r._id !== userId));
      
      console.log(`${FILE_NAME} ✅ Request rejected`);
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Reject request error:`, error);
    }
  };

  const handleRemoveFriend = (userId: string, userName: string) => {
    Alert.alert(
      'إزالة صديق',
      `هل تريد إزالة ${userName} من قائمة الأصدقاء؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إزالة',
          style: 'destructive',
          onPress: async () => {
            try {
              await socialAPI.removeFriend(userId);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setFriends(prev => prev.filter(f => f._id !== userId));
              console.log(`${FILE_NAME} ✅ Friend removed`);
            } catch (error) {
              console.error(`${FILE_NAME} ❌ Remove friend error:`, error);
            }
          }
        }
      ]
    );
  };

  const handleStartChat = async (userId: string) => {
    console.log(`${FILE_NAME} 💬 handleStartChat("${userId}")`);
    
    try {
      const response = await chatAPI.createConversation(userId);
      const conversationId = response?.data?._id || response?._id;
      
      if (conversationId) {
        navigation.navigate('Chat', { conversationId, recipientId: userId });
      }
    } catch (error) {
      console.error(`${FILE_NAME} ❌ Start chat error:`, error);
    }
  };

  const handleViewProfile = (userId: string) => {
    console.log(`${FILE_NAME} 👤 handleViewProfile("${userId}")`);
    navigation.navigate('UserProfile', { userId });
  };

  const tabs = [
    { id: 'friends' as const, label: 'الأصدقاء', icon: '👥', count: friends.length },
    { id: 'requests' as const, label: 'الطلبات', icon: '📩', count: requests.length },
    { id: 'search' as const, label: 'بحث', icon: '🔍', count: undefined }
  ];

  // Render friend item
  const renderFriendItem = (friend: Friend) => (
    <TouchableOpacity
      key={friend._id}
      style={styles.friendItem}
      onPress={() => handleViewProfile(friend._id)}
      onLongPress={() => handleRemoveFriend(friend._id, friend.displayName || friend.username)}
    >
      <Avatar 
        avatar={friend.avatar} 
        size={55} 
        isOnline={friend.isOnline} 
      />
      
      <View style={styles.friendInfo}>
        <View style={styles.friendNameRow}>
          <Text style={styles.friendName}>{friend.displayName || friend.username}</Text>
          <LeagueBadge league={friend.league} />
        </View>
        <Text style={styles.friendLevel}>المستوى {friend.level || 1}</Text>
        <View style={styles.friendStats}>
          <Text style={styles.friendStreak}>🔥 {friend.currentStreak || friend.streaks?.current || 0}</Text>
          <Text style={styles.friendXP}>⚡ {(friend.totalXP || 0).toLocaleString()} XP</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => handleStartChat(friend._id)}
      >
        <Ionicons name="chatbubble-outline" size={22} color={COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render request item
  const renderRequestItem = (request: FriendRequest) => {
    // Get user data - either from 'from' property or directly from request
    const userId = request.from?._id || request._id;
    const userName = request.from?.displayName || request.from?.username || request.displayName || request.username || 'مستخدم';
    const userAvatar = request.from?.avatar || request.avatar;
    const userLevel = request.from?.level || request.level || 1;
    const userStreak = request.from?.currentStreak || request.currentStreak;
    
    return (
      <View key={request._id} style={styles.requestItem}>
        <Avatar avatar={userAvatar} size={55} />
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{userName}</Text>
          <Text style={styles.friendLevel}>المستوى {userLevel}</Text>
          {userStreak ? (
            <Text style={styles.friendStreak}>🔥 {userStreak} يوم</Text>
          ) : null}
        </View>
        
        <View style={styles.requestActions}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(userId, userName)}
          >
            <Text style={styles.acceptText}>قبول</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => handleRejectRequest(userId)}
          >
            <Text style={styles.rejectText}>رفض</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render search result item
  const renderSearchItem = (user: SearchUser) => {
    const isFriend = user.isFriend;
    const requestSent = user.requestSent;
    const requestReceived = user.requestReceived;
    
    return (
      <View key={user._id} style={styles.friendItem}>
        <Avatar avatar={user.avatar} size={55} />
        
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{user.displayName || user.username}</Text>
          <Text style={styles.friendLevel}>المستوى {user.level || 1}</Text>
          {user.currentStreak ? (
            <Text style={styles.friendStreak}>🔥 {user.currentStreak} يوم</Text>
          ) : null}
        </View>
        
        {isFriend ? (
          <View style={styles.alreadyFriendBadge}>
            <Text style={styles.alreadyFriendText}>✓ صديق</Text>
          </View>
        ) : requestSent ? (
          <View style={styles.sentButton}>
            <Text style={styles.sentText}>تم الإرسال</Text>
          </View>
        ) : requestReceived ? (
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(user._id, user.displayName || user.username)}
          >
            <Text style={styles.acceptText}>قبول</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => handleSendRequest(user._id, user.displayName || user.username)}
          >
            <Ionicons name="person-add" size={18} color="#fff" />
            <Text style={styles.addButtonText}>إضافة</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Empty state component
  const EmptyState = ({ icon, title, subtitle, action }: { 
    icon: string; 
    title: string; 
    subtitle?: string;
    action?: { label: string; onPress: () => void };
  }) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={styles.emptyButton} onPress={action.onPress}>
          <Text style={styles.emptyButtonText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#2196F3', '#1565C0']} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerIcon}>👥</Text>
        <Text style={styles.headerTitle}>الأصدقاء</Text>
        <Text style={styles.headerSubtitle}>{friends.length} صديق</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.id);
            }}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
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
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <>
            {friends.length === 0 ? (
              <EmptyState
                icon="👥"
                title="لا يوجد أصدقاء بعد"
                subtitle="ابحث عن أصدقاء وأضفهم!"
                action={{ label: 'البحث عن أصدقاء', onPress: () => setActiveTab('search') }}
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
                icon="📩"
                title="لا توجد طلبات صداقة"
                subtitle="عندما يرسل لك أحد طلب صداقة سيظهر هنا"
              />
            ) : (
              <>
                <Text style={styles.sectionTitle}>طلبات واردة ({requests.length})</Text>
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
                <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="ابحث باسم المستخدم..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.searchButton, searching && styles.searchButtonDisabled]}
                onPress={handleSearch}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="search" size={22} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {searchResults.length === 0 ? (
              <EmptyState
                icon="🔍"
                title={searchQuery ? 'لا توجد نتائج' : 'ابحث عن أصدقاء'}
                subtitle={searchQuery ? 'جرب البحث باسم آخر' : 'اكتب اسم المستخدم للبحث'}
              />
            ) : (
              <>
                <Text style={styles.sectionTitle}>نتائج البحث ({searchResults.length})</Text>
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
  loadingText: {
    marginTop: 10,
    color: '#666',
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
    fontSize: 50,
  },
  headerTitle: {
    color: '#fff',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#2196F3',
  },
  tabIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  tabLabel: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  tabLabelActive: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: '#2196F3',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    paddingHorizontal: 5,
  },
  tabBadgeRed: {
    backgroundColor: '#F44336',
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
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
    color: '#333',
    marginRight: 5,
  },
  leagueBadge: {
    fontSize: 14,
  },
  friendLevel: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  friendStats: {
    flexDirection: 'row',
    marginTop: 4,
  },
  friendStreak: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 10,
  },
  friendXP: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '600',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  acceptText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rejectText: {
    color: '#F44336',
    fontWeight: 'bold',
    fontSize: 13,
  },
  addButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 5,
  },
  sentButton: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  sentText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 13,
  },
  alreadyFriendBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  alreadyFriendText: {
    color: '#4CAF50',
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
    backgroundColor: '#fff',
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
    color: '#333',
    textAlign: 'right',
  },
  searchButton: {
    backgroundColor: '#2196F3',
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
    backgroundColor: '#90CAF9',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 70,
    marginBottom: 15,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySubtitle: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  emptyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});