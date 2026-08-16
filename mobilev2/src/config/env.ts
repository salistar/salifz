/**
 * Environment Configuration - Salifz
 * Centralise l'accès aux variables d'environnement
 */

import Constants from 'expo-constants';

// Déclaration pour TypeScript
declare const __DEV__: boolean;

// Récupérer les extras de la config Expo
const extra = Constants.expoConfig?.extra || {};

// Déterminer si on est en production
const isProduction = extra.nodeEnv === 'production' || (typeof __DEV__ !== 'undefined' ? !__DEV__ : false);

/**
 * Adresse du serveur de développement, déduite de l'hôte Metro.
 *
 * L'URL de l'API était figée sur une IP de réseau local — `192.168.1.4` ici,
 * `10.46.202.130` côté serveur : deux valeurs différentes, et toutes deux
 * fausses dès qu'on change de réseau ou de machine. Expo connaît déjà l'IP
 * depuis laquelle le téléphone charge le bundle : c'est la même machine que
 * le backend en développement.
 */
function detectDevHost(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    (Constants as any).expoGoConfig?.debuggerHost,
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const host = candidate.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host;
  }
  return null;
}

const devHost = isProduction ? null : detectDevHost();
const devApiPort = extra.devApiPort || 8088;

// L'IP détectée l'emporte sur la valeur du .env, qui ne sert plus que de
// repli lorsque Metro n'expose pas d'hôte (build autonome, simulateur).
const devApiUrl = devHost
  ? `http://${devHost}:${devApiPort}/api/v1`
  : extra.apiUrl || 'http://localhost:8088/api/v1';

const devWsUrl = devHost
  ? `http://${devHost}:${devApiPort}`
  : extra.wsUrl || 'http://localhost:8088';

/**
 * Configuration de l'environnement
 */
export const ENV = {
  // ============================================
  // API URLs
  // ============================================
  API_URL: isProduction
    ? (extra.apiProdUrl || 'https://api.salifz.com/api/v1')
    : devApiUrl,

  WS_URL: isProduction
    ? (extra.wsProdUrl || 'wss://api.salifz.com')
    : devWsUrl,
  
  // ============================================
  // Environment
  // ============================================
  NODE_ENV: extra.nodeEnv || 'development',
  IS_PRODUCTION: isProduction,
  IS_DEVELOPMENT: !isProduction,
  
  // ============================================
  // App Config
  // ============================================
  APP_NAME: extra.appName || 'Salifz',
  APP_VERSION: extra.appVersion || '1.0.0',
  
  // ============================================
  // Feature Flags
  // ============================================
  // Par défaut à `true` auparavant : une partie de l'application affichait
  // donc des données simulées sans que rien ne le signale. Les simulations
  // ayant été remplacées par de vraies données, le mode est désactivé par
  // défaut et doit être demandé explicitement.
  ENABLE_SIMULATION_MODE: extra.enableSimulationMode ?? false,
  ENABLE_ANALYTICS: extra.enableAnalytics ?? false,
  ENABLE_CRASH_REPORTING: extra.enableCrashReporting ?? false,
  
  // ============================================
  // Audio / Quran
  // ============================================
  QURAN_AUDIO_CDN: extra.quranAudioCdn || 'https://cdn.islamic.network/quran/audio/128',
  DEFAULT_RECITER: extra.defaultReciter || 'ar.alafasy',
  
  // ============================================
  // Timeouts (in milliseconds)
  // ============================================
  API_TIMEOUT: extra.apiTimeout || 15000,
  SOCKET_TIMEOUT: extra.socketTimeout || 20000,
  
  // ============================================
  // Gamification
  // ============================================
  // ⚠️ Valeurs d'affichage uniquement. L'économie du jeu (XP réellement
  // accordé, cœurs consommés, rechargement) est calculée par le serveur, qui
  // en est la seule source de vérité. Ces constantes servent à afficher un
  // barème avant la réponse du serveur — elles ne doivent jamais servir à
  // créditer quoi que ce soit côté client.
  XP_PER_VERSE: extra.xpPerVerse || 10,
  XP_PER_LESSON: extra.xpPerLesson || 50,
  MAX_HEARTS: extra.maxHearts || 5,
  HEART_REFILL_HOURS: extra.heartRefillHours || 4,
  
  // ============================================
  // Chat Configuration
  // ============================================
  CHAT_MAX_MESSAGE_LENGTH: extra.chatMaxMessageLength || 2000,
  CHAT_MAX_ATTACHMENTS: extra.chatMaxAttachments || 5,
  CHAT_ATTACHMENT_MAX_SIZE: extra.chatAttachmentMaxSize || 10 * 1024 * 1024, // 10MB
  
  // ============================================
  // Halaqa Configuration
  // ============================================
  HALAQA_MAX_MEMBERS: extra.halaqaMaxMembers || 50,
  HALAQA_MAX_ADMINS: extra.halaqaMaxAdmins || 5,
  HALAQA_MAX_PER_USER: extra.halaqaMaxPerUser || 10,
  
  // ============================================
  // Calls Configuration (WebRTC)
  // ============================================
  CALLS_ENABLED: extra.callsEnabled ?? true,
  CALLS_AUDIO_ENABLED: extra.callsAudioEnabled ?? true,
  CALLS_VIDEO_ENABLED: extra.callsVideoEnabled ?? true,
  CALLS_MAX_DURATION: extra.callsMaxDuration || 3600, // 1 hour in seconds
  
  // ============================================
  // STUN/TURN Servers
  // ============================================
  STUN_SERVER: extra.stunServer || 'stun:stun.l.google.com:19302',
  TURN_SERVER: extra.turnServer || '',
  TURN_USERNAME: extra.turnUsername || '',
  TURN_CREDENTIAL: extra.turnCredential || '',
};

// Log en développement
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  console.log('');
  console.log('🌍 ========== Environment Configuration ==========');
  console.log(`   📡 API_URL: ${ENV.API_URL}`);
  console.log(`   🔌 WS_URL: ${ENV.WS_URL}`);
  console.log(`   🏭 IS_PRODUCTION: ${ENV.IS_PRODUCTION}`);
  console.log(`   🧪 SIMULATION_MODE: ${ENV.ENABLE_SIMULATION_MODE}`);
  console.log(`   💬 CHAT_ENABLED: true`);
  console.log(`   📞 CALLS_ENABLED: ${ENV.CALLS_ENABLED}`);
  console.log(`   🕌 HALAQA_MAX_MEMBERS: ${ENV.HALAQA_MAX_MEMBERS}`);
  console.log('==================================================');
  console.log('');
}

export default ENV;