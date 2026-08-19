/**
 * Salifz - Main App Entry
 * Gamified Quran Memorization App
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, I18nManager } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { registerForPushNotifications, addNotificationListeners } from './src/services/pushNotifications';
import { useAuthStore } from './src/stores/authStore';
import { initI18n } from './src/services/i18n';

// Prevent auto-hide of native splash
SplashScreen.preventAutoHideAsync();

// Enable RTL for Arabic
I18nManager.allowRTL(true);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // La langue d'abord, avant de rendre quoi que ce soit. `initI18n`
        // existait — elle lit le choix sauvegardé, sinon la langue du
        // téléphone — mais AUCUN code ne l'appelait : la locale restait sur
        // son défaut de module « ar » à chaque démarrage. Choisir Français
        // dans les réglages marchait pendant la session, puis se perdait au
        // redémarrage. L'import seul ne suffit pas ; il faut l'attendre ici,
        // sinon le premier rendu part dans la mauvaise langue.
        await initI18n();
        await SplashScreen.hideAsync();
      } catch (e) {
        console.warn('App preparation error:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  // Notifications push : l'enregistrement n'a de sens qu'une fois connecté,
  // puisque le jeton est rattaché au compte côté serveur.
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications().catch((e) =>
      console.warn('[PUSH] Enregistrement ignoré :', e?.message)
    );

    return addNotificationListeners(
      (notification) => console.log('[PUSH] Reçue :', notification.request.content.title),
      (response) => console.log('[PUSH] Ouverte :', response.notification.request.content.data)
    );
  }, [isAuthenticated]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <RootNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});