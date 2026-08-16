/**
 * Chat Controller - Salifz
 * ✅ COMPLETE: Conversations and messages
 */

const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Get user's conversations
 */
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'No token'
      });
    }
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: { $ne: false }
    })
    .populate('participants', 'username displayName avatar')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });
    
    // Format conversations
    const formatted = conversations.map(conv => {
      const otherParticipants = conv.participants.filter(
        p => p._id.toString() !== userId.toString()
      );
      
      return {
        _id: conv._id,
        type: conv.type || 'private',
        name: conv.name || otherParticipants[0]?.displayName || otherParticipants[0]?.username,
        participants: otherParticipants,
        lastMessage: conv.lastMessage,
        lastMessageText: conv.lastMessage?.content || '',
        lastMessageAt: conv.lastMessage?.createdAt || conv.updatedAt,
        unreadCount: conv.unreadCount?.get(userId.toString()) || 0,
        updatedAt: conv.updatedAt
      };
    });
    
    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.json({ success: true, data: [] });
  }
};

/**
 * Get single conversation
 */
exports.getConversation = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId
    })
    .populate('participants', 'username displayName avatar')
    .populate('lastMessage');
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get messages for a conversation
 */
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { page = 1, limit = 50 } = req.query;
    
    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    const messages = await Message.find({
      conversation: req.params.id
    })
    .populate('sender', 'username displayName avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
    
    // Mark as read
    if (conversation.unreadCount) {
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }
    
    res.json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Send message
 */
exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { content, type = 'text' } = req.body;
    
    if (!content?.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message content is required'
      });
    }
    
    // Verify user is participant
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    // Create message
    const message = await Message.create({
      conversation: req.params.id,
      sender: userId,
      content: content.trim(),
      type
    });
    
    // Update conversation
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();
    
    // Increment unread count for other participants
    conversation.participants.forEach(p => {
      if (p.toString() !== userId.toString()) {
        const current = conversation.unreadCount?.get(p.toString()) || 0;
        if (!conversation.unreadCount) conversation.unreadCount = new Map();
        conversation.unreadCount.set(p.toString(), current + 1);
      }
    });
    
    await conversation.save();
    
    // Populate sender
    await message.populate('sender', 'username displayName avatar');
    
    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create conversation
 */
exports.createConversation = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { recipientId, participantIds, name, type = 'private' } = req.body;
    
    let participants = [userId];
    
    if (type === 'group' && participantIds?.length) {
      participants = [...participants, ...participantIds];
    } else if (recipientId) {
      // Check if conversation already exists
      const existing = await Conversation.findOne({
        type: 'private',
        participants: { $all: [userId, recipientId], $size: 2 }
      });
      
      if (existing) {
        return res.json({ success: true, data: existing });
      }
      
      participants.push(recipientId);
    }
    
    const conversation = await Conversation.create({
      type,
      name: type === 'group' ? name : undefined,
      participants,
      creator: userId,
      unreadCount: new Map()
    });
    
    await conversation.populate('participants', 'username displayName avatar');
    
    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Mark conversation as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    if (conversation.unreadCount) {
      conversation.unreadCount.set(userId.toString(), 0);
      await conversation.save();
    }
    
    res.json({
      success: true,
      message: 'Marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete message
 */
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const message = await Message.findOne({
      _id: req.params.messageId,
      sender: userId
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found or not authorized'
      });
    }
    
    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();
    
    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Add reaction to message
 */
exports.addReaction = async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { emoji } = req.body;
    
    const message = await Message.findById(req.params.messageId);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    if (!message.reactions) {
      message.reactions = [];
    }
    
    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      r => r.user?.toString() !== userId.toString()
    );
    
    // Add new reaction
    if (emoji) {
      message.reactions.push({
        user: userId,
        emoji,
        createdAt: new Date()
      });
    }
    
    await message.save();
    
    res.json({
      success: true,
      data: message
    });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};