/**
 * API Service - Salifz v3
 * ✅ COMPLETE: All endpoints with console.log
 * ✅ FIXED: TypeScript types corrected
 * ✅ FIXED: progressAPI with saveProgress, saveBlockProgress
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureItem, setSecureItem, clearTokens, TOKEN_KEY, REFRESH_TOKEN_KEY } from './secureStorage';
import { ENV } from '../config';

const FILE_NAME = '[API]';
const API_URL = ENV.API_URL;

console.log(`${FILE_NAME} 📁 File loaded`);
console.log(`${FILE_NAME} 🌐 API URL: ${API_URL}`);

// ✅ Token en mémoire
let authToken: string | null = null;
let justLoggedIn: boolean = false;

// Types
interface ProgressData {
  surahId: number;
  ayahId: number;
  blockId?: string;
  completed?: boolean;
  xpEarned?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ProgressResponse {
  success?: boolean;
  progress?: ProgressData[];
  total?: number;
  saved?: number;
  // Le serveur renvoie plusieurs formes selon l'endpoint : la liste des
  // sourates pour /progress, un agrégat pour l'aperçu, un seul élément pour
  // /progress/:surah. Le type ne décrivait que deux d'entre elles, ce qui
  // faisait échouer la compilation des stores qui lisent `data.quranProgress`
  // ou `data.progress`.
  data?:
    | ProgressData[]
    | {
        progress?: ProgressData[] | ProgressData | ProgressOverview;
        quranProgress?: ProgressOverview;
      };
}

/** Agrégat de progression affiché sur l'accueil et le profil. */
export interface ProgressOverview {
  totalVersesMemorized?: number;
  totalVersesMastered?: number;
  surahsStarted?: number;
  surahsCompleted?: number;
  [key: string]: any;
}

/**
 * Normalise les formes de réponse de /progress en une structure unique.
 * Les stores lisaient `response.data.progress` sans vérifier que `data`
 * n'était pas déjà un tableau — ce qui donnait `undefined` selon l'endpoint.
 */
export function unwrapProgress(response: ProgressResponse): {
  list: ProgressData[];
  overview: ProgressOverview | null;
} {
  const payload = response?.data;

  if (Array.isArray(payload)) {
    return { list: payload, overview: null };
  }

  if (payload && typeof payload === 'object') {
    const inner = payload.progress;
    return {
      list: Array.isArray(inner) ? inner : inner ? [inner as ProgressData] : [],
      overview:
        (payload.quranProgress as ProgressOverview) ??
        (!Array.isArray(inner) && inner ? (inner as ProgressOverview) : null),
    };
  }

  return { list: response?.progress ?? [], overview: null };
}

interface CustomAxiosInstance extends AxiosInstance {
  setToken: (token: string | null) => void;
}

// Créer l'instance axios
const api = axios.create({
  baseURL: API_URL,
  timeout: ENV.API_TIMEOUT || 15000,
  headers: { 'Content-Type': 'application/json' }
}) as CustomAxiosInstance;

console.log(`${FILE_NAME} ✅ Axios instance created`);

// ✅ Fonction setToken
api.setToken = (token: string | null): void => {
  console.log(`${FILE_NAME} 🔐 setToken() called`);
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    justLoggedIn = true;
    setTimeout(() => { justLoggedIn = false; }, 5000);
    console.log(`${FILE_NAME} ✅ Token set in API headers`);
  } else {
    delete api.defaults.headers.common['Authorization'];
    console.log(`${FILE_NAME} 🔓 Token cleared from API`);
  }
};

// ✅ Initialiser le token depuis le storage
export const initializeToken = async (): Promise<boolean> => {
  console.log(`${FILE_NAME} 🔐 initializeToken() called`);
  try {
    const token = await getSecureItem(TOKEN_KEY);
    if (token) {
      authToken = token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log(`${FILE_NAME} ✅ Token initialized from storage`);
      return true;
    }
    console.log(`${FILE_NAME} ⚠️ No token found in storage`);
    return false;
  } catch (error) {
    console.error(`${FILE_NAME} ❌ Error initializing token:`, error);
    return false;
  }
};

// ✅ Request interceptor
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
    console.log(`${FILE_NAME} 📤 REQUEST: ${config.method?.toUpperCase()} ${config.url}`);
    
    if (!authToken) {
      try {
        const token = await getSecureItem(TOKEN_KEY);
        if (token) {
          authToken = token;
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log(`${FILE_NAME} 🔐 Token recovered from storage`);
        }
      } catch (e) {
        // Silent fail
      }
    }
    
    if (authToken && config.headers) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    return config;
  },
  (error: Error) => {
    console.error(`${FILE_NAME} ❌ Request error:`, error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse): any => {
    console.log(`${FILE_NAME} 📥 RESPONSE: ${response.status} ${response.config.url}`);
    return response.data;
  },
  async (error: any): Promise<any> => {
    console.error(`${FILE_NAME} ❌ RESPONSE ERROR: ${error.response?.status} ${error.config?.url}`);
    
    const isAuthRequest = error.config?.url?.includes('/auth/login') || 
                          error.config?.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !isAuthRequest && !justLoggedIn) {
      console.log(`${FILE_NAME} 🚫 401 Unauthorized - Token may be invalid`);
    }
    
    // Auparavant : `Promise.reject(error.response?.data || { error: error.message })`.
    // Le corps de réponse seul ne porte ni le code HTTP ni `response`, si bien
    // que `is401Error` et `isNetworkError` du magasin d'authentification
    // retombaient tous deux sur « erreur inconnue ». Le 401 finissait par être
    // traité correctement, par hasard — mais une coupure réseau prenait le même
    // chemin et déconnectait l'utilisateur au lieu de lui servir ses données en
    // cache. Le mode hors ligne était donc du code mort.
    //
    // On conserve `error` et les autres champs du corps, dont dépendent les
    // écrans, et on rétablit ce qui manquait pour décider.
    const body = error.response?.data;
    return Promise.reject({
      ...(typeof body === 'object' && body !== null ? body : {}),
      status: error.response?.status ?? null,
      // Certains appelants lisent `.error`, d'autres `.message` : les deux
      // pointent vers la même explication.
      message: body?.error ?? body?.message ?? error.message,
      error: body?.error ?? body?.message ?? error.message,
      // Forme proche de celle d'axios, pour tout code qui l'attend.
      response: error.response ? { status: error.response.status, data: body } : undefined,
    });
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  register: async (data: { username: string; email: string; password: string }): Promise<any> => {
    console.log(`${FILE_NAME} 📝 authAPI.register() called`);
    const response: any = await api.post('/auth/register', data);
    const token = response?.token || response?.data?.token;
    if (token) {
      authToken = token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await setSecureItem(TOKEN_KEY, token);
      justLoggedIn = true;
      setTimeout(() => { justLoggedIn = false; }, 5000);
      console.log(`${FILE_NAME} ✅ Token saved after register`);
    }
    return response;
  },
  
  login: async (data: { emailOrUsername: string; password: string }): Promise<any> => {
    console.log(`${FILE_NAME} 🔑 authAPI.login() called`);
    const response: any = await api.post('/auth/login', data);
    const token = response?.token || response?.data?.token;
    if (token) {
      authToken = token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      justLoggedIn = true;
      setTimeout(() => { justLoggedIn = false; }, 5000);
      setSecureItem(TOKEN_KEY, token).catch(console.error);
      console.log(`${FILE_NAME} ✅ Token set after login`);
    } else {
      console.error(`${FILE_NAME} ❌ No token in login response`);
    }
    return response;
  },
  
  getMe: (): Promise<any> => {
    console.log(`${FILE_NAME} 👤 authAPI.getMe() called`);
    return api.get('/users/me');
  },
  
  updateProfile: (data: any): Promise<any> => {
    console.log(`${FILE_NAME} 📝 authAPI.updateProfile() called`);
    return api.put('/users/me', data);
  },
  
  logout: async (): Promise<any> => {
    console.log(`${FILE_NAME} 🚪 authAPI.logout() called`);
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore errors
    }
    authToken = null;
    justLoggedIn = false;
    delete api.defaults.headers.common['Authorization'];
    await Promise.all([clearTokens(), AsyncStorage.removeItem('user')]);
    console.log(`${FILE_NAME} ✅ Logged out, token cleared`);
    return { success: true };
  },
  
  forgotPassword: (email: string): Promise<any> => {
    console.log(`${FILE_NAME} 📧 authAPI.forgotPassword() called`);
    return api.post('/auth/forgot-password', { email });
  },
  
  resetPassword: (token: string, password: string): Promise<any> => {
    console.log(`${FILE_NAME} 🔒 authAPI.resetPassword() called`);
    return api.post('/auth/reset-password', { token, password });
  },
    
  refresh: async (refreshToken: string): Promise<any> => {
    console.log(`${FILE_NAME} 🔄 authAPI.refresh() called`);
    const response: any = await api.post('/auth/refresh', { refreshToken });
    const token = response?.token || response?.data?.token;
    if (token) {
      authToken = token;
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await setSecureItem(TOKEN_KEY, token);
      console.log(`${FILE_NAME} ✅ Token refreshed`);
    }
    return response;
  },
};

