/**
 * Bookmarks & Notes Routes - Salifz
 */
const express = require('express');
const router = express.Router();

// Bookmarks
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      bookmarks: [
        { id: 'bm1', surah: 2, ayah: 255, label: 'آية الكرسي', color: '#4CAF50' },
        { id: 'bm2', surah: 36, ayah: 1, label: 'سورة يس', color: '#2196F3' }
      ]
    }
  });
});

router.post('/', (req, res) => {
  const { surah, ayah, label, color } = req.body;
  res.status(201).json({ success: true, data: { bookmark: { id: `bm_${Date.now()}`, surah, ayah, label, color: color || '#4CAF50' } } });
});

router.delete('/:id', (req, res) => {
  res.json({ success: true, message: 'Bookmark deleted' });
});

// Notes
router.get('/notes', (req, res) => {
  res.json({
    success: true,
    data: {
      notes: [{ id: 'n1', surah: 2, ayah: 255, content: 'أعظم آية في القرآن', tags: ['مهم'] }]
    }
  });
});

router.post('/notes', (req, res) => {
  const { surah, ayah, content, tags } = req.body;
  res.status(201).json({ success: true, data: { note: { id: `note_${Date.now()}`, surah, ayah, content, tags: tags || [] } } });
});

router.put('/notes/:id', (req, res) => {
  res.json({ success: true, data: { note: { id: req.params.id, ...req.body } } });
});

router.delete('/notes/:id', (req, res) => {
  res.json({ success: true, message: 'Note deleted' });
});

module.exports = router;
