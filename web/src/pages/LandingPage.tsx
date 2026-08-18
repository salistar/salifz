/**
 * Page de présentation — le seul écran que voit quelqu'un qui ne connaît pas
 * encore Salifz.
 *
 * Elle décrit ce que l'application fait réellement aujourd'hui. Les
 * fonctionnalités listées ici existent toutes et sont vérifiables dans le
 * produit : annoncer une reconnaissance de récitation par IA, par exemple,
 * serait une promesse que le code ne tient pas.
 *
 * Ce qui change : les six émojis de fonctionnalité laissent place aux icônes
 * du produit — un émoji se rend différemment sur chaque système, et six styles
 * de dessin côte à côte donnent l'impression d'un assemblage. Les textes
 * passent par les traductions ; une page d'accueil qui reste française quand
 * l'interface est arabe est la première chose qu'on remarque.
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LandingArtwork, PatternPaths } from '../components/Artwork';
import { HizbStar, ZelligeField } from '../components/Ornements';
import {
  IconeMushaf,
  IconeLecons,
  IconeRevision,
  IconeHalaqat,
  IconeKhatam,
  IconeQibla,
} from '../components/Icones';
import { structuralNumber } from '../i18n/nombres';

/** Les six fonctions : une icône du produit et deux clés de traduction. */
const FONCTIONS = [
  { Icone: IconeMushaf, titre: 'f1Title', texte: 'f1Body' },
  { Icone: IconeLecons, titre: 'f2Title', texte: 'f2Body' },
  { Icone: IconeRevision, titre: 'f3Title', texte: 'f3Body' },
  { Icone: IconeHalaqat, titre: 'f4Title', texte: 'f4Body' },
  { Icone: IconeKhatam, titre: 'f5Title', texte: 'f5Body' },
  { Icone: IconeQibla, titre: 'f6Title', texte: 'f6Body' },
] as const;

const ETAPES = [
  { titre: 's1Title', texte: 's1Body' },
  { titre: 's2Title', texte: 's2Body' },
  { titre: 's3Title', texte: 's3Body' },
  { titre: 's4Title', texte: 's4Body' },
] as const;

