/**
 * Auth Store - Salifz
 * ✅ FIXED: Proper async token handling
 * ✅ FIXED: Wait for all storage operations
 * ✅ FIXED: Socket initialization on login/register/loadUser
 * ✅ FIXED: Socket disconnect on logout
 * ✅ FIXED: Proper error handling
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { initializeToken } from '../services/api';
import { initializeSocket, disconnectSocket } from '../services/socket';

interface User {
  _id?: string;
  id?: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  avatarCustomization?: {
    outfit: string;
    accessory: string;
    background: string;
  };
  profile?: {
    gender?: string;
    ageGroup?: string;
    country?: string;
    timezone?: string;
    language?: string;
    preferredReciter?: string;
    dailyGoal?: number;
    notificationsEnabled?: boolean;
    reminderTime?: string;
  };
  gamification?: {
    totalXP?: number;
    weeklyXP?: number;
    dailyXP?: number;
    level?: number;
    currentStreak?: number;
    longestStreak?: number;
    hearts?: { current: number; max: number };
    gems?: number;
    coins?: number;
    league?: string;
    leagueRank?: number;
  };
  quranProgress?: {
    totalVersesMemorized?: number;
    totalJuzCompleted?: number;
    totalSurahCompleted?: number;
    currentSurah?: number;
    currentAyah?: number;
    avgTajwidScore?: number;
  };
  subscription?: {
    plan?: string;
    status?: string;
  };
  dailyQuests?: {
    date?: string;
    quests?: any[];
  };
  league?: {
    current?: string;
    rank?: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadUser: () => Promise<boolean>;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  register: (data: { email: string; username: string; password: string; displayName?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateUser: (data: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loadUser: async () => {
        set({ isLoading: true });
        try {
          const hasToken = await initializeToken();
          
          if (!hasToken) {
            set({ isLoading: false, isAuthenticated: false });
            return false;
          }
          
          const response: any = await api.get('/users/me');
          const user = response?.data?.user || response?.user || response?.data || response;
          
          if (user && (user._id || user.id)) {
            await AsyncStorage.setItem('user', JSON.stringify(user));
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false,
              error: null 
            });
            console.log('[AUTH] User loaded:', user.username);
            
            // ✅ Initialize socket after loading user
            setTimeout(() => {
              console.log('[AUTH] Initializing socket for loaded user...');
              initializeSocket(user._id || user.id);
            }, 500);
            
            return true;
          }
          
          set({ isLoading: false, isAuthenticated: false });
          return false;
        } catch (error: any) {
          console.error('[AUTH] Load user error:', error);
          set({ isLoading: false, isAuthenticated: false });
          return false;
        }
      },

      login: async (emailOrUsername: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response: any = await api.post('/auth/login', { emailOrUsername, password });
          
          console.log('[AUTH] Login response received');
          
          const token = response?.token || response?.data?.token;
          const refreshTokenValue = response?.refreshToken || response?.data?.refreshToken;
          const user = response?.user || response?.data?.user || response?.data;
          
          if (!token) {
            console.error('[AUTH] No token in response:', response);
            throw new Error('No token received from server');
          }
          
          if (!user) {
            console.error('[AUTH] No user in response:', response);
            throw new Error('No user data received from server');
          }
          
          console.log('[AUTH] Token received, saving...');
          
          // ✅ Save token BEFORE setting in API
          await AsyncStorage.setItem('token', token);
          console.log('[AUTH] Token saved to storage');
          
          if (refreshTokenValue) {
            await AsyncStorage.setItem('refreshToken', refreshTokenValue);
          }
          
          await AsyncStorage.setItem('user', JSON.stringify(user));
          console.log('[AUTH] User saved to storage');
          
          // ✅ Set token in axios headers
          api.setToken(token);
          console.log('[AUTH] Token set in API headers');
          
          // ✅ Update state
          set({
            user,
            token,
            refreshToken: refreshTokenValue || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log('[AUTH] Login successful:', user.username);
          
          // ✅ Verify token is set
          const storedToken = await AsyncStorage.getItem('token');
          console.log('[AUTH] Token verification:', storedToken ? 'OK' : 'FAILED');
          
          // ✅ Initialize socket after successful login
          setTimeout(() => {
            console.log('[AUTH] Initializing socket after login...');
            initializeSocket(user._id || user.id);
          }, 500);
          
          return true;
        } catch (error: any) {
          const errorMessage = error?.message || error?.error || 'Login failed';
          console.error('[AUTH] Login error:', errorMessage);
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response: any = await api.post('/auth/register', data);
          
          const token = response?.token || response?.data?.token;
          const refreshTokenValue = response?.refreshToken || response?.data?.refreshToken;
          const user = response?.user || response?.data?.user || response?.data;
          
          if (!token || !user) {
            throw new Error('Invalid registration response');
          }
          
          // ✅ Save in correct order
          await AsyncStorage.setItem('token', token);
          if (refreshTokenValue) {
            await AsyncStorage.setItem('refreshToken', refreshTokenValue);
          }
          await AsyncStorage.setItem('user', JSON.stringify(user));
          
          // ✅ Set token in API
          api.setToken(token);
          
          set({
            user,
            token,
            refreshToken: refreshTokenValue || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log('[AUTH] Registration successful:', user.username);
          
          // ✅ Initialize socket after successful registration
          setTimeout(() => {
            console.log('[AUTH] Initializing socket after registration...');
            initializeSocket(user._id || user.id);
          }, 500);
          
          return true;
        } catch (error: any) {
          const errorMessage = error?.message || error?.error || 'Registration failed';
          console.error('[AUTH] Registration error:', errorMessage);
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },

      logout: async () => {
        console.log('[AUTH] Logging out...');
        
        // ✅ Disconnect socket before logout
        try {
          console.log('[AUTH] Disconnecting socket...');
          disconnectSocket();
        } catch (e) {
          console.log('[AUTH] Socket disconnect error (ignored):', e);
        }
        
        try {
          await api.post('/auth/logout').catch(() => {});
        } catch (e) {
          // Ignore
        }
        
        // ✅ Clear token
        api.setToken(null);
        
        // ✅ Clear storage
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
        
        console.log('[AUTH] Logged out successfully');
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          console.log('[AUTH] No refresh token available');
          return false;
        }
        
        try {
          const response: any = await api.post('/auth/refresh', { refreshToken });
          
          const newToken = response?.token || response?.data?.token;
          const newRefreshToken = response?.refreshToken || response?.data?.refreshToken;
          
          if (newToken) {
            await AsyncStorage.setItem('token', newToken);
            if (newRefreshToken) {
              await AsyncStorage.setItem('refreshToken', newRefreshToken);
            }
            
            api.setToken(newToken);
            
            set({
              token: newToken,
              refreshToken: newRefreshToken || refreshToken,
            });
            
            console.log('[AUTH] Token refreshed');
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('[AUTH] Token refresh failed:', error);
          await get().logout();
          return false;
        }
      },

      updateUser: (data) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...data };
          AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          set({ user: updatedUser });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
        if (user) {
          AsyncStorage.setItem('user', JSON.stringify(user));
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      checkAuth: async () => {
        set({ isLoading: true });
        
        try {
          const hasToken = await initializeToken();
          
          if (!hasToken) {
            set({ isAuthenticated: false, isLoading: false });
            return false;
          }
          
          // Load user from storage
          const userJson = await AsyncStorage.getItem('user');
          const token = await AsyncStorage.getItem('token');
          
          if (userJson && token) {
            try {
              const user = JSON.parse(userJson);
              set({ 
                user, 
                token,
                isAuthenticated: true, 
                isLoading: false 
              });
              
              // ✅ Initialize socket after auth check
              setTimeout(() => {
                console.log('[AUTH] Initializing socket after auth check...');
                initializeSocket(user._id || user.id);
              }, 500);
              
              // Refresh in background
              get().loadUser().catch(() => {});
              return true;
            } catch (e) {
              // Invalid JSON
            }
          }
          
          // Load from API
          const response: any = await api.get('/users/me');
          const user = response?.data?.user || response?.user || response?.data || response;
          
          if (user && (user._id || user.id || user.username)) {
            await AsyncStorage.setItem('user', JSON.stringify(user));
            
            set({ 
              user, 
              token,
              isAuthenticated: true, 
              isLoading: false 
            });
            
            console.log('[AUTH] Auth check successful:', user.username);
            
            // ✅ Initialize socket after successful auth check
            setTimeout(() => {
              console.log('[AUTH] Initializing socket after successful auth check...');
              initializeSocket(user._id || user.id);
            }, 500);
            
            return true;
          }
          
          set({ isAuthenticated: false, isLoading: false });
          return false;
        } catch (error) {
          console.error('[AUTH] Check auth failed:', error);
          set({ isAuthenticated: false, isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

export default useAuthStore;