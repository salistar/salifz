/**
 * Verification Routes - Salifz Backend
 * SMS, Email, Biometric verification
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');

const otpStore = new Map();

const OTP_TTL_MS = 10 * 60 * 1000;
/** Un code à six chiffres n'offre qu'un million de possibilités : sans plafond
 *  par code, il suffit d'essayer. Le limiteur de débit ne protège que par IP. */
const MAX_ATTEMPTS = 5;

/**
 * `Math.random()` n'est pas cryptographique : son état interne se reconstruit
 * à partir de quelques tirages observés, ce qui rend les codes suivants
 * prévisibles. Un code de vérification doit venir du générateur système.
 */
const generateOTP = () => crypto.randomInt(100000, 1000000).toString();

/**
 * La comparaison `!==` sur des chaînes s'arrête au premier caractère qui
 * diffère : le temps de réponse fuit la longueur du préfixe correct.
 */
function sameCode(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function issueOTP(key) {
  const otp = generateOTP();
  otpStore.set(key, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
  return otp;
}

/**
 * Vérifie et consomme le code. Renvoie un motif d'échec plutôt qu'un booléen :
 * l'appelant doit pouvoir distinguer « expiré » de « épuisé ».
 */
function consumeOTP(key, submitted) {
  const stored = otpStore.get(key);
  if (!stored || Date.now() > stored.expiresAt) {
    otpStore.delete(key);
    return { ok: false, reason: 'expired' };
  }

  stored.attempts += 1;
  if (stored.attempts > MAX_ATTEMPTS) {
    // Le code est brûlé : poursuivre laisserait deviner par épuisement.
    otpStore.delete(key);
    return { ok: false, reason: 'too_many_attempts' };
  }

  if (!sameCode(stored.otp, submitted ?? '')) {
    return { ok: false, reason: 'invalid', remaining: MAX_ATTEMPTS - stored.attempts };
  }

  otpStore.delete(key);
  return { ok: true };
}

const MESSAGES = {
  expired: 'Code expiré ou inexistant',
  too_many_attempts: 'Trop de tentatives — demandez un nouveau code',
  invalid: 'Code invalide',
};

// Sans purge, la Map conserve indéfiniment les codes jamais vérifiés.
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of otpStore) {
    if (now > value.expiresAt) otpStore.delete(key);
  }
}, 5 * 60 * 1000);
sweeper.unref?.();

// Phone SMS OTP
router.post('/phone/send', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number required' });
    const otp = issueOTP(`phone:${phoneNumber}`);
    console.log(`[SMS OTP] ${phoneNumber}: ${otp}`);
    res.json({ success: true, message: 'OTP sent', ...(process.env.NODE_ENV !== 'production' && { simulatedOtp: otp }) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to send OTP' }); }
});

router.post('/phone/verify', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const result = consumeOTP(`phone:${phoneNumber}`, otp);
    if (!result.ok) return res.status(400).json({ success: false, message: MESSAGES[result.reason], remainingAttempts: result.remaining });
    if (req.user) await User.findByIdAndUpdate(req.user.id, { phoneNumber, phoneVerified: true });
    res.json({ success: true, message: 'Phone verified' });
  } catch (error) { res.status(500).json({ success: false, message: 'Verification failed' }); }
});

// Email OTP
router.post('/email/send', async (req, res) => {
  try {
    const { email, type = 'otp' } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    const otp = issueOTP(`email:${email}`);
    console.log(`[Email OTP] ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP sent', ...(process.env.NODE_ENV !== 'production' && { simulatedOtp: otp }) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to send' }); }
});

router.post('/email/verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = consumeOTP(`email:${email}`, otp);
    if (!result.ok) return res.status(400).json({ success: false, message: MESSAGES[result.reason], remainingAttempts: result.remaining });
    if (req.user) await User.findByIdAndUpdate(req.user.id, { emailVerified: true });
    res.json({ success: true, message: 'Email verified' });
  } catch (error) { res.status(500).json({ success: false, message: 'Verification failed' }); }
});

// ---------------------------------------------------------------------------
// Biométrie — délibérément absente du serveur
// ---------------------------------------------------------------------------
// Il existait ici un `POST /biometric/verify` qui émettait un jeton valable
// trente jours à partir du seul `userId` reçu dans le corps de la requête :
// aucune preuve n'était demandée, et le champ `signature` envoyé par le client
// était ignoré. C'était un distributeur de sessions pour n'importe quel compte.
//
// Il n'était pas exploitable en l'état — `biometricEnabled` n'étant pas déclaré
// dans le schéma, Mongoose jetait l'écriture et la route répondait toujours 400
// — mais il se serait ouvert dès la déclaration du champ.
//
// Le remplacer par un vrai protocole (défi signé, clé publique enregistrée à
// l'appairage) serait possible, mais ne servirait à rien ici : une empreinte se
// vérifie sur l'appareil, pas sur le serveur. L'application utilise déjà
// `expo-local-authentication`, qui garde l'accès au jeton stocké localement.
// Le serveur n'a donc pas de rôle dans ce parcours, et aucun écran n'appelait
// ces routes.

module.exports = router;
