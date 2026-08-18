/**
 * Création de compte.
 *
 * Les règles affichées sont exactement celles que le serveur applique
 * (`routes/auth.js`) : dix caractères, une minuscule, une majuscule, un
 * chiffre, et un nom d'utilisateur de 3 à 20 caractères alphanumériques.
 * Les vérifier ici évite un aller-retour dont la seule issue serait un refus,
 * mais elles ne remplacent pas la validation du serveur — un contrôle côté
 * navigateur se contourne.
 */

import { useState, FormEvent, ChangeEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AuthLayout, { Champ } from '../components/AuthLayout';
import { RegisterArtwork } from '../components/Artwork';
import { useAuth } from '../store';

const REGLES = [
  { texte: 'Au moins 10 caractères', test: (v: string) => v.length >= 10 },
  { texte: 'Une minuscule', test: (v: string) => /[a-z]/.test(v) },
  { texte: 'Une majuscule', test: (v: string) => /[A-Z]/.test(v) },
  { texte: 'Un chiffre', test: (v: string) => /[0-9]/.test(v) },
];

const USERNAME_VALIDE = /^[a-zA-Z0-9_]{3,20}$/;

export default function RegisterPage() {
  const { user, register, error, loading } = useAuth();
  const [form, setForm] = useState({ email: '', username: '', displayName: '', password: '' });
  const [touche, setTouche] = useState(false);

  if (user) return <Navigate to="/accueil" replace />;

  const champ = (cle: keyof typeof form) => ({
    value: form[cle],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setForm({ ...form, [cle]: e.target.value }),
  });

  const reglesOk = REGLES.map((r) => r.test(form.password));
  const motDePasseOk = reglesOk.every(Boolean);
  const pseudoOk = USERNAME_VALIDE.test(form.username);
  const pretAEnvoyer = motDePasseOk && pseudoOk && form.email.includes('@');

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setTouche(true);
    if (!pretAEnvoyer) return;
    await register({
      email: form.email.trim(),
      username: form.username.trim(),
      password: form.password,
      displayName: form.displayName.trim() || undefined,
    });
  };

  return (
    <AuthLayout
      titre="Créer un compte"
      sous="Gratuit, et sans carte bancaire."
      accroche="Commencez par Al-Fatiha — sept versets suffisent à voir si la méthode vous convient."
      illustration={<RegisterArtwork style={{ width: '100%', maxWidth: 290 }} />}
    >
      <form onSubmit={envoyer} noValidate style={{ display: 'grid', gap: 16 }}>
        <Champ label="Email" name="email" type="email" autoComplete="email" required {...champ('email')} />

        <Champ
          label="Nom d’utilisateur"
          name="pseudo"
          autoComplete="username"
          required
          aide="3 à 20 caractères — lettres, chiffres et tiret bas."
          aria-invalid={touche && !pseudoOk}
          {...champ('username')}
        />
        {touche && form.username && !pseudoOk && (
          <small style={{ color: 'var(--error)', marginTop: -10 }}>
            Ce nom d’utilisateur ne respecte pas le format attendu.
          </small>
        )}

        <Champ
          label="Nom affiché"
          name="nom-affiche"
          autoComplete="name"
          aide="Facultatif — c’est ce que verront les membres de votre halaqa."
          {...champ('displayName')}
        />

        <Champ
          label="Mot de passe"
          name="mot-de-passe"
          type="password"
          autoComplete="new-password"
          required
          {...champ('password')}
        />

        {/* Liste vivante plutôt qu'une phrase de consignes : on voit ce qui
            manque encore, sans avoir à soumettre pour l'apprendre. */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '-6px 0 0', display: 'grid', gap: 5 }}>
          {REGLES.map((r, i) => {
            const ok = reglesOk[i];
            return (
              <li
                key={r.texte}
                style={{
                  display: 'flex',
                  gap: 8,
                  fontSize: 13,
                  color: ok ? 'var(--primary-dark)' : 'var(--text-muted)',
                }}
              >
                {/* Le symbole double la couleur : un daltonien ne distingue pas
                    le vert du gris sur un si petit élément. */}
                <span aria-hidden="true">{ok ? '✓' : '○'}</span>
                <span>{r.texte}</span>
              </li>
            );
          })}
        </ul>

        {error && (
          <div role="alert" style={alerte}>
            {error}
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={loading} style={{ padding: 13 }}>
          {loading ? 'Création…' : 'Créer le compte'}
        </button>

        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
          En créant un compte, vous acceptez que vos données de progression
          soient enregistrées sur ce serveur. Vous pouvez les exporter ou
          supprimer le compte à tout moment depuis les réglages.
        </p>

        <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 15 }}>
          Vous avez déjà un compte ? <Link to="/login">Se connecter</Link>
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