// ============================================
// PROGRESS API - ✅ COMPLETE WITH SAVE
// ============================================
const LOCAL_PROGRESS_KEY = 'salifz_progress';

// Helper: Get local progress
const getLocalProgress = async (): Promise<ProgressResponse> => {
  console.log(`${FILE_NAME} 📂 getLocalProgress() called`);
  try {
    const stored = await AsyncStorage.getItem(LOCAL_PROGRESS_KEY);
    if (stored) {
      const data: ProgressData[] = JSON.parse(stored);
      console.log(`${FILE_NAME} ✅ Local progress: ${data.length} entries`);
      return { success: true, progress: data };
    }
    console.log(`${FILE_NAME} ⚠️ No local progress`);
    return { success: true, progress: [] };
  } catch (error) {
    console.error(`${FILE_NAME} ❌ getLocalProgress ERROR:`, error);
    return { success: false, progress: [] };
  }
};

// Helper: Save local progress
const saveLocalProgress = async (progressData: ProgressData): Promise<ProgressResponse> => {
  console.log(`${FILE_NAME} 📂 saveLocalProgress() called`);
  console.log(`${FILE_NAME} 📦 Data:`, JSON.stringify(progressData));
  
  try {
    const stored = await AsyncStorage.getItem(LOCAL_PROGRESS_KEY);
    const existing: ProgressData[] = stored ? JSON.parse(stored) : [];
    console.log(`${FILE_NAME} 📊 Existing: ${existing.length} entries`);
    
    const existingIndex = existing.findIndex(
      (p: ProgressData) => p.surahId === progressData.surahId && p.ayahId === progressData.ayahId
    );
    
    if (existingIndex >= 0) {
      console.log(`${FILE_NAME} 🔄 Updating entry at index ${existingIndex}`);
      existing[existingIndex] = { ...existing[existingIndex], ...progressData, updatedAt: new Date().toISOString() };
    } else {
      console.log(`${FILE_NAME} ➕ Adding new entry`);
      existing.push({ ...progressData, createdAt: new Date().toISOString() });
    }
    
    await AsyncStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(existing));
    console.log(`${FILE_NAME} ✅ Saved locally: ${existing.length} total`);
    
    return { success: true, total: existing.length };
  } catch (error) {
    console.error(`${FILE_NAME} ❌ saveLocalProgress ERROR:`, error);
    return { success: false };
  }
};

