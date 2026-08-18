/**
 * Disposition commune aux écrans d'authentification : le formulaire d'un côté,
 * l'illustration de l'autre.
 *
 * L'illustration disparaît sous 860 px. C'est un choix : sur un écran étroit,
 * la garder pousserait le formulaire sous la ligne de flottaison, et
 * l'utilisateur devrait faire défiler pour trouver le champ qu'il est venu
 * remplir. Elle est donc décorative, jamais porteuse d'information.
 *
 * Le titre est précédé d'une étoile de hizb : c'est le seul ornement de la
 * page, et il rattache ces trois écrans au reste du produit sans encombrer le
 * formulaire.
 */

import { ReactNode } from 'react';
import { HizbStar } from './Ornements';

interface Props {
  titre: string;
  sous: string;
  illustration: ReactNode;
  /** Phrase affichée à côté de l'illustration — elle change le ton entre
   *  « bienvenue à nouveau » et « bienvenue tout court ». */
  accroche: string;
  children: ReactNode;
}

export default function AuthLayout({ titre, sous, illustration, accroche, children }: Props) {
  return (
    <div
      style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '48px 20px',
        display: 'grid',
        gap: 48,
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        alignItems: 'center',
      }}
      className="auth-grille"
    >
      <div style={{ maxWidth: 420, inlineSize: '100%', justifySelf: 'center' }}>
        <span style={{ display: 'inline-block', marginBlockEnd: 12 }} aria-hidden="true">
          <HizbStar size={20} quarters={4} color="var(--accent)" />
        </span>
        <h1 className="display-md" style={{ margin: '0 0 8px' }}>{titre}</h1>
        <p style={{ margin: '0 0 26px', color: 'var(--text-muted)', lineHeight: 1.65 }}>{sous}</p>
        {children}
      </div>

      <div className="auth-illustration" style={{ display: 'grid', justifyItems: 'center', gap: 20 }}>
        {illustration}
        <p
          style={{
            margin: 0,
            maxWidth: 320,
            textAlign: 'center',
            color: 'var(--text-muted)',
            lineHeight: 1.65,
          }}
        >
          {accroche}
        </p>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .auth-grille { grid-template-columns: 1fr; gap: 24px; }
          .auth-illustration { display: none; }
        }
      `}</style>
    </div>
  );
}

/** Champ de formulaire avec étiquette visible. Un `placeholder` seul disparaît
 *  dès la saisie : l'utilisateur qui revient sur un champ rempli ne sait plus
 *  ce qu'on lui demandait. */
export function Champ({
  label,
  aide,
  ...props
}: { label: string; aide?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `champ-${props.name ?? label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div style={{ display: 'grid', gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: 14, fontWeight: 600 }}>
        {label}
      </label>
      {/* Les identifiants et mots de passe sont saisis en caractères latins,
          y compris en interface arabe : forcer le sens évite que le curseur
          et la ponctuation partent à l'envers. */}
      <input id={id} dir="ltr" aria-describedby={aide ? `${id}-aide` : undefined} {...props} />
      {aide && (
        <small id={`${id}-aide`} style={{ color: 'var(--text-muted)' }}>
          {aide}
        </small>
      )}
    </div>
  );
}

/** Bandeau d'erreur de formulaire. Le rôle `alert` le fait annoncer par les
 *  lecteurs d'écran dès son apparition. */
export function Alerte({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      style={{
        border: '1px solid var(--danger)',
        color: 'var(--danger)',
        padding: 12,
        borderRadius: 'var(--radius-sm)',
        fontSize: 14,
      }}
    >
      {children}
    </div>
  );
}
