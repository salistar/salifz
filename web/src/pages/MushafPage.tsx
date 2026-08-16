/**
 * Mushaf — version web
 *
 * Reprend la vue page par page et le masquage progressif de l'application
 * mobile, servis par la même route `/quran/page/:n`. Un utilisateur qui passe
 * du téléphone au navigateur retrouve la même page et le même exercice.
 */

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { quranAPI } from '../services/api';

const TOTAL_PAGES = 604;

interface Word {
  position: number;
  line: number;
  text: string;
  isEnd: boolean;
  verseKey: string;
}

interface Page {
  page: number;
  juz: number | null;
  hizb: number | null;
  lines: { line: number; words: Word[] }[];
}

type MaskLevel = 0 | 1 | 2 | 3;

const MASKS: { label: string; reveal: (i: number) => 'full' | 'hint' | 'hidden' }[] = [
  { label: 'Texte complet', reveal: () => 'full' },
  { label: 'Premier mot de chaque ligne', reveal: (i) => (i === 0 ? 'full' : 'hint') },
  { label: 'Indices seulement', reveal: () => 'hint' },
  { label: 'Tout masqué', reveal: () => 'hidden' },
];

export default function MushafPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mask, setMask] = useState<MaskLevel>(0);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const load = useCallback(async (target: number) => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await quranAPI.page(target);
      setData(response?.data ?? response);
      setRevealed(new Set());
    } catch {
      setError('Page indisponible');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const active = MASKS[mask];

  const toggleWord = (key: string) => {
    if (mask === 0) return;
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const renderWord = (word: Word, index: number) => {
    const key = `${word.verseKey}-${word.position}`;

    // Le rond de fin de verset porte son numéro : il structure la page et
    // n'est jamais masqué.
    if (word.isEnd) {
      return (
        <span key={key} style={{ color: 'var(--primary)', margin: '0 4px' }}>
          {word.text}
        </span>
      );
    }

    const state = revealed.has(key) ? 'full' : active.reveal(index);
    const shared = {
      onClick: () => toggleWord(key),
      onDoubleClick: () => {
        const [s, a] = word.verseKey.split(':');
        navigate(`/mot-a-mot/${s}/${a}`);
      },
      title: 'Clic : dévoiler · Double-clic : traduction mot à mot',
      style: { cursor: 'pointer', margin: '0 4px' } as const,
    };

    if (state === 'full') {
      return (
        <span key={key} {...shared}>
          {word.text}
        </span>
      );
    }

    return (
      <span
        key={key}
        {...shared}
        style={{
          ...shared.style,
          color: 'var(--text-muted)',
          background: 'var(--background-alt)',
          borderRadius: 4,
          padding: '0 6px',
        }}
      >
        {state === 'hint' ? `${Array.from(word.text)[0] ?? ''}…` : '   '}
      </span>
    );
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, flex: 1 }}>
          Page {data?.page ?? page}
          {data?.juz ? ` · Juz ${data.juz}` : ''}
          {data?.hizb ? ` · Hizb ${data.hizb}` : ''}
        </h1>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Masquage</span>
          <select
            value={mask}
            onChange={(e) => {
              setMask(Number(e.target.value) as MaskLevel);
              setRevealed(new Set());
            }}
            aria-label="Niveau de masquage"
          >
            {MASKS.map((m, i) => (
              <option key={m.label} value={i}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {mask > 0 && (
        <div
          className="card"
          style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)', padding: 10 }}
        >
          Cliquez sur un mot pour le dévoiler · double-cliquez pour sa traduction mot à mot.
        </div>
      )}

      <div className="card" style={{ minHeight: 320 }}>
        {loading ? (
          <p>Chargement…</p>
        ) : error ? (
          <>
            <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
            <button className="btn-primary" onClick={() => load(page)}>
              Réessayer
            </button>
          </>
        ) : (
          <div className="arabic" style={{ textAlign: 'center' }}>
            {data?.lines.map((line) => (
              <div key={line.line}>{line.words.map((w, i) => renderWord(w, i))}</div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
        <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          ← Précédente
        </button>
        <input
          type="number"
          min={1}
          max={TOTAL_PAGES}
          value={page}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (next >= 1 && next <= TOTAL_PAGES) setPage(next);
          }}
          aria-label="Numéro de page"
          style={{ width: 90, textAlign: 'center' }}
        />
        <span style={{ color: 'var(--text-secondary)' }}>/ {TOTAL_PAGES}</span>
        <button
          className="btn-ghost"
          disabled={page >= TOTAL_PAGES}
          onClick={() => setPage(page + 1)}
        >
          Suivante →
        </button>
      </div>
    </div>
  );
}
