/**
 * League Routes - Salifz
 * Competitive leagues and leaderboards
 */

const express = require('express');
const User = require('../models/User');
const RedisService = require('../services/redis');

const router = express.Router();

const LEAGUES = {
  bronze: { name: 'Bronze', nameAr: 'البرونزية', icon: '🥉', minXP: 0, promotionTop: 10, demotionBottom: 0 },
  silver: { name: 'Silver', nameAr: 'الفضية', icon: '🥈', minXP: 500, promotionTop: 10, demotionBottom: 5 },
  gold: { name: 'Gold', nameAr: 'الذهبية', icon: '🥇', minXP: 2000, promotionTop: 10, demotionBottom: 5 },
  diamond: { name: 'Diamond', nameAr: 'الماسية', icon: '💎', minXP: 5000, promotionTop: 5, demotionBottom: 5 },
  hafiz: { name: 'Hafiz', nameAr: 'الحفاظ', icon: '👑', minXP: 15000, promotionTop: 0, demotionBottom: 10 }
};

/**
 * GET /api/v1/leagues/current
 * Get user's current league info
 */
router.get('/current', async (req, res, next) => {
  try {
    const user = req.user;
    const leagueKey = `leaderboard:league:${user.gamification.league}:weekly`;
    
    // Get user's rank in league
    const userRank = await RedisService.getUserRank(leagueKey, user._id);
    const leagueSize = await RedisService.getLeaderboardSize(leagueKey);
    
    const leagueInfo = LEAGUES[user.gamification.league];
    
    res.json({
      success: true,
      data: {
        league: {
          id: user.gamification.league,
          ...leagueInfo
        },
        rank: userRank?.rank || 0,
        weeklyXP: user.gamification.weeklyXP,
        totalParticipants: leagueSize,
        inPromotionZone: userRank?.rank <= leagueInfo.promotionTop,
        inDemotionZone: leagueSize > 0 && userRank?.rank > (leagueSize - leagueInfo.demotionBottom),
        daysUntilReset: getDaysUntilSunday()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/leagues/leaderboard
 * Get league leaderboard
 */
router.get('/leaderboard', async (req, res, next) => {
  try {
    const user = req.user;
    const { league = user.gamification.league, limit = 30 } = req.query;
    
    const leagueKey = `leaderboard:league:${league}:weekly`;
    
    // Get leaderboard from Redis
    let leaderboard = await RedisService.getLeaderboard(leagueKey, 0, limit - 1);
    
    // If Redis is empty, fall back to MongoDB
    if (leaderboard.length === 0) {
      const users = await User.getLeagueLeaderboard(league, limit);
      leaderboard = users.map((u, i) => ({
        rank: i + 1,
        userId: u._id.toString(),
        score: u.gamification.weeklyXP
      }));
    }
    
    // Enrich with user data
    const userIds = leaderboard.map(l => l.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('username displayName avatar gamification.level gamification.currentStreak');
    
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });
    
    const enrichedLeaderboard = leaderboard.map(entry => {
      const userData = userMap[entry.userId];
      return {
        rank: entry.rank,
        userId: entry.userId,
        username: userData?.username || 'Unknown',
        displayName: userData?.displayName || userData?.username || 'Unknown',
        avatar: userData?.avatar || 'default_avatar_1',
        level: userData?.gamification?.level || 1,
        streak: userData?.gamification?.currentStreak || 0,
        weeklyXP: entry.score,
        isCurrentUser: entry.userId === user._id.toString()
      };
    });
    
    // Get current user's position if not in top
    let currentUserEntry = enrichedLeaderboard.find(e => e.isCurrentUser);
    if (!currentUserEntry) {
      const userRank = await RedisService.getUserRank(leagueKey, user._id);
      if (userRank) {
        currentUserEntry = {
          rank: userRank.rank,
          userId: user._id.toString(),
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          level: user.gamification.level,
          streak: user.gamification.currentStreak,
          weeklyXP: userRank.score,
          isCurrentUser: true
        };
      }
    }
    
    const leagueInfo = LEAGUES[league];
    
    res.json({
      success: true,
      data: {
        league: {
          id: league,
          ...leagueInfo
        },
        leaderboard: enrichedLeaderboard,
        currentUser: currentUserEntry,
        promotionZone: leagueInfo.promotionTop,
        demotionZone: leagueInfo.demotionBottom,
        totalParticipants: await RedisService.getLeaderboardSize(leagueKey),
        daysUntilReset: getDaysUntilSunday()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/leagues/global
 * Get global leaderboard
 */
router.get('/global', async (req, res, next) => {
  try {
    const { limit = 100 } = req.query;
    const user = req.user;
    
    const globalKey = 'leaderboard:global:weekly';
    let leaderboard = await RedisService.getLeaderboard(globalKey, 0, limit - 1);
    
    // Enrich with user data
    const userIds = leaderboard.map(l => l.userId);
    const users = await User.find({ _id: { $in: userIds } })
      .select('username displayName avatar gamification.level gamification.league gamification.currentStreak');
    
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });
    
    const enrichedLeaderboard = leaderboard.map(entry => {
      const userData = userMap[entry.userId];
      return {
        rank: entry.rank,
        userId: entry.userId,
        username: userData?.username || 'Unknown',
        displayName: userData?.displayName || 'Unknown',
        avatar: userData?.avatar || 'default_avatar_1',
        level: userData?.gamification?.level || 1,
        league: userData?.gamification?.league || 'bronze',
        streak: userData?.gamification?.currentStreak || 0,
        weeklyXP: entry.score,
        isCurrentUser: entry.userId === user._id.toString()
      };
    });
    
    // Get current user's global rank
    const userGlobalRank = await RedisService.getUserRank(globalKey, user._id);
    
    res.json({
      success: true,
      data: {
        leaderboard: enrichedLeaderboard,
        currentUser: {
          rank: userGlobalRank?.rank || 0,
          weeklyXP: userGlobalRank?.score || 0
        },
        totalParticipants: await RedisService.getLeaderboardSize(globalKey)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/leagues/friends
 * Get friends leaderboard
 */
router.get('/friends', async (req, res, next) => {
  try {
    const user = req.user;
    
    // Get friends
    const friendIds = [...user.social.friends, user._id];
    
    const friends = await User.find({ _id: { $in: friendIds } })
      .select('username displayName avatar gamification.weeklyXP gamification.level gamification.currentStreak')
      .sort({ 'gamification.weeklyXP': -1 });
    
    const leaderboard = friends.map((friend, index) => ({
      rank: index + 1,
      userId: friend._id,
      username: friend.username,
      displayName: friend.displayName,
      avatar: friend.avatar,
      level: friend.gamification.level,
      streak: friend.gamification.currentStreak,
      weeklyXP: friend.gamification.weeklyXP,
      isCurrentUser: friend._id.toString() === user._id.toString()
    }));
    
    res.json({
      success: true,
      data: {
        leaderboard,
        totalFriends: user.social.friends.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/leagues/all
 * Get all leagues info
 */
router.get('/all', async (req, res, next) => {
  try {
    const leagues = Object.entries(LEAGUES).map(([id, info]) => ({
      id,
      ...info
    }));
    
    res.json({
      success: true,
      data: { leagues }
    });
  } catch (error) {
    next(error);
  }
});

// Helper function
function getDaysUntilSunday() {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  return daysUntilSunday;
}

module.exports = router;
