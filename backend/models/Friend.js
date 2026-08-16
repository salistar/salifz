/**
 * Friend Model - Salifz
 * ✅ Optional model for tracking friendship relationships
 * 
 * Note: The main friendship data is stored in User.social.friends
 * This model is for:
 * - Tracking friendship history
 * - Analytics (when friendships were formed)
 * - Mutual friends calculations
 * - Friendship scores/interactions
 */

const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  // The two users in the friendship (sorted by ID for consistency)
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Who initiated the friendship
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Who accepted the request
  acceptor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Friendship status
  status: {
    type: String,
    enum: ['pending', 'active', 'blocked', 'removed'],
    default: 'active'
  },
  
  // Interaction stats
  interactions: {
    messagesCount: { type: Number, default: 0 },
    lastMessageAt: { type: Date },
    challengesTogether: { type: Number, default: 0 },
    halaqatTogether: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Halaqa' }]
  },
  
  // Friendship score (based on interactions)
  score: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // When friendship ended (if removed)
  endedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// ============================================
// INDEXES
// ============================================
friendshipSchema.index({ users: 1 });
friendshipSchema.index({ initiator: 1 });
friendshipSchema.index({ acceptor: 1 });
friendshipSchema.index({ status: 1 });
friendshipSchema.index({ createdAt: -1 });

// ============================================
// STATIC METHODS
// ============================================

// Check if two users are friends
friendshipSchema.statics.areFriends = async function(userId1, userId2) {
  const friendship = await this.findOne({
    users: { $all: [userId1, userId2] },
    status: 'active'
  });
  return !!friendship;
};

// Get friendship between two users
friendshipSchema.statics.getFriendship = async function(userId1, userId2) {
  return this.findOne({
    users: { $all: [userId1, userId2] }
  });
};

// Create or reactivate friendship
friendshipSchema.statics.createFriendship = async function(initiatorId, acceptorId) {
  // Sort IDs for consistency
  const sortedUsers = [initiatorId, acceptorId].sort((a, b) => 
    a.toString().localeCompare(b.toString())
  );
  
  // Check if friendship exists
  let friendship = await this.findOne({
    users: { $all: sortedUsers }
  });
  
  if (friendship) {
    // Reactivate if removed
    if (friendship.status === 'removed') {
      friendship.status = 'active';
      friendship.initiator = initiatorId;
      friendship.acceptor = acceptorId;
      friendship.endedAt = undefined;
      await friendship.save();
    }
    return friendship;
  }
  
  // Create new friendship
  friendship = await this.create({
    users: sortedUsers,
    initiator: initiatorId,
    acceptor: acceptorId,
    status: 'active'
  });
  
  return friendship;
};

// Remove friendship
friendshipSchema.statics.removeFriendship = async function(userId1, userId2) {
  const friendship = await this.findOne({
    users: { $all: [userId1, userId2] },
    status: 'active'
  });
  
  if (friendship) {
    friendship.status = 'removed';
    friendship.endedAt = new Date();
    await friendship.save();
    return true;
  }
  
  return false;
};

// Get mutual friends count
friendshipSchema.statics.getMutualFriendsCount = async function(userId1, userId2) {
  const User = mongoose.model('User');
  
  const [user1, user2] = await Promise.all([
    User.findById(userId1).select('social.friends'),
    User.findById(userId2).select('social.friends')
  ]);
  
  if (!user1 || !user2) return 0;
  
  const friends1 = user1.social?.friends?.map(id => id.toString()) || [];
  const friends2 = user2.social?.friends?.map(id => id.toString()) || [];
  
  const mutual = friends1.filter(id => friends2.includes(id));
  return mutual.length;
};

// Get mutual friends
friendshipSchema.statics.getMutualFriends = async function(userId1, userId2, limit = 10) {
  const User = mongoose.model('User');
  
  const [user1, user2] = await Promise.all([
    User.findById(userId1).select('social.friends'),
    User.findById(userId2).select('social.friends')
  ]);
  
  if (!user1 || !user2) return [];
  
  const friends1 = user1.social?.friends?.map(id => id.toString()) || [];
  const friends2 = user2.social?.friends?.map(id => id.toString()) || [];
  
  const mutualIds = friends1.filter(id => friends2.includes(id));
  
  if (mutualIds.length === 0) return [];
  
  const mutualFriends = await User.find({
    _id: { $in: mutualIds.slice(0, limit) }
  }).select('username displayName avatar gamification.level');
  
  return mutualFriends;
};

// Update interaction stats
friendshipSchema.statics.recordInteraction = async function(userId1, userId2, type = 'message') {
  const friendship = await this.findOne({
    users: { $all: [userId1, userId2] },
    status: 'active'
  });
  
  if (!friendship) return null;
  
  if (type === 'message') {
    friendship.interactions.messagesCount += 1;
    friendship.interactions.lastMessageAt = new Date();
  } else if (type === 'challenge') {
    friendship.interactions.challengesTogether += 1;
  }
  
  // Update score based on interactions
  friendship.score = Math.floor(
    friendship.interactions.messagesCount * 0.1 +
    friendship.interactions.challengesTogether * 5
  );
  
  await friendship.save();
  return friendship;
};

// ============================================
// INSTANCE METHODS
// ============================================

// Get the other user in the friendship
friendshipSchema.methods.getOtherUser = function(userId) {
  return this.users.find(id => id.toString() !== userId.toString());
};

// Check if user is initiator
friendshipSchema.methods.isInitiator = function(userId) {
  return this.initiator.toString() === userId.toString();
};

const Friendship = mongoose.model('Friendship', friendshipSchema);

module.exports = Friendship;