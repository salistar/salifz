/**
 * Halaqa Model - Salifz
 * Study circles/groups for community learning
 * ✅ UPDATED: Added activities support (12 types)
 * ✅ UPDATED: Added member stats
 * ✅ UPDATED: Added allowChat, allowVoice, activityTypes settings
 */

const mongoose = require('mongoose');

// ============================================
// ACTIVITY SCHEMA (embedded in Halaqa)
// ============================================
const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['memorize', 'review', 'tajweed', 'tafseer', 'recitation', 'competition', 'lesson', 'quiz', 'discussion', 'challenge', 'workshop', 'achievement'],
  },
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  xpReward: { type: Number, default: 50, min: 0, max: 500 },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: Date,
  endDate: Date,
  createdAt: { type: Date, default: Date.now },
});

// ============================================
// MEMBER SCHEMA (embedded in Halaqa)
// ============================================
const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String, enum: ['member', 'moderator', 'admin', 'creator'], default: 'member' },
  joinedAt: { type: Date, default: Date.now },
  // ✅ ADDED: Member stats
  stats: {
    weeklyXP: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    versesMemorized: { type: Number, default: 0 },
    activitiesCompleted: { type: Number, default: 0 },
  },
  // Legacy fields (kept for compatibility)
  weeklyXP: { type: Number, default: 0 },
  totalXP: { type: Number, default: 0 },
});

