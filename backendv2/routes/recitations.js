/**
 * Validation des récitations par l'enseignant — Salifz
 *
 * Flux : l'élève enregistre un passage et le soumet à sa halaqa ; un
 * responsable de la halaqa écoute et valide, ou demande une reprise avec des
 * remarques. Un passage validé crédite la progression de l'élève.
 *
 * Règle d'autorisation appliquée partout : on ne voit que les récitations de
 * ses propres halaqat, et seul un responsable peut évaluer.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const Recitation = require('../models/Recitation');
const SurahProgress = require('../models/SurahProgress');
const { canJoinHalaqa, isHalaqaModerator } = require('../sockets/authorization');
const { heavyLimiter } = require('../middleware/rateLimit');
const pushService = require('../services/pushService');

const router = express.Router();

// Stockage local en développement. En production, ces fichiers doivent partir
// vers un stockage objet (S3, GCS) : le disque d'une instance est éphémère.
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'recitations');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.m4a';
      cb(null, `${req.userId}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Seul de l'audio est attendu : accepter n'importe quel type ferait de
    // cette route un hébergeur de fichiers arbitraires.
    if (!/^audio\//.test(file.mimetype)) {
      return cb(new Error('Seuls les fichiers audio sont acceptés'));
    }
    cb(null, true);
  },
});

/**
 * POST /api/v1/recitations
 * L'élève soumet un passage récité.
 */
