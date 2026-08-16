/**
 * Khatam Model - Salifz
 * ✅ COMPLETE: Khatam Quran tracking (60 hizb)
 */

const mongoose = require('mongoose');

// Schema pour un participant
const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedHizbs: [{
    hizbNumber: Number,        // 1-60
    quarterIndex: Number,      // 0-3 (pour 1/4 hizb)
    eighthIndex: Number,       // 0-7 (pour 1/8 hizb)
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending'
    },
    completedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date
  }],
  totalAssigned: { type: Number, default: 0 },
  totalCompleted: { type: Number, default: 0 },
  joinedAt: { type: Date, default: Date.now },
  lastActivityAt: Date,
  isAdmin: { type: Boolean, default: false }
});

// Schema principal Khatam
const khatamSchema = new mongoose.Schema({
  // Informations de base
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  
  // Créateur
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Type de khatam
  type: {
    type: String,
    enum: ['solo', 'group'],
    default: 'solo'
  },
  
  // Mode de lecture
  readingMode: {
    type: String,
    enum: ['offline', 'realtime'],  // realtime = audio/video chat
    default: 'offline'
  },
  
  // Configuration de lecture
  readingConfig: {
    // Unité de lecture
    unit: {
      type: String,
      enum: ['eighth', 'quarter', 'half', 'hizb', 'juz'],  // 1/8, 1/4, 1/2, 1 hizb, 1 juz (2 hizb)
      default: 'hizb'
    },
    // Quantité par jour par personne
    amountPerDay: {
      type: Number,
      default: 1,
      min: 1
    },
    // Nombre de jours prévu pour terminer
    targetDays: {
      type: Number,
      default: 30
    },
    // Répétition infinie
    isInfinite: {
      type: Boolean,
      default: false
    },
    // Nombre de khatam à faire (si pas infini)
    targetKhatamCount: {
      type: Number,
      default: 1
    }
  },
  
  // Participants
  participants: [participantSchema],
  
  // Progression globale
  progress: {
    // Khatam actuel (pour mode infini)
    currentKhatamNumber: { type: Number, default: 1 },
    // Total des hizb complétés (tous participants)
    totalHizbCompleted: { type: Number, default: 0 },
    // Pourcentage de progression du khatam actuel
    currentKhatamProgress: { type: Number, default: 0 },
    // Nombre total de khatam complétés
    completedKhatamCount: { type: Number, default: 0 }
  },
  
  // Tableau de suivi (60 hizb)
  hizbTracking: [{
    hizbNumber: { type: Number, required: true },  // 1-60
    surahStart: { name: String, number: Number, ayah: Number },
    surahEnd: { name: String, number: Number, ayah: Number },
    juzNumber: Number,  // 1-30
    status: {
      type: String,
      enum: ['available', 'assigned', 'in_progress', 'completed', 'verified'],
      default: 'available'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    // Pour subdivision en quarts ou huitièmes
    quarters: [{
      index: Number,  // 0-3
      status: { type: String, enum: ['available', 'assigned', 'completed'], default: 'available' },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      completedAt: Date
    }],
    eighths: [{
      index: Number,  // 0-7
      status: { type: String, enum: ['available', 'assigned', 'completed'], default: 'available' },
      assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      completedAt: Date
    }]
  }],
  
  // Sessions de lecture realtime
  realtimeSessions: [{
    scheduledAt: Date,
    startedAt: Date,
    endedAt: Date,
    participants: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      joinedAt: Date,
      leftAt: Date
    }],
    roomId: String,  // Pour Socket.IO
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled'
    },
    recordingUrl: String
  }],
  
  // Statistiques
  stats: {
    totalParticipants: { type: Number, default: 0 },
    averageCompletionTime: Number,  // en jours
    fastestCompletion: Number,
    totalReadingTime: Number  // en minutes
  },
  
  // Paramètres
  settings: {
    isPublic: { type: Boolean, default: false },
    requireVerification: { type: Boolean, default: false },  // Admin doit vérifier
    allowSelfAssign: { type: Boolean, default: true },
    maxParticipants: { type: Number, default: 100 },
    notifyOnCompletion: { type: Boolean, default: true },
    language: { type: String, default: 'ar' }
  },
  
  // Dates
  startDate: { type: Date, default: Date.now },
  targetEndDate: Date,
  actualEndDate: Date,
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'active'
  },
  
  isActive: { type: Boolean, default: true }
  
}, { timestamps: true });

