/**
 * Audio hors ligne — Salifz
 *
 * `expo-file-system` figurait dans les dépendances sans être importé une seule
 * fois : aucune récitation ne pouvait être conservée sur l'appareil. C'est un
 * manque de fond pour une application de mémorisation, dont le public récite
 * dans les transports, à la mosquée et là où le réseau ne suit pas.
 *
 * Choix techniques :
 *   - un fichier par sourate plutôt qu'un par verset : 114 fichiers au lieu de
 *     6 236, et la lecture reste continue ;
 *   - `expo-file-system/legacy`, seule API à offrir la **progression** et la
 *     **reprise** ; l'API moderne (`File.downloadFileAsync`) ne fait ni l'un
 *     ni l'autre ;
 *   - le CDN accepte les requêtes partielles (HTTP 206), donc un
 *     téléchargement interrompu reprend où il s'est arrêté.
 */

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOG_PREFIX = '[offlineAudio.ts]';

const AUDIO_CDN = 'https://cdn.islamic.network/quran/audio-surah/128';
const ROOT = `${FileSystem.documentDirectory}audio/`;
const INDEX_KEY = 'offlineAudio:index';
const RESUME_KEY = 'offlineAudio:resumables';

export interface DownloadedSurah {
  surah: number;
  reciter: string;
  bytes: number;
  downloadedAt: number;
}

export type DownloadState =
  | { status: 'idle' }
  | { status: 'downloading'; progress: number; received: number; total: number }
  | { status: 'done'; bytes: number }
  | { status: 'error'; message: string };

type Listener = (surah: number, state: DownloadState) => void;

class OfflineAudioService {
  private index: Record<string, DownloadedSurah> = {};
  private tasks = new Map<string, FileSystem.DownloadResumable>();
  private listeners = new Set<Listener>();
  private ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private key(surah: number, reciter: string) {
    return `${reciter}:${surah}`;
  }

  private pathFor(surah: number, reciter: string) {
    return `${ROOT}${reciter}/${String(surah).padStart(3, '0')}.mp3`;
  }

  private async init() {
    try {
      await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
      const raw = await AsyncStorage.getItem(INDEX_KEY);
      this.index = raw ? JSON.parse(raw) : {};
      await this.reconcile();
    } catch (e: any) {
      console.warn(`${LOG_PREFIX} init:`, e?.message);
    }
  }

  /**
   * Réaligne l'index sur le disque. Sans cela, une sourate supprimée par le
   * système (nettoyage de stockage) resterait annoncée comme disponible et la
   * lecture échouerait hors ligne.
   */
  private async reconcile() {
    let changed = false;
    for (const [key, entry] of Object.entries(this.index)) {
      const info = await FileSystem.getInfoAsync(this.pathFor(entry.surah, entry.reciter));
      if (!info.exists) {
        delete this.index[key];
        changed = true;
      }
    }
    if (changed) await this.persist();
  }

