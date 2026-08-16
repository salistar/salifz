/**
 * Achievement Model - Salifz
 * Defines all badges, milestones, and achievements users can unlock
 */

const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  achievementId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  nameAr: String,
  description: { type: String, required: true },
  descriptionAr: String,
  icon: { type: String, required: true },
  color: { type: String, default: '#10B981' },
  rarity: { type: String, enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'], default: 'common' },
  category: { type: String, enum: ['memorization', 'streak', 'tajwid', 'social', 'explorer', 'dedication', 'challenge', 'special'], required: true },
  requirement: {
    type: { type: String, required: true },
    value: { type: Number, required: true },
    surahNumber: Number
  },
  xpReward: { type: Number, default: 50 },
  gemsReward: { type: Number, default: 0 },
  isSecret: { type: Boolean, default: false },
  isLimited: { type: Boolean, default: false },
  availableFrom: Date,
  availableUntil: Date,
  totalUnlocks: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

achievementSchema.index({ category: 1 });
achievementSchema.index({ 'requirement.type': 1 });

const Achievement = mongoose.model('Achievement', achievementSchema);

// Default achievements seed data
const defaultAchievements = [
  // Memorization achievements
  { achievementId: 'first_verse', name: 'First Step', nameAr: 'الخطوة الأولى', description: 'Memorize your first verse', icon: '🌟', category: 'memorization', requirement: { type: 'verses_memorized', value: 1 }, xpReward: 10, rarity: 'common' },
  { achievementId: 'verses_10', name: 'Getting Started', nameAr: 'البداية', description: 'Memorize 10 verses', icon: '📖', category: 'memorization', requirement: { type: 'verses_memorized', value: 10 }, xpReward: 50, rarity: 'common' },
  { achievementId: 'verses_100', name: 'Century', nameAr: 'مئة آية', description: 'Memorize 100 verses', icon: '💯', category: 'memorization', requirement: { type: 'verses_memorized', value: 100 }, xpReward: 200, rarity: 'uncommon' },
  { achievementId: 'verses_500', name: 'Dedicated Learner', nameAr: 'طالب مجتهد', description: 'Memorize 500 verses', icon: '🎯', category: 'memorization', requirement: { type: 'verses_memorized', value: 500 }, xpReward: 500, rarity: 'rare' },
  { achievementId: 'verses_1000', name: 'Scholar', nameAr: 'عالم', description: 'Memorize 1000 verses', icon: '🏆', category: 'memorization', requirement: { type: 'verses_memorized', value: 1000 }, xpReward: 1000, rarity: 'epic' },
  { achievementId: 'full_quran', name: 'Hafiz', nameAr: 'حافظ', description: 'Complete Quran memorization', icon: '👑', category: 'memorization', requirement: { type: 'verses_memorized', value: 6236 }, xpReward: 10000, gemsReward: 1000, rarity: 'legendary' },
  
  // Surah achievements
  { achievementId: 'fatiha_master', name: 'Opener Master', nameAr: 'فاتح الكتاب', description: 'Master Al-Fatiha', icon: '🔑', category: 'memorization', requirement: { type: 'surah_completed', value: 1, surahNumber: 1 }, xpReward: 100, rarity: 'common' },
  { achievementId: 'baqara_master', name: 'The Cow Keeper', nameAr: 'حافظ البقرة', description: 'Complete Surah Al-Baqara', icon: '🐄', category: 'memorization', requirement: { type: 'surah_completed', value: 1, surahNumber: 2 }, xpReward: 2000, rarity: 'legendary' },
  { achievementId: 'yasin_master', name: 'Heart of Quran', nameAr: 'قلب القرآن', description: 'Master Surah Yasin', icon: '💚', category: 'memorization', requirement: { type: 'surah_completed', value: 1, surahNumber: 36 }, xpReward: 500, rarity: 'rare' },
  { achievementId: 'juz_amma', name: 'Juz Amma Complete', nameAr: 'جزء عم', description: 'Complete Juz 30', icon: '📚', category: 'memorization', requirement: { type: 'juz_completed', value: 30 }, xpReward: 1000, rarity: 'epic' },
  
  // Streak achievements
  { achievementId: 'streak_3', name: 'Warming Up', nameAr: 'البداية', description: '3 day streak', icon: '🔥', category: 'streak', requirement: { type: 'streak_days', value: 3 }, xpReward: 30, rarity: 'common' },
  { achievementId: 'streak_7', name: 'Week Warrior', nameAr: 'محارب الأسبوع', description: '7 day streak', icon: '🔥', category: 'streak', requirement: { type: 'streak_days', value: 7 }, xpReward: 70, rarity: 'common' },
  { achievementId: 'streak_30', name: 'Monthly Master', nameAr: 'شهر كامل', description: '30 day streak', icon: '🔥', category: 'streak', requirement: { type: 'streak_days', value: 30 }, xpReward: 300, rarity: 'uncommon' },
  { achievementId: 'streak_100', name: 'Centurion', nameAr: 'المئوي', description: '100 day streak', icon: '💎', category: 'streak', requirement: { type: 'streak_days', value: 100 }, xpReward: 1000, rarity: 'rare' },
  { achievementId: 'streak_365', name: 'Year of Dedication', nameAr: 'عام من التفاني', description: '365 day streak', icon: '🌟', category: 'streak', requirement: { type: 'streak_days', value: 365 }, xpReward: 5000, gemsReward: 500, rarity: 'legendary' },
  
  // Tajwid achievements
  { achievementId: 'tajwid_perfect_10', name: 'Perfect Pronunciation', nameAr: 'نطق مثالي', description: '10 perfect tajwid lessons', icon: '🎤', category: 'tajwid', requirement: { type: 'perfect_lessons', value: 10 }, xpReward: 100, rarity: 'uncommon' },
  { achievementId: 'tajwid_90', name: 'Tajwid Expert', nameAr: 'خبير التجويد', description: 'Average 90% tajwid score', icon: '🏅', category: 'tajwid', requirement: { type: 'tajwid_score', value: 90 }, xpReward: 500, rarity: 'rare' },
  
  // Social achievements
  { achievementId: 'first_friend', name: 'Companion', nameAr: 'رفيق', description: 'Add your first friend', icon: '🤝', category: 'social', requirement: { type: 'friends_count', value: 1 }, xpReward: 20, rarity: 'common' },
  { achievementId: 'friends_10', name: 'Social Butterfly', nameAr: 'اجتماعي', description: 'Have 10 friends', icon: '👥', category: 'social', requirement: { type: 'friends_count', value: 10 }, xpReward: 100, rarity: 'uncommon' },
  { achievementId: 'halaqa_join', name: 'Study Circle', nameAr: 'حلقة علم', description: 'Join a Halaqa', icon: '⭕', category: 'social', requirement: { type: 'halaqa_joined', value: 1 }, xpReward: 50, rarity: 'common' },
  
  // League achievements
  { achievementId: 'league_silver', name: 'Silver League', nameAr: 'الدوري الفضي', description: 'Reach Silver League', icon: '🥈', category: 'challenge', requirement: { type: 'league_reached', value: 2 }, xpReward: 200, rarity: 'uncommon' },
  { achievementId: 'league_gold', name: 'Gold League', nameAr: 'الدوري الذهبي', description: 'Reach Gold League', icon: '🥇', category: 'challenge', requirement: { type: 'league_reached', value: 3 }, xpReward: 500, rarity: 'rare' },
  { achievementId: 'league_diamond', name: 'Diamond League', nameAr: 'الدوري الماسي', description: 'Reach Diamond League', icon: '💎', category: 'challenge', requirement: { type: 'league_reached', value: 4 }, xpReward: 1000, rarity: 'epic' },
  { achievementId: 'league_hafiz', name: 'Hafiz League', nameAr: 'دوري الحفاظ', description: 'Reach Hafiz League', icon: '👑', category: 'challenge', requirement: { type: 'league_reached', value: 5 }, xpReward: 2000, rarity: 'legendary' },
];

Achievement.seedDefaults = async function() {
  for (const achievement of defaultAchievements) {
    await Achievement.findOneAndUpdate(
      { achievementId: achievement.achievementId },
      achievement,
      { upsert: true, new: true }
    );
  }
  console.log('✅ Achievements seeded');
};

module.exports = Achievement;
