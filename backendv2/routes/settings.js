/**
 * Settings Routes - Salifz
 */
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const user = req.user;
  res.json({
    success: true,
    data: {
      settings: {
        appearance: { theme: user.settings?.theme || 'light', fontSize: 'medium', fontFamily: 'uthmanic', colorScheme: 'green' },
        audio: { reciter: user.profile.preferredReciter || 'mishary_rashid', autoPlay: true, repeatCount: 3, playbackSpeed: 1.0 },
        notifications: { enabled: user.profile.notificationsEnabled !== false, reminderTime: user.profile.reminderTime || '08:00', streakReminder: true, dailyVerse: true },
        learning: { dailyGoal: user.profile.dailyGoal || 5, showTranslation: true, translationLanguage: 'en', reviewMode: 'spaced' },
        privacy: { publicProfile: true, showOnLeaderboard: true, allowFriendRequests: true }
      }
    }
  });
});

router.put('/', async (req, res) => {
  const { category, settings } = req.body;
  const user = req.user;
  if (!user.settings) user.settings = {};
  Object.assign(user.settings, settings);
  if (settings.dailyGoal) user.profile.dailyGoal = settings.dailyGoal;
  if (settings.reciter) user.profile.preferredReciter = settings.reciter;
  await user.save();
  res.json({ success: true, message: 'Settings updated', data: { category, settings } });
});

router.get('/themes', (req, res) => {
  res.json({
    success: true,
    data: {
      themes: [
        { id: 'light', name: { ar: 'فاتح', en: 'Light' }, colors: { primary: '#4CAF50', background: '#FFFFFF' } },
        { id: 'dark', name: { ar: 'داكن', en: 'Dark' }, colors: { primary: '#81C784', background: '#121212' } },
        { id: 'sepia', name: { ar: 'بني', en: 'Sepia' }, colors: { primary: '#8D6E63', background: '#F5F0E6' } },
        { id: 'midnight', name: { ar: 'منتصف الليل', en: 'Midnight' }, colors: { primary: '#7C4DFF', background: '#0D1117' } }
      ]
    }
  });
});

router.get('/fonts', (req, res) => {
  res.json({
    success: true,
    data: {
      fonts: [
        { id: 'uthmanic', name: 'Uthmanic Hafs', preview: 'بِسْمِ اللَّهِ' },
        { id: 'amiri', name: 'Amiri', preview: 'بِسْمِ اللَّهِ' },
        { id: 'scheherazade', name: 'Scheherazade', preview: 'بِسْمِ اللَّهِ' },
        { id: 'naskh', name: 'Noto Naskh Arabic', preview: 'بِسْمِ اللَّهِ' }
      ]
    }
  });
});

router.get('/reciters', (req, res) => {
  res.json({
    success: true,
    data: {
      reciters: [
        { id: 'mishary_rashid', name: { ar: 'مشاري راشد العفاسي', en: 'Mishary Rashid Alafasy' }, country: 'KW' },
        { id: 'abdul_basit', name: { ar: 'عبد الباسط عبد الصمد', en: 'Abdul Basit Abdul Samad' }, country: 'EG' },
        { id: 'sudais', name: { ar: 'عبد الرحمن السديس', en: 'Abdurrahman As-Sudais' }, country: 'SA' },
        { id: 'shuraim', name: { ar: 'سعود الشريم', en: 'Saud Ash-Shuraim' }, country: 'SA' },
        { id: 'maher_muaiqly', name: { ar: 'ماهر المعيقلي', en: 'Maher Al-Muaiqly' }, country: 'SA' }
      ]
    }
  });
});

router.post('/reset', async (req, res) => {
  req.user.settings = {};
  req.user.profile.dailyGoal = 5;
  req.user.profile.preferredReciter = 'mishary_rashid';
  await req.user.save();
  res.json({ success: true, message: 'Settings reset to defaults' });
});

module.exports = router;
