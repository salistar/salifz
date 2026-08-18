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
import { useTranslation } from 'react-i18next';
import AuthLayout, { Champ, Alerte } from '../components/AuthLayout';
import { RegisterArtwork } from '../components/Artwork';
import { HizbStar } from '../components/Ornements';
import { useAuth } from '../store';

/** Les règles vivent ici sous forme de clés : leur libellé suit la langue de
 *  l'interface, leur test ne change jamais. */
const REGLES = [
  { cle: 'ruleLength', test: (v: string) => v.length >= 10 },
  { cle: 'ruleLower', test: (v: string) => /[a-z]/.test(v) },
  { cle: 'ruleUpper', test: (v: string) => /[A-Z]/.test(v) },
  { cle: 'ruleDigit', test: (v: string) => /[0-9]/.test(v) },
] as const;

const USERNAME_VALIDE = /^[a-zA-Z0-9_]{3,20}$/;

export default function RegisterPage() {
  const { t } = useTranslation('auth');
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
      titre={t('signUpTitle')}
      sous={t('signUpSubtitle')}
      accroche={t('signUpSide')}
      illustration={<RegisterArtwork style={{ width: '100%', maxWidth: 290 }} />}
    >
      <form onSubmit={envoyer} noValidate style={{ display: 'grid', gap: 16 }}>
        <Champ label={t('email')} name="email" type="email" autoComplete="email" required {...champ('email')} />

        <Champ
          label={t('username')}
          name="pseudo"
          autoComplete="username"
          required
          aide={t('usernameHint')}
          aria-invalid={touche && !pseudoOk}
          {...champ('username')}
        />
        {touche && form.username && !pseudoOk && (
          <small style={{ color: 'var(--danger)', marginBlockStart: -10 }}>{t('usernameInvalid')}</small>
        )}

        <Champ
          label={t('displayName')}
          name="nom-affiche"
          autoComplete="name"
          aide={t('displayNameHint')}
          {...champ('displayName')}
        />

        <Champ
          label={t('password')}
          name="mot-de-passe"
          type="password"
          autoComplete="new-password"
          required
          {...champ('password')}
        />

        {/* Liste vivante plutôt qu'une phrase de consignes : on voit ce qui
            manque encore, sans avoir à soumettre pour l'apprendre. */}
        <ul style={{ listStyle: 'none', padding: 0, margin: '-6px 0 0', display: 'grid', gap: 6 }}>
          {REGLES.map((r, i) => {
            const ok = reglesOk[i];
            return (
              <li
                key={r.cle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: ok ? 'var(--accent-text)' : 'var(--text-muted)',
                }}
              >
                {/* La forme double la couleur : sur un élément aussi petit, un
                    daltonien ne distingue pas l'or du gris. L'étoile pleine
                    contre l'étoile vide se lit sans couleur. */}
                <span aria-hidden="true" style={{ display: 'inline-flex' }}>
                  <HizbStar
                    size={12}
                    quarters={ok ? 4 : 0}
                    color={ok ? 'var(--accent)' : 'var(--border-strong)'}
                  />
                </span>
                <span>{t(r.cle)}</span>
              </li>
            );
          })}
        </ul>

        {error && <Alerte>{error}</Alerte>}

        <button className="btn-primary" type="submit" disabled={loading} style={{ padding: 13 }}>
          {loading ? t('creating') : t('createIt')}
        </button>

        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
          {t('consent')}
        </p>

        <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-muted)', fontSize: 15 }}>
          {t('haveAccount')} <Link to="/login">{t('signIn')}</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
