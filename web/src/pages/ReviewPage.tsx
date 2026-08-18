/**
 * Révision — la file construite par répétition espacée.
 *
 * L'ordre ne suit pas celui du Coran mais celui de l'oubli : un verset revient
 * quand le serveur estime qu'il est sur le point de s'effacer. C'est le seul
 * écran où l'utilisateur ne choisit pas ce qu'il travaille.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { progressAPI } from '../services/api';
import { useResource, asList, StateBlock } from '../components/useResource';

export default function ReviewPage() {
  const file = useResource<any>(() => progressAPI.reviewQueue(), []);
  const [index, setIndex] = useState(0);
  const [devoile, setDevoile] = useState(false);
  const [occupe, setOccupe] = useState(false);

  const versets = asList(file.data, 'queue', 'reviewQueue', 'verses', 'items');
  const courant = versets[index];

  const repondre = async (facile: boolean) => {
    if (!courant) return;
    setOccupe(true);
    try {
      const surah = courant.surahNumber ?? courant.surah ?? courant.number;
      const ayah = courant.ayahNumber ?? courant.verseNumber ?? courant.ayah;
      if (surah && ayah) {
        // La qualité de rappel pilote la prochaine échéance côté serveur.
        await progressAPI.markVerse(surah, ayah, { quality: facile ? 5 : 2, reviewed: true });
      }
    } catch {
      /* Une réponse perdue vaut mieux qu'un écran bloqué : on avance. */
    } finally {
      setOccupe(false);
      setDevoile(false);
      setIndex((i) => i + 1);
    }
  };

  if (!file.loading && versets.length === 0) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>Révision</h1>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🌙</div>
          <strong style={{ display: 'block', marginBottom: 8 }}>Rien à réviser pour l’instant</strong>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 18px', lineHeight: 1.6 }}>
            La file se remplit à mesure que vous mémorisez. Revenez demain, ou
            apprenez un nouveau passage.
          </p>
          <Link to="/lecons" className="btn-primary" style={{ textDecoration: 'none' }}>
            Aller aux leçons
          </Link>
        </div>
      </div>
    );
  }

  if (index >= versets.length && versets.length > 0) {
    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <h1 style={{ margin: 0 }}>Révision</h1>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <strong style={{ display: 'block', marginBottom: 8 }}>Série terminée</strong>
          <p style={{ color: 'var(--text-secondary)', margin: '0 0 18px' }}>
            {versets.length} verset(s) revus.
          </p>
          <button className="btn-primary" onClick={() => { setIndex(0); file.reload(); }}>
            Recharger la file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, flex: 1 }}>Révision</h1>
        {versets.length > 0 && (
          <span style={{ color: 'var(--text-secondary)' }}>
            {index + 1} / {versets.length}
          </span>
        )}
      </div>

      {versets.length > 0 && (
        <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${(index / versets.length) * 100}%`,
              height: '100%',
              background: 'var(--primary)',
              transition: 'width .2s',
            }}
          />
        </div>
      )}

      <StateBlock loading={file.loading} error={file.error} onRetry={file.reload} />

      {courant && (
        <div className="card" style={{ display: 'grid', gap: 18, padding: 24 }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Sourate {courant.surahNumber ?? courant.surah} · verset{' '}
            {courant.ayahNumber ?? courant.verseNumber ?? courant.ayah}
          </span>

          {/* Le texte reste masqué jusqu'à la demande : la révision consiste à
              se souvenir d'abord, vérifier ensuite. */}
          {devoile ? (
            <p className="arabic" style={{ margin: 0 }}>
              {courant.text ?? courant.textArabic ?? courant.arabic ?? '—'}
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                placeItems: 'center',
                minHeight: 120,
                background: 'var(--background-alt)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-muted)',
              }}
            >
              Récitez de mémoire, puis vérifiez.
            </div>
          )}

          {devoile ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-danger" style={{ flex: 1 }} disabled={occupe} onClick={() => repondre(false)}>
                À revoir bientôt
              </button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={occupe} onClick={() => repondre(true)}>
                Je le savais
              </button>
            </div>
          ) : (
            <button className="btn-ghost" onClick={() => setDevoile(true)}>
              Afficher le verset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
