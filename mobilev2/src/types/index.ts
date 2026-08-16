/**
 * Types - Salifz
 * Définitions TypeScript pour toute l'application
 */

// ============================================
// QUÊTES QUOTIDIENNES
// ============================================
// `DailyQuests` était référencé par l'interface User sans avoir jamais été
// défini. La forme ci-dessous reprend celle produite par le serveur
// (`generateDailyQuests()` dans backendv2/routes/auth.js).

export type DailyQuestType = 'memorize' | 'review' | 'streak' | 'listen' | 'social';

export interface DailyQuest {
  questId: string;
  type: DailyQuestType;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  completed: boolean;
}

export interface DailyQuests {
  /** Date de génération du lot, au format ISO. */
  date: string;
  quests: DailyQuest[];
}

// ============================================
// USER TYPES
// ============================================
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string;
  avatarCustomization?: AvatarCustomization;
  profile: UserProfile;
  gamification: Gamification;
  quranProgress: QuranProgress;
  subscription: Subscription;
  social?: Social;
  dailyQuests?: DailyQuests;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AvatarCustomization {
  outfit: string;
  accessory: string;
  background: string;
}

export interface UserProfile {
  gender: 'male' | 'female' | 'not_specified';
  ageGroup: 'child' | 'teen' | 'adult' | 'senior';
  country?: string;
  timezone: string;
  language: 'ar' | 'en' | 'fr' | 'tr' | 'ur' | 'id' | 'ms';
  preferredReciter: string;
  dailyGoal: number;
  notificationsEnabled: boolean;
  reminderTime: string;
}

export interface Gamification {
  totalXP: number;
  weeklyXP: number;
  dailyXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  streakFreezes: { available: number; usedThisWeek: number };
  hearts: { current: number; max: number; lastRefill: string };
  league: 'bronze' | 'silver' | 'gold' | 'diamond' | 'hafiz';
  leagueRank: number;
  promotionZone: boolean;
  demotionZone: boolean;
  gems: number;
  coins: number;
  lastDailyReward?: string;
}

export interface QuranProgress {
  totalVersesMemorized: number;
  totalJuzCompleted: number;
  totalSurahCompleted: number;
  totalReviewSessions: number;
  currentSurah: number;
  currentAyah: number;
  currentJuz: number;
  memorizationPath: 'traditional' | 'juz_amma_first' | 'custom';
  avgTajwidScore: number;
}

export interface Subscription {
  plan: 'free' | 'salifz_plus' | 'salifz_family' | 'lifetime';
  status: 'active' | 'canceled' | 'expired' | 'trial';
  startDate?: string;
  endDate?: string;
}

export interface Social {
  friends: string[];
  friendRequests: { sent: string[]; received: string[] };
  halaqat: string[];
  following: string[];
  followers: string[];
  isPublicProfile: boolean;
}

// ============================================
// QURAN TYPES
// ============================================
export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  juz: number[];
}

export interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
  textUthmani?: string;
  translation?: { [lang: string]: string };
  transliteration?: string;
  juz: number;
  page: number;
  audioUrl?: string;
}

export interface SurahProgress {
  surahNumber: number;
  surahName: string;
  totalAyahs: number;
  memorizedCount: number;
  learningCount: number;
  notStartedCount: number;
  percentComplete: number;
  avgConfidence: number;
  lastStudied?: string;
  verses: VerseProgress[];
}

export interface VerseProgress {
  ayahNumber: number;
  status: 'not_started' | 'learning' | 'memorized' | 'mastered';
  confidence: number;
  tajwidScore: number;
  reviewCount: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  easeFactor: number;
  interval: number;
}

// ============================================
// GAMIFICATION TYPES
// ============================================
export interface Challenge {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  title: { ar: string; en: string; fr?: string };
  description: { ar: string; en: string; fr?: string };
  target: number;
  current: number;
  xpReward: number;
  gemsReward?: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  icon: string;
  category: 'progress' | 'streak' | 'social' | 'tajwid' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  xpReward: number;
  requirement: { type: string; count: number };
  unlockedAt?: string;
  progress: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  score: number;
  level: number;
  isCurrentUser?: boolean;
}

