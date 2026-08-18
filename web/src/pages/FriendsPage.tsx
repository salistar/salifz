/**
 * Amis — liste, demandes reçues et recherche.
 *
 * La pastille de présence vient de la couche temps réel. Quand celle-ci ne
 * répond pas, le serveur renvoie `null` plutôt que `false` : on masque alors
 * l'indicateur au lieu d'afficher « hors ligne » à quelqu'un qui est connecté.
 */

import { useState } from 'react';
import { socialAPI } from '../services/api';
import { useResource, asList, StateBlock } from '../components/useResource';

type Onglet = 'amis' | 'demandes' | 'recherche';

export default function FriendsPage() {
  const [onglet, setOnglet] = useState<Onglet>('amis');
  const [recherche, setRecherche] = useState('');
  const [resultats, setResultats] = useState<any[]>([]);
  const [chercheEnCours, setChercheEnCours] = useState(false);
  const [avis, setAvis] = useState<string | null>(null);

  const amis = useResource<any>(() => socialAPI.friends(), []);
  const demandes = useResource<any>(() => socialAPI.requests(), []);

  const listeAmis = asList(amis.data, 'friends', 'items');
  const recues = asList(demandes.data, 'received');

  const chercher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recherche.trim().length < 2) return;
    setChercheEnCours(true);
    setAvis(null);
    try {
      const r: any = await socialAPI.search(recherche.trim());
      const data = r?.data ?? r;
      setResultats(Array.isArray(data) ? data : data?.users ?? data?.results ?? []);
    } catch (err: any) {
      setAvis(err?.error ?? 'Recherche impossible');
      setResultats([]);
    } finally {
      setChercheEnCours(false);
    }
  };

  const action = async (fn: () => Promise<any>, message: string) => {
    try {
      await fn();
      setAvis(message);
      amis.reload();
      demandes.reload();
    } catch (err: any) {
      setAvis(err?.error ?? 'Action impossible');
    }
  };

  const actif = onglet === 'amis' ? amis : onglet === 'demandes' ? demandes : null;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, flex: 1 }}>Amis</h1>
        {avis && (
          <span role="status" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {avis}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="tablist">
        {([
          ['amis', `Mes amis${listeAmis.length ? ` (${listeAmis.length})` : ''}`],
          ['demandes', `Demandes${recues.length ? ` (${recues.length})` : ''}`],
          ['recherche', 'Rechercher'],
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
              ? 'Aucun ami pour l’instant — cherchez quelqu’un par son nom d’utilisateur.'
              : 'Aucune demande en attente.'
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
                  onClick={() => action(() => socialAPI.remove(a._id ?? a.id), 'Ami retiré')}
                >
                  Retirer
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
                    onClick={() => action(() => socialAPI.reject(d._id ?? d.id), 'Demande refusée')}
                  >
                    Refuser
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => action(() => socialAPI.accept(d._id ?? d.id), 'Demande acceptée')}
                  >
                    Accepter
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
              placeholder="Nom d’utilisateur"
              aria-label="Rechercher un membre"
              style={{ flex: 1 }}
            />
            <button className="btn-primary" type="submit" disabled={chercheEnCours || recherche.trim().length < 2}>
              {chercheEnCours ? 'Recherche…' : 'Chercher'}
            </button>
          </form>

          {recherche.trim().length > 0 && recherche.trim().length < 2 && (
            <small style={{ color: 'var(--text-muted)' }}>Deux caractères au minimum.</small>
          )}

          <div style={{ display: 'grid', gap: 8 }}>
            {resultats.map((u: any, i: number) => (
              <Personne
                key={u._id ?? i}
                personne={u}
                actions={
                  <button
                    className="btn-ghost"
                    onClick={() => action(() => socialAPI.sendRequest(u._id ?? u.id), 'Demande envoyée')}
                  >
                    Ajouter
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
  const nom = personne.displayName ?? personne.username ?? 'Membre';
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
          Niveau {personne.gamification?.level ?? 1}
          {personne.gamification?.totalXP != null && ` · ${personne.gamification.totalXP} XP`}
        </span>
      </div>

      {/* `null` signifie « présence inconnue » : on n'affiche alors rien. */}
      {enLigne != null && (
        <span
          title={enLigne ? 'En ligne' : 'Hors ligne'}
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
          {enLigne ? 'En ligne' : 'Hors ligne'}
        </span>
      )}

      <div style={{ display: 'flex', gap: 8 }}>{actions}</div>
    </div>
  );
}
