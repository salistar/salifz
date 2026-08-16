/**
 * Offline Service - Salifz
 * Gestion mode hors-ligne avec sync
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface QueuedAction {
  id: string;
  type: 'progress' | 'streak' | 'achievement' | 'settings';
  payload: any;
  timestamp: number;
}

interface CachedData {
  key: string;
  data: any;
  expiry: number;
}

class OfflineService {
  private isOnline: boolean = true;
  private actionQueue: QueuedAction[] = [];
  private syncInProgress: boolean = false;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    // Charger la queue depuis le stockage
    const savedQueue = await AsyncStorage.getItem('offline_queue');
    if (savedQueue) {
      this.actionQueue = JSON.parse(savedQueue);
    }

    // Écouter les changements de connexion
    NetInfo.addEventListener(this.handleConnectivityChange.bind(this));
  }

  private handleConnectivityChange(state: NetInfoState): void {
    const wasOffline = !this.isOnline;
    this.isOnline = state.isConnected ?? false;

    console.log(`[OFFLINE] Network status: ${this.isOnline ? 'online' : 'offline'}`);

    if (wasOffline && this.isOnline) {
      this.syncPendingActions();
    }
  }

  // Ajouter une action à la queue
  async queueAction(type: QueuedAction['type'], payload: any): Promise<void> {
    const action: QueuedAction = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: Date.now(),
    };

    this.actionQueue.push(action);
    await this.saveQueue();

    console.log(`[OFFLINE] Action queued: ${type}`);

    if (this.isOnline) {
      this.syncPendingActions();
    }
  }

  // Synchroniser les actions en attente
  async syncPendingActions(): Promise<void> {
    if (this.syncInProgress || this.actionQueue.length === 0 || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    console.log(`[OFFLINE] Syncing ${this.actionQueue.length} pending actions...`);

    const failedActions: QueuedAction[] = [];

    for (const action of this.actionQueue) {
      try {
        await this.executeAction(action);
        console.log(`[OFFLINE] Synced: ${action.type}`);
      } catch (error) {
        console.error(`[OFFLINE] Failed to sync: ${action.type}`, error);
        failedActions.push(action);
      }
    }

    this.actionQueue = failedActions;
    await this.saveQueue();
    this.syncInProgress = false;

    console.log(`[OFFLINE] Sync complete. ${failedActions.length} actions pending.`);
  }

  private async executeAction(action: QueuedAction): Promise<void> {
    // Import the specific APIs, not the api instance
    const { progressAPI, streaksAPI, achievementsAPI, settingsAPI } = await import('./api');

    switch (action.type) {
      case 'progress':
        await progressAPI.updateProgress(action.payload);
        break;
      case 'streak':
        await streaksAPI.updateStreak();
        break;
      case 'achievement':
        await achievementsAPI.unlock(action.payload.achievementId);
        break;
      case 'settings':
        await settingsAPI.update(action.payload);
        break;
    }
  }

  private async saveQueue(): Promise<void> {
    await AsyncStorage.setItem('offline_queue', JSON.stringify(this.actionQueue));
  }

  // Cache de données
  async cacheData(key: string, data: any, ttlMinutes: number = 60): Promise<void> {
    const cached: CachedData = {
      key,
      data,
      expiry: Date.now() + ttlMinutes * 60 * 1000,
    };
    await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cached));
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    const cached = await AsyncStorage.getItem(`cache_${key}`);
    if (!cached) return null;

    const parsedCache: CachedData = JSON.parse(cached);
    
    if (Date.now() > parsedCache.expiry) {
      await AsyncStorage.removeItem(`cache_${key}`);
      return null;
    }

    return parsedCache.data as T;
  }

  async clearCache(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    await AsyncStorage.multiRemove(cacheKeys);
  }

  // Statut
  getIsOnline(): boolean {
    return this.isOnline;
  }

  getPendingActionsCount(): number {
    return this.actionQueue.length;
  }
}

export const offlineService = new OfflineService();
export default offlineService;