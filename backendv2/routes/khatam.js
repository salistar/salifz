/**
 * Khatam Routes - Salifz
 * ✅ COMPLETE: All Khatam Quran routes
 */

const express = require('express');
const router = express.Router();
const Khatam = require('../models/Khatam');
const User = require('../models/User');

// ============================================
// GET USER'S KHATAMS
// ============================================
router.get('/my', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const khatams = await Khatam.findUserKhatams(userId)
      .populate('creator', 'username displayName avatar')
      .populate('participants.user', 'username displayName avatar');
    
    const khatamsWithProgress = khatams.map(k => ({
      ...k.toObject(),
      myProgress: k.participants.find(p => p.user?._id?.toString() === userId.toString()),
      dashboard: k.getDashboard()
    }));
    
    res.json({ success: true, data: khatamsWithProgress });
  } catch (error) {
    console.error('Get my khatams error:', error);
    res.json({ success: true, data: [] });
  }
});

// ============================================
// DISCOVER PUBLIC KHATAMS
// ============================================
router.get('/discover', async (req, res) => {
  try {
    const khatams = await Khatam.findPublicKhatams(20);
    res.json({ success: true, data: khatams });
  } catch (error) {
    console.error('Discover khatams error:', error);
    res.json({ success: true, data: [] });
  }
});

