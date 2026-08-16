/**
 * Récitation soumise à validation — Salifz
 *
 * C'est le cœur de l'apprentissage traditionnel du Coran : l'élève récite un
 * passage devant un enseignant, qui écoute et valide. Les Halaqat existaient
 * déjà dans l'application, mais uniquement comme groupes de discussion — rien
 * ne permettait à un enseignant d'entendre un élève et de valider un hizb.
 *
 * Un passage validé s'ajoute au parcours de l'élève ; le refus s'accompagne
 * toujours d'un retour écrit, sans quoi la correction n'apprend rien.
 */

const mongoose = require('mongoose');

const recitationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    halaqa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Halaqa',
      required: true,
      index: true,
    },

    // Passage récité
    surahNumber: { type: Number, required: true, min: 1, max: 114 },
    fromAyah: { type: Number, required: true, min: 1 },
    toAyah: { type: Number, required: true, min: 1 },

    /** Nature de l'exercice : première présentation ou révision. */
    kind: {
      type: String,
      enum: ['hifz', 'muraja'],
      default: 'hifz',
    },

    audioUrl: { type: String, required: true },
    durationSeconds: Number,

    status: {
      type: String,
      enum: ['pending', 'approved', 'needs_work'],
      default: 'pending',
      index: true,
    },

    /** Numéro de tentative sur le même passage. */
    attempt: { type: Number, default: 1 },

    review: {
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
      // Note globale sur 100, laissée à l'appréciation de l'enseignant.
      grade: { type: Number, min: 0, max: 100 },
      // Remarques ciblées : elles servent à l'élève pour la tentative suivante.
      tajwidNotes: { type: String, maxlength: 1000 },
      memorizationNotes: { type: String, maxlength: 1000 },
      comment: { type: String, maxlength: 2000 },
      // Erreurs pointées à un verset précis.
      corrections: [
        {
          ayahNumber: Number,
          note: { type: String, maxlength: 300 },
        },
      ],
    },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// La file d'attente d'un enseignant se lit par halaqa et par statut.
recitationSchema.index({ halaqa: 1, status: 1, createdAt: -1 });
// L'historique d'un élève sur un passage donné.
recitationSchema.index({ student: 1, surahNumber: 1, fromAyah: 1 });

recitationSchema.pre('validate', function (next) {
  if (this.toAyah < this.fromAyah) {
    return next(new Error('Le verset de fin précède le verset de début'));
  }
  next();
});

/** Nombre de versets couverts par la soumission. */
recitationSchema.virtual('ayahCount').get(function () {
  return this.toAyah - this.fromAyah + 1;
});

recitationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Recitation', recitationSchema);
