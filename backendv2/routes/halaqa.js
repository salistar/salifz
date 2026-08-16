/**
 * Halaqa Routes - Salifz
 * ✅ FIXED: Correct import path for halaqa.controller.js
 * ✅ FIXED: Route ordering - specific routes BEFORE :id routes
 * ✅ FIXED: Proper middleware import with fallback
 */

const express = require('express');
const router = express.Router();

// ✅ FIXED: Import with correct filename (halaqa.controller.js)
const halaqaController = require('../controllers/halaqa.controller');

// ✅ FIXED: Auth middleware with fallback
let protect;
try {
  const authModule = require('../middleware/auth');
  // Try different export names
  protect = authModule.protect || authModule.authMiddleware || authModule.auth || authModule;
  
  // Check if it's a function
  if (typeof protect !== 'function') {
    // If it's an object with a default export
    if (typeof authModule.default === 'function') {
      protect = authModule.default;
    } else {
      throw new Error('protect is not a function');
    }
  }
} catch (e) {
  console.error('[HALAQA ROUTES] Auth middleware error:', e.message);
  // Fallback middleware
  protect = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.userId = decoded.id || decoded.userId || decoded._id;
      req.user = { _id: req.userId };
      next();
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  };
}

// All routes require authentication
router.use(protect);

// ============================================
// SPECIFIC ROUTES (MUST come BEFORE /:id)
// ============================================

// Get user's halaqat
router.get('/my', halaqaController.getMyHalaqat);

// Discover public halaqat
router.get('/discover', halaqaController.discoverHalaqat);

// Join by invite code (body: { inviteCode })
router.post('/join', halaqaController.joinByCode);

// Join by invite code (url param)
router.post('/join/:code', halaqaController.joinByCode);

// ============================================
// BASIC ROUTES
// ============================================

// Get all user's halaqat
router.get('/', halaqaController.getAllHalaqat || halaqaController.getMyHalaqat);

// Create halaqa
router.post('/', halaqaController.createHalaqa);

// ============================================
// :id ROUTES (MUST come AFTER specific routes)
// ============================================

// Get single halaqa
router.get('/:id', halaqaController.getHalaqaById);

// Update halaqa
router.put('/:id', halaqaController.updateHalaqa);

// Delete halaqa
router.delete('/:id', halaqaController.deleteHalaqa);

// ============================================
// MEMBERSHIP ROUTES
// ============================================

// Join halaqa by ID
router.post('/:id/join', halaqaController.joinHalaqa);

// Leave halaqa
router.post('/:id/leave', halaqaController.leaveHalaqa);

// Get members
router.get('/:id/members', halaqaController.getMembers);

// Kick member
if (halaqaController.kickMember) {
  router.delete('/:id/members/:userId', halaqaController.kickMember);
}

// Promote to admin
if (halaqaController.promoteToAdmin) {
  router.post('/:id/admins/:userId', halaqaController.promoteToAdmin);
}

// ============================================
// ACTIVITIES ROUTES
// ============================================

// Get activities
router.get('/:id/activities', halaqaController.getActivities);

// Create activity
if (halaqaController.createActivity) {
  router.post('/:id/activities', halaqaController.createActivity);
}

// Complete activity
if (halaqaController.completeActivity) {
  router.post('/:id/activities/:activityId/complete', halaqaController.completeActivity);
}

// Delete activity
if (halaqaController.deleteActivity) {
  router.delete('/:id/activities/:activityId', halaqaController.deleteActivity);
}

// ============================================
// LEADERBOARD & STATS
// ============================================

// Get leaderboard
router.get('/:id/leaderboard', halaqaController.getLeaderboard);

// Get stats
if (halaqaController.getStats) {
  router.get('/:id/stats', halaqaController.getStats);
}

// Log activity
if (halaqaController.logActivity) {
  router.post('/:id/log', halaqaController.logActivity);
}

// ============================================
// MESSAGES
// ============================================

// Get messages
router.get('/:id/messages', halaqaController.getMessages);

// Send message
if (halaqaController.sendMessage) {
  router.post('/:id/messages', halaqaController.sendMessage);
}

module.exports = router;