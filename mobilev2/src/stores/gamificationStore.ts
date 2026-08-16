/**
 * Gamification Store - Salifz
 * Manages XP, Hearts, League, Gems state
 */

import { create } from 'zustand';
import { rewardsAPI, leaderboardAPI } from '../services/api';

interface GamificationState {
  // XP & Level
  totalXP: number;
  weeklyXP: number;
  dailyXP: number;
  level: number;
  xpToNextLevel: number;
  
  // Hearts
  hearts: number;
  maxHearts: number;
  heartsLastRefill: Date | null;
  
  // Streak
  streak: number;
  longestStreak: number;
  streakFreezes: number;
  
  // League
  league: string;
  leagueRank: number;
  promotionZone: boolean;
  demotionZone: boolean;
  
  // Currency
  gems: number;
  coins: number;
  
  // Daily Reward
  canClaimDaily: boolean;
  dailyRewardStreak: number;
  
  // Loading
  isLoading: boolean;
  
  // Actions
  syncWithUser: (user: any) => void;
  addXP: (amount: number) => void;
  addXp: (amount: number) => void;
  useHeart: () => boolean;
  loseHeart: () => boolean;
  refillHearts: () => void;
  useStreakFreeze: () => boolean;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  updateStreak: (newStreak: number) => void;
  loadLeaderboard: () => Promise<any>;
  claimDailyReward: () => Promise<any>;
  checkDailyReward: () => Promise<void>;
}

// Calculate level from XP
const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

// Calculate XP needed for next level
const calculateXPToNextLevel = (currentLevel: number): number => {
  return Math.pow(currentLevel, 2) * 100;
};

export const useGamificationStore = create<GamificationState>((set, get) => ({
  // Initial state
  totalXP: 0,
  weeklyXP: 0,
  dailyXP: 0,
  level: 1,
  xpToNextLevel: 100,
  
  hearts: 5,
  maxHearts: 5,
  heartsLastRefill: null,
  
  streak: 0,
  longestStreak: 0,
  streakFreezes: 2,
  
  league: 'bronze',
  leagueRank: 0,
  promotionZone: false,
  demotionZone: false,
  
  gems: 100,
  coins: 0,
  
  canClaimDaily: true,
  dailyRewardStreak: 0,
  
  isLoading: false,

  syncWithUser: (user: any) => {
    if (!user?.gamification) return;

    const g = user.gamification;
    set({
      totalXP: g.totalXP || 0,
      weeklyXP: g.weeklyXP || 0,
      dailyXP: g.dailyXP || 0,
      level: g.level || 1,
      xpToNextLevel: calculateXPToNextLevel(g.level || 1),
      hearts: g.hearts?.current ?? 5,
      maxHearts: g.hearts?.max ?? 5,
      heartsLastRefill: g.hearts?.lastRefill ? new Date(g.hearts.lastRefill) : null,
      streak: g.currentStreak || 0,
      longestStreak: g.longestStreak || 0,
      streakFreezes: g.streakFreezes?.available ?? 2,
      league: g.league || 'bronze',
      leagueRank: g.leagueRank || 0,
      promotionZone: g.promotionZone || false,
      demotionZone: g.demotionZone || false,
      gems: g.gems || 100,
      coins: g.coins || 0,
    });
  },

  addXP: (amount: number) => {
    const { totalXP, level } = get();
    const newTotalXP = totalXP + amount;
    const newLevel = calculateLevel(newTotalXP);
    
    set({
      totalXP: newTotalXP,
      weeklyXP: get().weeklyXP + amount,
      dailyXP: get().dailyXP + amount,
      level: newLevel,
      xpToNextLevel: calculateXPToNextLevel(newLevel),
    });
    
    return newLevel > level;
  },

  // Alias pour addXP (utilisé dans certains écrans)
  addXp: (amount: number) => {
    get().addXP(amount);
  },

  // Alias pour loseHeart (utilisé dans LessonDetailScreen)
  useHeart: () => {
    return get().loseHeart();
  },

  loseHeart: () => {
    const { hearts } = get();
    if (hearts <= 0) return false;
    
    set({ hearts: hearts - 1 });
    return true;
  },

  refillHearts: () => {
    const { maxHearts } = get();
    set({
      hearts: maxHearts,
      heartsLastRefill: new Date(),
    });
  },

  useStreakFreeze: () => {
    const { streakFreezes } = get();
    if (streakFreezes <= 0) return false;
    
    set({ streakFreezes: streakFreezes - 1 });
    return true;
  },

  addGems: (amount: number) => {
    set({ gems: get().gems + amount });
  },

  spendGems: (amount: number) => {
    const { gems } = get();
    if (gems < amount) return false;
    
    set({ gems: gems - amount });
    return true;
  },

  updateStreak: (newStreak: number) => {
    const { longestStreak } = get();
    set({
      streak: newStreak,
      longestStreak: Math.max(longestStreak, newStreak),
    });
  },

  loadLeaderboard: async () => {
    set({ isLoading: true });
    try {
      const response = await leaderboardAPI.getLeague();
      return response.data;
    } catch (error) {
      console.error('Load leaderboard error:', error);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  claimDailyReward: async () => {
    try {
      const response = await rewardsAPI.claimDailyReward();
      const { reward, newBalance } = response.data;
      
      set({
        gems: newBalance.gems,
        streakFreezes: newBalance.streakFreezes ?? get().streakFreezes,
        canClaimDaily: false,
      });
      
      return reward;
    } catch (error) {
      console.error('Claim daily reward error:', error);
      throw error;
    }
  },

  checkDailyReward: async () => {
    try {
      const response = await rewardsAPI.getDailyReward();
      set({
        canClaimDaily: response.data.canClaim,
        dailyRewardStreak: response.data.streak || 0,
      });
    } catch (error) {
      console.error('Check daily reward error:', error);
    }
  },
}));

export default useGamificationStore;