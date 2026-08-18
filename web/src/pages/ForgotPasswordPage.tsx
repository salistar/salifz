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
import AuthLayout, { Champ } from '../components/AuthLayout';
import { AuthArtwork } from '../components/Artwork';
import { authAPI } from '../services/api';

export default function ForgotPasswordPage() {
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
      setErreur(err?.error ?? 'Envoi impossible pour le moment.');
    } finally {
      setOccupe(false);
    }
  };

  return (
    <AuthLayout
      titre="Mot de passe oublié"
      sous="Indiquez votre adresse : si un compte y est associé, un lien de réinitialisation vous sera envoyé."
      accroche="Le lien reçu expire rapidement et ne sert qu’une fois."
      illustration={<AuthArtwork style={{ width: '100%', maxWidth: 240 }} />}
    >
      {envoye ? (
        <div style={{ display: 'grid', gap: 16 }}>
          <div
            role="status"
            className="card"
            style={{ background: 'var(--primary-soft)', borderColor: 'var(--primary)' }}
          >
            <strong style={{ display: 'block', marginBottom: 6 }}>Demande enregistrée</strong>
            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Si un compte existe pour <strong>{email}</strong>, un message vient
              d’être envoyé. Pensez à vérifier les indésirables.
            </span>
          </div>
          <Link to="/login" className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={envoyer} style={{ display: 'grid', gap: 16 }}>
          <Champ
            label="Adresse email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {erreur && (
            <div role="alert" style={{ background: 'var(--error-soft)', color: 'var(--error)', padding: 12, borderRadius: 8, fontSize: 14 }}>
              {erreur}
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={occupe} style={{ padding: 13 }}>
            {occupe ? 'Envoi…' : 'Envoyer le lien'}
          </button>

          <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 15 }}>
            <Link to="/login">Retour à la connexion</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
