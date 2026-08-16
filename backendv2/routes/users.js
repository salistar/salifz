/**
 * Users Routes - Salifz
 */
const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.get('/me', (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

router.put('/me', async (req, res, next) => {
  try {
    const allowedUpdates = ['displayName', 'avatar', 'avatarCustomization', 'profile'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'profile') {
          req.user.profile = { ...req.user.profile.toObject(), ...req.body.profile };
        } else {
          req.user[field] = req.body[field];
        }
      }
    });
    await req.user.save();
    res.json({ success: true, data: { user: req.user } });
  } catch (error) { next(error); }
});

router.get('/:userId', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: { user: user.getPublicProfile() } });
  } catch (error) { next(error); }
});

router.delete('/me', async (req, res, next) => {
  try {
    req.user.isActive = false;
    await req.user.save();
    res.json({ success: true, message: 'Account deactivated' });
  } catch (error) { next(error); }
});

module.exports = router;
