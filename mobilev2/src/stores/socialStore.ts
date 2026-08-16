/**
 * Social Store - Salifz
 * Gestion des fonctionnalités sociales
 */

import { create } from 'zustand';
// pi.social et pi.halaqa n'existent pas : les exports d'api.ts
// s'appellent socialAPI et halaqaAPI. Ces appels echouaient a l'execution.
import { socialAPI, halaqaAPI } from '../services/api';

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  isOnline: boolean;
}

interface FriendRequest {
  id: string;
  from: Friend;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

interface Halaqa {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  isPublic: boolean;
}

interface SocialState {
  friends: Friend[];
  friendRequests: FriendRequest[];
  halaqat: Halaqa[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchFriends: () => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  fetchHalaqat: () => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<boolean>;
  rejectFriendRequest: (requestId: string) => Promise<boolean>;
  removeFriend: (friendId: string) => Promise<boolean>;
  joinHalaqa: (halaqaId: string) => Promise<boolean>;
  leaveHalaqa: (halaqaId: string) => Promise<boolean>;
  clearError: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  friends: [],
  friendRequests: [],
  halaqat: [],
  isLoading: false,
  error: null,

  fetchFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await socialAPI.getFriends();
      if (response.success) {
        set({ friends: response.data.friends || [] });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchFriendRequests: async () => {
    try {
      const response = await socialAPI.getFriendRequests();
      if (response.success) {
        set({ friendRequests: response.data.requests || [] });
      }
    } catch (error: any) {
      console.error('[SOCIAL] Error fetching requests:', error);
    }
  },

  fetchHalaqat: async () => {
    try {
      const response = await halaqaAPI.getMyHalaqat();
      if (response.success) {
        set({ halaqat: response.data.halaqat || [] });
      }
    } catch (error: any) {
      console.error('[SOCIAL] Error fetching halaqat:', error);
    }
  },

  sendFriendRequest: async (userId: string) => {
    try {
      const response = await socialAPI.sendFriendRequest(userId);
      return response.success;
    } catch {
      return false;
    }
  },

  acceptFriendRequest: async (requestId: string) => {
    try {
      const response = await socialAPI.acceptFriendRequest(requestId);
      if (response.success) {
        await get().fetchFriends();
        await get().fetchFriendRequests();
      }
      return response.success;
    } catch {
      return false;
    }
  },

  rejectFriendRequest: async (requestId: string) => {
    try {
      const response = await socialAPI.rejectFriendRequest(requestId);
      if (response.success) {
        await get().fetchFriendRequests();
      }
      return response.success;
    } catch {
      return false;
    }
  },

  removeFriend: async (friendId: string) => {
    try {
      const response = await socialAPI.removeFriend(friendId);
      if (response.success) {
        set({ friends: get().friends.filter(f => f.id !== friendId) });
      }
      return response.success;
    } catch {
      return false;
    }
  },

  joinHalaqa: async (halaqaId: string) => {
    try {
      const response = await halaqaAPI.join(halaqaId);
      if (response.success) {
        await get().fetchHalaqat();
      }
      return response.success;
    } catch {
      return false;
    }
  },

  leaveHalaqa: async (halaqaId: string) => {
    try {
      const response = await halaqaAPI.leave(halaqaId);
      if (response.success) {
        set({ halaqat: get().halaqat.filter(h => h.id !== halaqaId) });
      }
      return response.success;
    } catch {
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useSocialStore;
