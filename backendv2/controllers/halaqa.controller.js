/**
 * Halaqa Controller - Salifz
 * ✅ COMPLETE: All halaqa operations with activities
 * ✅ UPDATED: Uses model methods for activities
 */

const Halaqa = require('../models/Halaqa');
const User = require('../models/User');

// ============================================
// GET USER'S HALAQAT
// ============================================
exports.getMyHalaqat = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'No token' });
    }
    
    const halaqat = await Halaqa.findUserHalaqat(userId);
    
    // Add member count to each halaqa
    const halaqatWithCount = halaqat.map(h => {
      const obj = h.toObject();
      obj.membersCount = h.members?.length || 0;
      return obj;
    });
    
    res.json({ success: true, data: halaqatWithCount });
  } catch (error) { 
    console.error('Get my halaqat error:', error);
    res.json({ success: true, data: [] });
  }
};

// ============================================
// GET ALL HALAQAT
// ============================================
exports.getAllHalaqat = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    if (req.user?.social?.halaqat?.length > 0) {
      const halaqat = await Halaqa.find({ 
        _id: { $in: req.user.social.halaqat } 
      }).populate('creator', 'username displayName avatar');
      
      return res.json({ success: true, data: halaqat });
    }
    
    const halaqat = await Halaqa.find({
      $or: [
        { creator: userId },
        { admins: userId },
        { 'members.user': userId },
        { 'settings.isPublic': true }
      ]
    })
    .populate('creator', 'username displayName avatar')
    .sort({ memberCount: -1, createdAt: -1 })
    .limit(50);
    
    res.json({ success: true, data: halaqat });
  } catch (error) {
    console.error('Get all halaqat error:', error);
    res.json({ success: true, data: [] });
  }
};

// ============================================
// DISCOVER PUBLIC HALAQAT
// ============================================
exports.discoverHalaqat = async (req, res) => {
  try {
    const halaqat = await Halaqa.findPublic(20);
    res.json({ success: true, data: halaqat });
  } catch (error) {
    console.error('Discover halaqat error:', error);
    res.json({ success: true, data: [] });
  }
};

