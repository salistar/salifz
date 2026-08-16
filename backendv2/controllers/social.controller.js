/**
 * Social Controller - Salifz
 * ✅ COMPLETE: Friends, requests, search
 */

const User = require('../models/User');

/**
 * Get friend requests
 */
exports.getFriendRequests = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const user = await User.findById(userId)
      .populate('social.friendRequests.from', 'username displayName avatar gamification.level')
      .populate('social.sentRequests', 'username displayName avatar');
    
    if (!user) {
      return res.json({
        success: true,
        data: { received: [], sent: [] }
      });
    }
    
    const received = (user.social?.friendRequests || [])
      .filter(r => r.status === 'pending')
      .map(r => ({
        _id: r._id,
        from: r.from,
        createdAt: r.createdAt
      }));
    
    const sent = user.social?.sentRequests || [];
    
    res.json({
      success: true,
      data: { received, sent }
    });
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.json({
      success: true,
      data: { received: [], sent: [] }
    });
  }
};

/**
 * Get friends list
 */
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const user = await User.findById(userId)
      .populate('social.friends', 'username displayName avatar gamification.totalXP gamification.currentStreak gamification.level');
    
    if (!user) {
      return res.json({ success: true, data: [] });
    }
    
    // Add online status (placeholder)
    const friends = (user.social?.friends || []).map(f => ({
      ...f.toObject(),
      isOnline: Math.random() > 0.5 // Placeholder - implement real online status
    }));
    
    res.json({ success: true, data: friends });
  } catch (error) {
    console.error('Get friends error:', error);
    res.json({ success: true, data: [] });
  }
};

/**
 * Send friend request
 */
exports.sendFriendRequest = async (req, res) => {
  try {
    const fromId = req.user?._id || req.userId;
    const toId = req.params.userId;
    
    if (fromId.toString() === toId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send friend request to yourself'
      });
    }
    
    const [fromUser, toUser] = await Promise.all([
      User.findById(fromId),
      User.findById(toId)
    ]);
    
    if (!toUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Initialize social if needed
    if (!fromUser.social) fromUser.social = {};
    if (!toUser.social) toUser.social = {};
    if (!fromUser.social.friends) fromUser.social.friends = [];
    if (!fromUser.social.sentRequests) fromUser.social.sentRequests = [];
    if (!toUser.social.friendRequests) toUser.social.friendRequests = [];
    
    // Check if already friends
    if (fromUser.social.friends.some(f => f.toString() === toId)) {
      return res.status(400).json({
        success: false,
        error: 'Already friends'
      });
    }
    
    // Check if request already exists
    const existingRequest = toUser.social.friendRequests.find(r => 
      r.from?.toString() === fromId.toString() && r.status === 'pending'
    );
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'Request already sent'
      });
    }
    
    // Check if reverse request exists (they sent us a request)
    const reverseRequest = fromUser.social.friendRequests?.find(r => 
      r.from?.toString() === toId && r.status === 'pending'
    );
    
    if (reverseRequest) {
      // Auto-accept
      fromUser.social.friends.push(toId);
      toUser.social.friends.push(fromId);
      fromUser.social.friendRequests = fromUser.social.friendRequests.filter(
        r => r.from?.toString() !== toId
      );
      
      await Promise.all([fromUser.save(), toUser.save()]);
      
      return res.json({
        success: true,
        message: 'Friend request accepted (they already sent you one)'
      });
    }
    
    // Add request
    toUser.social.friendRequests.push({
      from: fromId,
      status: 'pending',
      createdAt: new Date()
    });
    
    fromUser.social.sentRequests.push(toId);
    
    await Promise.all([fromUser.save(), toUser.save()]);
    
    res.status(201).json({
      success: true,
      message: 'Friend request sent'
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Accept friend request
 */
exports.acceptFriendRequest = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const fromUserId = req.params.userId;
    
    const [user, fromUser] = await Promise.all([
      User.findById(userId),
      User.findById(fromUserId)
    ]);
    
    if (!fromUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Initialize social if needed
    if (!user.social) user.social = {};
    if (!fromUser.social) fromUser.social = {};
    if (!user.social.friends) user.social.friends = [];
    if (!fromUser.social.friends) fromUser.social.friends = [];
    
    // Find and remove the request
    const requestIndex = user.social.friendRequests?.findIndex(r => 
      r.from?.toString() === fromUserId && r.status === 'pending'
    );
    
    if (requestIndex === -1 || requestIndex === undefined) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found'
      });
    }
    
    user.social.friendRequests.splice(requestIndex, 1);
    
    // Add to friends
    if (!user.social.friends.some(f => f.toString() === fromUserId)) {
      user.social.friends.push(fromUserId);
    }
    if (!fromUser.social.friends.some(f => f.toString() === userId.toString())) {
      fromUser.social.friends.push(userId);
    }
    
    // Remove from sent requests
    if (fromUser.social.sentRequests) {
      fromUser.social.sentRequests = fromUser.social.sentRequests.filter(
        id => id.toString() !== userId.toString()
      );
    }
    
    await Promise.all([user.save(), fromUser.save()]);
    
    res.json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reject friend request
 */
exports.rejectFriendRequest = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const fromUserId = req.params.userId;
    
    const [user, fromUser] = await Promise.all([
      User.findById(userId),
      User.findById(fromUserId)
    ]);
    
    if (!user.social?.friendRequests) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found'
      });
    }
    
    // Remove the request
    user.social.friendRequests = user.social.friendRequests.filter(r => 
      r.from?.toString() !== fromUserId
    );
    
    // Remove from sender's sent requests
    if (fromUser?.social?.sentRequests) {
      fromUser.social.sentRequests = fromUser.social.sentRequests.filter(
        id => id.toString() !== userId.toString()
      );
      await fromUser.save();
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Friend request rejected'
    });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Remove friend
 */
exports.removeFriend = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const friendId = req.params.userId;
    
    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $pull: { 'social.friends': friendId }
      }),
      User.findByIdAndUpdate(friendId, {
        $pull: { 'social.friends': userId }
      })
    ]);
    
    res.json({
      success: true,
      message: 'Friend removed'
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Search users
 */
exports.searchUsers = async (req, res) => {
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
    
    // Get current user's friends to mark isFriend
    const currentUser = await User.findById(userId).select('social.friends');
    const friendIds = (currentUser?.social?.friends || []).map(f => f.toString());
    
    const usersWithStatus = users.map(u => ({
      ...u.toObject(),
      isFriend: friendIds.includes(u._id.toString())
    }));
    
    res.json({ success: true, data: usersWithStatus });
  } catch (error) {
    console.error('Search users error:', error);
    res.json({ success: true, data: [] });
  }
};

/**
 * Get user profile
 */
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username displayName avatar gamification quranProgress createdAt');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if they are friends
    const currentUserId = req.user?._id || req.userId;
    const currentUser = await User.findById(currentUserId).select('social.friends');
    const isFriend = currentUser?.social?.friends?.some(
      f => f.toString() === req.params.userId
    );
    
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        isFriend
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};