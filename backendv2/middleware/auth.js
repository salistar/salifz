/**
 * Authentication Middleware - Salifz
 * ✅ FIXED: Check both decoded.id AND decoded.userId
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware d'authentification obligatoire
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token manquant.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token invalide.'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ FIXED: Check multiple possible ID fields
    const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
    
    if (!userId) {
      console.error('[AUTH] No user ID in token:', decoded);
      return res.status(401).json({
        success: false,
        message: 'Token invalide - ID manquant.'
      });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.error('[AUTH] User not found for ID:', userId);
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }
    
    if (user.status === 'banned' || user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Compte suspendu ou banni.'
      });
    }
    
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification.'
    });
  }
};

/**
 * Middleware d'authentification optionnelle
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      req.user = null;
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
    const user = await User.findById(userId).select('-password');
    
    req.user = user || null;
    req.userId = user?._id || null;
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

/**
 * Middleware pour vérifier le rôle admin
 */
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token manquant.'
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }
    
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Privilèges administrateur requis.'
      });
    }
    
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Erreur d\'authentification.'
    });
  }
};

/**
 * Middleware pour vérifier l'abonnement premium
 */
const premiumAuth = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise.'
      });
    }
    
    const isPremium = req.user.subscription?.plan !== 'free' && 
                      req.user.subscription?.status === 'active' &&
                      new Date(req.user.subscription?.expiresAt) > new Date();
    
    if (!isPremium) {
      return res.status(403).json({
        success: false,
        message: 'Abonnement premium requis.',
        code: 'PREMIUM_REQUIRED'
      });
    }
    
    next();
  } catch (error) {
    console.error('Premium auth error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur de vérification de l\'abonnement.'
    });
  }
};

// ✅ FIXED: Export all variations for compatibility
module.exports = auth;
module.exports.auth = auth;
module.exports.protect = auth;
module.exports.authMiddleware = auth;
module.exports.optionalAuth = optionalAuth;
module.exports.adminAuth = adminAuth;
module.exports.premiumAuth = premiumAuth;