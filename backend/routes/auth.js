/**
 * Auth Routes - Salifz
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

const generateToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
const generateRefreshToken = (userId) => jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '30d' });

const generateDailyQuests = () => [
  { questId: 'daily_memorize', type: 'memorize', description: { ar: 'احفظ 5 آيات', en: 'Memorize 5 verses', fr: 'Mémorisez 5 versets' }, target: 5, current: 0, xpReward: 50, completed: false },
  { questId: 'daily_review', type: 'review', description: { ar: 'راجع 10 آيات', en: 'Review 10 verses', fr: 'Révisez 10 versets' }, target: 10, current: 0, xpReward: 30, completed: false },
  { questId: 'daily_lesson', type: 'streak', description: { ar: 'أكمل درساً', en: 'Complete a lesson', fr: 'Terminez une leçon' }, target: 1, current: 0, xpReward: 20, completed: false }
];

// Register
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('username').isLength({ min: 3, max: 20 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
    }

    const { email, password, username, displayName, language } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    
    if (existing) {
      return res.status(400).json({ success: false, error: existing.email === email ? 'Email already registered' : 'Username taken' });
    }

    const user = new User({
      email, password, username,
      displayName: displayName || username,
      profile: { language: language || 'ar' },
      dailyQuests: { date: new Date(), quests: generateDailyQuests() }
    });

    await user.save();
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: { id: user._id, email: user.email, username: user.username, displayName: user.displayName, gamification: user.gamification },
        token, refreshToken
      }
    });
  } catch (error) { next(error); }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;
    const user = await User.findByCredentials(emailOrUsername);
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Account deactivated' });
    }

    user.lastLogin = new Date();
    user.loginCount += 1;
    await user.save();

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id, email: user.email, username: user.username, displayName: user.displayName,
          avatar: user.avatar, profile: user.profile, gamification: user.gamification,
          quranProgress: user.quranProgress, subscription: user.subscription, dailyQuests: user.dailyQuests
        },
        token, refreshToken
      }
    });
  } catch (error) { next(error); }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, error: 'Refresh token required' });
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    
    const user = await User.findById(decoded.userId);
    if (!user?.isActive) return res.status(401).json({ success: false, error: 'User not found' });

    res.json({ success: true, data: { token: generateToken(user._id), refreshToken: generateRefreshToken(user._id) } });
  } catch (error) { next(error); }
});

// Forgot password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (user) {
      const resetToken = jwt.sign({ userId: user._id, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000;
      await user.save();
      // TODO: Send email
    }
    
    res.json({ success: true, message: 'If email exists, reset instructions will be sent' });
  } catch (error) { next(error); }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'reset') return res.status(400).json({ success: false, error: 'Invalid reset token' });
    
    const user = await User.findOne({ _id: decoded.userId, resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired token' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) { next(error); }
});

module.exports = router;
