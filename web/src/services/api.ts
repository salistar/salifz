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
};

export const recitationsAPI = {
  submit: (form: FormData) =>
    api.post('/recitations', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  mine: () => api.get('/recitations/mine'),
  pending: (halaqaId: string) => api.get(`/recitations/pending/${halaqaId}`),
  review: (id: string, payload: any) => api.post(`/recitations/${id}/review`, payload),
};

export const rtcAPI = {
  iceServers: () => api.get('/rtc/ice-servers'),
};

export const chatAPI = {
  conversations: () => api.get('/chat/conversations'),
};

export default api;
