/**
 * Client API — Salifz web
 *
 * L'application web parle au **même** backend que l'application mobile :
 * un seul modèle de données, un seul jeu de règles d'autorisation. Ce qui est
 * refusé au mobile est refusé ici, sans avoir à le réimplémenter.
 */

import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8088/api/v1';
export const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:8088';

/** Base sans le suffixe /api/v1, pour les fichiers servis en statique. */
export const FILES_URL = API_URL.replace(/\/api\/v1\/?$/, '');

const TOKEN_KEY = 'salifz:token';
const REFRESH_KEY = 'salifz:refreshToken';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (token: string, refresh?: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const original = error.config ?? {};
    const status = error.response?.status;

    // Le jeton d'accès est volontairement court (15 min). Un 401 est donc
    // normal en usage prolongé : on le rafraîchit une fois avant d'abandonner,
    // plutôt que de renvoyer l'utilisateur à l'écran de connexion.
    const isAuthRoute = String(original.url ?? '').includes('/auth/');
    if (status === 401 && !original._retried && !isAuthRoute) {
      original._retried = true;

      refreshing =
        refreshing ??
        (async () => {
          const refreshToken = tokenStore.getRefresh();
          if (!refreshToken) return null;
          try {
            const response: any = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
            const data = response.data?.data ?? response.data;
            if (data?.token) {
              tokenStore.set(data.token, data.refreshToken);
              return data.token as string;
            }
          } catch {
            /* la session est bel et bien terminée */
          }
          return null;
        })().finally(() => {
          refreshing = null;
        });

      const fresh = await refreshing;
      if (fresh) {
        original.headers = { ...original.headers, Authorization: `Bearer ${fresh}` };
        return api.request(original);
      }

      tokenStore.clear();
      if (!location.pathname.startsWith('/login')) location.assign('/login');
    }

    return Promise.reject(error.response?.data ?? { error: error.message });
  }
);

// ---------------------------------------------------------------------------
// Points d'entrée, alignés sur ceux de l'application mobile
// ---------------------------------------------------------------------------

