/**
 * Halaqa Routes - Salifz
 * ✅ FIXED: Correct import path for halaqa.controller.js
 * ✅ FIXED: Route ordering - specific routes BEFORE :id routes
 * ✅ FIXED: Proper middleware import with fallback
 */

const express = require('express');
const router = express.Router();

const halaqaController = require('../controllers/halaqa.controller');

// L'authentification est déjà appliquée en amont, dans routes/index.js
// (`router.use('/halaqa', authMiddleware, …)`). L'ancien try/catch installait,
// en cas d'erreur de require, un middleware de secours dangereux : secret en
// dur `'your-secret-key'` (S7), aucune vérification du type de jeton (S2) ni
// du statut banni (S10). Une simple erreur transitoire au chargement suffisait
// à faire basculer tout /halaqa sur cette version dégradée. Supprimé.

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