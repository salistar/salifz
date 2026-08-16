import { useState, FormEvent, ChangeEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store';

export default function LoginPage() {
  const { user, login, register, error, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({
    emailOrUsername: '',
    password: '',
    email: '',
    username: '',
    displayName: '',
  });

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'login') {
      await login(form.emailOrUsername.trim(), form.password);
    } else {
      await register({
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        displayName: form.displayName.trim() || undefined,
      });
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: event.target.value }),
  });

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 20 }}>
      <form className="card" onSubmit={submit} style={{ width: 380, display: 'grid', gap: 12 }}>
        <h1 style={{ margin: 0, textAlign: 'center' }}>Salifz</h1>
        <p style={{ margin: 0, textAlign: 'center', color: 'var(--text-secondary)' }}>
          {mode === 'login' ? 'Connexion' : 'Créer un compte'}
        </p>

        {mode === 'login' ? (
          <input
            placeholder="Email ou nom d’utilisateur"
            aria-label="Email ou nom d’utilisateur"
            autoComplete="username"
            required
            {...field('emailOrUsername')}
          />
        ) : (
          <>
            <input
              placeholder="Email"
              aria-label="Email"
              type="email"
              autoComplete="email"
              required
              {...field('email')}
            />
            <input
              placeholder="Nom d’utilisateur"
              aria-label="Nom d’utilisateur"
              autoComplete="username"
              required
              {...field('username')}
            />
            <input
              placeholder="Nom affiché (facultatif)"
              aria-label="Nom affiché"
              {...field('displayName')}
            />
          </>
        )}

        <input
          placeholder="Mot de passe"
          aria-label="Mot de passe"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          {...field('password')}
        />

        {mode === 'register' && (
          <small style={{ color: 'var(--text-muted)' }}>
            10 caractères minimum, une majuscule, une minuscule et un chiffre.
          </small>
        )}

        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--error-soft)',
              color: 'var(--error)',
              padding: 10,
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Patientez…' : mode === 'login' ? 'Se connecter' : 'Créer le compte'}
        </button>

        <button
          type="button"
          className="btn-ghost"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Pas encore de compte ?' : 'J’ai déjà un compte'}
        </button>
      </form>
    </div>
  );
}
