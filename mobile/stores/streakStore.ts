/**
 * Streak Store - Salifz
 * Manages streak state and history
 */

import { create } from 'zustand';
import { streaksAPI } from '../services/api';

interface StreakDay {
  date: string;
  completed: boolean;
  froze: boolean;
  xpEarned: number;
}

interface Milestone {
  days: number;
  reachedAt: string;
  rewardClaimed: boolean;
}

interface StreakUpdateResult {
  streakUpdated: boolean;
  streakBroken: boolean;
  freezeUsed: boolean;
  newMilestones: Milestone[];
}

interface StreakState {
  current: number;
  longest: number;
  lastActivityDate: string | null;
  freezesAvailable: number;
  freezesUsed: number;
  calendar: StreakDay[];
  milestones: Milestone[];
  unclaimedMilestones: Milestone[];
  nextMilestone: {
    days: number;
    remaining: number;
    reward: {
      xp: number;
      gems: number;
      streakFreeze: number;
    };
  } | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadStreak: () => Promise<void>;
  // ✅ FIXED: Return type now matches implementation
  updateStreak: (data: { xp?: number; versesMemorized?: number; versesReviewed?: number }) => Promise<StreakUpdateResult | undefined>;
  useFreeze: () => Promise<boolean>;
  buyFreeze: () => Promise<boolean>;
  claimMilestone: (days: number) => Promise<any>;
}

export const useStreakStore = create<StreakState>((set, get) => ({
  current: 0,
  longest: 0,
  lastActivityDate: null,
  freezesAvailable: 2,
  freezesUsed: 0,
  calendar: [],
  milestones: [],
  unclaimedMilestones: [],
  nextMilestone: null,
  isLoading: false,
  error: null,

  loadStreak: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await streaksAPI.getStreak();
      const { streak, calendar, milestones, unclaimedMilestones, nextMilestone } = response.data;
      
      set({
        current: streak.current,
        longest: streak.longest,
        lastActivityDate: streak.lastActivityDate,
        freezesAvailable: streak.freezesAvailable,
        freezesUsed: streak.freezesUsed,
        calendar,
        milestones,
        unclaimedMilestones,
        nextMilestone,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load streak',
      });
    }
  },

  updateStreak: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await streaksAPI.updateStreak();
      const { streak, streakUpdated, streakBroken, freezeUsed, newMilestones } = response.data;
      
      set({
        current: streak.current,
        longest: streak.longest,
        freezesAvailable: streak.freezesAvailable,
        lastActivityDate: new Date().toISOString(),
        isLoading: false,
      });
      
      // Reload full data to get updated calendar
      await get().loadStreak();
      
      return { streakUpdated, streakBroken, freezeUsed, newMilestones };
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to update streak',
      });
      // Return undefined on error instead of throwing
      return undefined;
    }
  },

  useFreeze: async () => {
    const { freezesAvailable } = get();
    if (freezesAvailable <= 0) return false;
    
    set({ isLoading: true, error: null });
    try {
      await streaksAPI.useFreeze();
      set({
        freezesAvailable: freezesAvailable - 1,
        freezesUsed: get().freezesUsed + 1,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to use freeze',
      });
      return false;
    }
  },

  buyFreeze: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await streaksAPI.buyFreeze();
      set({
        freezesAvailable: response.data.freezesAvailable,
        isLoading: false,
      });
      return true;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to buy freeze',
      });
      return false;
    }
  },

  claimMilestone: async (days: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await streaksAPI.claimMilestone(days);
      
      // Update milestones
      const { milestones, unclaimedMilestones } = get();
      const updatedMilestones = milestones.map(m => 
        m.days === days ? { ...m, rewardClaimed: true } : m
      );
      const updatedUnclaimed = unclaimedMilestones.filter(m => m.days !== days);
      
      set({
        milestones: updatedMilestones,
        unclaimedMilestones: updatedUnclaimed,
        isLoading: false,
      });
      
      return response.data.rewards;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to claim milestone',
      });
      throw error;
    }
  },
}));