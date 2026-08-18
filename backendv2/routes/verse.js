/**
 * Verset du jour — Salifz
 *
 * Trois défauts corrigés ici, tous du même genre : présenter une invention
 * comme un fait.
 *
 * 1. Le texte du verset venait d'une table de trois entrées. Pour les sept
 *    autres versets de la sélection, la route retombait sur
 *    `{ ar: 'آية 60' }` — littéralement « verset 60 » — et l'application
 *    l'affichait à la place du texte coranique. Dans une application de
 *    mémorisation, c'est le pire défaut possible : quelqu'un peut apprendre
 *    ce qu'il lit. Le texte vient désormais de l'API Coran, comme partout
 *    ailleurs dans le produit, et l'absence de réponse est signalée plutôt
 *    que comblée.
 *
 * 2. `/tafsir` renvoyait un commentaire fabriqué **attribué nommément** à Ibn
 *    Kathir et Al-Tabari. Mettre des mots inventés dans la bouche de savants
 *    identifiés dépasse le simple défaut d'affichage. La route déclare
 *    maintenant la fonctionnalité indisponible.
 *
 * 3. L'URL audio se calculait par `surah * 10 + ayah`. Pour 40:60, cela donne
 *    460 au lieu de 4170 : le verset du jour jouait l'audio d'un autre verset.
 *    Le service expose déjà `getAbsoluteAyahNumber()` pour cela.
 */

const express = require('express');
const router = express.Router();
const quranApi = require('../services/quranApi');

const INSPIRING_VERSES = [
  { surah: 2, ayah: 286, theme: 'patience' },
  { surah: 3, ayah: 139, theme: 'hope' },
  { surah: 94, ayah: 5, theme: 'ease' },
  { surah: 94, ayah: 6, theme: 'ease' },
  { surah: 2, ayah: 152, theme: 'remembrance' },
  { surah: 13, ayah: 28, theme: 'peace' },
  { surah: 29, ayah: 69, theme: 'guidance' },
  { surah: 65, ayah: 3, theme: 'trust' },
  { surah: 39, ayah: 53, theme: 'mercy' },
  { surah: 40, ayah: 60, theme: 'dua' },
];

const TRADUCTIONS = { fr: 'fr.hamidullah', en: 'en.sahih' };

/**
 * Compose un verset complet à partir de sa référence. Renvoie `null` si le
 * texte arabe n'a pas pu être obtenu : mieux vaut ne rien afficher qu'un
 * substitut.
 */
async function composerVerset({ surah, ayah, theme }, langue = 'fr') {
  const edition = TRADUCTIONS[langue] ?? TRADUCTIONS.en;

  // Les deux appels sont indépendants : une traduction indisponible ne doit
  // pas empêcher d'afficher le texte arabe, qui est l'essentiel.
  const [arabe, traduction] = await Promise.all([
    quranApi.getAyah(surah, ayah, 'quran-uthmani'),
    quranApi.getAyah(surah, ayah, edition).catch(() => null),
  ]);

  if (!arabe?.text) return null;

  const numeroAbsolu = quranApi.getAbsoluteAyahNumber(surah, ayah);

  return {
    surah,
    ayah,
    theme,
    surahName: arabe.surah?.englishName ?? arabe.surah?.name,
    text: arabe.text,
    translation: traduction?.text ?? null,
    translationLanguage: traduction ? langue : null,
    audioUrl: numeroAbsolu
      ? `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${numeroAbsolu}.mp3`
      : null,
  };
}

/** GET /verse/daily — le même verset pour toute la journée. */
router.get('/daily', async (req, res, next) => {
  try {
    const jour = Math.floor(Date.now() / 86400000);
    const reference = INSPIRING_VERSES[jour % INSPIRING_VERSES.length];
    const verset = await composerVerset(reference, req.query.lang);

    if (!verset) {
      // 503 plutôt que 200 avec un contenu de remplacement : le client doit
      // pouvoir distinguer « indisponible » de « voici le verset ».
      return res.status(503).json({
        success: false,
        error: 'Texte coranique indisponible pour le moment.',
        reference: { surah: reference.surah, ayah: reference.ayah },
      });
    }

    res.json({ success: true, data: { verse: verset } });
  } catch (error) {
    next(error);
  }
});

/** GET /verse/random — explicitement aléatoire, contrairement au précédent. */
router.get('/random', async (req, res, next) => {
  try {
    const { theme } = req.query;
    const pool = theme ? INSPIRING_VERSES.filter((v) => v.theme === theme) : INSPIRING_VERSES;
    if (pool.length === 0) {
      return res.status(404).json({ success: false, error: 'Aucun verset pour ce thème.' });
    }

    const reference = pool[Math.floor(Math.random() * pool.length)];
    const verset = await composerVerset(reference, req.query.lang);

    if (!verset) {
      return res.status(503).json({ success: false, error: 'Texte coranique indisponible pour le moment.' });
    }

    res.json({ success: true, data: { verse: verset } });
  } catch (error) {
    next(error);
  }
});

/** GET /verse/theme/:theme — les versets d'un thème, avec leur texte réel. */
router.get('/theme/:theme', async (req, res, next) => {
  try {
    const limite = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 20);
    const references = INSPIRING_VERSES.filter((v) => v.theme === req.params.theme).slice(0, limite);

    const versets = (
      await Promise.all(references.map((r) => composerVerset(r, req.query.lang)))
    ).filter(Boolean);

    res.json({
      success: true,
      data: {
        theme: req.params.theme,
        count: versets.length,
        // Signalé explicitement : sans cela, une source indisponible
        // ressemblerait à un thème qui contient moins de versets.
        incomplete: versets.length < references.length,
        verses: versets,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** GET /verse/themes — la liste réelle des thèmes disponibles. */
router.get('/themes', (req, res) => {
  const themes = [...new Set(INSPIRING_VERSES.map((v) => v.theme))];
  res.json({ success: true, data: { themes } });
});

/**
 * GET /verse/tafsir/:surah/:ayah
 *
 * Volontairement indisponible. Cette route servait un texte inventé signé
 * « Ibn Kathir » et « Al-Tabari ». Servir un exégèse demande une source
 * réelle et correctement créditée ; en attendant, l'absence est déclarée.
 */
router.get('/tafsir/:surah/:ayah', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Le commentaire de verset n’est pas encore disponible.',
    detail:
      'Cette fonctionnalité exige une source d’exégèse réelle et créditée. ' +
      'Aucun texte n’est renvoyé plutôt qu’un contenu attribué à tort.',
  });
});

module.exports = router;
