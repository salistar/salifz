/**
 * Configuration centrale - Salifz
 */

// Importer et exporter l'environnement
export { ENV, default as environment } from './env';

/**
 * Palette figee — heritage.
 *
 * Deux sources de verite coexistent pour la couleur : ce tableau, importe par
 * 36 fichiers, et `ThemeContext`, utilise par 56. Celui-ci ne connait pas le
 * theme : un ecran qui l'importe reste en clair meme quand l'utilisateur a
 * choisi le sombre.
 *
 * Les valeurs sont ici alignees sur la palette claire du `ThemeContext` — et
 * donc sur celle du web. C'est une correction partielle assumee : elle
 * supprime le probleme le plus visible (deux verts differents dans la meme
 * application) sans faire semblant de resoudre le second, qui demande de
 * migrer les 36 fichiers vers `useTheme()`.
 *
 * Ne pas ajouter de couleur ici. Tout nouvel ecran passe par `useTheme()`.
 */
export const COLORS = {
  primary: '#0f7b5a',
  primaryDark: '#0c6449',
  primaryLight: '#149a70',
  secondary: '#b4720f',
  secondaryDark: '#8f5a0b',
  accent: '#a8871c',

  // Fonds
  background: '#fbf8f1',
  backgroundDark: '#06120e',
  backgroundDarker: '#040d0a',
  card: '#ffffff',
  cardDark: '#0f251d',

  // Texte
  text: '#0b1f17',
  textLight: '#4a5d54',
  textMuted: '#8a7f6a',
  textWhite: '#ffffff',

  // Etats
  success: '#0f7b5a',
  error: '#a63a2e',
  warning: '#b4720f',
  info: '#2e5e8a',

  // Metaux des ligues : volontairement inchanges dans les deux themes, un
  // bronze inverse n'est plus reconnaissable comme du bronze.
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#c9a227',
  diamond: '#8FD3E8',
  platinum: '#C9CBC8',
  master: '#8E6BB5',

  // Structure
  border: '#e7decb',
  divider: '#f0eadc',
  overlay: 'rgba(11, 31, 23, 0.45)',
};

// Configuration des Leagues
export const LEAGUES = [
  { id: 'bronze', name: 'البرونزي', icon: '🥉', color: '#CD7F32', minXP: 0 },
  { id: 'silver', name: 'الفضي', icon: '🥈', color: '#C0C0C0', minXP: 1000 },
  { id: 'gold', name: 'الذهبي', icon: '🥇', color: '#FFD700', minXP: 5000 },
  { id: 'platinum', name: 'البلاتيني', icon: '💎', color: '#E5E4E2', minXP: 15000 },
  { id: 'diamond', name: 'الماسي', icon: '💠', color: '#B9F2FF', minXP: 30000 },
  { id: 'master', name: 'الأسطوري', icon: '👑', color: '#9B59B6', minXP: 50000 },
];

// Constantes de l'application
export const APP_CONFIG = {
  // Pagination
  PAGE_SIZE: 20,
  
  // Animations
  ANIMATION_DURATION: 300,
  
  // Storage Keys
  STORAGE_KEYS: {
    TOKEN: 'token',
    REFRESH_TOKEN: 'refreshToken',
    USER: 'user',
    ONBOARDING_COMPLETED: 'onboardingCompleted',
    BIOMETRIC_ENABLED: 'biometricEnabled',
    LANGUAGE: 'language',
    THEME: 'theme',
    NOTIFICATIONS_ENABLED: 'notificationsEnabled',
  },
  
  // OTP
  OTP_LENGTH: 6,
  OTP_RESEND_TIMEOUT: 60,
  
  // Limits
  MAX_MESSAGE_LENGTH: 2000,
  MAX_BIO_LENGTH: 150,
  MAX_USERNAME_LENGTH: 30,
  
  // Chat
  CHAT_MAX_ATTACHMENTS: 5,
  CHAT_ATTACHMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Halaqa
  HALAQA_MAX_MEMBERS: 50,
  HALAQA_MAX_ADMINS: 5,
  
  // Gamification
  XP_PER_VERSE: 10,
  XP_PER_LESSON: 50,
  MAX_HEARTS: 5,
  HEART_REFILL_HOURS: 4,
};

// Configuration Audio Coran
export const QURAN_CONFIG = {
  AUDIO_CDN: 'https://cdn.islamic.network/quran/audio/128',
  DEFAULT_RECITER: 'ar.alafasy',
  RECITERS: [
    { id: 'ar.alafasy', name: 'مشاري العفاسي', nameEn: 'Mishary Alafasy' },
    { id: 'ar.abdulbasit', name: 'عبد الباسط', nameEn: 'Abdul Basit' },
    { id: 'ar.minshawi', name: 'المنشاوي', nameEn: 'Al-Minshawi' },
    { id: 'ar.husary', name: 'الحصري', nameEn: 'Al-Husary' },
    { id: 'ar.sudais', name: 'السديس', nameEn: 'As-Sudais' },
  ],
};

// Helper pour obtenir la league par XP
export const getLeagueByXP = (xp: number) => {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (xp >= LEAGUES[i].minXP) {
      return LEAGUES[i];
    }
  }
  return LEAGUES[0];
};

// Helper pour obtenir la prochaine league
export const getNextLeague = (currentLeagueId: string) => {
  const currentIndex = LEAGUES.findIndex(l => l.id === currentLeagueId);
  if (currentIndex < LEAGUES.length - 1) {
    return LEAGUES[currentIndex + 1];
  }
  return null;
};

// Helper pour calculer le niveau à partir de l'XP
export const calculateLevel = (xp: number): number => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

// Helper pour calculer l'XP nécessaire pour le prochain niveau
export const calculateXPToNextLevel = (currentLevel: number): number => {
  return Math.pow(currentLevel, 2) * 100;
};

export default { COLORS, LEAGUES, APP_CONFIG, QURAN_CONFIG };