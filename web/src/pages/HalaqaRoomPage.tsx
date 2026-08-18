/**
 * Salle de halaqa — discussion temps réel et appel de groupe.
 *
 * Le salon est le même que celui de l'application mobile : un message envoyé
 * ici arrive sur le téléphone, et l'inverse. L'appel de groupe utilise le
 * WebRTC en maillage, avec les serveurs STUN/TURN fournis par le backend.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { halaqaAPI } from '../services/api';
import { connectRealtime, joinHalaqa, sendHalaqaMessage } from '../services/realtime';
import { GroupCall, RemoteStream } from '../services/groupCall';
import { useAuth } from '../store';
import {
  IconeAppel,
  IconeVideo,
  IconeVideoCoupee,
  IconeMicro,
  IconeMicroCoupe,
} from '../components/Icones';

interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  text: string;
  type?: string;
  timestamp: string;
}

export default function HalaqaRoomPage() {
  const { id = '' } = useParams();
  const user = useAuth((s) => s.user);

  const [halaqa, setHalaqa] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [denied, setDenied] = useState<string | null>(null);

  const [call, setCall] = useState<GroupCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotes, setRemotes] = useState<RemoteStream[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const localVideo = useRef<HTMLVideoElement | null>(null);
  const bottom = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    halaqaAPI.detail(id).then((r: any) => setHalaqa(r?.data ?? r)).catch(() => {});
  }, [id]);

  // Discussion : on rejoint le salon de la halaqa et on écoute ses messages.
  useEffect(() => {
    const socket = connectRealtime();

    const onMessage = (payload: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: payload.id ?? String(Date.now()),
          senderId: payload.senderId,
          senderName: payload.senderName,
          text: payload.text ?? payload.message ?? '',
          type: payload.type,
          timestamp: payload.timestamp ?? new Date().toISOString(),
        },
      ]);
    };

    socket.on('halaqaMessage', onMessage);
    const leave = joinHalaqa(id, (reason) => setDenied(reason));

    return () => {
      socket.off('halaqaMessage', onMessage);
      leave();
    };
  }, [id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (localVideo.current) localVideo.current.srcObject = localStream;
  }, [localStream]);

  // L'appel doit être raccroché en quittant la page : sinon micro et caméra
  // restent actifs, voyant allumé.
  useEffect(() => () => call?.stop(), [call]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    sendHalaqaMessage(id, text);
    setDraft('');
  };

  const startCall = useCallback(
    async (video: boolean) => {
      if (call) return;
      const instance = new GroupCall(`halaqa-call:${id}`, {
        onLocal: setLocalStream,
        onRemote: setRemotes,
        onNotice: setNotice,
      });
      try {
        await instance.start(video);
        setCall(instance);
        setMicOn(true);
        setCamOn(video);
      } catch (e: any) {
        setNotice(
          e?.name === 'NotAllowedError'
            ? 'Accès au micro ou à la caméra refusé.'
            : 'Impossible de démarrer l’appel.'
        );
      }
    },
    [call, id]
  );

  const stopCall = () => {
    call?.stop();
    setCall(null);
    setRemotes([]);
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/halaqat" className="btn-ghost" style={{ textDecoration: 'none' }}>
          ← Halaqat
        </Link>
        <h1 style={{ margin: 0, flex: 1 }}>{halaqa?.name ?? 'Halaqa'}</h1>

        {!call ? (
          <>
            <button className="btn-ghost" onClick={() => startCall(false)}>
              <IconeAppel size={16} /> Appel audio
            </button>
            <button className="btn-primary" onClick={() => startCall(true)}>
              <IconeVideo size={16} /> Appel vidéo
            </button>
          </>
        ) : (
          <>
            <button
              className="btn-ghost"
              onClick={() => {
                call.toggleAudio(!micOn);
                setMicOn(!micOn);
              }}
            >
              {micOn ? <IconeMicro size={16} /> : <IconeMicroCoupe size={16} />}
              <span>{micOn ? 'Micro' : 'Muet'}</span>
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                call.toggleVideo(!camOn);
                setCamOn(!camOn);
              }}
            >
              {camOn ? <IconeVideo size={16} /> : <IconeVideoCoupee size={16} />}
              <span>Caméra</span>
            </button>
            <button className="btn-danger" onClick={stopCall}>
              Raccrocher
            </button>
          </>
        )}
      </div>

      {denied && (
        <div className="card" role="alert" style={{ background: 'var(--error-soft)', color: 'var(--error)' }}>
          Accès au salon refusé ({denied}). Vous devez être membre de cette halaqa.
        </div>
      )}

      {notice && (
        <div className="card" role="status" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)' }}>
          {notice}
        </div>
      )}

      {call && (
        <section
          className="card"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
          }}
        >
          <figure style={{ margin: 0 }}>
            <video
              ref={localVideo}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', borderRadius: 10, background: '#000' }}
            />
            <figcaption style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Vous {micOn ? '' : '· muet'}
            </figcaption>
          </figure>

          {remotes.map((r) => (
            <figure key={r.peerId} style={{ margin: 0 }}>
              <video
                autoPlay
                playsInline
                ref={(el) => {
                  if (el) el.srcObject = r.stream;
                }}
                style={{ width: '100%', borderRadius: 10, background: '#000' }}
              />
              <figcaption style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Participant
              </figcaption>
            </figure>
          ))}

          {remotes.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', alignSelf: 'center' }}>
              En attente d’autres participants…
            </p>
          )}
        </section>
      )}

      <section className="card" style={{ display: 'grid', gap: 10 }}>
        <strong>Discussion</strong>

        <div
          style={{
            height: 340,
            overflowY: 'auto',
            display: 'grid',
            gap: 8,
            alignContent: 'start',
            padding: 4,
          }}
        >
          {messages.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>Aucun message pour le moment.</p>
          )}

          {messages.map((m) => {
            const mine = m.senderId === (user?._id ?? user?.id);
            return (
              <div
                key={m.id}
                style={{
                  justifySelf: mine ? 'end' : 'start',
                  maxWidth: '75%',
                  background: mine ? 'var(--primary)' : 'var(--background-alt)',
                  color: mine ? 'var(--on-deep)' : 'var(--text)',
                  padding: '8px 12px',
                  borderRadius: 12,
                }}
              >
                {!mine && (
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{m.senderName ?? 'Membre'}</div>
                )}
                <div>{m.text}</div>
              </div>
            );
          })}
          <div ref={bottom} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ flex: 1 }}
            placeholder="Votre message"
            aria-label="Votre message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn-primary" onClick={send} disabled={!draft.trim()}>
            Envoyer
          </button>
        </div>
      </section>
    </div>
  );
}
