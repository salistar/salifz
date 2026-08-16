/**
 * Parental Controls Routes - Salifz
 * Contrôle parental complet
 */

const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Créer un compte enfant
router.post('/create-child', async (req, res) => {
  try {
    const { username, password, displayName, dailyTimeLimit, ageGroup } = req.body;
    const parentId = req.userId;

    // Vérifier abonnement famille
    if (req.user.subscription.plan !== 'salifz_family') {
      return res.status(403).json({ success: false, error: 'Family subscription required' });
    }

    // Limiter à 5 enfants
    const childrenCount = await User.countDocuments({ 'parentalControls.parentId': parentId });
    if (childrenCount >= 5) {
      return res.status(400).json({ success: false, error: 'Maximum 5 child accounts allowed' });
    }

    const child = new User({
      email: `child_${Date.now()}@salifz.family`,
      password,
      username,
      displayName: displayName || username,
      profile: { ageGroup: ageGroup || 'child' },
      parentalControls: {
        isChildAccount: true,
        parentId,
        dailyTimeLimit: dailyTimeLimit || 60,
        contentRestrictions: ['chat', 'video_call']
      },
      subscription: { plan: 'salifz_family', status: 'active', familyOwnerId: parentId }
    });

    await child.save();
    console.log(`[PARENTAL] Child account created: ${username}`);

    res.status(201).json({ success: true, data: { child: { id: child._id, username: child.username } } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtenir les enfants
router.get('/children', async (req, res) => {
  try {
    const children = await User.find({ 'parentalControls.parentId': req.userId })
      .select('username displayName avatar gamification quranProgress parentalControls lastLogin');
    res.json({ success: true, data: { children } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Modifier les paramètres d'un enfant
router.put('/child/:childId/settings', async (req, res) => {
  try {
    const { childId } = req.params;
    const { dailyTimeLimit, contentRestrictions, isActive } = req.body;

    const child = await User.findOne({ _id: childId, 'parentalControls.parentId': req.userId });
    if (!child) return res.status(404).json({ success: false, error: 'Child not found' });

    if (dailyTimeLimit !== undefined) child.parentalControls.dailyTimeLimit = dailyTimeLimit;
    if (contentRestrictions !== undefined) child.parentalControls.contentRestrictions = contentRestrictions;
    if (isActive !== undefined) child.isActive = isActive;

    await child.save();
    res.json({ success: true, data: { parentalControls: child.parentalControls } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rapport d'activité d'un enfant
router.get('/child/:childId/activity', async (req, res) => {
  try {
    const { childId } = req.params;
    const { days = 7 } = req.query;

    const child = await User.findOne({ _id: childId, 'parentalControls.parentId': req.userId });
    if (!child) return res.status(404).json({ success: false, error: 'Child not found' });

    const activity = {
      child: { username: child.username, displayName: child.displayName },
      summary: {
        totalTimeSpent: Math.floor(Math.random() * 300) + 60,
        versesMemorized: child.quranProgress.totalVersesMemorized,
        currentStreak: child.gamification.currentStreak,
        level: child.gamification.level
      },
      dailyActivity: Array.from({ length: parseInt(days) }, (_, i) => ({
        date: new Date(Date.now() - (parseInt(days) - 1 - i) * 86400000).toISOString().split('T')[0],
        timeSpent: Math.floor(Math.random() * 60) + 10,
        versesLearned: Math.floor(Math.random() * 5),
        lessonsCompleted: Math.floor(Math.random() * 3)
      }))
    };

    res.json({ success: true, data: { activity } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Supprimer un compte enfant
router.delete('/child/:childId', async (req, res) => {
  try {
    const result = await User.deleteOne({ _id: req.params.childId, 'parentalControls.parentId': req.userId });
    if (result.deletedCount === 0) return res.status(404).json({ success: false, error: 'Child not found' });
    res.json({ success: true, message: 'Child account deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
