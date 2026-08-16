/**
 * Services Index - Salifz
 * ✅ FIXED: Export initializeToken and all APIs
 */

// ============================================
// API EXPORTS
// ============================================
export { 
  // Default export
  api,
  default as apiDefault,
  
  // ✅ Token management
  initializeToken,
  isAuthenticated,
  getToken,
  
  // Auth
  authAPI,
  verificationAPI,
  
  // Quran & Progress
  quranAPI,
  progressAPI,
  audioAPI,
  
  // Gamification
  gamificationAPI,
  challengesAPI,
  streaksAPI,
  leaderboardAPI,
  rewardsAPI,
  achievementsAPI,
  
  // Social
  socialAPI,
  halaqaAPI,
  chatAPI,
  
  // WebRTC
  webrtcAPI,
  
  // AI
  aiAPI,
  
  // Settings & Notifications
  notificationsAPI,
  subscriptionsAPI,
  settingsAPI,
} from './api';

// ============================================
// SOCKET EXPORTS
// ============================================
export { socketService, default as socket } from './socket';

// ============================================
// OFFLINE EXPORTS
// ============================================
export { offlineService } from './offline';

// ============================================
// I18N EXPORTS
// ============================================
// Quatre des six noms réexportés ici n'existaient pas dans ./i18n
// (`i18n`, `setLanguage`, `getCurrentLanguage`, `getCurrentLocale`) :
// tout import passant par ce baril échouait. Les noms réels sont repris
// ci-dessous, avec des alias pour ceux qui étaient attendus.
export {
  t,
  isRTL,
  initI18n,
  getLocale,
  getLocale as getCurrentLocale,
  getLocale as getCurrentLanguage,
  changeLanguage,
  changeLanguage as setLanguage,
  getTextDirection,
  getSupportedLocales,
  getLocaleName,
  hasTranslation,
} from './i18n';

export { default as i18n } from './i18n';