/**
 * Récitations — version web
 *
 * Deux rôles dans un seul écran : l'élève enregistre un passage au micro et
 * le soumet, le responsable de la halaqa écoute la file d'attente et valide.
 * Les règles sont celles du serveur — une demande de reprise sans remarque
 * est refusée là-bas, on l'annonce donc ici avant d'envoyer.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { halaqaAPI, recitationsAPI, FILES_URL } from '../services/api';
import { IconeArret, IconeEnregistrer } from '../components/Icones';

interface Halaqa {
  _id: string;
  name: string;
}

interface Pending {
  _id: string;
  student: { displayName?: string; username?: string };
  surahNumber: number;
  fromAyah: number;
  toAyah: number;
  kind: string;
  attempt: number;
  audioUrl: string;
}

const unwrapList = (response: any): any[] => {
  const payload = response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  return payload?.halaqat ?? payload?.recitations ?? [];
};

export default function RecitationsPage() {
  const { t } = useTranslation(['recitations', 'common']);
  const [halaqat, setHalaqat] = useState<Halaqa[]>([]);
  const [halaqaId, setHalaqaId] = useState('');
  const [surah, setSurah] = useState('112');
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState('4');
  const [kind, setKind] = useState<'hifz' | 'muraja'>('hifz');

  const [recording, setRecording] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [pending, setPending] = useState<Pending[]>([]);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [grade, setGrade] = useState('');
  const [comment, setComment] = useState('');

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    halaqaAPI.mine().then((r) => {
      const list = unwrapList(r);
      setHalaqat(list);
      if (list[0]?._id) setHalaqaId(list[0]._id);
    });
  }, []);

  const loadPending = useCallback(async (id: string) => {
    if (!id) return;
    try {
      const response: any = await recitationsAPI.pending(id);
      setPending(response?.data?.recitations ?? []);
    } catch {
      // 403 : l'utilisateur n'est pas responsable de cette halaqa — la file
      // d'attente ne le concerne simplement pas.
      setPending([]);
    }
  }, []);

  useEffect(() => {
    loadPending(halaqaId);
  }, [halaqaId, loadPending]);

  useEffect(() => () => window.clearInterval(timer.current), []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      mr.onstop = () => {
        setBlob(new Blob(chunks.current, { type: 'audio/webm' }));
        // Le flux doit être coupé explicitement, sinon le voyant du micro
        // reste allumé après l'enregistrement.
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recorder.current = mr;
      setRecording(true);
      setBlob(null);
      setSeconds(0);
      timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setNotice('Accès au micro refusé.');
    }
  };

  const stopRecording = () => {
    recorder.current?.stop();
    window.clearInterval(timer.current);
    setRecording(false);
  };

  const submit = async () => {
    if (!blob || !halaqaId) return;
    const f = Number(from);
    const t = Number(to);
    if (!Number.isInteger(f) || !Number.isInteger(t) || t < f) {
      setNotice('Intervalle de versets invalide.');
      return;
    }

    setSending(true);
    try {
      const form = new FormData();
      form.append('audio', blob, `recitation-${Date.now()}.webm`);
      form.append('halaqaId', halaqaId);
      form.append('surahNumber', surah);
      form.append('fromAyah', String(f));
      form.append('toAyah', String(t));
      form.append('kind', kind);
      form.append('durationSeconds', String(seconds));

      await recitationsAPI.submit(form);
      setBlob(null);
      setSeconds(0);
      setNotice('Récitation envoyée. Votre enseignant sera prévenu.');
      loadPending(halaqaId);
    } catch (e: any) {
      setNotice(e?.error ?? 'Envoi impossible.');
    } finally {
      setSending(false);
    }
  };

  const review = async (item: Pending, status: 'approved' | 'needs_work') => {
    if (status === 'needs_work' && !comment.trim()) {
      setNotice('Une demande de reprise doit indiquer ce qui est à revoir.');
      return;
    }
    try {
      const parsed = parseInt(grade, 10);
      await recitationsAPI.review(item._id, {
        status,
        grade: Number.isInteger(parsed) ? Math.min(100, Math.max(0, parsed)) : undefined,
        comment: comment.trim() || undefined,
      });
      setPending((prev) => prev.filter((p) => p._id !== item._id));
      setReviewing(null);
      setGrade('');
      setComment('');
    } catch (e: any) {
      setNotice(e?.error ?? 'Évaluation impossible.');
    }
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>{t('title')}</h1>

      {notice && (
        <div className="card" role="status" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)' }}>
          {notice}
        </div>
      )}

      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <strong>{t('submit')}</strong>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('halaqa')}</span>
            <select value={halaqaId} onChange={(e) => setHalaqaId(e.target.value)} aria-label="Halaqa">
              {halaqat.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('surah')}</span>
            <input type="number" min={1} max={114} value={surah}
                   onChange={(e) => setSurah(e.target.value)} style={{ width: 90 }} aria-label="Sourate" />
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('fromAyah')}</span>
            <input type="number" min={1} value={from}
                   onChange={(e) => setFrom(e.target.value)} style={{ width: 90 }} aria-label="Du verset" />
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('toAyah')}</span>
            <input type="number" min={1} value={to}
                   onChange={(e) => setTo(e.target.value)} style={{ width: 90 }} aria-label="Au verset" />
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t('type')}</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as any)} aria-label="Type d’exercice">
              <option value="hifz">{t('typeNew')}</option>
              <option value="muraja">{t('typeReview')}</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            className={recording ? 'btn-danger' : 'btn-primary'}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? <IconeArret size={16} /> : <IconeEnregistrer size={16} />}
            <span>{recording ? 'Arrêter' : 'Enregistrer'}</span>
          </button>
          <span style={{ fontFamily: 'monospace', fontSize: 18 }}>{mmss}</span>
          {blob && <audio controls src={URL.createObjectURL(blob)} />}
          <button className="btn-primary" onClick={submit} disabled={!blob || sending}>
            {sending ? 'Envoi…' : 'Envoyer à l’enseignant'}
          </button>
        </div>
      </section>

      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <strong>À valider {pending.length > 0 && `(${pending.length})`}</strong>

        {pending.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Aucune récitation en attente — ou vous n’êtes pas responsable de cette halaqa.
          </p>
        ) : (
          pending.map((item) => (
            <div key={item._id} className="card" style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <strong style={{ flex: 1 }}>
                  {item.student?.displayName ?? item.student?.username} — sourate {item.surahNumber},
                  versets {item.fromAyah}–{item.toAyah}
                  {item.attempt > 1 ? ` · tentative ${item.attempt}` : ''}
                </strong>
                <audio controls src={`${FILES_URL}${item.audioUrl}`} />
                <button
                  className="btn-ghost"
                  onClick={() => setReviewing(reviewing === item._id ? null : item._id)}
                >
                  Évaluer
                </button>
              </div>

              {reviewing === item._id && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <input
                    type="number" min={0} max={100} placeholder="Note / 100"
                    aria-label="Note sur 100"
                    value={grade} onChange={(e) => setGrade(e.target.value)} style={{ width: 120 }}
                  />
                  <textarea
                    placeholder="Remarques (obligatoires pour une demande de reprise)"
                    aria-label="Remarques"
                    value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-danger" onClick={() => review(item, 'needs_work')}>
                      À revoir
                    </button>
                    <button className="btn-primary" onClick={() => review(item, 'approved')}>
                      Valider
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
