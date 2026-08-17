/**
 * Boutique — achats en gemmes.
 *
 * Les gemmes sont une monnaie interne, gagnée par l'usage : rien ici ne touche
 * à un paiement réel. Les abonnements passent par l'App Store ou Google Play,
 * et le serveur refuse d'accorder une offre sans reçu validé.
 *
 * Le solde affiché vient du serveur après chaque achat : le décrémenter
 * localement afficherait un solde optimiste qui divergerait au premier échec.
 */

import { useState } from 'react';
import { shopAPI } from '../services/api';
import { useResource, asList, unwrap, StateBlock } from '../components/useResource';
import { useAuth } from '../store';

/** Certains libellés du serveur sont localisés (`{ ar, en }`) : les rendre
 *  directement ferait planter React. */
function label(value: any, locale = 'fr'): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return value[locale] ?? value.fr ?? value.en ?? value.ar ?? '';
  return String(value);
}

export default function ShopPage() {
  const shop = useResource<any>(() => shopAPI.items(), []);
  const daily = useResource<any>(() => shopAPI.daily(), []);
  const { user, restore } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const items = asList(shop.data, 'items', 'shop');
  const gems = user?.gamification?.gems ?? 0;

  const buy = async (item: any) => {
    const id = item._id ?? item.id ?? item.itemId;
    setBusy(id);
    setNotice(null);
    try {
      await shopAPI.buy(id);
      setNotice(`${label(item.name) || 'Article'} acheté`);
      // On relit le compte : le solde fait autorité côté serveur.
      await restore();
      shop.reload();
    } catch (e: any) {
      setNotice(e?.error ?? 'Achat impossible');
    } finally {
      setBusy(null);
    }
  };

  const claim = async () => {
    try {
      await shopAPI.claimDaily();
      setNotice('Récompense quotidienne récupérée');
      await restore();
      daily.reload();
    } catch (e: any) {
      setNotice(e?.error ?? 'Récompense indisponible');
    }
  };

  const dailyPayload = unwrap(daily.data) ?? {};
  const canClaim = dailyPayload.available ?? dailyPayload.canClaim ?? false;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, flex: 1 }}>Boutique</h1>
        <span className="card" style={{ padding: '8px 14px' }}>
          💎 <strong>{gems}</strong>
        </span>
      </div>

      {notice && (
        <div className="card" role="status" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)' }}>
          {notice}
        </div>
      )}

      {canClaim && (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🎁</span>
          <span style={{ flex: 1 }}>Récompense quotidienne disponible</span>
          <button className="btn-primary" onClick={claim}>
            Récupérer
          </button>
        </div>
      )}

      <StateBlock
        loading={shop.loading}
        error={shop.error}
        empty={!shop.loading && items.length === 0}
        emptyText="La boutique est vide pour le moment."
        onRetry={shop.reload}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {items.map((item: any, i: number) => {
          const id = item._id ?? item.id ?? item.itemId ?? i;
          const price = item.price ?? item.cost ?? 0;
          const tooExpensive = price > gems;

          return (
            <div key={id} className="card" style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontSize: 30 }}>{item.icon ?? '🛍️'}</div>
              <strong>{label(item.name ?? item.title) || 'Article'}</strong>
              {label(item.description) && (
                <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  {label(item.description)}
                </span>
              )}
              <button
                className="btn-primary"
                onClick={() => buy(item)}
                disabled={busy === id || tooExpensive}
                // Un bouton grisé sans explication laisse l'utilisateur deviner.
                title={tooExpensive ? 'Pas assez de gemmes' : undefined}
              >
                {busy === id ? 'Achat…' : `💎 ${price}`}
              </button>
              {tooExpensive && (
                <small style={{ color: 'var(--text-muted)' }}>Il vous manque {price - gems} gemmes</small>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
