/**
 * Notifications push — Salifz
 *
 * La fonctionnalité 39 « Notifications Push » était annoncée au README et
 * `expo-notifications` figurait dans les dépendances, mais le paquet n'était
 * importé nulle part dans les 82 fichiers source : rien n'était implémenté.
 *
 * Ce module couvre les deux besoins :
 *   - les rappels locaux (révision quotidienne, heures de prière), qui
 *     fonctionnent hors ligne et sans serveur ;
 *   - les notifications distantes (halaqa, khatam, amis), via le service push
 *     d'Expo, dont le jeton est enregistré côté serveur.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const ANDROID_CHANNELS = [
  { id: 'default', name: 'Général', importance: Notifications.AndroidImportance.DEFAULT },
  { id: 'revision', name: 'Rappels de révision', importance: Notifications.AndroidImportance.HIGH },
  { id: 'social', name: 'Halaqa et amis', importance: Notifications.AndroidImportance.DEFAULT },
  { id: 'prayer', name: 'Heures de prière', importance: Notifications.AndroidImportance.HIGH },
];

async function ensureAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Promise.all(
    ANDROID_CHANNELS.map((c) =>
      Notifications.setNotificationChannelAsync(c.id, {
        name: c.name,
        importance: c.importance,
        vibrationPattern: [0, 250, 250, 250],
      })
    )
  );
}

/**
 * Demande l'autorisation et enregistre l'appareil pour les notifications
 * distantes. Retourne le jeton Expo, ou null si l'utilisateur refuse.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  await ensureAndroidChannels();

  // Un émulateur ne peut pas recevoir de notification distante.
  if (!Device.isDevice) {
    console.log('[PUSH] Appareil physique requis pour les notifications distantes.');
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    console.log('[PUSH] Autorisation refusée.');
    return null;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();

    // Le serveur associe le jeton au compte pour pouvoir cibler l'utilisateur.
    await api.post('/notifications/register-device', {
      token,
      platform: Platform.OS,
    });

    return token;
  } catch (error) {
    console.error('[PUSH] Enregistrement impossible :', error);
    return null;
  }
}

/** Retire l'appareil : à appeler à la déconnexion. */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    await api.post('/notifications/unregister-device');
  } catch {
    // Hors ligne : le serveur nettoiera au premier envoi en échec.
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Rappel quotidien de révision, planifié localement — il fonctionne donc
 * hors ligne et sans dépendre du serveur.
 */
export async function scheduleDailyReminder(hour: number, minute: number): Promise<string | null> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  await cancelDailyReminder();

  return Notifications.scheduleNotificationAsync({
    identifier: 'daily-revision',
    content: {
      title: 'Salifz',
      body: "C'est l'heure de votre révision quotidienne 📖",
      sound: true,
      data: { type: 'daily_revision' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: 'revision',
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('daily-revision').catch(() => {});
}

/** Alerte de série sur le point d'être perdue. */
export async function scheduleStreakWarning(hoursFromNow: number, currentStreak: number) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  return Notifications.scheduleNotificationAsync({
    identifier: 'streak-warning',
    content: {
      title: `Votre série de ${currentStreak} jours 🔥`,
      body: 'Une leçon aujourd’hui suffit à la conserver.',
      data: { type: 'streak_warning' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, hoursFromNow * 3600),
      channelId: 'revision',
    },
  });
}

/** Abonnement aux notifications reçues, pour la navigation contextuelle. */
export function addNotificationListeners(
  onReceived: (n: Notifications.Notification) => void,
  onTapped: (r: Notifications.NotificationResponse) => void
) {
  const receivedSub = Notifications.addNotificationReceivedListener(onReceived);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onTapped);

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
