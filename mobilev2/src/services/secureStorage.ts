/**
 * Stockage sécurisé des jetons — Salifz
 *
 * Corrige S11. Les jetons d'accès et de rafraîchissement étaient conservés en
 * clair dans AsyncStorage, alors qu'`expo-secure-store` figurait déjà dans les
 * dépendances sans jamais être importé. AsyncStorage est un simple fichier
 * lisible sur un appareil rooté ou via une sauvegarde ADB ; SecureStore
 * s'appuie sur le Keystore Android et la Keychain iOS.
 *
 * Une migration transparente déplace les jetons déjà présents dans
 * AsyncStorage vers SecureStore au premier lancement, puis les efface.
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refreshToken';

// SecureStore n'existe pas sur le web : on y retombe sur AsyncStorage, en
// sachant que le navigateur n'offre pas d'équivalent au Keystore.
const isSecureAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (!isSecureAvailable) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function getSecureItem(key: string): Promise<string | null> {
  if (!isSecureAvailable) {
    return AsyncStorage.getItem(key);
  }

  const stored = await SecureStore.getItemAsync(key);
  if (stored) return stored;

  // Migration depuis l'ancien emplacement non chiffré.
  const legacy = await AsyncStorage.getItem(key);
  if (legacy) {
    await setSecureItem(key, legacy);
    await AsyncStorage.removeItem(key);
    return legacy;
  }

  return null;
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isSecureAvailable) {
    await SecureStore.deleteItemAsync(key).catch(() => {});
  }
  await AsyncStorage.removeItem(key).catch(() => {});
}

/** Efface tous les jetons — à la déconnexion. */
export async function clearTokens(): Promise<void> {
  await Promise.all([
    deleteSecureItem(TOKEN_KEY),
    deleteSecureItem(REFRESH_TOKEN_KEY),
  ]);
}

export const getToken = () => getSecureItem(TOKEN_KEY);
export const setToken = (value: string) => setSecureItem(TOKEN_KEY, value);
export const getRefreshToken = () => getSecureItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (value: string) => setSecureItem(REFRESH_TOKEN_KEY, value);
