/**
 * SurahProgress Model - Salifz
 * Tracks user progress for each Surah with detailed verse-level data
 */

const mongoose = require('mongoose');

const verseProgressSchema = new mongoose.Schema({
  ayahNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['not_started', 'learning', 'memorized', 'mastered'],
    default: 'not_started'
  },
  memorizedAt: Date,
  masteredAt: Date,
  reviewCount: {
    type: Number,
    default: 0
  },
  lastReviewedAt: Date,
  nextReviewAt: Date, // Spaced repetition
  
  // Tajwid scores
  tajwidScores: [{
    score: Number,
    timestamp: Date,
    details: {
      pronunciation: Number,
      makharij: Number,
      rules: Number
    }
  }],
  avgTajwidScore: {
    type: Number,
    default: 0
  },

  // Suivi de récitation — délibérément séparé des scores de tajwid ci-dessus.
  // Ce sont deux mesures différentes : ici la part de mots effectivement
  // prononcés, là une appréciation de la prononciation. Les mêler ferait
  // afficher l'une sous le nom de l'autre.
  recitationScores: [{
    accuracy: Number,        // part de mots reconnus, en pourcentage
    wordsTotal: Number,
    wordsCorrect: Number,
    confidence: Number,      // confiance du moteur, null s'il n'en donne pas
    timestamp: Date
  }],

  // Error tracking
  commonErrors: [{
    errorType: String,
    word: String,
    count: Number
  }],
  
  // Recordings
  recordings: [{
    url: String,
    duration: Number,
    createdAt: Date,
    score: Number
  }],
  
  // Confidence level (0-100)
  confidence: {
    type: Number,
    default: 0
  }
}, { _id: false });

const surahProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  surahNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 114
  },
  surahName: {
    type: String,
    required: true
  },
  surahNameArabic: {
    type: String,
    required: true
  },
  totalAyat: {
    type: Number,
    required: true
  },
  juzNumbers: [{
    type: Number
  }],
  
  // Overall status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'mastered'],
    default: 'not_started'
  },
  
  // Progress stats
  ayatMemorized: {
    type: Number,
    default: 0
  },
  ayatMastered: {
    type: Number,
    default: 0
  },
  progressPercentage: {
    type: Number,
    default: 0
  },
  
  // Mastery stars (0-3)
  masteryStars: {
    memorization: { type: Number, default: 0, max: 1 },
    tajwid: { type: Number, default: 0, max: 1 },
    fluency: { type: Number, default: 0, max: 1 }
  },
  
  // Verse-level progress
  verses: [verseProgressSchema],
  
  // Time tracking
  totalTimeSpent: {
    type: Number,
    default: 0 // in seconds
  },
  avgTimePerVerse: {
    type: Number,
    default: 0
  },
  
  // Session history
  sessions: [{
    startedAt: Date,
    endedAt: Date,
    duration: Number,
    versesStudied: [Number],
    xpEarned: Number,
    type: {
      type: String,
      enum: ['new', 'review', 'test']
    }
  }],
  
  // Best scores
  bestRecitationScore: {
    type: Number,
    default: 0
  },
  bestTestScore: {
    type: Number,
    default: 0
  },
  
  // Dates
  startedAt: Date,
  completedAt: Date,
  masteredAt: Date,
  lastActivityAt: Date,
  
  // Spaced repetition - next review
  nextReviewAt: Date,
  reviewStrength: {
    type: Number,
    default: 0 // 0-100, decays over time
  }
}, {
  timestamps: true
});

// Indexes
surahProgressSchema.index({ userId: 1, surahNumber: 1 }, { unique: true });
surahProgressSchema.index({ userId: 1, status: 1 });
surahProgressSchema.index({ userId: 1, nextReviewAt: 1 });

// Calculate progress percentage before saving
surahProgressSchema.pre('save', function(next) {
  if (this.totalAyat > 0) {
    this.progressPercentage = Math.round((this.ayatMemorized / this.totalAyat) * 100);
  }
  
  // Update status based on progress
  if (this.progressPercentage === 0) {
    this.status = 'not_started';
  } else if (this.progressPercentage < 100) {
    this.status = 'in_progress';
  } else if (this.ayatMastered === this.totalAyat) {
    this.status = 'mastered';
  } else {
    this.status = 'completed';
  }
  
  this.lastActivityAt = new Date();
  next();
});

// Instance methods
surahProgressSchema.methods.updateVerseStatus = async function(ayahNumber, newStatus, tajwidScore = null) {
  const verse = this.verses.find(v => v.ayahNumber === ayahNumber);
  
  if (!verse) {
    this.verses.push({
      ayahNumber,
      status: newStatus,
      memorizedAt: newStatus === 'memorized' ? new Date() : null,
      masteredAt: newStatus === 'mastered' ? new Date() : null
    });
  } else {
    const oldStatus = verse.status;
    verse.status = newStatus;
    
    if (newStatus === 'memorized' && oldStatus !== 'memorized') {
      verse.memorizedAt = new Date();
    }
    if (newStatus === 'mastered' && oldStatus !== 'mastered') {
      verse.masteredAt = new Date();
    }
    
    if (tajwidScore !== null) {
      verse.tajwidScores.push({
        score: tajwidScore,
        timestamp: new Date()
      });
      // Recalculate average
      const scores = verse.tajwidScores.map(s => s.score);
      verse.avgTajwidScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    }
  }
  
  // Recalculate totals
  this.ayatMemorized = this.verses.filter(v => 
    ['memorized', 'mastered'].includes(v.status)
  ).length;
  this.ayatMastered = this.verses.filter(v => v.status === 'mastered').length;
  
  await this.save();
  return this;
};

// Add session
surahProgressSchema.methods.addSession = async function(sessionData) {
  this.sessions.push(sessionData);
  this.totalTimeSpent += sessionData.duration || 0;
  
  if (this.ayatMemorized > 0) {
    this.avgTimePerVerse = this.totalTimeSpent / this.ayatMemorized;
  }
  
  await this.save();
  return this;
};

// Get verses needing review (spaced repetition)
surahProgressSchema.methods.getVersesForReview = function() {
  const now = new Date();
  return this.verses.filter(v => 
    v.status !== 'not_started' && 
    (!v.nextReviewAt || v.nextReviewAt <= now)
  ).sort((a, b) => a.confidence - b.confidence);
};

// Static methods
surahProgressSchema.statics.getUserOverallProgress = async function(userId) {
  const progress = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalVersesMemorized: { $sum: '$ayatMemorized' },
        totalVersesMastered: { $sum: '$ayatMastered' },
        surahsStarted: { $sum: { $cond: [{ $ne: ['$status', 'not_started'] }, 1, 0] } },
        surahsCompleted: { $sum: { $cond: [{ $in: ['$status', ['completed', 'mastered']] }, 1, 0] } },
        surahsMastered: { $sum: { $cond: [{ $eq: ['$status', 'mastered'] }, 1, 0] } },
        totalTimeSpent: { $sum: '$totalTimeSpent' }
      }
    }
  ]);
  
  return progress[0] || {
    totalVersesMemorized: 0,
    totalVersesMastered: 0,
    surahsStarted: 0,
    surahsCompleted: 0,
    surahsMastered: 0,
    totalTimeSpent: 0
  };
};

const SurahProgress = mongoose.model('SurahProgress', surahProgressSchema);

module.exports = SurahProgress;
