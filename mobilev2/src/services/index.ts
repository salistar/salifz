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
export { 
  i18n, 
  t, 
  setLanguage, 
  getCurrentLanguage, 
  getCurrentLocale, 
  isRTL 
} from './i18n';