/**
 * Badges Routes - Salifz
 */
const express = require('express');
const router = express.Router();

const BADGES = [
  { id: 'first_verse', name: { ar: 'الخطوة الأولى', en: 'First Step' }, icon: '🌱', category: 'progress', requirement: { type: 'verses', count: 1 }, xpReward: 10 },
  { id: 'verse_100', name: { ar: 'حافظ واعد', en: 'Promising Hafiz' }, icon: '⭐', category: 'progress', requirement: { type: 'verses', count: 100 }, xpReward: 200 },
  { id: 'verse_1000', name: { ar: 'نجم القرآن', en: 'Quran Star' }, icon: '💫', category: 'progress', requirement: { type: 'verses', count: 1000 }, xpReward: 1000 },
  { id: 'streak_7', name: { ar: 'أسبوع متواصل', en: 'Week Warrior' }, icon: '🔥', category: 'streak', requirement: { type: 'streak', count: 7 }, xpReward: 100 },
  { id: 'streak_30', name: { ar: 'شهر متواصل', en: 'Month Master' }, icon: '🔥🔥', category: 'streak', requirement: { type: 'streak', count: 30 }, xpReward: 500 },
  { id: 'streak_365', name: { ar: 'سنة كاملة', en: 'Year Champion' }, icon: '🏆', category: 'streak', requirement: { type: 'streak', count: 365 }, xpReward: 5000 },
  { id: 'first_friend', name: { ar: 'صديق جديد', en: 'New Friend' }, icon: '🤝', category: 'social', requirement: { type: 'friends', count: 1 }, xpReward: 25 },
  { id: 'tajwid_master', name: { ar: 'متقن التجويد', en: 'Tajwid Master' }, icon: '🎶', category: 'tajwid', requirement: { type: 'tajwid_score', count: 90 }, xpReward: 300 },
  { id: 'early_bird', name: { ar: 'طائر مبكر', en: 'Early Bird' }, icon: '🌅', category: 'special', requirement: { type: 'fajr_study', count: 10 }, xpReward: 150 },
  { id: 'ramadan_warrior', name: { ar: 'محارب رمضان', en: 'Ramadan Warrior' }, icon: '🌙', category: 'special', requirement: { type: 'ramadan_streak', count: 30 }, xpReward: 1000 }
];

const TITLES = [
  { id: 'student', name: { ar: 'طالب', en: 'Student' }, requirement: { level: 1 } },
  { id: 'learner', name: { ar: 'متعلم', en: 'Learner' }, requirement: { level: 5 } },
  { id: 'hafiz', name: { ar: 'حافظ', en: 'Hafiz' }, requirement: { level: 30 } },
  { id: 'master', name: { ar: 'أستاذ', en: 'Master' }, requirement: { level: 50 } },
  { id: 'legend', name: { ar: 'أسطورة', en: 'Legend' }, requirement: { level: 100 } }
];

function calculateProgress(user, badge) {
  const req = badge.requirement;
  let current = 0;
  switch (req.type) {
    case 'verses': current = user.quranProgress.totalVersesMemorized; break;
    case 'streak': current = user.gamification.longestStreak; break;
    case 'friends': current = user.social?.friends?.length || 0; break;
    case 'tajwid_score': current = user.quranProgress.avgTajwidScore || 0; break;
    default: current = 0;
  }
  return Math.min(100, Math.round((current / req.count) * 100));
}

router.get('/all', (req, res) => {
  const userBadges = req.user.achievements.map(a => a.achievementId?.toString());
  const badges = BADGES.map(b => ({
    ...b, unlocked: userBadges.includes(b.id),
    progress: calculateProgress(req.user, b)
  }));
  res.json({ success: true, data: { badges, categories: ['progress', 'streak', 'social', 'tajwid', 'special'] } });
});

router.get('/unlocked', (req, res) => {
  const badges = req.user.achievements.map(a => ({ ...BADGES.find(b => b.id === a.achievementId), unlockedAt: a.unlockedAt })).filter(b => b.id);
  res.json({ success: true, data: { badges, total: badges.length } });
});

router.get('/titles', (req, res) => {
  const titles = TITLES.map(t => ({ ...t, unlocked: req.user.gamification.level >= t.requirement.level }));
  res.json({ success: true, data: { titles } });
});

router.post('/check', async (req, res) => {
  const user = req.user;
  const newBadges = [];
  const existing = user.achievements.map(a => a.achievementId?.toString());
  
  for (const badge of BADGES) {
    if (existing.includes(badge.id)) continue;
    const progress = calculateProgress(user, badge);
    if (progress >= 100) {
      user.achievements.push({ achievementId: badge.id, unlockedAt: new Date(), progress: 100 });
      user.gamification.totalXP += badge.xpReward;
      newBadges.push(badge);
    }
  }
  
  if (newBadges.length > 0) await user.save();
  res.json({ success: true, data: { newBadges, totalBadges: user.achievements.length } });
});

module.exports = router;
