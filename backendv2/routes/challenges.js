/**
 * Challenges Routes - Salifz
 */

const express = require('express');
const { Challenge, UserChallenge } = require('../models/Challenge');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/v1/challenges
 * Get all active challenges with user progress
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Get all active challenges
    const challenges = await Challenge.find({ isActive: true });
    
    // Get user's progress on challenges
    const userChallenges = await UserChallenge.find({ user: userId });
    const progressMap = {};
    userChallenges.forEach(uc => {
      progressMap[uc.challenge.toString()] = uc;
    });
    
    // Organize by period
    const daily = [];
    const weekly = [];
    const monthly = [];
    const special = [];
    
    for (const challenge of challenges) {
      const progress = progressMap[challenge._id.toString()];
      
      const challengeData = {
        _id: challenge._id,
        challengeId: challenge.challengeId,
        type: challenge.type,
        title: challenge.title,
        description: challenge.description,
        icon: challenge.icon,
        color: challenge.color,
        target: challenge.target,
        targetUnit: challenge.targetUnit,
        rewards: challenge.rewards,
        difficulty: challenge.difficulty,
        progress: progress?.progress || 0,
        isCompleted: progress?.isCompleted || false,
        isRewardClaimed: progress?.isRewardClaimed || false,
        startedAt: progress?.startedAt || null
      };
      
      switch (challenge.period) {
        case 'daily': daily.push(challengeData); break;
        case 'weekly': weekly.push(challengeData); break;
        case 'monthly': monthly.push(challengeData); break;
        case 'special': special.push(challengeData); break;
      }
    }
    
    res.json({
      success: true,
      data: {
        challenges: { daily, weekly, monthly, special }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/challenges/:id/start
 * Start a challenge
 */
router.post('/:id/start', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      throw new AppError('Challenge not found', 404);
    }
    
    // Check if already started
    let userChallenge = await UserChallenge.findOne({ user: userId, challenge: id });
    
    if (userChallenge) {
      return res.json({
        success: true,
        message: 'Challenge already started',
        data: { userChallenge }
      });
    }
    
    // Create new user challenge
    userChallenge = await UserChallenge.create({
      user: userId,
      challenge: id,
      progress: 0,
      startedAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: 'Challenge started',
      data: { userChallenge }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/challenges/:id/progress
 * Update challenge progress
 */
router.put('/:id/progress', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    const userId = req.userId;
    
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      throw new AppError('Challenge not found', 404);
    }
    
    let userChallenge = await UserChallenge.findOne({ user: userId, challenge: id });
    
    if (!userChallenge) {
      // Auto-start challenge
      userChallenge = await UserChallenge.create({
        user: userId,
        challenge: id,
        progress: 0,
        startedAt: new Date()
      });
    }
    
    // Update progress
    userChallenge.progress = Math.min(progress, challenge.target);
    
    // Check if completed
    if (userChallenge.progress >= challenge.target && !userChallenge.isCompleted) {
      userChallenge.isCompleted = true;
      userChallenge.completedAt = new Date();
    }
    
    await userChallenge.save();
    
    res.json({
      success: true,
      data: {
        userChallenge,
        isCompleted: userChallenge.isCompleted,
        canClaim: userChallenge.isCompleted && !userChallenge.isRewardClaimed
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/challenges/:id/claim
 * Claim challenge reward
 */
router.post('/:id/claim', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const challenge = await Challenge.findById(id);
    if (!challenge) {
      throw new AppError('Challenge not found', 404);
    }
    
    const userChallenge = await UserChallenge.findOne({ user: userId, challenge: id });
    
    if (!userChallenge) {
      throw new AppError('Challenge not started', 400);
    }
    
    if (!userChallenge.isCompleted) {
      throw new AppError('Challenge not completed', 400);
    }
    
    if (userChallenge.isRewardClaimed) {
      throw new AppError('Reward already claimed', 400);
    }
    
    // Get user and apply rewards
    const user = await User.findById(userId);
    
    const rewards = challenge.rewards;
    let rewardsApplied = {
      xp: 0,
      gems: 0,
      coins: 0,
      streakFreeze: 0
    };
    
    if (rewards.xp) {
      user.gamification.totalXP += rewards.xp;
      user.gamification.weeklyXP += rewards.xp;
      user.gamification.dailyXP += rewards.xp;
      rewardsApplied.xp = rewards.xp;
    }
    
    if (rewards.gems) {
      user.gamification.gems += rewards.gems;
      rewardsApplied.gems = rewards.gems;
    }
    
    if (rewards.coins) {
      // Add coins if you have that field
      rewardsApplied.coins = rewards.coins;
    }
    
    if (rewards.streakFreeze) {
      user.gamification.streakFreezes.available += rewards.streakFreeze;
      rewardsApplied.streakFreeze = rewards.streakFreeze;
    }
    
    await user.save();
    
    // Mark reward as claimed
    userChallenge.isRewardClaimed = true;
    userChallenge.claimedAt = new Date();
    await userChallenge.save();
    
    res.json({
      success: true,
      message: 'Reward claimed successfully',
      data: {
        rewards: rewardsApplied,
        newTotals: {
          xp: user.gamification.totalXP,
          gems: user.gamification.gems,
          level: user.gamification.level
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/challenges/completed
 * Get user's completed challenges
 */
router.get('/completed', async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const completed = await UserChallenge.find({
      user: userId,
      isCompleted: true
    }).populate('challenge').sort({ completedAt: -1 });
    
    res.json({
      success: true,
      data: {
        completed,
        totalCompleted: completed.length
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;