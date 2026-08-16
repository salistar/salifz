/**
 * Face Recognition Routes - Salifz
 */
const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/verify-gender', upload.single('image'), async (req, res) => {
  try {
    const { expectedGender } = req.body;
    if (!req.file) return res.status(400).json({ success: false, error: 'Image required' });

    // Simulation - en production utiliser Azure Face API ou AWS Rekognition
    const detectedGender = Math.random() > 0.5 ? 'male' : 'female';
    const confidence = 85 + Math.random() * 15;
    const isMatch = detectedGender === expectedGender;

    console.log(`[FACE] Gender verification: expected=${expectedGender}, detected=${detectedGender}, match=${isMatch}`);

    res.json({
      success: true,
      data: {
        verified: isMatch,
        detectedGender,
        confidence: Math.round(confidence),
        message: isMatch ? 'Gender verified successfully' : 'Gender does not match'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/register-face', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Image required' });

    const faceId = `face_${req.userId}_${Date.now()}`;
    req.user.faceId = faceId;
    await req.user.save();

    console.log(`[FACE] Face registered for user ${req.userId}`);

    res.json({ success: true, data: { faceId, message: 'Face registered successfully' } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/verify-identity', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Image required' });
    if (!req.user.faceId) return res.status(400).json({ success: false, error: 'No face registered' });

    // Simulation
    const isMatch = Math.random() > 0.2;
    const confidence = isMatch ? 85 + Math.random() * 15 : 30 + Math.random() * 30;

    res.json({
      success: true,
      data: {
        verified: isMatch,
        confidence: Math.round(confidence),
        message: isMatch ? 'Identity verified' : 'Face does not match'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
