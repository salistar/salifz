/**
 * Khatam collaboratif — version web.
 *
 * C'est le différenciateur du produit : les 60 hizb sont répartis entre les
 * membres d'une halaqa, chacun lit sa part, et le groupe achève le Coran
 * ensemble. Aucun concurrent grand public ne le fait bien.
 *
 * Les événements temps réel (`khatamHizbCompleted`, `khatamProgressUpdate`)
 * sont les mêmes que sur le mobile : une progression enregistrée depuis le
 * téléphone s'affiche ici sans rechargement.
 */

import { useEffect, useState } from 'react';
import { khatamAPI } from '../services/api';
import { connectRealtime } from '../services/realtime';
import { useResource, asList, StateBlock } from '../components/useResource';

interface Khatam {
  _id: string;
  title?: string;
  name?: string;
  progress?: { currentKhatamProgress?: number; totalCompleted?: number; khatamCount?: number };
  readingConfig?: { unit?: string; amountPerDay?: number };
  participants?: any[];
}

export default function KhatamPage() {
  const mine = useResource<any>(() => khatamAPI.mine(), []);
  const [live, setLive] = useState<Record<string, number>>({});
  const [title, setTitle] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const list: Khatam[] = asList(mine.data, 'khatams', 'khatam');

  // Le serveur diffuse la progression du groupe : sans cette écoute, deux
  // membres qui lisent en même temps ne verraient l'avancée de l'autre qu'au
  // prochain rechargement.
  useEffect(() => {
    const socket = connectRealtime();

    const onProgress = (payload: any) => {
      if (!payload?.khatamId) return;
      setLive((prev) => ({ ...prev, [payload.khatamId]: payload.progress ?? 0 }));
    };
    const onCompleted = (payload: any) => {
      setNotice(`Khatam achevé 🎉 (${payload?.khatamCount ?? 1})`);
    };

    socket.on('khatamProgressUpdate', onProgress);
    socket.on('khatamCompleted', onCompleted);
    list.forEach((k) => socket.emit('joinKhatam', { khatamId: k._id }));

    return () => {
      socket.off('khatamProgressUpdate', onProgress);
      socket.off('khatamCompleted', onCompleted);
      list.forEach((k) => socket.emit('leaveKhatam', { khatamId: k._id }));
    };
  }, [list]);

  const create = async () => {
    if (!title.trim()) return;
    try {
      await khatamAPI.create({ title: title.trim(), readingConfig: { unit: 'hizb', amountPerDay: 1 } });
      setTitle('');
      setNotice('Khatam créé');
      mine.reload();
    } catch (e: any) {
      setNotice(e?.error ?? 'Création impossible');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Khatam</h1>
      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
        Les 60 hizb répartis entre les membres : le groupe achève le Coran ensemble.
      </p>

      {notice && (
        <div className="card" role="status" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)' }}>
          {notice}
        </div>
      )}

      <div className="card" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          style={{ flex: 1, minWidth: 200 }}
          placeholder="Titre du khatam"
          aria-label="Titre du khatam"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn-primary" onClick={create} disabled={!title.trim()}>
          Créer
        </button>
      </div>

      <StateBlock
        loading={mine.loading}
        error={mine.error}
        empty={!mine.loading && list.length === 0}
        emptyText="Aucun khatam en cours. Créez-en un pour votre halaqa."
        onRetry={mine.reload}
      />

      <div style={{ display: 'grid', gap: 10 }}>
        {list.map((k) => {
          const percent = Math.round(live[k._id] ?? k.progress?.currentKhatamProgress ?? 0);
          return (
            <div key={k._id} className="card">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <strong style={{ flex: 1 }}>{k.title ?? k.name ?? 'Khatam'}</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {k.participants?.length ?? 0} participant(s)
                </span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{percent}%</span>
              </div>

              <div
                style={{
                  height: 8, borderRadius: 4, marginTop: 10,
                  background: 'var(--divider)', overflow: 'hidden',
                }}
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div style={{ height: '100%', width: `${percent}%`, background: 'var(--primary)' }} />
              </div>

              <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 12 }}>
                {k.readingConfig?.amountPerDay ?? 1} {k.readingConfig?.unit ?? 'hizb'} par jour
                {k.progress?.khatamCount ? ` · ${k.progress.khatamCount} khatam achevé(s)` : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
