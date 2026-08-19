/**
 * Users Routes - Salifz
 */
const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const storage = require('../services/storage');
const router = express.Router();

// Photo de profil. En mémoire puis vers le stockage objet : le disque du
// conteneur est éphémère, une image qui y resterait disparaîtrait au
// prochain déploiement.
const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Le type déclaré par le client n'est qu'un premier filtre — le
    // navigateur et le téléphone l'envoient correctement, et le stockage
    // ne sert jamais ce contenu comme du HTML.
    cb(null, /^image\/(jpe?g|png|webp)$/i.test(file.mimetype));
  },
});

/**
 * POST /api/v1/users/avatar
 * Remplace la photo de profil du compte connecté.
 */
router.post('/avatar', uploadAvatar.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image requise (jpeg, png ou webp, 5 Mo max)' });
    }

    // storage.save renvoie la clé (chaîne), pas un objet.
    const cle = await storage.save({
      prefix: 'avatars',
      originalName: req.file.originalname || 'avatar.jpg',
      buffer: req.file.buffer,
      contentType: req.file.mimetype,
    });

    // L'ancienne image est retirée du stockage — sinon chaque changement
    // de photo laisse un orphelin facturé à vie.
    const ancienne = req.user.avatar;
    if (ancienne && ancienne.startsWith('avatars/')) {
      storage.remove(ancienne).catch(() => {});
    }

    req.user.avatar = cle;
    await req.user.save();

    res.json({ success: true, data: { avatar: cle } });
  } catch (error) { next(error); }
});

router.get('/me', (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

router.put('/me', async (req, res, next) => {
  try {
    const allowedUpdates = ['displayName', 'avatar', 'avatarCustomization', 'profile'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'profile') {
          req.user.profile = { ...req.user.profile.toObject(), ...req.body.profile };
        } else {
          req.user[field] = req.body[field];
        }
      }
    });
    await req.user.save();
    res.json({ success: true, data: { user: req.user } });
  } catch (error) { next(error); }
});

router.get('/:userId', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: { user: user.getPublicProfile() } });
  } catch (error) { next(error); }
});

router.delete('/me', async (req, res, next) => {
  try {
    req.user.isActive = false;
    await req.user.save();
    res.json({ success: true, message: 'Account deactivated' });
  } catch (error) { next(error); }
});

module.exports = router;
