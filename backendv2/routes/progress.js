/**
 * Progress Routes - Salifz
 */
const express = require('express');
const SurahProgress = require('../models/SurahProgress');
const { SURAH_DATA } = require('../models/Quran');
const router = express.Router();

router.get('/overview', async (req, res, next) => {
  try {
    const stats = await SurahProgress.getUserOverallProgress(req.userId);
    res.json({ success: true, data: { progress: stats, quranProgress: req.user.quranProgress } });
  } catch (error) { next(error); }
});

router.get('/surah/:number', async (req, res, next) => {
  try {
    let progress = await SurahProgress.findOne({ userId: req.userId, surahNumber: parseInt(req.params.number) });
    if (!progress) {
      const surahData = SURAH_DATA.find(s => s.number === parseInt(req.params.number));
      if (!surahData) return res.status(404).json({ success: false, error: 'Surah not found' });
      progress = { surahNumber: surahData.number, surahName: surahData.englishName, status: 'not_started', progressPercentage: 0 };
    }
    res.json({ success: true, data: { progress } });
  } catch (error) { next(error); }
});

router.post('/surah/:number/verse/:ayah', async (req, res, next) => {
  try {
    const { status, tajwidScore } = req.body;
    const surahNumber = parseInt(req.params.number);
    const ayahNumber = parseInt(req.params.ayah);
    
    let progress = await SurahProgress.findOne({ userId: req.userId, surahNumber });
    if (!progress) {
      const surahData = SURAH_DATA.find(s => s.number === surahNumber);
      progress = new SurahProgress({
        userId: req.userId,
        surahNumber,
        surahName: surahData.englishName,
        surahNameArabic: surahData.name,
        totalAyat: surahData.ayahs,
        startedAt: new Date()
      });
    }
    
    await progress.updateVerseStatus(ayahNumber, status, tajwidScore);
    
    // Update user stats
    if (status === 'memorized') {
      req.user.quranProgress.totalVersesMemorized = await getTotalMemorized(req.userId);
      await req.user.save();
    }
    
    res.json({ success: true, data: { progress } });
  } catch (error) { next(error); }
});

router.post('/session', async (req, res, next) => {
  try {
    const { surahNumber, duration, versesStudied, type, xpEarned } = req.body;
    let progress = await SurahProgress.findOne({ userId: req.userId, surahNumber });
    if (progress) {
      await progress.addSession({ startedAt: new Date(), duration, versesStudied, type, xpEarned });
    }
    res.json({ success: true, message: 'Session recorded' });
  } catch (error) { next(error); }
});

router.get('/review-queue', async (req, res, next) => {
  try {
    const allProgress = await SurahProgress.find({ userId: req.userId, status: { $ne: 'not_started' } });
    const reviewQueue = [];
    allProgress.forEach(p => {
      const verses = p.getVersesForReview();
      verses.forEach(v => reviewQueue.push({ surahNumber: p.surahNumber, surahName: p.surahName, ayah: v.ayahNumber, confidence: v.confidence }));
    });
    reviewQueue.sort((a, b) => a.confidence - b.confidence);
    res.json({ success: true, data: { reviewQueue: reviewQueue.slice(0, 20) } });
  } catch (error) { next(error); }
});

async function getTotalMemorized(userId) {
  const result = await SurahProgress.aggregate([
    { $match: { userId } },
    { $group: { _id: null, total: { $sum: '$ayatMemorized' } } }
  ]);
  return result[0]?.total || 0;
}

module.exports = router;
