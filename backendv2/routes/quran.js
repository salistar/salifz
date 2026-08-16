/**
 * Quran Routes - Salifz
 */
const express = require('express');
const { SURAH_DATA, TOTAL_AYAHS } = require('../models/Quran');
const quranApi = require('../services/quranApi');
const router = express.Router();

/**
 * GET /api/v1/quran/page/:number
 * Une page du Mushaf de Médine, découpée ligne par ligne.
 */
router.get('/page/:number', async (req, res, next) => {
  try {
    const data = await quranApi.getPage(req.params.number);
    res.json({ success: true, data });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
});

/** GET /api/v1/quran/page-of/:surah/:ayah — ouvrir le Mushaf sur un verset. */
router.get('/page-of/:surah/:ayah', async (req, res, next) => {
  try {
    const page = await quranApi.getPageForVerse(req.params.surah, req.params.ayah);
    if (!page) return res.status(404).json({ success: false, error: 'Verset introuvable' });
    res.json({ success: true, data: { page } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/quran/word-by-word/:surah/:ayah
 * `getWordByWord` existait dans le service mais n'était exposé par aucune
 * route : la traduction mot-à-mot annoncée au README était inaccessible.
 */
router.get('/word-by-word/:surah/:ayah', async (req, res, next) => {
  try {
    const words = await quranApi.getWordByWord(
      parseInt(req.params.surah, 10),
      parseInt(req.params.ayah, 10)
    );
    res.json({ success: true, data: { words } });
  } catch (error) {
    next(error);
  }
});

router.get('/surahs', (req, res) => {
  res.json({ success: true, data: { surahs: SURAH_DATA, totalAyahs: TOTAL_AYAHS } });
});

router.get('/surahs/:number', (req, res) => {
  const surah = SURAH_DATA.find(s => s.number === parseInt(req.params.number));
  if (!surah) return res.status(404).json({ success: false, error: 'Surah not found' });
  res.json({ success: true, data: { surah } });
});

router.get('/juz/:number', (req, res) => {
  const juzNumber = parseInt(req.params.number);
  if (juzNumber < 1 || juzNumber > 30) {
    return res.status(400).json({ success: false, error: 'Invalid juz number' });
  }
  // Simplified juz mapping
  res.json({ success: true, data: { juz: juzNumber, message: 'Fetch from Quran API' } });
});

router.get('/search', (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ success: false, error: 'Query required' });
  // Implement search logic
  res.json({ success: true, data: { results: [], query: q } });
});

router.get('/reciters', (req, res) => {
  const reciters = [
    { id: 'mishary_rashid', name: 'Mishary Rashid Alafasy', nameAr: 'مشاري راشد العفاسي' },
    { id: 'abdul_basit', name: 'Abdul Basit Abdul Samad', nameAr: 'عبد الباسط عبد الصمد' },
    { id: 'sudais', name: 'Abdurrahman As-Sudais', nameAr: 'عبدالرحمن السديس' },
    { id: 'shuraym', name: 'Saud Al-Shuraim', nameAr: 'سعود الشريم' },
    { id: 'minshawi', name: 'Mohamed Siddiq El-Minshawi', nameAr: 'محمد صديق المنشاوي' },
    { id: 'husary', name: 'Mahmoud Khalil Al-Husary', nameAr: 'محمود خليل الحصري' },
    { id: 'ajamy', name: 'Ahmed Al-Ajamy', nameAr: 'أحمد العجمي' },
    { id: 'ghamdi', name: 'Saad Al-Ghamdi', nameAr: 'سعد الغامدي' }
  ];
  res.json({ success: true, data: { reciters } });
});

module.exports = router;
