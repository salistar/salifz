/**
 * ConversationsListScreen - Salifz
 * ✅ FIXED: All text properly wrapped in <Text> components
 * ✅ FIXED: Handle undefined/null values
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadConversations();
    setupSocket();
    
    return () => {
      socketService.off('new-message', handleNewMessage);
    };
  }, []);

  const setupSocket = () => {
    socketService.on('new-message', handleNewMessage);
  };

  const handleNewMessage = useCallback((message: any) => {
    setConversations(prev => {
      const updated = [...prev];
      const index = updated.findIndex(c => c._id === message.roomId || c._id === message.conversationId);
      if (index !== -1) {
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
    try {
      const response = await chatAPI.getConversations();
      const data = response?.data || response || [];
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await socialAPI.searchUsers(query);
      const users = response?.data || response?.users || [];
      setSearchResults(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const startConversation = async (userId: string) => {
    try {
      const response = await chatAPI.createConversation(userId);
      const conversation = response?.data || response;
      setSearchQuery('');
      setSearchResults([]);
      navigation.navigate('Chat', { 
        conversationId: conversation?._id,
        recipientId: userId 
      });
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // ✅ FIXED: Safe getters with fallback values
  const getConversationName = (conv: Conversation): string => {
    if (!conv) return 'محادثة';
    
    if (conv.type === 'group' || conv.type === 'halaqa') {
      return conv.name || 'مجموعة';
    }
    
    const participant = conv.participants?.[0];
    if (!participant) return 'محادثة';
    
    return participant.displayName || participant.username || 'محادثة';
  };

  const getConversationAvatar = (conv: Conversation): string => {
    if (!conv) return '👤';
    if (conv.type === 'group') return '👥';
    if (conv.type === 'halaqa') return '🕌';
    return '👤';
  };

  const getLastMessageText = (conv: Conversation): string => {
    if (!conv) return 'لا توجد رسائل';
    return conv.lastMessageText || conv.lastMessage?.content || 'لا توجد رسائل';
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
        return 'أمس';
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
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', { 
          conversationId: item._id,
          recipientId: recipientId
        })}
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
    // ✅ FIXED: Extract values safely
    const displayName = item?.displayName || item?.username || 'مستخدم';
    const username = item?.username || '';

    return (
      <TouchableOpacity
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
        <Ionicons name="chatbubble-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>
    );
  };

  const renderSearchHeader = () => {
    if (isSearching) {
      return <ActivityIndicator style={styles.searchingIndicator} color={COLORS.primary} />;
    }
    
    if (searchResults.length === 0 && searchQuery.length >= 2) {
      return <Text style={styles.noResultsText}>{'لا توجد نتائج'}</Text>;
    }
    
    return null;
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>{'💬'}</Text>
      <Text style={styles.emptyTitle}>{'لا توجد محادثات'}</Text>
      <Text style={styles.emptySubtitle}>
        {'ابحث عن أصدقاء لبدء محادثة جديدة'}
      </Text>
      <TouchableOpacity 
        style={styles.findFriendsButton}
        onPress={() => navigation.navigate('Friends')}
      >
        <Text style={styles.findFriendsText}>{'البحث عن أصدقاء'}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>{'جاري التحميل...'}</Text>
    </View>
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    searchUsers(text);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'المحادثات'}</Text>
          <TouchableOpacity 
            style={styles.newChatButton}
            onPress={() => navigation.navigate('Friends')}
          >
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن شخص..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#999" />
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
              <Text style={styles.noResultsText}>{'لا توجد نتائج'}</Text>
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
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={renderEmpty}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#fff',
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
    backgroundColor: '#fff',
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
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#fff',
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
    backgroundColor: '#E3F2FD',
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
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  unreadBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginLeft: 10,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#333',
    textAlign: 'right',
  },
  searchResultUsername: {
    fontSize: 13,
    color: '#999',
    textAlign: 'right',
  },
  searchingIndicator: {
    paddingVertical: 20,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#999',
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
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
  },
  findFriendsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  findFriendsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});