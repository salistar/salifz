/**
 * Notification Model - Salifz
 */

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: [
      'streak_reminder',
      'streak_at_risk',
      'streak_lost',
      'streak_milestone',
      'level_up',
      'achievement_unlocked',
      'league_promotion',
      'league_demotion',
      'friend_request',
      'friend_accepted',
      'challenge_complete',
      'daily_reminder',
      'weekly_summary',
      'hearts_refilled',
      'new_content',
      'halaqa_invite',
      'system'
    ],
    required: true
  },
  title: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  body: {
    ar: { type: String, required: true },
    en: { type: String, required: true }
  },
  icon: {
    type: String,
    default: '🔔'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  action: {
    screen: String,
    params: mongoose.Schema.Types.Mixed
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

// Static method to create common notifications
notificationSchema.statics.createStreakReminder = async function(userId) {
  return this.create({
    user: userId,
    type: 'streak_reminder',
    title: {
      ar: 'حافظ على سلسلتك! 🔥',
      en: 'Keep your streak! 🔥'
    },
    body: {
      ar: 'لم تتدرب اليوم بعد. ادخل الآن للحفاظ على سلسلتك!',
      en: "You haven't practiced today yet. Come back to keep your streak!"
    },
    icon: '🔥',
    action: { screen: 'Home' }
  });
};

notificationSchema.statics.createLevelUp = async function(userId, newLevel) {
  return this.create({
    user: userId,
    type: 'level_up',
    title: {
      ar: `مبروك! وصلت للمستوى ${newLevel} 🎉`,
      en: `Congratulations! You reached level ${newLevel} 🎉`
    },
    body: {
      ar: 'استمر في التقدم وحقق المزيد من الإنجازات!',
      en: 'Keep going and unlock more achievements!'
    },
    icon: '⭐',
    action: { screen: 'Profile' },
    metadata: { level: newLevel }
  });
};

notificationSchema.statics.createAchievementUnlocked = async function(userId, achievement) {
  return this.create({
    user: userId,
    type: 'achievement_unlocked',
    title: {
      ar: `إنجاز جديد: ${achievement.nameAr || achievement.name}`,
      en: `New Achievement: ${achievement.name}`
    },
    body: {
      ar: achievement.descriptionAr || achievement.description,
      en: achievement.description
    },
    icon: achievement.icon,
    action: { screen: 'Achievements' },
    metadata: { achievementId: achievement._id }
  });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;