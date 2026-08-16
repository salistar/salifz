/**
 * Audio Routes - Salifz
 * Quran audio streaming using external APIs
 */

const express = require('express');
const QuranApiService = require('../services/quranApi');

const router = express.Router();

/**
 * GET /api/v1/audio/ayah/:surah/:ayah
 * Get audio URL for specific ayah
 */
router.get('/ayah/:surah/:ayah', async (req, res, next) => {
  try {
    const { surah, ayah } = req.params;
    const { reciter } = req.query;
    
    const audio = await QuranApiService.getAyahAudio(
      parseInt(surah),
      parseInt(ayah),
      reciter || 'mishary'
    );
    
    res.json({
      success: true,
      data: {
        surah: parseInt(surah),
        ayah: parseInt(ayah),
        reciter: reciter || 'mishary',
        audio
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/audio/surah/:number
 * Get audio URLs for entire surah
 */
router.get('/surah/:number', async (req, res, next) => {
  try {
    const { number } = req.params;
    const { reciter } = req.query;
    const { SURAH_DATA } = require('../models/Quran');
    
    const surahData = SURAH_DATA.find(s => s.number === parseInt(number));
    if (!surahData) {
      return res.status(404).json({
        success: false,
        error: 'Surah not found'
      });
    }
    
    // Get audio for first few ayahs (don't load all at once)
    const audioUrls = [];
    const limit = Math.min(surahData.ayahs, 10);
    
    for (let i = 1; i <= limit; i++) {
      const audio = await QuranApiService.getAyahAudio(
        parseInt(number),
        i,
        reciter || 'mishary'
      );
      audioUrls.push({
        ayah: i,
        ...audio
      });
    }
    
    res.json({
      success: true,
      data: {
        surah: parseInt(number),
        surahName: surahData.name,
        totalAyahs: surahData.ayahs,
        reciter: reciter || 'mishary',
        audioUrls,
        hasMore: surahData.ayahs > limit
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/audio/reciters
 * Get available reciters
 */
router.get('/reciters', async (req, res, next) => {
  try {
    const reciters = await QuranApiService.getReciters();
    
    // Add our custom formatted list
    const formattedReciters = [
      { id: 'mishary', name: 'Mishary Rashid Alafasy', nameAr: 'مشاري راشد العفاسي', apiId: 7 },
      { id: 'abdul_basit', name: 'Abdul Basit Abdul Samad', nameAr: 'عبد الباسط عبد الصمد', apiId: 1 },
      { id: 'sudais', name: 'Abdurrahman As-Sudais', nameAr: 'عبدالرحمن السديس', apiId: 5 },
      { id: 'shuraym', name: 'Saud Al-Shuraim', nameAr: 'سعود الشريم', apiId: 6 },
      { id: 'husary', name: 'Mahmoud Khalil Al-Husary', nameAr: 'محمود خليل الحصري', apiId: 2 },
      { id: 'minshawi', name: 'Mohamed Siddiq El-Minshawi', nameAr: 'محمد صديق المنشاوي', apiId: 3 },
      { id: 'ajamy', name: 'Ahmed Al-Ajamy', nameAr: 'أحمد العجمي', apiId: 4 },
      { id: 'ghamdi', name: 'Saad Al-Ghamdi', nameAr: 'سعد الغامدي', apiId: 8 }
    ];
    
    res.json({
      success: true,
      data: {
        reciters: formattedReciters
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/audio/word-by-word/:surah/:ayah
 * Get word-by-word data for ayah
 */
router.get('/word-by-word/:surah/:ayah', async (req, res, next) => {
  try {
    const { surah, ayah } = req.params;
    
    const words = await QuranApiService.getWordByWord(
      parseInt(surah),
      parseInt(ayah)
    );
    
    res.json({
      success: true,
      data: {
        surah: parseInt(surah),
        ayah: parseInt(ayah),
        words
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;