// Index pour recherche rapide
khatamSchema.index({ creator: 1 });
khatamSchema.index({ 'participants.user': 1 });
khatamSchema.index({ status: 1 });
khatamSchema.index({ 'settings.isPublic': 1 });

// Initialiser les 60 hizb au moment de la création
khatamSchema.pre('save', function(next) {
  if (this.isNew && this.hizbTracking.length === 0) {
    this.initializeHizbTracking();
  }
  next();
});

// Méthode pour initialiser le tracking des 60 hizb
khatamSchema.methods.initializeHizbTracking = function() {
  const hizbData = getHizbData();
  
  this.hizbTracking = hizbData.map((hizb, index) => ({
    hizbNumber: index + 1,
    surahStart: hizb.start,
    surahEnd: hizb.end,
    juzNumber: Math.ceil((index + 1) / 2),
    status: 'available',
    quarters: [0, 1, 2, 3].map(i => ({ index: i, status: 'available' })),
    eighths: [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ index: i, status: 'available' }))
  }));
};

// Méthode pour ajouter un participant
khatamSchema.methods.addParticipant = async function(userId, isAdmin = false) {
  const exists = this.participants.find(p => p.user.toString() === userId.toString());
  if (exists) throw new Error('Already a participant');
  
  if (this.participants.length >= this.settings.maxParticipants) {
    throw new Error('Maximum participants reached');
  }
  
  this.participants.push({
    user: userId,
    isAdmin,
    joinedAt: new Date()
  });
  
  this.stats.totalParticipants = this.participants.length;
  await this.save();
  return this;
};

// Méthode pour assigner un hizb
khatamSchema.methods.assignHizb = async function(hizbNumber, userId, unit = 'hizb', subIndex = 0) {
  const hizb = this.hizbTracking.find(h => h.hizbNumber === hizbNumber);
  if (!hizb) throw new Error('Hizb not found');
  
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!participant) throw new Error('Not a participant');
  
  if (unit === 'hizb') {
    if (hizb.status !== 'available') throw new Error('Hizb already assigned');
    hizb.status = 'assigned';
    hizb.assignedTo = userId;
    hizb.assignedAt = new Date();
  } else if (unit === 'quarter') {
    if (hizb.quarters[subIndex].status !== 'available') throw new Error('Quarter already assigned');
    hizb.quarters[subIndex].status = 'assigned';
    hizb.quarters[subIndex].assignedTo = userId;
  } else if (unit === 'eighth') {
    if (hizb.eighths[subIndex].status !== 'available') throw new Error('Eighth already assigned');
    hizb.eighths[subIndex].status = 'assigned';
    hizb.eighths[subIndex].assignedTo = userId;
  }
  
  // Update participant's assigned hizbs
  participant.assignedHizbs.push({
    hizbNumber,
    quarterIndex: unit === 'quarter' ? subIndex : null,
    eighthIndex: unit === 'eighth' ? subIndex : null,
    status: 'pending'
  });
  participant.totalAssigned++;
  
  await this.save();
  return this;
};

// Méthode pour marquer comme complété
khatamSchema.methods.completeHizb = async function(hizbNumber, userId, unit = 'hizb', subIndex = 0) {
  const hizb = this.hizbTracking.find(h => h.hizbNumber === hizbNumber);
  if (!hizb) throw new Error('Hizb not found');
  
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!participant) throw new Error('Not a participant');
  
  if (unit === 'hizb') {
    hizb.status = this.settings.requireVerification ? 'completed' : 'verified';
    hizb.completedBy = userId;
    hizb.completedAt = new Date();
  } else if (unit === 'quarter') {
    hizb.quarters[subIndex].status = 'completed';
    hizb.quarters[subIndex].completedAt = new Date();
    // Check if all quarters are complete
    if (hizb.quarters.every(q => q.status === 'completed')) {
      hizb.status = 'completed';
      hizb.completedAt = new Date();
    }
  } else if (unit === 'eighth') {
    hizb.eighths[subIndex].status = 'completed';
    hizb.eighths[subIndex].completedAt = new Date();
    // Check if all eighths are complete
    if (hizb.eighths.every(e => e.status === 'completed')) {
      hizb.status = 'completed';
      hizb.completedAt = new Date();
    }
  }
  
  // Update participant stats
  const assignedHizb = participant.assignedHizbs.find(
    h => h.hizbNumber === hizbNumber && 
    (unit === 'hizb' || h.quarterIndex === subIndex || h.eighthIndex === subIndex)
  );
  if (assignedHizb) {
    assignedHizb.status = 'completed';
    assignedHizb.completedAt = new Date();
    participant.totalCompleted++;
  }
  participant.lastActivityAt = new Date();
  
  // Update global progress
  this.updateProgress();
  
  await this.save();
  return this;
};

