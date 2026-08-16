/**
 * Temps réel — Salifz web
 *
 * Le serveur WebSocket est celui du backend (Socket.IO), déjà utilisé par
 * l'application mobile : les deux clients se retrouvent dans les mêmes salons,
 * un message envoyé depuis le web arrive sur le téléphone et l'inverse.
 *
 * Le serveur refuse les connexions sans jeton valide, et vérifie
 * l'appartenance avant de laisser rejoindre un salon. Il n'y a donc rien à
 * revérifier ici — mais rien à contourner non plus.
 */

import { io, Socket } from 'socket.io-client';
import { WS_URL, tokenStore } from './api';

let socket: Socket | null = null;

export function connectRealtime(): Socket {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    // Le serveur lit le jeton dans `auth` ; sans lui la connexion est rejetée.
    auth: { token: tokenStore.get() },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => console.log('[RT] connecté', socket?.id));
  socket.on('connect_error', (e) => console.warn('[RT] refusé :', e.message));
  socket.on('disconnect', (reason) => console.log('[RT] déconnecté :', reason));

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectRealtime(): void {
  socket?.disconnect();
  socket = null;
}

/**
 * Rejoint un salon et renvoie une fonction de sortie.
 *
 * `room-denied` est émis par le serveur quand on n'est pas membre : on le
 * remonte à l'appelant plutôt que d'attendre en silence des messages qui
 * n'arriveront jamais.
 */
export function joinRoom(
  roomId: string,
  onDenied?: (reason: string) => void
): () => void {
  const s = connectRealtime();

  const denied = (payload: { roomId: string; reason: string }) => {
    if (payload.roomId === roomId) onDenied?.(payload.reason);
  };

  s.on('room-denied', denied);
  s.emit('join-room', roomId);

  return () => {
    s.emit('leave-room', roomId);
    s.off('room-denied', denied);
  };
}

export function joinHalaqa(halaqaId: string, onDenied?: (reason: string) => void): () => void {
  const s = connectRealtime();

  const denied = (payload: { reason: string }) => onDenied?.(payload.reason);
  s.on('room-denied', denied);
  s.emit('joinHalaqa', { halaqaId });

  return () => {
    s.emit('leaveHalaqa', { halaqaId });
    s.off('room-denied', denied);
  };
}

/** Message dans une halaqa. Le serveur impose l'identité de l'expéditeur. */
export function sendHalaqaMessage(halaqaId: string, message: string): void {
  connectRealtime().emit('halaqaMessage', { halaqaId, message });
}

export function sendRoomMessage(roomId: string, text: string): void {
  connectRealtime().emit('send-message', { roomId, text });
}
