/**
 * Rewards/Shop Routes - Salifz
 */

const express = require('express');
const { ShopItem, UserPurchase } = require('../models/ShopItem');
const User = require('../models/User');
const Streak = require('../models/Streak');
const RedisService = require('../services/redis');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/v1/rewards/shop
 * Get all shop items
 */
router.get('/shop', async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    // Get all active items
    const items = await ShopItem.find({ isActive: true }).sort({ sortOrder: 1 });
    
    // Get user's purchases
    const purchases = await UserPurchase.find({ user: userId });
    const purchaseMap = {};
    purchases.forEach(p => {
      purchaseMap[p.item.toString()] = p;
    });
    
    // Filter and add purchase info
    const shopItems = items
      .filter(item => !item.isPremiumOnly || user.isPremium())
      .map(item => ({
        _id: item._id,
        itemId: item.itemId,
        name: item.name,
        description: item.description,
        icon: item.icon,
        category: item.category,
        price: item.price,
        effect: item.effect,
        badge: item.badge,
        originalPrice: item.originalPrice,
        purchaseCount: purchaseMap[item._id.toString()]?.purchaseCount || 0,
        canPurchase: item.maxPurchases === -1 || 
          (purchaseMap[item._id.toString()]?.purchaseCount || 0) < item.maxPurchases
      }));
    
    // Group by category
    const byCategory = {
      powerup: shopItems.filter(i => i.category === 'powerup'),
      cosmetic: shopItems.filter(i => i.category === 'cosmetic'),
      bundle: shopItems.filter(i => i.category === 'bundle'),
      premium: shopItems.filter(i => i.category === 'premium')
    };
    
    res.json({
      success: true,
      data: {
        items: shopItems,
        byCategory,
        userBalance: {
          gems: user.gamification.gems,
          coins: 0 // Add if you have coins
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/rewards/shop/:itemId/buy
 * Purchase a shop item
 */
router.post('/shop/:itemId/buy', async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const userId = req.userId;
    
    const item = await ShopItem.findOne({ itemId });
    if (!item) {
      throw new AppError('Item not found', 404);
    }
    
    if (!item.isActive) {
      throw new AppError('Item not available', 400);
    }
    
    const user = await User.findById(userId);
    
    // Check premium requirement
    if (item.isPremiumOnly && !user.isPremium()) {
      throw new AppError('Premium subscription required', 403);
    }
    
    // Check purchase limit
    let purchase = await UserPurchase.findOne({ user: userId, item: item._id });
    if (item.maxPurchases !== -1 && purchase && purchase.purchaseCount >= item.maxPurchases) {
      throw new AppError('Purchase limit reached', 400);
    }
    
    // Check balance
    if (item.price.gems && user.gamification.gems < item.price.gems) {
      throw new AppError('Not enough gems', 400);
    }
    
    // Deduct currency
    if (item.price.gems) {
      user.gamification.gems -= item.price.gems;
    }
    
    // Apply effect
    let effectApplied = null;
    
    switch (item.effect.type) {
      case 'streak_freeze':
        user.gamification.streakFreezes.available += item.effect.value;
        // Also update Streak model
        let streak = await Streak.findOne({ user: userId });
        if (streak) {
          await streak.addFreezes(item.effect.value);
        }
        effectApplied = { streakFreezes: user.gamification.streakFreezes.available };
        break;
        
      case 'heart_refill':
        user.gamification.hearts.current = user.gamification.hearts.max;
        user.gamification.hearts.lastRefill = new Date();
        effectApplied = { hearts: user.gamification.hearts };
        break;
        
      case 'xp_boost':
        // Store boost in Redis with expiry
        const boostKey = `xp_boost:${userId}`;
        await RedisService.set(boostKey, {
          multiplier: item.effect.value,
          expiresAt: Date.now() + (item.effect.duration * 1000)
        }, item.effect.duration);
        effectApplied = { 
          xpBoost: item.effect.value, 
          duration: item.effect.duration,
          expiresAt: new Date(Date.now() + item.effect.duration * 1000)
        };
        break;
        
      case 'hint':
        // Add hints to user (you'd need to add this field to User model)
        effectApplied = { hints: item.effect.value };
        break;
        
      case 'avatar':
        user.avatar = item.itemId;
        effectApplied = { avatar: user.avatar };
        break;
        
      case 'theme':
        user.avatarCustomization.background = item.itemId;
        effectApplied = { background: user.avatarCustomization.background };
        break;
    }
    
    await user.save();
    
    // Update purchase record
    if (purchase) {
      purchase.purchaseCount += 1;
      purchase.lastPurchasedAt = new Date();
      await purchase.save();
    } else {
      await UserPurchase.create({
        user: userId,
        item: item._id,
        purchaseCount: 1
      });
    }
    
    res.json({
      success: true,
      message: 'Purchase successful',
      data: {
        item: {
          itemId: item.itemId,
          name: item.name,
          icon: item.icon
        },
        effect: effectApplied,
        newBalance: {
          gems: user.gamification.gems
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/rewards/daily
 * Get daily reward status
 */
router.get('/daily', async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    // Check if already claimed today
    const today = new Date().toDateString();
    const lastClaim = user.gamification.lastDailyReward;
    const canClaim = !lastClaim || new Date(lastClaim).toDateString() !== today;
    
    // Calculate streak bonus
    const streak = user.gamification.currentStreak || 0;
    const baseReward = 10;
    const streakBonus = Math.min(streak, 7) * 2; // Max 14 bonus
    const totalReward = baseReward + streakBonus;
    
    // Daily rewards calendar (7 days)
    const dailyRewards = [
      { day: 1, gems: 10, claimed: streak >= 1 },
      { day: 2, gems: 15, claimed: streak >= 2 },
      { day: 3, gems: 20, claimed: streak >= 3 },
      { day: 4, gems: 25, claimed: streak >= 4 },
      { day: 5, gems: 35, claimed: streak >= 5 },
      { day: 6, gems: 50, claimed: streak >= 6 },
      { day: 7, gems: 100, bonus: 'streak_freeze', claimed: streak >= 7 }
    ];
    
    const currentDay = Math.min((streak % 7) + 1, 7);
    
    res.json({
      success: true,
      data: {
        canClaim,
        todayReward: {
          gems: totalReward,
          bonus: streak >= 7 ? 'streak_freeze' : null
        },
        streak,
        dailyRewards,
        currentDay
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/rewards/daily/claim
 * Claim daily reward
 */
router.post('/daily/claim', async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    // Check if already claimed today
    const today = new Date().toDateString();
    const lastClaim = user.gamification.lastDailyReward;
    
    if (lastClaim && new Date(lastClaim).toDateString() === today) {
      throw new AppError('Daily reward already claimed', 400);
    }
    
    // Calculate reward
    const streak = user.gamification.currentStreak || 0;
    const baseReward = 10;
    const streakBonus = Math.min(streak, 7) * 2;
    const gemsReward = baseReward + streakBonus;
    
    // Apply reward
    user.gamification.gems += gemsReward;
    user.gamification.lastDailyReward = new Date();
    
    // Bonus streak freeze on day 7
    let bonusApplied = null;
    if (streak > 0 && streak % 7 === 0) {
      user.gamification.streakFreezes.available += 1;
      bonusApplied = 'streak_freeze';
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Daily reward claimed!',
      data: {
        reward: {
          gems: gemsReward,
          bonus: bonusApplied
        },
        newBalance: {
          gems: user.gamification.gems,
          streakFreezes: user.gamification.streakFreezes.available
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/rewards/achievements
 * Get all achievements with user progress
 */
router.get('/achievements', async (req, res, next) => {
  try {
    const Achievement = require('../models/Achievement');
    const user = req.user;
    
    const achievements = await Achievement.find({ isActive: true }).sort({ category: 1 });
    
    const userAchievements = user.achievements.map(a => a.achievementId?.toString());
    
    const data = achievements.map(a => ({
      _id: a._id,
      achievementId: a.achievementId,
      name: a.name,
      nameAr: a.nameAr,
      description: a.description,
      descriptionAr: a.descriptionAr,
      icon: a.icon,
      color: a.color,
      rarity: a.rarity,
      category: a.category,
      xpReward: a.xpReward,
      gemsReward: a.gemsReward,
      isSecret: a.isSecret,
      unlocked: userAchievements.includes(a._id.toString()),
      unlockedAt: user.achievements.find(ua => ua.achievementId?.toString() === a._id.toString())?.unlockedAt
    }));
    
    // Group by category
    const byCategory = {};
    data.forEach(a => {
      if (!byCategory[a.category]) byCategory[a.category] = [];
      byCategory[a.category].push(a);
    });
    
    res.json({
      success: true,
      data: {
        achievements: data,
        byCategory,
        stats: {
          total: data.length,
          unlocked: data.filter(a => a.unlocked).length,
          percentage: Math.round((data.filter(a => a.unlocked).length / data.length) * 100)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;