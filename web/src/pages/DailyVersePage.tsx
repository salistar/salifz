/**
 * Verset du jour.
 *
 * Le verset est choisi par le serveur à partir de la date : il reste le même
 * toute la journée. Le texte vient de l'API Coran ; quand elle ne répond pas,
 * le serveur renvoie 503 et cette page affiche l'indisponibilité — elle ne
 * montre jamais de texte de remplacement à la place du texte coranique.
 */

import { verseAPI } from '../services/api';
import { useResource, unwrap } from '../components/useResource';

export default function DailyVersePage() {
  const ressource = useResource<any>(() => verseAPI.daily(), []);
  const v = unwrap(ressource.data)?.verse ?? {};

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0 }}>Verset du jour</h1>

      {ressource.loading && (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>Chargement…</div>
      )}

      {ressource.error && (
        <div className="card" role="alert" style={{ display: 'grid', gap: 12 }}>
          <strong>Texte indisponible</strong>
          <span style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {ressource.error} — la source du texte coranique ne répond pas. Rien
            n’est affiché à la place : mieux vaut un écran vide qu’un texte
            approximatif.
          </span>
          <div>
            <button className="btn-ghost" onClick={ressource.reload}>Réessayer</button>
          </div>
        </div>
      )}

      {v.text && (
        <article className="card" style={{ display: 'grid', gap: 18, padding: 28 }}>
          <p className="arabic" style={{ margin: 0, textAlign: 'center' }}>{v.text}</p>

          {v.translation && (
            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7, textAlign: 'center' }}>
              {v.translation}
            </p>
          )}

          <div
            style={{
              borderTop: '1px solid var(--divider)',
              paddingTop: 14,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            <span>
              {v.surahName ? `${v.surahName} · ` : ''}
              {v.surah}:{v.ayah}
            </span>
            {v.theme && <span>· {v.theme}</span>}
          </div>

          {v.audioUrl && (
            // Le lecteur natif suffit : un seul verset ne justifie pas une
            // interface de lecture sur mesure.
            <audio controls src={v.audioUrl} style={{ width: '100%' }}>
              Votre navigateur ne peut pas lire cet audio.
            </audio>
          )}
        </article>
      )}

      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
        Texte et traduction : quran.com. Récitation : islamic.network.
        Le commentaire de verset n’est pas encore proposé — il demande une
        source d’exégèse réelle et créditée.
      </p>
    </div>
  );
}
