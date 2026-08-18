/**
 * Confidentialité.
 *
 * Le texte de référence est `CONFIDENTIALITE.md` à la racine du dépôt ; cette
 * page en reprend le contenu pour que les liens des pieds de page mènent
 * quelque part. Elle est accessible avec ou sans compte : quelqu'un doit
 * pouvoir lire ce qu'on collecte *avant* de s'inscrire.
 *
 * Les points sont désormais des clés de traduction : une politique de
 * confidentialité affichée en français à un lecteur arabophone n'est pas une
 * politique de confidentialité — c'est une case cochée.
 */

import { useTranslation } from 'react-i18next';
import { HizbStar, SeparateurSection } from '../components/Ornements';

/** Chaque section : un titre, et les clés de ses points. */
const SECTIONS = [
  { titre: 'stored', points: ['storedAccount', 'storedProgress', 'storedRecitations', 'storedSettings'] },
  { titre: 'notStored', points: ['notStoredSession', 'notStoredLocation', 'notStoredTracking'] },
  { titre: 'children', points: ['childrenCreated', 'childrenReport', 'childrenRestricted'] },
  { titre: 'rights', points: ['rightExport', 'rightDelete', 'rightCorrect'] },
  { titre: 'sources', points: ['sourcesBody', 'sourcesIp'] },
] as const;

export default function PrivacyPage() {
  const { t } = useTranslation('privacy');

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 20px', display: 'grid', gap: 26 }}>
      <header>
        <span style={{ display: 'inline-block', marginBlockEnd: 12 }} aria-hidden="true">
          <HizbStar size={20} quarters={4} color="var(--accent)" />
        </span>
        <h1 className="display-md" style={{ margin: '0 0 10px' }}>{t('title')}</h1>
        <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.75 }}>{t('intro')}</p>
      </header>

      <SeparateurSection />

      {SECTIONS.map((s) => (
        <section key={s.titre} className="card">
          <h2 className="title-md" style={{ margin: '0 0 14px' }}>{t(s.titre)}</h2>

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {s.points.map((p) => (
              <li key={p} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {/* Une puce à filet plutôt qu'un disque : discrète, et elle
                    suit le sens de lecture sans marge conditionnelle. */}
                <span
                  aria-hidden="true"
                  style={{
                    inlineSize: 5,
                    blockSize: 5,
                    borderRadius: 3,
                    background: 'var(--accent)',
                    flexShrink: 0,
                    marginBlockStart: 9,
                  }}
                />
                <span style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{t(p)}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7 }}>
        {t('selfHosted')}
      </p>
    </div>
  );
}