export const progressAPI = {
  // ✅ Get all progress
  getProgress: async (): Promise<ProgressResponse> => {
    console.log(`${FILE_NAME} 📥 progressAPI.getProgress() called`);
    
    // Always get local progress first
    const localData = await getLocalProgress();
    const localProgress = localData.progress || [];
    console.log(`${FILE_NAME} 📂 Local progress: ${localProgress.length} entries`);
    
    try {
      console.log(`${FILE_NAME} 🌐 GET /progress/overview`);
      const response: any = await api.get('/progress/overview');
      const backendProgress = response?.progress || response?.data?.progress || response?.data || [];
      
      if (Array.isArray(backendProgress) && backendProgress.length > 0) {
        console.log(`${FILE_NAME} ✅ Backend progress: ${backendProgress.length} entries`);
        // Merge backend with local (backend takes priority)
        const merged = [...backendProgress];
        localProgress.forEach((lp: ProgressData) => {
          const exists = merged.some((bp: ProgressData) => 
            bp.surahId === lp.surahId && bp.ayahId === lp.ayahId
          );
          if (!exists) {
            merged.push(lp);
          }
        });
        console.log(`${FILE_NAME} 📊 Merged progress: ${merged.length} entries`);
        return { success: true, progress: merged };
      } else {
        console.log(`${FILE_NAME} ⚠️ Backend returned empty, using local`);
        return { success: true, progress: localProgress };
      }
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ getProgress ERROR:`, error.message || error);
      console.log(`${FILE_NAME} 📂 Using local storage only`);
      return { success: true, progress: localProgress };
    }
  },

  // ✅ Get surah progress
  getSurahProgress: async (surahNumber: number): Promise<ProgressResponse> => {
    console.log(`${FILE_NAME} 📥 progressAPI.getSurahProgress(${surahNumber}) called`);
    console.log(`${FILE_NAME} 🌐 GET /progress/surah/${surahNumber}`);
    
    try {
      const response: any = await api.get(`/progress/surah/${surahNumber}`);
      const progressData = response?.progress || response?.data?.progress || [];
      console.log(`${FILE_NAME} ✅ Surah ${surahNumber} progress received`);
      return { success: true, progress: progressData };
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ getSurahProgress ERROR:`, error.message || error);
      // Return from local
      const local = await getLocalProgress();
      const surahProgress = (local.progress || []).filter((p: ProgressData) => p.surahId === surahNumber);
      console.log(`${FILE_NAME} 📂 Local surah progress: ${surahProgress.length} entries`);
      return { success: true, progress: surahProgress };
    }
  },

  // ✅ Save progress for ayah
  saveProgress: async (data: ProgressData): Promise<ProgressResponse> => {
    console.log(`${FILE_NAME} 💾 progressAPI.saveProgress() called`);
    console.log(`${FILE_NAME} 📦 Data:`, JSON.stringify(data));
    console.log(`${FILE_NAME} 🌐 POST /progress/surah/${data.surahId}/verse/${data.ayahId}`);
    
    try {
      const response: any = await api.post(`/progress/surah/${data.surahId}/verse/${data.ayahId}`, {
        status: 'memorized',
        blockId: data.blockId,
        completed: data.completed ?? true,
        xpEarned: data.xpEarned || 0,
        completedAt: new Date().toISOString(),
      });
      console.log(`${FILE_NAME} ✅ Backend save SUCCESS`);
      
      // Also save locally
      await saveLocalProgress(data);
      
      return { success: true, ...response };
    } catch (error: any) {
      console.error(`${FILE_NAME} ❌ saveProgress ERROR:`, error.message || error);
      console.log(`${FILE_NAME} ⚠️ Saving locally only`);
      return await saveLocalProgress(data);
    }
  },

  // ✅ Save entire block
  saveBlockProgress: async (
    surahId: number,
    blockId: string,
    startAyah: number,
    endAyah: number,
    xpEarned: number
  ): Promise<ProgressResponse> => {
    console.log(`${FILE_NAME} 💾 progressAPI.saveBlockProgress() called`);
    console.log(`${FILE_NAME} 📦 Block ${blockId}: ayahs ${startAyah}-${endAyah}, XP: ${xpEarned}`);
    
    const results: ProgressResponse[] = [];
    const xpPerAyah = Math.floor(xpEarned / (endAyah - startAyah + 1));
    console.log(`${FILE_NAME} 📊 XP per ayah: ${xpPerAyah}`);
    
    for (let ayah = startAyah; ayah <= endAyah; ayah++) {
      console.log(`${FILE_NAME} 💾 Saving ayah ${ayah}...`);
      const result = await progressAPI.saveProgress({
        surahId,
        ayahId: ayah,
        blockId,
        completed: true,
        xpEarned: xpPerAyah,
      });
      results.push(result);
      console.log(`${FILE_NAME} ✅ Ayah ${ayah} saved`);
    }
    
    console.log(`${FILE_NAME} ✅ Block complete: ${results.length} ayahs saved`);
    return { success: true, saved: results.length };
  },

  // ✅ Check if block completed
  isBlockCompleted: async (surahId: number, blockId: string, ayahCount: number): Promise<boolean> => {
    console.log(`${FILE_NAME} 🔍 progressAPI.isBlockCompleted(${blockId})`);
    
    try {
      const progressResponse = await progressAPI.getSurahProgress(surahId);
      const progressList = progressResponse.progress || [];
      const blockProgress = progressList.filter((p: ProgressData) => p.blockId === blockId);
      const completed = blockProgress.length >= ayahCount;
      
      console.log(`${FILE_NAME} 📊 Block ${blockId}: ${blockProgress.length}/${ayahCount}`);
      console.log(`${FILE_NAME} ${completed ? '✅' : '❌'} Block ${completed ? 'COMPLETED' : 'INCOMPLETE'}`);
      
      return completed;
    } catch (error) {
      console.error(`${FILE_NAME} ❌ isBlockCompleted ERROR:`, error);
      return false;
    }
  },

  // ✅ Get completed blocks
  getCompletedBlocks: async (surahId: number): Promise<string[]> => {
    console.log(`${FILE_NAME} 📥 progressAPI.getCompletedBlocks(${surahId})`);
    
    try {
      const progressResponse = await progressAPI.getSurahProgress(surahId);
      const progressList = progressResponse.progress || [];
      const blockIds = [...new Set(
        progressList.map((p: ProgressData) => p.blockId).filter((id): id is string => !!id)
      )];
      
      console.log(`${FILE_NAME} ✅ Completed blocks: ${blockIds.length}`);
      return blockIds;
    } catch (error) {
      console.error(`${FILE_NAME} ❌ getCompletedBlocks ERROR:`, error);
      return [];
    }
  },

  // Legacy: Update progress
  updateProgress: async (data: { surahId: number; ayahId: number; quality: number; timeSpent: number }): Promise<any> => {
    console.log(`${FILE_NAME} 📝 progressAPI.updateProgress() called`);
    return api.post(`/progress/surah/${data.surahId}/verse/${data.ayahId}`, {
      status: data.quality >= 4 ? 'memorized' : 'learning',
      tajwidScore: data.quality * 20,
    });
  },

  // Get review queue
  getReviewQueue: async (): Promise<any> => {
    console.log(`${FILE_NAME} 📥 progressAPI.getReviewQueue() called`);
    return api.get('/progress/review-queue');
  },

  // Record session
  recordSession: async (data: any): Promise<any> => {
    console.log(`${FILE_NAME} 📝 progressAPI.recordSession() called`);
    return api.post('/progress/session', data);
  },

  // Get daily goals
  getDailyGoals: async (): Promise<any> => {
    console.log(`${FILE_NAME} 📥 progressAPI.getDailyGoals() called`);
    const res: any = await api.get('/users/me');
    return {
      data: {
        ayahsCompleted: res?.user?.gamification?.dailyXP || res?.gamification?.dailyXP || 0,
        ayahsTarget: res?.user?.profile?.dailyGoal || res?.profile?.dailyGoal || 5,
        xpEarned: res?.user?.gamification?.dailyXP || res?.gamification?.dailyXP || 0,
        xpTarget: 100,
        quests: res?.user?.dailyQuests?.quests || res?.dailyQuests?.quests || []
      }
    };
  },

  // Update daily goal
  updateDailyGoal: async (goal: number): Promise<any> => {
    console.log(`${FILE_NAME} 📝 progressAPI.updateDailyGoal(${goal}) called`);
    return api.put('/users/me', { 'profile.dailyGoal': goal });
  },

  // Reset progress (testing)
  resetProgress: async (): Promise<ProgressResponse> => {
    console.log(`${FILE_NAME} 🗑️ progressAPI.resetProgress() called`);
    try {
      await AsyncStorage.removeItem(LOCAL_PROGRESS_KEY);
      console.log(`${FILE_NAME} ✅ Local progress reset`);
      return { success: true };
    } catch (error) {
      console.error(`${FILE_NAME} ❌ resetProgress ERROR:`, error);
      return { success: false };
    }
  },
};

