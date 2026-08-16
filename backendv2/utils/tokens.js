/**
 * Émission et vérification des jetons — Salifz
 *
 * Corrige S2 : les jetons d'accès, de rafraîchissement et de réinitialisation
 * de mot de passe partageaient le même secret et aucun code ne vérifiait le
 * champ `type`. Un jeton de reset envoyé par email ouvrait donc toute l'API.
 *
 * Deux garde-fous :
 *   1. un secret distinct par type de jeton ;
 *   2. `verify*` refuse tout jeton dont le `type` ne correspond pas.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { loadConfig } = require('../config/env');

const TOKEN_TYPES = Object.freeze({
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET: 'reset',
});

/** Secret associé à chaque type. */
function secretFor(type) {
  const config = loadConfig();
  switch (type) {
    case TOKEN_TYPES.ACCESS: return config.jwtSecret;
    case TOKEN_TYPES.REFRESH: return config.jwtRefreshSecret;
    case TOKEN_TYPES.RESET: return config.jwtResetSecret;
    default: throw new Error(`[TOKENS] Type de jeton inconnu : ${type}`);
  }
}

function sign(type, userId, extraClaims = {}) {
  const config = loadConfig();
  const ttl = {
    [TOKEN_TYPES.ACCESS]: config.accessTokenTtl,
    [TOKEN_TYPES.REFRESH]: config.refreshTokenTtl,
    [TOKEN_TYPES.RESET]: config.resetTokenTtl,
  }[type];

  return jwt.sign(
    { sub: String(userId), type, ...extraClaims },
    secretFor(type),
    {
      expiresIn: ttl,
      issuer: config.issuer,
      audience: config.audience,
      jwtid: crypto.randomUUID(),
    }
  );
}

/**
 * Vérifie un jeton ET son type. Un jeton valide mais du mauvais type est rejeté.
 */
function verify(type, token) {
  const config = loadConfig();

  const payload = jwt.verify(token, secretFor(type), {
    issuer: config.issuer,
    audience: config.audience,
  });

  if (payload.type !== type) {
    const error = new Error(`Jeton de type "${payload.type}" utilisé comme "${type}"`);
    error.name = 'JsonWebTokenError';
    throw error;
  }

  if (!payload.sub) {
    const error = new Error('Jeton sans identifiant utilisateur');
    error.name = 'JsonWebTokenError';
    throw error;
  }

  return payload;
}

const signAccessToken = (userId) => sign(TOKEN_TYPES.ACCESS, userId);
const signRefreshToken = (userId) => sign(TOKEN_TYPES.REFRESH, userId);
const signResetToken = (userId, passwordFingerprint) =>
  sign(TOKEN_TYPES.RESET, userId, { pwd: passwordFingerprint });

const verifyAccessToken = (token) => verify(TOKEN_TYPES.ACCESS, token);
const verifyRefreshToken = (token) => verify(TOKEN_TYPES.REFRESH, token);
const verifyResetToken = (token) => verify(TOKEN_TYPES.RESET, token);

/**
 * Empreinte du hash de mot de passe courant. Placée dans le jeton de reset,
 * elle le rend utilisable une seule fois : dès que le mot de passe change,
 * l'empreinte change et les jetons émis avant deviennent invalides.
 */
function passwordFingerprint(passwordHash) {
  return crypto.createHash('sha256').update(String(passwordHash)).digest('hex').slice(0, 16);
}

/** Extrait le jeton porteur d'un en-tête Authorization. */
function bearerFrom(authorizationHeader) {
  if (!authorizationHeader || typeof authorizationHeader !== 'string') return null;
  if (!authorizationHeader.startsWith('Bearer ')) return null;
  const token = authorizationHeader.slice(7).trim();
  return token || null;
}

module.exports = {
  TOKEN_TYPES,
  signAccessToken,
  signRefreshToken,
  signResetToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyResetToken,
  passwordFingerprint,
  bearerFrom,
};
