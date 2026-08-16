/**
 * Auth Store - Salifz
 * ✅ FIXED: Proper async token handling
 * ✅ FIXED: Wait for all storage operations
 * ✅ FIXED: Socket initialization on login/register/loadUser
 * ✅ FIXED: Socket disconnect on logout
 * ✅ FIXED: Proper error handling
 * ✅ FIXED: checkAuth() returns FALSE on 401 (JWT expired)
 * ✅ FIXED: Better 401 detection (checks error.response AND error.status)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { initializeToken } from '../services/api';
import { initializeSocket, disconnectSocket } from '../services/socket';

const LOG_PREFIX = '[AUTH]';

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

// ✅ Helper: Check if error is a 401 Unauthorized
const is401Error = (error: any): boolean => {
  // Check multiple places where status might be
  const status = 
    error?.response?.status || 
    error?.status || 
    error?.statusCode ||
    error?.response?.statusCode;
  
  // Also check error message for "401" or "unauthorized" or "expired"
  const errorMessage = (
    error?.message || 
    error?.response?.data?.error || 
    error?.response?.data?.message ||
    ''
  ).toLowerCase();
  
  const is401 = status === 401 || 
    errorMessage.includes('401') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid token') ||
    errorMessage.includes('jwt expired') ||
    errorMessage.includes('token expired') ||
    errorMessage.includes('expired');
  
  if (is401) {
    console.log(`${LOG_PREFIX} 🔍 Detected 401 error - status: ${status}, message: ${errorMessage}`);
  }
  
  return is401;
};

// ✅ Helper: Check if error is a network error (no internet)
const isNetworkError = (error: any): boolean => {
  // Network error = no response from server at all
  const hasNoResponse = !error?.response;
  const isNetworkMessage = (error?.message || '').toLowerCase().includes('network');
  
  return hasNoResponse && isNetworkMessage;
};

// ✅ Helper: Clear all auth data
const clearAuthData = async () => {
  console.log(`${LOG_PREFIX} 🗑️ Clearing all auth data...`);
  try {
    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    if (api.setToken) {
      api.setToken(null);
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
    console.log(`${LOG_PREFIX} ✅ Auth data cleared`);
  } catch (e) {
    console.error(`${LOG_PREFIX} ❌ Error clearing auth data:`, e);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ============================================
      // LOAD USER
      // ============================================
      loadUser: async () => {
        console.log(`${LOG_PREFIX} 👤 Loading user...`);
        set({ isLoading: true });
        
        try {
          const hasToken = await initializeToken();
          
          if (!hasToken) {
            console.log(`${LOG_PREFIX} ⚠️ No token found`);
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
            console.log(`${LOG_PREFIX} ✅ User loaded:`, user.username);
            
            // ✅ Initialize socket after loading user
            setTimeout(() => {
              console.log(`${LOG_PREFIX} Initializing socket for loaded user...`);
              initializeSocket(user._id || user.id);
            }, 500);
            
            return true;
          }
          
          set({ isLoading: false, isAuthenticated: false });
          return false;
        } catch (error: any) {
          console.error(`${LOG_PREFIX} Load user error:`, error?.response?.data || error?.message);
          
          // ✅ FIXED: Use helper to detect 401
          if (is401Error(error)) {
            console.log(`${LOG_PREFIX} ⚠️ Token EXPIRED in loadUser - clearing auth`);
            await clearAuthData();
            set({ 
              user: null, 
              token: null, 
              refreshToken: null,
              isLoading: false, 
              isAuthenticated: false,
              error: 'Session expired'
            });
            return false;
          }
          
          set({ isLoading: false, isAuthenticated: false });
          return false;
        }
      },

      // ============================================
      // LOGIN
      // ============================================
      login: async (emailOrUsername: string, password: string) => {
        console.log(`${LOG_PREFIX} 🔐 Login attempt for:`, emailOrUsername);
        set({ isLoading: true, error: null });
        
        try {
          const response: any = await api.post('/auth/login', { 
            emailOrUsername, 
            password,
            // Also send as 'identifier' for backend compatibility
            identifier: emailOrUsername 
          });
          
          console.log(`${LOG_PREFIX} Login response received`);
          
          const token = response?.token || response?.data?.token;
          const refreshTokenValue = response?.refreshToken || response?.data?.refreshToken;
          const user = response?.user || response?.data?.user || response?.data;
          
          if (!token) {
            console.error(`${LOG_PREFIX} ❌ No token in response:`, response);
            throw new Error('No token received from server');
          }
          
          if (!user) {
            console.error(`${LOG_PREFIX} ❌ No user in response:`, response);
            throw new Error('No user data received from server');
          }
          
          console.log(`${LOG_PREFIX} Token received, saving...`);
          
          // ✅ Save token BEFORE setting in API
          await AsyncStorage.setItem('token', token);
          console.log(`${LOG_PREFIX} Token saved to storage`);
          
          if (refreshTokenValue) {
            await AsyncStorage.setItem('refreshToken', refreshTokenValue);
          }
          
          await AsyncStorage.setItem('user', JSON.stringify(user));
          console.log(`${LOG_PREFIX} User saved to storage`);
          
          // ✅ Set token in axios headers
          if (api.setToken) {
            api.setToken(token);
          } else {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
          console.log(`${LOG_PREFIX} Token set in API headers`);
          
          // ✅ Update state
          set({
            user,
            token,
            refreshToken: refreshTokenValue || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log(`${LOG_PREFIX} ✅ Login successful:`, user.username);
          
          // ✅ Verify token is set
          const storedToken = await AsyncStorage.getItem('token');
          console.log(`${LOG_PREFIX} Token verification:`, storedToken ? 'OK' : 'FAILED');
          
          // ✅ Initialize socket after successful login
          setTimeout(() => {
            console.log(`${LOG_PREFIX} Initializing socket after login...`);
            initializeSocket(user._id || user.id);
          }, 500);
          
          return true;
        } catch (error: any) {
          const errorMessage = error?.response?.data?.error || error?.message || error?.error || 'Login failed';
          console.error(`${LOG_PREFIX} ❌ Login error:`, errorMessage);
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },

      // ============================================
      // REGISTER
      // ============================================
      register: async (data) => {
        console.log(`${LOG_PREFIX} 📝 Register attempt for:`, data.email);
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
          if (api.setToken) {
            api.setToken(token);
          } else {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
          
          set({
            user,
            token,
            refreshToken: refreshTokenValue || null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          console.log(`${LOG_PREFIX} ✅ Registration successful:`, user.username);
          
          // ✅ Initialize socket after successful registration
          setTimeout(() => {
            console.log(`${LOG_PREFIX} Initializing socket after registration...`);
            initializeSocket(user._id || user.id);
          }, 500);
          
          return true;
        } catch (error: any) {
          const errorMessage = error?.response?.data?.error || error?.message || error?.error || 'Registration failed';
          console.error(`${LOG_PREFIX} ❌ Registration error:`, errorMessage);
          set({ isLoading: false, error: errorMessage });
          return false;
        }
      },

      // ============================================
      // LOGOUT
      // ============================================
      logout: async () => {
        console.log(`${LOG_PREFIX} 🚪 Logging out...`);
        
        // ✅ Disconnect socket before logout
        try {
          console.log(`${LOG_PREFIX} Disconnecting socket...`);
          disconnectSocket();
        } catch (e) {
          console.log(`${LOG_PREFIX} Socket disconnect error (ignored):`, e);
        }
        
        try {
          await api.post('/auth/logout').catch(() => {});
        } catch (e) {
          // Ignore
        }
        
        // ✅ Clear all auth data
        await clearAuthData();
        
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
        
        console.log(`${LOG_PREFIX} ✅ Logged out successfully`);
      },

      // ============================================
      // REFRESH AUTH
      // ============================================
      refreshAuth: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          console.log(`${LOG_PREFIX} No refresh token available`);
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
            
            if (api.setToken) {
              api.setToken(newToken);
            } else {
              api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            }
            
            set({
              token: newToken,
              refreshToken: newRefreshToken || refreshToken,
            });
            
            console.log(`${LOG_PREFIX} ✅ Token refreshed`);
            return true;
          }
          
          return false;
        } catch (error: any) {
          console.error(`${LOG_PREFIX} ❌ Token refresh failed:`, error);
          
          // ✅ If refresh fails, logout
          await get().logout();
          return false;
        }
      },

      // ============================================
      // UPDATE USER
      // ============================================
      updateUser: (data) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...data };
          AsyncStorage.setItem('user', JSON.stringify(updatedUser));
          set({ user: updatedUser });
        }
      },

      // ============================================
      // SET USER
      // ============================================
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
        if (user) {
          AsyncStorage.setItem('user', JSON.stringify(user));
        }
      },

      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // ============================================
      // CHECK AUTH - ✅ CRITICAL FIX FOR 401
      // ============================================
      checkAuth: async () => {
        console.log(`${LOG_PREFIX} 🔍 Checking auth...`);
        set({ isLoading: true });
        
        try {
          // Step 1: Initialize token from storage
          const hasToken = await initializeToken();
          
          if (!hasToken) {
            console.log(`${LOG_PREFIX} ⚠️ No token found in storage`);
            set({ isAuthenticated: false, isLoading: false, user: null });
            return false;
          }
          
          // Step 2: Get token from storage
          const token = await AsyncStorage.getItem('token');
          
          if (!token) {
            console.log(`${LOG_PREFIX} ⚠️ Token is null`);
            set({ isAuthenticated: false, isLoading: false, user: null });
            return false;
          }
          
          // Step 3: ✅ VERIFY token with server
          console.log(`${LOG_PREFIX} 📡 Verifying token with server...`);
          
          try {
            const response: any = await api.get('/users/me');
            const user = response?.data?.user || response?.user || response?.data || response;
            
            if (user && (user._id || user.id || user.username)) {
              await AsyncStorage.setItem('user', JSON.stringify(user));
              
              set({ 
                user, 
                token,
                isAuthenticated: true, 
                isLoading: false,
                error: null
              });
              
              console.log(`${LOG_PREFIX} ✅ Auth check successful:`, user.username);
              
              // ✅ Initialize socket after successful auth check
              setTimeout(() => {
                console.log(`${LOG_PREFIX} Initializing socket after auth check...`);
                initializeSocket(user._id || user.id);
              }, 500);
              
              return true;
            }
            
            // No valid user in response
            console.log(`${LOG_PREFIX} ⚠️ No valid user in response`);
            set({ isAuthenticated: false, isLoading: false });
            return false;
            
          } catch (apiError: any) {
            console.error(`${LOG_PREFIX} API error:`, apiError?.response?.data || apiError?.message);
            
            // ✅ CRITICAL FIX: Use helper function to detect 401
            if (is401Error(apiError)) {
              console.log(`${LOG_PREFIX} 🚫 401 Unauthorized - Token EXPIRED or INVALID`);
              console.log(`${LOG_PREFIX} 🗑️ Clearing expired token and returning FALSE`);
              
              // Clear all auth data
              await clearAuthData();
              
              set({ 
                user: null,
                token: null,
                refreshToken: null,
                isAuthenticated: false, 
                isLoading: false,
                error: 'Session expired. Please login again.'
              });
              
              // ✅ RETURN FALSE - This makes SplashScreen redirect to Login
              return false;
            }
            
            // ✅ Only for REAL network errors (no internet), try cached user
            if (isNetworkError(apiError)) {
              console.log(`${LOG_PREFIX} 📡 Real network error (no internet), trying cached user...`);
              const userJson = await AsyncStorage.getItem('user');
              
              if (userJson) {
                try {
                  const cachedUser = JSON.parse(userJson);
                  console.log(`${LOG_PREFIX} 📦 Using cached user (offline mode):`, cachedUser.username);
                  
                  set({ 
                    user: cachedUser, 
                    token,
                    isAuthenticated: true, 
                    isLoading: false 
                  });
                  
                  // Initialize socket with cached user
                  setTimeout(() => {
                    initializeSocket(cachedUser._id || cachedUser.id);
                  }, 500);
                  
                  return true;
                } catch (parseError) {
                  console.error(`${LOG_PREFIX} ❌ Error parsing cached user`);
                }
              }
            }
            
            // ✅ All other errors - NOT authenticated, clear and redirect to login
            console.log(`${LOG_PREFIX} ❌ Unknown API error, clearing auth`);
            await clearAuthData();
            set({ 
              isAuthenticated: false, 
              isLoading: false,
              user: null,
              token: null
            });
            return false;
          }
          
        } catch (error: any) {
          console.error(`${LOG_PREFIX} ❌ Check auth error:`, error);
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