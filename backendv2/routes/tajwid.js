/**
 * Analyse du Tajwid — Salifz
 *
 * Cette route recevait l'enregistrement audio, le **jetait**, et renvoyait un
 * score `75 + Math.random() * 20` accompagné de quatre scores par règle
 * constants, identiques pour tous les utilisateurs. Le retour affiché à
 * l'utilisateur n'avait donc aucun rapport avec sa récitation.
 *
 * Règle appliquée maintenant : soit un vrai moteur d'analyse répond, soit la
 * route dit clairement que la fonctionnalité n'est pas disponible. Elle
 * n'invente jamais de note.
 *
 * Le moteur vit dans le sous-projet `salifz-ai-model` (FastAPI + modèles
 * entraînés). Renseignez `AI_SERVICE_URL` pour le brancher.
 */

const express = require('express');
const multer = require('multer');
const SurahProgress = require('../models/SurahProgress');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || null;
const AI_TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS) || 30000;

/** Référentiel des règles — donnée statique légitime, pas un résultat d'analyse. */
const TAJWID_RULES = [
  { id: 'idgham', name: { ar: 'إدغام', en: 'Idgham', fr: 'Idgham' }, letters: ['ي', 'ر', 'م', 'ل', 'و', 'ن'] },
  { id: 'ikhfa', name: { ar: 'إخفاء', en: 'Ikhfa', fr: 'Ikhfa' }, letters: ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'] },
  { id: 'iqlab', name: { ar: 'إقلاب', en: 'Iqlab', fr: 'Iqlab' }, letters: ['ب'] },
  { id: 'izhar', name: { ar: 'إظهار', en: 'Izhar', fr: 'Izhar' }, letters: ['ء', 'ه', 'ع', 'ح', 'غ', 'خ'] },
  { id: 'madd', name: { ar: 'مد', en: 'Madd', fr: 'Madd' }, letters: ['ا', 'و', 'ي'] },
  { id: 'qalqalah', name: { ar: 'قلقلة', en: 'Qalqalah', fr: 'Qalqala' }, letters: ['ق', 'ط', 'ب', 'ج', 'د'] },
];

/**
 * POST /api/v1/tajwid/analyze
 * Analyse une récitation enregistrée.
 */
router.post('/analyze', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Fichier audio requis' });
    }

    const surahNumber = parseInt(req.body.surahNumber, 10);
    const ayahNumber = parseInt(req.body.ayahNumber, 10);

    if (!Number.isInteger(surahNumber) || surahNumber < 1 || surahNumber > 114) {
      return res.status(400).json({ success: false, error: 'Numéro de sourate invalide' });
    }
    if (!Number.isInteger(ayahNumber) || ayahNumber < 1) {
      return res.status(400).json({ success: false, error: 'Numéro de verset invalide' });
    }

    if (!AI_SERVICE_URL) {
      // Réponse honnête plutôt qu'un score fabriqué.
      return res.status(503).json({
        success: false,
        error: "L'analyse du tajwid n'est pas encore disponible.",
        code: 'TAJWID_ENGINE_UNAVAILABLE',
      });
    }

    const analysis = await analyzeWithEngine(req.file, surahNumber, ayahNumber);

    // Le score est enregistré : c'est lui qui alimente /progress, qui était
    // jusqu'ici entièrement codé en dur.
    await recordScore(req.userId, surahNumber, ayahNumber, analysis);

    res.json({ success: true, data: { analysis } });
  } catch (error) {
    if (error.code === 'TAJWID_ENGINE_ERROR') {
      return res.status(502).json({ success: false, error: error.message, code: error.code });
    }
    next(error);
  }
});

/** Appelle le moteur d'analyse et normalise sa réponse. */
async function analyzeWithEngine(file, surahNumber, ayahNumber) {
  const form = new FormData();
  form.append('audio', new Blob([file.buffer], { type: file.mimetype }), file.originalname || 'recitation.m4a');
  form.append('surah', String(surahNumber));
  form.append('ayah', String(ayahNumber));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(`${AI_SERVICE_URL.replace(/\/$/, '')}/tajwid/analyze`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`Le moteur d'analyse a répondu ${response.status}.`);
      error.code = 'TAJWID_ENGINE_ERROR';
      throw error;
    }

    const result = await response.json();
    return {
      surahNumber,
      ayahNumber,
      overallScore: result.overall_score ?? result.overallScore ?? null,
      rules: result.rules || [],
      pronunciation: result.pronunciation || null,
      feedback: result.feedback || null,
      tips: result.tips || [],
      analyzedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err.code === 'TAJWID_ENGINE_ERROR') throw err;
    const error = new Error(
      err.name === 'AbortError'
        ? "Le moteur d'analyse n'a pas répondu à temps."
        : "Le moteur d'analyse est injoignable."
    );
    error.code = 'TAJWID_ENGINE_ERROR';
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/** Enregistre le score obtenu sur le verset concerné. */
async function recordScore(userId, surahNumber, ayahNumber, analysis) {
  if (typeof analysis.overallScore !== 'number') return;

  const progress = await SurahProgress.findOne({ userId, surahNumber });
  if (!progress) return;

  const verse = (progress.verses || []).find((v) => v.ayahNumber === ayahNumber);
  if (!verse) return;

  verse.tajwidScores = verse.tajwidScores || [];
  verse.tajwidScores.push({
    score: analysis.overallScore,
    timestamp: new Date(),
    details: analysis.pronunciation || {},
  });

  const scores = verse.tajwidScores.map((s) => s.score).filter((s) => typeof s === 'number');
  progress.avgTajwidScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  await progress.save();
}

/** GET /api/v1/tajwid/rules — référentiel statique. */
router.get('/rules', (req, res) => {
  res.json({ success: true, data: { rules: TAJWID_RULES } });
});

/**
 * GET /api/v1/tajwid/progress
 * Progression réelle par règle, calculée à partir des analyses enregistrées.
 * Les six scores renvoyés ici étaient des constantes, identiques pour tous.
 */
router.get('/progress', async (req, res, next) => {
  try {
    const allProgress = await SurahProgress.find({ userId: req.userId }).lean();

    const perRule = {};
    let totalScore = 0;
    let totalSessions = 0;

    for (const surah of allProgress) {
      for (const verse of surah.verses || []) {
        for (const entry of verse.tajwidScores || []) {
          if (typeof entry.score !== 'number') continue;
          totalScore += entry.score;
          totalSessions++;

          for (const [ruleId, ruleScore] of Object.entries(entry.details || {})) {
            if (typeof ruleScore !== 'number') continue;
            perRule[ruleId] = perRule[ruleId] || { sum: 0, count: 0 };
            perRule[ruleId].sum += ruleScore;
            perRule[ruleId].count++;
          }
        }
      }
    }

    const rulesProgress = {};
    for (const [ruleId, agg] of Object.entries(perRule)) {
      rulesProgress[ruleId] = { score: Math.round(agg.sum / agg.count), practiced: agg.count };
    }

    const ranked = Object.entries(rulesProgress).sort((a, b) => a[1].score - b[1].score);

    res.json({
      success: true,
      data: {
        progress: {
          overallScore: totalSessions > 0 ? Math.round(totalScore / totalSessions) : null,
          totalSessions,
          rulesProgress,
          weakAreas: ranked.slice(0, 2).map(([id]) => id),
          strongAreas: ranked.slice(-2).map(([id]) => id).reverse(),
          // L'interface doit afficher un état vide tant que c'est faux.
          hasData: totalSessions > 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
