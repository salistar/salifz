/**
 * Notifications push — Salifz
 *
 * La fonctionnalité 39 « Notifications Push » était annoncée au README et
 * `expo-notifications` figurait dans les dépendances, mais le paquet n'était
 * importé nulle part dans les 82 fichiers source : rien n'était implémenté.
 *
 * Ce module couvre les deux besoins :
 *   - les rappels locaux (révision quotidienne, série en danger), qui
 *     fonctionnent hors ligne et sans serveur ;
 *   - les notifications distantes (halaqa, khatam, amis), via le service push
 *     d'Expo, dont le jeton est enregistré côté serveur.
 *
 * ⚠️ Depuis le SDK 53, Expo Go ne prend plus en charge les notifications
 * distantes, et le seul fait d'importer `expo-notifications` y affiche une
 * erreur à l'utilisateur. Le module est donc chargé **paresseusement**, et
 * jamais sous Expo Go.
 */

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** Charge expo-notifications à la demande, hors Expo Go uniquement. */
function loadNotifications(): typeof import('expo-notifications') | null {
  if (isExpoGo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-notifications');
  } catch {
    return null;
  }
}

let handlerInstalled = false;

function ensureHandler(Notifications: any) {
  if (handlerInstalled) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  handlerInstalled = true;
}

const ANDROID_CHANNELS = [
  { id: 'default', name: 'Général' },
  { id: 'revision', name: 'Rappels de révision' },
  { id: 'social', name: 'Halaqa et amis' },
  { id: 'prayer', name: 'Heures de prière' },
];

async function ensureAndroidChannels(Notifications: any): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Promise.all(
    ANDROID_CHANNELS.map((c) =>
      Notifications.setNotificationChannelAsync(c.id, {
        name: c.name,
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      })
    )
  );
}

/**
 * Demande l'autorisation et enregistre l'appareil pour les notifications
 * distantes. Retourne le jeton Expo, ou null si indisponible ou refusé.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  const Notifications = loadNotifications();

  if (!Notifications) {
    console.log(
      '[PUSH] Notifications distantes indisponibles sous Expo Go (SDK 53+). ' +
      'Utilisez un build de développement pour les tester.'
    );
    return null;
  }

  ensureHandler(Notifications);
  await ensureAndroidChannels(Notifications);

  const Device = require('expo-device');
  if (!Device.isDevice) {
    console.log('[PUSH] Appareil physique requis pour les notifications distantes.');
    return null;
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;

  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }

  if (status !== 'granted') {
    console.log('[PUSH] Autorisation refusée.');
    return null;
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;

    const { data: token } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );

    // Le serveur associe le jeton au compte pour pouvoir cibler l'utilisateur.
    await api.post('/notifications/register-device', { token, platform: Platform.OS });

    return token;
  } catch (error) {
    console.warn('[PUSH] Enregistrement impossible :', error);
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

  const Notifications = loadNotifications();
  await Notifications?.cancelAllScheduledNotificationsAsync().catch(() => {});
}

/**
 * Rappel quotidien de révision, planifié localement — fonctionne hors ligne.
 * Les notifications *locales* restent disponibles sous Expo Go, mais le module
 * n'y étant pas chargé, elles ne s'activent que dans un build complet.
 */
export async function scheduleDailyReminder(
  hour: number,
  minute: number
): Promise<string | null> {
  const Notifications = loadNotifications();
  if (!Notifications) return null;

  ensureHandler(Notifications);

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
  const Notifications = loadNotifications();
  await Notifications?.cancelScheduledNotificationAsync('daily-revision').catch(() => {});
}

/** Alerte quand la série est sur le point d'être perdue. */
export async function scheduleStreakWarning(
  hoursFromNow: number,
  currentStreak: number
): Promise<string | null> {
  const Notifications = loadNotifications();
  if (!Notifications) return null;

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
  onReceived: (notification: any) => void,
  onTapped: (response: any) => void
): () => void {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};

  const receivedSub = Notifications.addNotificationReceivedListener(onReceived);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onTapped);

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
