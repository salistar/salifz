import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quranAPI } from '../services/api';

const WORD_AUDIO_CDN = 'https://audio.qurancdn.com';

interface Word {
  position: number;
  char_type_name: string;
  text_uthmani?: string;
  text?: string;
  audio_url?: string | null;
  translation?: { text?: string };
  transliteration?: { text?: string };
}

export default function WordByWordPage() {
  const { surah = '1', ayah = '1' } = useParams();
  const navigate = useNavigate();

  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await quranAPI.wordByWord(Number(surah), Number(ayah));
      setWords(response?.data?.words ?? []);
    } catch {
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, [surah, ayah]);

  useEffect(() => {
    load();
  }, [load]);

  // Le son doit s'arrêter en quittant la page, sinon il continue en fond.
  useEffect(() => () => audio.current?.pause(), []);

  const play = (word: Word) => {
    if (!word.audio_url) return;
    audio.current?.pause();
    const element = new Audio(`${WORD_AUDIO_CDN}/${word.audio_url}`);
    audio.current = element;
    setPlaying(word.position);
    element.onended = () => setPlaying(null);
    element.play().catch(() => setPlaying(null));
  };

  // Le rond de fin de verset porte un numéro, pas un sens à traduire.
  const actual = words.filter((w) => w.char_type_name !== 'end');

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-ghost" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <h1 style={{ margin: 0, flex: 1 }}>
          Mot à mot — sourate {surah}, verset {ayah}
        </h1>
      </div>

      <p style={{ margin: 0, color: 'var(--text-muted)' }}>
        Cliquez sur un mot pour l’entendre.
      </p>

      {loading ? (
        <p>Chargement…</p>
      ) : actual.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)' }}>Aucune donnée pour ce verset.</p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row-reverse',
            flexWrap: 'wrap',
            gap: 10,
            justifyContent: 'flex-start',
          }}
        >
          {actual.map((word) => (
            <button
              key={word.position}
              onClick={() => play(word)}
              disabled={!word.audio_url}
              aria-label={
                word.translation?.text
                  ? `${word.text_uthmani} — ${word.translation.text}`
                  : word.text_uthmani
              }
              style={{
                minWidth: 120,
                padding: '12px 14px',
                background: playing === word.position ? 'var(--primary-soft)' : 'var(--surface)',
                border: `1px solid ${
                  playing === word.position ? 'var(--primary)' : 'var(--border)'
                }`,
                borderRadius: 12,
                color: 'var(--text)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24, direction: 'rtl' }}>
                {word.text_uthmani ?? word.text}
              </div>
              {word.transliteration?.text && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {word.transliteration.text}
                </div>
              )}
              {word.translation?.text && (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {word.translation.text}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          className="btn-ghost"
          disabled={Number(ayah) <= 1}
          onClick={() => navigate(`/mot-a-mot/${surah}/${Number(ayah) - 1}`)}
        >
          ← Verset précédent
        </button>
        <button
          className="btn-ghost"
          onClick={() => navigate(`/mot-a-mot/${surah}/${Number(ayah) + 1}`)}
        >
          Verset suivant →
        </button>
      </div>
    </div>
  );
}
