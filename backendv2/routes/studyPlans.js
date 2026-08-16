/**
 * Study Plans Routes - Salifz
 */
const express = require('express');
const router = express.Router();

const PLANS = [
  { id: 'juz_amma_30', name: { ar: 'جزء عم في 30 يوم', en: 'Juz Amma in 30 Days' }, duration: 30, difficulty: 'beginner', dailyVerses: 4, totalVerses: 564 },
  { id: 'baqarah_90', name: { ar: 'البقرة في 90 يوم', en: 'Al-Baqarah in 90 Days' }, duration: 90, difficulty: 'intermediate', dailyVerses: 3, totalVerses: 286 },
  { id: 'quran_3y', name: { ar: 'القرآن في 3 سنوات', en: 'Quran in 3 Years' }, duration: 1095, difficulty: 'advanced', dailyVerses: 6, totalVerses: 6236 }
];

router.get('/', (req, res) => {
  const { difficulty } = req.query;
  let plans = PLANS;
  if (difficulty) plans = plans.filter(p => p.difficulty === difficulty);
  res.json({ success: true, data: { plans } });
});

router.get('/active', (req, res) => {
  res.json({
    success: true,
    data: {
      plan: {
        ...PLANS[0], startDate: new Date(Date.now() - 10 * 86400000).toISOString(), currentDay: 10,
        progress: { versesMemorized: 45, percentComplete: 8, onTrack: true },
        todaySchedule: { newVerses: [{ surah: 87, ayah: 1 }], reviewVerses: 10 }
      }
    }
  });
});

router.post('/:id/start', (req, res) => {
  const plan = PLANS.find(p => p.id === req.params.id);
  if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });
  res.json({ success: true, data: { planId: plan.id, startDate: new Date().toISOString() } });
});

router.post('/custom', (req, res) => {
  const { surahs, dailyVerses } = req.body;
  const totalVerses = surahs?.length * 50 || 100;
  res.json({ success: true, data: { plan: { id: `custom_${Date.now()}`, surahs, dailyVerses, totalVerses, duration: Math.ceil(totalVerses / dailyVerses) } } });
});

module.exports = router;
