/**
 * Auth Routes - Salifz
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const {
  signAccessToken,
  signRefreshToken,
  signResetToken,
  verifyRefreshToken,
  verifyResetToken,
  passwordFingerprint,
} = require('../utils/tokens');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimit');
const { genererQuetesDuJour } = require('../services/dailyQuests');

const router = express.Router();

// Politique de mot de passe. L'ancienne limite était de 6 caractères sans
// aucune contrainte de composition (S15).
const MIN_PASSWORD_LENGTH = 10;

const passwordRules = (field = 'password') =>
  body(field)
    .isString()
    .isLength({ min: MIN_PASSWORD_LENGTH, max: 128 })
    .withMessage(`Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`)
    .matches(/[a-z]/).withMessage('Une minuscule est requise.')
    .matches(/[A-Z]/).withMessage('Une majuscule est requise.')
    .matches(/[0-9]/).withMessage('Un chiffre est requis.');

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  passwordRules('password'),
  body('username').isString().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  body('displayName').optional().isString().isLength({ max: 50 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, username, displayName, language } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      throw new AppError(
        existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken',
        400
      );
    }

    // Create user
    const user = new User({
      email,
      password,
      username,
      displayName: displayName || username,
      profile: {
        language: language || 'ar'
      },
      // Initial daily quests
      dailyQuests: {
        date: new Date(),
        quests: generateDailyQuests()
      }
    });

    await user.save();

    // Generate tokens
    const token = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          gamification: user.gamification,
          subscription: user.subscription
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post('/login', authLimiter, [
  body('emailOrUsername').isString().notEmpty().isLength({ max: 254 }),
  body('password').isString().notEmpty().isLength({ max: 128 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Email/username and password are required'
      });
    }

    const { emailOrUsername, password } = req.body;

    // Find user
    const user = await User.findByCredentials(emailOrUsername);

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const token = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          avatarCustomization: user.avatarCustomization,
          profile: user.profile,
          gamification: user.gamification,
          quranProgress: user.quranProgress,
          subscription: user.subscription,
          dailyQuests: user.dailyQuests
        },
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }

    // Vérifie la signature ET le type : un jeton d'accès ou de reset présenté
    // ici est rejeté (S2).
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive || user.status === 'banned' || user.status === 'suspended') {
      throw new AppError('Session invalide', 401);
    }

    // Rotation : chaque rafraîchissement émet une nouvelle paire.
    const newToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail()
], async (req, res, next) => {
  // Réponse identique dans tous les cas : elle ne doit jamais permettre de
  // savoir si une adresse est enregistrée.
  const genericResponse = {
    success: true,
    message: 'Si cette adresse est enregistrée, un email de réinitialisation a été envoyé.'
  };

  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.json(genericResponse);
    }

    // Le jeton porte une empreinte du hash de mot de passe actuel : il devient
    // caduc dès que le mot de passe change, donc utilisable une seule fois.
    const resetToken = signResetToken(user._id, passwordFingerprint(user.password));

    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await user.save();

    await sendPasswordResetEmail(user, resetToken);

    // S3 : le jeton était renvoyé dans la réponse HTTP dès que
    // NODE_ENV !== 'production'. Chaîné à S2, cela permettait de prendre le
    // contrôle de n'importe quel compte à partir de sa seule adresse email.
    // Il ne quitte plus le serveur que par email.
    return res.json(genericResponse);
  } catch (error) {
    next(error);
  }
});

/**
 * Envoi de l'email de réinitialisation.
 * Hors production, le lien est écrit dans les logs serveur — accessible au
 * développeur, jamais au client HTTP.
 */
async function sendPasswordResetEmail(user, resetToken) {
  const appUrl = process.env.APP_URL || 'https://salifz.com';
  const resetLink = `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUTH] Lien de réinitialisation pour ${user.email} : ${resetLink}`);
    return;
  }

  const mailer = require('../services/mailer');
  await mailer.sendPasswordReset(user.email, resetLink, user.displayName);
}

/**
 * POST /api/v1/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', passwordResetLimiter, [
  body('token').isString().notEmpty(),
  passwordRules('password')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe invalide',
        details: errors.array()
      });
    }

    const { token, password } = req.body;

    // Signature, type et secret dédié vérifiés d'un coup.
    const decoded = verifyResetToken(token);

    const user = await User.findOne({
      _id: decoded.sub,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password');

    if (!user) {
      throw new AppError('Jeton de réinitialisation invalide ou expiré', 400);
    }

    // Usage unique : si le mot de passe a déjà changé depuis l'émission du
    // jeton, l'empreinte ne correspond plus.
    if (decoded.pwd !== passwordFingerprint(user.password)) {
      throw new AppError('Ce lien de réinitialisation a déjà été utilisé', 400);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé. Reconnectez-vous.'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return next(new AppError('Jeton de réinitialisation invalide ou expiré', 400));
    }
    next(error);
  }
});

// Voir `services/dailyQuests.js` — définition unique, partagée avec
// `routes/gamification.js`.
const generateDailyQuests = () => genererQuetesDuJour();

module.exports = router;
