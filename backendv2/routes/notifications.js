/**
 * Notifications Routes - Salifz
 */

const express = require('express');
const Notification = require('../models/Notification');
const { isExpoToken } = require('../services/pushService');

const router = express.Router();

/**
 * POST /api/v1/notifications/register-device
 * Enregistre le jeton push de l'appareil courant.
 *
 * Sans cette route, `devices[].pushToken` restait toujours vide et aucune
 * notification distante ne pouvait être envoyée — la fonctionnalité 39 était
 * annoncée mais n'existait ni côté mobile ni côté serveur.
 */
router.post('/register-device', async (req, res, next) => {
  try {
    const { token, platform, deviceId } = req.body;

    if (!isExpoToken(token)) {
      return res.status(400).json({ success: false, error: 'Jeton push invalide' });
    }

    const user = req.user;
    user.devices = user.devices || [];

    const existing = user.devices.find((d) => d.pushToken === token);

    if (existing) {
      existing.lastActive = new Date();
    } else {
      user.devices.push({
        deviceId: deviceId || token.slice(-12),
        deviceType: platform === 'ios' ? 'ios' : 'android',
        pushToken: token,
        lastActive: new Date(),
      });
    }

    // Un même appareil réinstallé change de jeton : on borne la liste pour
    // éviter qu'elle ne grossisse indéfiniment.
    if (user.devices.length > 10) {
      user.devices = user.devices
        .sort((a, b) => new Date(b.lastActive || 0) - new Date(a.lastActive || 0))
        .slice(0, 10);
    }

    await user.save();
    res.json({ success: true, message: 'Appareil enregistré' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/notifications/unregister-device
 * Retire le jeton push — à la déconnexion.
 */
router.post('/unregister-device', async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = req.user;

    user.devices = (user.devices || []).filter((d) =>
      token ? d.pushToken !== token : false
    );

    await user.save();
    res.json({ success: true, message: 'Appareil retiré' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/notifications
 * Get user notifications
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments({ user: userId }),
      Notification.countDocuments({ user: userId, isRead: false })
    ]);
    
    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: { notification }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req, res, next) => {
  try {
    const userId = req.userId;
    
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    await Notification.findOneAndDelete({ _id: id, user: userId });
    
    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/notifications
 * Delete all notifications
 */
router.delete('/', async (req, res, next) => {
  try {
    const userId = req.userId;
    
    await Notification.deleteMany({ user: userId });
    
    res.json({
      success: true,
      message: 'All notifications deleted'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Get unread count
 */
router.get('/unread-count', async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const unreadCount = await Notification.countDocuments({
      user: userId,
      isRead: false
    });
    
    res.json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;