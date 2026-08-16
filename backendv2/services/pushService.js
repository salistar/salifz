/**
 * Envoi de notifications push — Salifz
 *
 * Passe par le service push d'Expo, qui relaie vers FCM (Android) et APNs
 * (iOS) sans exiger de certificat côté serveur.
 *
 * Corrige la fonctionnalité 39, annoncée mais jamais implémentée.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100; // limite imposée par Expo

const isExpoToken = (token) =>
  typeof token === 'string' && /^ExponentPushToken\[.+\]$/.test(token);

/**
 * Envoie une notification à un utilisateur, sur tous ses appareils enregistrés.
 * Les jetons devenus invalides sont retirés du compte.
 */
async function sendToUser(user, { title, body, data = {}, channelId = 'default' }) {
  const devices = (user.devices || []).filter((d) => isExpoToken(d.pushToken));
  if (devices.length === 0) return { sent: 0 };

  const messages = devices.map((device) => ({
    to: device.pushToken,
    title,
    body,
    data,
    sound: 'default',
    channelId,
    priority: 'high',
  }));

  const invalidTokens = await deliver(messages);

  if (invalidTokens.length > 0) {
    user.devices = user.devices.filter((d) => !invalidTokens.includes(d.pushToken));
    await user.save();
  }

  return { sent: messages.length - invalidTokens.length, removed: invalidTokens.length };
}

/** Envoi groupé. Retourne la liste des jetons rejetés par Expo. */
async function deliver(messages) {
  const invalid = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.error(`[PUSH] Expo a répondu ${response.status}`);
        continue;
      }

      const result = await response.json();

      (result.data || []).forEach((ticket, index) => {
        if (ticket.status === 'error') {
          // « DeviceNotRegistered » : l'application a été désinstallée.
          if (ticket.details?.error === 'DeviceNotRegistered') {
            invalid.push(batch[index].to);
          } else {
            console.error(`[PUSH] Échec : ${ticket.message}`);
          }
        }
      });
    } catch (error) {
      console.error('[PUSH] Envoi impossible :', error.message);
    }
  }

  return invalid;
}

// Modèles de notification. Centralisés ici pour rester cohérents entre les
// rappels, le social et le khatam.
const templates = {
  halaqaMessage: (author, halaqaName) => ({
    title: halaqaName,
    body: `${author} a écrit dans la halaqa`,
    channelId: 'social',
    data: { type: 'halaqa_message' },
  }),
  friendRequest: (author) => ({
    title: 'Nouvelle demande',
    body: `${author} souhaite vous ajouter`,
    channelId: 'social',
    data: { type: 'friend_request' },
  }),
  khatamHizbAssigned: (hizbNumber, khatamName) => ({
    title: khatamName,
    body: `Le hizb ${hizbNumber} vous a été attribué`,
    channelId: 'social',
    data: { type: 'khatam_hizb_assigned', hizbNumber },
  }),
  khatamCompleted: (khatamName) => ({
    title: 'Khatam terminé 🎉',
    body: `${khatamName} : le Coran a été achevé en entier`,
    channelId: 'social',
    data: { type: 'khatam_completed' },
  }),
  streakAtRisk: (streak) => ({
    title: `Votre série de ${streak} jours 🔥`,
    body: 'Une leçon aujourd’hui suffit à la conserver.',
    channelId: 'revision',
    data: { type: 'streak_warning' },
  }),
};

module.exports = { sendToUser, templates, isExpoToken };
