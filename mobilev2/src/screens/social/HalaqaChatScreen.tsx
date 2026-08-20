/**
 * ============================================
 * 📱 HalaqaChatScreen.tsx - Salifz
 * ============================================
 * ✅ COMPLETE: Real-time chat for halaqa members
 * ✅ CONVERTED: i18n integration
 * ✅ FEATURES:
 *    - Text messages with real-time Socket.IO
 *    - Verse sharing
 *    - Typing indicators
 *    - Message history with pagination
 *    - Connection status
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { halaqaAPI } from '../../services/api';
import { useAuthStore } from '../../stores';
import { socketService } from '../../services/socket';
import { COLORS } from '../../config';
import { t, getLocale } from '../../services/i18n';
import { useThemedStyles } from '../../hooks/useThemedStyles';
import { useTheme, ThemeColors } from '../../contexts/ThemeContext';

const LOG_PREFIX = '[HalaqaChatScreen.tsx]';

console.log(`${LOG_PREFIX} 📁 File loaded`);

interface Message {
  _id: string;
  sender: {
    _id: string;
    username?: string;
    displayName?: string;
  };
  content: string;
  type: 'text' | 'verse' | 'audio' | 'system';
  createdAt: string;
}

interface TypingUser {
  odileId: string;
  name: string;
}

export default function HalaqaChatScreen({ route, navigation }: any) {
  const { colors } = useTheme();
  const styles = useThemedStyles(makeStyles);

  console.log(`${LOG_PREFIX} 🚀 Component rendering`);
  
  const { halaqaId, halaqaName } = route.params || {};
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useFocusEffect(
    useCallback(() => {
      console.log(`${LOG_PREFIX} ⚡ useFocusEffect - halaqaId: ${halaqaId}`);
      
      if (!halaqaId) {
        Alert.alert(t('common.error'), t('halaqaChat.errors.noHalaqaId'));
        navigation.goBack();
        return;
      }
      
      loadMessages();
      joinHalaqaChat();

      return () => {
        leaveHalaqaChat();
      };
    }, [halaqaId])
  );

  useEffect(() => {
    console.log(`${LOG_PREFIX} ⚡ useEffect - Setting up socket listeners`);
    
    // Socket event listeners
    const handleNewMessage = (data: any) => {
      if (data.halaqaId !== halaqaId) return;
      
      const message = data.message || data;
      console.log(`${LOG_PREFIX} 📨 New message received:`, message._id);
      
      setMessages(prev => {
        // Avoid duplicates
        if (prev.find(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
      
      scrollToBottom();
    };

    const handleTyping = (data: { halaqaId: string; odileId: string; username: string }) => {
      if (data.halaqaId !== halaqaId || data.odileId === user?._id) return;
      
      setTypingUsers(prev => {
        if (!prev.find(u => u.odileId === data.odileId)) {
          return [...prev, { odileId: data.odileId, name: data.username }];
        }
        return prev;
      });

      // Remove after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.odileId !== data.odileId));
      }, 3000);
    };

    const handleStopTyping = (data: { halaqaId: string; odileId: string }) => {
      if (data.halaqaId !== halaqaId) return;
      setTypingUsers(prev => prev.filter(u => u.odileId !== data.odileId));
    };

    const handleConnect = () => {
      console.log(`${LOG_PREFIX} 🔌 Socket connected`);
      setIsConnected(true);
      joinHalaqaChat();
    };

    const handleDisconnect = () => {
      console.log(`${LOG_PREFIX} 🔌 Socket disconnected`);
      setIsConnected(false);
    };

    // Register listeners
    socketService.on('halaqaMessage', handleNewMessage);
    socketService.on('halaqaTyping', handleTyping);
    socketService.on('halaqaStopTyping', handleStopTyping);
    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);

    // Check connection status
    setIsConnected(socketService.isConnected());

    return () => {
      console.log(`${LOG_PREFIX} 🧹 Cleanup - Removing socket listeners`);
      socketService.off('halaqaMessage', handleNewMessage);
      socketService.off('halaqaTyping', handleTyping);
      socketService.off('halaqaStopTyping', handleStopTyping);
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
    };
  }, [halaqaId, user?._id]);

  const loadMessages = async () => {
    if (!halaqaId) return;
    console.log(`${LOG_PREFIX} 📥 loadMessages()`);
    
    try {
      setIsLoading(true);
      const response = await halaqaAPI.getMessages(halaqaId);
      const data = response?.data || response?.messages || response || [];
      
      // Sort by date ascending (oldest first)
      const sorted = Array.isArray(data) 
        ? data.sort((a: Message, b: Message) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        : [];
      
      setMessages(sorted);
      console.log(`${LOG_PREFIX} ✅ Messages loaded: ${sorted.length}`);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error(`${LOG_PREFIX} ❌ Load messages error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const joinHalaqaChat = () => {
    if (halaqaId && socketService.isConnected()) {
      console.log(`${LOG_PREFIX} 🚪 Joining room:`, halaqaId);
      socketService.emit('joinHalaqa', { halaqaId, odileId: user?._id });
    }
  };

  const leaveHalaqaChat = () => {
    if (halaqaId && socketService.isConnected()) {
      console.log(`${LOG_PREFIX} 🚪 Leaving room:`, halaqaId);
      socketService.emit('leaveHalaqa', { halaqaId, odileId: user?._id });
    }
  };

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    console.log(`${LOG_PREFIX} 📤 handleSend() - length: ${text.length}`);

    try {
      setIsSending(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Keyboard.dismiss();

      // Clear input immediately
      setInputText('');

      // Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        socketService.emit('halaqaStopTyping', { halaqaId, odileId: user?._id });
      }

      // Create optimistic message
      const optimisticMessage: Message = {
        _id: `temp-${Date.now()}`,
        sender: {
          _id: user?._id || '',
          username: user?.username,
          displayName: user?.displayName,
        },
        content: text,
        type: 'text',
        createdAt: new Date().toISOString(),
      };

      // Add to local messages immediately
      setMessages(prev => [...prev, optimisticMessage]);
      setTimeout(scrollToBottom, 100);

      // Envoi par l'API : le serveur persiste PUIS diffuse lui-même sur le
      // socket (plus d'emit côté client — il produisait un doublon éphémère
      // au texte vide, le serveur n'acceptant que les chaînes).
      const response = await halaqaAPI.sendMessage(halaqaId, text, 'text');
      console.log(`${LOG_PREFIX} ✅ Message sent`);

      // Donner à l'optimiste son identifiant définitif : quand notre propre
      // message revient par le socket, le dédoublonnage par _id le reconnaît.
      const savedId = response?.data?._id || response?._id;
      if (savedId) {
        setMessages(prev =>
          prev.map(m => (m._id === optimisticMessage._id ? { ...m, _id: String(savedId) } : m))
        );
      }

    } catch (error: any) {
      console.error(`${LOG_PREFIX} ❌ Send error:`, error);
      Alert.alert(
        t('common.error'), 
        error?.error || error?.message || t('halaqaChat.errors.sendFailed')
      );
      // Restore input text on error
      setInputText(text);
      // Remove optimistic message
      setMessages(prev => prev.filter(m => !m._id.startsWith('temp-')));
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = (text: string) => {
    setInputText(text);

    if (!halaqaId) return;

    // Emit typing event
    if (text.length > 0) {
      socketService.emit('halaqaTyping', {
        halaqaId,
        odileId: user?._id,
        username: user?.displayName || user?.username || t('halaqaChat.member'),
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        socketService.emit('halaqaStopTyping', { halaqaId, odileId: user?._id });
      }, 2000);
    } else {
      socketService.emit('halaqaStopTyping', { halaqaId, odileId: user?._id });
    }
  };

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const locale = getLocale();
      const localeMap: Record<string, string> = {
        ar: 'ar-SA',
        fr: 'fr-FR',
        en: 'en-US',
      };
      return date.toLocaleTimeString(localeMap[locale] || 'ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) {
        return t('halaqaChat.dates.today');
      } else if (date.toDateString() === yesterday.toDateString()) {
        return t('halaqaChat.dates.yesterday');
      } else {
        const locale = getLocale();
        const localeMap: Record<string, string> = {
          ar: 'ar-SA',
          fr: 'fr-FR',
          en: 'en-US',
        };
        return date.toLocaleDateString(localeMap[locale] || 'ar-SA', { 
          day: 'numeric', 
          month: 'short' 
        });
      }
    } catch {
      return '';
    }
  };

  const shouldShowDate = (index: number): boolean => {
    if (index === 0) return true;
    try {
      const currentDate = new Date(messages[index].createdAt).toDateString();
      const prevDate = new Date(messages[index - 1].createdAt).toDateString();
      return currentDate !== prevDate;
    } catch {
      return false;
    }
  };

  const isMyMessage = (message: Message): boolean => {
    return message.sender?._id === user?._id;
  };

  const getSenderName = (message: Message): string => {
    if (isMyMessage(message)) return t('halaqaChat.you');
    return message.sender?.displayName || message.sender?.username || t('halaqaChat.member');
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMine = isMyMessage(item);
    const showDate = shouldShowDate(index);
    const showSender = !isMine && (index === 0 || messages[index - 1].sender?._id !== item.sender?._id);

    return (
      <View>
        {showDate && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        )}

        {item.type === 'system' ? (
          <View style={styles.systemMessage}>
            <Text style={styles.systemMessageText}>{item.content}</Text>
          </View>
        ) : (
          <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
            {!isMine && (
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getSenderName(item).charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
            )}

            <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
              {showSender && !isMine && (
                <Text style={styles.senderName}>{getSenderName(item)}</Text>
              )}

              {item.type === 'verse' ? (
                <View style={styles.verseContainer}>
                  <Text style={styles.verseText}>{item.content}</Text>
                </View>
              ) : (
                <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                  {item.content}
                </Text>
              )}

              <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
                {formatTime(item.createdAt)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    const names = typingUsers.map(u => u.name).join('، ');
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
        <Text style={styles.typingText}>
          {t('halaqaChat.typing', { names })}
        </Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="chatbubbles-outline" size={60} color={colors.textMuted} />
      <Text style={styles.emptyTitle}>{t('halaqaChat.empty.title')}</Text>
      <Text style={styles.emptyText}>{t('halaqaChat.empty.subtitle')}</Text>
    </View>
  );

  return (
    // `bottom` inclus : sans lui, la barre de saisie passait SOUS les
    // boutons de navigation Android — le bouton Envoyer était intappable.
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.header}>
        <TouchableOpacity accessible accessibilityRole="button" style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.onDeep} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {halaqaName || t('halaqaChat.defaultTitle')}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, isConnected && styles.statusDotOnline]} />
            <Text style={styles.statusText}>
              {isConnected ? t('halaqaChat.status.connected') : t('halaqaChat.status.disconnected')}
            </Text>
          </View>
        </View>

        <TouchableOpacity accessible accessibilityRole="button" 
          style={styles.infoButton} 
          onPress={() => navigation.navigate('HalaqaDetail', { halaqaId })}
        >
          <Ionicons name="information-circle-outline" size={24} color={colors.onDeep} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item._id}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={renderTypingIndicator}
            onContentSizeChange={scrollToBottom}
            onLayout={scrollToBottom}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={t('halaqaChat.input.placeholder')}
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={handleTyping}
              multiline
              maxLength={1000}
              editable={!isSending}
            />
          </View>

          <TouchableOpacity accessible accessibilityRole="button"
            style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.onDeep} />
            ) : (
              <Ionicons name="send" size={20} color={colors.onDeep} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    color: c.onDeep,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: c.textMuted,
    marginRight: 5,
  },
  statusDotOnline: {
    backgroundColor: c.primary,
  },
  statusText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 15,
    paddingBottom: 10,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: c.textMuted,
    marginTop: 15,
  },
  emptyText: {
    fontSize: 14,
    color: c.textMuted,
    marginTop: 5,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  dateText: {
    fontSize: 12,
    color: c.textMuted,
    backgroundColor: '#e8e8e8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: 10,
  },
  systemMessageText: {
    fontSize: 12,
    color: c.textMuted,
    fontStyle: 'italic',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  messageRowMine: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    marginRight: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: c.onDeep,
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  myMessage: {
    backgroundColor: c.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: c.surface,
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: c.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: c.text,
    lineHeight: 22,
    textAlign: 'right',
  },
  myMessageText: {
    color: c.onDeep,
  },
  verseContainer: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 5,
  },
  verseText: {
    fontSize: 16,
    color: c.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'right',
  },
  messageTime: {
    fontSize: 10,
    color: c.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.textMuted,
    marginHorizontal: 2,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.7,
  },
  dot3: {
    opacity: 1,
  },
  typingText: {
    fontSize: 12,
    color: c.textMuted,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: c.surface,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: c.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
  },
  input: {
    fontSize: 16,
    color: c.text,
    textAlign: 'right',
    minHeight: 24,
    maxHeight: 80,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: c.textMuted,
  },
});