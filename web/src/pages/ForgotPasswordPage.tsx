/**
 * Mot de passe oublié.
 *
 * La réponse affichée est volontairement la même que l'adresse existe ou non.
 * Un message qui distingue les deux cas transforme ce formulaire en outil de
 * vérification d'adresses : il suffit d'en essayer une liste pour savoir qui
 * a un compte. Le serveur applique la même règle.
 */

import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout, { Champ, Alerte } from '../components/AuthLayout';
import { AuthArtwork } from '../components/Artwork';
import { HizbStar } from '../components/Ornements';
import { authAPI } from '../services/api';
import { isolerLatin } from '../i18n';

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [envoye, setEnvoye] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const envoyer = async (e: FormEvent) => {
    e.preventDefault();
    setOccupe(true);
    setErreur(null);
    try {
      await authAPI.forgotPassword(email.trim());
      setEnvoye(true);
    } catch (err: any) {
      // Seule une panne réelle est signalée ; une adresse inconnue ne l'est pas.
      setErreur(err?.error ?? t('sendFailed'));
    } finally {
      setOccupe(false);
    }
  };

  return (
    <AuthLayout
      titre={t('forgotTitle')}
      sous={t('forgotBody')}
      accroche={t('forgotSide')}
      illustration={<AuthArtwork style={{ width: '100%', maxWidth: 240 }} />}
    >
      {envoye ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div role="status" className="card" style={{ borderColor: 'var(--border-gold)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBlockEnd: 8 }}>
              <HizbStar size={16} quarters={4} color="var(--accent)" />
              <strong>{t('linkSentTitle')}</strong>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.65 }}>
              {/* L'adresse est isolée par FSI/PDI : sans cela, un email latin
                  au milieu d'une phrase arabe se réordonne à l'affichage. */}
              {t('linkSent', { email: isolerLatin(email) })} {t('checkSpam')}
            </p>
          </div>

          <Link to="/login" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
            {t('backToSignIn')}
          </Link>
        </div>
      ) : (
        <form onSubmit={envoyer} style={{ display: 'grid', gap: 16 }}>
          <Champ
            label={t('emailAddress')}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {erreur && <Alerte>{erreur}</Alerte>}

          <button className="btn-primary" type="submit" disabled={occupe} style={{ padding: 13 }}>
            {occupe ? t('sending') : t('sendLink')}
          </button>

          <p style={{ margin: 0, textAlign: 'center', fontSize: 15 }}>
            <Link to="/login">{t('backToSignIn')}</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
