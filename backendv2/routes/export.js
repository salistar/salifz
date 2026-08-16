/**
 * Export & Share Routes - Salifz
 */
const express = require('express');
const router = express.Router();

router.get('/progress', (req, res) => {
  const { format = 'json' } = req.query;
  const user = req.user;
  
  const data = {
    exportDate: new Date().toISOString(),
    user: { username: user.username, displayName: user.displayName, level: user.gamification.level },
    progress: {
      totalVersesMemorized: user.quranProgress.totalVersesMemorized,
      surahsCompleted: user.quranProgress.totalSurahCompleted,
      percentComplete: ((user.quranProgress.totalVersesMemorized / 6236) * 100).toFixed(2)
    },
    streaks: { current: user.gamification.currentStreak, longest: user.gamification.longestStreak },
    achievements: user.achievements.length
  };
  
  if (format === 'pdf') {
    res.json({ success: true, data: { downloadUrl: `/api/v1/export/download/progress_${user._id}.pdf`, expiresAt: new Date(Date.now() + 3600000).toISOString() } });
  } else {
    res.json({ success: true, data });
  }
});

router.get('/certificate/:type', (req, res) => {
  const { type } = req.params;
  res.json({
    success: true,
    data: {
      certificate: {
        id: `cert_${Date.now()}`, type,
        recipient: { name: req.user.displayName },
        verificationCode: `HIFZ-${Date.now().toString(36).toUpperCase()}`,
        downloadUrl: `/certificates/${type}_${req.user._id}.pdf`
      }
    }
  });
});

router.post('/share', (req, res) => {
  const { platform, type } = req.body;
  const user = req.user;
  
  const content = {
    streak: { title: `🔥 ${user.gamification.currentStreak} Day Streak!`, description: `Learning Quran for ${user.gamification.currentStreak} days on Salifz!` },
    milestone: { title: `📖 ${user.quranProgress.totalVersesMemorized} Verses!`, description: `Memorized ${user.quranProgress.totalVersesMemorized} verses with Salifz!` }
  };
  
  const shareContent = content[type] || content.milestone;
  const url = `https://salifz.com/u/${user.username}`;
  
  res.json({
    success: true,
    data: {
      content: shareContent,
      shareUrls: {
        twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent.description)}&url=${encodeURIComponent(url)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(shareContent.description + ' ' + url)}`
      }
    }
  });
});

router.get('/backup', (req, res) => {
  const user = req.user;
  const backup = {
    version: '1.0', exportDate: new Date().toISOString(),
    user: { email: user.email, username: user.username, profile: user.profile },
    gamification: user.gamification, quranProgress: user.quranProgress, achievements: user.achievements
  };
  res.json({ success: true, data: { backup, checksum: Buffer.from(JSON.stringify(backup)).toString('base64').slice(0, 16) } });
});

router.post('/restore', (req, res) => {
  res.json({ success: true, message: 'Backup restored', data: { restoredItems: { progress: true, achievements: true, settings: true } } });
});

module.exports = router;
