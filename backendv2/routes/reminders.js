/**
 * Reminders Routes - Salifz
 */
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      reminders: [
        { id: 'morning', type: 'daily', title: { ar: 'الحفظ الصباحي', en: 'Morning Memorization' }, time: '06:00', enabled: true },
        { id: 'evening', type: 'daily', title: { ar: 'مراجعة المساء', en: 'Evening Review' }, time: '20:00', enabled: true },
        { id: 'streak', type: 'smart', title: { ar: 'لا تكسر سلسلتك!', en: "Don't break your streak!" }, time: '21:00', enabled: true }
      ]
    }
  });
});

router.post('/', (req, res) => {
  const { title, time, type, days } = req.body;
  res.status(201).json({ success: true, data: { reminder: { id: `rem_${Date.now()}`, title, time, type: type || 'daily', days: days || ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'], enabled: true } } });
});

router.put('/:id', (req, res) => {
  res.json({ success: true, data: { reminder: { id: req.params.id, ...req.body } } });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Reminder deleted' });
});

module.exports = router;
