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
import { useTranslation } from 'react-i18next';
import AuthLayout, { Champ, Alerte } from '../components/AuthLayout';
import { AuthArtwork } from '../components/Artwork';
import { useAuth } from '../store';

export default function LoginPage() {
  const { t } = useTranslation('auth');
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
      titre={t('welcomeBack')}
      sous={t('resumeWhereLeft')}
      accroche={t('sideNote')}
      illustration={<AuthArtwork style={{ width: '100%', maxWidth: 260 }} />}
    >
      <form onSubmit={envoyer} style={{ display: 'grid', gap: 16 }}>
        <Champ
          label={t('identifier')}
          name="identifiant"
          autoComplete="username"
          required
          {...champ('emailOrUsername')}
        />

        <Champ
          label={t('password')}
          name="mot-de-passe"
          type="password"
          autoComplete="current-password"
          required
          {...champ('password')}
        />

        {/* `flex-end` suit le sens de lecture : le lien reste du côté de la
            fin de ligne en arabe comme en français. */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBlockStart: -6 }}>
          <Link to="/mot-de-passe-oublie" style={{ fontSize: 14 }}>
            {t('forgot')}
          </Link>
        </div>

        {error && <Alerte>{error}</Alerte>}

        <button className="btn-primary" type="submit" disabled={loading} style={{ padding: 13 }}>
          {loading ? `${t('signingIn')}` : t('signIn')}
        </button>

        <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-muted)', fontSize: 15 }}>
          {t('noAccount')} <Link to="/inscription">{t('createAccount')}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
