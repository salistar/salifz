/**
 * Settings Routes - Salifz
 */
const express = require('express');
const router = express.Router();

/**
 * Deux sources pour un même écran : quelques réglages vivent dans `profile`
 * (récitateur, objectif, rappels) parce que le reste du serveur les lit là —
 * les cron de rappel, la génération d'audio. Les autres vivent dans
 * `settings`. La réponse les rassemble par catégorie pour que le client n'ait
 * pas à connaître ce découpage.
 */
function present(user) {
  const s = user.settings || {};
  return {
    appearance: {
      theme: s.appearance?.theme ?? 'light',
      fontSize: s.appearance?.fontSize ?? 'medium',
      fontFamily: s.appearance?.fontFamily ?? 'uthmanic',
      colorScheme: s.appearance?.colorScheme ?? 'green'
    },
    audio: {
      reciter: user.profile?.preferredReciter ?? 'mishary_rashid',
      autoPlay: s.audio?.autoPlay ?? true,
      repeatCount: s.audio?.repeatCount ?? 3,
      playbackSpeed: s.audio?.playbackSpeed ?? 1.0
    },
    notifications: {
      enabled: user.profile?.notificationsEnabled !== false,
      reminderTime: user.profile?.reminderTime ?? '08:00',
      streakReminder: s.notifications?.streakReminder ?? true,
      dailyVerse: s.notifications?.dailyVerse ?? true
    },
    learning: {
      dailyGoal: user.profile?.dailyGoal ?? 5,
      showTranslation: s.learning?.showTranslation ?? true,
      translationLanguage: s.learning?.translationLanguage ?? 'en',
      reviewMode: s.learning?.reviewMode ?? 'spaced'
    },
    privacy: {
      publicProfile: s.privacy?.publicProfile ?? true,
      showOnLeaderboard: s.privacy?.showOnLeaderboard ?? true,
      allowFriendRequests: s.privacy?.allowFriendRequests ?? true
    }
  };
}

/**
 * Chaque clé acceptée est associée à l'endroit où elle est réellement stockée.
 * Une clé absente de cette table est ignorée : mieux vaut ne rien écrire que
 * de laisser passer un champ arbitraire dans le document utilisateur.
 */
const WRITABLE = {
  theme: 'settings.appearance.theme',
  fontSize: 'settings.appearance.fontSize',
  fontFamily: 'settings.appearance.fontFamily',
  colorScheme: 'settings.appearance.colorScheme',
  reciter: 'profile.preferredReciter',
  autoPlay: 'settings.audio.autoPlay',
  repeatCount: 'settings.audio.repeatCount',
  playbackSpeed: 'settings.audio.playbackSpeed',
  enabled: 'profile.notificationsEnabled',
  reminderTime: 'profile.reminderTime',
  streakReminder: 'settings.notifications.streakReminder',
  dailyVerse: 'settings.notifications.dailyVerse',
  dailyGoal: 'profile.dailyGoal',
  showTranslation: 'settings.learning.showTranslation',
  translationLanguage: 'settings.learning.translationLanguage',
  reviewMode: 'settings.learning.reviewMode',
  publicProfile: 'settings.privacy.publicProfile',
  showOnLeaderboard: 'settings.privacy.showOnLeaderboard',
  allowFriendRequests: 'settings.privacy.allowFriendRequests'
};

router.get('/', (req, res) => {
  res.json({ success: true, data: { settings: present(req.user) } });
});

router.put('/', async (req, res) => {
  const { category, settings } = req.body || {};
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ success: false, error: 'settings manquant' });
  }

  const user = req.user;
  const ignored = [];

  for (const [key, value] of Object.entries(settings)) {
    const path = WRITABLE[key];
    if (!path) { ignored.push(key); continue; }
    user.set(path, value);
  }

  try {
    await user.save();
  } catch (error) {
    // Les enums et bornes du schéma rejettent ici une valeur invalide. Le
    // client doit l'apprendre plutôt que de croire son réglage enregistré.
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Réglage invalide',
        details: Object.keys(error.errors)
      });
    }
    throw error;
  }

  res.json({
    success: true,
    message: 'Settings updated',
    // On renvoie l'état relu, pas l'entrée : le client affiche ce qui est
    // réellement stocké, y compris quand une clé a été ignorée.
    data: { category, settings: present(user), ignored }
  });
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
  // `undefined` laisse Mongoose réappliquer les valeurs par défaut du schéma,
  // ce qu'un objet vide ne fait pas pour les sous-documents déjà peuplés.
  req.user.set('settings', undefined);
  req.user.profile.dailyGoal = 5;
  req.user.profile.preferredReciter = 'mishary_rashid';
  req.user.profile.notificationsEnabled = true;
  req.user.profile.reminderTime = '08:00';
  await req.user.save();
  res.json({ success: true, message: 'Settings reset to defaults', data: { settings: present(req.user) } });
});

module.exports = router;
