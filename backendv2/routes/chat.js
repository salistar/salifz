/**
 * Chat Routes - Salifz Backend
 * ✅ FIXED: Remove duplicate auth middleware, use _id
 */

const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

// ✅ NOTE: auth middleware is already applied in routes/index.js
// So we don't need to apply it again here

// ============================================
// CONVERSATIONS
// ============================================

// Get all conversations for current user
router.get('/conversations', async (req, res) => {
  try {
    // ✅ FIXED: Use _id instead of id
    const userId = req.user?._id || req.userId;
    
    if (!userId) {
      console.log('[CHAT] No user ID found in request');
      return res.status(401).json({ success: false, error: 'No token' });
    }
    
    console.log('[CHAT] Getting conversations for user:', userId);
    
    const { page = 1, limit = 20 } = req.query;
    
    const conversations = await Conversation.find({
      participants: userId,
      isActive: { $ne: false }
    })
    .populate('participants', 'username avatar displayName')
    .populate('lastMessage')
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
    
    // Ajouter le compteur de non-lus pour chaque conversation
    const conversationsWithUnread = conversations.map(conv => {
      let unreadCount = 0;
      
      // Handle different unreadCount formats
      if (conv.unreadCount) {
        if (typeof conv.unreadCount.get === 'function') {
          // It's a Map
          unreadCount = conv.unreadCount.get(userId.toString()) || 0;
        } else if (Array.isArray(conv.unreadCount)) {
          // It's an Array
          const unread = conv.unreadCount.find(
            u => u.user?.toString() === userId.toString()
          );
          unreadCount = unread?.count || 0;
        } else if (typeof conv.unreadCount === 'object') {
          // It's a plain object
          unreadCount = conv.unreadCount[userId.toString()] || 0;
        }
      }
      
      // Get other participants for display name
      const otherParticipants = (conv.participants || []).filter(
        p => p._id?.toString() !== userId.toString()
      );
      
      return {
        ...conv.toObject(),
        unreadCount,
        name: conv.name || otherParticipants[0]?.displayName || otherParticipants[0]?.username || 'Chat',
        lastMessageText: conv.lastMessage?.content || conv.lastMessageText || ''
      };
    });
    
    console.log('[CHAT] Found', conversationsWithUnread.length, 'conversations');
    
    res.json({ 
      success: true, 
      data: conversationsWithUnread 
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.json({ success: true, data: [] });
  }
});

// Get single conversation
router.get('/conversations/:id', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId
    })
    .populate('participants', 'username avatar displayName')
    .populate('lastMessage');
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation non trouvée' 
      });
    }
    
    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create or get conversation with user
router.post('/conversations', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { recipientId, type = 'direct', name, participants: groupParticipants } = req.body;
    
    if (type === 'direct') {
      if (!recipientId) {
        return res.status(400).json({ 
          success: false, 
          error: 'recipientId requis' 
        });
      }
      
      // Vérifier si une conversation existe déjà
      let conversation = await Conversation.findOne({
        participants: { $all: [userId, recipientId], $size: 2 },
        type: 'direct'
      }).populate('participants', 'username avatar displayName');
      
      if (conversation) {
        return res.json({ success: true, data: conversation });
      }
      
      // Créer nouvelle conversation
      conversation = await Conversation.create({
        participants: [userId, recipientId],
        type: 'direct',
        createdBy: userId
      });
      
      await conversation.populate('participants', 'username avatar displayName');
      
      res.status(201).json({ success: true, data: conversation });
      
    } else if (type === 'group') {
      if (!name) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nom du groupe requis' 
        });
      }
      
      const allParticipants = [userId, ...(groupParticipants || [])];
      
      const conversation = await Conversation.create({
        participants: allParticipants,
        type: 'group',
        name,
        admins: [userId],
        createdBy: userId
      });
      
      await conversation.populate('participants', 'username avatar displayName');
      
      res.status(201).json({ success: true, data: conversation });
    } else {
      res.status(400).json({ success: false, error: 'Invalid type' });
    }
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// MESSAGES
// ============================================

