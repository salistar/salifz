/**
 * Challenge Model - Salifz
 */

const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  // Challenge definition
  challengeId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['memorize', 'review', 'streak', 'xp', 'time', 'accuracy', 'social'],
    required: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'special'],
    default: 'daily'
  },
  // `fr` était absent du schéma alors que l'interface propose le français :
  // en mode strict, Mongoose jetait silencieusement la traduction et les
  // écrans retombaient sur l'anglais. Même défaut que sur `ShopItem`.
  title: {
    ar: { type: String, required: true },
    en: { type: String, required: true },
    fr: String
  },
  description: {
    ar: String,
    en: String,
    fr: String
  },
  icon: {
    type: String,
    default: '🎯'
  },
  color: {
    type: String,
    default: '#4CAF50'
  },
  
  // Requirements
  target: {
    type: Number,
    required: true
  },
  targetUnit: {
    type: String,
    enum: ['verses', 'minutes', 'xp', 'days', 'sessions', 'percent'],
    default: 'verses'
  },
  
  // Rewards
  rewards: {
    xp: { type: Number, default: 50 },
    gems: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    streakFreeze: { type: Number, default: 0 }
  },
  
  // Availability
  isActive: {
    type: Boolean,
    default: true
  },
  startsAt: Date,
  endsAt: Date,
  
  // Difficulty
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'extreme'],
    default: 'medium'
  },
  
  // Premium only?
  isPremiumOnly: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// User's challenge progress
const userChallengeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  isRewardClaimed: {
    type: Boolean,
    default: false
  },
  claimedAt: Date,
  startedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

userChallengeSchema.index({ user: 1, challenge: 1 }, { unique: true });
userChallengeSchema.index({ user: 1, isCompleted: 1 });

const Challenge = mongoose.model('Challenge', challengeSchema);
const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);

// Seed default challenges
Challenge.seedDefaults = async function() {
  const defaultChallenges = [
    // Daily challenges
    {
      challengeId: 'daily_memorize_5',
      type: 'memorize',
      period: 'daily',
      title: { ar: 'احفظ 5 آيات', en: 'Memorize 5 verses', fr: 'Mémoriser 5 versets' },
      description: { ar: 'احفظ 5 آيات جديدة اليوم', en: 'Memorize 5 new verses today', fr: 'Mémoriser 5 nouveaux versets aujourd’hui' },
      icon: '📖',
      target: 5,
      targetUnit: 'verses',
      rewards: { xp: 50, gems: 5 },
      difficulty: 'easy'
    },
    {
      challengeId: 'daily_review_10',
      type: 'review',
      period: 'daily',
      title: { ar: 'راجع 10 آيات', en: 'Review 10 verses', fr: 'Réviser 10 versets' },
      description: { ar: 'راجع 10 آيات محفوظة', en: 'Review 10 memorized verses', fr: 'Réviser 10 versets déjà mémorisés' },
      icon: '🔄',
      target: 10,
      targetUnit: 'verses',
      rewards: { xp: 30, gems: 3 },
      difficulty: 'easy'
    },
    {
      challengeId: 'daily_xp_100',
      type: 'xp',
      period: 'daily',
      title: { ar: 'اكسب 100 XP', en: 'Earn 100 XP', fr: 'Gagner 100 XP' },
      description: { ar: 'اجمع 100 نقطة خبرة اليوم', en: 'Collect 100 XP today', fr: 'Cumuler 100 XP aujourd’hui' },
      icon: '⚡',
      target: 100,
      targetUnit: 'xp',
      rewards: { xp: 25, gems: 2 },
      difficulty: 'medium'
    },
    {
      challengeId: 'daily_perfect_session',
      type: 'accuracy',
      period: 'daily',
      title: { ar: 'جلسة مثالية', en: 'Perfect Session', fr: 'Séance sans faute' },
      description: { ar: 'أكمل جلسة بدون أخطاء', en: 'Complete a session without mistakes', fr: 'Terminer une séance sans erreur' },
      icon: '💯',
      target: 100,
      targetUnit: 'percent',
      rewards: { xp: 75, gems: 10 },
      difficulty: 'hard'
    },
    
    // Weekly challenges
    {
      challengeId: 'weekly_memorize_30',
      type: 'memorize',
      period: 'weekly',
      title: { ar: 'احفظ 30 آية', en: 'Memorize 30 verses' },
      description: { ar: 'احفظ 30 آية هذا الأسبوع', en: 'Memorize 30 verses this week' },
      icon: '📚',
      target: 30,
      targetUnit: 'verses',
      rewards: { xp: 300, gems: 50 },
      difficulty: 'medium'
    },
    {
      challengeId: 'weekly_streak_7',
      type: 'streak',
      period: 'weekly',
      title: { ar: 'سلسلة أسبوع', en: 'Week Streak' },
      description: { ar: 'حافظ على سلسلة 7 أيام', en: 'Maintain a 7-day streak' },
      icon: '🔥',
      target: 7,
      targetUnit: 'days',
      rewards: { xp: 200, gems: 30, streakFreeze: 1 },
      difficulty: 'medium'
    },
    {
      challengeId: 'weekly_xp_500',
      type: 'xp',
      period: 'weekly',
      title: { ar: 'اكسب 500 XP', en: 'Earn 500 XP' },
      description: { ar: 'اجمع 500 نقطة خبرة هذا الأسبوع', en: 'Collect 500 XP this week' },
      icon: '🏆',
      target: 500,
      targetUnit: 'xp',
      rewards: { xp: 100, gems: 25 },
      difficulty: 'medium'
    },
    
    // Monthly challenges
    {
      challengeId: 'monthly_surah_complete',
      type: 'memorize',
      period: 'monthly',
      title: { ar: 'أكمل سورة', en: 'Complete a Surah' },
      description: { ar: 'احفظ سورة كاملة هذا الشهر', en: 'Memorize a complete Surah this month' },
      icon: '🌟',
      target: 1,
      targetUnit: 'verses',
      rewards: { xp: 1000, gems: 100 },
      difficulty: 'hard'
    },
    {
      challengeId: 'monthly_streak_30',
      type: 'streak',
      period: 'monthly',
      title: { ar: 'سلسلة شهر', en: 'Month Streak' },
      description: { ar: 'حافظ على سلسلة 30 يوم', en: 'Maintain a 30-day streak' },
      icon: '💎',
      target: 30,
      targetUnit: 'days',
      rewards: { xp: 500, gems: 200, streakFreeze: 3 },
      difficulty: 'extreme'
    }
  ];

  for (const challenge of defaultChallenges) {
    await Challenge.findOneAndUpdate(
      { challengeId: challenge.challengeId },
      challenge,
      { upsert: true, new: true }
    );
  }
  
  console.log('✅ Challenges seeded');
};

module.exports = { Challenge, UserChallenge };