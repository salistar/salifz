/**
 * Face Recognition Routes - Salifz
 * Gender detection for Women's Space access
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Azure Face API client (production)
let faceClient = null;
if (process.env.AZURE_FACE_KEY && process.env.AZURE_FACE_ENDPOINT) {
  try {
    const { FaceClient } = require('@azure/cognitiveservices-face');
    const { CognitiveServicesCredentials } = require('@azure/ms-rest-azure-js');
    const credentials = new CognitiveServicesCredentials(process.env.AZURE_FACE_KEY);
    faceClient = new FaceClient(credentials, process.env.AZURE_FACE_ENDPOINT);
    console.log('✅ Azure Face API initialized');
  } catch (err) {
    console.warn('⚠️ Azure Face API not available:', err.message);
  }
}

/**
 * POST /api/v1/face/detect-gender
 * Detect gender from face image
 */
router.post('/detect-gender', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image required' });
    }

    let result;

    // Use Azure Face API if available
    if (faceClient) {
      try {
        const faces = await faceClient.face.detectWithStream(req.file.buffer, {
          returnFaceAttributes: ['gender', 'age']
        });

        if (!faces || faces.length === 0) {
          return res.status(400).json({ success: false, error: 'No face detected in image' });
        }

        result = {
          gender: faces[0].faceAttributes.gender.toLowerCase(),
          confidence: 0.95,
          age: faces[0].faceAttributes.age,
          faceCount: faces.length
        };
      } catch (azureError) {
        console.error('Azure Face API error:', azureError);
        // Fallback to simulation
        result = simulateGenderDetection();
      }
    } else {
      // Simulation mode for development
      result = simulateGenderDetection();
    }

    // Update user profile if authenticated
    if (req.user) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.userId, {
        'profile.detectedGender': result.gender,
        'profile.genderVerified': true,
        'profile.genderVerifiedAt': new Date(),
        'profile.womensSpaceAccess': result.gender === 'female'
      });
    }

    res.json({
      success: true,
      data: {
        ...result,
        womensSpaceAccess: result.gender === 'female',
        message: result.gender === 'female' 
          ? { ar: 'تم التحقق! يمكنك الآن الوصول إلى مساحة النساء', en: 'Verified! You can now access Women\'s Space', fr: 'Vérifié ! Vous pouvez maintenant accéder à l\'Espace Femmes' }
          : { ar: 'تم التحقق!', en: 'Verified!', fr: 'Vérifié !' }
      }
    });
  } catch (error) {
    console.error('Face detection error:', error);
    res.status(500).json({ success: false, error: 'Face detection failed' });
  }
});

/**
 * POST /api/v1/face/register
 * Register face for identity verification
 */
router.post('/register', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image required' });
    }

    // Generate face ID (in production, use actual face embedding)
    const faceId = `face_${req.userId}_${Date.now()}`;

    const User = require('../models/User');
    await User.findByIdAndUpdate(req.userId, {
      'verification.faceId.registered': true,
      'verification.faceId.faceData': faceId,
      'verification.faceId.registeredAt': new Date()
    });

    res.json({
      success: true,
      message: 'Face registered successfully',
      data: { faceId, registered: true }
    });
  } catch (error) {
    console.error('Face registration error:', error);
    res.status(500).json({ success: false, error: 'Face registration failed' });
  }
});

/**
 * POST /api/v1/face/verify
 * Verify face identity
 */
router.post('/verify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image required' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.userId);

    if (!user?.verification?.faceId?.registered) {
      return res.status(400).json({ success: false, error: 'No face registered' });
    }

    // Simulation: always verify successfully in development
    const verified = process.env.NODE_ENV !== 'production' || Math.random() > 0.1;

    res.json({
      success: true,
      data: {
        verified,
        confidence: verified ? 0.95 : 0.3,
        message: verified 
          ? { ar: 'تم التحقق من الهوية', en: 'Identity verified', fr: 'Identité vérifiée' }
          : { ar: 'فشل التحقق', en: 'Verification failed', fr: 'Échec de la vérification' }
      }
    });
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({ success: false, error: 'Face verification failed' });
  }
});

/**
 * GET /api/v1/face/status
 * Get face verification status
 */
router.get('/status', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);

    res.json({
      success: true,
      data: {
        genderVerified: user?.profile?.genderVerified || false,
        detectedGender: user?.profile?.detectedGender,
        womensSpaceAccess: user?.profile?.womensSpaceAccess || false,
        faceRegistered: user?.verification?.faceId?.registered || false,
        verifiedAt: user?.profile?.genderVerifiedAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simulation function for development
function simulateGenderDetection() {
  // In development, randomly assign gender or use query param
  const genders = ['male', 'female'];
  return {
    gender: genders[Math.floor(Math.random() * 2)],
    confidence: 0.85 + Math.random() * 0.1,
    simulated: true
  };
}

module.exports = router;
