/**
 * Middleware d'authentification — Salifz
 *
 * Middleware unique de l'application. Il remplace la copie concurrente qui
 * vivait dans routes/index.js et qui, elle, ne vérifiait ni le type de jeton
 * (S2), ni le statut du compte (S10), et retombait sur un secret en dur (S7).
 */

const User = require('../models/User');
const { verifyAccessToken, bearerFrom } = require('../utils/tokens');

/** Champs jamais renvoyés au client ni chargés inutilement. */
const SAFE_PROJECTION = '-password -resetPasswordToken -resetPasswordExpires';

const unauthorized = (res, message = 'Authentification requise.') =>
  res.status(401).json({ success: false, error: message, code: 'UNAUTHENTICATED' });

/**
 * Charge l'utilisateur d'un jeton d'accès valide et vérifie que le compte
 * est utilisable. Renvoie l'utilisateur, ou lève une erreur porteuse d'un
 * statut HTTP.
 */
async function resolveUser(token) {
  const payload = verifyAccessToken(token); // rejette refresh et reset
  const user = await User.findById(payload.sub).select(SAFE_PROJECTION);

  if (!user) {
    const error = new Error('Utilisateur introuvable.');
    error.status = 401;
    throw error;
  }

  // S10 : ces contrôles ne s'appliquaient qu'à 3 routes sur 28.
  if (user.status === 'banned' || user.status === 'suspended') {
    const error = new Error('Compte suspendu ou banni.');
    error.status = 403;
    error.code = 'ACCOUNT_BLOCKED';
    throw error;
  }

  if (user.isActive === false) {
    const error = new Error('Compte désactivé.');
    error.status = 403;
    error.code = 'ACCOUNT_INACTIVE';
    throw error;
  }

  return user;
}

/** Authentification obligatoire. */
const auth = async (req, res, next) => {
  const token = bearerFrom(req.headers.authorization);
  if (!token) return unauthorized(res, 'Jeton manquant.');

  try {
    const user = await resolveUser(token);
    req.user = user;
    req.userId = user._id;
    return next();
  } catch (error) {
    if (error.status === 403) {
      return res.status(403).json({ success: false, error: error.message, code: error.code });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Jeton expiré.', code: 'TOKEN_EXPIRED' });
    }
    // Signature invalide, mauvais type de jeton, issuer/audience incorrects :
    // même réponse pour tous, afin de ne rien apprendre à un attaquant.
    return unauthorized(res, 'Jeton invalide.');
  }
};

/** Authentification facultative : ne bloque jamais, renseigne req.user si possible. */
const optionalAuth = async (req, res, next) => {
  const token = bearerFrom(req.headers.authorization);
  if (!token) {
    req.user = null;
    req.userId = null;
    return next();
  }

  try {
    const user = await resolveUser(token);
    req.user = user;
    req.userId = user._id;
  } catch {
    req.user = null;
    req.userId = null;
  }
  return next();
};

/** Réservé aux administrateurs. */
const adminAuth = (req, res, next) =>
  auth(req, res, () => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error: 'Privilèges administrateur requis.',
        code: 'FORBIDDEN',
      });
    }
    return next();
  });

/** Réservé aux abonnés actifs. À monter après `auth`. */
const premiumAuth = (req, res, next) => {
  if (!req.user) return unauthorized(res);

  const subscription = req.user.subscription || {};
  const notExpired = !subscription.expiresAt || new Date(subscription.expiresAt) > new Date();
  const isPremium =
    subscription.plan && subscription.plan !== 'free' &&
    subscription.status === 'active' && notExpired;

  if (!isPremium) {
    return res.status(403).json({
      success: false,
      error: 'Abonnement premium requis.',
      code: 'PREMIUM_REQUIRED',
    });
  }
  return next();
};

module.exports = auth;
module.exports.auth = auth;
module.exports.protect = auth;
module.exports.authMiddleware = auth;
module.exports.optionalAuth = optionalAuth;
module.exports.adminAuth = adminAuth;
module.exports.premiumAuth = premiumAuth;
module.exports.resolveUser = resolveUser;
module.exports.SAFE_PROJECTION = SAFE_PROJECTION;