// ============================================
// QURAN API
// ============================================

/**
 * Validation des recitations par l'enseignant.
 * `submit` envoie un FormData : on laisse axios poser lui-meme la frontiere
 * multipart, forcer le Content-Type casserait l'upload.
 */
export const recitationsAPI = {
  submit: (form: FormData): Promise<any> => {
    console.log(`${FILE_NAME} 🎙️ recitationsAPI.submit() called`);
    return api.post('/recitations', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
  },
  mine: (): Promise<any> => api.get('/recitations/mine'),
  pending: (halaqaId: string): Promise<any> => api.get(`/recitations/pending/${halaqaId}`),
  review: (id: string, payload: any): Promise<any> => api.post(`/recitations/${id}/review`, payload),
};

/**
 * Suivi de recitation : le serveur transcrit l'extrait et le compare au verset.
 *
 * A ne pas confondre avec `recitationsAPI` ci-dessus (envoi a un enseignant)
 * ni avec l'analyse du tajwid : ici on constate quels mots ont ete prononces,
 * pas la maniere de les prononcer.
 */
/** Photo de profil. */
export const avatarAPI = {
  /** Envoie une nouvelle photo (uri locale du téléphone). */
  televerser: (uri: string): Promise<any> => {
    const form = new FormData();
    form.append('avatar', {
      uri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    } as any);
    return api.post('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  },
  /** URL publique de la photo d'un utilisateur (cache-bust par horodatage). */
  url: (userId: string): string => `${API_URL}/avatar/${userId}?v=${Date.now()}`,
};

export const recitationLiveAPI = {
  /** Le moteur est-il joignable ? Sert a masquer l'entree plutot qu'a offrir un bouton qui echouera. */
  etat: (): Promise<any> => api.get('/recitation-live/etat'),

  /**
   * `partiel` a true pendant la recitation : les mots pas encore dits sont
   * rendus « en_attente ». A false pour le verdict, ou ils deviennent
   * « oublie ».
   *
   * Le delai est plus court en direct : un extrait qui tarde n'a plus d'objet,
   * mieux vaut abandonner celui-la et suivre le suivant.
   */
  suivre: (form: FormData, partiel: boolean): Promise<any> => {
    console.log(`${FILE_NAME} 🎙️ recitationLiveAPI.suivre(partiel=${partiel})`);
    return api.post('/recitation-live/suivre', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: partiel ? 15000 : 60000,
    });
  },
};

export const quranAPI = {
  getSurahs: (): Promise<any> => {
    console.log(`${FILE_NAME} 📥 quranAPI.getSurahs() called`);
    return api.get('/quran/surahs');
  },
  getSurah: (surahId: number): Promise<any> => {
    console.log(`${FILE_NAME} 📥 quranAPI.getSurah(${surahId}) called`);
    return api.get(`/quran/surahs/${surahId}`);
  },
  getJuz: (juzNumber: number): Promise<any> => {
    console.log(`${FILE_NAME} 📥 quranAPI.getJuz(${juzNumber}) called`);
    return api.get(`/quran/juz/${juzNumber}`);
  },
  search: (query: string): Promise<any> => {
    console.log(`${FILE_NAME} 🔍 quranAPI.search("${query}") called`);
    return api.get(`/quran/search?q=${encodeURIComponent(query)}`);
  },
  getReciters: (): Promise<any> => {
    console.log(`${FILE_NAME} 📥 quranAPI.getReciters() called`);
    return api.get('/quran/reciters');
  },

  /** Page du Mushaf de Médine (1 à 604), découpée ligne par ligne. */
  getPage: (page: number): Promise<any> => {
    console.log(`${FILE_NAME} 📖 quranAPI.getPage(${page}) called`);
    return api.get(`/quran/page/${page}`);
  },

  /** Page sur laquelle se trouve un verset donné. */
  getPageOfVerse: (surah: number, ayah: number): Promise<any> => {
    console.log(`${FILE_NAME} 📖 quranAPI.getPageOfVerse(${surah}:${ayah}) called`);
    return api.get(`/quran/page-of/${surah}/${ayah}`);
  },

  /** Traduction mot-à-mot d'un verset. */
  getWordByWord: (surah: number, ayah: number): Promise<any> => {
    console.log(`${FILE_NAME} 🔤 quranAPI.getWordByWord(${surah}:${ayah}) called`);
    return api.get(`/quran/word-by-word/${surah}/${ayah}`);
  },
};

// ============================================
// GAMIFICATION API
// ============================================
export const gamificationAPI = {
  getStats: async (): Promise<any> => {
    console.log(`${FILE_NAME} 📥 gamificationAPI.getStats() called`);
    const res: any = await api.get('/users/me');
    return { data: res?.user?.gamification || res?.gamification || {} };
  },
  addXP: (amount: number): Promise<any> => {
    console.log(`${FILE_NAME} ⚡ gamificationAPI.addXP(${amount}) called`);
    return api.post('/gamification/add-xp', { amount });
  },
  getHearts: (): Promise<any> => {
    console.log(`${FILE_NAME} ❤️ gamificationAPI.getHearts() called`);
    return api.get('/gamification/hearts');
  },
  refillHearts: (): Promise<any> => {
    console.log(`${FILE_NAME} ❤️ gamificationAPI.refillHearts() called`);
    return api.post('/gamification/hearts/refill');
  },
  useHeart: (): Promise<any> => {
    console.log(`${FILE_NAME} 💔 gamificationAPI.useHeart() called`);
    return api.post('/gamification/hearts/use');
  },
  getLevel: (): Promise<any> => {
    console.log(`${FILE_NAME} 📊 gamificationAPI.getLevel() called`);
    return api.get('/gamification/level');
  },
};

// ============================================
// STREAKS API
// ============================================
export const streaksAPI = {
  getStreak: (): Promise<any> => {
    console.log(`${FILE_NAME} 🔥 streaksAPI.getStreak() called`);
    return api.get('/streaks');
  },
  updateStreak: (): Promise<any> => {
    console.log(`${FILE_NAME} 🔥 streaksAPI.updateStreak() called`);
    return api.post('/streaks/update');
  },
  useFreeze: (): Promise<any> => {
    console.log(`${FILE_NAME} 🧊 streaksAPI.useFreeze() called`);
    return api.post('/streaks/freeze');
  },
  buyFreeze: (): Promise<any> => {
    console.log(`${FILE_NAME} 🧊 streaksAPI.buyFreeze() called`);
    return api.post('/streaks/buy-freeze');
  },
  claimMilestone: (days: number): Promise<any> => {
    console.log(`${FILE_NAME} 🏆 streaksAPI.claimMilestone(${days}) called`);
    return api.post(`/streaks/milestones/${days}/claim`);
  },
};

// ============================================
// CHALLENGES API
// ============================================
export const challengesAPI = {
  getChallenges: (): Promise<any> => {
    console.log(`${FILE_NAME} 📥 challengesAPI.getChallenges() called`);
    return api.get('/challenges');
  },
  getAll: (): Promise<any> => api.get('/challenges'),
  getDaily: (): Promise<any> => {
    console.log(`${FILE_NAME} 📥 challengesAPI.getDaily() called`);
    return api.get('/challenges/daily');
  },
  getActiveChallenge: (period: 'daily' | 'weekly' | 'monthly'): Promise<any> => {
    console.log(`${FILE_NAME} 📥 challengesAPI.getActiveChallenge("${period}") called`);
    return api.get(`/challenges/${period}`);
  },
  startChallenge: (challengeId: string): Promise<any> => {
    console.log(`${FILE_NAME} ▶️ challengesAPI.startChallenge("${challengeId}") called`);
    return api.post(`/challenges/${challengeId}/start`);
  },
  updateProgress: (challengeId: string, progress: number): Promise<any> => {
    console.log(`${FILE_NAME} 📊 challengesAPI.updateProgress("${challengeId}", ${progress}) called`);
    return api.put(`/challenges/${challengeId}/progress`, { progress });
  },
  claimReward: (challengeId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🎁 challengesAPI.claimReward("${challengeId}") called`);
    return api.post(`/challenges/${challengeId}/claim`);
  },
  complete: (challengeId: string): Promise<any> => {
    console.log(`${FILE_NAME} ✅ challengesAPI.complete("${challengeId}") called`);
    return api.post(`/challenges/${challengeId}/complete`);
  },
};

// ============================================
// HALAQA API
// ============================================
export const halaqaAPI = {
  getHalaqat: (): Promise<any> => {
    console.log(`${FILE_NAME} 📥 halaqaAPI.getHalaqat() called`);
    return api.get('/halaqa');
  },
  getAll: (): Promise<any> => api.get('/halaqa'),
  getMyHalaqat: (): Promise<any> => api.get('/halaqa'),
  
  discoverHalaqat: (params?: any): Promise<any> => {
    console.log(`${FILE_NAME} 🔍 halaqaAPI.discoverHalaqat() called`);
    return api.get('/halaqa/discover', { params });
  },
  discover: (params?: any): Promise<any> => api.get('/halaqa/discover', { params }),
  
  getHalaqa: (halaqaId: string): Promise<any> => {
    console.log(`${FILE_NAME} 📥 halaqaAPI.getHalaqa("${halaqaId}") called`);
    return api.get(`/halaqa/${halaqaId}`);
  },
  getById: (halaqaId: string): Promise<any> => api.get(`/halaqa/${halaqaId}`),
  
  createHalaqa: (data: any): Promise<any> => {
    console.log(`${FILE_NAME} ➕ halaqaAPI.createHalaqa() called`);
    return api.post('/halaqa', data);
  },
  create: (data: any): Promise<any> => api.post('/halaqa', data),
  
  updateHalaqa: (halaqaId: string, data: any): Promise<any> => {
    console.log(`${FILE_NAME} 📝 halaqaAPI.updateHalaqa("${halaqaId}") called`);
    return api.put(`/halaqa/${halaqaId}`, data);
  },
  update: (halaqaId: string, data: any): Promise<any> => api.put(`/halaqa/${halaqaId}`, data),
  
  deleteHalaqa: (halaqaId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🗑️ halaqaAPI.deleteHalaqa("${halaqaId}") called`);
    return api.delete(`/halaqa/${halaqaId}`);
  },
  delete: (halaqaId: string): Promise<any> => api.delete(`/halaqa/${halaqaId}`),
  
  joinHalaqa: (inviteCode: string): Promise<any> => {
    console.log(`${FILE_NAME} 🔗 halaqaAPI.joinHalaqa("${inviteCode}") called`);
    return api.post('/halaqa/join', { inviteCode });
  },
  joinByCode: (inviteCode: string): Promise<any> => api.post('/halaqa/join', { inviteCode }),
  joinById: (halaqaId: string): Promise<any> => api.post(`/halaqa/${halaqaId}/join`),
  join: (halaqaId: string): Promise<any> => api.post(`/halaqa/${halaqaId}/join`),
  
  leaveHalaqa: (halaqaId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🚪 halaqaAPI.leaveHalaqa("${halaqaId}") called`);
    return api.post(`/halaqa/${halaqaId}/leave`);
  },
  leave: (halaqaId: string): Promise<any> => api.post(`/halaqa/${halaqaId}/leave`),
  
  getMembers: (halaqaId: string): Promise<any> => {
    console.log(`${FILE_NAME} 👥 halaqaAPI.getMembers("${halaqaId}") called`);
    return api.get(`/halaqa/${halaqaId}/members`);
  },
  
  kickMember: (halaqaId: string, userId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🚫 halaqaAPI.kickMember("${userId}") called`);
    return api.delete(`/halaqa/${halaqaId}/members/${userId}`);
  },
  removeMember: (halaqaId: string, userId: string): Promise<any> => 
    api.delete(`/halaqa/${halaqaId}/members/${userId}`),
  
  promoteToAdmin: (halaqaId: string, userId: string): Promise<any> => {
    console.log(`${FILE_NAME} 👑 halaqaAPI.promoteToAdmin("${userId}") called`);
    return api.post(`/halaqa/${halaqaId}/admins/${userId}`);
  },
  makeAdmin: (halaqaId: string, userId: string): Promise<any> => 
    api.post(`/halaqa/${halaqaId}/admins/${userId}`),
  
  getActivities: (halaqaId: string): Promise<any> => {
    console.log(`${FILE_NAME} 📋 halaqaAPI.getActivities("${halaqaId}") called`);
    return api.get(`/halaqa/${halaqaId}/activities`);
  },
  
  createActivity: (halaqaId: string, data: any): Promise<any> => {
    console.log(`${FILE_NAME} ➕ halaqaAPI.createActivity() called`);
    return api.post(`/halaqa/${halaqaId}/activities`, data);
  },
  addActivity: (halaqaId: string, data: any): Promise<any> => 
    api.post(`/halaqa/${halaqaId}/activities`, data),
  
  completeActivity: (halaqaId: string, activityId: string): Promise<any> => {
    console.log(`${FILE_NAME} ✅ halaqaAPI.completeActivity("${activityId}") called`);
    return api.post(`/halaqa/${halaqaId}/activities/${activityId}/complete`);
  },
  finishActivity: (halaqaId: string, activityId: string): Promise<any> => 
    api.post(`/halaqa/${halaqaId}/activities/${activityId}/complete`),
  
  deleteActivity: (halaqaId: string, activityId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🗑️ halaqaAPI.deleteActivity("${activityId}") called`);
    return api.delete(`/halaqa/${halaqaId}/activities/${activityId}`);
  },
  removeActivity: (halaqaId: string, activityId: string): Promise<any> => 
    api.delete(`/halaqa/${halaqaId}/activities/${activityId}`),
  
  getLeaderboard: (halaqaId: string, period?: string): Promise<any> => {
    console.log(`${FILE_NAME} 🏆 halaqaAPI.getLeaderboard("${halaqaId}") called`);
    return api.get(`/halaqa/${halaqaId}/leaderboard`, { params: { period } });
  },
  
  getStats: (halaqaId: string): Promise<any> => {
    console.log(`${FILE_NAME} 📊 halaqaAPI.getStats("${halaqaId}") called`);
    return api.get(`/halaqa/${halaqaId}/stats`);
  },
  
  logActivity: (halaqaId: string, data: any): Promise<any> => {
    console.log(`${FILE_NAME} 📝 halaqaAPI.logActivity() called`);
    return api.post(`/halaqa/${halaqaId}/log`, data);
  },
  
  getMessages: (halaqaId: string, params?: any): Promise<any> => {
    console.log(`${FILE_NAME} 💬 halaqaAPI.getMessages("${halaqaId}") called`);
    return api.get(`/halaqa/${halaqaId}/messages`, { params });
  },
  
  sendMessage: (halaqaId: string, content: string, type?: string): Promise<any> => {
    console.log(`${FILE_NAME} 📤 halaqaAPI.sendMessage() called`);
    return api.post(`/halaqa/${halaqaId}/messages`, { content, type: type || 'text' });
  },
  
  regenerateInviteCode: (halaqaId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🔄 halaqaAPI.regenerateInviteCode() called`);
    return api.post(`/halaqa/${halaqaId}/regenerate-code`);
  },
  
  getInviteLink: (halaqaId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🔗 halaqaAPI.getInviteLink() called`);
    return api.get(`/halaqa/${halaqaId}/invite-link`);
  },
};

// ============================================
// CHAT API
// ============================================
export const chatAPI = {
  getConversations: (): Promise<any> => {
    console.log(`${FILE_NAME} 💬 chatAPI.getConversations() called`);
    return api.get('/chat/conversations');
  },
  getConversation: (conversationId: string): Promise<any> => {
    console.log(`${FILE_NAME} 💬 chatAPI.getConversation("${conversationId}") called`);
    return api.get(`/chat/conversations/${conversationId}`);
  },
  getMessages: (conversationId: string, page?: number): Promise<any> => {
    console.log(`${FILE_NAME} 💬 chatAPI.getMessages("${conversationId}") called`);
    return api.get(`/chat/conversations/${conversationId}/messages?page=${page || 1}`);
  },
  sendMessage: (conversationId: string, content: string, type?: string): Promise<any> => {
    console.log(`${FILE_NAME} 📤 chatAPI.sendMessage() called`);
    return api.post(`/chat/conversations/${conversationId}/messages`, { content, type });
  },
  createConversation: (recipientId: string): Promise<any> => {
    console.log(`${FILE_NAME} ➕ chatAPI.createConversation("${recipientId}") called`);
    return api.post('/chat/conversations', { recipientId });
  },
  createGroupConversation: (name: string, participantIds: string[]): Promise<any> => {
    console.log(`${FILE_NAME} ➕ chatAPI.createGroupConversation("${name}") called`);
    return api.post('/chat/conversations', { name, participantIds, type: 'group' });
  },
  markAsRead: (conversationId: string): Promise<any> => {
    console.log(`${FILE_NAME} ✅ chatAPI.markAsRead("${conversationId}") called`);
    return api.put(`/chat/conversations/${conversationId}/read`);
  },
  deleteMessage: (messageId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🗑️ chatAPI.deleteMessage("${messageId}") called`);
    return api.delete(`/chat/messages/${messageId}`);
  },
  addReaction: (messageId: string, emoji: string): Promise<any> => {
    console.log(`${FILE_NAME} 😀 chatAPI.addReaction("${messageId}", "${emoji}") called`);
    return api.post(`/chat/messages/${messageId}/reaction`, { emoji });
  },
  getUnreadCount: async (): Promise<any> => {
    console.log(`${FILE_NAME} 📊 chatAPI.getUnreadCount() called`);
    try {
      const res: any = await api.get('/chat/conversations');
      const conversations = res?.data || res || [];
      const total = Array.isArray(conversations) 
        ? conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0)
        : 0;
      console.log(`${FILE_NAME} 📬 Unread count: ${total}`);
      return { data: { count: total } };
    } catch (e) {
      return { data: { count: 0 } };
    }
  },
};

