/**
 * Conversation Model - Salifz
 * Modèle pour les conversations de chat
 */

const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Participants de la conversation
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Type de conversation
  type: {
    type: String,
    enum: ['direct', 'group', 'halaqa'],
    default: 'direct'
  },
  
  // Nom (pour les groupes)
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  // Avatar (pour les groupes)
  avatar: {
    type: String
  },
  
  // Description (pour les groupes)
  description: {
    type: String,
    maxlength: 500
  },
  
  // Dernier message
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Dernier message texte (pour preview)
  lastMessageText: {
    type: String
  },
  
  // Date du dernier message
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  
  // Administrateurs (pour les groupes)
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Créateur
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Conversation muette pour certains utilisateurs
  mutedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    until: Date // null = forever
  }],
  
  // Conversation épinglée pour certains utilisateurs
  pinnedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Archivée pour certains utilisateurs
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Messages non lus par utilisateur
  unreadCount: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 0
    }
  }],
  
  // Paramètres du groupe
  settings: {
    onlyAdminsCanPost: {
      type: Boolean,
      default: false
    },
    onlyAdminsCanAddMembers: {
      type: Boolean,
      default: false
    }
  },
  
  // Actif
  isActive: {
    type: Boolean,
    default: true
  }
  
}, { 
  timestamps: true 
});

// Index pour recherche rapide
conversationSchema.index({ participants: 1 });
conversationSchema.index({ type: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ 'unreadCount.user': 1 });

// Méthode pour obtenir l'autre participant (pour direct messages)
conversationSchema.methods.getOtherParticipant = function(userId) {
  return this.participants.find(p => p.toString() !== userId.toString());
};

// Méthode pour vérifier si un utilisateur est participant
conversationSchema.methods.isParticipant = function(userId) {
  return this.participants.some(p => p.toString() === userId.toString());
};

// Méthode pour vérifier si un utilisateur est admin
conversationSchema.methods.isAdmin = function(userId) {
  return this.admins.some(a => a.toString() === userId.toString());
};

// Méthode pour incrémenter le compteur de non-lus
conversationSchema.methods.incrementUnread = async function(excludeUserId) {
  for (const participant of this.participants) {
    if (participant.toString() !== excludeUserId.toString()) {
      const unreadEntry = this.unreadCount.find(
        u => u.user.toString() === participant.toString()
      );
      
      if (unreadEntry) {
        unreadEntry.count += 1;
      } else {
        this.unreadCount.push({ user: participant, count: 1 });
      }
    }
  }
  await this.save();
};

// Méthode pour marquer comme lu
conversationSchema.methods.markAsRead = async function(userId) {
  const unreadEntry = this.unreadCount.find(
    u => u.user.toString() === userId.toString()
  );
  
  if (unreadEntry) {
    unreadEntry.count = 0;
    await this.save();
  }
};

module.exports = mongoose.model('Conversation', conversationSchema);