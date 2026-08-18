/**
 * Notifications reçues.
 *
 * Cet écran ne demande pas la permission d'envoi du navigateur : la solliciter
 * au chargement d'une page, sans qu'on ait rien demandé, est le moyen le plus
 * sûr de se la faire refuser définitivement.
 *
 * Ce qui change : les notifications sont **groupées par période** — aujourd'hui,
 * hier, cette semaine, plus tôt. Une liste plate de vingt lignes datées oblige
 * à lire chaque horodatage pour savoir ce qui est récent ; les groupes le
 * disent d'un coup d'œil.
 *
 * Chaque type porte son icône propre plutôt qu'une cloche unique : un retour
 * d'enseignant et une demande d'ami n'appellent pas la même réaction.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationsAPI } from '../services/api';
import { useResource, asList, StateBlock } from '../components/useResource';
import { MihrabArch } from '../components/Ornements';
import {
  IconeNotifications,
  IconeAmis,
  IconeRecitations,
  IconeSerie,
  IconeKhatam,
  IconeRecompense,
} from '../components/Icones';
import { formaterDate } from '../i18n';

type Periode = 'today' | 'yesterday' | 'thisWeek' | 'earlier';

const ORDRE: Periode[] = ['today', 'yesterday', 'thisWeek', 'earlier'];

function periode(date?: string): Periode {
  if (!date) return 'earlier';
  const jour = new Date(date);
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  const debutJour = new Date(jour);
  debutJour.setHours(0, 0, 0, 0);

  const ecart = Math.round((aujourdhui.getTime() - debutJour.getTime()) / 86_400_000);
  if (ecart <= 0) return 'today';
  if (ecart === 1) return 'yesterday';
  if (ecart <= 7) return 'thisWeek';
  return 'earlier';
}

/**
 * L'icône suit le type renvoyé par le serveur. Le repli sur la cloche n'arrive
 * que pour un type inconnu — pas pour tous, comme c'était le cas.
 */
function IconePour({ type }: { type?: string }) {
  const t = String(type ?? '').toLowerCase();
  if (t.includes('friend') || t.includes('ami')) return <IconeAmis size={18} />;
  if (t.includes('recitation') || t.includes('review')) return <IconeRecitations size={18} />;
  if (t.includes('streak') || t.includes('serie')) return <IconeSerie size={18} />;
  if (t.includes('khatam')) return <IconeKhatam size={18} />;
  if (t.includes('reward') || t.includes('milestone') || t.includes('badge'))
    return <IconeRecompense size={18} />;
  return <IconeNotifications size={18} />;
}

export default function NotificationsPage() {
  const { t, i18n } = useTranslation(['notifications', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  const liste = useResource<any>(() => notificationsAPI.list(), []);
  const [occupe, setOccupe] = useState(false);

  const items = asList(liste.data, 'notifications', 'items');
  const nonLues = items.filter((n: any) => !(n.read ?? n.isRead));

  const groupes = useMemo(() => {
    const table: Record<Periode, any[]> = { today: [], yesterday: [], thisWeek: [], earlier: [] };
    for (const n of items) table[periode(n.createdAt)].push(n);
    return table;
  }, [items]);

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
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="display-md" style={{ margin: 0, flex: 1 }}>{t('title')}</h1>
        {nonLues.length > 0 && (
          <>
            <span className="caption">{t('unread', { count: nonLues.length })}</span>
            <button className="btn-ghost" onClick={toutMarquer} disabled={occupe}>
              {t('markAllRead')}
            </button>
          </>
        )}
      </div>

      <StateBlock loading={liste.loading} error={liste.error} onRetry={liste.reload} />

      {/* --- État vide ------------------------------------------------------ */}
      {!liste.loading && !liste.error && items.length === 0 && (
        <section
          className="sacred-card"
          style={{ display: 'grid', justifyItems: 'center', gap: 14, padding: 40, textAlign: 'center' }}
        >
          <MihrabArch style={{ width: 110 }} />
          <strong className="title-lg">{t('emptyTitle')}</strong>
          <p style={{ margin: 0, maxWidth: 440, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {t('emptyBody')}
          </p>
        </section>
      )}

      {/* --- Groupes -------------------------------------------------------- */}
      {ORDRE.filter((p) => groupes[p].length > 0).map((p) => (
        <section key={p} style={{ display: 'grid', gap: 8 }}>
          <h2 className="overline" style={{ margin: 0 }}>{t(p)}</h2>

          {groupes[p].map((n: any, i: number) => {
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
                  padding: '12px 14px',
                  // Une notification non lue doit se repérer sans lire : un
                  // filet en bord de départ suffit, sans changer la taille du
                  // texte. `borderInlineStart` suit le sens de lecture.
                  borderInlineStartWidth: 3,
                  borderInlineStartColor: lue ? 'var(--border)' : 'var(--accent)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{ color: lue ? 'var(--text-muted)' : 'var(--brand)', marginBlockStart: 2 }}
                >
                  <IconePour type={n.type ?? n.category} />
                </span>

                <div style={{ flex: 1, minInlineSize: 0 }}>
                  <strong style={{ display: 'block', fontWeight: lue ? 500 : 700 }}>
                    {n.title ?? t('notification')}
                  </strong>
                  <span className="caption">{n.body ?? n.message ?? ''}</span>
                  {n.createdAt && (
                    <div className="caption" style={{ marginBlockStart: 4, color: 'var(--text-faint)' }}>
                      {formaterDate(n.createdAt, locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  )}
                </div>

                {!lue && (
                  <button
                    className="btn-ghost"
                    style={{ padding: '4px 12px', fontSize: 13, minHeight: 32 }}
                    onClick={() => marquer(id)}
                  >
                    {t('markRead')}
                  </button>
                )}
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}
