/**
 * ============================================
 * 📱 ConversationsListScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ FIXED: All text properly wrapped in <Text> components
 * ✅ FIXED: Handle undefined/null values
 * ✅ ENHANCED: More detailed console.log
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { chatAPI, socialAPI } from '../../services/api';
import { socketService } from '../../services/socket';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

// ✅ Constante pour les logs
const LOG_PREFIX = '[ConversationsListScreen.tsx]';

interface Participant {
  _id: string;
  username?: string;
  displayName?: string;
  profile?: { avatar?: string };
}

interface Conversation {
  _id: string;
  type?: 'direct' | 'group' | 'halaqa';
  name?: string;
  participants?: Participant[];
  lastMessage?: {
    content?: string;
    createdAt?: string;
  };
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadCount?: number;
}

interface SearchUser {
  _id: string;
  username?: string;
  displayName?: string;
}

export default function ConversationsListScreen({ navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🔄 useEffect: Initializing...`);
    loadConversations();
    setupSocket();
    
    return () => {
      console.log(`${LOG_PREFIX} 🧹 Cleanup: Removing socket listeners...`);
      socketService.off('new-message', handleNewMessage);
    };
  }, []);

  const setupSocket = () => {
    console.log(`${LOG_PREFIX} 🔌 Setting up socket listeners...`);
    socketService.on('new-message', handleNewMessage);
  };

  const handleNewMessage = useCallback((message: any) => {
    console.log(`${LOG_PREFIX} 📩 New message received:`, message?.roomId || message?.conversationId);
    setConversations(prev => {
      const updated = [...prev];
      const index = updated.findIndex(c => c._id === message.roomId || c._id === message.conversationId);
      if (index !== -1) {
        console.log(`${LOG_PREFIX} 📋 Updating conversation at index ${index}`);
        updated[index] = {
          ...updated[index],
          lastMessageText: message.content || '',
          lastMessageAt: message.timestamp || new Date().toISOString(),
          unreadCount: (updated[index].unreadCount || 0) + 1,
        };
        // Move to top
        const [conv] = updated.splice(index, 1);
        updated.unshift(conv);
      }
      return updated;
    });
  }, []);

  const loadConversations = async () => {
    console.log(`${LOG_PREFIX} 📥 ========== LOAD CONVERSATIONS START ==========`);
    try {
      console.log(`${LOG_PREFIX} 📤 Calling chatAPI.getConversations()...`);
      const response = await chatAPI.getConversations();
      const data = response?.data || response || [];
      const conversationsList = Array.isArray(data) ? data : [];
      setConversations(conversationsList);
      console.log(`${LOG_PREFIX} ✅ Loaded ${conversationsList.length} conversations`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error loading conversations:`, error);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      console.log(`${LOG_PREFIX} 📥 ========== LOAD CONVERSATIONS END ==========`);
    }
  };

  const onRefresh = () => {
    console.log(`${LOG_PREFIX} 🔄 Pull to refresh triggered`);
    setRefreshing(true);
    loadConversations();
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    console.log(`${LOG_PREFIX} 🔍 Searching users: "${query}"`);
    setIsSearching(true);
    try {
      const response = await socialAPI.searchUsers(query);
      const users = response?.data || response?.users || [];
      const usersList = Array.isArray(users) ? users : [];
      setSearchResults(usersList);
      console.log(`${LOG_PREFIX} ✅ Found ${usersList.length} users`);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Search error:`, error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const startConversation = async (userId: string) => {
    console.log(`${LOG_PREFIX} 💬 Starting conversation with user: ${userId}`);
    try {
      const response = await chatAPI.createConversation(userId);
      const conversation = response?.data || response;
      console.log(`${LOG_PREFIX} ✅ Conversation created: ${conversation?._id}`);
      setSearchQuery('');
      setSearchResults([]);
      navigation.navigate('Chat', { 
        conversationId: conversation?._id,
        recipientId: userId 
      });
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Error creating conversation:`, error);
    }
  };

  // ✅ FIXED: Safe getters with fallback values and i18n
  const getConversationName = (conv: Conversation): string => {
    // ✅ AVANT: return 'محادثة' / 'مجموعة'
    if (!conv) return t('conversations.conversation');
    
    if (conv.type === 'group' || conv.type === 'halaqa') {
      return conv.name || t('conversations.group');
    }
    
    const participant = conv.participants?.[0];
    if (!participant) return t('conversations.conversation');
    
    return participant.displayName || participant.username || t('conversations.conversation');
  };

  const getConversationAvatar = (conv: Conversation): string => {
    if (!conv) return '👤';
    if (conv.type === 'group') return '👥';
    if (conv.type === 'halaqa') return '🕌';
    return '👤';
  };

  const getLastMessageText = (conv: Conversation): string => {
    // ✅ AVANT: return 'لا توجد رسائل'
    if (!conv) return t('conversations.noMessages');
    return conv.lastMessageText || conv.lastMessage?.content || t('conversations.noMessages');
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) {
        return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
      } else if (days === 1) {
        // ✅ AVANT: return 'أمس'
        return t('common.yesterday');
      } else if (days < 7) {
        return date.toLocaleDateString('ar-SA', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  const getUnreadCount = (conv: Conversation): number => {
    return conv?.unreadCount || 0;
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    // ✅ FIXED: Extract all values safely before rendering
    const name = getConversationName(item);
    const avatar = getConversationAvatar(item);
    const lastMessage = getLastMessageText(item);
    const time = formatTime(item?.lastMessageAt || item?.lastMessage?.createdAt);
    const unreadCount = getUnreadCount(item);
    const recipientId = item?.participants?.[0]?._id || '';

    return (
      <TouchableOpacity accessible accessibilityRole="button"
        style={styles.conversationItem}
        onPress={() => {
          console.log(`${LOG_PREFIX} 👆 Conversation pressed: ${item._id}`);
          navigation.navigate('Chat', { 
            conversationId: item._id,
            recipientId: recipientId
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{avatar}</Text>
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName} numberOfLines={1}>
              {name}
            </Text>
            {time ? (
              <Text style={styles.timeText}>{time}</Text>
            ) : null}
          </View>
          
          <View style={styles.conversationFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage}
            </Text>
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 99 ? '99+' : String(unreadCount)}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }: { item: SearchUser }) => {
    // ✅ FIXED: Extract values safely with i18n
    // ✅ AVANT: const displayName = item?.displayName || item?.username || 'مستخدم';
    const displayName = item?.displayName || item?.username || t('common.user');
    const username = item?.username || '';

    return (
      <TouchableOpacity accessible accessibilityRole="button"
        style={styles.searchResultItem}
        onPress={() => startConversation(item._id)}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{'👤'}</Text>
        </View>
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultName}>{displayName}</Text>
          {username ? (
            <Text style={styles.searchResultUsername}>{'@'}{username}</Text>
          ) : null}
        </View>
        <Ionicons name="chatbubble-outline" size={24} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  const renderSearchHeader = () => {
    if (isSearching) {
      return <ActivityIndicator style={styles.searchingIndicator} color={colors.primary} />;
    }
    
    if (searchResults.length === 0 && searchQuery.length >= 2) {
      // ✅ AVANT: return <Text ...>{'لا توجد نتائج'}</Text>;
      return <Text style={styles.noResultsText}>{t('conversations.noResults')}</Text>;
    }
    
    return null;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{'💬'}</Text>
      {/* ✅ AVANT: 'لا توجد محادثات' */}
      <Text style={styles.emptyTitle}>{t('conversations.empty')}</Text>
      {/* ✅ AVANT: 'ابحث عن أصدقاء لبدء محادثة جديدة' */}
      <Text style={styles.emptySubtitle}>{t('conversations.emptySubtitle')}</Text>
      <TouchableOpacity accessible accessibilityRole="button" 
        style={styles.findFriendsButton}
        onPress={() => {
          console.log(`${LOG_PREFIX} 🔗 Navigate to Friends`);
          navigation.navigate('Friends');
        }}
      >
        {/* ✅ AVANT: 'البحث عن أصدقاء' */}
        <Text style={styles.findFriendsText}>{t('conversations.findFriends')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      {/* ✅ AVANT: 'جاري التحميل...' */}
      <Text style={styles.loadingText}>{t('common.loading')}</Text>
    </View>
  );

  const handleSearchChange = (text: string) => {
    console.log(`${LOG_PREFIX} 🔍 Search query changed: "${text}"`);
    setSearchQuery(text);
    searchUsers(text);
  };

  const clearSearch = () => {
    console.log(`${LOG_PREFIX} ✖️ Search cleared`);
    setSearchQuery('');
    setSearchResults([]);
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (${conversations.length} conversations, searching: ${isSearching})...`);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity accessible accessibilityRole="button" 
            style={styles.backButton}
            onPress={() => {
              console.log(`${LOG_PREFIX} 🔙 Back button pressed`);
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.onDeep} />
          </TouchableOpacity>
          {/* ✅ AVANT: 'المحادثات' */}
          <Text style={styles.headerTitle}>{t('conversations.title')}</Text>
          <TouchableOpacity accessible accessibilityRole="button" 
            style={styles.newChatButton}
            onPress={() => {
              console.log(`${LOG_PREFIX} ➕ New chat button pressed`);
              navigation.navigate('Friends');
            }}
          >
            <Ionicons name="create-outline" size={24} color={colors.onDeep} />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            // ✅ AVANT: placeholder="ابحث عن شخص..."
            placeholder={t('conversations.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity accessible accessibilityRole="button" onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {/* Content */}
      {loading ? (
        renderLoading()
      ) : searchQuery.length > 0 ? (
        // Search Results
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderSearchHeader}
          ListEmptyComponent={
            !isSearching && searchQuery.length >= 2 ? (
              <Text style={styles.noResultsText}>{t('conversations.noResults')}</Text>
            ) : null
          }
        />
      ) : (
        // Conversations List
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            conversations.length === 0 && styles.emptyListContent
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: c.onDeep,
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    marginHorizontal: 15,
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    textAlign: 'right',
    color: c.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: c.textSecondary,
  },
  listContent: {
    padding: 15,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  avatarContainer: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: c.infoSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
  },
  conversationContent: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
    flex: 1,
    textAlign: 'right',
  },
  timeText: {
    fontSize: 12,
    color: c.textMuted,
    marginLeft: 10,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: c.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  unreadBadge: {
    backgroundColor: c.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 10,
  },
  unreadText: {
    color: c.onDeep,
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: c.text,
    textAlign: 'right',
  },
  searchResultUsername: {
    fontSize: 13,
    color: c.textMuted,
    textAlign: 'right',
  },
  searchingIndicator: {
    paddingVertical: 20,
  },
  noResultsText: {
    textAlign: 'center',
    color: c.textMuted,
    fontSize: 16,
    paddingVertical: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: c.text,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
  },
  findFriendsButton: {
    backgroundColor: c.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  findFriendsText: {
    color: c.onDeep,
    fontWeight: 'bold',
    fontSize: 16,
  },
});