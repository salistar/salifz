/**
 * État global — Salifz web
 *
 * Volontairement minimal : la session et le thème. Tout le reste vient du
 * serveur, qui est la seule source de vérité — dupliquer la progression ou
 * les droits côté client reproduirait le défaut corrigé sur le mobile, où
 * la gamification restait figée sur des valeurs par défaut.
 */

import { create } from 'zustand';
import { authAPI, tokenStore } from './services/api';
import { connectRealtime, disconnectRealtime } from './services/realtime';

export interface User {
  _id?: string;
  id?: string;
  username: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  gamification?: {
    level?: number;
    totalXP?: number;
    gems?: number;
    currentStreak?: number;
    hearts?: { current?: number; max?: number };
    league?: string;
  };
  quranProgress?: { totalVersesMemorized?: number };
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  register: (payload: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  }) => Promise<boolean>;
  restore: () => Promise<void>;
  logout: () => void;
}

const unwrap = (response: any) => response?.data ?? response;

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  login: async (emailOrUsername, password) => {
    set({ loading: true, error: null });
    try {
      const data = unwrap(await authAPI.login(emailOrUsername, password));
      tokenStore.set(data.token, data.refreshToken);
      set({ user: data.user, loading: false });
      connectRealtime();
      return true;
    } catch (e: any) {
      set({ loading: false, error: e?.error ?? 'Connexion impossible' });
      return false;
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const data = unwrap(await authAPI.register(payload));
      tokenStore.set(data.token, data.refreshToken);
      set({ user: data.user, loading: false });
      connectRealtime();
      return true;
    } catch (e: any) {
      const details = e?.details?.[0]?.msg;
      set({ loading: false, error: details ?? e?.error ?? 'Inscription impossible' });
      return false;
    }
  },

  /** Reprend la session au chargement de la page, si le jeton est encore valide. */
  restore: async () => {
    if (!tokenStore.get()) {
      set({ loading: false });
      return;
    }
    try {
      const data = unwrap(await authAPI.me());
      set({ user: data.user ?? data, loading: false });
      connectRealtime();
    } catch {
      tokenStore.clear();
      set({ user: null, loading: false });
    }
  },

  logout: () => {
    tokenStore.clear();
    disconnectRealtime();
    set({ user: null });
  },
}));

// ---------------------------------------------------------------------------

type ThemeMode = 'light' | 'dark';
const THEME_KEY = 'salifz:theme';

interface ThemeState {
  theme: ThemeMode;
  toggle: () => void;
  /** Choix explicite — utilisé par l'écran Réglages, où le thème vient du
   *  serveur et n'est donc pas une simple bascule. */
  set: (theme: ThemeMode) => void;
}

/** Applique le thème sur `<html>`, d'où partent les variables CSS. */
function apply(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

const initialTheme: ThemeMode =
  (localStorage.getItem(THEME_KEY) as ThemeMode | null) ??
  (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

apply(initialTheme);

export const useTheme = create<ThemeState>((set, get) => ({
  theme: initialTheme,
  toggle: () => {
    const next: ThemeMode = get().theme === 'light' ? 'dark' : 'light';
    apply(next);
    set({ theme: next });
  },
  set: (theme: ThemeMode) => {
    apply(theme);
    set({ theme });
  },
}));
