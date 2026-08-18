/**
 * Réglages — apparence, langue, audio, notifications, apprentissage,
 * confidentialité, données.
 *
 * Les réglages vivent sur le serveur, pas dans le navigateur : ils sont
 * partagés avec l'application mobile. Chaque modification part immédiatement
 * et l'écran réaffiche l'état relu côté serveur — si une valeur est refusée,
 * on la voit revenir à sa valeur précédente plutôt que de croire le réglage
 * enregistré.
 *
 * Deux ajouts :
 *
 * **La langue de l'interface.** Le produit parle trois langues depuis la
 * refonte, et rien ne permettait d'en changer depuis les réglages — seul un
 * sélecteur dans l'en-tête le faisait. C'est le premier endroit où on va le
 * chercher.
 *
 * **Les données.** L'export et la suppression de compte étaient sur la page
 * Profil ; ils appartiennent ici, où la section existait déjà dans les
 * libellés sans avoir jamais été construite. Un parcours de suppression caché
 * revient à ne pas en avoir — le RGPD et les deux magasins l'exigent.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsAPI, api } from '../services/api';
import { useResource, unwrap, asList, StateBlock } from '../components/useResource';
import { useTheme, useAuth } from '../store';
import { useLabel } from '../services/i18n';
import { SeparateurSection } from '../components/Ornements';
import { LOCALES, NOMS_LOCALES } from '../i18n';

/** Une ligne de réglage : intitulé à gauche, contrôle à droite, aide dessous. */
function Ligne({ titre, aide, children }: { titre: string; aide?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 0',
        flexWrap: 'wrap',
        borderBlockEnd: '1px solid var(--border)',
      }}
    >
      <div style={{ flex: 1, minInlineSize: 190 }}>
        <div>{titre}</div>
        {aide && <small style={{ color: 'var(--text-muted)' }}>{aide}</small>}
      </div>
      {children}
    </div>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="card" style={{ display: 'grid', paddingBlockEnd: 4 }}>
      <h2 className="title-md" style={{ margin: '0 0 2px' }}>{titre}</h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const label = useLabel();
  const { t, i18n } = useTranslation(['settings', 'common']);
  const { logout } = useAuth();

  const ressource = useResource<any>(() => settingsAPI.get(), []);
  const recitateurs = useResource<any>(() => settingsAPI.reciters(), []);
  const appliquerTheme = useTheme((s) => s.set);

  // Copie locale : elle rend l'interface réactive au clic, puis elle est
  // remplacée par ce que le serveur renvoie.
  const [brouillon, setBrouillon] = useState<any>(null);
  const [occupe, setOccupe] = useState(false);
  const [avis, setAvis] = useState<string | null>(null);
  const [confirme, setConfirme] = useState(false);
  const [motDePasse, setMotDePasse] = useState('');

  const serveur = unwrap(ressource.data)?.settings ?? unwrap(ressource.data);
  useEffect(() => {
    if (serveur) setBrouillon(serveur);
  }, [serveur]);

  const enregistrer = async (correctif: Record<string, any>, categorie: string) => {
    const precedent = brouillon;
    setBrouillon((d: any) => ({ ...d, [categorie]: { ...d?.[categorie], ...correctif } }));
    setOccupe(true);
    setAvis(null);
    try {
      const reponse = await settingsAPI.update({ category: categorie, settings: correctif });
      const frais = unwrap(reponse)?.settings;
      if (frais) setBrouillon(frais);
      setAvis(t('saved'));
    } catch (e: any) {
      // Un réglage refusé doit revenir visuellement à sa valeur précédente,
      // sans quoi l'écran affiche un état que le serveur ne connaît pas.
      setBrouillon(precedent);
      setAvis(e?.error ?? t('saveError'));
    } finally {
      setOccupe(false);
    }
  };

  const reinitialiser = async () => {
    setOccupe(true);
    try {
      await settingsAPI.reset();
      await ressource.reload();
      setAvis(t('resetDone'));
    } catch (e: any) {
      setAvis(e?.error ?? t('saveError'));
    } finally {
      setOccupe(false);
    }
  };

  const exporter = async () => {
    try {
      const donnees: any = await api.get('/account/export');
      const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = 'salifz-mes-donnees.json';
      lien.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setAvis(e?.error ?? t('exportError'));
    }
  };

  const supprimer = async () => {
    try {
      await api.delete('/account', { data: { password: motDePasse, confirm: 'SUPPRIMER' } });
      logout();
    } catch (e: any) {
      setAvis(e?.error ?? t('deleteError'));
    }
  };

  const apparence = brouillon?.appearance ?? {};
  const audio = brouillon?.audio ?? {};
  const notifications = brouillon?.notifications ?? {};
  const apprentissage = brouillon?.learning ?? {};
  const confidentialite = brouillon?.privacy ?? {};

  const bascule = (coche: boolean, surChangement: (v: boolean) => void) => (
    <input
      type="checkbox"
      checked={coche}
      disabled={occupe}
      onChange={(e) => surChangement(e.target.checked)}
    />
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 className="display-md" style={{ margin: 0, flex: 1 }}>{t('title')}</h1>
        {avis && <span role="status" className="caption">{avis}</span>}
      </div>

      <StateBlock loading={ressource.loading} error={ressource.error} onRetry={ressource.reload} />

      {brouillon && (
        <>
          <Bloc titre={t('appearance')}>
            {/* La langue en premier : c'est le réglage qui change tout le
                reste de la page, y compris son sens de lecture. */}
            <Ligne titre={t('interfaceLanguage')} aide={t('hintLanguage')}>
              <select
                value={i18n.resolvedLanguage ?? 'fr'}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                aria-label={t('interfaceLanguage')}
              >
                {LOCALES.map((l) => (
                  <option key={l} value={l}>{NOMS_LOCALES[l]}</option>
                ))}
              </select>
            </Ligne>

            <Ligne titre={t('theme')} aide={t('hintTheme')}>
              <select
                value={apparence.theme ?? 'light'}
                disabled={occupe}
                onChange={(e) => {
                  const valeur = e.target.value;
                  // Le web ne définit que les palettes claire et sombre ; les
                  // autres thèmes du serveur ne s'y appliquent pas.
                  if (valeur === 'light' || valeur === 'dark') appliquerTheme(valeur);
                  enregistrer({ theme: valeur }, 'appearance');
                }}
              >
                <option value="light">{t('themeLight')}</option>
                <option value="dark">{t('themeDark')}</option>
                <option value="sepia">{t('mobileOnlyTheme', { name: 'Sépia' })}</option>
                <option value="midnight">{t('mobileOnlyTheme', { name: 'Nuit profonde' })}</option>
              </select>
            </Ligne>

            <Ligne titre={t('quranTextSize')}>
              <select
                value={apparence.fontSize ?? 'medium'}
                disabled={occupe}
                onChange={(e) => enregistrer({ fontSize: e.target.value }, 'appearance')}
              >
                <option value="small">{t('sizeSmall')}</option>
                <option value="medium">{t('sizeMedium')}</option>
                <option value="large">{t('sizeLarge')}</option>
              </select>
            </Ligne>

            {/* Les noms de polices sont des noms propres : ils ne se
                traduisent pas, et les afficher en arabe les rendrait
                introuvables dans une documentation. */}
            <Ligne titre={t('mushafFont')}>
              <select
                value={apparence.fontFamily ?? 'uthmanic'}
                disabled={occupe}
                onChange={(e) => enregistrer({ fontFamily: e.target.value }, 'appearance')}
              >
                <option value="uthmanic">Uthmanic Hafs</option>
                <option value="amiri">Amiri</option>
                <option value="scheherazade">Scheherazade</option>
                <option value="naskh">Noto Naskh</option>
              </select>
            </Ligne>
          </Bloc>

          <Bloc titre={t('reading')}>
            <Ligne titre={t('reciter')}>
              <select
                value={audio.reciter ?? 'mishary_rashid'}
                disabled={occupe || recitateurs.loading}
                onChange={(e) => enregistrer({ reciter: e.target.value }, 'audio')}
              >
                {asList(recitateurs.data, 'reciters').map((r: any) => (
                  <option key={r.id} value={r.id}>{label(r.name)}</option>
                ))}
              </select>
            </Ligne>

            <Ligne titre={t('autoPlay')} aide={t('hintAutoPlay')}>
              {bascule(audio.autoPlay ?? true, (v) => enregistrer({ autoPlay: v }, 'audio'))}
            </Ligne>

            <Ligne titre={t('repeatCount')} aide={t('hintRepeat')}>
              <input
                type="number"
                min={1}
                max={20}
                value={audio.repeatCount ?? 3}
                disabled={occupe}
                style={{ inlineSize: 84 }}
                dir="ltr"
                onChange={(e) => enregistrer({ repeatCount: Number(e.target.value) }, 'audio')}
              />
            </Ligne>

            <Ligne titre={t('playbackSpeed')}>
              <select
                value={String(audio.playbackSpeed ?? 1)}
                disabled={occupe}
                onChange={(e) => enregistrer({ playbackSpeed: Number(e.target.value) }, 'audio')}
              >
                {['0.5', '0.75', '1', '1.25', '1.5', '2'].map((s) => (
                  <option key={s} value={s}>×{s}</option>
                ))}
              </select>
            </Ligne>
          </Bloc>

          <Bloc titre={t('reminders')}>
            <Ligne titre={t('dailyReminder')}>
              {bascule(notifications.enabled ?? true, (v) => enregistrer({ enabled: v }, 'notifications'))}
            </Ligne>

            <Ligne titre={t('reminderTime')}>
              <input
                type="time"
                value={notifications.reminderTime ?? '08:00'}
                disabled={occupe || notifications.enabled === false}
                dir="ltr"
                onChange={(e) => enregistrer({ reminderTime: e.target.value }, 'notifications')}
              />
            </Ligne>

            <Ligne titre={t('streakReminder')} aide={t('hintStreak')}>
              {bascule(notifications.streakReminder ?? true, (v) =>
                enregistrer({ streakReminder: v }, 'notifications')
              )}
            </Ligne>

            <Ligne titre={t('dailyVerse')}>
              {bascule(notifications.dailyVerse ?? true, (v) => enregistrer({ dailyVerse: v }, 'notifications'))}
            </Ligne>
          </Bloc>

          <Bloc titre={t('learning')}>
            <Ligne titre={t('dailyGoal')} aide={t('hintGoal')}>
              <input
                type="number"
                min={1}
                max={50}
                value={apprentissage.dailyGoal ?? 5}
                disabled={occupe}
                style={{ inlineSize: 84 }}
                dir="ltr"
                onChange={(e) => enregistrer({ dailyGoal: Number(e.target.value) }, 'learning')}
              />
            </Ligne>

            <Ligne titre={t('showTranslation')}>
              {bascule(apprentissage.showTranslation ?? true, (v) =>
                enregistrer({ showTranslation: v }, 'learning')
              )}
            </Ligne>

            <Ligne titre={t('translationLanguage')}>
              <select
                value={apprentissage.translationLanguage ?? 'en'}
                disabled={occupe || apprentissage.showTranslation === false}
                onChange={(e) => enregistrer({ translationLanguage: e.target.value }, 'learning')}
              >
                {/* Chaque langue s'écrit dans sa propre langue : c'est la
                    seule forme qu'un lecteur reconnaît à coup sûr. */}
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="ar">العربية</option>
                <option value="tr">Türkçe</option>
                <option value="ur">اردو</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="ms">Bahasa Melayu</option>
              </select>
            </Ligne>

            <Ligne titre={t('srsIntensity')} aide={t('hintReview')}>
              <select
                value={apprentissage.reviewMode ?? 'spaced'}
                disabled={occupe}
                onChange={(e) => enregistrer({ reviewMode: e.target.value }, 'learning')}
              >
                <option value="spaced">{t('reviewSpaced')}</option>
                <option value="sequential">{t('reviewSequential')}</option>
                <option value="random">{t('reviewRandom')}</option>
              </select>
            </Ligne>
          </Bloc>

          <Bloc titre={t('privacy')}>
            <Ligne titre={t('profileVisibility')}>
              {bascule(confidentialite.publicProfile ?? true, (v) =>
                enregistrer({ publicProfile: v }, 'privacy')
              )}
            </Ligne>
            <Ligne titre={t('joinLeaderboards')}>
              {bascule(confidentialite.showOnLeaderboard ?? true, (v) =>
                enregistrer({ showOnLeaderboard: v }, 'privacy')
              )}
            </Ligne>
            <Ligne titre={t('allowFriendRequests')}>
              {bascule(confidentialite.allowFriendRequests ?? true, (v) =>
                enregistrer({ allowFriendRequests: v }, 'privacy')
              )}
            </Ligne>
          </Bloc>

          <SeparateurSection />

          {/* --- Données ---------------------------------------------------- */}
          <Bloc titre={t('data')}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingBlock: 12 }}>
              <button className="btn-ghost" onClick={exporter}>{t('downloadData')}</button>
              <button className="btn-ghost" onClick={reinitialiser} disabled={occupe}>
                {t('reset')}
              </button>
              <span style={{ flex: 1 }} />
              <button className="btn-danger" onClick={() => setConfirme(!confirme)}>
                {t('deleteAccount')}
              </button>
            </div>

            {confirme && (
              <div
                style={{
                  display: 'grid',
                  gap: 10,
                  padding: 16,
                  marginBlockEnd: 12,
                  border: '1px solid var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <strong style={{ color: 'var(--danger)' }}>{t('deleteWarning')}</strong>
                <input
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  aria-label={t('passwordPlaceholder')}
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                />
                <button
                  className="btn-danger"
                  onClick={supprimer}
                  disabled={!motDePasse}
                  style={{ justifySelf: 'start' }}
                >
                  {t('deleteFinal')}
                </button>
              </div>
            )}
          </Bloc>
        </>
      )}
    </div>
  );
}