  private async persist() {
    await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(this.index));
  }

  private emit(surah: number, state: DownloadState) {
    this.listeners.forEach((l) => l(surah, state));
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Taille annoncée par le serveur, pour prévenir avant de lancer.
   *
   * `Accept-Encoding: identity` est indispensable : React Native demande
   * `gzip` par défaut, et le CDN répond alors sans `content-length` — la
   * taille revenait toujours nulle, ce qui privait l'écran de son avertissement
   * et la barre de progression de son dénominateur.
   *
   * Une requête `Range: bytes=0-0` sert de repli : elle renvoie
   * `content-range: bytes 0-0/<taille>` pour un seul octet transféré.
   */
  async getRemoteSize(surah: number, reciter = 'ar.alafasy'): Promise<number | null> {
    const url = `${AUDIO_CDN}/${reciter}/${surah}.mp3`;

    try {
      const head = await fetch(url, {
        method: 'HEAD',
        headers: { 'Accept-Encoding': 'identity' },
      });
      const length = head.headers.get('content-length');
      if (length) return Number(length);
    } catch {
      // On tente le repli ci-dessous.
    }

    try {
      const ranged = await fetch(url, {
        headers: { 'Accept-Encoding': 'identity', Range: 'bytes=0-0' },
      });
      const range = ranged.headers.get('content-range');
      const total = range?.split('/')[1];
      return total ? Number(total) : null;
    } catch {
      return null;
    }
  }

  async isDownloaded(surah: number, reciter = 'ar.alafasy'): Promise<boolean> {
    await this.ready;
    return Boolean(this.index[this.key(surah, reciter)]);
  }

  /**
   * URI à donner au lecteur : le fichier local s'il existe, l'URL distante
   * sinon. C'est le seul point que le lecteur audio a besoin de connaître.
   */
  async resolveUri(surah: number, reciter = 'ar.alafasy'): Promise<string> {
    await this.ready;
    const entry = this.index[this.key(surah, reciter)];
    if (entry) {
      const path = this.pathFor(surah, reciter);
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) return path;
      // Fichier disparu : on nettoie et on retombe sur le réseau.
      delete this.index[this.key(surah, reciter)];
      await this.persist();
    }
    return `${AUDIO_CDN}/${reciter}/${surah}.mp3`;
  }

  async list(): Promise<DownloadedSurah[]> {
    await this.ready;
    return Object.values(this.index).sort((a, b) => a.surah - b.surah);
  }

  async totalBytes(): Promise<number> {
    await this.ready;
    return Object.values(this.index).reduce((sum, e) => sum + (e.bytes || 0), 0);
  }

  async freeDiskBytes(): Promise<number> {
    return FileSystem.getFreeDiskStorageAsync();
  }

  /** Lance ou reprend le téléchargement d'une sourate. */
  async download(surah: number, reciter = 'ar.alafasy'): Promise<void> {
    await this.ready;
    const key = this.key(surah, reciter);

    if (this.tasks.has(key)) {
      console.log(`${LOG_PREFIX} ${key} déjà en cours`);
      return;
    }
    if (this.index[key]) {
      this.emit(surah, { status: 'done', bytes: this.index[key].bytes });
      return;
    }

    const path = this.pathFor(surah, reciter);
    await FileSystem.makeDirectoryAsync(`${ROOT}${reciter}/`, { intermediates: true });

    // Le CDN répond `content-encoding: gzip` à React Native, et omet alors
    // `content-length` : la fonction de progression reçoit
    // `totalBytesExpectedToWrite = -1`, et le pourcentage restait figé à 0 %
    // pendant tout le téléchargement. On récupère donc la taille réelle par
    // une requête HEAD, qui elle la renvoie, et on s'en sert de dénominateur.
    const knownSize = await this.getRemoteSize(surah, reciter);

    const onProgress = ({ totalBytesWritten, totalBytesExpectedToWrite }: any) => {
      const total =
        totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : knownSize || 0;
      this.emit(surah, {
        status: 'downloading',
        // Sans taille connue, on ne prétend pas à un pourcentage : l'écran
        // affiche alors les octets reçus.
        progress: total > 0 ? Math.min(1, totalBytesWritten / total) : -1,
        received: totalBytesWritten,
        total,
      });
    };

    // État de reprise laissé par une pause précédente. Sans cette relecture,
    // `pause()` enregistrait l'état mais le téléchargement repartait de zéro :
    // sur une sourate de 116 Mo, la reprise ne servait à rien.
    let resumeData: string | undefined;
    try {
      const saved = await AsyncStorage.getItem(`${RESUME_KEY}:${key}`);
      if (saved) resumeData = JSON.parse(saved)?.resumeData;
    } catch {
      // État illisible : on repart du début, ce qui reste correct.
    }

    const task = FileSystem.createDownloadResumable(
      `${AUDIO_CDN}/${reciter}/${surah}.mp3`,
      path,
      {},
      onProgress,
      resumeData
    );

    this.tasks.set(key, task);

    try {
      // `resumeAsync` reprend là où la pause s'est arrêtée ; `downloadAsync`
      // démarre un téléchargement neuf.
      const result = resumeData ? await task.resumeAsync() : await task.downloadAsync();
      if (!result) throw new Error('Téléchargement interrompu');

      const info = await FileSystem.getInfoAsync(result.uri);
      const bytes = info.exists && 'size' in info ? (info.size as number) : 0;

      this.index[key] = { surah, reciter, bytes, downloadedAt: Date.now() };
      await this.persist();
      await AsyncStorage.removeItem(`${RESUME_KEY}:${key}`);

      this.emit(surah, { status: 'done', bytes });
      console.log(`${LOG_PREFIX} ✅ sourate ${surah} (${Math.round(bytes / 1024)} Ko)`);
    } catch (e: any) {
      console.warn(`${LOG_PREFIX} ❌ sourate ${surah}:`, e?.message);
      this.emit(surah, { status: 'error', message: e?.message || 'Échec' });
    } finally {
      this.tasks.delete(key);
    }
  }

  /**
   * Met en pause en conservant l'état de reprise : relancer `download`
   * repartira de l'octet atteint, pas de zéro.
   */
  async pause(surah: number, reciter = 'ar.alafasy'): Promise<void> {
    const key = this.key(surah, reciter);
    const task = this.tasks.get(key);
    if (!task) return;

    try {
      await task.pauseAsync();
      await AsyncStorage.setItem(`${RESUME_KEY}:${key}`, JSON.stringify(task.savable()));
    } catch (e: any) {
      console.warn(`${LOG_PREFIX} pause:`, e?.message);
    } finally {
      this.tasks.delete(key);
      this.emit(surah, { status: 'idle' });
    }
  }

  async remove(surah: number, reciter = 'ar.alafasy'): Promise<void> {
    await this.ready;
    const key = this.key(surah, reciter);
    try {
      await FileSystem.deleteAsync(this.pathFor(surah, reciter), { idempotent: true });
    } catch (e: any) {
      console.warn(`${LOG_PREFIX} remove:`, e?.message);
    }
    delete this.index[key];
    await this.persist();
    this.emit(surah, { status: 'idle' });
  }

  /** Supprime toutes les récitations conservées. */
  async removeAll(): Promise<void> {
    await this.ready;
    try {
      await FileSystem.deleteAsync(ROOT, { idempotent: true });
      await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true });
    } catch (e: any) {
      console.warn(`${LOG_PREFIX} removeAll:`, e?.message);
    }
    const surahs = Object.values(this.index).map((e) => e.surah);
    this.index = {};
    await this.persist();
    surahs.forEach((s) => this.emit(s, { status: 'idle' }));
  }
}

export const offlineAudio = new OfflineAudioService();

/** Formatage lisible : 936095 → « 914 Ko ». */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes < 0) return '0 o';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export default offlineAudio;