// ============================================
// SOCIAL API - ✅ COMPLETE
// ============================================
export const socialAPI = {
  // Get friends list
  getFriends: (): Promise<any> => {
    console.log(`${FILE_NAME} 👥 socialAPI.getFriends() called`);
    return api.get('/social/friends');
  },
  
  // Get friend requests (received and sent)
  getFriendRequests: (): Promise<any> => {
    console.log(`${FILE_NAME} 📥 socialAPI.getFriendRequests() called`);
    return api.get('/social/requests');
  },
  getRequests: (): Promise<any> => {
    console.log(`${FILE_NAME} 📥 socialAPI.getRequests() called`);
    return api.get('/social/requests');
  },
  
  // Send friend request
  sendRequest: (userId: string): Promise<any> => {
    console.log(`${FILE_NAME} 📤 socialAPI.sendRequest("${userId}") called`);
    return api.post(`/social/request/${userId}`);
  },
  sendFriendRequest: (userId: string): Promise<any> => {
    console.log(`${FILE_NAME} 📤 socialAPI.sendFriendRequest("${userId}") called`);
    return api.post(`/social/request/${userId}`);
  },
  
  // Accept friend request
  acceptRequest: (userId: string): Promise<any> => {
    console.log(`${FILE_NAME} ✅ socialAPI.acceptRequest("${userId}") called`);
    return api.post(`/social/accept/${userId}`);
  },
  acceptFriendRequest: (userId: string): Promise<any> => {
    console.log(`${FILE_NAME} ✅ socialAPI.acceptFriendRequest("${userId}") called`);
    return api.post(`/social/accept/${userId}`);
  },
  
  // Reject friend request
  rejectRequest: (userId: string): Promise<any> => {
    console.log(`${FILE_NAME} ❌ socialAPI.rejectRequest("${userId}") called`);
    return api.post(`/social/reject/${userId}`);
  },
  rejectFriendRequest: (userId: string): Promise<any> => {
    console.log(`${FILE_NAME} ❌ socialAPI.rejectFriendRequest("${userId}") called`);
    return api.post(`/social/reject/${userId}`);
  },
  
  // Remove friend
  removeFriend: (userId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🗑️ socialAPI.removeFriend("${userId}") called`);
    return api.delete(`/social/friends/${userId}`);
  },
  
  // Search users
  searchUsers: (query: string): Promise<any> => {
    console.log(`${FILE_NAME} 🔍 socialAPI.searchUsers("${query}") called`);
    return api.get(`/social/search?q=${encodeURIComponent(query)}`);
  },
  
  // Get user profile
  getUserProfile: (userId: string): Promise<any> => {
    console.log(`${FILE_NAME} 👤 socialAPI.getUserProfile("${userId}") called`);
    return api.get(`/social/users/${userId}`);
  },
  
  // Get friend suggestions
  getSuggestions: (): Promise<any> => {
    console.log(`${FILE_NAME} 💡 socialAPI.getSuggestions() called`);
    return api.get('/social/suggestions');
  },
  getFriendSuggestions: (): Promise<any> => {
    console.log(`${FILE_NAME} 💡 socialAPI.getFriendSuggestions() called`);
    return api.get('/social/suggestions');
  },
  
  // Get social stats
  getStats: (): Promise<any> => {
    console.log(`${FILE_NAME} 📊 socialAPI.getStats() called`);
    return api.get('/social/stats');
  },
  
  // Block user
  blockUser: (userId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🚫 socialAPI.blockUser("${userId}") called`);
    return api.post(`/social/block/${userId}`);
  },
  
  // Unblock user
  unblockUser: (userId: string): Promise<any> => {
    console.log(`${FILE_NAME} ✅ socialAPI.unblockUser("${userId}") called`);
    return api.delete(`/social/block/${userId}`);
  },
  
  // Get blocked users
  getBlockedUsers: (): Promise<any> => {
    console.log(`${FILE_NAME} 🚫 socialAPI.getBlockedUsers() called`);
    return api.get('/social/blocked');
  },
};

