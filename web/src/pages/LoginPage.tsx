/**
 * Connexion.
 *
 * L'écran contenait auparavant la connexion *et* l'inscription, permutées par
 * un bouton. Les deux parcours n'ont ni les mêmes champs, ni la même adresse
 * partageable, ni le même moment dans la vie d'un compte ; les séparer permet
 * aussi d'envoyer quelqu'un directement vers /inscription depuis la page de
 * présentation.
 */

import { useState, FormEvent, ChangeEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import AuthLayout, { Champ } from '../components/AuthLayout';
import { AuthArtwork } from '../components/Artwork';
import { useAuth } from '../store';

export default function LoginPage() {
  const { user, login, error, loading } = useAuth();
  const location = useLocation() as { state?: { depuis?: string } };
  const [form, setForm] = useState({ emailOrUsername: '', password: '' });

  // Revenir là où l'on voulait aller avant d'être renvoyé vers la connexion.
  if (user) return <Navigate to={location.state?.depuis ?? '/accueil'} replace />;

  const champ = (cle: keyof typeof form) => ({
    value: form[cle],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [cle]: e.target.value }),
  });

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    await login(form.emailOrUsername.trim(), form.password);
  };

  return (
    <AuthLayout
      titre="Content de vous revoir"
      sous="Reprenez là où vous vous êtes arrêté."
      accroche="Votre progression, vos halaqat et vos révisions vous attendent — les mêmes que sur le téléphone."
      illustration={<AuthArtwork style={{ width: '100%', maxWidth: 260 }} />}
    >
      <form onSubmit={envoyer} style={{ display: 'grid', gap: 16 }}>
        <Champ
          label="Email ou nom d’utilisateur"
          name="identifiant"
          autoComplete="username"
          required
          {...champ('emailOrUsername')}
        />

        <Champ
          label="Mot de passe"
          name="mot-de-passe"
          type="password"
          autoComplete="current-password"
          required
          {...champ('password')}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
          <Link to="/mot-de-passe-oublie" style={{ fontSize: 14 }}>
            Mot de passe oublié ?
          </Link>
        </div>

        {error && (
          <div role="alert" style={alerte}>
            {error}
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={loading} style={{ padding: 13 }}>
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>

        <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 15 }}>
          Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

const alerte = {
  background: 'var(--error-soft)',
  color: 'var(--error)',
  padding: 12,
  borderRadius: 8,
  fontSize: 14,
} as const;
