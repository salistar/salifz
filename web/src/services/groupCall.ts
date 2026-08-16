/**
 * Appels de groupe audio et vidéo — Salifz web
 *
 * Topologie : maillage (chaque participant est connecté à chaque autre).
 * C'est le bon choix pour une halaqa de quelques personnes — aucune
 * infrastructure de mélange à opérer. Au-delà d'environ six participants, le
 * débit montant devient le facteur limitant et il faut passer à une SFU
 * (mediasoup, LiveKit). Le seuil est signalé à l'appelant plutôt que laissé
 * à découvrir en réunion.
 *
 * La signalisation passe par le Socket.IO du backend (`webrtc-offer`,
 * `webrtc-answer`, `webrtc-ice-candidate`), déjà en place et partagée avec
 * l'application mobile.
 */

import { connectRealtime } from './realtime';
import { rtcAPI } from './api';

export const MESH_COMFORT_LIMIT = 6;

export interface RemoteStream {
  peerId: string;
  userId?: string;
  stream: MediaStream;
}

type Listener = {
  onRemote: (streams: RemoteStream[]) => void;
  onLocal: (stream: MediaStream | null) => void;
  onNotice?: (message: string) => void;
};

export class GroupCall {
  private peers = new Map<string, RTCPeerConnection>();
  private remote = new Map<string, RemoteStream>();
  private local: MediaStream | null = null;
  private iceServers: RTCIceServer[] = [];
  private roomId: string;
  private listener: Listener;
  private detach: Array<() => void> = [];

  constructor(roomId: string, listener: Listener) {
    this.roomId = roomId;
    this.listener = listener;
  }

  /** Démarre la capture locale et rejoint le salon d'appel. */
  async start(video: boolean): Promise<void> {
    const config: any = await rtcAPI.iceServers();
    const payload = config?.data ?? config;
    this.iceServers = payload?.iceServers ?? [];

    if (payload && payload.turnAvailable === false) {
      // Sans TURN, un appel peut échouer selon le réseau du participant.
      // Le dire vaut mieux que laisser deviner.
      this.listener.onNotice?.(
        "Aucun serveur TURN configuré : l'appel peut échouer sur certains réseaux."
      );
    }

    this.local = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { width: 640, height: 480 } : false,
    });
    this.listener.onLocal(this.local);

    const socket = connectRealtime();

    const onOffer = async (data: any) => {
      if (data.roomId !== this.roomId || !data.senderId) return;
      const pc = this.ensurePeer(data.senderId, data.userId);
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('webrtc-answer', { roomId: this.roomId, answer, target: data.senderId });
    };

    const onAnswer = async (data: any) => {
      if (data.roomId !== this.roomId) return;
      const pc = this.peers.get(data.senderId);
      // Une réponse peut arriver après une renégociation : on ne l'applique
      // que si la connexion attend effectivement une réponse.
      if (pc && pc.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    };

    const onCandidate = async (data: any) => {
      if (data.roomId !== this.roomId) return;
      const pc = this.peers.get(data.senderId);
      if (pc && data.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
      }
    };

    // Un nouvel arrivant déclenche une offre de la part de ceux déjà présents.
    const onJoined = async (data: any) => {
      if (data.roomId !== this.roomId || !data.socketId) return;

      if (this.peers.size + 1 >= MESH_COMFORT_LIMIT) {
        this.listener.onNotice?.(
          `Au-delà de ${MESH_COMFORT_LIMIT} participants, la qualité se dégrade en maillage.`
        );
      }

      const pc = this.ensurePeer(data.socketId, data.userId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc-offer', { roomId: this.roomId, offer, target: data.socketId });
    };

    const onLeft = (data: any) => {
      if (data.socketId) this.closePeer(data.socketId);
    };

    socket.on('webrtc-offer', onOffer);
    socket.on('webrtc-answer', onAnswer);
    socket.on('webrtc-ice-candidate', onCandidate);
    socket.on('user-joined', onJoined);
    socket.on('user-left', onLeft);

    this.detach = [
      () => socket.off('webrtc-offer', onOffer),
      () => socket.off('webrtc-answer', onAnswer),
      () => socket.off('webrtc-ice-candidate', onCandidate),
      () => socket.off('user-joined', onJoined),
      () => socket.off('user-left', onLeft),
    ];

    socket.emit('join-room', this.roomId);
  }

  private ensurePeer(peerId: string, userId?: string): RTCPeerConnection {
    const existing = this.peers.get(peerId);
    if (existing) return existing;

    const pc = new RTCPeerConnection({ iceServers: this.iceServers });

    this.local?.getTracks().forEach((track) => pc.addTrack(track, this.local!));

    pc.ontrack = (event) => {
      this.remote.set(peerId, { peerId, userId, stream: event.streams[0] });
      this.listener.onRemote([...this.remote.values()]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        connectRealtime().emit('webrtc-ice-candidate', {
          roomId: this.roomId,
          candidate: event.candidate,
          target: peerId,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      // `failed` signifie que même TURN n'a pas permis d'établir la route :
      // garder le pair en mémoire afficherait une vignette morte.
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(peerId);
      }
    };

    this.peers.set(peerId, pc);
    return pc;
  }

  private closePeer(peerId: string): void {
    this.peers.get(peerId)?.close();
    this.peers.delete(peerId);
    this.remote.delete(peerId);
    this.listener.onRemote([...this.remote.values()]);
  }

  toggleAudio(enabled: boolean): void {
    this.local?.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  toggleVideo(enabled: boolean): void {
    this.local?.getVideoTracks().forEach((t) => (t.enabled = enabled));
  }

  /** Libère micro, caméra et connexions. Le voyant de la caméra doit s'éteindre. */
  stop(): void {
    this.detach.forEach((off) => off());
    this.detach = [];

    connectRealtime().emit('leave-room', this.roomId);

    this.peers.forEach((pc) => pc.close());
    this.peers.clear();
    this.remote.clear();

    this.local?.getTracks().forEach((track) => track.stop());
    this.local = null;

    this.listener.onLocal(null);
    this.listener.onRemote([]);
  }
}
