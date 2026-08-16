/**
 * Tajwid Analysis Routes - Salifz
 * Analyse de Tajwid avec enregistrement vocal
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Analyser un enregistrement vocal
router.post('/analyze', upload.single('audio'), async (req, res) => {
  try {
    const { surahNumber, ayahNumber } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Audio file required' });
    }

    console.log(`[TAJWID] Analyzing recitation for Surah ${surahNumber}, Ayah ${ayahNumber}`);

    // Simulation d'analyse
    const analysis = {
      surahNumber: parseInt(surahNumber),
      ayahNumber: parseInt(ayahNumber),
      overallScore: 75 + Math.floor(Math.random() * 20),
      rules: [
        { rule: 'idgham', detected: 3, correct: 2, accuracy: 67 },
        { rule: 'ikhfa', detected: 2, correct: 2, accuracy: 100 },
        { rule: 'madd', detected: 5, correct: 4, accuracy: 80 },
        { rule: 'qalqalah', detected: 1, correct: 1, accuracy: 100 }
      ],
      pronunciation: {
        makhraj: { score: 78, feedback: { ar: 'جيد', en: 'Good' } },
        clarity: { score: 82, feedback: { ar: 'ممتاز', en: 'Excellent' } },
        fluency: { score: 75, feedback: { ar: 'حسن', en: 'Good' } }
      },
      feedback: { ar: 'أداء جيد! حاول التركيز على أحكام الإدغام', en: 'Good performance! Focus on Idgham rules' },
      tips: [
        { ar: 'مد الألف في كلمة "الرحمن"', en: 'Elongate the Alif in "Ar-Rahman"' },
        { ar: 'أظهر الإدغام بشكل أوضح', en: 'Make the Idgham more clear' }
      ]
    };

    res.json({ success: true, data: { analysis } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obtenir les règles de Tajwid
router.get('/rules', async (req, res) => {
  const rules = [
    { id: 'idgham', name: { ar: 'إدغام', en: 'Idgham' }, letters: ['ي', 'ر', 'م', 'ل', 'و', 'ن'] },
    { id: 'ikhfa', name: { ar: 'إخفاء', en: 'Ikhfa' }, letters: ['ت', 'ث', 'ج', 'د', 'ذ', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ', 'ف', 'ق', 'ك'] },
    { id: 'iqlab', name: { ar: 'إقلاب', en: 'Iqlab' }, letters: ['ب'] },
    { id: 'izhar', name: { ar: 'إظهار', en: 'Izhar' }, letters: ['ء', 'ه', 'ع', 'ح', 'غ', 'خ'] },
    { id: 'madd', name: { ar: 'مد', en: 'Madd' }, letters: ['ا', 'و', 'ي'] },
    { id: 'qalqalah', name: { ar: 'قلقلة', en: 'Qalqalah' }, letters: ['ق', 'ط', 'ب', 'ج', 'د'] }
  ];
  res.json({ success: true, data: { rules } });
});

// Progression en Tajwid
router.get('/progress', async (req, res) => {
  const progress = {
    overallScore: req.user.quranProgress.avgTajwidScore || 0,
    totalSessions: req.user.quranProgress.totalReviewSessions || 0,
    rulesProgress: {
      idgham: { score: 75, practiced: 45 },
      ikhfa: { score: 68, practiced: 32 },
      iqlab: { score: 82, practiced: 18 },
      izhar: { score: 71, practiced: 28 },
      madd: { score: 65, practiced: 55 },
      qalqalah: { score: 78, practiced: 22 }
    },
    weakAreas: ['madd', 'ikhfa'],
    strongAreas: ['iqlab', 'qalqalah']
  };
  res.json({ success: true, data: { progress } });
});

module.exports = router;
