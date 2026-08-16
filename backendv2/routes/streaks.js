/**
 * Streaks Routes - Salifz
 */

const express = require('express');
const Streak = require('../models/Streak');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/v1/streaks
 * Get user's streak data
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    
    let streak = await Streak.findOne({ user: userId });
    
    if (!streak) {
      streak = await Streak.create({ user: userId });
    }
    
    // Get calendar data (last 30 days)
    const last30Days = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const historyEntry = streak.history.find(h => {
        const hDate = new Date(h.date);
        return hDate.toDateString() === date.toDateString();
      });
      
      last30Days.push({
        date: date.toISOString().split('T')[0],
        completed: historyEntry?.completed || false,
        froze: historyEntry?.froze || false,
        xpEarned: historyEntry?.xpEarned || 0
      });
    }
    
    // Get unclaimed milestones
    const unclaimedMilestones = streak.milestones.filter(m => !m.rewardClaimed);
    
    res.json({
      success: true,
      data: {
        streak: {
          current: streak.current,
          longest: streak.longest,
          lastActivityDate: streak.lastActivityDate,
          freezesAvailable: streak.freezesAvailable,
          freezesUsed: streak.freezesUsed
        },
        calendar: last30Days,
        milestones: streak.milestones,
        unclaimedMilestones,
        nextMilestone: getNextMilestone(streak.current)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/streaks/update
 * Update streak (called after completing a lesson)
 */
router.post('/update', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { xp, versesMemorized, versesReviewed } = req.body;
    
    let streak = await Streak.findOne({ user: userId });
    
    if (!streak) {
      streak = await Streak.create({ user: userId });
    }
    
    const result = await streak.checkAndUpdate({
      xp: xp || 0,
      versesMemorized: versesMemorized || 0,
      versesReviewed: versesReviewed || 0
    });
    
    // Update user's gamification data
    const user = await User.findById(userId);
    user.gamification.currentStreak = streak.current;
    user.gamification.longestStreak = streak.longest;
    user.gamification.lastActivityDate = streak.lastActivityDate;
    await user.save();
    
    // Check for new milestones and create notifications
    if (result.newMilestones && result.newMilestones.length > 0) {
      for (const milestone of result.newMilestones) {
        await Notification.create({
          user: userId,
          type: 'streak_milestone',
          title: {
            ar: `🎉 مبروك! وصلت لسلسلة ${milestone.days} يوم`,
            en: `🎉 Congrats! You reached a ${milestone.days}-day streak`
          },
          body: {
            ar: 'استمر في التقدم!',
            en: 'Keep up the great work!'
          },
          icon: '🔥',
          action: { screen: 'Streak' }
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        streak: {
          current: streak.current,
          longest: streak.longest,
          freezesAvailable: streak.freezesAvailable
        },
        ...result
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/streaks/freeze
 * Use a streak freeze
 */
router.post('/freeze', async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const streak = await Streak.findOne({ user: userId });
    
    if (!streak) {
      throw new AppError('Streak not found', 404);
    }
    
    const result = await streak.useFreeze();
    
    // Update user
    const user = await User.findById(userId);
    user.gamification.streakFreezes.available = streak.freezesAvailable;
    await user.save();
    
    res.json({
      success: true,
      message: 'Streak freeze used',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/streaks/buy-freeze
 * Buy a streak freeze with gems
 */
router.post('/buy-freeze', async (req, res, next) => {
  try {
    const userId = req.userId;
    const FREEZE_COST = 200; // gems
    
    const user = await User.findById(userId);
    
    if (user.gamification.gems < FREEZE_COST) {
      throw new AppError('Not enough gems', 400);
    }
    
    // Deduct gems
    user.gamification.gems -= FREEZE_COST;
    user.gamification.streakFreezes.available += 1;
    await user.save();
    
    // Update streak model
    let streak = await Streak.findOne({ user: userId });
    if (!streak) {
      streak = await Streak.create({ user: userId });
    }
    await streak.addFreezes(1);
    
    res.json({
      success: true,
      message: 'Streak freeze purchased',
      data: {
        freezesAvailable: streak.freezesAvailable,
        gemsRemaining: user.gamification.gems
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/streaks/milestones/:days/claim
 * Claim milestone reward
 */
router.post('/milestones/:days/claim', async (req, res, next) => {
  try {
    const userId = req.userId;
    const days = parseInt(req.params.days);
    
    const streak = await Streak.findOne({ user: userId });
    
    if (!streak) {
      throw new AppError('Streak not found', 404);
    }
    
    const milestone = streak.milestones.find(m => m.days === days);
    
    if (!milestone) {
      throw new AppError('Milestone not reached', 400);
    }
    
    if (milestone.rewardClaimed) {
      throw new AppError('Reward already claimed', 400);
    }
    
    // Calculate reward based on milestone
    const rewards = getMilestoneReward(days);
    
    // Apply rewards
    const user = await User.findById(userId);
    user.gamification.totalXP += rewards.xp;
    user.gamification.gems += rewards.gems;
    if (rewards.streakFreeze) {
      user.gamification.streakFreezes.available += rewards.streakFreeze;
      streak.freezesAvailable += rewards.streakFreeze;
    }
    await user.save();
    
    // Mark as claimed
    milestone.rewardClaimed = true;
    await streak.save();
    
    res.json({
      success: true,
      message: 'Milestone reward claimed',
      data: {
        rewards,
        newTotals: {
          xp: user.gamification.totalXP,
          gems: user.gamification.gems,
          freezes: streak.freezesAvailable
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
function getNextMilestone(currentStreak) {
  const milestones = [3, 7, 14, 30, 60, 100, 180, 365];
  
  for (const days of milestones) {
    if (currentStreak < days) {
      return {
        days,
        remaining: days - currentStreak,
        reward: getMilestoneReward(days)
      };
    }
  }
  
  return null;
}

function getMilestoneReward(days) {
  const rewards = {
    3: { xp: 30, gems: 10, streakFreeze: 0 },
    7: { xp: 70, gems: 25, streakFreeze: 1 },
    14: { xp: 150, gems: 50, streakFreeze: 1 },
    30: { xp: 300, gems: 100, streakFreeze: 2 },
    60: { xp: 600, gems: 200, streakFreeze: 2 },
    100: { xp: 1000, gems: 350, streakFreeze: 3 },
    180: { xp: 1800, gems: 500, streakFreeze: 3 },
    365: { xp: 3650, gems: 1000, streakFreeze: 5 }
  };
  
  return rewards[days] || { xp: days * 10, gems: days * 3, streakFreeze: 0 };
}

module.exports = router;