// ============================================
// LEADERBOARD API
// ============================================
export const leaderboardAPI = {
  getLeague: async (): Promise<any> => {
    console.log(`${FILE_NAME} 🏆 leaderboardAPI.getLeague() called`);
    try {
      return await api.get('/leagues');
    } catch (e) {
      return { data: { league: 'bronze', rank: 0 } };
    }
  },
  getLeagueLeaderboard: async (league: string): Promise<any> => {
    console.log(`${FILE_NAME} 🏆 leaderboardAPI.getLeagueLeaderboard("${league}") called`);
    try {
      return await api.get(`/leagues/${league}/leaderboard`);
    } catch (e) {
      return { data: { users: [] } };
    }
  },
  getGlobal: async (period?: 'weekly' | 'allTime'): Promise<any> => {
    console.log(`${FILE_NAME} 🌍 leaderboardAPI.getGlobal() called`);
    try {
      return await api.get(`/leagues/global${period ? `?period=${period}` : ''}`);
    } catch (e) {
      return { data: { users: [] } };
    }
  },
  getFriends: async (): Promise<any> => {
    console.log(`${FILE_NAME} 👥 leaderboardAPI.getFriends() called`);
    try {
      return await api.get('/social/friends');
    } catch (e) {
      return { data: [] };
    }
  },
  getWeekly: async (): Promise<any> => {
    console.log(`${FILE_NAME} 📅 leaderboardAPI.getWeekly() called`);
    try {
      return await api.get('/leagues/weekly');
    } catch (e) {
      return { data: { users: [] } };
    }
  },
};

