/**
 * Utility Functions - Salifz
 */

// ============================================
// DATE UTILITIES
// ============================================
export const formatDate = (date: Date | string, format: string = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'full':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'medium':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    case 'time':
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'relative':
      return getRelativeTime(d);
    default:
      return d.toLocaleDateString();
  }
};

export const getRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(d, 'short');
};

export const isToday = (date: Date | string): boolean => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
};

export const getDaysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ============================================
// NUMBER UTILITIES
// ============================================
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatXP = (xp: number): string => {
  return xp.toLocaleString() + ' XP';
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const percentage = (value: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

// ============================================
// STRING UTILITIES
// ============================================
export const truncate = (str: string, length: number): string => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// ============================================
// VALIDATION UTILITIES
// ============================================
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain a number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain a special character (!@#$%^&*)');
  }
  
  return { valid: errors.length === 0, errors };
};

export const isValidUsername = (username: string): { valid: boolean; error?: string } => {
  if (username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'Username must be at most 20 characters' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  return { valid: true };
};

// ============================================
// QURAN UTILITIES
// ============================================
export const getSurahName = (number: number, language: 'ar' | 'en' = 'ar'): string => {
  const names: { [key: number]: { ar: string; en: string } } = {
    1: { ar: 'الفاتحة', en: 'Al-Fatiha' },
    2: { ar: 'البقرة', en: 'Al-Baqarah' },
    36: { ar: 'يس', en: 'Ya-Sin' },
    67: { ar: 'الملك', en: 'Al-Mulk' },
    112: { ar: 'الإخلاص', en: 'Al-Ikhlas' },
    113: { ar: 'الفلق', en: 'Al-Falaq' },
    114: { ar: 'الناس', en: 'An-Nas' },
  };
  return names[number]?.[language] || `Surah ${number}`;
};

export const getJuzName = (number: number): string => {
  const names: { [key: number]: string } = {
    1: 'آلم',
    30: 'عم',
  };
  return names[number] || `Juz ${number}`;
};

export const getVerseCount = (surahNumber: number): number => {
  const counts = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
  return counts[surahNumber - 1] || 0;
};

// ============================================
// GAMIFICATION UTILITIES
// ============================================
export const calculateLevel = (xp: number): number => {
  // XP needed per level increases progressively
  let level = 1;
  let xpNeeded = 100;
  let totalXP = 0;
  
  while (totalXP + xpNeeded <= xp && level < 100) {
    totalXP += xpNeeded;
    level++;
    xpNeeded = Math.floor(xpNeeded * 1.1);
  }
  
  return level;
};

export const getXPForNextLevel = (currentLevel: number): number => {
  let xpNeeded = 100;
  for (let i = 1; i < currentLevel; i++) {
    xpNeeded = Math.floor(xpNeeded * 1.1);
  }
  return xpNeeded;
};

export const getLeagueFromXP = (weeklyXP: number): string => {
  if (weeklyXP >= 5000) return 'hafiz';
  if (weeklyXP >= 3000) return 'diamond';
  if (weeklyXP >= 1500) return 'gold';
  if (weeklyXP >= 500) return 'silver';
  return 'bronze';
};

// ============================================
// ARRAY UTILITIES
// ============================================
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const groupBy = <T>(array: T[], key: keyof T): { [key: string]: T[] } => {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as { [key: string]: T[] });
};

export const removeDuplicates = <T>(array: T[], key?: keyof T): T[] => {
  if (key) {
    const seen = new Set();
    return array.filter((item) => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }
  return [...new Set(array)];
};

// ============================================
// COLOR UTILITIES
// ============================================
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getStatusColor = (status: string): string => {
  const colors: { [key: string]: string } = {
    not_started: '#E0E0E0',
    learning: '#FF9800',
    memorized: '#8BC34A',
    mastered: '#4CAF50',
    needs_review: '#F44336',
  };
  return colors[status] || '#9E9E9E';
};

export default {
  formatDate,
  getRelativeTime,
  isToday,
  getDaysBetween,
  formatNumber,
  formatXP,
  clamp,
  percentage,
  truncate,
  capitalize,
  getInitials,
  slugify,
  isValidEmail,
  isValidPassword,
  isValidUsername,
  getSurahName,
  getJuzName,
  getVerseCount,
  calculateLevel,
  getXPForNextLevel,
  getLeagueFromXP,
  shuffleArray,
  groupBy,
  removeDuplicates,
  hexToRgba,
  getStatusColor,
};
