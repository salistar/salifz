/**
 * Analytics Routes - Salifz
 */
const express = require('express');
const router = express.Router();

router.get('/overview', async (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    data: {
      overview: {
        progress: {
          totalVersesMemorized: user.quranProgress.totalVersesMemorized,
          percentComplete: ((user.quranProgress.totalVersesMemorized / 6236) * 100).toFixed(2),
          surahsCompleted: user.quranProgress.totalSurahCompleted,
          juzCompleted: user.quranProgress.totalJuzCompleted
        },
        studyTime: { totalMinutes: Math.floor(Math.random() * 5000), thisWeek: Math.floor(Math.random() * 300) },
        streaks: { current: user.gamification.currentStreak, longest: user.gamification.longestStreak },
        performance: { avgTajwidScore: user.quranProgress.avgTajwidScore || 75, avgAccuracy: 80 },
        gamification: { level: user.gamification.level, totalXP: user.gamification.totalXP, gems: user.gamification.gems }
      }
    }
  });
});

router.get('/weekly', (req, res) => {
  const days = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const data = days.map((day, i) => ({
    day, date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
    versesLearned: Math.floor(Math.random() * 10), minutesSpent: Math.floor(Math.random() * 60)
  }));
  res.json({ success: true, data: { weeklyData: data } });
});

router.get('/heatmap', (req, res) => {
  const { months = 6 } = req.query;
  const heatmap = [];
  const start = new Date(); start.setMonth(start.getMonth() - parseInt(months));
  for (let d = new Date(start); d <= new Date(); d.setDate(d.getDate() + 1)) {
    heatmap.push({ date: d.toISOString().split('T')[0], count: Math.floor(Math.random() * 5) });
  }
  res.json({ success: true, data: { heatmap } });
});

module.exports = router;
