/**
 * Expo App Configuration - Salifz
 * Charge les variables d'environnement depuis .env
 */

import 'dotenv/config';

export default {
  expo: {
    name: process.env.APP_NAME || 'Salifz',
    slug: 'salifz',
    version: process.env.APP_VERSION || '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1a1a2e'
    },
    
    assetBundlePatterns: ['**/*'],
    
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.salifz.app',
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'Salifz needs camera access for video calls',
        NSMicrophoneUsageDescription: 'Salifz needs microphone access for audio recording and calls',
        NSFaceIDUsageDescription: 'Salifz uses Face ID for secure authentication'
      }
    },
    
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1a1a2e'
      },
      package: 'com.salifz.app',
      versionCode: 1,
      permissions: [
        'CAMERA',
        'RECORD_AUDIO',
        'USE_BIOMETRIC',
        'USE_FINGERPRINT',
        'VIBRATE',
        'RECEIVE_BOOT_COMPLETED'
      ]
    },
    
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro'
    },
    
    plugins: [
      'expo-localization',
      'expo-font',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow Salifz to access your camera for video calls.'
        }
      ],
      [
        'expo-av',
        {
          microphonePermission: 'Allow Salifz to access your microphone for audio recording and calls.'
        }
      ],
      'expo-local-authentication'
    ],
    
    // ✅ Variables d'environnement accessibles via Constants.expoConfig.extra
    extra: {
      // API URLs
      // Repli seulement : en developpement, l'IP est detectee depuis l'hote Metro
      // (voir src/config/env.ts). Une IP figee ici etait fausse des qu'on
      // changeait de reseau, et differait de celle du backend.
      apiUrl: process.env.API_URL || 'http://localhost:8088/api/v1',
      wsUrl: process.env.WS_URL || 'http://localhost:8088',
      
      // Production URLs
      apiProdUrl: process.env.API_PROD_URL || 'https://api.salifz.com/api/v1',
      wsProdUrl: process.env.WS_PROD_URL || 'wss://api.salifz.com',
      
      // Environment
      nodeEnv: process.env.NODE_ENV || 'development',
      
      // App Config
      appName: process.env.APP_NAME || 'Salifz',
      appVersion: process.env.APP_VERSION || '1.0.0',
      
      // Feature Flags
      enableSimulationMode: process.env.ENABLE_SIMULATION_MODE === 'true',
      enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
      enableCrashReporting: process.env.ENABLE_CRASH_REPORTING === 'true',
      
      // Audio
      quranAudioCdn: process.env.QURAN_AUDIO_CDN || 'https://cdn.islamic.network/quran/audio/128',
      defaultReciter: process.env.DEFAULT_RECITER || 'ar.alafasy',
      
      // Timeouts
      apiTimeout: parseInt(process.env.API_TIMEOUT || '15000', 10),
      socketTimeout: parseInt(process.env.SOCKET_TIMEOUT || '20000', 10),
      
      // Gamification
      xpPerVerse: parseInt(process.env.XP_PER_VERSE || '10', 10),
      xpPerLesson: parseInt(process.env.XP_PER_LESSON || '50', 10),
      maxHearts: parseInt(process.env.MAX_HEARTS || '5', 10),
      heartRefillHours: parseInt(process.env.HEART_REFILL_HOURS || '4', 10),
      
      // EAS
      eas: {
        projectId: 'your-eas-project-id'
      }
    }
  }
};