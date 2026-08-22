/**
 * Amis — liste, demandes reçues et recherche.
 *
 * La pastille de présence vient de la couche temps réel. Quand celle-ci ne
 * répond pas, le serveur renvoie `null` plutôt que `false` : on masque alors
 * l'indicateur au lieu d'afficher « hors ligne » à quelqu'un qui est connecté.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { socialAPI } from '../services/api';
import { useResource, asList, StateBlock } from '../components/useResource';

type Onglet = 'amis' | 'demandes' | 'recherche';

export default function FriendsPage() {
  const { t } = useTranslation(['friends', 'common']);
  const [onglet, setOnglet] = useState<Onglet>('amis');
  const [recherche, setRecherche] = useState('');
  const [resultats, setResultats] = useState<any[]>([]);
  const [chercheEnCours, setChercheEnCours] = useState(false);
  const [avis, setAvis] = useState<string | null>(null);
  // Identifiant de l'action en cours : verrouille le bouton concerné et
  // évite qu'un double-clic parte en double requête.
  const [enCours, setEnCours] = useState<string | null>(null);

  const amis = useResource<any>(() => socialAPI.friends(), []);
  const demandes = useResource<any>(() => socialAPI.requests(), []);

  const listeAmis = asList(amis.data, 'friends', 'items');
  const recues = asList(demandes.data, 'received');

  const [aCherche, setACherche] = useState(false);

  const chercher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recherche.trim().length < 2) return;
    setChercheEnCours(true);
    setAvis(null);
    try {
      const r: any = await socialAPI.search(recherche.trim());
      const data = r?.data ?? r;
      setResultats(Array.isArray(data) ? data : data?.users ?? data?.results ?? []);
      setACherche(true);
    } catch (err: any) {
      setAvis(err?.error ?? t('common:errorGeneric'));
      setResultats([]);
    } finally {
      setChercheEnCours(false);
    }
  };

  const action = async (cle: string, fn: () => Promise<any>, message: string) => {
    if (enCours) return;
    setEnCours(cle);
    setAvis(null);
    try {
      await fn();
      setAvis(message);
      amis.reload();
      demandes.reload();
    } catch (err: any) {
      setAvis(err?.error ?? t('common:errorGeneric'));
    } finally {
      setEnCours(null);
    }
  };

  const actif = onglet === 'amis' ? amis : onglet === 'demandes' ? demandes : null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 className="display-md" style={{ margin: 0, flex: 1 }}>{t('title')}</h1>
        {avis && (
          <span role="status" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {avis}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="tablist">
        {([
          ['amis', listeAmis.length ? `${t('mine')} (${listeAmis.length})` : t('mine')],
          ['demandes', recues.length ? `${t('requests')} (${recues.length})` : t('requests')],
          ['recherche', t('search')],
        ] as const).map(([cle, libelle]) => (
          <button
            key={cle}
            role="tab"
            aria-selected={onglet === cle}
            className={onglet === cle ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setOnglet(cle)}
          >
            {libelle}
          </button>
        ))}
      </div>

      {actif && (
        <StateBlock
          loading={actif.loading}
          error={actif.error}
          empty={!actif.loading && (onglet === 'amis' ? listeAmis : recues).length === 0}
          emptyText={
            onglet === 'amis'
              ? t('emptyBody')
              : t('noRequests')
          }
          onRetry={actif.reload}
        />
      )}

      {onglet === 'amis' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {listeAmis.map((a: any, i: number) => (
            <Personne
              key={a._id ?? i}
              personne={a}
              actions={
                <button
                  className="btn-danger"
                  disabled={enCours === (a._id ?? a.id)}
                  onClick={() => {
                    if (!window.confirm(t('confirmRemove'))) return;
                    action(a._id ?? a.id, () => socialAPI.remove(a._id ?? a.id), t('removed'));
                  }}
                >
                  {enCours === (a._id ?? a.id) ? t('common:loading') : t('remove')}
                </button>
              }
            />
          ))}
        </div>
      )}

      {onglet === 'demandes' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {recues.map((d: any, i: number) => (
            <Personne
              key={d._id ?? i}
              personne={d}
              actions={
                <>
                  <button
                    className="btn-ghost"
                    disabled={enCours === (d._id ?? d.id)}
                    onClick={() => action(d._id ?? d.id, () => socialAPI.reject(d._id ?? d.id), t('declined'))}
                  >
                    {t('decline')}
                  </button>
                  <button
                    className="btn-primary"
                    disabled={enCours === (d._id ?? d.id)}
                    onClick={() => action(d._id ?? d.id, () => socialAPI.accept(d._id ?? d.id), t('accepted'))}
                  >
                    {enCours === (d._id ?? d.id) ? t('common:loading') : t('accept')}
                  </button>
                </>
              }
            />
          ))}
        </div>
      )}

      {onglet === 'recherche' && (
        <div style={{ display: 'grid', gap: 12 }}>
          <form onSubmit={chercher} style={{ display: 'flex', gap: 8 }}>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={t('searchPlaceholder')}
              aria-label={t('search')}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" type="submit" disabled={chercheEnCours || recherche.trim().length < 2}>
              {chercheEnCours ? t('common:loading') : t('search')}
            </button>
          </form>

          {recherche.trim().length > 0 && recherche.trim().length < 2 && (
            <small style={{ color: 'var(--text-muted)' }}>{t('searchPlaceholder')}</small>
          )}

          {/* Aucun résultat : la zone restait blanche, indiscernable d'un bug. */}
          {aCherche && !chercheEnCours && resultats.length === 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>{t('noResults')}</p>
          )}

          <div style={{ display: 'grid', gap: 8 }}>
            {resultats.map((u: any, i: number) => (
              <Personne
                key={u._id ?? i}
                personne={u}
                actions={
                  <button
                    className="btn-ghost"
                    disabled={enCours === (u._id ?? u.id)}
                    onClick={() => action(u._id ?? u.id, () => socialAPI.sendRequest(u._id ?? u.id), t('requestSent'))}
                  >
                    {enCours === (u._id ?? u.id) ? t('common:loading') : t('add')}
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Personne({ personne, actions }: { personne: any; actions: React.ReactNode }) {
  const { t } = useTranslation('friends');
  const nom = personne.displayName ?? personne.username ?? t('title');
  const enLigne = personne.isOnline;

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12 }}>
      <div
        aria-hidden="true"
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--primary-soft)',
          color: 'var(--primary-dark)',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {String(nom).charAt(0).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ display: 'block' }}>{nom}</strong>
        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
          {t('level', { n: personne.gamification?.level ?? 1 })}
          {personne.gamification?.totalXP != null && ` · ${personne.gamification.totalXP} XP`}
        </span>
      </div>

      {/* `null` signifie « présence inconnue » : on n'affiche alors rien. */}
      {enLigne != null && (
        <span
          title={enLigne ? t('online') : t('offline')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 5,
              background: enLigne ? 'var(--primary)' : 'var(--text-muted)',
            }}
          />
          {enLigne ? t('online') : t('offline')}
        </span>
      )}

      <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  );
}