router.post(
  '/',
  heavyLimiter,
  upload.single('audio'),
  [
    body('halaqaId').isString().notEmpty(),
    body('surahNumber').isInt({ min: 1, max: 114 }),
    body('fromAyah').isInt({ min: 1 }),
    body('toAyah').isInt({ min: 1 }),
    body('kind').optional().isIn(['hifz', 'muraja']),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Requête invalide', details: errors.array() });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Enregistrement audio requis' });
      }

      const { halaqaId, surahNumber, fromAyah, toAyah, kind, durationSeconds } = req.body;

      // On ne soumet qu'à une halaqa dont on est membre.
      if (!(await canJoinHalaqa(req.userId, halaqaId))) {
        return res.status(403).json({
          success: false,
          error: "Vous n'êtes pas membre de cette halaqa.",
          code: 'NOT_A_MEMBER',
        });
      }

      // Numéro de tentative : utile à l'enseignant pour situer la progression.
      const previous = await Recitation.countDocuments({
        student: req.userId,
        surahNumber: Number(surahNumber),
        fromAyah: Number(fromAyah),
      });

      const recitation = await Recitation.create({
        student: req.userId,
        halaqa: halaqaId,
        surahNumber: Number(surahNumber),
        fromAyah: Number(fromAyah),
        toAyah: Number(toAyah),
        kind: kind || 'hifz',
        audioUrl: `/uploads/recitations/${req.file.filename}`,
        durationSeconds: durationSeconds ? Number(durationSeconds) : undefined,
        attempt: previous + 1,
      });

      res.status(201).json({ success: true, data: { recitation } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/recitations/mine
 * Historique de l'élève.
 */
router.get('/mine', async (req, res, next) => {
  try {
    const recitations = await Recitation.find({ student: req.userId })
      .populate('halaqa', 'name avatar')
      .populate('review.reviewedBy', 'username displayName avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, data: { recitations } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/recitations/pending/:halaqaId
 * File d'attente de l'enseignant.
 */
router.get('/pending/:halaqaId', async (req, res, next) => {
  try {
    const { halaqaId } = req.params;

    if (!(await isHalaqaModerator(req.userId, halaqaId))) {
      return res.status(403).json({
        success: false,
        error: 'Réservé aux responsables de la halaqa.',
        code: 'NOT_A_MODERATOR',
      });
    }

    const recitations = await Recitation.find({ halaqa: halaqaId, status: 'pending' })
      .populate('student', 'username displayName avatar')
      .sort({ createdAt: 1 }) // le plus ancien d'abord : personne n'attend indéfiniment
      .limit(100)
      .lean();

    res.json({ success: true, data: { recitations, count: recitations.length } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/recitations/:id/review
 * L'enseignant valide ou demande une reprise.
 */
router.post(
  '/:id/review',
  [
    body('status').isIn(['approved', 'needs_work']),
    body('grade').optional().isInt({ min: 0, max: 100 }),
    body('comment').optional().isString().isLength({ max: 2000 }),
    body('tajwidNotes').optional().isString().isLength({ max: 1000 }),
    body('memorizationNotes').optional().isString().isLength({ max: 1000 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Évaluation invalide', details: errors.array() });
      }

      const recitation = await Recitation.findById(req.params.id).populate('student');
      if (!recitation) {
        return res.status(404).json({ success: false, error: 'Récitation introuvable' });
      }

      if (!(await isHalaqaModerator(req.userId, recitation.halaqa))) {
        return res.status(403).json({
          success: false,
          error: 'Réservé aux responsables de la halaqa.',
          code: 'NOT_A_MODERATOR',
        });
      }

      // Un enseignant n'évalue pas sa propre récitation.
      if (String(recitation.student._id) === String(req.userId)) {
        return res.status(403).json({
          success: false,
          error: 'Vous ne pouvez pas évaluer votre propre récitation.',
          code: 'SELF_REVIEW',
        });
      }

      if (recitation.status !== 'pending') {
        return res.status(409).json({
          success: false,
          error: 'Cette récitation a déjà été évaluée.',
          code: 'ALREADY_REVIEWED',
        });
      }

      const { status, grade, comment, tajwidNotes, memorizationNotes, corrections } = req.body;

      // Un refus sans explication n'apprend rien à l'élève.
      if (status === 'needs_work' && !comment && !tajwidNotes && !memorizationNotes) {
        return res.status(400).json({
          success: false,
          error: 'Une demande de reprise doit être accompagnée d’une remarque.',
          code: 'FEEDBACK_REQUIRED',
        });
      }

      recitation.status = status;
      recitation.review = {
        reviewedBy: req.userId,
        reviewedAt: new Date(),
        grade,
        comment,
        tajwidNotes,
        memorizationNotes,
        corrections: Array.isArray(corrections) ? corrections.slice(0, 50) : [],
      };
      await recitation.save();

      if (status === 'approved') {
        await markVersesValidated(recitation);
      }

      await notifyStudent(recitation, req.user);

      res.json({ success: true, data: { recitation } });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * Marque les versets du passage comme validés par un enseignant.
 * C'est ce qui distingue une validation humaine d'une auto-déclaration.
 */
async function markVersesValidated(recitation) {
  try {
    const progress = await SurahProgress.findOne({
      userId: recitation.student._id || recitation.student,
      surahNumber: recitation.surahNumber,
    });
    if (!progress) return;

    const now = new Date();
    for (const verse of progress.verses || []) {
      if (verse.ayahNumber >= recitation.fromAyah && verse.ayahNumber <= recitation.toAyah) {
        verse.status = 'mastered';
        verse.masteredAt = verse.masteredAt || now;
        if (typeof recitation.review.grade === 'number') {
          verse.confidence = Math.max(verse.confidence || 0, recitation.review.grade);
        }
      }
    }
    await progress.save();
  } catch (error) {
    console.error('[RECITATION] Progression non mise à jour :', error.message);
  }
}

/** Prévient l'élève que sa récitation a été évaluée. */
async function notifyStudent(recitation, teacher) {
  try {
    const student = recitation.student;
    if (!student || typeof student.save !== 'function') return;

    const approved = recitation.status === 'approved';
    await pushService.sendToUser(student, {
      title: approved ? 'Récitation validée ✅' : 'Récitation à revoir',
      body: approved
        ? `${teacher?.displayName || 'Votre enseignant'} a validé votre passage.`
        : `${teacher?.displayName || 'Votre enseignant'} vous a laissé des remarques.`,
      channelId: 'social',
      data: { type: 'recitation_reviewed', recitationId: String(recitation._id) },
    });
  } catch (error) {
    console.error('[RECITATION] Notification non envoyée :', error.message);
  }
}

module.exports = router;
