/**
 * Notifications Routes - Salifz
 */

const express = require('express');
const Notification = require('../models/Notification');

const router = express.Router();

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