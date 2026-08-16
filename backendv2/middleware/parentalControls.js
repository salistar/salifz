/**
 * Application du contrôle parental — Salifz
 *
 * Corrige S13. `parentalControls.contentRestrictions` et `dailyTimeLimit`
 * étaient écrits à la création du compte enfant, puis **jamais relus** : un
 * compte enfant pouvait discuter et passer des appels vidéo sans aucune
 * restriction. C'est bloquant pour Google Play Families et l'App Store.
 */

/** Restrictions reconnues, et fonctionnalités qu'elles couvrent. */
const RESTRICTIONS = Object.freeze({
  chat: ['chat', 'messages', 'halaqa_chat'],
  video_call: ['video_call'],
  audio_call: ['audio_call'],
  social: ['friends', 'profiles', 'leaderboard'],
});

const isChild = (user) => Boolean(user?.parentalControls?.isChildAccount);

/** L'utilisateur a-t-il le droit d'accéder à cette fonctionnalité ? */
function isFeatureAllowed(user, feature) {
  if (!isChild(user)) return true;

  const restrictions = user.parentalControls?.contentRestrictions || [];
  return !restrictions.some((r) => (RESTRICTIONS[r] || [r]).includes(feature));
}

/** Le temps d'écran du jour est-il dépassé ? */
function isTimeLimitReached(user) {
  if (!isChild(user)) return false;

  const limit = user.parentalControls?.dailyTimeLimit;
  if (!limit || limit <= 0) return false;

  const usage = user.parentalControls?.usageToday;
  const today = new Date().toISOString().slice(0, 10);

  if (!usage || usage.date !== today) return false;
  return (usage.minutes || 0) >= limit;
}

/**
 * Middleware Express : bloque une route si la fonctionnalité est restreinte
 * pour ce compte enfant, ou si le temps d'écran du jour est épuisé.
 *
 *   router.use('/chat', auth, requireFeature('chat'), chatRouter);
 */
const requireFeature = (feature) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Authentification requise.' });
  }

  if (!isFeatureAllowed(req.user, feature)) {
    return res.status(403).json({
      success: false,
      error: 'Cette fonctionnalité est désactivée par le contrôle parental.',
      code: 'PARENTAL_RESTRICTED',
      feature,
    });
  }

  if (isTimeLimitReached(req.user)) {
    return res.status(403).json({
      success: false,
      error: "Le temps d'utilisation quotidien est atteint.",
      code: 'PARENTAL_TIME_LIMIT',
      dailyTimeLimit: req.user.parentalControls.dailyTimeLimit,
    });
  }

  return next();
};

/**
 * Équivalent pour Socket.IO : à appeler avant de laisser un enfant rejoindre
 * un salon de discussion ou démarrer un appel.
 */
function socketFeatureAllowed(user, feature) {
  return isFeatureAllowed(user, feature) && !isTimeLimitReached(user);
}

/**
 * Incrémente le compteur de temps d'écran du jour. Appelé par les routes de
 * progression, qui sont le signal d'activité le plus fiable.
 */
async function trackUsage(user, minutes = 1) {
  if (!isChild(user)) return;

  const today = new Date().toISOString().slice(0, 10);
  const usage = user.parentalControls.usageToday;

  if (!usage || usage.date !== today) {
    user.parentalControls.usageToday = { date: today, minutes };
  } else {
    usage.minutes = (usage.minutes || 0) + minutes;
  }

  await user.save();
}

module.exports = {
  RESTRICTIONS,
  isChild,
  isFeatureAllowed,
  isTimeLimitReached,
  requireFeature,
  socketFeatureAllowed,
  trackUsage,
};
