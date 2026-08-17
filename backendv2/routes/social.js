/**
 * Social Routes - Salifz
 * ✅ FIXED: Match User schema structure
 */

const express = require('express');
const presence = require('../services/presence');
const router = express.Router();
const User = require('../models/User');

// Get friend requests - ✅ FIXED for User schema
router.get('/requests', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.json({
        success: true,
        data: { received: [], sent: [] }
      });
    }
    
    // ✅ FIXED: Match User schema structure
    // social.friendRequests.received and social.friendRequests.sent
    const receivedIds = user.social?.friendRequests?.received || [];
    const sentIds = user.social?.friendRequests?.sent || [];
    
    // Fetch user details for received requests
    const receivedUsers = await User.find({ _id: { $in: receivedIds } })
      .select('username displayName avatar gamification.level');
    
    // Fetch user details for sent requests
    const sentUsers = await User.find({ _id: { $in: sentIds } })
      .select('username displayName avatar');
    
    res.json({
      success: true,
      data: {
        received: receivedUsers,
        sent: sentUsers
      }
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.json({
      success: true,
      data: { received: [], sent: [] }
    });
  }
});

// Get friends list - ✅ FIXED
router.get('/friends', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const user = await User.findById(userId);
    
    if (!user || !user.social?.friends?.length) {
      return res.json({ success: true, data: [] });
    }
    
    const friends = await User.find({
      _id: { $in: user.social.friends }
    }).select('username displayName avatar gamification.totalXP gamification.currentStreak gamification.level');
    
    // Présence réelle, lue depuis la couche temps réel. Auparavant :
    // `isOnline: Math.random() > 0.5` — un point vert tiré à pile ou face.
    const online = await presence.onlineUserIds();
    const presenceKnown = presence.isAvailable();

    const friendsWithStatus = friends.map(f => ({
      ...f.toObject(),
      // `null` plutôt que `false` quand la couche temps réel ne répond pas :
      // le client peut alors masquer l'indicateur au lieu d'afficher « hors
      // ligne » à tort.
      isOnline: presenceKnown ? online.has(String(f._id)) : null
    }));

    res.json({ success: true, data: friendsWithStatus });
  } catch (error) {
    console.error('Get friends error:', error);
    res.json({ success: true, data: [] });
  }
});

// Send friend request - ✅ FIXED
router.post('/request/:userId', async (req, res) => {
  try {
    const fromId = req.user?._id || req.userId;
    const toId = req.params.userId;
    
    if (fromId.toString() === toId) {
      return res.status(400).json({ success: false, error: 'Cannot send request to yourself' });
    }
    
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromId),
      User.findById(toId)
    ]);
    
    if (!toUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Initialize social structure if needed
    if (!fromUser.social) fromUser.social = {};
    if (!toUser.social) toUser.social = {};
    if (!fromUser.social.friends) fromUser.social.friends = [];
    if (!fromUser.social.friendRequests) fromUser.social.friendRequests = { sent: [], received: [] };
    if (!toUser.social.friendRequests) toUser.social.friendRequests = { sent: [], received: [] };
    
    // Check if already friends
    if (fromUser.social.friends.some(f => f.toString() === toId)) {
      return res.status(400).json({ success: false, error: 'Already friends' });
    }
    
    // Check if request already sent
    if (fromUser.social.friendRequests.sent?.some(id => id.toString() === toId)) {
      return res.status(400).json({ success: false, error: 'Request already sent' });
    }
    
    // Add to sent/received arrays
    if (!fromUser.social.friendRequests.sent) fromUser.social.friendRequests.sent = [];
    if (!toUser.social.friendRequests.received) toUser.social.friendRequests.received = [];
    
    fromUser.social.friendRequests.sent.push(toId);
    toUser.social.friendRequests.received.push(fromId);
    
    await Promise.all([fromUser.save(), toUser.save()]);
    
    res.status(201).json({ success: true, message: 'Friend request sent' });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Accept friend request - ✅ FIXED
router.post('/accept/:userId', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const fromUserId = req.params.userId;
    
    const [user, fromUser] = await Promise.all([
      User.findById(userId),
      User.findById(fromUserId)
    ]);
    
    if (!fromUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    // Initialize if needed
    if (!user.social) user.social = {};
    if (!fromUser.social) fromUser.social = {};
    if (!user.social.friends) user.social.friends = [];
    if (!fromUser.social.friends) fromUser.social.friends = [];
    
    // Remove from requests
    if (user.social.friendRequests?.received) {
      user.social.friendRequests.received = user.social.friendRequests.received.filter(
        id => id.toString() !== fromUserId
      );
    }
    if (fromUser.social.friendRequests?.sent) {
      fromUser.social.friendRequests.sent = fromUser.social.friendRequests.sent.filter(
        id => id.toString() !== userId.toString()
      );
    }
    
    // Add to friends
    if (!user.social.friends.some(f => f.toString() === fromUserId)) {
      user.social.friends.push(fromUserId);
    }
    if (!fromUser.social.friends.some(f => f.toString() === userId.toString())) {
      fromUser.social.friends.push(userId);
    }
    
    await Promise.all([user.save(), fromUser.save()]);
    
    res.json({ success: true, message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject friend request - ✅ FIXED
router.post('/reject/:userId', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const fromUserId = req.params.userId;
    
    await User.findByIdAndUpdate(userId, {
      $pull: { 'social.friendRequests.received': fromUserId }
    });
    
    await User.findByIdAndUpdate(fromUserId, {
      $pull: { 'social.friendRequests.sent': userId }
    });
    
    res.json({ success: true, message: 'Friend request rejected' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove friend
router.delete('/friends/:userId', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const friendId = req.params.userId;
    
    await Promise.all([
      User.findByIdAndUpdate(userId, { $pull: { 'social.friends': friendId } }),
      User.findByIdAndUpdate(friendId, { $pull: { 'social.friends': userId } })
    ]);
    
    res.json({ success: true, message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search users
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user?._id || req.userId;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    
    const users = await User.find({
      _id: { $ne: userId },
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { displayName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username displayName avatar gamification.totalXP gamification.level')
    .limit(20);
    
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Search users error:', error);
    res.json({ success: true, data: [] });
  }
});

// Get user profile
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username displayName avatar gamification quranProgress createdAt');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;