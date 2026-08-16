/**
 * Validation de la configuration au démarrage — Salifz
 *
 * Principe : le serveur refuse de démarrer si un secret est absent, trop court
 * ou encore à sa valeur d'exemple. Aucun secret n'a de valeur de repli en dur.
 * (Corrige S7 : `JWT_SECRET || 'salifz_secret_2024'`)
 */

const MIN_SECRET_LENGTH = 32;

// Valeurs livrées dans .env.example : elles ne doivent jamais atteindre un vrai déploiement.
const FORBIDDEN_VALUES = [
  'salifz_secret_2024',
  'salifz_super_secret_key_change_in_production_2024',
  'salifz_refresh_secret_key_change_in_production_2024',
  'salifz_session_secret_change_in_production',
  'your-super-secret-jwt-key-change-in-production',
  'changeme',
  'secret',
];

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Lit un secret obligatoire. Lève une erreur explicite plutôt que de retomber
 * sur une valeur par défaut.
 */
function requireSecret(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(
      `[CONFIG] ${name} est absent. Générez-le avec :\n` +
      `         node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
    );
  }

  if (FORBIDDEN_VALUES.includes(value.trim())) {
    throw new Error(
      `[CONFIG] ${name} utilise encore la valeur d'exemple. Remplacez-la par un secret généré aléatoirement.`
    );
  }

  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[CONFIG] ${name} fait ${value.length} caractères, ${MIN_SECRET_LENGTH} minimum requis.`
    );
  }

  return value;
}

/**
 * Lit une variable optionnelle, avec valeur par défaut autorisée
 * (uniquement pour ce qui n'est pas un secret).
 */
function optional(name, fallback) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

/**
 * Origines autorisées pour CORS. En production, la liste doit être explicite :
 * pas de joker. (Corrige S9)
 */
function corsOrigins() {
  const raw = optional('CORS_ORIGINS', '');
  const list = raw.split(',').map((o) => o.trim()).filter(Boolean);

  if (list.length > 0) return list;

  if (isProduction()) {
    throw new Error(
      '[CONFIG] CORS_ORIGINS est obligatoire en production. ' +
      'Exemple : CORS_ORIGINS=https://app.salifz.com,https://salifz.com'
    );
  }

  // Hors production seulement : Expo Go et le navigateur local.
  return ['http://localhost:8081', 'http://localhost:19006', 'exp://127.0.0.1:8081'];
}

let cached = null;

function loadConfig() {
  if (cached) return cached;

  cached = {
    env: optional('NODE_ENV', 'development'),
    isProduction: isProduction(),
    port: Number(optional('PORT', '8088')),

    mongoUri: optional('MONGODB_URI', 'mongodb://localhost:27017/salifz'),

    // Trois secrets distincts : compromettre l'un ne compromet pas les autres.
    jwtSecret: requireSecret('JWT_SECRET'),
    jwtRefreshSecret: requireSecret('JWT_REFRESH_SECRET'),
    jwtResetSecret: requireSecret('JWT_RESET_SECRET'),

    accessTokenTtl: optional('JWT_EXPIRES_IN', '15m'),
    refreshTokenTtl: optional('JWT_REFRESH_EXPIRES_IN', '30d'),
    resetTokenTtl: optional('JWT_RESET_EXPIRES_IN', '1h'),

    issuer: optional('JWT_ISSUER', 'salifz'),
    audience: optional('JWT_AUDIENCE', 'salifz-app'),

    corsOrigins: corsOrigins(),

    // Facturation : sans clé fournisseur, aucun abonnement ne peut être accordé.
    revenueCatApiKey: optional('REVENUECAT_API_KEY', null),
    revenueCatWebhookSecret: optional('REVENUECAT_WEBHOOK_SECRET', null),
  };

  return cached;
}

module.exports = { loadConfig, requireSecret, optional, MIN_SECRET_LENGTH };
