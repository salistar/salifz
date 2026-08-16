/**
 * Socket Service - Salifz
 * ✅ CORRECTED: Uses ENV configuration from config/env.ts
 * ✅ FIXED: Silent warnings for non-critical events
 * ✅ FIXED: Auto-connect and reconnect logic
 * ✅ FIXED: Proper error handling and cleanup
 */

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config';

// ✅ FIXED: Use ENV configuration with fallback
const SOCKET_URL = ENV?.WS_URL || ENV?.API_URL?.replace('/api/v1', '') || 'http://localhost:8088';

console.log('🔌 Socket URL:', SOCKET_URL);

// ✅ Non-critical events that should fail silently
const SILENT_EVENTS = [
  'typing', 
  'stopTyping', 
  'joinHalaqa', 
  'leaveHalaqa', 
  'endCall', 
  'presence',
  'presence-update',
  'subscribeNotifications',
  'ping',
  'pong'
];

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;
  private userId: string | null = null;
  private connectionPromise: Promise<void> | null = null;

  /**
   * ✅ Connect with optional userId
   */
  async connect(userId?: string): Promise<void> {
    // Return existing promise if connection in progress
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Return if already connected
    if (this.socket?.connected) {
      console.log('[SOCKET] Already connected:', this.socket.id);
      if (userId && this.userId !== userId) {
        this.userId = userId;
        this.subscribeToNotifications(userId);
      }
      return Promise.resolve();
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log('[SOCKET] Connection already in progress...');
      return Promise.resolve();
    }

    if (!SOCKET_URL) {
      console.error('[SOCKET] Cannot connect: WS_URL is not defined');
      return Promise.resolve();
    }

    this.isConnecting = true;
    this.userId = userId || null;

    this.connectionPromise = new Promise(async (resolve) => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          console.log('[SOCKET] No token available, skipping connection');
          this.isConnecting = false;
          this.connectionPromise = null;
          resolve();
          return;
        }

        // Disconnect existing socket if any
        if (this.socket) {
          this.socket.removeAllListeners();
          this.socket.disconnect();
          this.socket = null;
        }

        console.log('[SOCKET] Connecting to:', SOCKET_URL);
        
        this.socket = io(SOCKET_URL, {
          auth: { token },
          query: userId ? { userId } : undefined,
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: ENV?.SOCKET_TIMEOUT || 10000,
          autoConnect: true,
          forceNew: true,
        });

        this.setupListeners();
        
        // Wait for connection or timeout
        const timeout = setTimeout(() => {
          console.log('[SOCKET] Connection timeout');
          this.isConnecting = false;
          this.connectionPromise = null;
          resolve();
        }, 10000);

        this.socket.once('connect', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.connectionPromise = null;
          resolve();
        });

        this.socket.once('connect_error', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.connectionPromise = null;
          resolve();
        });

      } catch (error) {
        console.error('[SOCKET] Connection error:', error);
        this.isConnecting = false;
        this.connectionPromise = null;
        resolve();
      }
    });

    return this.connectionPromise;
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SOCKET] ✅ Connected:', this.socket?.id);
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      
      // Subscribe to notifications if userId is available
      if (this.userId) {
        this.subscribeToNotifications(this.userId);
      }

      // Re-register all stored listeners
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          this.socket?.on(event, callback as any);
        });
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SOCKET] ❌ Disconnected:', reason);
      this.isConnecting = false;
      
      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        setTimeout(() => {
          if (!this.socket?.connected && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`[SOCKET] Reconnecting... attempt ${this.reconnectAttempts}`);
            this.socket?.connect();
          }
        }, 2000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SOCKET] Connection error:', error.message);
      this.reconnectAttempts++;
      this.isConnecting = false;
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('[SOCKET] ✅ Reconnected after', attemptNumber, 'attempts');
      this.reconnectAttempts = 0;
      
      // Re-subscribe after reconnect
      if (this.userId) {
        this.subscribeToNotifications(this.userId);
      }
    });

    this.socket.on('reconnect_failed', () => {
      console.log('[SOCKET] ❌ Reconnection failed after max attempts');
      this.isConnecting = false;
    });

    // Forward all events to registered listeners
    this.socket.onAny((event: string, ...args: any[]) => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.forEach(callback => {
          try {
            callback(...args);
          } catch (e) {
            console.error(`[SOCKET] Error in listener for ${event}:`, e);
          }
        });
      }
    });
  }

  /**
   * ✅ Disconnect and cleanup
   */
  disconnect(): void {
    console.log('[SOCKET] Disconnecting...');
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.userId = null;
    this.connectionPromise = null;
    console.log('[SOCKET] Disconnected');
  }

  /**
   * ✅ Manual reconnect
   */
  async reconnect(): Promise<void> {
    if (this.socket && !this.socket.connected) {
      console.log('[SOCKET] Manual reconnect...');
      this.socket.connect();
    } else if (!this.socket) {
      await this.connect(this.userId || undefined);
    }
  }

  // ============ PUBLIC METHODS FOR EVENT HANDLING ============
  
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
    
    if (this.socket?.connected) {
      this.socket.on(event, callback as any);
    }
  }

  off(event: string, callback?: Function): void {
    if (callback) {
      this.listeners.get(event)?.delete(callback);
      this.socket?.off(event, callback as any);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  emit(event: string, data?: any): boolean {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
      return true;
    } else {
      if (!SILENT_EVENTS.includes(event)) {
        console.warn('[SOCKET] Not connected, cannot emit:', event);
      }
      return false;
    }
  }

  // ============ CHAT ============
  
  joinRoom(roomId: string): void {
    this.emit('join-room', roomId);
  }

  leaveRoom(roomId: string): void {
    this.emit('leave-room', roomId);
  }

  sendMessage(roomId: string, content: string, type: string = 'text'): void {
    this.emit('send-message', { roomId, content, type });
  }

  onNewMessage(callback: (message: any) => void): void {
    this.on('new-message', callback);
  }

  sendTyping(data: { roomId: string; isTyping: boolean }): void {
    this.emit('typing', data);
  }

  onTyping(callback: (data: any) => void): void {
    this.on('user-typing', callback);
  }

  // ============ CONVERSATIONS ============

  joinConversation(conversationId: string): void {
    this.emit('joinConversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.emit('leaveConversation', { conversationId });
  }

  sendConversationMessage(conversationId: string, content: string, type: string = 'text'): void {
    this.emit('sendMessage', { conversationId, content, type });
  }

  markMessagesRead(conversationId: string): void {
    this.emit('markRead', { conversationId });
  }

  // ============ HALAQA ============
  
  joinHalaqa(halaqaId: string): void {
    this.emit('joinHalaqa', { halaqaId });
  }

  leaveHalaqa(halaqaId: string): void {
    this.emit('leaveHalaqa', { halaqaId });
  }

  sendHalaqaMessage(data: { halaqaId: string; message: string }): void {
    this.emit('halaqaMessage', data);
  }

  onHalaqaMessage(callback: (data: any) => void): void {
    this.on('halaqaMessage', callback);
  }

  onHalaqaActivity(callback: (data: any) => void): void {
    this.on('halaqaActivity', callback);
  }

  onHalaqaNewActivity(callback: (data: any) => void): void {
    this.on('halaqaNewActivity', callback);
  }

  onHalaqaMemberJoined(callback: (data: any) => void): void {
    this.on('halaqaMemberJoined', callback);
  }

  onHalaqaMemberLeft(callback: (data: any) => void): void {
    this.on('halaqaMemberLeft', callback);
  }

  // ============ CALLS ============
  
  initiateCall(data: { recipientId: string; type: 'audio' | 'video' }): void {
    this.emit('initiateCall', data);
  }

  acceptCall(data: { recipientId: string; callId?: string }): void {
    this.emit('acceptCall', data);
  }

  rejectCall(data: { recipientId: string; callId?: string }): void {
    this.emit('rejectCall', data);
  }

  endCall(data?: { recipientId?: string; callId?: string }): void {
    this.emit('endCall', data || {});
  }

  onIncomingCall(callback: (data: any) => void): void {
    this.on('incomingCall', callback);
  }

  onCallAccepted(callback: (data: any) => void): void {
    this.on('callAccepted', callback);
  }

  onCallRejected(callback: (data: any) => void): void {
    this.on('callRejected', callback);
  }

  onCallEnded(callback: (data: any) => void): void {
    this.on('callEnded', callback);
  }

  // ============ WEBRTC ============
  
  sendOffer(roomId: string, offer: any): void {
    this.emit('webrtc-offer', { roomId, offer });
  }

  sendAnswer(roomId: string, answer: any): void {
    this.emit('webrtc-answer', { roomId, answer });
  }

  sendIceCandidate(roomId: string, candidate: any): void {
    this.emit('webrtc-ice-candidate', { roomId, candidate });
  }

  onOffer(callback: (data: any) => void): void {
    this.on('webrtc-offer', callback);
  }

  onAnswer(callback: (data: any) => void): void {
    this.on('webrtc-answer', callback);
  }

  onIceCandidate(callback: (data: any) => void): void {
    this.on('webrtc-ice-candidate', callback);
  }

  // ============ PRESENCE ============
  
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    this.emit('presence-update', { status });
  }

  onUserPresence(callback: (data: { userId: string; status: string }) => void): void {
    this.on('user-presence', callback);
  }

  onUserOnline(callback: (data: { userId: string }) => void): void {
    this.on('userOnline', callback);
  }

  onUserOffline(callback: (data: { userId: string }) => void): void {
    this.on('userOffline', callback);
  }

  // ============ NOTIFICATIONS ============
  
  subscribeToNotifications(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('subscribeNotifications', { userId });
      console.log('[SOCKET] Subscribed to notifications for:', userId);
    }
  }

  onNotification(callback: (notification: any) => void): void {
    this.on('notification', callback);
  }

  // ============ UTILITIES ============
  
  removeAllListeners(): void {
    this.listeners.clear();
    this.socket?.removeAllListeners();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  getUserId(): string | null {
    return this.userId;
  }
}

// ✅ Export singleton instance
export const socketService = new SocketService();

// ✅ Export convenience functions
export const initializeSocket = async (userId?: string): Promise<void> => {
  try {
    await socketService.connect(userId);
  } catch (e) {
    console.error('[SOCKET] initializeSocket error:', e);
  }
};

export const disconnectSocket = (): void => {
  try {
    socketService.disconnect();
  } catch (e) {
    console.error('[SOCKET] disconnectSocket error:', e);
  }
};

export const isSocketConnected = (): boolean => socketService.isConnected();
export const getSocket = (): SocketService => socketService;

export default socketService;