export const authAPI = {
  login: (emailOrUsername: string, password: string) =>
    api.post('/auth/login', { emailOrUsername, password }),
  register: (payload: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => api.post('/auth/register', payload),
  me: () => api.get('/users/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
};

export const verseAPI = {
  daily: () => api.get('/verse/daily'),
  random: (theme?: string) => api.get('/verse/random', { params: theme ? { theme } : {} }),
  themes: () => api.get('/verse/themes'),
  byTheme: (theme: string) => api.get(`/verse/theme/${theme}`),
  // `/verse/tafsir` répond 501 : le commentaire attribué à des savants a été
  // retiré faute de source réelle. Pas de méthode cliente pour une route qui
  // n'a rien à rendre.
};

export const socialAPI = {
  friends: () => api.get('/social/friends'),
  requests: () => api.get('/social/requests'),
  search: (q: string) => api.get('/social/search', { params: { q, query: q } }),
  sendRequest: (userId: string) => api.post(`/social/request/${userId}`),
  accept: (userId: string) => api.post(`/social/accept/${userId}`),
  reject: (userId: string) => api.post(`/social/reject/${userId}`),
  remove: (userId: string) => api.delete(`/social/friends/${userId}`),
};

export const challengesAPI = {
  all: () => api.get('/challenges'),
  completed: () => api.get('/challenges/completed'),
  start: (id: string) => api.post(`/challenges/${id}/start`),
  claim: (id: string) => api.post(`/challenges/${id}/claim`),
};

export const streaksAPI = {
  get: () => api.get('/streaks'),
  freeze: () => api.post('/streaks/freeze'),
  buyFreeze: () => api.post('/streaks/buy-freeze'),
  claimMilestone: (days: number) => api.post(`/streaks/milestones/${days}/claim`),
};

export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  weekly: () => api.get('/analytics/weekly'),
  heatmap: (months = 3) => api.get('/analytics/heatmap', { params: { months } }),
};

export const subscriptionsAPI = {
  plans: () => api.get('/subscriptions/plans'),
  // Le serveur nomme ce point d'entrée `/status` ; `/current` n'existe pas.
  status: () => api.get('/subscriptions/status'),
};

export const quranAPI = {
  surahs: () => api.get('/quran/surahs'),
  page: (page: number) => api.get(`/quran/page/${page}`),
  pageOfVerse: (surah: number, ayah: number) => api.get(`/quran/page-of/${surah}/${ayah}`),
  wordByWord: (surah: number, ayah: number) => api.get(`/quran/word-by-word/${surah}/${ayah}`),
};

export const halaqaAPI = {
  mine: () => api.get('/halaqa/my'),
  discover: () => api.get('/halaqa/discover'),
  detail: (id: string) => api.get(`/halaqa/${id}`),
  create: (payload: any) => api.post('/halaqa', payload),
  joinByCode: (code: string) => api.post('/halaqa/join', { code }),
  messages: (id: string) => api.get(`/halaqa/${id}/messages`),
};

export const recitationsAPI = {
  // Pas de Content-Type forcé : le navigateur pose lui-même le boundary
  // multipart (le forcer produisait un envoi sans fichier — cf. ProfilePage).
  submit: (form: FormData) => api.post('/recitations', form),
  mine: () => api.get('/recitations/mine'),
  pending: (halaqaId: string) => api.get(`/recitations/pending/${halaqaId}`),
  review: (id: string, payload: any) => api.post(`/recitations/${id}/review`, payload),
};


// --- Parité avec l'application mobile -------------------------------------
// Ces points d'entrée existaient déjà côté serveur ; seule l'interface web
// manquait. Aucune logique n'est réimplémentée ici.

export const progressAPI = {
  overview: () => api.get('/progress/overview'),
  surah: (n: number) => api.get(`/progress/surah/${n}`),
  reviewQueue: () => api.get('/progress/review-queue'),
  markVerse: (surah: number, ayah: number, payload: any) =>
    api.post(`/progress/surah/${surah}/verse/${ayah}`, payload),
};

export const khatamAPI = {
  mine: () => api.get('/khatam/my'),
  discover: () => api.get('/khatam/discover'),
  detail: (id: string) => api.get(`/khatam/${id}`),
  create: (payload: any) => api.post('/khatam', payload),
};

export const leaguesAPI = {
  current: () => api.get('/leagues/current'),
  leaderboard: () => api.get('/leagues/leaderboard'),
  global: () => api.get('/leagues/global'),
  friends: () => api.get('/leagues/friends'),
};

export const badgesAPI = {
  all: () => api.get('/badges/all'),
  unlocked: () => api.get('/badges/unlocked'),
};

export const shopAPI = {
  items: () => api.get('/rewards/shop'),
  buy: (itemId: string) => api.post(`/rewards/shop/${itemId}/buy`),
  daily: () => api.get('/rewards/daily'),
  claimDaily: () => api.post('/rewards/daily/claim'),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (payload: any) => api.put('/settings', payload),
  reciters: () => api.get('/settings/reciters'),
  reset: () => api.post('/settings/reset'),
};

export const prayerAPI = {
  times: (latitude: number, longitude: number) =>
    api.get('/prayer/times', { params: { latitude, longitude } }),
  qibla: (latitude: number, longitude: number) =>
    api.get('/prayer/qibla', { params: { latitude, longitude } }),
};

export const notificationsAPI = {
  list: () => api.get('/notifications'),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  remove: (id: string) => api.delete(`/notifications/${id}`),
};

export const gamificationAPI = {
  stats: () => api.get('/gamification/stats'),
  dailyQuests: () => api.get('/gamification/daily-quests'),
};

export const rtcAPI = {
  iceServers: () => api.get('/rtc/ice-servers'),
};

export const chatAPI = {
  conversations: () => api.get('/chat/conversations'),
};

export default api;
