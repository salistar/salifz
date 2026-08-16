/**
 * Competitions Routes - Salifz
 */
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const competitions = [
    { id: 'weekly_champion', name: { ar: 'بطل الأسبوع', en: 'Weekly Champion' }, type: 'weekly', status: 'active', participants: 1250, prizes: [{ rank: 1, reward: { gems: 500 } }] },
    { id: 'ramadan_race', name: { ar: 'سباق رمضان', en: 'Ramadan Race' }, type: 'monthly', status: 'upcoming', participants: 0 },
    { id: 'halaqa_battle', name: { ar: 'معركة الحلقات', en: 'Halaqa Battle' }, type: 'team', status: 'active', participants: 45 }
  ];
  res.json({ success: true, data: { competitions } });
});

router.post('/:id/join', (req, res) => {
  res.json({ success: true, message: 'Joined competition', data: { competitionId: req.params.id } });
});

router.get('/:id/leaderboard', (req, res) => {
  const leaderboard = Array.from({ length: 20 }, (_, i) => ({
    rank: i + 1, username: `user_${i}`, score: 1000 - i * 40, avatar: `avatar_${i % 5}`
  }));
  res.json({ success: true, data: { leaderboard } });
});

module.exports = router;
