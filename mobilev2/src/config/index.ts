/**
 * Configuration centrale - Salifz
 */

// Importer et exporter l'environnement
export { ENV, default as environment } from './env';

// Couleurs de l'application
export const COLORS = {
  primary: '#4CAF50',
  primaryDark: '#2E7D32',
  primaryLight: '#81C784',
  secondary: '#FF9800',
  secondaryDark: '#F57C00',
  accent: '#FFD700',
  
  // Backgrounds
  background: '#f5f5f5',
  backgroundDark: '#1a1a2e',
  backgroundDarker: '#16213e',
  card: '#ffffff',
  cardDark: '#252540',
  
  // Text
  text: '#333333',
  textLight: '#666666',
  textMuted: '#999999',
  textWhite: '#ffffff',
  
  // Status
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FFC107',
  info: '#2196F3',
  
  // Leagues
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  diamond: '#B9F2FF',
  platinum: '#E5E4E2',
  master: '#9B59B6',
  
  // Misc
  border: '#e0e0e0',
  divider: '#f0f0f0',
  overlay: 'rgba(0,0,0,0.5)',
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