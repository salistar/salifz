/**
 * Chargement d'une ressource distante — Salifz web
 *
 * Les dix pages ajoutées pour atteindre la parité avec le mobile ont toutes le
 * même besoin : appeler l'API, afficher un état d'attente, et distinguer
 * « vide » de « en erreur ». Écrire ce cycle dix fois, c'est dix occasions de
 * l'écrire un peu différemment — et de laisser une page tourner indéfiniment
 * sur un chargement qui a échoué.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Resource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/** Déballe les formes de réponse du serveur (`{data: …}` ou la valeur directe). */
export function unwrap(response: any): any {
  return response?.data ?? response;
}

/** Extrait une liste, quelle que soit la clé sous laquelle le serveur la range. */
export function asList(response: any, ...keys: string[]): any[] {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  const firstArray = Object.values(payload ?? {}).find(Array.isArray);
  return (firstArray as any[]) ?? [];
}

export function useResource<T>(
  fetcher: () => Promise<any>,
  deps: unknown[] = []
): Resource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    run()
      .then((response) => {
        if (alive) setData(response);
      })
      .catch((e: any) => {
        // Un 403 n'est pas une panne : c'est une information — la ressource
        // existe mais ne concerne pas cet utilisateur.
        if (alive) setError(e?.error ?? 'Chargement impossible');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [run, tick]);

  return { data, loading, error, reload: () => setTick((t) => t + 1) };
}

/** Bloc d'état commun : attente, erreur, ou vide. */
export function StateBlock({
  loading,
  error,
  empty,
  emptyText,
  onRetry,
}: {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
}) {
  // Ce bloc est monté par dix écrans : ses libellés étaient en français en
  // dur, donc affichés tels quels en mode arabe/anglais. Les clés existaient
  // déjà dans common.json.
  const { t } = useTranslation('common');

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>{t('loading')}</p>;

  if (error) {
    return (
      <div className="card" role="alert" style={{ background: 'var(--error-soft)', color: 'var(--error)' }}>
        {error}
        {onRetry && (
          <button className="btn-ghost" style={{ marginInlineStart: 12 }} onClick={onRetry}>
            {t('retry')}
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <p style={{ color: 'var(--text-secondary)' }}>{emptyText ?? t('empty')}</p>
    );
  }

  return null;
}