// Get messages for a conversation
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { page = 1, limit = 50 } = req.query;
    
    // Vérifier que l'utilisateur fait partie de la conversation
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation non trouvée' 
      });
    }
    
    const messages = await Message.find({ 
      conversation: req.params.id,
      deletedForAll: { $ne: true }
    })
    .populate('sender', 'username avatar displayName')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
    
    // Marquer la conversation comme lue si la méthode existe
    if (typeof conversation.markAsRead === 'function') {
      await conversation.markAsRead(userId);
    }
    
    res.json({ 
      success: true, 
      data: messages.reverse(),
      page: Number(page),
      hasMore: messages.length === Number(limit)
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send message (REST fallback - main sending via Socket.IO)
router.post('/conversations/:id/messages', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { content, type = 'text', attachments, replyTo, verseData } = req.body;
    
    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Contenu ou pièce jointe requis' 
      });
    }
    
    // Vérifier la conversation
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation non trouvée' 
      });
    }
    
    // Créer le message
    const message = await Message.create({
      conversation: req.params.id,
      sender: userId,
      content,
      type,
      attachments,
      replyTo,
      verseData
    });
    
    // Mettre à jour la conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageText = content?.substring(0, 100) || '';
    conversation.lastMessageAt = new Date();
    await conversation.save();
    
    // Incrémenter les non-lus pour les autres participants
    if (typeof conversation.incrementUnread === 'function') {
      await conversation.incrementUnread(userId);
    }
    
    // Populer pour la réponse
    await message.populate('sender', 'username avatar displayName');
    
    // Émettre via Socket.IO si disponible
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id).emit('new-message', message);
    }
    
    res.status(201).json({ success: true, data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark conversation as read
router.put('/conversations/:id/read', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conversation non trouvée' 
      });
    }
    
    if (typeof conversation.markAsRead === 'function') {
      await conversation.markAsRead(userId);
    }
    
    // Marquer tous les messages comme lus
    await Message.updateMany(
      { 
        conversation: req.params.id, 
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      { 
        $push: { readBy: { user: userId, readAt: new Date() } }
      }
    );
    
    res.json({ success: true, message: 'Conversation marquée comme lue' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete message
router.delete('/messages/:id', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { forAll = false } = req.query;
    
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        error: 'Message non trouvé' 
      });
    }
    
    if (forAll === 'true' && message.sender.toString() === userId.toString()) {
      // Supprimer pour tous (uniquement le sender)
      message.deletedForAll = true;
      message.content = 'Ce message a été supprimé';
      message.attachments = [];
    } else {
      // Supprimer uniquement pour l'utilisateur
      if (!message.deletedFor) message.deletedFor = [];
      if (!message.deletedFor.some(id => id.toString() === userId.toString())) {
        message.deletedFor.push(userId);
      }
    }
    
    await message.save();
    
    res.json({ success: true, message: 'Message supprimé' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add reaction to message
router.post('/messages/:id/reaction', async (req, res) => {
  try {
    const userId = req.user?._id || req.userId;
    const { emoji } = req.body;
    
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ 
        success: false, 
        error: 'Message non trouvé' 
      });
    }
    
    if (typeof message.addReaction === 'function') {
      await message.addReaction(userId, emoji);
    } else {
      // Manual reaction handling
      if (!message.reactions) message.reactions = [];
      message.reactions = message.reactions.filter(
        r => r.user?.toString() !== userId.toString()
      );
      if (emoji) {
        message.reactions.push({ user: userId, emoji, createdAt: new Date() });
      }
      await message.save();
    }
    
    // Émettre via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(message.conversation.toString()).emit('message-reaction', {
        messageId: message._id,
        userId,
        emoji
      });
    }
    
    res.json({ success: true, data: message.reactions });
  } catch (error) {
    console.error('Add reaction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;