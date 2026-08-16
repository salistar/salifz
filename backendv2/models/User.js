/**
 * User Model - Salifz
 * Complete user schema with gamification, progress tracking, and social features
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ============================================
  // Basic Information
  // ============================================
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: 'default_avatar_1'
  },
  avatarCustomization: {
    outfit: { type: String, default: 'default' },
    accessory: { type: String, default: 'none' },
    background: { type: String, default: 'gradient_1' }
  },

  // ============================================
  // Profile & Preferences
  // ============================================
  profile: {
    gender: {
      type: String,
      enum: ['male', 'female', 'not_specified'],
      default: 'not_specified'
    },
    ageGroup: {
      type: String,
      enum: ['child', 'teen', 'adult', 'senior'],
      default: 'adult'
    },
    country: String,
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'ar',
      enum: ['ar', 'en', 'fr', 'tr', 'ur', 'id', 'ms']
    },
    preferredReciter: {
      type: String,
      default: 'mishary_rashid'
    },
    dailyGoal: {
      type: Number,
      default: 5, // verses per day
      min: 1,
      max: 50
    },
    notificationsEnabled: {
      type: Boolean,
      default: true
    },
    reminderTime: {
      type: String,
      default: '08:00'
    }
  },

  // ============================================
  // Gamification Stats
  // ============================================
  gamification: {
    // Experience Points
    totalXP: {
      type: Number,
      default: 0
    },
    weeklyXP: {
      type: Number,
      default: 0
    },
    dailyXP: {
      type: Number,
      default: 0
    },
    
    // Level System (based on total XP)
    level: {
      type: Number,
      default: 1
    },
    
    // Streak System
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastActivityDate: {
      type: Date,
      default: null
    },
    streakFreezes: {
      available: { type: Number, default: 2 },
      usedThisWeek: { type: Number, default: 0 }
    },
    
    // Hearts System (for free users)
    hearts: {
      current: { type: Number, default: 5 },
      max: { type: Number, default: 5 },
      lastRefill: { type: Date, default: Date.now }
    },
    
    // League System
    league: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'diamond', 'hafiz'],
      default: 'bronze'
    },
    leagueRank: {
      type: Number,
      default: 0
    },
    promotionZone: {
      type: Boolean,
      default: false
    },
    demotionZone: {
      type: Boolean,
      default: false
    },
    
    // Gems (premium currency)
    gems: {
      type: Number,
      default: 100 // Starting bonus
    },
    
    // Coins (secondary currency)
    coins: {
      type: Number,
      default: 0
    },
    
    // Daily reward tracking
    lastDailyReward: {
      type: Date,
      default: null
    }
  },

  // ============================================
  // Quran Progress
  // ============================================
  quranProgress: {
    // Overall stats
    totalVersesMemorized: {
      type: Number,
      default: 0
    },
    totalJuzCompleted: {
      type: Number,
      default: 0
    },
    totalSurahCompleted: {
      type: Number,
      default: 0
    },
    totalReviewSessions: {
      type: Number,
      default: 0
    },
    
    // Current focus
    currentSurah: {
      type: Number,
      default: 1
    },
    currentAyah: {
      type: Number,
      default: 1
    },
    currentJuz: {
      type: Number,
      default: 1
    },
    
    // Memorization path preference
    memorizationPath: {
      type: String,
      enum: ['traditional', 'juz_amma_first', 'custom'],
      default: 'juz_amma_first'
    },
    
    // Average tajwid score (0-100)
    avgTajwidScore: {
      type: Number,
      default: 0
    }
  },

  // ============================================
  // Achievements & Badges
  // ============================================
  achievements: [{
    achievementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Achievement'
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      default: 100 // Percentage
    }
  }],

  // ============================================
  // Social Features
  // ============================================
  social: {
    friends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    friendRequests: {
      sent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      received: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }]
    },
    halaqat: [{ // Study groups
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Halaqa'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    isPublicProfile: {
      type: Boolean,
      default: true
    }
  },

  // ============================================
  // Subscription & Premium
  // ============================================
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'salifz_plus', 'salifz_family', 'lifetime'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'canceled', 'expired', 'trial'],
      default: 'active'
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    familyOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },

  // ============================================
  // Daily Quests
  // ============================================
  dailyQuests: {
    date: {
      type: Date,
      default: Date.now
    },
    quests: [{
      questId: String,
      type: {
        type: String,
        enum: ['memorize', 'review', 'streak', 'social', 'tajwid']
      },
      description: String,
      target: Number,
      current: {
        type: Number,
        default: 0
      },
      xpReward: Number,
      completed: {
        type: Boolean,
        default: false
      }
    }],
    bonusQuestUnlocked: {
      type: Boolean,
      default: false
    }
  },

  // ============================================
  // Account Status
  // ============================================
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Parental Controls
  parentalControls: {
    isChildAccount: {
      type: Boolean,
      default: false
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dailyTimeLimit: Number, // minutes
    contentRestrictions: [String]
  },

  // Device & Session Info
  devices: [{
    deviceId: String,
    deviceType: String,
    lastActive: Date,
    pushToken: String
  }],

  // Timestamps
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ============================================
// Indexes (only for compound/non-unique indexes)
// Note: email and username already have indexes via unique:true
// ============================================
userSchema.index({ 'gamification.weeklyXP': -1 });
userSchema.index({ 'gamification.league': 1, 'gamification.weeklyXP': -1 });
userSchema.index({ 'profile.country': 1 });

// ============================================
// Pre-save Middleware
// ============================================
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  // Update level based on XP
  this.gamification.level = calculateLevel(this.gamification.totalXP);
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// ============================================
// Instance Methods
// ============================================

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Add XP
userSchema.methods.addXP = async function(amount, source) {
  this.gamification.totalXP += amount;
  this.gamification.weeklyXP += amount;
  this.gamification.dailyXP += amount;
  this.gamification.level = calculateLevel(this.gamification.totalXP);
  
  await this.save();
  return this.gamification;
};

// Update streak
userSchema.methods.updateStreak = async function() {
  const now = new Date();
  const lastActivity = this.gamification.lastActivityDate;
  
  if (!lastActivity) {
    this.gamification.currentStreak = 1;
  } else {
    const diffDays = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Same day, streak unchanged
    } else if (diffDays === 1) {
      // Consecutive day, increment streak
      this.gamification.currentStreak += 1;
    } else if (diffDays === 2 && this.gamification.streakFreezes.available > 0) {
      // Missed one day but has freeze
      this.gamification.streakFreezes.available -= 1;
      this.gamification.streakFreezes.usedThisWeek += 1;
      this.gamification.currentStreak += 1;
    } else {
      // Streak broken
      this.gamification.currentStreak = 1;
    }
  }
  
  // Update longest streak
  if (this.gamification.currentStreak > this.gamification.longestStreak) {
    this.gamification.longestStreak = this.gamification.currentStreak;
  }
  
  this.gamification.lastActivityDate = now;
  await this.save();
  
  return this.gamification.currentStreak;
};

// Check if premium
userSchema.methods.isPremium = function() {
  return ['salifz_plus', 'salifz_family', 'lifetime'].includes(this.subscription.plan) 
    && this.subscription.status === 'active';
};

// Lose heart (for free users)
userSchema.methods.loseHeart = async function() {
  if (this.isPremium()) return true;
  
  if (this.gamification.hearts.current > 0) {
    this.gamification.hearts.current -= 1;
    await this.save();
    return true;
  }
  return false;
};

// Refill hearts
userSchema.methods.refillHearts = async function() {
  const now = new Date();
  const lastRefill = this.gamification.hearts.lastRefill;
  const hoursSinceRefill = (now - lastRefill) / (1000 * 60 * 60);
  const refillInterval = parseInt(process.env.HEARTS_REFILL_HOURS) || 4;
  
  if (hoursSinceRefill >= refillInterval) {
    const heartsToAdd = Math.floor(hoursSinceRefill / refillInterval);
    this.gamification.hearts.current = Math.min(
      this.gamification.hearts.current + heartsToAdd,
      this.gamification.hearts.max
    );
    this.gamification.hearts.lastRefill = now;
    await this.save();
  }
  
  return this.gamification.hearts;
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    username: this.username,
    displayName: this.displayName || this.username,
    avatar: this.avatar,
    avatarCustomization: this.avatarCustomization,
    level: this.gamification.level,
    totalXP: this.gamification.totalXP,
    currentStreak: this.gamification.currentStreak,
    league: this.gamification.league,
    totalVersesMemorized: this.quranProgress.totalVersesMemorized,
    achievementsCount: this.achievements.length
  };
};

// ============================================
// Static Methods
// ============================================

// Find by email or username
userSchema.statics.findByCredentials = async function(emailOrUsername) {
  return this.findOne({
    $or: [
      { email: emailOrUsername.toLowerCase() },
      { username: emailOrUsername }
    ]
  }).select('+password');
};

// Get league leaderboard
userSchema.statics.getLeagueLeaderboard = async function(league, limit = 30) {
  return this.find({ 'gamification.league': league })
    .sort({ 'gamification.weeklyXP': -1 })
    .limit(limit)
    .select('username displayName avatar gamification.weeklyXP gamification.level');
};

// ============================================
// Helper Functions
// ============================================

function calculateLevel(totalXP) {
  // Level formula: level = floor(sqrt(totalXP / 100)) + 1
  // Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP, etc.
  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
}

const User = mongoose.model('User', userSchema);

module.exports = User;