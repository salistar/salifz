/**
 * Daily Verse & Tafsir Routes - Salifz
 * Verset du jour avec Tafsir
 */

const express = require('express');
const router = express.Router();

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

const VERSE_DATA = {
  '2:286': { ar: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا', en: 'Allah does not burden a soul beyond that it can bear' },
  '94:5': { ar: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', en: 'For indeed, with hardship comes ease' },
  '13:28': { ar: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', en: 'Verily, in the remembrance of Allah do hearts find rest' },
};

// Verset du jour
router.get('/daily', (req, res) => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const selected = INSPIRING_VERSES[dayOfYear % INSPIRING_VERSES.length];
  const key = `${selected.surah}:${selected.ayah}`;
  const data = VERSE_DATA[key] || { ar: `آية ${selected.ayah}`, en: `Verse ${selected.ayah}` };

  res.json({
    success: true,
    data: {
      verse: {
        surah: selected.surah,
        ayah: selected.ayah,
        theme: selected.theme,
        text: { ar: data.ar },
        translation: { en: data.en },
        audioUrl: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${selected.surah * 10 + selected.ayah}.mp3`
      }
    }
  });
});

// Tafsir d'un verset
router.get('/tafsir/:surah/:ayah', (req, res) => {
  const { surah, ayah } = req.params;
  const { lang = 'en' } = req.query;

  res.json({
    success: true,
    data: {
      tafsir: {
        surah: parseInt(surah),
        ayah: parseInt(ayah),
        sources: [
          { name: 'Ibn Kathir', text: `Tafsir Ibn Kathir for Surah ${surah}, Ayah ${ayah}`, language: lang },
          { name: 'Al-Tabari', text: 'Additional scholarly interpretation...', language: lang }
        ],
        keywords: ['patience', 'faith', 'trust'],
        lessonsLearned: [
          { ar: 'الصبر مفتاح الفرج', en: 'Patience is the key to relief' },
          { ar: 'التوكل على الله', en: 'Trust in Allah' }
        ]
      }
    }
  });
});

// Versets par thème
router.get('/theme/:theme', (req, res) => {
  const { theme } = req.params;
  const { limit = 10 } = req.query;
  const verses = INSPIRING_VERSES.filter(v => v.theme === theme).slice(0, parseInt(limit));
  res.json({ success: true, data: { theme, count: verses.length, verses } });
});

// Verset aléatoire
router.get('/random', (req, res) => {
  const { theme } = req.query;
  let pool = INSPIRING_VERSES;
  if (theme) pool = pool.filter(v => v.theme === theme);
  const verse = pool[Math.floor(Math.random() * pool.length)];
  res.json({ success: true, data: { verse } });
});

module.exports = router;
