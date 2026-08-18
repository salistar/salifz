/**
 * Sélecteur de langue.
 *
 * Accessible **avant** connexion : quelqu'un qui ne lit pas le français doit
 * pouvoir basculer sans deviner où cliquer dans une interface qu'il ne
 * comprend pas.
 *
 * Chaque langue est nommée dans sa propre écriture — personne ne cherche
 * « Arabic » dans une liste, on cherche « العربية ». Et pas de drapeau : un
 * drapeau désigne un pays, jamais une langue, et l'arabe en a une vingtaine.
 */

import { useTranslation } from 'react-i18next';
import { LOCALES, NOMS_LOCALES, type Locale } from '../i18n';

export default function SelecteurLangue({ compact = false }: { compact?: boolean }) {
  const { i18n, t } = useTranslation('common');
  const courante = (i18n.resolvedLanguage ?? 'fr') as Locale;

  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span className="sr-only" style={srOnly}>{t('language')}</span>
      <select
        value={courante}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label={t('language')}
        style={{
          minHeight: 36,
          padding: compact ? '4px 8px' : '8px 12px',
          fontSize: 14,
          background: 'var(--surface)',
          borderColor: 'var(--border)',
        }}
      >
        {LOCALES.map((l) => (
          // `lang` sur l'option : le lecteur d'écran prononce « العربية » avec
          // la bonne voix au lieu de l'épeler en français.
          <option key={l} value={l} lang={l}>
            {NOMS_LOCALES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}

const srOnly: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