// ============================================
// HALAQA SCHEMA
// ============================================
const halaqaSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 50 },
  description: { type: String, maxlength: 500 },
  avatar: { type: String, default: 'halaqa_default' },
  coverImage: String,
  
  // Creator and admins
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Members
  members: [memberSchema],
  memberCount: { type: Number, default: 1 },
  maxMembers: { type: Number, default: 50 },
  
  // ✅ UPDATED: Settings with new fields
  settings: {
    isPublic: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: false },
    language: { type: String, default: 'ar' },
    focusSurah: Number,
    focusJuz: Number,
    dailyGoal: { type: Number, default: 5 },
    // ✅ ADDED: New settings
    allowChat: { type: Boolean, default: true },
    allowVoice: { type: Boolean, default: false },
    activityTypes: {
      type: [String],
      default: ['memorize', 'review', 'tajweed', 'recitation', 'quiz'],
      enum: ['memorize', 'review', 'tajweed', 'tafseer', 'recitation', 'competition', 'lesson', 'quiz', 'discussion', 'challenge', 'workshop', 'achievement'],
    },
  },
  
  // ✅ ADDED: Activities array
  activities: [activitySchema],
  
  // Challenges (legacy)
  activeChallenge: {
    type: { type: String, enum: ['memorize', 'review', 'xp', 'streak'] },
    target: Number,
    endsAt: Date,
    participants: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      progress: Number
    }]
  },
  
  // ✅ UPDATED: Stats with activitiesCount
  stats: {
    totalVersesMemorized: { type: Number, default: 0 },
    weeklyXP: { type: Number, default: 0 },
    totalXP: { type: Number, default: 0 },
    averageStreak: { type: Number, default: 0 },
    activitiesCount: { type: Number, default: 0 },
  },
  
  // ✅ ADDED: Messages for halaqa chat
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    type: { type: String, enum: ['text', 'verse', 'audio', 'system'], default: 'text' },
    createdAt: { type: Date, default: Date.now },
  }],
  
  // Invite code
  inviteCode: { type: String, unique: true, sparse: true },
  
  isActive: { type: Boolean, default: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// VIRTUALS
// ============================================
halaqaSchema.virtual('membersCount').get(function() {
  return this.members?.length || 0;
});

// ============================================
// INDEXES
// ============================================
halaqaSchema.index({ 'settings.isPublic': 1, memberCount: -1 });
halaqaSchema.index({ creator: 1 });
halaqaSchema.index({ 'members.user': 1 });
halaqaSchema.index({ createdAt: -1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================
halaqaSchema.pre('save', async function(next) {
  // Generate invite code if not exists
  if (!this.inviteCode) {
    let code;
    let exists = true;
    
    while (exists) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      exists = await mongoose.model('Halaqa').findOne({ inviteCode: code });
    }
    
    this.inviteCode = code;
  }
  
  // Update member count
  this.memberCount = this.members?.length || 0;
  
  // Update activities count
  this.stats.activitiesCount = this.activities?.length || 0;
  
  // Ensure creator is in admins
  if (this.creator && !this.admins.some(a => a.toString() === this.creator.toString())) {
    this.admins.push(this.creator);
  }
  
  next();
});

// ============================================
// METHODS
// ============================================

// Check if user is member
halaqaSchema.methods.isMember = function(userId) {
  if (!userId) return false;
  return this.members.some(m => m.user?.toString() === userId.toString());
};

// Check if user is admin
halaqaSchema.methods.isAdmin = function(userId) {
  if (!userId) return false;
  return this.creator?.toString() === userId.toString() || 
         this.admins.some(a => a.toString() === userId.toString());
};

// Check if user is creator
halaqaSchema.methods.isCreator = function(userId) {
  if (!userId) return false;
  return this.creator?.toString() === userId.toString();
};

// Add member
halaqaSchema.methods.addMember = async function(userId, role = 'member') {
  if (!userId) throw new Error('User ID required');
  
  if (this.members.length >= this.maxMembers) {
    throw new Error('الحلقة ممتلئة');
  }
  
  if (this.members.find(m => m.user?.toString() === userId.toString())) {
    throw new Error('المستخدم عضو بالفعل');
  }
  
  this.members.push({ 
    user: userId, 
    role,
    joinedAt: new Date(),
    stats: {
      weeklyXP: 0,
      totalXP: 0,
      versesMemorized: 0,
      activitiesCompleted: 0,
    },
    weeklyXP: 0,
    totalXP: 0,
  });
  
  this.memberCount = this.members.length;
  await this.save();
  return this;
};

// Remove member
halaqaSchema.methods.removeMember = async function(userId) {
  if (!userId) throw new Error('User ID required');
  
  // Creator cannot be removed
  if (this.creator?.toString() === userId.toString()) {
    throw new Error('لا يمكن إزالة منشئ الحلقة');
  }
  
  this.members = this.members.filter(m => m.user?.toString() !== userId.toString());
  this.admins = this.admins.filter(a => a.toString() !== userId.toString());
  this.memberCount = this.members.length;
  
  await this.save();
  return this;
};

// ✅ ADDED: Add activity
halaqaSchema.methods.addActivity = async function(activityData, creatorId) {
  if (!creatorId) throw new Error('Creator ID required');
  
  if (!this.isAdmin(creatorId)) {
    throw new Error('فقط المدير يمكنه إضافة أنشطة');
  }
  
  // Validate activity type
  if (this.settings.activityTypes && !this.settings.activityTypes.includes(activityData.type)) {
    throw new Error('نوع النشاط غير مسموح في هذه الحلقة');
  }
  
  this.activities.push({
    ...activityData,
    createdBy: creatorId,
    createdAt: new Date(),
    status: 'active',
    completedBy: [],
  });
  
  this.stats.activitiesCount = this.activities.length;
  await this.save();
  
  return this.activities[this.activities.length - 1];
};

// ✅ ADDED: Complete activity
halaqaSchema.methods.completeActivity = async function(activityId, userId) {
  if (!userId) throw new Error('User ID required');
  if (!activityId) throw new Error('Activity ID required');
  
  const activity = this.activities.id(activityId);
  
  if (!activity) {
    throw new Error('النشاط غير موجود');
  }
  
  if (activity.completedBy?.includes(userId)) {
    throw new Error('تم إكمال هذا النشاط مسبقاً');
  }
  
  // Add user to completedBy
  activity.completedBy.push(userId);
  
  // Update member stats
  const member = this.members.find(m => m.user?.toString() === userId.toString());
  if (member) {
    if (!member.stats) {
      member.stats = { weeklyXP: 0, totalXP: 0, versesMemorized: 0, activitiesCompleted: 0 };
    }
    member.stats.activitiesCompleted = (member.stats.activitiesCompleted || 0) + 1;
    member.stats.totalXP = (member.stats.totalXP || 0) + (activity.xpReward || 0);
    member.stats.weeklyXP = (member.stats.weeklyXP || 0) + (activity.xpReward || 0);
    
    // Legacy fields
    member.totalXP = (member.totalXP || 0) + (activity.xpReward || 0);
    member.weeklyXP = (member.weeklyXP || 0) + (activity.xpReward || 0);
  }
  
  // Update halaqa stats
  this.stats.totalXP = (this.stats.totalXP || 0) + (activity.xpReward || 0);
  this.stats.weeklyXP = (this.stats.weeklyXP || 0) + (activity.xpReward || 0);
  
  await this.save();
  
  return activity;
};

// ✅ ADDED: Delete activity
halaqaSchema.methods.deleteActivity = async function(activityId, userId) {
  if (!userId) throw new Error('User ID required');
  if (!activityId) throw new Error('Activity ID required');
  
  if (!this.isAdmin(userId)) {
    throw new Error('فقط المدير يمكنه حذف الأنشطة');
  }
  
  this.activities = this.activities.filter(a => a._id.toString() !== activityId.toString());
  this.stats.activitiesCount = this.activities.length;
  
  await this.save();
  return this;
};

// Get leaderboard
halaqaSchema.methods.getLeaderboard = function(limit = 20) {
  return this.members
    .filter(m => m.user)
    .sort((a, b) => {
      const aXP = a.stats?.weeklyXP || a.weeklyXP || 0;
      const bXP = b.stats?.weeklyXP || b.weeklyXP || 0;
      return bXP - aXP;
    })
    .slice(0, limit);
};

// ✅ ADDED: Promote to admin
halaqaSchema.methods.promoteToAdmin = async function(userId, promoterId) {
  if (!this.isCreator(promoterId)) {
    throw new Error('فقط المنشئ يمكنه ترقية المدراء');
  }
  
  if (!this.isMember(userId)) {
    throw new Error('المستخدم ليس عضواً');
  }
  
  if (!this.admins.some(a => a.toString() === userId.toString())) {
    this.admins.push(userId);
    
    const member = this.members.find(m => m.user?.toString() === userId.toString());
    if (member) {
      member.role = 'admin';
    }
    
    await this.save();
  }
  
  return this;
};

// ✅ ADDED: Add message
halaqaSchema.methods.addMessage = async function(senderId, content, type = 'text') {
  if (!this.settings.allowChat) {
    throw new Error('المحادثة معطلة في هذه الحلقة');
  }
  
  if (!this.isMember(senderId)) {
    throw new Error('يجب أن تكون عضواً للإرسال');
  }
  
  this.messages.push({
    sender: senderId,
    content,
    type,
    createdAt: new Date(),
  });
  
  // Keep only last 100 messages
  if (this.messages.length > 100) {
    this.messages = this.messages.slice(-100);
  }
  
  await this.save();
  
  return this.messages[this.messages.length - 1];
};

// ============================================
// STATICS
// ============================================

// Find public halaqat
halaqaSchema.statics.findPublic = function(limit = 20) {
  return this.find({ 'settings.isPublic': true, isActive: true })
    .sort({ memberCount: -1 })
    .limit(limit)
    .populate('creator', 'username displayName avatar');
};

// Find by invite code
halaqaSchema.statics.findByInviteCode = function(code) {
  return this.findOne({ inviteCode: code.toUpperCase(), isActive: true });
};

// Find user's halaqat
halaqaSchema.statics.findUserHalaqat = function(userId) {
  return this.find({
    $or: [
      { creator: userId },
      { admins: userId },
      { 'members.user': userId }
    ],
    isActive: { $ne: false }
  })
  .populate('creator', 'username displayName avatar')
  .sort({ updatedAt: -1 });
};

const Halaqa = mongoose.model('Halaqa', halaqaSchema);
module.exports = Halaqa;