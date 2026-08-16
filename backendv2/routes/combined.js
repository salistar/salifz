/**
 * Achievements Routes - Salifz
 */
const express = require('express');
const Achievement = require('../models/Achievement');
const achievementsRouter = express.Router();

achievementsRouter.get('/', async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ isActive: true }).sort({ category: 1 });
    const userAchievements = req.user.achievements.map(a => a.achievementId?.toString());
    const data = achievements.map(a => ({
      ...a.toObject(),
      unlocked: userAchievements.includes(a._id.toString()),
      unlockedAt: req.user.achievements.find(ua => ua.achievementId?.toString() === a._id.toString())?.unlockedAt
    }));
    res.json({ success: true, data: { achievements: data } });
  } catch (error) { next(error); }
});

achievementsRouter.get('/unlocked', async (req, res, next) => {
  try {
    const achievementIds = req.user.achievements.map(a => a.achievementId);
    const achievements = await Achievement.find({ _id: { $in: achievementIds } });
    res.json({ success: true, data: { achievements, total: achievements.length } });
  } catch (error) { next(error); }
});

/**
 * Social Routes - Salifz
 */
const User = require('../models/User');
const socialRouter = express.Router();

socialRouter.get('/friends', async (req, res, next) => {
  try {
    const friends = await User.find({ _id: { $in: req.user.social.friends } })
      .select('username displayName avatar gamification.level gamification.currentStreak gamification.weeklyXP');
    res.json({ success: true, data: { friends } });
  } catch (error) { next(error); }
});

socialRouter.post('/friends/request/:userId', async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });
    if (req.user.social.friends.includes(targetUser._id)) return res.status(400).json({ success: false, error: 'Already friends' });
    
    req.user.social.friendRequests.sent.push(targetUser._id);
    targetUser.social.friendRequests.received.push(req.userId);
    await req.user.save();
    await targetUser.save();
    res.json({ success: true, message: 'Friend request sent' });
  } catch (error) { next(error); }
});

socialRouter.post('/friends/accept/:userId', async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (!targetUser) return res.status(404).json({ success: false, error: 'User not found' });
    
    req.user.social.friendRequests.received = req.user.social.friendRequests.received.filter(id => id.toString() !== req.params.userId);
    targetUser.social.friendRequests.sent = targetUser.social.friendRequests.sent.filter(id => id.toString() !== req.userId.toString());
    req.user.social.friends.push(targetUser._id);
    targetUser.social.friends.push(req.userId);
    await req.user.save();
    await targetUser.save();
    res.json({ success: true, message: 'Friend added' });
  } catch (error) { next(error); }
});

socialRouter.delete('/friends/:userId', async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.userId);
    if (targetUser) {
      targetUser.social.friends = targetUser.social.friends.filter(id => id.toString() !== req.userId.toString());
      await targetUser.save();
    }
    req.user.social.friends = req.user.social.friends.filter(id => id.toString() !== req.params.userId);
    await req.user.save();
    res.json({ success: true, message: 'Friend removed' });
  } catch (error) { next(error); }
});

socialRouter.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ success: false, error: 'Query too short' });
    const users = await User.find({
      $or: [{ username: new RegExp(q, 'i') }, { displayName: new RegExp(q, 'i') }],
      _id: { $ne: req.userId }, isActive: true
    }).select('username displayName avatar gamification.level').limit(20);
    res.json({ success: true, data: { users } });
  } catch (error) { next(error); }
});

/**
 * Subscriptions Routes - Salifz
 */
const subscriptionsRouter = express.Router();

subscriptionsRouter.get('/plans', (req, res) => {
  const plans = [
    { id: 'free', name: 'Free', price: 0, features: ['1 lesson/day', 'Basic streaks', 'Ads'] },
    { id: 'salifz_plus', name: 'Salifz+', priceMonthly: 7.99, priceYearly: 59.99, features: ['Unlimited lessons', 'AI Tajwid', 'No ads', 'Offline mode'] },
    { id: 'salifz_family', name: 'Salifz Family', priceMonthly: 14.99, priceYearly: 99.99, features: ['6 accounts', 'Parental controls', 'All Salifz+ features'] },
    { id: 'lifetime', name: 'Lifetime', priceOnce: 149.99, features: ['Forever access', 'All features', 'Early access'] }
  ];
  res.json({ success: true, data: { plans, currentPlan: req.user.subscription } });
});

subscriptionsRouter.get('/status', (req, res) => {
  res.json({ success: true, data: { subscription: req.user.subscription, isPremium: req.user.isPremium() } });
});

subscriptionsRouter.post('/subscribe', async (req, res, next) => {
  try {
    const { planId } = req.body;
    // In production, integrate with Stripe/RevenueCat
    req.user.subscription = { plan: planId, status: 'active', startDate: new Date() };
    await req.user.save();
    res.json({ success: true, message: 'Subscription activated', data: { subscription: req.user.subscription } });
  } catch (error) { next(error); }
});

subscriptionsRouter.post('/cancel', async (req, res, next) => {
  try {
    req.user.subscription.status = 'canceled';
    await req.user.save();
    res.json({ success: true, message: 'Subscription canceled' });
  } catch (error) { next(error); }
});

module.exports = { achievementsRouter, socialRouter, subscriptionsRouter };
