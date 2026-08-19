/**
 * Limitation de débit — Salifz
 *
 * Corrige S8 : la v2 avait perdu `express-rate-limit`, présent en v1. Login,
 * inscription, mot de passe oublié et vérification OTP étaient ouverts au
 * bourrinage sans aucune limite.
 *
 * Les compteurs vivent en mémoire. Dès qu'il y a plus d'une instance, il faut
 * brancher un store Redis (`rate-limit-redis`) — voir S16.
 */

const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// `req.ip` brut ne convient pas comme clé : un utilisateur IPv6 dispose d'un
// préfixe entier d'adresses et contournerait la limite en changeant d'adresse.
// `ipKeyGenerator` normalise l'IPv6 sur son préfixe /64.
const clientKey = (req) => ipKeyGenerator(req.ip);

const tooMany = (req, res) =>
  res.status(429).json({
    success: false,
    error: 'Trop de tentatives. Réessayez dans quelques minutes.',
    code: 'RATE_LIMITED',
  });

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooMany,
};

/** Filet général sur toute l'API. */
const globalLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 120,
});

/**
 * Connexion et inscription. Compté par IP *et* par identifiant visé, pour
 * qu'un attaquant distribué ne puisse pas cibler un compte précis.
 */
const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const identifier = String(req.body?.emailOrUsername || req.body?.email || '').toLowerCase();
    return `${clientKey(req)}|${identifier}`;
  },
});

/** Mot de passe oublié : volontairement très strict. */
const passwordResetLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => `${clientKey(req)}|${String(req.body?.email || '').toLowerCase()}`,
});

/** Envoi et vérification de codes OTP (SMS/email). */
const otpLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 6,
});

/**
 * Routes coûteuses côté serveur : upload audio pour le tajwid, analyses, IA.
 */
const heavyLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 10,
});

// Suivi de récitation en direct. `heavyLimiter` (10/min) couperait un
// utilisateur légitime : réciter en continu par extraits de 5 secondes émet
// une douzaine d'appels par minute. La limite reste basse pour autant — chaque
// extrait coûte plus de temps de calcul que sa propre durée sur un serveur
// sans carte graphique, et trente par minute saturent déjà un cœur.
const recitationLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 30,
});

module.exports = {
  globalLimiter,
  authLimiter,
  passwordResetLimiter,
  otpLimiter,
  heavyLimiter,
  recitationLimiter,
};
