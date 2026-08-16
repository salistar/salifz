/**
 * Message Model - Salifz
 * Modèle pour les messages de chat
 */

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Conversation parente
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  
  // Expéditeur
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Contenu du message
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Type de message
  type: {
    type: String,
    enum: ['text', 'image', 'audio', 'video', 'file', 'verse', 'location', 'system'],
    default: 'text'
  },
  
  // Données de verset (si type === 'verse')
  verseData: {
    surah: Number,
    surahName: String,
    ayah: Number,
    text: String,
    translation: String
  },
  
  // Pièces jointes
  attachments: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'audio', 'video', 'file'],
      required: true
    },
    name: String,
    size: Number, // en bytes
    mimeType: String,
    duration: Number, // pour audio/video, en secondes
    thumbnail: String // pour images/videos
  }],
  
  // Localisation (si type === 'location')
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  
  // Réponse à un autre message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Message transféré
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  
  // Statut de lecture
  read: {
    type: Boolean,
    default: false
  },
  
  readAt: {
    type: Date
  },
  
  // Lu par (pour les groupes)
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Statut de livraison
  delivered: {
    type: Boolean,
    default: false
  },
  
  deliveredAt: {
    type: Date
  },
  
  // Message édité
  edited: {
    type: Boolean,
    default: false
  },
  
  editedAt: {
    type: Date
  },
  
  // Supprimé pour certains utilisateurs
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Supprimé pour tous
  deletedForAll: {
    type: Boolean,
    default: false
  },
  
  // Réactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Métadonnées système
  systemData: {
    action: String, // 'user_joined', 'user_left', 'group_created', etc.
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
  
}, { 
  timestamps: true 
});

// Index pour recherche rapide
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ 'readBy.user': 1 });

// Méthode pour marquer comme lu par un utilisateur
messageSchema.methods.markAsReadBy = async function(userId) {
  const alreadyRead = this.readBy.some(
    r => r.user.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({ user: userId, readAt: new Date() });
    
    // Si c'est un message direct, marquer comme lu
    if (this.sender.toString() !== userId.toString()) {
      this.read = true;
      this.readAt = new Date();
    }
    
    await this.save();
  }
};

// Méthode pour ajouter une réaction
messageSchema.methods.addReaction = async function(userId, emoji) {
  // Supprimer l'ancienne réaction de l'utilisateur
  this.reactions = this.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );
  
  // Ajouter la nouvelle réaction
  this.reactions.push({ user: userId, emoji });
  await this.save();
};

// Méthode pour supprimer une réaction
messageSchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(
    r => r.user.toString() !== userId.toString()
  );
  await this.save();
};

// Virtual pour savoir si le message est supprimé
messageSchema.virtual('isDeleted').get(function() {
  return this.deletedForAll;
});

// Transformation JSON
messageSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    if (ret.deletedForAll) {
      ret.content = 'Ce message a été supprimé';
      ret.attachments = [];
    }
    return ret;
  }
});

module.exports = mongoose.model('Message', messageSchema);