export default function LandingPage() {
  const { t, i18n } = useTranslation(['landing', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  return (
    <div>
      {/* ---------------------------------------------------------------- */}
      {/* Bandeau d'ouverture                                              */}
      {/* ---------------------------------------------------------------- */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface-sunken)' }}>
        <LandingArtwork
          style={{
            position: 'absolute',
            insetInline: 0,
            bottom: 0,
            width: '100%',
            height: '58%',
            opacity: 0.34,
          }}
        />

        <div
          style={{
            position: 'relative',
            maxWidth: 1180,
            margin: '0 auto',
            padding: '76px 20px 90px',
            display: 'grid',
            gap: 40,
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            alignItems: 'center',
          }}
        >
          <div>
            <p
              className="overline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                margin: '0 0 18px',
                padding: '5px 14px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-gold)',
                color: 'var(--accent-text)',
              }}
            >
              <HizbStar size={12} quarters={4} color="var(--accent)" />
              {t('eyebrow')}
            </p>

            <h1
              className="display-lg"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.1rem)', lineHeight: 1.16, margin: '0 0 18px' }}
            >
              {t('title')}
            </h1>

            <p
              style={{
                fontSize: 18,
                lineHeight: 1.7,
                color: 'var(--text-muted)',
                margin: '0 0 28px',
                maxInlineSize: 540,
              }}
            >
              {t('subtitle')}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                to="/inscription"
                className="btn-primary"
                style={{ textDecoration: 'none', padding: '14px 26px', fontSize: 16 }}
              >
                {t('createAccount')}
              </Link>
              <a
                href="#fonctionnalites"
                className="btn-ghost"
                style={{ textDecoration: 'none', padding: '14px 26px', fontSize: 16 }}
              >
                {t('seeFeatures')}
              </a>
            </div>

            <p className="caption" style={{ marginBlockStart: 20 }}>{t('bothPlatforms')}</p>
          </div>

          <Chiffres locale={locale} />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Fonctionnalités                                                  */}
      {/* ---------------------------------------------------------------- */}
      <section id="fonctionnalites" style={{ maxWidth: 1180, margin: '0 auto', padding: '76px 20px 0' }}>
        <EnTeteSection surtitre={t('features')} titre={t('featuresTitle')} sous={t('featuresLead')} />

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          {FONCTIONS.map(({ Icone, titre, texte }) => (
            <article key={titre} className="card" style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
              <span style={{ color: 'var(--brand)' }} aria-hidden="true">
                <Icone size={26} />
              </span>
              <h3 className="title-md" style={{ margin: 0 }}>{t(titre)}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: 15 }}>
                {t(texte)}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Méthode                                                          */}
      {/* ---------------------------------------------------------------- */}
      <section id="methode" style={{ maxWidth: 1180, margin: '0 auto', padding: '76px 20px 0' }}>
        <EnTeteSection surtitre={t('method')} titre={t('methodTitle')} sous={t('methodLead')} />

        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          }}
        >
          {ETAPES.map(({ titre, texte }, i) => (
            <li key={titre} className="card" style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
              {/* L'étoile se remplit d'un quart par étape : la progression du
                  cycle est dans la forme, pas seulement dans le numéro. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <HizbStar size={16} quarters={(i + 1) as 1 | 2 | 3 | 4} color="var(--accent)" />
                <span className="data overline" style={{ color: 'var(--accent-text)' }}>
                  {structuralNumber(i + 1, locale)}
                </span>
              </div>
              <h3 className="title-md" style={{ margin: 0, fontSize: 16 }}>{t(titre)}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.65, fontSize: 15 }}>
                {t(texte)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Tarifs                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section id="tarifs" style={{ maxWidth: 1180, margin: '0 auto', padding: '76px 20px 0' }}>
        <EnTeteSection surtitre={t('pricing')} titre={t('pricingTitle')} sous={t('pricingLead')} />

        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <Offre
            nom={t('planFree')}
            prix={`${structuralNumber(0, locale)} €`}
            details={[t('free1'), t('free2'), t('free3'), t('free4'), t('free5')]}
            action={{ to: '/inscription', label: t('getStarted') }}
            mise
          />
          <Offre
            nom={t('planPlus')}
            prix={t('comingSoon')}
            details={[t('plus1'), t('plus2'), t('plus3'), t('plus4')]}
            note={t('plusNote')}
          />
          <Offre
            nom={t('planFamily')}
            prix={t('comingSoon')}
            details={[t('family1'), t('family2'), t('family3')]}
            note={t('familyNote')}
          />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Appel final                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section style={{ maxWidth: 1180, margin: '0 auto', padding: '76px 20px 0' }}>
        <div
          className="card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'var(--brand-sunken)',
            borderColor: 'var(--border-gold)',
            color: 'var(--text-on-brand)',
            padding: '52px 28px',
            textAlign: 'center',
          }}
        >
          <ZelligeField style={{ position: 'absolute', inset: 0, color: '#ffffff' }} opacity={0.05} />
          <svg
            viewBox="-100 -100 200 200"
            aria-hidden="true"
            style={{ position: 'absolute', insetInlineEnd: -40, top: -40, width: 240, height: 240, color: '#ffffff' }}
          >
            <PatternPaths opacity={0.13} />
          </svg>

          <div style={{ position: 'relative' }}>
            <h2 className="display-md" style={{ margin: '0 0 12px', fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
              {t('ctaTitle')}
            </h2>
            <p style={{ margin: '0 auto 26px', maxInlineSize: 520, opacity: 0.92, lineHeight: 1.7 }}>
              {t('ctaBody')}
            </p>
            <Link
              to="/inscription"
              style={{
                display: 'inline-block',
                background: 'var(--surface)',
                color: 'var(--brand)',
                padding: '14px 30px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              {t('createAccount')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function EnTeteSection({ surtitre, titre, sous }: { surtitre: string; titre: string; sous: string }) {
  return (
    <header style={{ marginBlockEnd: 30, maxInlineSize: 640 }}>
      <p className="overline" style={{ margin: '0 0 10px', color: 'var(--accent-text)' }}>{surtitre}</p>
      <h2 className="display-md" style={{ margin: '0 0 10px', fontSize: 'clamp(1.5rem, 3vw, 2.1rem)' }}>
        {titre}
      </h2>
      <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.7 }}>{sous}</p>
    </header>
  );
}

/**
 * Repères chiffrés, tous vérifiables : ce sont des constantes du Coran et du
 * produit, pas des mesures d'usage qu'on ne pourrait pas justifier.
 *
 * Les nombres passent par `structuralNumber` — en arabe, 604 s'écrit ٦٠٤ et
 * l'afficher en chiffres latins au milieu d'une page arabe se voit.
 */
function Chiffres({ locale }: { locale: string }) {
  const { t } = useTranslation('landing');

  const items: [number, string][] = [
    [604, t('pages')],
    [6236, t('verses')],
    [114, t('surahs')],
    [3, t('languages')],
  ];

  return (
    <div
      className="card"
      style={{
        display: 'grid',
        gap: 1,
        gridTemplateColumns: '1fr 1fr',
        padding: 0,
        overflow: 'hidden',
        background: 'var(--border)',
      }}
    >
      {items.map(([valeur, libelle]) => (
        <div key={libelle} style={{ background: 'var(--surface)', padding: '28px 18px', textAlign: 'center' }}>
          <div className="data-xl" style={{ fontSize: 30, color: 'var(--accent-text)' }}>
            {structuralNumber(valeur, locale)}
          </div>
          <div className="overline" style={{ marginBlockStart: 6 }}>{libelle}</div>
        </div>
      ))}
    </div>
  );
}

function Offre({
  nom,
  prix,
  details,
  action,
  note,
  mise,
}: {
  nom: string;
  prix: string;
  details: string[];
  action?: { to: string; label: string };
  note?: string;
  mise?: boolean;
}) {
  return (
    <div
      className={mise ? 'sacred-card' : 'card'}
      style={{ display: 'grid', gap: 16, alignContent: 'start' }}
    >
      <div>
        <h3 className="title-md" style={{ margin: '0 0 6px' }}>{nom}</h3>
        <p className="data-xl" style={{ margin: 0, fontSize: 26, color: 'var(--accent-text)' }}>{prix}</p>
      </div>

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 9 }}>
        {details.map((d) => (
          <li key={d} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 15 }}>
            <span style={{ flexShrink: 0, marginBlockStart: 4 }} aria-hidden="true">
              <HizbStar size={11} quarters={4} color="var(--accent)" />
            </span>
            <span style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>{d}</span>
          </li>
        ))}
      </ul>

      {action && (
        <Link to={action.to} className="btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
          {action.label}
        </Link>
      )}
      {note && <p className="caption" style={{ margin: 0, lineHeight: 1.6 }}>{note}</p>}
    </div>
  );
}
