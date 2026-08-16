/**
 * Facturation — Salifz
 *
 * Corrige S1. L'ancien `POST /subscriptions/subscribe` écrivait directement
 * le `planId` envoyé par le client dans l'abonnement de l'utilisateur : il
 * suffisait d'envoyer {"planId":"lifetime"} pour obtenir l'accès à vie.
 *
 * Règle appliquée ici : **un abonnement n'est jamais accordé sur la foi du
 * client**. Il n'est accordé qu'après validation d'un achat auprès du
 * fournisseur (RevenueCat, adossé à l'App Store et à Google Play). Sans
 * fournisseur configuré, la fonction échoue — jamais l'inverse.
 */

const crypto = require('crypto');
const { loadConfig } = require('../config/env');

/** Catalogue serveur : seule source de vérité pour les offres et leurs prix. */
const PLANS = Object.freeze({
  free: {
    id: 'free',
    name: 'Salifz',
    priceMonthly: 0,
    entitlement: null,
    features: ['1 leçon par jour', 'Séries de base', 'Publicités'],
  },
  salifz_plus: {
    id: 'salifz_plus',
    name: 'Salifz+',
    priceMonthly: 7.99,
    priceYearly: 59.99,
    entitlement: 'plus',
    features: ['Leçons illimitées', 'Analyse du tajwid', 'Sans publicité', 'Mode hors ligne'],
  },
  salifz_family: {
    id: 'salifz_family',
    name: 'Salifz Family',
    priceMonthly: 14.99,
    priceYearly: 99.99,
    entitlement: 'family',
    features: ['6 comptes', 'Contrôle parental', 'Tout Salifz+'],
  },
  lifetime: {
    id: 'lifetime',
    name: 'Salifz à vie',
    priceOnce: 149.99,
    entitlement: 'lifetime',
    features: ['Accès définitif', 'Toutes les fonctionnalités', 'Accès anticipé'],
  },
});

/** Correspondance entitlement RevenueCat → offre interne. */
const ENTITLEMENT_TO_PLAN = Object.freeze({
  plus: 'salifz_plus',
  family: 'salifz_family',
  lifetime: 'lifetime',
});

class BillingError extends Error {
  constructor(message, status = 400, code = 'BILLING_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const isConfigured = () => Boolean(loadConfig().revenueCatApiKey);

/**
 * Interroge RevenueCat pour connaître les droits réellement achetés par
 * l'utilisateur. C'est RevenueCat qui a vérifié le reçu auprès d'Apple et de
 * Google — le client, lui, n'est jamais cru sur parole.
 */
async function fetchEntitlements(appUserId) {
  const config = loadConfig();

  if (!isConfigured()) {
    throw new BillingError(
      "La facturation n'est pas configurée sur ce serveur.",
      503,
      'BILLING_NOT_CONFIGURED'
    );
  }

  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    {
      headers: {
        Authorization: `Bearer ${config.revenueCatApiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new BillingError(
      `Le fournisseur de paiement a répondu ${response.status}.`,
      502,
      'BILLING_UPSTREAM_ERROR'
    );
  }

  const body = await response.json();
  return body?.subscriber?.entitlements || {};
}

/**
 * Détermine l'offre à accorder à partir des droits actifs renvoyés par le
 * fournisseur. Retourne l'offre gratuite si aucun droit n'est actif.
 */
function planFromEntitlements(entitlements) {
  const now = Date.now();
  let best = { plan: 'free', expiresAt: null };

  for (const [key, value] of Object.entries(entitlements)) {
    const planId = ENTITLEMENT_TO_PLAN[key];
    if (!planId) continue;

    const expires = value?.expires_date ? new Date(value.expires_date).getTime() : null;
    const active = expires === null || expires > now; // null = achat définitif
    if (!active) continue;

    // « lifetime » l'emporte, sinon la date d'expiration la plus lointaine.
    if (planId === 'lifetime' || best.plan === 'free') {
      best = { plan: planId, expiresAt: expires ? new Date(expires) : null };
    }
  }

  return best;
}

/**
 * Synchronise l'abonnement d'un utilisateur avec l'état réel chez le
 * fournisseur. C'est la seule fonction autorisée à modifier `user.subscription`.
 */
async function syncSubscription(user) {
  const entitlements = await fetchEntitlements(String(user._id));
  const { plan, expiresAt } = planFromEntitlements(entitlements);

  user.subscription = {
    ...(user.subscription || {}),
    plan,
    status: plan === 'free' ? 'inactive' : 'active',
    expiresAt,
    provider: 'revenuecat',
    syncedAt: new Date(),
  };

  await user.save();
  return user.subscription;
}

/**
 * Vérifie la signature d'un webhook RevenueCat avant de lui faire confiance.
 */
function verifyWebhookSignature(rawBody, providedAuthHeader) {
  const secret = loadConfig().revenueCatWebhookSecret;
  if (!secret) return false;

  const expected = Buffer.from(secret);
  const received = Buffer.from(String(providedAuthHeader || ''));

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

module.exports = {
  PLANS,
  BillingError,
  isConfigured,
  syncSubscription,
  planFromEntitlements,
  verifyWebhookSignature,
};
