/**
 * Routes Index - Salifz API v3.0
 * ✅ FIXED: Clean routing without duplicates
 * ✅ NEW: Khatam routes added
 */

const express = require('express');
const router = express.Router();

// Middleware d'authentification unique de l'application.
// L'ancienne copie locale est supprimée : elle utilisait un secret de repli en
// dur (S7), ne vérifiait pas le type de jeton (S2) et laissait passer les
// comptes bannis (S10).
const { auth: authMiddleware, optionalAuth } = require('../middleware/auth');
const { requireFeature } = require('../middleware/parentalControls');
const { otpLimiter, heavyLimiter } = require('../middleware/rateLimit');

// Health check
router.get('/health', (req, res) => res.json({ 
  success: true, 
  message: 'Salifz API v3.0', 
  timestamp: new Date().toISOString() 
}));

router.get('/', (req, res) => res.json({ 
  success: true, 
  message: 'Salifz API', 
  version: '3.0.0', 
  routes: 32 
}));

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================
router.use('/auth', require('./auth'));

// Chargement d'un routeur. En production, une route manquante ou cassée est une
// erreur de déploiement : on refuse de démarrer plutôt que de servir un routeur
// vide, qui donnait des 404 impossibles à distinguer d'un bug applicatif.
const safeRequire = (path) => {
  try {
    return require(path);
  } catch (e) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`[ROUTES] Impossible de charger ${path} : ${e.message}`);
    }
    console.error(`[ROUTES] ⚠️  ${path} non chargé (${e.message}) — routeur vide en dev.`);
    return express.Router();
  }
};

router.use('/prayer', safeRequire('./prayer'));
router.use('/verse', safeRequire('./verse'));

// ============================================
// PROTECTED ROUTES (auth required)
// ============================================
router.use('/users', authMiddleware, safeRequire('./users'));
router.use('/quran', optionalAuth, safeRequire('./quran'));
router.use('/progress', authMiddleware, safeRequire('./progress'));
router.use('/gamification', authMiddleware, safeRequire('./gamification'));
router.use('/leagues', authMiddleware, safeRequire('./leagues'));
router.use('/leaderboard', authMiddleware, safeRequire('./leagues'));
router.use('/achievements', authMiddleware, safeRequire('./achievements'));
router.use('/subscriptions', authMiddleware, safeRequire('./subscriptions'));
router.use('/challenges', authMiddleware, safeRequire('./challenges'));
router.use('/streaks', authMiddleware, safeRequire('./streaks'));
router.use('/rewards', authMiddleware, safeRequire('./rewards'));
router.use('/notifications', authMiddleware, safeRequire('./notifications'));
// Routes coûteuses (upload audio, analyse) : limitées plus strictement.
router.use('/ai', authMiddleware, heavyLimiter, safeRequire('./ai'));
router.use('/audio', optionalAuth, safeRequire('./audio'));
router.use('/face', authMiddleware, safeRequire('./face'));
router.use('/parental', authMiddleware, safeRequire('./parental'));
router.use('/tajwid', authMiddleware, heavyLimiter, safeRequire('./tajwid'));
router.use('/analytics', authMiddleware, safeRequire('./analytics'));
router.use('/badges', authMiddleware, safeRequire('./badges'));
router.use('/competitions', authMiddleware, safeRequire('./competitions'));
router.use('/study-plans', authMiddleware, safeRequire('./studyPlans'));
router.use('/reminders', authMiddleware, safeRequire('./reminders'));
router.use('/bookmarks', authMiddleware, safeRequire('./bookmarks'));
router.use('/export', authMiddleware, safeRequire('./export'));
router.use('/settings', authMiddleware, safeRequire('./settings'));
// Envoi et vérification de codes OTP : cible privilégiée du bourrinage (S8).
router.use('/verification', authMiddleware, otpLimiter, safeRequire('./verification'));

// ============================================
// ✅ NEW: KHATAM QURAN ROUTES
// ============================================
router.use('/khatam', authMiddleware, safeRequire('./khatam'));

// ============================================
// SOCIAL ROUTES (chat, halaqa, social)
// ============================================
// S13 : le contrôle parental est désormais réellement appliqué sur les
// fonctionnalités sociales, au lieu d'être seulement stocké sur le compte.
router.use('/chat', authMiddleware, requireFeature('chat'), require('./chat'));
router.use('/halaqa', authMiddleware, requireFeature('halaqa_chat'), require('./halaqa'));
router.use('/social', authMiddleware, requireFeature('social'), require('./social'));

module.exports = router;