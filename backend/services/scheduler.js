/**
 * Scheduler Service - Salifz
 * Handles cron jobs for daily/weekly resets
 */

const User = require('../models/User');
const RedisService = require('./redis');

const LEAGUES = ['bronze', 'silver', 'gold', 'diamond', 'hafiz'];

async function resetDailyQuests() {
  try {
    console.log('🔄 Resetting daily quests for all users...');
    // Reset daily XP and quests handled on user login/first activity
    await User.updateMany({}, { 'gamification.dailyXP': 0 });
    console.log('✅ Daily quests reset complete');
  } catch (error) {
    console.error('❌ Error resetting daily quests:', error);
  }
}

async function processLeaguePromotions() {
  try {
    console.log('🏆 Processing weekly league promotions/demotions...');

    for (let i = 0; i < LEAGUES.length; i++) {
      const league = LEAGUES[i];
      const leagueKey = `leaderboard:league:${league}:weekly`;
      
      // Get top performers for promotion
      const topPerformers = await RedisService.getLeaderboard(leagueKey, 0, 9);
      
      // Get bottom performers for demotion
      const leagueSize = await RedisService.getLeaderboardSize(leagueKey);
      const bottomPerformers = leagueSize > 10 
        ? await RedisService.getLeaderboard(leagueKey, leagueSize - 5, leagueSize - 1)
        : [];

      // Promote top performers (except in highest league)
      if (league !== 'hafiz' && topPerformers.length > 0) {
        const nextLeague = LEAGUES[i + 1];
        const userIds = topPerformers.map(p => p.userId);
        await User.updateMany(
          { _id: { $in: userIds } },
          { 'gamification.league': nextLeague, 'gamification.promotionZone': false }
        );
        console.log(`⬆️ Promoted ${userIds.length} users from ${league} to ${nextLeague}`);
      }

      // Demote bottom performers (except in lowest league)
      if (league !== 'bronze' && bottomPerformers.length > 0) {
        const prevLeague = LEAGUES[i - 1];
        const userIds = bottomPerformers.map(p => p.userId);
        await User.updateMany(
          { _id: { $in: userIds } },
          { 'gamification.league': prevLeague, 'gamification.demotionZone': false }
        );
        console.log(`⬇️ Demoted ${userIds.length} users from ${league} to ${prevLeague}`);
      }
    }

    // Reset weekly XP for all users
    await User.updateMany({}, { 'gamification.weeklyXP': 0, 'gamification.streakFreezes.usedThisWeek': 0 });

    // Clear weekly leaderboards in Redis
    await RedisService.resetWeeklyLeaderboards();

    console.log('✅ League promotions complete');
  } catch (error) {
    console.error('❌ Error processing league promotions:', error);
  }
}

async function checkBrokenStreaks() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find users who had activity before yesterday but not yesterday
    const usersToBreakStreak = await User.find({
      'gamification.currentStreak': { $gt: 0 },
      'gamification.lastActivityDate': { $lt: yesterday }
    });

    for (const user of usersToBreakStreak) {
      // Check if they have a freeze available
      if (user.gamification.streakFreezes.available > 0) {
        user.gamification.streakFreezes.available -= 1;
        user.gamification.streakFreezes.usedThisWeek += 1;
        console.log(`🧊 Used streak freeze for user ${user.username}`);
      } else {
        user.gamification.currentStreak = 0;
        console.log(`💔 Broke streak for user ${user.username}`);
      }
      await user.save();
    }

    console.log(`✅ Checked streaks for ${usersToBreakStreak.length} users`);
  } catch (error) {
    console.error('❌ Error checking broken streaks:', error);
  }
}

module.exports = {
  resetDailyQuests,
  processLeaguePromotions,
  checkBrokenStreaks
};
