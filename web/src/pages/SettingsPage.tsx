/**
 * Réglages — apparence, audio, notifications, apprentissage, confidentialité.
 *
 * Les réglages sont partagés avec l'application mobile : ils vivent sur le
 * serveur, pas dans le navigateur. Chaque modification part immédiatement et
 * l'écran réaffiche l'état relu côté serveur — si une valeur est refusée, on
 * le voit plutôt que de croire le réglage enregistré.
 */

import { useEffect, useState } from 'react';
import { settingsAPI } from '../services/api';
import { useResource, unwrap, asList, StateBlock } from '../components/useResource';
import { useTheme } from '../store';
import { label } from '../services/i18n';


function Row({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div>{title}</div>
        {hint && <small style={{ color: 'var(--text-muted)' }}>{hint}</small>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card" style={{ display: 'grid' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 16 }}>{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const resource = useResource<any>(() => settingsAPI.get(), []);
  const reciters = useResource<any>(() => settingsAPI.reciters(), []);
  const applyTheme = useTheme((s) => s.set);

  // Copie locale : elle rend l'interface réactive au clic, puis elle est
  // remplacée par ce que le serveur renvoie.
  const [draft, setDraft] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const server = unwrap(resource.data)?.settings ?? unwrap(resource.data);
  useEffect(() => {
    if (server) setDraft(server);
  }, [server]);

  const save = async (patch: Record<string, any>, category: string) => {
    const previous = draft;
    setDraft((d: any) => ({ ...d, [category]: { ...d?.[category], ...patch } }));
    setBusy(true);
    setNotice(null);
    try {
      const response = await settingsAPI.update({ category, settings: patch });
      const fresh = unwrap(response)?.settings;
      if (fresh) setDraft(fresh);
      setNotice('Enregistré');
    } catch (e: any) {
      // Un réglage refusé doit revenir visuellement à sa valeur précédente,
      // sans quoi l'écran affiche un état que le serveur ne connaît pas.
      setDraft(previous);
      setNotice(e?.error ?? 'Enregistrement impossible');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      await settingsAPI.reset();
      await resource.reload();
      setNotice('Réglages réinitialisés');
    } catch (e: any) {
      setNotice(e?.error ?? 'Réinitialisation impossible');
    } finally {
      setBusy(false);
    }
  };

  const appearance = draft?.appearance ?? {};
  const audio = draft?.audio ?? {};
  const notifications = draft?.notifications ?? {};
  const learning = draft?.learning ?? {};
  const privacy = draft?.privacy ?? {};

  const toggle = (checked: boolean, onChange: (v: boolean) => void) => (
    <input type="checkbox" checked={checked} disabled={busy} onChange={(e) => onChange(e.target.checked)} />
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1 style={{ margin: 0, flex: 1 }}>Réglages</h1>
        {notice && (
          <span role="status" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            {notice}
          </span>
        )}
      </div>

      <StateBlock loading={resource.loading} error={resource.error} onRetry={resource.reload} />

      {draft && (
        <>
          <Section title="Apparence">
            <Row title="Thème" hint="Partagé avec l’application mobile.">
              <select
                value={appearance.theme ?? 'light'}
                disabled={busy}
                onChange={(e) => {
                  const value = e.target.value;
                  // Le web ne définit que les palettes claire et sombre ;
                  // les autres thèmes du serveur ne s'y appliquent pas.
                  if (value === 'light' || value === 'dark') applyTheme(value);
                  save({ theme: value }, 'appearance');
                }}
              >
                <option value="light">Clair</option>
                <option value="dark">Sombre</option>
                <option value="sepia">Sépia (mobile uniquement)</option>
                <option value="midnight">Nuit profonde (mobile uniquement)</option>
              </select>
            </Row>

            <Row title="Taille du texte">
              <select
                value={appearance.fontSize ?? 'medium'}
                disabled={busy}
                onChange={(e) => save({ fontSize: e.target.value }, 'appearance')}
              >
                <option value="small">Petite</option>
                <option value="medium">Moyenne</option>
                <option value="large">Grande</option>
              </select>
            </Row>

            <Row title="Police arabe">
              <select
                value={appearance.fontFamily ?? 'uthmanic'}
                disabled={busy}
                onChange={(e) => save({ fontFamily: e.target.value }, 'appearance')}
              >
                <option value="uthmanic">Uthmanic Hafs</option>
                <option value="amiri">Amiri</option>
                <option value="scheherazade">Scheherazade</option>
                <option value="naskh">Noto Naskh</option>
              </select>
            </Row>
          </Section>

          <Section title="Audio">
            <Row title="Récitateur">
              <select
                value={audio.reciter ?? 'mishary_rashid'}
                disabled={busy || reciters.loading}
                onChange={(e) => save({ reciter: e.target.value }, 'audio')}
              >
                {asList(reciters.data, 'reciters').map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {label(r.name)}
                  </option>
                ))}
              </select>
            </Row>

            <Row title="Lecture automatique" hint="Enchaîner le verset suivant.">
              {toggle(audio.autoPlay ?? true, (v) => save({ autoPlay: v }, 'audio'))}
            </Row>

            <Row title="Répétitions" hint="Nombre d’écoutes par verset (1 à 20).">
              <input
                type="number"
                min={1}
                max={20}
                value={audio.repeatCount ?? 3}
                disabled={busy}
                style={{ width: 80 }}
                onChange={(e) => save({ repeatCount: Number(e.target.value) }, 'audio')}
              />
            </Row>

            <Row title="Vitesse de lecture">
              <select
                value={String(audio.playbackSpeed ?? 1)}
                disabled={busy}
                onChange={(e) => save({ playbackSpeed: Number(e.target.value) }, 'audio')}
              >
                {['0.5', '0.75', '1', '1.25', '1.5', '2'].map((s) => (
                  <option key={s} value={s}>
                    ×{s}
                  </option>
                ))}
              </select>
            </Row>
          </Section>

          <Section title="Notifications">
            <Row title="Activer les notifications">
              {toggle(notifications.enabled ?? true, (v) => save({ enabled: v }, 'notifications'))}
            </Row>

            <Row title="Heure du rappel">
              <input
                type="time"
                value={notifications.reminderTime ?? '08:00'}
                disabled={busy || notifications.enabled === false}
                onChange={(e) => save({ reminderTime: e.target.value }, 'notifications')}
              />
            </Row>

            <Row title="Rappel de série" hint="Prévenir avant de perdre la série.">
              {toggle(notifications.streakReminder ?? true, (v) => save({ streakReminder: v }, 'notifications'))}
            </Row>

            <Row title="Verset du jour">
              {toggle(notifications.dailyVerse ?? true, (v) => save({ dailyVerse: v }, 'notifications'))}
            </Row>
          </Section>

          <Section title="Apprentissage">
            <Row title="Objectif quotidien" hint="Versets par jour (1 à 50).">
              <input
                type="number"
                min={1}
                max={50}
                value={learning.dailyGoal ?? 5}
                disabled={busy}
                style={{ width: 80 }}
                onChange={(e) => save({ dailyGoal: Number(e.target.value) }, 'learning')}
              />
            </Row>

            <Row title="Afficher la traduction">
              {toggle(learning.showTranslation ?? true, (v) => save({ showTranslation: v }, 'learning'))}
            </Row>

            <Row title="Langue de traduction">
              <select
                value={learning.translationLanguage ?? 'en'}
                disabled={busy || learning.showTranslation === false}
                onChange={(e) => save({ translationLanguage: e.target.value }, 'learning')}
              >
                <option value="fr">Français</option>
                <option value="en">Anglais</option>
                <option value="ar">Arabe</option>
                <option value="tr">Turc</option>
                <option value="ur">Ourdou</option>
                <option value="id">Indonésien</option>
                <option value="ms">Malais</option>
              </select>
            </Row>

            <Row title="Mode de révision" hint="Le mode espacé suit l’oubli plutôt que l’ordre.">
              <select
                value={learning.reviewMode ?? 'spaced'}
                disabled={busy}
                onChange={(e) => save({ reviewMode: e.target.value }, 'learning')}
              >
                <option value="spaced">Répétition espacée</option>
                <option value="sequential">Séquentiel</option>
                <option value="random">Aléatoire</option>
              </select>
            </Row>
          </Section>

          <Section title="Confidentialité">
            <Row title="Profil public">
              {toggle(privacy.publicProfile ?? true, (v) => save({ publicProfile: v }, 'privacy'))}
            </Row>
            <Row title="Apparaître au classement">
              {toggle(privacy.showOnLeaderboard ?? true, (v) => save({ showOnLeaderboard: v }, 'privacy'))}
            </Row>
            <Row title="Autoriser les demandes d’ami">
              {toggle(privacy.allowFriendRequests ?? true, (v) => save({ allowFriendRequests: v }, 'privacy'))}
            </Row>
          </Section>

          <div>
            <button className="btn-ghost" onClick={reset} disabled={busy}>
              Réinitialiser tous les réglages
            </button>
          </div>
        </>
      )}
    </div>
  );
}