// ============================================
// CALCULATE READING PLAN
// ============================================
router.post('/calculate', async (req, res) => {
  try {
    const { unit, amountPerDay, targetDays, participantCount = 1 } = req.body;
    
    // Total units in Quran
    let totalUnits = 60; // 60 hizb
    if (unit === 'quarter') totalUnits = 240;
    if (unit === 'eighth') totalUnits = 480;
    if (unit === 'juz') totalUnits = 30;
    
    const unitsPerPerson = Math.ceil(totalUnits / participantCount);
    const daysToComplete = targetDays || Math.ceil(unitsPerPerson / amountPerDay);
    const totalAmountPerDay = amountPerDay * participantCount;
    const estimatedDays = Math.ceil(totalUnits / totalAmountPerDay);
    
    res.json({
      success: true,
      data: {
        totalUnits,
        unitsPerPerson,
        amountPerDay,
        totalAmountPerDay,
        estimatedDays,
        targetDays: daysToComplete,
        participantCount,
        unit,
        estimatedEndDate: new Date(Date.now() + estimatedDays * 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    console.error('Calculate plan error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET KHATAM BY ID
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const khatam = await Khatam.findById(req.params.id)
      .populate('creator', 'username displayName avatar')
      .populate('participants.user', 'username displayName avatar gamification.level')
      .populate('hizbTracking.assignedTo', 'username displayName avatar')
      .populate('hizbTracking.completedBy', 'username displayName avatar');
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...khatam.toObject(),
        dashboard: khatam.getDashboard()
      }
    });
  } catch (error) {
    console.error('Get khatam by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CREATE KHATAM
// ============================================
router.post('/', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { 
      title, 
      description, 
      type = 'solo', 
      readingMode = 'offline',
      readingConfig = {},
      settings = {},
      startDate,
      targetEndDate
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    
    // Calculate target days
    let targetDays = readingConfig.targetDays || 30;
    const unit = readingConfig.unit || 'hizb';
    const amountPerDay = readingConfig.amountPerDay || 1;
    
    let totalUnits = 60;
    if (unit === 'quarter') totalUnits = 240;
    if (unit === 'eighth') totalUnits = 480;
    if (unit === 'juz') totalUnits = 30;
    
    if (!readingConfig.targetDays) {
      targetDays = Math.ceil(totalUnits / amountPerDay);
    }
    
    const khatam = new Khatam({
      title,
      description,
      creator: userId,
      type,
      readingMode,
      readingConfig: {
        unit,
        amountPerDay,
        targetDays,
        isInfinite: readingConfig.isInfinite || false,
        targetKhatamCount: readingConfig.targetKhatamCount || 1
      },
      settings: {
        isPublic: settings.isPublic !== false,
        requireVerification: settings.requireVerification || false,
        allowSelfAssign: settings.allowSelfAssign !== false,
        maxParticipants: settings.maxParticipants || 100,
        notifyOnCompletion: settings.notifyOnCompletion !== false
      },
      participants: [{
        user: userId,
        isAdmin: true,
        joinedAt: new Date()
      }],
      startDate: startDate || new Date(),
      targetEndDate: targetEndDate || new Date(Date.now() + targetDays * 24 * 60 * 60 * 1000),
      stats: { totalParticipants: 1 }
    });
    
    await khatam.save();
    
    res.status(201).json({ success: true, data: khatam });
  } catch (error) {
    console.error('Create khatam error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// UPDATE KHATAM
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { title, description, settings, readingConfig, status } = req.body;
    
    const khatam = await Khatam.findById(req.params.id);
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    const isAdmin = khatam.creator.toString() === userId.toString() ||
      khatam.participants.some(p => p.user.toString() === userId.toString() && p.isAdmin);
    
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    if (title) khatam.title = title;
    if (description !== undefined) khatam.description = description;
    if (settings) khatam.settings = { ...khatam.settings.toObject(), ...settings };
    if (readingConfig) khatam.readingConfig = { ...khatam.readingConfig.toObject(), ...readingConfig };
    if (status) khatam.status = status;
    
    await khatam.save();
    
    res.json({ success: true, data: khatam });
  } catch (error) {
    console.error('Update khatam error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// DELETE KHATAM
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const khatam = await Khatam.findById(req.params.id);
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    if (khatam.creator.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, error: 'Only creator can delete' });
    }
    
    await Khatam.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Khatam deleted' });
  } catch (error) {
    console.error('Delete khatam error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// JOIN KHATAM
// ============================================
router.post('/:id/join', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const khatam = await Khatam.findById(req.params.id);
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    try {
      await khatam.addParticipant(userId, false);
      res.json({ success: true, data: khatam, message: 'Joined successfully' });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  } catch (error) {
    console.error('Join khatam error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// LEAVE KHATAM
// ============================================
router.post('/:id/leave', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const khatam = await Khatam.findById(req.params.id);
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    if (khatam.creator.toString() === userId.toString()) {
      return res.status(400).json({ success: false, error: 'Creator cannot leave' });
    }
    
    khatam.participants = khatam.participants.filter(
      p => p.user.toString() !== userId.toString()
    );
    khatam.stats.totalParticipants = khatam.participants.length;
    
    // Release assigned hizbs
    khatam.hizbTracking.forEach(h => {
      if (h.assignedTo?.toString() === userId.toString() && h.status === 'assigned') {
        h.status = 'available';
        h.assignedTo = null;
      }
    });
    
    await khatam.save();
    
    res.json({ success: true, message: 'Left khatam' });
  } catch (error) {
    console.error('Leave khatam error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ASSIGN HIZB
// ============================================
router.post('/:id/assign', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { hizbNumber, targetUserId, unit = 'hizb', subIndex = 0 } = req.body;
    
    const khatam = await Khatam.findById(req.params.id);
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    const assignToUser = targetUserId || userId;
    const isAdmin = khatam.creator.toString() === userId.toString() ||
      khatam.participants.some(p => p.user.toString() === userId.toString() && p.isAdmin);
    
    if (assignToUser !== userId.toString() && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Only admin can assign to others' });
    }
    
    if (!khatam.settings.allowSelfAssign && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Self-assign not allowed' });
    }
    
    try {
      await khatam.assignHizb(hizbNumber, assignToUser, unit, subIndex);
      res.json({ success: true, message: 'Hizb assigned', data: khatam.getDashboard() });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  } catch (error) {
    console.error('Assign hizb error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// COMPLETE HIZB
// ============================================
router.post('/:id/complete', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { hizbNumber, unit = 'hizb', subIndex = 0 } = req.body;
    
    const khatam = await Khatam.findById(req.params.id);
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    try {
      await khatam.completeHizb(hizbNumber, userId, unit, subIndex);
      
      // Award XP
      let xpReward = 10;
      if (unit === 'hizb') xpReward = 50;
      if (unit === 'quarter') xpReward = 15;
      if (unit === 'eighth') xpReward = 8;
      
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'gamification.totalXP': xpReward,
          'gamification.weeklyXP': xpReward,
          'gamification.dailyXP': xpReward
        }
      });
      
      res.json({ 
        success: true, 
        message: 'Hizb completed!', 
        xpEarned: xpReward,
        data: khatam.getDashboard()
      });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  } catch (error) {
    console.error('Complete hizb error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// VERIFY HIZB (ADMIN)
// ============================================
router.post('/:id/verify', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { hizbNumber } = req.body;
    
    const khatam = await Khatam.findById(req.params.id);
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    try {
      await khatam.verifyHizb(hizbNumber, userId);
      res.json({ success: true, message: 'Hizb verified', data: khatam.getDashboard() });
    } catch (e) {
      res.status(400).json({ success: false, error: e.message });
    }
  } catch (error) {
    console.error('Verify hizb error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET HIZB GRID (TABLEAU DE SUIVI)
// ============================================
router.get('/:id/grid', async (req, res) => {
  try {
    const khatam = await Khatam.findById(req.params.id)
      .populate('hizbTracking.assignedTo', 'username displayName avatar')
      .populate('hizbTracking.completedBy', 'username displayName avatar');
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    const grid = khatam.hizbTracking.map(h => ({
      number: h.hizbNumber,
      juz: h.juzNumber,
      surahStart: h.surahStart,
      surahEnd: h.surahEnd,
      status: h.status,
      assignedTo: h.assignedTo,
      completedBy: h.completedBy,
      completedAt: h.completedAt,
      quarters: h.quarters,
      eighths: h.eighths
    }));
    
    res.json({ success: true, data: grid });
  } catch (error) {
    console.error('Get hizb grid error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET PARTICIPANT PROGRESS
// ============================================
router.get('/:id/participants', async (req, res) => {
  try {
    const khatam = await Khatam.findById(req.params.id)
      .populate('participants.user', 'username displayName avatar gamification.level');
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    const progress = khatam.participants.map(p => ({
      user: p.user,
      isAdmin: p.isAdmin,
      assignedHizbs: p.assignedHizbs,
      totalAssigned: p.totalAssigned,
      totalCompleted: p.totalCompleted,
      progress: p.totalAssigned > 0 ? Math.round((p.totalCompleted / p.totalAssigned) * 100) : 0,
      joinedAt: p.joinedAt,
      lastActivityAt: p.lastActivityAt
    }));
    
    res.json({ success: true, data: progress });
  } catch (error) {
    console.error('Get participant progress error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// CREATE REALTIME SESSION
// ============================================
router.post('/:id/sessions', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { scheduledAt } = req.body;
    
    const khatam = await Khatam.findById(req.params.id);
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    if (khatam.readingMode !== 'realtime') {
      return res.status(400).json({ success: false, error: 'Not a realtime khatam' });
    }
    
    const roomId = `khatam:${khatam._id}:${Date.now()}`;
    
    khatam.realtimeSessions.push({
      scheduledAt: scheduledAt || new Date(),
      roomId,
      status: scheduledAt ? 'scheduled' : 'live',
      participants: [{ user: userId, joinedAt: new Date() }]
    });
    
    await khatam.save();
    
    const session = khatam.realtimeSessions[khatam.realtimeSessions.length - 1];
    
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    console.error('Create realtime session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// GET DASHBOARD
// ============================================
router.get('/:id/dashboard', async (req, res) => {
  try {
    const khatam = await Khatam.findById(req.params.id)
      .populate('creator', 'username displayName avatar')
      .populate('participants.user', 'username displayName avatar');
    
    if (!khatam) {
      return res.status(404).json({ success: false, error: 'Khatam not found' });
    }
    
    res.json({ success: true, data: khatam.getDashboard() });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;