// ============================================
// REWARDS API
// ============================================
export const rewardsAPI = {
  getShopItems: (): Promise<any> => {
    console.log(`${FILE_NAME} 🛒 rewardsAPI.getShopItems() called`);
    return api.get('/rewards/shop');
  },
  buyItem: (itemId: string): Promise<any> => {
    console.log(`${FILE_NAME} 💰 rewardsAPI.buyItem("${itemId}") called`);
    return api.post(`/rewards/shop/${itemId}/buy`);
  },
  getDailyReward: (): Promise<any> => {
    console.log(`${FILE_NAME} 🎁 rewardsAPI.getDailyReward() called`);
    return api.get('/rewards/daily');
  },
  claimDailyReward: (): Promise<any> => {
    console.log(`${FILE_NAME} 🎁 rewardsAPI.claimDailyReward() called`);
    return api.post('/rewards/daily/claim');
  },
  getAchievements: (): Promise<any> => {
    console.log(`${FILE_NAME} 🏅 rewardsAPI.getAchievements() called`);
    return api.get('/rewards/achievements');
  },
};

// ============================================
// ACHIEVEMENTS API
// ============================================
export const achievementsAPI = {
  getAll: (): Promise<any> => {
    console.log(`${FILE_NAME} 🏅 achievementsAPI.getAll() called`);
    return api.get('/rewards/achievements');
  },
  unlock: (achievementId: string): Promise<any> => {
    console.log(`${FILE_NAME} 🔓 achievementsAPI.unlock("${achievementId}") called`);
    return api.post(`/rewards/achievements/${achievementId}/unlock`);
  },
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsAPI = {
  getNotifications: (page?: number, limit?: number): Promise<any> => {
    console.log(`${FILE_NAME} 🔔 notificationsAPI.getNotifications() called`);
    return api.get(`/notifications?page=${page || 1}&limit=${limit || 20}`);
  },
  markAsRead: (notificationId: string): Promise<any> => {
    console.log(`${FILE_NAME} ✅ notificationsAPI.markAsRead("${notificationId}") called`);
    return api.put(`/notifications/${notificationId}/read`);
  },
  markAllAsRead: (): Promise<any> => {
    console.log(`${FILE_NAME} ✅ notificationsAPI.markAllAsRead() called`);
    return api.put('/notifications/read-all');
  },
  getUnreadCount: (): Promise<any> => {
    console.log(`${FILE_NAME} 📊 notificationsAPI.getUnreadCount() called`);
    return api.get('/notifications/unread-count');
  },
};

// ============================================
// AUDIO API
// ============================================
export const audioAPI = {
  getAyahAudio: (surahId: number, ayahId: number, reciterId?: string): Promise<any> => {
    console.log(`${FILE_NAME} 🎵 audioAPI.getAyahAudio(${surahId}:${ayahId}) called`);
    return api.get(`/audio/ayah/${surahId}/${ayahId}${reciterId ? `?reciter=${reciterId}` : ''}`);
  },
  getSurahAudio: (surahId: number, reciterId?: string): Promise<any> => {
    console.log(`${FILE_NAME} 🎵 audioAPI.getSurahAudio(${surahId}) called`);
    return api.get(`/audio/surah/${surahId}${reciterId ? `?reciter=${reciterId}` : ''}`);
  },
  getAudioUrl: (surah: number, ayah: number, reciter: string = 'alafasy'): string => {
    const url = `${ENV.QURAN_AUDIO_CDN || 'https://cdn.islamic.network/quran/audio/128'}/ar.${reciter}/${surah}${ayah.toString().padStart(3, '0')}.mp3`;
    console.log(`${FILE_NAME} 🔊 audioAPI.getAudioUrl() -> ${url}`);
    return url;
  },
};

// ============================================
// AI API
// ============================================
export const aiAPI = {
  getPersonalizedPlan: (): Promise<any> => {
    console.log(`${FILE_NAME} 🤖 aiAPI.getPersonalizedPlan() called`);
    return api.get('/ai/plan');
  },
  explainAyah: (surahId: number, ayahId: number): Promise<any> => {
    console.log(`${FILE_NAME} 🤖 aiAPI.explainAyah(${surahId}:${ayahId}) called`);
    return api.get(`/ai/explain/${surahId}/${ayahId}`);
  },
  getDailyMotivation: (): Promise<any> => {
    console.log(`${FILE_NAME} 🤖 aiAPI.getDailyMotivation() called`);
    return api.get('/ai/motivation');
  },
  getInsights: (): Promise<any> => {
    console.log(`${FILE_NAME} 🤖 aiAPI.getInsights() called`);
    return api.get('/ai/insights');
  },
  getSmartReview: (): Promise<any> => {
    console.log(`${FILE_NAME} 🤖 aiAPI.getSmartReview() called`);
    return api.get('/ai/smart-review');
  },
  getTajwidFeedback: (audioUrl: string, surahId: number, ayahId: number): Promise<any> => {
    console.log(`${FILE_NAME} 🤖 aiAPI.getTajwidFeedback() called`);
    return api.post('/ai/tajwid-feedback', { audioUrl, surahId, ayahId });
  },
};

// ============================================
// VERIFICATION API
// ============================================
export const verificationAPI = {
  sendPhoneOtp: (phoneNumber: string): Promise<any> => {
    console.log(`${FILE_NAME} 📱 verificationAPI.sendPhoneOtp() called`);
    return api.post('/verification/phone/send', { phoneNumber });
  },
  verifyPhoneOtp: (phoneNumber: string, otp: string): Promise<any> => {
    console.log(`${FILE_NAME} ✅ verificationAPI.verifyPhoneOtp() called`);
    return api.post('/verification/phone/verify', { phoneNumber, otp });
  },
  sendEmailOtp: (email: string, type?: 'otp' | 'link'): Promise<any> => {
    console.log(`${FILE_NAME} 📧 verificationAPI.sendEmailOtp() called`);
    return api.post('/verification/email/send', { email, type });
  },
  verifyEmailOtp: (email: string, otp: string): Promise<any> => {
    console.log(`${FILE_NAME} ✅ verificationAPI.verifyEmailOtp() called`);
    return api.post('/verification/email/verify', { email, otp });
  },
  // Les routes biométriques côté serveur ont été retirées : une empreinte se
  // vérifie sur l'appareil (`expo-local-authentication`), qui garde l'accès au
  // jeton déjà stocké. Ces trois fonctions n'avaient aucun appelant, et
  // `disableBiometric` visait une route qui n'a jamais existé.
};

// ============================================
// WEBRTC API
// ============================================
export const webrtcAPI = {
  getIceServers: (): Promise<any> => {
    console.log(`${FILE_NAME} 📹 webrtcAPI.getIceServers() called`);
    return api.get('/webrtc/ice-servers');
  },
};

// ============================================
// SUBSCRIPTIONS API
// ============================================
export const subscriptionsAPI = {
  getPlans: (): Promise<any> => {
    console.log(`${FILE_NAME} 💳 subscriptionsAPI.getPlans() called`);
    return api.get('/subscriptions/plans');
  },
  getCurrentSubscription: (): Promise<any> => {
    console.log(`${FILE_NAME} 💳 subscriptionsAPI.getCurrentSubscription() called`);
    return api.get('/subscriptions/current');
  },
  subscribe: (planId: string, paymentMethod: string): Promise<any> => {
    console.log(`${FILE_NAME} 💳 subscriptionsAPI.subscribe("${planId}") called`);
    return api.post('/subscriptions/subscribe', { planId, paymentMethod });
  },
  cancel: (): Promise<any> => {
    console.log(`${FILE_NAME} ❌ subscriptionsAPI.cancel() called`);
    return api.post('/subscriptions/cancel');
  },
  restore: (): Promise<any> => {
    console.log(`${FILE_NAME} 🔄 subscriptionsAPI.restore() called`);
    return api.post('/subscriptions/restore');
  },
};

// ============================================
// SETTINGS API
// ============================================
export const settingsAPI = {
  get: (): Promise<any> => {
    console.log(`${FILE_NAME} ⚙️ settingsAPI.get() called`);
    return api.get('/settings');
  },
  update: (data: any): Promise<any> => {
    console.log(`${FILE_NAME} ⚙️ settingsAPI.update() called`);
    return api.put('/settings', data);
  },
};

// ============================================
// HELPERS
// ============================================
export const isAuthenticated = (): boolean => {
  const hasToken = !!authToken;
  const hasHeader = !!api.defaults.headers.common['Authorization'];
  const result = hasToken || hasHeader || justLoggedIn;
  console.log(`${FILE_NAME} 🔍 isAuthenticated() -> ${result}`);
  return result;
};

export const getToken = (): string | null => {
  console.log(`${FILE_NAME} 🔑 getToken() called`);
  return authToken;
};

export const setToken = (token: string | null): void => {
  console.log(`${FILE_NAME} 🔐 setToken() called`);
  api.setToken(token);
};

export const debugAuth = (): void => {
  console.log(`${FILE_NAME} 🔍 === Auth Debug ===`);
  console.log(`${FILE_NAME}    authToken: ${authToken ? `${authToken.substring(0, 20)}...` : 'NULL'}`);
  console.log(`${FILE_NAME}    justLoggedIn: ${justLoggedIn}`);
  console.log(`${FILE_NAME}    Header: ${api.defaults.headers.common['Authorization'] ? 'SET' : 'NOT SET'}`);
  console.log(`${FILE_NAME}    isAuthenticated: ${isAuthenticated()}`);
};

export { api };
export default api;