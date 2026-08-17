/**
 * Parental Controls Routes - Salifz
 * Contrôle parental complet
 */

const express = require('express');
const Streak = require('../models/Streak');
const User = require('../models/User');
const router = express.Router();

// Créer un compte enfant

/**
 * Activité réelle d'un enfant, jour par jour, lue depuis `Streak.history` —
 * la seule trace effectivement écrite par l'application. Un jour absent de
 * l'historique est un jour sans activité : on le rend à zéro plutôt que de
 * l'omettre, sans quoi la courbe se resserre et donne l'illusion d'une
 * pratique continue.
 */
async function childDailyActivity(childId, days) {
  const streak = await Streak.findOne({ user: childId }).lean();
  const byDay = new Map();

  for (const entry of streak?.history ?? []) {
    if (!entry?.date) continue;
    const key = new Date(entry.date).toISOString().split('T')[0];
    const current = byDay.get(key) ?? { versesLearned: 0, versesReviewed: 0, xpEarned: 0, active: false };
    current.versesLearned += entry.versesMemorized ?? 0;
    current.versesReviewed += entry.versesReviewed ?? 0;
    current.xpEarned += entry.xpEarned ?? 0;
    current.active = current.active || Boolean(entry.completed);
    byDay.set(key, current);
  }

  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().split('T')[0];
    out.push({ date: key, ...(byDay.get(key) ?? { versesLearned: 0, versesReviewed: 0, xpEarned: 0, active: false }) });
  }
  return out;
}

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

    // Ce rapport était entièrement tiré au hasard : un parent y lisait que son
    // enfant avait passé quarante minutes et appris trois versets un jour où
    // l'application n'avait pas été ouverte, et les chiffres changeaient à
    // chaque rafraîchissement. Sur un écran de contrôle parental, c'est le
    // défaut le plus grave possible — l'information y est lue comme un fait.
    const window = Math.min(Math.max(parseInt(days, 10) || 7, 1), 90);
    const dailyActivity = await childDailyActivity(child._id, window);

    const activity = {
      child: { username: child.username, displayName: child.displayName },
      summary: {
        // `totalTimeSpent` a été retiré : rien dans l'application ne mesure
        // une durée de session. Le nombre de jours actifs est, lui, compté.
        activeDays: dailyActivity.filter((d) => d.active).length,
        windowDays: window,
        versesMemorized: child.quranProgress.totalVersesMemorized,
        currentStreak: child.gamification.currentStreak,
        level: child.gamification.level
      },
      dailyActivity
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
