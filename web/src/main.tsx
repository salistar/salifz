import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './theme.css';
// Doit être importé avant le rendu : la direction du document est posée
// à l'initialisation, avant que le premier écran ne se peigne.
import './i18n';

/**
 * Écran d'attente pendant le chargement du premier namespace.
 *
 * Les traductions sont chargées à la demande : sans cette limite Suspense,
 * React suspend le rendu et la page reste vide — c'est exactement ce qui s'est
 * produit à la première intégration. Volontairement muet : afficher un texte
 * ici demanderait les traductions qu'on est justement en train d'attendre.
 */
function Attente() {
  return (
    <div
      style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg)' }}
      aria-busy="true"
    >
      <svg viewBox="0 0 100 100" width="44" height="44" aria-hidden="true" style={{ color: 'var(--accent)' }}>
        <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round" opacity="0.5">
          <path d="M50,8 L92,50 L50,92 L8,50 Z" />
          <path d="M50,8 L92,50 L50,92 L8,50 Z" transform="rotate(45 50 50)" />
        </g>
      </svg>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<Attente />}>
      <App />
    </Suspense>
  </React.StrictMode>
);
