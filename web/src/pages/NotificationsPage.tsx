/**
 * Notifications reçues.
 *
 * Cet écran ne demande pas la permission d'envoi du navigateur : la solliciter
 * au chargement d'une page, sans qu'on ait rien demandé, est le moyen le plus
 * sûr de se la faire refuser définitivement.
 */

import { useState } from 'react';
import { notificationsAPI } from '../services/api';
import { useResource, asList, StateBlock } from '../components/useResource';

export default function NotificationsPage() {
  const liste = useResource<any>(() => notificationsAPI.list(), []);
  const [occupe, setOccupe] = useState(false);

  const items = asList(liste.data, 'notifications', 'items');
  const nonLues = items.filter((n: any) => !(n.read ?? n.isRead));

  const toutMarquer = async () => {
    setOccupe(true);
    try {
      await notificationsAPI.markAllRead();
      liste.reload();
    } finally {
      setOccupe(false);
    }
  };

  const marquer = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      liste.reload();
    } catch {
      /* le rechargement rétablira l'état réel */
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, flex: 1 }}>Notifications</h1>
        {nonLues.length > 0 && (
          <button className="btn-ghost" onClick={toutMarquer} disabled={occupe}>
            Tout marquer comme lu ({nonLues.length})
          </button>
        )}
      </div>

      <StateBlock
        loading={liste.loading}
        error={liste.error}
        empty={!liste.loading && items.length === 0}
        emptyText="Aucune notification pour l’instant."
        onRetry={liste.reload}
      />

      <div style={{ display: 'grid', gap: 8 }}>
        {items.map((n: any, i: number) => {
          const lue = n.read ?? n.isRead;
          const id = n._id ?? n.id ?? String(i);
          return (
            <article
              key={id}
              className="card"
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                // Une notification non lue doit se repérer sans lire : une
                // bordure colorée suffit, sans changer la taille du texte.
                borderInlineStartWidth: 4,
                borderInlineStartColor: lue ? 'var(--border)' : 'var(--primary)',
              }}
            >
              <span aria-hidden="true" style={{ fontSize: 22 }}>{n.icon ?? '🔔'}</span>

              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontWeight: lue ? 500 : 700 }}>
                  {n.title ?? 'Notification'}
                </strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {n.body ?? n.message ?? ''}
                </span>
                {n.createdAt && (
                  <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                    {new Date(n.createdAt).toLocaleString('fr-FR')}
                  </div>
                )}
              </div>

              {!lue && (
                <button className="btn-ghost" onClick={() => marquer(id)}>
                  Lu
                </button>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