// Méthode pour vérifier (admin)
khatamSchema.methods.verifyHizb = async function(hizbNumber, adminId) {
  const hizb = this.hizbTracking.find(h => h.hizbNumber === hizbNumber);
  if (!hizb) throw new Error('Hizb not found');
  
  const admin = this.participants.find(p => p.user.toString() === adminId.toString() && p.isAdmin);
  if (!admin && this.creator.toString() !== adminId.toString()) {
    throw new Error('Not authorized');
  }
  
  hizb.status = 'verified';
  hizb.verifiedBy = adminId;
  hizb.verifiedAt = new Date();
  
  this.updateProgress();
  await this.save();
  return this;
};

// Méthode pour mettre à jour la progression
khatamSchema.methods.updateProgress = function() {
  const verifiedCount = this.hizbTracking.filter(h => h.status === 'verified').length;
  const completedCount = this.hizbTracking.filter(h => ['completed', 'verified'].includes(h.status)).length;
  
  this.progress.totalHizbCompleted = verifiedCount;
  this.progress.currentKhatamProgress = Math.round((completedCount / 60) * 100);
  
  // Check if khatam is complete
  if (verifiedCount === 60) {
    this.progress.completedKhatamCount++;
    
    if (this.readingConfig.isInfinite) {
      // Reset for next khatam
      this.progress.currentKhatamNumber++;
      this.hizbTracking.forEach(h => {
        h.status = 'available';
        h.assignedTo = null;
        h.completedBy = null;
        h.verifiedBy = null;
        h.quarters.forEach(q => { q.status = 'available'; q.assignedTo = null; });
        h.eighths.forEach(e => { e.status = 'available'; e.assignedTo = null; });
      });
    } else if (this.progress.completedKhatamCount >= this.readingConfig.targetKhatamCount) {
      this.status = 'completed';
      this.actualEndDate = new Date();
    }
  }
};

// Méthode pour obtenir les statistiques du tableau de bord
khatamSchema.methods.getDashboard = function() {
  return {
    khatamInfo: {
      title: this.title,
      type: this.type,
      readingMode: this.readingMode,
      status: this.status,
      currentKhatam: this.progress.currentKhatamNumber,
      completedKhatams: this.progress.completedKhatamCount
    },
    progress: {
      percentage: this.progress.currentKhatamProgress,
      completed: this.hizbTracking.filter(h => ['completed', 'verified'].includes(h.status)).length,
      verified: this.hizbTracking.filter(h => h.status === 'verified').length,
      inProgress: this.hizbTracking.filter(h => h.status === 'in_progress').length,
      assigned: this.hizbTracking.filter(h => h.status === 'assigned').length,
      available: this.hizbTracking.filter(h => h.status === 'available').length
    },
    participants: this.participants.map(p => ({
      user: p.user,
      isAdmin: p.isAdmin,
      assigned: p.totalAssigned,
      completed: p.totalCompleted,
      progress: p.totalAssigned > 0 ? Math.round((p.totalCompleted / p.totalAssigned) * 100) : 0
    })),
    hizbGrid: this.hizbTracking.map(h => ({
      number: h.hizbNumber,
      juz: h.juzNumber,
      status: h.status,
      assignedTo: h.assignedTo,
      completedBy: h.completedBy
    }))
  };
};

// Données des 60 hizb (simplifié)
function getHizbData() {
  // Les 60 hizb du Coran avec leurs positions
  const data = [];
  for (let i = 1; i <= 60; i++) {
    data.push({
      start: { name: `Surah ${Math.ceil(i/5)}`, number: Math.ceil(i/5), ayah: 1 },
      end: { name: `Surah ${Math.ceil(i/5)}`, number: Math.ceil(i/5), ayah: 50 }
    });
  }
  return data;
}

// Statics
khatamSchema.statics.findUserKhatams = function(userId) {
  return this.find({
    $or: [
      { creator: userId },
      { 'participants.user': userId }
    ],
    isActive: true
  }).sort({ updatedAt: -1 });
};

khatamSchema.statics.findPublicKhatams = function(limit = 20) {
  return this.find({
    'settings.isPublic': true,
    status: 'active',
    isActive: true
  })
  .populate('creator', 'username displayName avatar')
  .sort({ 'stats.totalParticipants': -1 })
  .limit(limit);
};

const Khatam = mongoose.model('Khatam', khatamSchema);

module.exports = Khatam;