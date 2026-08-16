/**
 * ============================================
 * 📱 ChatScreen.tsx - Salifz
 * ============================================
 * ✅ CONVERTED: i18n integration
 * ✅ ENHANCED: More detailed console.log
 * Real-time text messaging between users
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Image, Animated, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../stores';
import { socketService } from '../../services/socket';
import { COLORS } from '../../config';
// ✅ AJOUT: Import i18n
import { t } from '../../services/i18n';

const { width } = Dimensions.get('window');

// ✅ Constante pour les logs
const LOG_PREFIX = '[ChatScreen.tsx]';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'audio' | 'verse';
  verseData?: { surah: number; ayah: number; text: string };
}

interface ChatUser {
  id: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export default function ChatScreen({ route, navigation }: any) {
  const { recipientId, recipientName, recipientAvatar } = route.params || {};
  const { user } = useAuthStore();
  
  console.log(`${LOG_PREFIX} 🚀 Component mounting...`);
  console.log(`${LOG_PREFIX} 💬 Chat params: recipientId=${recipientId}, recipientName=${recipientName}`);
  console.log(`${LOG_PREFIX} 👤 Current user: ${user?.id}`);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const typingTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    console.log(`${LOG_PREFIX} 🔄 useEffect: Initializing chat...`);
    loadMessages();
    setupSocketListeners();
    
    return () => {
      console.log(`${LOG_PREFIX} 🧹 Cleanup: Removing socket listeners...`);
      cleanupSocketListeners();
    };
  }, []);

  const loadMessages = async () => {
    console.log(`${LOG_PREFIX} 📥 Loading messages...`);
    const mockMessages: Message[] = [
      { id: '1', senderId: recipientId, text: 'السلام عليكم! كيف حالك؟', timestamp: new Date(Date.now() - 3600000), status: 'read', type: 'text' },
      { id: '2', senderId: user?.id || 'me', text: 'وعليكم السلام! الحمد لله، أنت كيف؟', timestamp: new Date(Date.now() - 3500000), status: 'read', type: 'text' },
      { id: '3', senderId: recipientId, text: 'الحمد لله، هل راجعت سورة البقرة؟', timestamp: new Date(Date.now() - 3400000), status: 'read', type: 'text' },
      { id: '4', senderId: user?.id || 'me', text: 'نعم، حفظت 10 آيات جديدة اليوم! 📖', timestamp: new Date(Date.now() - 3300000), status: 'read', type: 'text' },
      { id: '5', senderId: recipientId, text: 'ما شاء الله! بارك الله فيك 🤲', timestamp: new Date(Date.now() - 100000), status: 'read', type: 'text' },
    ];
    setMessages(mockMessages);
    setIsOnline(true);
    console.log(`${LOG_PREFIX} ✅ Loaded ${mockMessages.length} messages`);
  };

  const setupSocketListeners = () => {
    console.log(`${LOG_PREFIX} 🔌 Setting up socket listeners...`);
    socketService.on('newMessage', handleNewMessage);
    socketService.on('typing', handleTypingStatus);
    socketService.on('userOnline', () => {
      console.log(`${LOG_PREFIX} 🟢 User online`);
      setIsOnline(true);
    });
    socketService.on('userOffline', () => {
      console.log(`${LOG_PREFIX} 🔴 User offline`);
      setIsOnline(false);
    });
  };

  const cleanupSocketListeners = () => {
    socketService.off('newMessage', handleNewMessage);
    socketService.off('typing', handleTypingStatus);
  };

  const handleNewMessage = (message: Message) => {
    console.log(`${LOG_PREFIX} 📩 New message received: ${message.id}`);
    setMessages(prev => [...prev, message]);
    scrollToBottom();
  };

  const handleTypingStatus = (data: { userId: string; isTyping: boolean }) => {
    if (data.userId === recipientId) {
      console.log(`${LOG_PREFIX} ⌨️ Recipient typing: ${data.isTyping}`);
      setRecipientTyping(data.isTyping);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim()) return;
    
    console.log(`${LOG_PREFIX} 📤 ========== SEND MESSAGE START ==========`);
    console.log(`${LOG_PREFIX} 📝 Message text: ${inputText.substring(0, 50)}...`);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user?.id || 'me',
      text: inputText.trim(),
      timestamp: new Date(),
      status: 'sending',
      type: 'text'
    };
    
    console.log(`${LOG_PREFIX} 📋 Message ID: ${newMessage.id}`);
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    scrollToBottom();
    
    // Simulate message status updates
    setTimeout(() => {
      console.log(`${LOG_PREFIX} ✅ Message ${newMessage.id} status: sent`);
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'sent' } : m));
    }, 500);
    
    setTimeout(() => {
      console.log(`${LOG_PREFIX} ✅✅ Message ${newMessage.id} status: delivered`);
      setMessages(prev => prev.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' } : m));
    }, 1000);
    
    console.log(`${LOG_PREFIX} 📤 ========== SEND MESSAGE END ==========`);
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    
    if (!isTyping) {
      console.log(`${LOG_PREFIX} ⌨️ Started typing...`);
      setIsTyping(true);
      socketService.emit('typing', { recipientId, isTyping: true });
    }
    
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    
    typingTimeout.current = setTimeout(() => {
      console.log(`${LOG_PREFIX} ⌨️ Stopped typing`);
      setIsTyping(false);
      socketService.emit('typing', { recipientId, isTyping: false });
    }, 2000);
  };

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  };

  // ✅ Helper function to get user status text
  const getUserStatusText = () => {
    if (recipientTyping) {
      // ✅ AVANT: 'يكتب...'
      return t('chat.typing');
    }
    if (isOnline) {
      // ✅ AVANT: 'متصل الآن'
      return t('chat.online');
    }
    // ✅ AVANT: 'غير متصل'
    return t('chat.offline');
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id || item.senderId === 'me';
    const showAvatar = !isMe && (index === 0 || messages[index - 1].senderId !== item.senderId);
    
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && showAvatar && (
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{recipientName?.charAt(0) || '👤'}</Text>
          </View>
        )}
        {!isMe && !showAvatar && <View style={styles.avatarPlaceholder} />}
        
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>{item.text}</Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMe && styles.messageTimeMe]}>{formatTime(item.timestamp)}</Text>
            {isMe && (
              <Text style={styles.messageStatus}>
                {item.status === 'sending' && '🕐'}
                {item.status === 'sent' && '✓'}
                {item.status === 'delivered' && '✓✓'}
                {item.status === 'read' && '✓✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  console.log(`${LOG_PREFIX} 🎨 Rendering UI (${messages.length} messages)...`);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={[COLORS.primary, '#2E7D32']} style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            console.log(`${LOG_PREFIX} 🔙 Back button pressed`);
            navigation.goBack();
          }}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.userInfo} 
          onPress={() => {
            console.log(`${LOG_PREFIX} 👤 Navigate to UserProfile: ${recipientId}`);
            navigation.navigate('UserProfile', { userId: recipientId });
          }}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{recipientName?.charAt(0) || '👤'}</Text>
          </View>
          <View style={styles.userDetails}>
            {/* ✅ AVANT: {recipientName || 'مستخدم'} */}
            <Text style={styles.userName}>{recipientName || t('common.user')}</Text>
            <Text style={styles.userStatus}>{getUserStatusText()}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => {
              console.log(`${LOG_PREFIX} 📞 Navigate to ChatAudio`);
              navigation.navigate('ChatAudio', { recipientId, recipientName });
            }}
          >
            <Text style={styles.headerButtonIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => {
              console.log(`${LOG_PREFIX} 📹 Navigate to ChatVideo`);
              navigation.navigate('ChatVideo', { recipientId, recipientName });
            }}
          >
            <Text style={styles.headerButtonIcon}>📹</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
      />

      {/* Typing Indicator */}
      {recipientTyping && (
        <View style={styles.typingIndicator}>
          {/* ✅ AVANT: '{recipientName} يكتب...' */}
          <Text style={styles.typingText}>{recipientName} {t('chat.isTyping')}</Text>
        </View>
      )}

      {/* Input Container */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={() => console.log(`${LOG_PREFIX} 📎 Attach button pressed`)}
          >
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              // ✅ AVANT: 'اكتب رسالتك...'
              placeholder={t('chat.placeholder')}
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={handleTextChange}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity 
              style={styles.emojiButton}
              onPress={() => console.log(`${LOG_PREFIX} 😊 Emoji button pressed`)}
            >
              <Text style={styles.emojiIcon}>😊</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <LinearGradient 
              colors={inputText.trim() ? [COLORS.primary, '#2E7D32'] : ['#ccc', '#aaa']}
              style={styles.sendButtonGradient}
            >
              <Text style={styles.sendIcon}>➤</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12 },
  backButton: { padding: 8 },
  backIcon: { color: '#fff', fontSize: 24 },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, color: '#fff' },
  userDetails: { marginLeft: 12 },
  userName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  userStatus: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  headerActions: { flexDirection: 'row' },
  headerButton: { padding: 10, marginLeft: 5 },
  headerButtonIcon: { fontSize: 22 },
  messagesList: { padding: 15, paddingBottom: 10 },
  messageRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  messageRowMe: { justifyContent: 'flex-end' },
  avatarSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  avatarSmallText: { color: '#fff', fontSize: 14 },
  avatarPlaceholder: { width: 40 },
  messageBubble: { maxWidth: width * 0.75, padding: 12, borderRadius: 18 },
  messageBubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  messageBubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, elevation: 1 },
  messageText: { fontSize: 16, color: '#333', lineHeight: 22 },
  messageTextMe: { color: '#fff' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  messageTime: { fontSize: 11, color: '#999' },
  messageTimeMe: { color: 'rgba(255,255,255,0.7)' },
  messageStatus: { marginLeft: 4, fontSize: 12 },
  typingIndicator: { paddingHorizontal: 20, paddingVertical: 8 },
  typingText: { color: '#666', fontSize: 12, fontStyle: 'italic' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  attachButton: { padding: 10 },
  attachIcon: { fontSize: 22 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#f5f5f5', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 8, marginHorizontal: 8 },
  input: { flex: 1, fontSize: 16, maxHeight: 100, color: '#333' },
  emojiButton: { padding: 5 },
  emojiIcon: { fontSize: 22 },
  sendButton: { borderRadius: 25, overflow: 'hidden' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonGradient: { width: 45, height: 45, justifyContent: 'center', alignItems: 'center' },
  sendIcon: { color: '#fff', fontSize: 20 },
});