/**
 * Notifications Store - Salifz
 * Manages in-app notifications
 */
import { create } from 'zustand';
import { notificationsAPI } from '../services/api';

interface Notification {
  _id: string;
  type: string;
  title: {
    ar: string;
    en: string;
  };
  body: {
    ar: string;
    en: string;
  };
  icon: string;
  isRead: boolean;
  action?: {
    screen: string;
    params?: any;
  };
  metadata?: any;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;

  // Actions
  fetchNotifications: () => Promise<void>;
  loadNotifications: (page?: number) => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  clearNotifications: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  hasMore: true,
  currentPage: 1,

  fetchNotifications: async () => {
    await get().loadNotifications(1);
  },

  loadNotifications: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const response = await notificationsAPI.getNotifications(page, 20);
      const { notifications, pagination } = response.data;

      set({
        notifications: page === 1 ? notifications : [...get().notifications, ...notifications],
        unreadCount: notifications.filter((n: Notification) => !n.isRead).length,
        hasMore: pagination?.hasMore ?? notifications.length === 20,
        currentPage: page,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load notifications',
      });
    }
  },

  loadMore: async () => {
    const { hasMore, currentPage, isLoading } = get();
    if (!hasMore || isLoading) return;

    await get().loadNotifications(currentPage + 1);
  },

  markAsRead: async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);

      set({
        notifications: get().notifications.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch (error: any) {
      console.error('Mark as read error:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsAPI.markAllAsRead();

      set({
        notifications: get().notifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0,
      });
    } catch (error: any) {
      console.error('Mark all as read error:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set({
      notifications: [notification, ...get().notifications],
      unreadCount: get().unreadCount + 1,
    });
  },

  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
      hasMore: true,
      currentPage: 1,
    });
  },
}));

export default useNotificationsStore;