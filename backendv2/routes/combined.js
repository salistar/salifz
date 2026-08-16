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

const billing = require('../services/billing');

// Catalogue servi depuis le serveur : les prix ne sont plus dupliqués ici et
// dans l'écran mobile (voir la section « valeurs en dur » de l'audit).
subscriptionsRouter.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: {
      plans: Object.values(billing.PLANS),
      currentPlan: req.user.subscription,
      billingConfigured: billing.isConfigured(),
    },
  });
});

subscriptionsRouter.get('/status', (req, res) => {
  res.json({
    success: true,
    data: { subscription: req.user.subscription, isPremium: req.user.isPremium() },
  });
});

/**
 * Synchronise l'abonnement avec le fournisseur de paiement.
 *
 * S1 : cette route s'appelait `/subscribe` et accordait l'offre demandée par
 * le client sans le moindre paiement. Elle ne prend plus aucun `planId` : le
 * serveur va lire les droits réellement achetés chez RevenueCat, qui a lui-même
 * validé le reçu auprès de l'App Store ou de Google Play.
 */
subscriptionsRouter.post('/sync', async (req, res, next) => {
  try {
    const subscription = await billing.syncSubscription(req.user);
    res.json({
      success: true,
      message: 'Abonnement synchronisé',
      data: { subscription },
    });
  } catch (error) {
    if (error instanceof billing.BillingError) {
      return res.status(error.status).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }
    next(error);
  }
});

// Ancienne route conservée pour ne pas casser les clients déjà installés :
// elle refuse désormais explicitement au lieu d'accorder l'abonnement.
subscriptionsRouter.post('/subscribe', (req, res) => {
  res.status(410).json({
    success: false,
    error:
      "L'achat se fait dans l'application via l'App Store ou Google Play, " +
      'puis POST /subscriptions/sync pour confirmer.',
    code: 'USE_STORE_PURCHASE',
  });
});

/**
 * La résiliation se fait chez Apple ou Google. Le serveur ne fait que relire
 * l'état réel : il ne peut ni accorder ni retirer un abonnement de lui-même.
 */
subscriptionsRouter.post('/cancel', async (req, res, next) => {
  try {
    const subscription = await billing.syncSubscription(req.user);
    res.json({
      success: true,
      message:
        'La résiliation se gère depuis les abonnements de votre compte App Store ou Google Play.',
      data: { subscription },
    });
  } catch (error) {
    if (error instanceof billing.BillingError) {
      return res.status(error.status).json({ success: false, error: error.message, code: error.code });
    }
    next(error);
  }
});

module.exports = { achievementsRouter, socialRouter, subscriptionsRouter };
