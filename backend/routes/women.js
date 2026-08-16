/**
 * Women's Space Routes - Salifz
 * Exclusive features for verified female users
 */

const express = require('express');
const router = express.Router();

/**
 * GET /api/v1/women/dashboard
 * Women's Space dashboard
 */
router.get('/dashboard', async (req, res) => {
  try {
    const User = require('../models/User');
    
    // Get women's space stats
    const totalMembers = await User.countDocuments({ 'profile.womensSpaceAccess': true });
    const activeToday = await User.countDocuments({
      'profile.womensSpaceAccess': true,
      lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        welcome: {
          ar: `مرحباً ${req.user.displayName || req.user.username}! أهلاً بك في مساحة الأخوات`,
          en: `Welcome ${req.user.displayName || req.user.username}! Welcome to Sisters' Space`,
          fr: `Bienvenue ${req.user.displayName || req.user.username}! Bienvenue dans l'Espace Sœurs`
        },
        stats: {
          totalMembers,
          activeToday,
          halaqatCount: 5, // Placeholder
          upcomingEvents: 3
        },
        features: [
          { id: 'halaqat', name: { ar: 'حلقات الأخوات', en: 'Sisters\' Halaqat', fr: 'Cercles des Sœurs' }, icon: '👩‍👩‍👧‍👧' },
          { id: 'chat', name: { ar: 'المحادثات', en: 'Chat', fr: 'Discussion' }, icon: '💬' },
          { id: 'mentorship', name: { ar: 'برنامج المرشدات', en: 'Mentorship Program', fr: 'Programme de Mentorat' }, icon: '🌟' },
          { id: 'events', name: { ar: 'الفعاليات', en: 'Events', fr: 'Événements' }, icon: '📅' }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/women/halaqat
 * Women-only Halaqat
 */
router.get('/halaqat', async (req, res) => {
  try {
    const Halaqa = require('../models/Halaqa');
    
    const halaqat = await Halaqa.find({
      'settings.womensOnly': true,
      isActive: true
    })
    .populate('creator', 'username displayName avatar')
    .sort({ memberCount: -1 })
    .limit(20);

    res.json({ success: true, data: halaqat });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

/**
 * GET /api/v1/women/leaderboard
 * Women's Space leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const User = require('../models/User');
    
    const leaderboard = await User.find({ 'profile.womensSpaceAccess': true })
      .sort({ 'gamification.weeklyXP': -1 })
      .limit(50)
      .select('username displayName avatar gamification.weeklyXP gamification.level gamification.currentStreak');

    // Add rank to each user
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      ...user.toObject()
    }));

    res.json({ success: true, data: rankedLeaderboard });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

/**
 * GET /api/v1/women/members
 * List verified women members
 */
router.get('/members', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const User = require('../models/User');
    
    const members = await User.find({ 
      'profile.womensSpaceAccess': true,
      'social.isPublicProfile': true
    })
    .select('username displayName avatar gamification.level gamification.totalXP')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

    res.json({ success: true, data: members });
  } catch (error) {
    res.json({ success: true, data: [] });
  }
});

/**
 * POST /api/v1/women/halaqa
 * Create women-only Halaqa
 */
router.post('/halaqa', async (req, res) => {
  try {
    const { name, description } = req.body;
    const Halaqa = require('../models/Halaqa');

    const halaqa = new Halaqa({
      name,
      description,
      creator: req.userId,
      admins: [req.userId],
      members: [{
        user: req.userId,
        role: 'creator',
        joinedAt: new Date()
      }],
      settings: {
        isPublic: false,
        womensOnly: true,
        allowChat: true,
        allowVoice: true
      }
    });

    await halaqa.save();

    res.status(201).json({ success: true, data: halaqa });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/women/mentorship
 * Mentorship program
 */
router.get('/mentorship', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        title: {
          ar: 'برنامج المرشدات',
          en: 'Mentorship Program',
          fr: 'Programme de Mentorat'
        },
        description: {
          ar: 'تواصلي مع أخوات متقدمات في الحفظ للإرشاد والدعم',
          en: 'Connect with advanced sisters for guidance and support',
          fr: 'Connectez-vous avec des sœurs avancées pour des conseils et du soutien'
        },
        mentors: [
          { id: 1, name: 'أم محمد', level: 50, versesMemorized: 3000, available: true },
          { id: 2, name: 'فاطمة', level: 45, versesMemorized: 2500, available: true },
          { id: 3, name: 'عائشة', level: 40, versesMemorized: 2000, available: false }
        ],
        requirements: {
          ar: 'يجب أن تكوني قد حفظتِ 500 آية على الأقل لتصبحي مرشدة',
          en: 'You must have memorized at least 500 verses to become a mentor',
          fr: 'Vous devez avoir mémorisé au moins 500 versets pour devenir mentor'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/v1/women/events
 * Women's Space events
 */
router.get('/events', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        upcoming: [
          {
            id: 1,
            title: { ar: 'حلقة تلاوة جماعية', en: 'Group Recitation Circle', fr: 'Cercle de Récitation en Groupe' },
            date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            participants: 25
          },
          {
            id: 2,
            title: { ar: 'درس التجويد', en: 'Tajwid Lesson', fr: 'Cours de Tajwid' },
            date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            participants: 15
          }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
