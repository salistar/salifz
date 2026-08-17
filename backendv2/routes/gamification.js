/**
 * Gamification Routes - Salifz
 * XP, streaks, hearts, daily quests, and rewards
 */

const express = require('express');
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const RedisService = require('../services/redis');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/v1/gamification/stats
 * Get user gamification stats
 */
router.get('/stats', async (req, res, next) => {
  try {
    const user = req.user;
    
    // Refill hearts if needed (for free users)
    if (!user.isPremium()) {
      await user.refillHearts();
    }

    res.json({
      success: true,
      data: {
        xp: {
          total: user.gamification.totalXP,
          weekly: user.gamification.weeklyXP,
          daily: user.gamification.dailyXP,
          level: user.gamification.level,
          nextLevelXP: Math.pow(user.gamification.level, 2) * 100
        },
        streak: {
          current: user.gamification.currentStreak,
          longest: user.gamification.longestStreak,
          lastActivity: user.gamification.lastActivityDate,
          freezesAvailable: user.gamification.streakFreezes.available,
          freezesUsedThisWeek: user.gamification.streakFreezes.usedThisWeek
        },
        hearts: user.isPremium() ? null : {
          current: user.gamification.hearts.current,
          max: user.gamification.hearts.max,
          lastRefill: user.gamification.hearts.lastRefill,
          nextRefillIn: getNextRefillTime(user.gamification.hearts.lastRefill)
        },
        league: {
          current: user.gamification.league,
          rank: user.gamification.leagueRank,
          inPromotionZone: user.gamification.promotionZone,
          inDemotionZone: user.gamification.demotionZone
        },
        gems: user.gamification.gems
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/gamification/add-xp
 * Add XP to user (called after completing lessons)
 */
router.post('/add-xp', async (req, res, next) => {
  try {
    const { amount, source } = req.body;
    const user = req.user;

    if (!amount || amount <= 0) {
      throw new AppError('Invalid XP amount', 400);
    }

    // Add XP
    await user.addXP(amount, source);

    // Update streak
    await user.updateStreak();

    // Update leaderboards
    await RedisService.updateLeaderboard(
      `leaderboard:global:weekly`,
      user._id,
      user.gamification.weeklyXP
    );
    await RedisService.updateLeaderboard(
      `leaderboard:league:${user.gamification.league}:weekly`,
      user._id,
      user.gamification.weeklyXP
    );

    // Record daily activity
    await RedisService.recordDailyActivity(user._id);

    // Check for level up
    const newLevel = user.gamification.level;
    const leveledUp = newLevel > (req.body.previousLevel || newLevel - 1);

    // Check achievements
    const newAchievements = await checkAchievements(user);

    res.json({
      success: true,
      data: {
        xpAdded: amount,
        totalXP: user.gamification.totalXP,
        weeklyXP: user.gamification.weeklyXP,
        level: newLevel,
        leveledUp,
        currentStreak: user.gamification.currentStreak,
        newAchievements
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/gamification/daily-quests
 * Get today's quests
 */
router.get('/daily-quests', async (req, res, next) => {
  try {
    const user = req.user;
    
    // Check if quests need to be reset
    const today = new Date().toDateString();
    const questDate = new Date(user.dailyQuests.date).toDateString();
    
    if (today !== questDate) {
      // Reset quests for new day
      user.dailyQuests = {
        date: new Date(),
        quests: generateDailyQuests(user),
        bonusQuestUnlocked: false
      };
      await user.save();
    }

    res.json({
      success: true,
      data: {
        date: user.dailyQuests.date,
        quests: user.dailyQuests.quests,
        bonusQuestUnlocked: user.dailyQuests.bonusQuestUnlocked,
        allCompleted: user.dailyQuests.quests.every(q => q.completed)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/gamification/update-quest
 * Update quest progress
 */
router.post('/update-quest', async (req, res, next) => {
  try {
    const { questId, progress } = req.body;
    const user = req.user;

    const quest = user.dailyQuests.quests.find(q => q.questId === questId);
    
    if (!quest) {
      throw new AppError('Quest not found', 404);
    }

    if (quest.completed) {
      return res.json({
        success: true,
        message: 'Quest already completed',
        data: { quest }
      });
    }

    // Update progress
    quest.current = Math.min(quest.current + progress, quest.target);
    
    let xpEarned = 0;
    
    // Check if completed
    if (quest.current >= quest.target && !quest.completed) {
      quest.completed = true;
      xpEarned = quest.xpReward;
      await user.addXP(xpEarned, 'daily_quest');

      // Check if all quests completed
      const allCompleted = user.dailyQuests.quests.every(q => q.completed);
      if (allCompleted && !user.dailyQuests.bonusQuestUnlocked) {
        user.dailyQuests.bonusQuestUnlocked = true;
        // Add bonus quest
        user.dailyQuests.quests.push({
          questId: 'bonus_quest',
          type: 'memorize',
          description: 'Bonus: Memorize 3 more verses',
          target: 3,
          current: 0,
          xpReward: 100,
          completed: false
        });
      }
    }

    await user.save();

    res.json({
      success: true,
      data: {
        quest,
        xpEarned,
        bonusQuestUnlocked: user.dailyQuests.bonusQuestUnlocked
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/gamification/use-streak-freeze
 * Use a streak freeze
 */
router.post('/use-streak-freeze', async (req, res, next) => {
  try {
    const user = req.user;

    if (user.gamification.streakFreezes.available <= 0) {
      throw new AppError('No streak freezes available', 400);
    }

    user.gamification.streakFreezes.available -= 1;
    user.gamification.streakFreezes.usedThisWeek += 1;
    await user.save();

    res.json({
      success: true,
      message: 'Streak freeze activated',
      data: {
        freezesRemaining: user.gamification.streakFreezes.available
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/gamification/purchase
 * Purchase items with gems
 */
router.post('/purchase', async (req, res, next) => {
  try {
    const { itemType, itemId } = req.body;
    const user = req.user;

    const prices = {
      streak_freeze: 50,
      heart_refill: 30,
      xp_boost_1h: 40,
      xp_boost_24h: 100,
      avatar: 75,
      theme: 50
    };

    const price = prices[itemType];
    
    if (!price) {
      throw new AppError('Invalid item type', 400);
    }

    if (user.gamification.gems < price) {
      throw new AppError('Not enough gems', 400);
    }

    // Deduct gems
    user.gamification.gems -= price;

    // Apply purchase
    switch (itemType) {
      case 'streak_freeze':
        user.gamification.streakFreezes.available += 1;
        break;
      case 'heart_refill':
        user.gamification.hearts.current = user.gamification.hearts.max;
        user.gamification.hearts.lastRefill = new Date();
        break;
      case 'xp_boost_1h':
      case 'xp_boost_24h': {
        // Store boost in Redis with expiry
        const duration = itemType === 'xp_boost_1h' ? 3600 : 86400;
        await RedisService.set(`xp_boost:${user._id}`, { multiplier: 2 }, duration);
        break;
      }
      case 'avatar':
        // Unlock avatar
        user.avatar = itemId;
        break;
      case 'theme':
        // Unlock theme
        user.avatarCustomization.background = itemId;
        break;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Purchase successful',
      data: {
        gemsRemaining: user.gamification.gems,
        itemType,
        itemId
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/gamification/lose-heart
 * Lose a heart on wrong answer (free users only)
 */
router.post('/lose-heart', async (req, res, next) => {
  try {
    const user = req.user;

    if (user.isPremium()) {
      return res.json({
        success: true,
        message: 'Premium users have unlimited hearts',
        data: { unlimited: true }
      });
    }

    const canContinue = await user.loseHeart();

    res.json({
      success: true,
      data: {
        heartsRemaining: user.gamification.hearts.current,
        canContinue,
        nextRefillIn: getNextRefillTime(user.gamification.hearts.lastRefill)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
function generateDailyQuests(user) {
  const quests = [
    {
      questId: 'daily_memorize',
      type: 'memorize',
      description: `Memorize ${user.profile.dailyGoal} new verses`,
      target: user.profile.dailyGoal,
      current: 0,
      xpReward: user.profile.dailyGoal * 10,
      completed: false
    },
    {
      questId: 'daily_review',
      type: 'review',
      description: 'Review 10 verses',
      target: 10,
      current: 0,
      xpReward: 30,
      completed: false
    },
    {
      questId: 'daily_lesson',
      type: 'streak',
      description: 'Complete a lesson',
      target: 1,
      current: 0,
      xpReward: 20,
      completed: false
    }
  ];

  // Add premium quest
  if (user.isPremium()) {
    quests.push({
      questId: 'daily_tajwid',
      type: 'tajwid',
      description: 'Get 80%+ on a tajwid exercise',
      target: 1,
      current: 0,
      xpReward: 40,
      completed: false
    });
  }

  return quests;
}

function getNextRefillTime(lastRefill) {
  const refillInterval = (parseInt(process.env.HEARTS_REFILL_HOURS) || 4) * 60 * 60 * 1000;
  const nextRefill = new Date(lastRefill).getTime() + refillInterval;
  const now = Date.now();
  
  if (nextRefill <= now) return 0;
  return Math.ceil((nextRefill - now) / 1000); // seconds
}

async function checkAchievements(user) {
  const newAchievements = [];
  const allAchievements = await Achievement.find({ isActive: true });

  for (const achievement of allAchievements) {
    // Skip if already unlocked
    if (user.achievements.find(a => a.achievementId?.toString() === achievement._id.toString())) {
      continue;
    }

    let unlocked = false;

    switch (achievement.requirement.type) {
      case 'verses_memorized':
        unlocked = user.quranProgress.totalVersesMemorized >= achievement.requirement.value;
        break;
      case 'streak_days':
        unlocked = user.gamification.currentStreak >= achievement.requirement.value;
        break;
      case 'total_xp':
        unlocked = user.gamification.totalXP >= achievement.requirement.value;
        break;
      case 'level_reached':
        unlocked = user.gamification.level >= achievement.requirement.value;
        break;
      case 'friends_count':
        unlocked = user.social.friends.length >= achievement.requirement.value;
        break;
      // Add more cases as needed
    }

    if (unlocked) {
      user.achievements.push({
        achievementId: achievement._id,
        unlockedAt: new Date(),
        progress: 100
      });

      // Award XP and gems
      if (achievement.xpReward) {
        user.gamification.totalXP += achievement.xpReward;
      }
      if (achievement.gemsReward) {
        user.gamification.gems += achievement.gemsReward;
      }

      // Update total unlocks
      achievement.totalUnlocks += 1;
      await achievement.save();

      newAchievements.push({
        id: achievement._id,
        name: achievement.name,
        icon: achievement.icon,
        xpReward: achievement.xpReward,
        gemsReward: achievement.gemsReward
      });
    }
  }

  if (newAchievements.length > 0) {
    await user.save();
  }

  return newAchievements;
}

module.exports = router;
