/**
 * Routes Index - Salifz API v3.0
 * ✅ FIXED: Clean routing without duplicates
 * ✅ NEW: Khatam routes added
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Auth Middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, error: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'salifz_secret_2024');
    req.userId = decoded.userId || decoded.id;
    
    const User = require('../models/User');
    req.user = await User.findById(req.userId);
    
    if (!req.user) return res.status(401).json({ success: false, error: 'User not found' });
    next();
  } catch (e) { 
    console.error('Auth error:', e.message);
    res.status(401).json({ success: false, error: 'Invalid token' }); 
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'salifz_secret_2024');
      req.userId = decoded.userId || decoded.id;
      const User = require('../models/User');
      req.user = await User.findById(req.userId);
    }
  } catch (e) {}
  next();
};

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

// Safe require with fallback
const safeRequire = (path) => {
  try {
    return require(path);
  } catch (e) {
    console.warn(`Route not found: ${path}`);
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
router.use('/ai', authMiddleware, safeRequire('./ai'));
router.use('/audio', optionalAuth, safeRequire('./audio'));
router.use('/face', authMiddleware, safeRequire('./face'));
router.use('/parental', authMiddleware, safeRequire('./parental'));
router.use('/tajwid', authMiddleware, safeRequire('./tajwid'));
router.use('/analytics', authMiddleware, safeRequire('./analytics'));
router.use('/badges', authMiddleware, safeRequire('./badges'));
router.use('/competitions', authMiddleware, safeRequire('./competitions'));
router.use('/study-plans', authMiddleware, safeRequire('./studyPlans'));
router.use('/reminders', authMiddleware, safeRequire('./reminders'));
router.use('/bookmarks', authMiddleware, safeRequire('./bookmarks'));
router.use('/export', authMiddleware, safeRequire('./export'));
router.use('/settings', authMiddleware, safeRequire('./settings'));
router.use('/verification', authMiddleware, safeRequire('./verification'));

// ============================================
// ✅ NEW: KHATAM QURAN ROUTES
// ============================================
router.use('/khatam', authMiddleware, safeRequire('./khatam'));

// ============================================
// SOCIAL ROUTES (chat, halaqa, social)
// ============================================
router.use('/chat', authMiddleware, require('./chat'));
router.use('/halaqa', authMiddleware, require('./halaqa'));
router.use('/social', authMiddleware, require('./social'));

module.exports = router;