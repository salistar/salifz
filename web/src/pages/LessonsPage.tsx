/**
 * Leçons — progression sourate par sourate.
 *
 * S'appuie sur `/quran/surahs` et `/progress/overview` : la progression
 * affichée est celle du serveur, la même que sur le téléphone. Rien n'est
 * recalculé côté client — c'était précisément le défaut corrigé sur le mobile,
 * où la gamification restait figée sur des valeurs par défaut.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { quranAPI, progressAPI } from '../services/api';
import { useResource, asList, unwrap, StateBlock } from '../components/useResource';

interface Surah {
  number?: number;
  id?: number;
  name?: string;
  nameArabic?: string;
  englishName?: string;
  nameEn?: string;
  numberOfAyahs?: number;
  ayahs?: number;
}

export default function LessonsPage() {
  const surahs = useResource<any>(() => quranAPI.surahs(), []);
  const progress = useResource<any>(() => progressAPI.overview(), []);
  const [query, setQuery] = useState('');

  const list: Surah[] = useMemo(
    () => asList(surahs.data, 'surahs'),
    [surahs.data]
  );

  // La progression arrive indexée par sourate ; on la ramène à une table
  // simple pour éviter une recherche linéaire par ligne affichée.
  const byNumber = useMemo(() => {
    const payload = unwrap(progress.data) ?? {};
    const entries = Array.isArray(payload.surahs) ? payload.surahs : [];
    const map: Record<number, any> = {};
    for (const s of entries) map[s.surahNumber ?? s.number] = s;
    return map;
  }, [progress.data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => {
      const num = String(s.number ?? s.id ?? '');
      const en = (s.englishName ?? s.nameEn ?? '').toLowerCase();
      const ar = s.nameArabic ?? s.name ?? '';
      return num === q || en.includes(q) || ar.includes(query.trim());
    });
  }, [list, query]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, flex: 1 }}>Leçons</h1>
        <input
          placeholder="Rechercher une sourate"
          aria-label="Rechercher une sourate"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ minWidth: 220 }}
        />
      </div>

      <StateBlock
        loading={surahs.loading}
        error={surahs.error}
        empty={!surahs.loading && filtered.length === 0}
        emptyText="Aucune sourate ne correspond."
        onRetry={surahs.reload}
      />

      <div style={{ display: 'grid', gap: 8 }}>
        {filtered.map((s) => {
          const number = s.number ?? s.id ?? 0;
          const total = s.numberOfAyahs ?? s.ayahs ?? 0;
          const done = byNumber[number]?.ayatMemorized ?? 0;
          const percent = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div key={number} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  background: 'var(--primary-soft)', color: 'var(--primary-dark)',
                  display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 13,
                }}
              >
                {number}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                  <strong style={{ direction: 'rtl' }}>{s.nameArabic ?? s.name}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    {s.englishName ?? s.nameEn} · {total} versets
                  </span>
                </div>

                <div
                  style={{
                    height: 4, borderRadius: 2, marginTop: 8,
                    background: 'var(--divider)', overflow: 'hidden',
                  }}
                >
                  <div style={{ height: '100%', width: `${percent}%`, background: 'var(--primary)' }} />
                </div>
              </div>

              <span style={{ color: 'var(--text-secondary)', fontSize: 13, minWidth: 42, textAlign: 'right' }}>
                {percent}%
              </span>

              <Link to={`/mot-a-mot/${number}/1`} className="btn-ghost" style={{ textDecoration: 'none' }}>
                Étudier
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
