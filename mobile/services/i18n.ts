/**
 * i18n Service - Salifz
 */

import { I18nManager } from 'react-native';

// Translations
const translations: Record<string, Record<string, string>> = {
  ar: {
    // Common
    'common.loading': 'جاري التحميل...',
    'common.error': 'خطأ',
    'common.success': 'تم بنجاح',
    'common.or': 'أو',
    'common.back': 'رجوع',
    'common.confirm': 'تأكيد',
    'common.cancel': 'إلغاء',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.search': 'بحث',
    'common.retry': 'إعادة المحاولة',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.done': 'تم',
    'common.skip': 'تخطي',
    
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.register': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.username': 'اسم المستخدم',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.loginButton': 'دخول',
    'auth.registerButton': 'إنشاء حساب',
    'auth.createAccount': 'إنشاء حساب جديد',
    'auth.alreadyHaveAccount': 'لديك حساب بالفعل؟',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.logout': 'تسجيل الخروج',
    
    // Validation
    'validation.required': 'هذا الحقل مطلوب',
    'validation.emailInvalid': 'البريد الإلكتروني غير صحيح',
    'validation.passwordTooShort': 'كلمة المرور قصيرة جداً',
    'validation.passwordMismatch': 'كلمات المرور غير متطابقة',
    'validation.usernameTooShort': 'اسم المستخدم قصير جداً',
    
    // Home
    'home.greeting': 'مرحباً',
    'home.xp': 'نقاط',
    'home.gems': 'جواهر',
    'home.ayah': 'آيات',
    'home.level': 'المستوى',
    'home.hearts': 'قلوب',
    'home.continueLearn': 'تابع التعلم',
    'home.surah': 'سورة',
    'home.dailyQuests': 'مهام اليوم',
    'home.streak': 'السلسلة',
    'home.todayGoal': 'هدف اليوم',
    
    // Quran
    'quran.surah': 'سورة',
    'quran.ayah': 'آية',
    'quran.juz': 'جزء',
    'quran.page': 'صفحة',
    'quran.verse': 'آية',
    'quran.verses': 'آيات',
    'quran.memorized': 'محفوظ',
    'quran.learning': 'قيد التعلم',
    'quran.notStarted': 'لم يبدأ',
    
    // Learning
    'learning.listen': 'استمع',
    'learning.repeat': 'كرر',
    'learning.memorize': 'احفظ',
    'learning.review': 'راجع',
    'learning.test': 'اختبار',
    'learning.complete': 'أكملت',
    'learning.correct': 'صحيح!',
    'learning.incorrect': 'خطأ',
    'learning.tryAgain': 'حاول مرة أخرى',
    
    // Gamification
    'gamification.levelUp': 'ارتقيت للمستوى',
    'gamification.newAchievement': 'إنجاز جديد!',
    'gamification.dailyReward': 'مكافأة يومية',
    'gamification.streakBonus': 'مكافأة السلسلة',
    
    // Settings
    'settings.title': 'الإعدادات',
    'settings.language': 'اللغة',
    'settings.theme': 'المظهر',
    'settings.notifications': 'الإشعارات',
    'settings.sound': 'الصوت',
    'settings.reciter': 'القارئ',
    'settings.fontSize': 'حجم الخط',
    'settings.dailyGoal': 'الهدف اليومي',
    'settings.privacy': 'الخصوصية',
    'settings.help': 'المساعدة',
    'settings.about': 'حول التطبيق',
    
    // Profile
    'profile.title': 'الملف الشخصي',
    'profile.achievements': 'الإنجازات',
    'profile.statistics': 'الإحصائيات',
    'profile.friends': 'الأصدقاء',
    
    // Leaderboard
    'leaderboard.title': 'لوحة المتصدرين',
    'leaderboard.league': 'الدوري',
    'leaderboard.global': 'عالمي',
    'leaderboard.friends': 'الأصدقاء',
    'leaderboard.rank': 'المرتبة',
    
    // Notifications
    'notifications.title': 'الإشعارات',
    'notifications.empty': 'لا توجد إشعارات',
    'notifications.markAllRead': 'تحديد الكل كمقروء',
  },
  
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.or': 'or',
    'common.back': 'Back',
    'common.confirm': 'Confirm',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.retry': 'Retry',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.done': 'Done',
    'common.skip': 'Skip',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'auth.forgotPassword': 'Forgot password?',
    'auth.loginButton': 'Login',
    'auth.registerButton': 'Create Account',
    'auth.createAccount': 'Create new account',
    'auth.alreadyHaveAccount': 'Already have an account?',
    'auth.noAccount': "Don't have an account?",
    'auth.logout': 'Logout',
    
    // Validation
    'validation.required': 'This field is required',
    'validation.emailInvalid': 'Invalid email',
    'validation.passwordTooShort': 'Password too short',
    'validation.passwordMismatch': 'Passwords do not match',
    'validation.usernameTooShort': 'Username too short',
    
    // Home
    'home.greeting': 'Hello',
    'home.xp': 'XP',
    'home.gems': 'Gems',
    'home.ayah': 'Verses',
    'home.level': 'Level',
    'home.hearts': 'Hearts',
    'home.continueLearn': 'Continue Learning',
    'home.surah': 'Surah',
    'home.dailyQuests': 'Daily Quests',
    'home.streak': 'Streak',
    'home.todayGoal': "Today's Goal",
    
    // Quran
    'quran.surah': 'Surah',
    'quran.ayah': 'Ayah',
    'quran.juz': 'Juz',
    'quran.page': 'Page',
    'quran.verse': 'Verse',
    'quran.verses': 'Verses',
    'quran.memorized': 'Memorized',
    'quran.learning': 'Learning',
    'quran.notStarted': 'Not Started',
    
    // Learning
    'learning.listen': 'Listen',
    'learning.repeat': 'Repeat',
    'learning.memorize': 'Memorize',
    'learning.review': 'Review',
    'learning.test': 'Test',
    'learning.complete': 'Completed',
    'learning.correct': 'Correct!',
    'learning.incorrect': 'Incorrect',
    'learning.tryAgain': 'Try Again',
    
    // Gamification
    'gamification.levelUp': 'Level Up!',
    'gamification.newAchievement': 'New Achievement!',
    'gamification.dailyReward': 'Daily Reward',
    'gamification.streakBonus': 'Streak Bonus',
    
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.notifications': 'Notifications',
    'settings.sound': 'Sound',
    'settings.reciter': 'Reciter',
    'settings.fontSize': 'Font Size',
    'settings.dailyGoal': 'Daily Goal',
    'settings.privacy': 'Privacy',
    'settings.help': 'Help',
    'settings.about': 'About',
    
    // Profile
    'profile.title': 'Profile',
    'profile.achievements': 'Achievements',
    'profile.statistics': 'Statistics',
    'profile.friends': 'Friends',
    
    // Leaderboard
    'leaderboard.title': 'Leaderboard',
    'leaderboard.league': 'League',
    'leaderboard.global': 'Global',
    'leaderboard.friends': 'Friends',
    'leaderboard.rank': 'Rank',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.empty': 'No notifications',
    'notifications.markAllRead': 'Mark all as read',
  },
  
  fr: {
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.or': 'ou',
    'common.back': 'Retour',
    'common.confirm': 'Confirmer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.search': 'Rechercher',
    'common.retry': 'Réessayer',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.done': 'Terminé',
    'common.skip': 'Passer',
    
    // Auth
    'auth.login': 'Connexion',
    'auth.register': "S'inscrire",
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.username': "Nom d'utilisateur",
    'auth.forgotPassword': 'Mot de passe oublié?',
    'auth.loginButton': 'Se connecter',
    'auth.registerButton': 'Créer un compte',
    'auth.createAccount': 'Créer un nouveau compte',
    'auth.alreadyHaveAccount': 'Vous avez déjà un compte?',
    'auth.noAccount': "Vous n'avez pas de compte?",
    'auth.logout': 'Déconnexion',
    
    // Validation
    'validation.required': 'Ce champ est requis',
    'validation.emailInvalid': 'Email invalide',
    'validation.passwordTooShort': 'Mot de passe trop court',
    'validation.passwordMismatch': 'Les mots de passe ne correspondent pas',
    'validation.usernameTooShort': "Nom d'utilisateur trop court",
    
    // Home
    'home.greeting': 'Bonjour',
    'home.xp': 'XP',
    'home.gems': 'Gemmes',
    'home.ayah': 'Versets',
    'home.level': 'Niveau',
    'home.hearts': 'Cœurs',
    'home.continueLearn': 'Continuer',
    'home.surah': 'Sourate',
    'home.dailyQuests': 'Quêtes du jour',
    'home.streak': 'Série',
    'home.todayGoal': "Objectif du jour",
    
    // Quran
    'quran.surah': 'Sourate',
    'quran.ayah': 'Verset',
    'quran.juz': 'Juz',
    'quran.page': 'Page',
    'quran.verse': 'Verset',
    'quran.verses': 'Versets',
    'quran.memorized': 'Mémorisé',
    'quran.learning': 'En cours',
    'quran.notStarted': 'Non commencé',
    
    // Learning
    'learning.listen': 'Écouter',
    'learning.repeat': 'Répéter',
    'learning.memorize': 'Mémoriser',
    'learning.review': 'Réviser',
    'learning.test': 'Test',
    'learning.complete': 'Terminé',
    'learning.correct': 'Correct!',
    'learning.incorrect': 'Incorrect',
    'learning.tryAgain': 'Réessayer',
    
    // Gamification
    'gamification.levelUp': 'Niveau supérieur!',
    'gamification.newAchievement': 'Nouveau succès!',
    'gamification.dailyReward': 'Récompense quotidienne',
    'gamification.streakBonus': 'Bonus de série',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.theme': 'Thème',
    'settings.notifications': 'Notifications',
    'settings.sound': 'Son',
    'settings.reciter': 'Récitateur',
    'settings.fontSize': 'Taille de police',
    'settings.dailyGoal': 'Objectif quotidien',
    'settings.privacy': 'Confidentialité',
    'settings.help': 'Aide',
    'settings.about': 'À propos',
    
    // Profile
    'profile.title': 'Profil',
    'profile.achievements': 'Succès',
    'profile.statistics': 'Statistiques',
    'profile.friends': 'Amis',
    
    // Leaderboard
    'leaderboard.title': 'Classement',
    'leaderboard.league': 'Ligue',
    'leaderboard.global': 'Global',
    'leaderboard.friends': 'Amis',
    'leaderboard.rank': 'Rang',
    
    // Notifications
    'notifications.title': 'Notifications',
    'notifications.empty': 'Aucune notification',
    'notifications.markAllRead': 'Tout marquer comme lu',
  }
};

let currentLocale: 'ar' | 'en' | 'fr' = 'ar';

export const setLanguage = (locale: 'ar' | 'en' | 'fr') => {
  currentLocale = locale;
  const isRTL = locale === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
};

export const getCurrentLanguage = (): string => currentLocale;

export const getCurrentLocale = (): string => currentLocale;

export const isRTL = (): boolean => currentLocale === 'ar';

export const t = (key: string, options?: Record<string, any>): string => {
  let text = translations[currentLocale]?.[key] || translations['ar']?.[key] || key;
  
  // Replace placeholders like {{name}} with values from options
  if (options) {
    Object.keys(options).forEach(optKey => {
      text = text.replace(new RegExp(`{{${optKey}}}`, 'g'), String(options[optKey]));
    });
  }
  
  return text;
};

// Export i18n object for compatibility
export const i18n = {
  t,
  setLanguage,
  getCurrentLanguage,
  getCurrentLocale,
  isRTL,
  locale: currentLocale,
};

export default i18n;