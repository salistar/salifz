/**
 * Routes Index - Salifz Backend
 * All API routes with 50+ features
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { optionalAuth, womensSpaceAuth } = require('../middleware/auth');

// Helper for safe route loading
const safeRequire = (path, fallbackRouter) => {
  try {
    return require(path);
  } catch (err) {
    console.warn(`⚠️ Route not found: ${path}`);
    return fallbackRouter || express.Router();
  }
};

// ============================================
// PUBLIC ROUTES
// ============================================

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy', 
    version: '1.0.0',
    timestamp: new Date().toISOString() 
  });
});

// Auth routes
router.use('/auth', safeRequire('./auth'));

// Quran data (public)
router.use('/quran', optionalAuth, safeRequire('./quran'));

// Prayer times (public)
router.use('/prayer', safeRequire('./prayer'));

// Daily verse (public)
router.use('/verse', safeRequire('./verse'));

// ============================================
// PROTECTED ROUTES
// ============================================

// User management
router.use('/users', auth, safeRequire('./users'));

// Progress tracking
router.use('/progress', auth, safeRequire('./progress'));

// Gamification
router.use('/gamification', auth, safeRequire('./gamification'));

// Leagues & Leaderboards
router.use('/leagues', auth, safeRequire('./leagues'));

// Achievements & Badges
router.use('/achievements', auth, safeRequire('./achievements'));
router.use('/badges', auth, safeRequire('./badges'));

// Challenges
router.use('/challenges', auth, safeRequire('./challenges'));

// Streaks
router.use('/streaks', auth, safeRequire('./streaks'));

// Rewards & Shop
router.use('/rewards', auth, safeRequire('./rewards'));

// Notifications
router.use('/notifications', auth, safeRequire('./notifications'));

// AI features
router.use('/ai', auth, safeRequire('./ai'));

// Audio
router.use('/audio', auth, safeRequire('./audio'));

// Tajwid analysis
router.use('/tajwid', auth, safeRequire('./tajwid'));

// Analytics
router.use('/analytics', auth, safeRequire('./analytics'));

// Settings
router.use('/settings', auth, safeRequire('./settings'));

// Bookmarks
router.use('/bookmarks', auth, safeRequire('./bookmarks'));

// Reminders
router.use('/reminders', auth, safeRequire('./reminders'));

// Study plans
router.use('/study-plans', auth, safeRequire('./studyPlans'));

// Export & Backup
router.use('/export', auth, safeRequire('./export'));

// Competitions
router.use('/competitions', auth, safeRequire('./competitions'));

// Subscriptions
router.use('/subscriptions', auth, safeRequire('./subscriptions'));

// ============================================
// SOCIAL ROUTES
// ============================================

// Social hub
router.use('/social', auth, safeRequire('./social'));

// Friends
router.use('/friends', auth, safeRequire('./social'));

// Halaqat (Study groups)
router.use('/halaqa', auth, safeRequire('./halaqa'));

// Chat
router.use('/chat', auth, safeRequire('./chat'));

// ============================================
// VERIFICATION ROUTES
// ============================================

// Phone/Email/Biometric verification
router.use('/verification', safeRequire('./verification'));

// Face recognition (gender detection)
router.use('/face', auth, safeRequire('./face'));

// ============================================
// WOMEN'S SPACE ROUTES
// ============================================

router.use('/women', auth, womensSpaceAuth, safeRequire('./women'));

// ============================================
// PARENTAL CONTROL ROUTES
// ============================================

router.use('/parental', auth, safeRequire('./parental'));

// ============================================
// ISLAMIC FEATURES
// ============================================

// Duas collection
router.use('/duas', optionalAuth, safeRequire('./duas'));

// 99 Names of Allah
router.use('/asma', optionalAuth, safeRequire('./asma'));

// Dhikr counter
router.use('/dhikr', auth, safeRequire('./dhikr'));

// Zakat calculator
router.use('/zakat', optionalAuth, safeRequire('./zakat'));

// Hijri calendar
router.use('/hijri', optionalAuth, safeRequire('./hijri'));

module.exports = router;