// ============================================
// GET HALAQA BY ID
// ============================================
exports.getHalaqaById = async (req, res) => {
  try {
    const halaqa = await Halaqa.findById(req.params.id)
      .populate('members.user', 'username displayName avatar gamification.level gamification.totalXP')
      .populate('creator', 'username displayName avatar')
      .populate('admins', 'username displayName avatar')
      .populate('activities.createdBy', 'username displayName');
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    res.json({ success: true, data: halaqa });
  } catch (error) {
    console.error('Get halaqa by ID error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// CREATE HALAQA
// ============================================
exports.createHalaqa = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { name, description, settings, isPublic, maxMembers } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    const halaqa = new Halaqa({
      name, 
      description: description || '', 
      settings: settings || { 
        isPublic: isPublic !== false,
        allowChat: true,
        allowVoice: false,
        activityTypes: ['memorize', 'review', 'tajweed', 'recitation', 'quiz'],
      },
      creator: userId,
      admins: [userId],
      members: [{ 
        user: userId, 
        role: 'creator', 
        joinedAt: new Date(),
        stats: { weeklyXP: 0, totalXP: 0, versesMemorized: 0, activitiesCompleted: 0 },
      }],
      maxMembers: maxMembers || 50,
      isActive: true,
      memberCount: 1,
    });
    
    await halaqa.save();
    
    // Add to user's halaqat
    if (req.user?.social) {
      if (!req.user.social.halaqat) req.user.social.halaqat = [];
      req.user.social.halaqat.push(halaqa._id);
      await req.user.save();
    }
    
    res.status(201).json({ success: true, data: halaqa });
  } catch (error) {
    console.error('Create halaqa error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// UPDATE HALAQA
// ============================================
exports.updateHalaqa = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { name, description, settings, maxMembers } = req.body;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    if (!halaqa.isAdmin(userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    if (name) halaqa.name = name;
    if (description !== undefined) halaqa.description = description;
    if (settings) halaqa.settings = { ...halaqa.settings.toObject(), ...settings };
    if (maxMembers) halaqa.maxMembers = maxMembers;
    
    await halaqa.save();
    
    res.json({ success: true, data: halaqa });
  } catch (error) {
    console.error('Update halaqa error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// DELETE HALAQA
// ============================================
exports.deleteHalaqa = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    if (!halaqa.isCreator(userId)) {
      return res.status(403).json({ success: false, error: 'Only creator can delete halaqa' });
    }
    
    await Halaqa.findByIdAndDelete(req.params.id);
    
    // Remove from all users
    await User.updateMany(
      { 'social.halaqat': req.params.id },
      { $pull: { 'social.halaqat': req.params.id } }
    );
    
    res.json({ success: true, message: 'Halaqa deleted' });
  } catch (error) {
    console.error('Delete halaqa error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// JOIN HALAQA BY ID
// ============================================
exports.joinHalaqa = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    // Use model method
    try {
      await halaqa.addMember(userId);
    } catch (e) {
      // Already a member - that's ok
    }
    
    // Add to user's halaqat
    if (req.user?.social) {
      if (!req.user.social.halaqat) req.user.social.halaqat = [];
      if (!req.user.social.halaqat.includes(halaqa._id)) {
        req.user.social.halaqat.push(halaqa._id);
        await req.user.save();
      }
    }
    
    res.json({ success: true, data: halaqa });
  } catch (error) {
    console.error('Join halaqa error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// JOIN BY INVITE CODE
// ============================================
exports.joinByCode = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const inviteCode = req.body.inviteCode || req.params.code;
    
    if (!inviteCode) {
      return res.status(400).json({ success: false, error: 'Invite code is required' });
    }
    
    const halaqa = await Halaqa.findByInviteCode(inviteCode);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Invalid invite code' });
    }
    
    try {
      await halaqa.addMember(userId);
    } catch (e) {
      // Already a member
    }
    
    if (req.user?.social) {
      if (!req.user.social.halaqat) req.user.social.halaqat = [];
      if (!req.user.social.halaqat.includes(halaqa._id)) {
        req.user.social.halaqat.push(halaqa._id);
        await req.user.save();
      }
    }
    
    res.json({ success: true, data: halaqa });
  } catch (error) {
    console.error('Join by code error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// LEAVE HALAQA
// ============================================
exports.leaveHalaqa = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    try {
      await halaqa.removeMember(userId);
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message });
    }
    
    // Remove from user's halaqat
    if (req.user?.social?.halaqat) {
      req.user.social.halaqat = req.user.social.halaqat.filter(
        h => h.toString() !== req.params.id
      );
      await req.user.save();
    }
    
    res.json({ success: true, message: 'Left halaqa successfully' });
  } catch (error) {
    console.error('Leave halaqa error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// GET MEMBERS
// ============================================
exports.getMembers = async (req, res) => {
  try {
    const halaqa = await Halaqa.findById(req.params.id)
      .populate('members.user', 'username displayName avatar gamification.level gamification.currentStreak gamification.totalXP')
      .populate('creator', 'username displayName avatar gamification.level gamification.totalXP');
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    // Include creator info in members
    const allMembers = halaqa.members.map(m => ({
      ...m.toObject(),
      isCreator: m.user?._id?.toString() === halaqa.creator._id.toString(),
    }));
    
    res.json({ success: true, data: allMembers });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// KICK MEMBER
// ============================================
exports.kickMember = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const targetUserId = req.params.userId;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    if (!halaqa.isAdmin(userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    try {
      await halaqa.removeMember(targetUserId);
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message });
    }
    
    res.json({ success: true, message: 'Member removed' });
  } catch (error) {
    console.error('Kick member error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// PROMOTE TO ADMIN
// ============================================
exports.promoteToAdmin = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const targetUserId = req.params.userId;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    try {
      await halaqa.promoteToAdmin(targetUserId, userId);
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message });
    }
    
    res.json({ success: true, message: 'Member promoted to admin' });
  } catch (error) {
    console.error('Promote to admin error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// GET LEADERBOARD
// ============================================
exports.getLeaderboard = async (req, res) => {
  try {
    const halaqa = await Halaqa.findById(req.params.id)
      .populate('members.user', 'username displayName avatar gamification.totalXP gamification.weeklyXP');
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    const leaderboard = halaqa.getLeaderboard(20).map((member, index) => ({
      rank: index + 1,
      user: member.user,
      stats: member.stats,
      weeklyXP: member.stats?.weeklyXP || member.weeklyXP || 0,
      totalXP: member.stats?.totalXP || member.totalXP || 0,
      activitiesCompleted: member.stats?.activitiesCompleted || 0,
    }));
    
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// GET ACTIVITIES
// ============================================
exports.getActivities = async (req, res) => {
  try {
    const halaqa = await Halaqa.findById(req.params.id)
      .populate('activities.createdBy', 'username displayName');
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    // Sort by date desc
    const activities = [...(halaqa.activities || [])].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Get activities error:', error);
    res.json({ success: true, data: [] });
  }
};

// ============================================
// CREATE ACTIVITY
// ============================================
exports.createActivity = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { type, title, description, xpReward, startDate, endDate } = req.body;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    try {
      const activity = await halaqa.addActivity({
        type,
        title,
        description,
        xpReward: xpReward || 50,
        startDate,
        endDate,
      }, userId);
      
      res.status(201).json({ success: true, data: activity });
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message });
    }
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// COMPLETE ACTIVITY
// ============================================
exports.completeActivity = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const activityId = req.params.activityId;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    if (!halaqa.isMember(userId)) {
      return res.status(403).json({ success: false, error: 'You must be a member' });
    }
    
    try {
      const activity = await halaqa.completeActivity(activityId, userId);
      
      // Update user XP
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'gamification.totalXP': activity.xpReward || 0,
          'gamification.weeklyXP': activity.xpReward || 0,
          'gamification.dailyXP': activity.xpReward || 0,
        }
      });
      
      res.json({ 
        success: true, 
        message: 'Activity completed!', 
        xpEarned: activity.xpReward || 0 
      });
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message });
    }
  } catch (error) {
    console.error('Complete activity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// DELETE ACTIVITY
// ============================================
exports.deleteActivity = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const activityId = req.params.activityId;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    try {
      await halaqa.deleteActivity(activityId, userId);
      res.json({ success: true, message: 'Activity deleted' });
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message });
    }
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// GET STATS
// ============================================
exports.getStats = async (req, res) => {
  try {
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    res.json({
      success: true,
      data: {
        ...halaqa.stats.toObject(),
        membersCount: halaqa.members?.length || 0,
        activitiesCount: halaqa.activities?.length || 0,
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// LOG ACTIVITY (for XP tracking)
// ============================================
exports.logActivity = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { type, versesCount, xpEarned } = req.body;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    if (!halaqa.isMember(userId)) {
      return res.status(403).json({ success: false, error: 'You must be a member' });
    }
    
    // Update member stats
    const member = halaqa.members.find(m => m.user?.toString() === userId.toString());
    if (member) {
      if (!member.stats) {
        member.stats = { weeklyXP: 0, totalXP: 0, versesMemorized: 0, activitiesCompleted: 0 };
      }
      if (versesCount) member.stats.versesMemorized += versesCount;
      if (xpEarned) {
        member.stats.totalXP += xpEarned;
        member.stats.weeklyXP += xpEarned;
      }
    }
    
    // Update halaqa stats
    if (versesCount) halaqa.stats.totalVersesMemorized += versesCount;
    if (xpEarned) {
      halaqa.stats.totalXP += xpEarned;
      halaqa.stats.weeklyXP += xpEarned;
    }
    
    await halaqa.save();
    
    res.json({ success: true, message: 'Activity logged' });
  } catch (error) {
    console.error('Log activity error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// GET MESSAGES
// ============================================
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const halaqa = await Halaqa.findById(req.params.id)
      .populate('messages.sender', 'username displayName avatar');
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    if (!halaqa.settings.allowChat) {
      return res.status(403).json({ success: false, error: 'Chat is disabled' });
    }
    
    const messages = [...(halaqa.messages || [])]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice((page - 1) * limit, page * limit);
    
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.json({ success: true, data: [] });
  }
};

// ============================================
// SEND MESSAGE
// ============================================
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { content, type = 'text' } = req.body;
    
    const halaqa = await Halaqa.findById(req.params.id);
    
    if (!halaqa) {
      return res.status(404).json({ success: false, error: 'Halaqa not found' });
    }
    
    try {
      const message = await halaqa.addMessage(userId, content, type);

      // Diffuser aux membres connectés : l'envoi REST persistait mais restait
      // invisible en temps réel — chaque client devait recharger la page.
      const io = req.app.get('io');
      if (io) {
        const { formatHalaqaMessage } = require('../utils/halaqaMessage');
        io.to(`halaqa:${halaqa._id}`).emit(
          'halaqaMessage',
          formatHalaqaMessage(halaqa._id, message, req.user)
        );
      }

      res.status(201).json({ success: true, data: message });
    } catch (e) {
      return res.status(400).json({ success: false, error: e.message });
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};