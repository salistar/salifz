/**
 * Progress Store - Salifz
 * Manages Quran memorization progress
 */

import { create } from 'zustand';
import { progressAPI, quranAPI, unwrapProgress } from '../services/api';

interface SurahProgress {
  surahNumber: number;
  surahName: string;
  surahNameArabic: string;
  totalAyat: number;
  ayatMemorized: number;
  ayatMastered: number;
  progressPercentage: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  masteryStars: {
    memorization: number;
    tajwid: number;
    fluency: number;
  };
}

interface ReviewItem {
  surahNumber: number;
  surahName: string;
  ayah: number;
  confidence: number;
}

interface ProgressState {
  // Overall stats
  totalVersesMemorized: number;
  totalVersesMastered: number;
  surahsStarted: number;
  surahsCompleted: number;
  surahsMastered: number;
  totalTimeSpent: number;
  
  // Current progress
  currentSurah: number;
  currentAyah: number;
  
  // Surah data
  surahs: any[];
  surahProgress: Map<number, SurahProgress>;
  
  // Review
  reviewQueue: ReviewItem[];
  
  // Loading
  isLoading: boolean;
  error: string | null;

  // Actions
  loadOverview: () => Promise<void>;
  loadSurahs: () => Promise<void>;
  loadSurahProgress: (surahNumber: number) => Promise<SurahProgress | null>;
  updateVerseStatus: (surahNumber: number, ayahNumber: number, status: string, tajwidScore?: number) => Promise<void>;
  loadReviewQueue: () => Promise<void>;
  recordSession: (data: { surahNumber: number; duration: number; versesStudied: number[]; type: string; xpEarned: number }) => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  totalVersesMemorized: 0,
  totalVersesMastered: 0,
  surahsStarted: 0,
  surahsCompleted: 0,
  surahsMastered: 0,
  totalTimeSpent: 0,
  currentSurah: 1,
  currentAyah: 1,
  surahs: [],
  surahProgress: new Map(),
  reviewQueue: [],
  isLoading: false,
  error: null,

  loadOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await progressAPI.getProgress();
      // `response.data` peut être un tableau ou un objet selon l'endpoint :
      // la déstructuration directe donnait `undefined` puis un crash sur
      // `progress.totalVersesMemorized`.
      const { overview } = unwrapProgress(response);
      const progress = overview ?? {};

      set({
        totalVersesMemorized: progress.totalVersesMemorized || 0,
        totalVersesMastered: progress.totalVersesMastered || 0,
        surahsStarted: progress.surahsStarted || 0,
        surahsCompleted: progress.surahsCompleted || 0,
        surahsMastered: progress.surahsMastered || 0,
        totalTimeSpent: progress.totalTimeSpent || 0,
        currentSurah: progress.currentSurah || 1,
        currentAyah: progress.currentAyah || 1,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load progress',
      });
    }
  },

  loadSurahs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await quranAPI.getSurahs();
      set({
        surahs: response.data.surahs,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load surahs',
      });
    }
  },

  loadSurahProgress: async (surahNumber: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await progressAPI.getSurahProgress(surahNumber);
      // Le serveur renvoie la progression d'une seule sourate ; `ProgressData`
      // est la forme brute de l'API, `SurahProgress` la vue qu'en a l'écran.
      const progress = unwrapProgress(response).list[0] as unknown as SurahProgress | undefined;

      if (!progress) {
        set({ isLoading: false });
        return null;
      }

      const { surahProgress } = get();
      surahProgress.set(surahNumber, progress);

      set({
        surahProgress: new Map(surahProgress),
        isLoading: false,
      });

      return progress;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load surah progress',
      });
      return null;
    }
  },

  updateVerseStatus: async (surahNumber, ayahNumber, status, tajwidScore) => {
    set({ isLoading: true, error: null });
    try {
      await progressAPI.updateProgress({
        surahId: surahNumber,
        ayahId: ayahNumber,
        quality: status === 'mastered' ? 5 : status === 'memorized' ? 4 : 3,
        timeSpent: 0,
      });
      
      // Reload surah progress
      await get().loadSurahProgress(surahNumber);
      
      // Update totals
      if (status === 'memorized' || status === 'mastered') {
        set({
          totalVersesMemorized: get().totalVersesMemorized + 1,
          ...(status === 'mastered' && {
            totalVersesMastered: get().totalVersesMastered + 1,
          }),
        });
      }
      
      set({ isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to update verse',
      });
      throw error;
    }
  },

  loadReviewQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await progressAPI.getReviewQueue();
      set({
        reviewQueue: response.data.reviewQueue || [],
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load review queue',
      });
    }
  },

  recordSession: async (data) => {
    try {
      await progressAPI.recordSession(data);
      
      // Update time spent
      set({
        totalTimeSpent: get().totalTimeSpent + data.duration,
      });
    } catch (error: any) {
      console.error('Record session error:', error);
    }
  },
}));