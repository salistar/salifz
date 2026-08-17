/**
 * Analytics Routes - Salifz
 *
 * Toutes les valeurs de ce fichier venaient de `Math.random()` : temps
 * d'étude, courbe hebdomadaire, calendrier d'assiduité. Un utilisateur qui
 * n'avait rien ouvert de la semaine y lisait une belle progression, et le
 * graphe changeait à chaque rafraîchissement. Ces écrans sont désormais
 * alimentés par `Streak.history`, la seule trace réellement écrite : chaque
 * jour d'activité y enregistre l'XP gagné et les versets appris ou révisés.
 *
 * Une limite assumée : `Streak.history` ne conserve que 90 jours (le modèle
 * tronque au-delà) et ne mesure aucune durée. Les champs qui prétendaient
 * donner un temps passé ont donc été retirés plutôt que remplis au hasard —
 * rien dans l'application n'enregistre de durée de session.
 */
const express = require('express');
const router = express.Router();
const Streak = require('../models/Streak');

/** Fenêtre réellement disponible, imposée par la troncature du modèle. */
const HISTORY_DAYS = 90;

const dayKey = (date) => new Date(date).toISOString().split('T')[0];

/**
 * Indexe l'historique par jour. Le modèle peut contenir plusieurs entrées pour
 * une même date (activité puis gel) : on additionne au lieu d'écraser.
 */
async function historyByDay(userId) {
  const streak = await Streak.findOne({ user: userId }).lean();
  const byDay = new Map();

  for (const entry of streak?.history ?? []) {
    if (!entry?.date) continue;
    const key = dayKey(entry.date);
    const current = byDay.get(key) ?? { xpEarned: 0, versesMemorized: 0, versesReviewed: 0, completed: false };
    current.xpEarned += entry.xpEarned ?? 0;
    current.versesMemorized += entry.versesMemorized ?? 0;
    current.versesReviewed += entry.versesReviewed ?? 0;
    current.completed = current.completed || Boolean(entry.completed);
    byDay.set(key, current);
  }

  return byDay;
}

/** Les `count` derniers jours, jour manquant compris — un trou dans
 *  l'historique est un jour sans activité, pas un jour à omettre. */
function lastDays(byDay, count) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = dayKey(date);
    const found = byDay.get(key);
    out.push({
      date: key,
      versesLearned: found?.versesMemorized ?? 0,
      versesReviewed: found?.versesReviewed ?? 0,
      xpEarned: found?.xpEarned ?? 0,
      active: Boolean(found?.completed)
    });
  }
  return out;
}

router.get('/overview', async (req, res, next) => {
  try {
    const user = req.user;
    const byDay = await historyByDay(user._id);
    const week = lastDays(byDay, 7);

    res.json({
      success: true,
      data: {
        overview: {
          progress: {
            totalVersesMemorized: user.quranProgress.totalVersesMemorized,
            percentComplete: ((user.quranProgress.totalVersesMemorized / 6236) * 100).toFixed(2),
            surahsCompleted: user.quranProgress.totalSurahCompleted,
            juzCompleted: user.quranProgress.totalJuzCompleted
          },
          // Remplace l'ancien `studyTime`, qui annonçait des minutes que rien
          // ne mesure. Ces trois valeurs sont comptées, pas estimées.
          thisWeek: {
            activeDays: week.filter((d) => d.active).length,
            versesLearned: week.reduce((sum, d) => sum + d.versesLearned, 0),
            xpEarned: week.reduce((sum, d) => sum + d.xpEarned, 0)
          },
          streaks: { current: user.gamification.currentStreak, longest: user.gamification.longestStreak },
          performance: {
            avgTajwidScore: user.quranProgress.avgTajwidScore ?? null,
            // `avgAccuracy: 80` était une constante déguisée en mesure.
            avgAccuracy: null
          },
          gamification: { level: user.gamification.level, totalXP: user.gamification.totalXP, gems: user.gamification.gems }
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/weekly', async (req, res, next) => {
  try {
    const byDay = await historyByDay(req.user._id);
    const weeklyData = lastDays(byDay, 7).map((d) => ({
      ...d,
      day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
    }));
    res.json({ success: true, data: { weeklyData } });
  } catch (error) {
    next(error);
  }
});

router.get('/heatmap', async (req, res, next) => {
  try {
    // La requête demandait des mois ; on borne à ce que l'historique conserve
    // réellement, et on le dit dans la réponse plutôt que de compléter le
    // reste avec des cases inventées.
    const requestedDays = Math.round((Number(req.query.months) || 3) * 30);
    const days = Math.min(Math.max(requestedDays, 1), HISTORY_DAYS);

    const byDay = await historyByDay(req.user._id);
    const heatmap = lastDays(byDay, days).map((d) => ({
      date: d.date,
      count: d.versesLearned + d.versesReviewed
    }));

    res.json({
      success: true,
      data: { heatmap, availableDays: HISTORY_DAYS, truncated: requestedDays > HISTORY_DAYS }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
