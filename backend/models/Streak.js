/**
 * Streak Model - Salifz
 */

const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  current: {
    type: Number,
    default: 0
  },
  longest: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  freezesAvailable: {
    type: Number,
    default: 2
  },
  freezesUsed: {
    type: Number,
    default: 0
  },
  freezeUsedToday: {
    type: Boolean,
    default: false
  },
  
  // Milestones reached
  milestones: [{
    days: Number,
    reachedAt: Date,
    rewardClaimed: { type: Boolean, default: false }
  }],
  
  // History for calendar view
  history: [{
    date: Date,
    completed: Boolean,
    froze: Boolean,
    xpEarned: Number,
    versesMemorized: Number,
    versesReviewed: Number
  }]
}, {
  timestamps: true
});

// Check and update streak
streakSchema.methods.checkAndUpdate = async function(activityData = {}) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let streakUpdated = false;
  let streakBroken = false;
  let freezeUsed = false;
  
  if (this.lastActivityDate) {
    const lastActivity = new Date(this.lastActivityDate);
    const lastDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
    
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Same day, just update history
      const todayHistory = this.history.find(h => {
        const hDate = new Date(h.date);
        return hDate.toDateString() === today.toDateString();
      });
      
      if (todayHistory) {
        todayHistory.xpEarned = (todayHistory.xpEarned || 0) + (activityData.xp || 0);
        todayHistory.versesMemorized = (todayHistory.versesMemorized || 0) + (activityData.versesMemorized || 0);
        todayHistory.versesReviewed = (todayHistory.versesReviewed || 0) + (activityData.versesReviewed || 0);
      }
    } else if (diffDays === 1) {
      // Consecutive day
      this.current += 1;
      streakUpdated = true;
    } else if (diffDays === 2 && this.freezesAvailable > 0 && !this.freezeUsedToday) {
      // Missed one day, use freeze
      this.freezesAvailable -= 1;
      this.freezesUsed += 1;
      this.freezeUsedToday = true;
      this.current += 1;
      freezeUsed = true;
      streakUpdated = true;
      
      // Add frozen day to history
      const missedDate = new Date(today);
      missedDate.setDate(missedDate.getDate() - 1);
      this.history.push({
        date: missedDate,
        completed: false,
        froze: true
      });
    } else {
      // Streak broken
      this.current = 1;
      streakBroken = true;
      streakUpdated = true;
    }
  } else {
    // First activity
    this.current = 1;
    streakUpdated = true;
  }
  
  // Update longest
  if (this.current > this.longest) {
    this.longest = this.current;
  }
  
  // Check milestones
  const milestoneDays = [3, 7, 14, 30, 60, 100, 180, 365];
  for (const days of milestoneDays) {
    if (this.current >= days && !this.milestones.find(m => m.days === days)) {
      this.milestones.push({
        days,
        reachedAt: new Date(),
        rewardClaimed: false
      });
    }
  }
  
  // Add today to history
  if (streakUpdated) {
    this.history.push({
      date: today,
      completed: true,
      froze: false,
      xpEarned: activityData.xp || 0,
      versesMemorized: activityData.versesMemorized || 0,
      versesReviewed: activityData.versesReviewed || 0
    });
  }
  
  this.lastActivityDate = now;
  this.freezeUsedToday = false; // Reset for next day
  
  // Keep only last 90 days of history
  if (this.history.length > 90) {
    this.history = this.history.slice(-90);
  }
  
  await this.save();
  
  return {
    current: this.current,
    longest: this.longest,
    streakUpdated,
    streakBroken,
    freezeUsed,
    freezesAvailable: this.freezesAvailable,
    newMilestones: this.milestones.filter(m => !m.rewardClaimed)
  };
};

// Use a freeze manually
streakSchema.methods.useFreeze = async function() {
  if (this.freezesAvailable <= 0) {
    throw new Error('No freezes available');
  }
  
  this.freezesAvailable -= 1;
  this.freezesUsed += 1;
  await this.save();
  
  return {
    freezesAvailable: this.freezesAvailable,
    freezesUsed: this.freezesUsed
  };
};

// Add freezes (purchased or rewarded)
streakSchema.methods.addFreezes = async function(count = 1) {
  this.freezesAvailable += count;
  await this.save();
  return this.freezesAvailable;
};

const Streak = mongoose.model('Streak', streakSchema);

module.exports = Streak;