export interface ShopItem {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  type: 'avatar' | 'streak_freeze' | 'hearts' | 'boost' | 'theme';
  price: number;
  currency: 'gems' | 'coins';
  icon: string;
  isPremium: boolean;
  isLimited: boolean;
  stock?: number;
}

// ============================================
// SOCIAL TYPES
// ============================================
export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  currentStreak: number;
  lastActive?: string;
  isOnline: boolean;
}

export interface FriendRequest {
  id: string;
  from: Friend;
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Halaqa {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  owner: string;
  admins: string[];
  members: string[];
  memberCount: number;
  isPublic: boolean;
  isFemaleOnly: boolean;
  inviteCode: string;
  weeklyGoal?: number;
  createdAt: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: 'text' | 'audio' | 'image' | 'verse';
  metadata?: any;
  readBy: string[];
  createdAt: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================
export interface Notification {
  id: string;
  type: 'achievement' | 'friend_request' | 'challenge' | 'streak' | 'reminder' | 'system';
  title: { ar: string; en: string };
  body: { ar: string; en: string };
  data?: any;
  read: boolean;
  createdAt: string;
}

// ============================================
// PRAYER TYPES
// ============================================
export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
}

// ============================================
// AI TYPES
// ============================================
export interface AIInsights {
  weeklyOverview: {
    versesMemorized: number;
    versesReviewed: number;
    timeSpent: number;
    xpEarned: number;
  };
  performance: {
    averageAccuracy: number;
    bestTime: string;
    strongestSurahs: { number: number; name: string }[];
    needsReview: { number: number; name: string; verses: number[] }[];
  };
  streakAnalysis: {
    currentStreak: number;
    longestStreak: number;
    consistency: number;
    predictedStreakRisk: 'low' | 'medium' | 'high';
  };
  recommendations: { ar: string; en: string; priority: string }[];
}

export interface StudyPlan {
  id: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  dailyVerses: number;
  totalVerses: number;
  surahs: number[];
}

// ============================================
// SETTINGS TYPES
// ============================================
export interface AppSettings {
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large' | 'xlarge';
    fontFamily: string;
    colorScheme: string;
  };
  audio: {
    reciter: string;
    autoPlay: boolean;
    repeatCount: number;
    playbackSpeed: number;
    downloadQuality: 'low' | 'medium' | 'high';
  };
  notifications: {
    enabled: boolean;
    reminderTime: string;
    streakReminder: boolean;
    dailyVerse: boolean;
    friendActivity: boolean;
    prayerTimes: boolean;
  };
  learning: {
    dailyGoal: number;
    memorizationPath: string;
    showTranslation: boolean;
    translationLanguage: string;
    showTransliteration: boolean;
    reviewMode: 'spaced' | 'random' | 'sequential';
  };
  privacy: {
    publicProfile: boolean;
    showOnLeaderboard: boolean;
    allowFriendRequests: boolean;
  };
}

// ============================================
// NAVIGATION TYPES
// ============================================
export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Verification: { email: string; type: 'email' | 'sms' };
  Main: undefined;
  Lesson: { surahNumber: number };
  LessonDetail: { surahNumber: number; ayahNumber: number };
  LessonComplete: { surahNumber: number; xpEarned: number };
  Review: { surahNumber?: number };
  AudioPlayer: { surahNumber: number; ayahNumber?: number };
  DailyVerse: undefined;
  Profile: { userId?: string };
  Settings: undefined;
  Subscriptions: undefined;
  GoalSetup: undefined;
  Friends: undefined;
  Halaqa: { halaqaId?: string };
  Chat: { roomId: string };
  VideoCall: { roomId: string; isInitiator: boolean };
  Achievements: undefined;
  Challenges: undefined;
  Leaderboard: undefined;
  Shop: undefined;
  Streak: undefined;
  Insights: undefined;
  Notifications: undefined;
  FaceVerification: { mode: 'register' | 'verify' | 'halaqa'; halaqaId?: string };
  PrayerTimes: undefined;
  Bookmarks: undefined;
  Notes: undefined;
  StudyPlan: { planId?: string };
  TajwidAnalysis: { surahNumber: number; ayahNumber: number };
  ParentalControls: undefined;
  ChildActivity: { childId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Lessons: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
