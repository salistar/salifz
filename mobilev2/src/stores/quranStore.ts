/**
 * Quran Store - Salifz
 * Gestion de l'état du Coran avec Zustand
 */

import { create } from 'zustand';
// Meme correction : les exports reels sont quranAPI et progressAPI.
import { quranAPI, progressAPI, unwrapProgress } from '../services/api';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  translation?: string;
  audioUrl?: string;
}

interface SurahProgress {
  surahNumber: number;
  memorizedCount: number;
  totalAyahs: number;
  percentComplete: number;
}

interface QuranState {
  surahs: Surah[];
  currentSurah: Surah | null;
  currentAyahs: Ayah[];
  surahProgress: { [key: number]: SurahProgress };
  isLoading: boolean;
  error: string | null;
  selectedReciter: string;

  // Actions
  fetchSurahs: () => Promise<void>;
  fetchSurah: (number: number) => Promise<void>;
  fetchProgress: () => Promise<void>;
  setReciter: (reciterId: string) => void;
  clearError: () => void;
}

export const useQuranStore = create<QuranState>((set, get) => ({
  surahs: [],
  currentSurah: null,
  currentAyahs: [],
  surahProgress: {},
  isLoading: false,
  error: null,
  selectedReciter: 'mishary_rashid',

  fetchSurahs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await quranAPI.getSurahs();
      if (response.success) {
        set({ surahs: response.data.surahs || response.data });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSurah: async (number: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await quranAPI.getSurah(number);
      if (response.success) {
        set({
          currentSurah: response.data.surah || response.data,
          currentAyahs: response.data.ayahs || response.data.verses || [],
        });
      }
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchProgress: async () => {
    try {
      const response = await progressAPI.getProgress();
      const { list } = unwrapProgress(response);
      if (list.length > 0) {
        const progressMap: { [key: number]: SurahProgress } = {};
        list.forEach((p: any) => {
          progressMap[p.surahNumber] = p;
        });
        set({ surahProgress: progressMap });
      }
    } catch (error: any) {
      console.error('[QURAN STORE] Error fetching progress:', error);
    }
  },

  setReciter: (reciterId: string) => {
    set({ selectedReciter: reciterId });
  },

  clearError: () => set({ error: null }),
}));

export default useQuranStore;
