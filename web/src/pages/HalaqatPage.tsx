/**
 * Halaqat — les cercles d'étude.
 *
 * Le lien humain du produit : un groupe, un enseignant qui écoute les
 * récitations, et une progression collective. C'était un formulaire suivi
 * d'une liste de noms, sans rien montrer de ce qu'est une halaqa.
 *
 * Ce qui change : la carte de halaqa porte un bandeau à motif, l'enseignant y
 * est identifié par une pastille dorée, et l'état de session — en cours,
 * programmée, aucune — se lit d'un coup d'œil. L'état vide explique le concept
 * au lieu de constater son absence.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { halaqaAPI } from '../services/api';
import { HizbStar, MihrabArch, ZelligeField } from '../components/Ornements';
import { IconeHalaqat } from '../components/Icones';

interface Halaqa {
  _id: string;
  name: string;
  description?: string;
  memberCount?: number;
  members?: any[];
  inviteCode?: string;
  creator?: { displayName?: string; username?: string };
  liveSession?: boolean;
  nextSessionAt?: string;
  totalVersesMemorized?: number;
}

const deballer = (reponse: any): Halaqa[] => {
  const charge = reponse?.data ?? reponse;
  if (Array.isArray(charge)) return charge;
  return charge?.halaqat ?? charge?.items ?? [];
};

type Onglet = 'miennes' | 'decouvrir';

export default function HalaqatPage() {
  const { t } = useTranslation(['halaqat', 'common']);

  const [onglet, setOnglet] = useState<Onglet>('miennes');
  const [miennes, setMiennes] = useState<Halaqa[]>([]);
  const [publiques, setPubliques] = useState<Halaqa[]>([]);
  const [chargement, setChargement] = useState(true);
  const [code, setCode] = useState('');
  const [nom, setNom] = useState('');
  const [avis, setAvis] = useState<string | null>(null);

  const charger = async () => {
    setChargement(true);
    try {
      setMiennes(deballer(await halaqaAPI.mine()));
      try {
        setPubliques(deballer(await halaqaAPI.discover()));
      } catch {
        // La découverte peut être indisponible sans que « mes halaqat » le
        // soit : on n'invalide pas l'écran entier pour autant.
        setPubliques([]);
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const creer = async () => {
    if (!nom.trim()) return;
    try {
      await halaqaAPI.create({ name: nom.trim(), description: '', isPublic: true });
      setNom('');
      charger();
    } catch (e: any) {
      setAvis(e?.error ?? t('common:errorGeneric'));
    }
  };

  const rejoindre = async () => {
    if (!code.trim()) return;
    try {
      await halaqaAPI.joinByCode(code.trim().toUpperCase());
      setCode('');
      charger();
    } catch (e: any) {
      setAvis(e?.error ?? t('common:errorGeneric'));
    }
  };

  const affichees = onglet === 'miennes' ? miennes : publiques;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <h1 className="display-md" style={{ margin: 0, flex: 1 }}>{t('title')}</h1>
        {avis && <span role="status" className="caption">{avis}</span>}
      </div>

      <div role="tablist" style={{ display: 'flex', gap: 6 }}>
        {([['miennes', t('mine')], ['decouvrir', t('discover')]] as const).map(([cle, libelle]) => (
          <button
            key={cle}
            role="tab"
            aria-selected={onglet === cle}
            className={onglet === cle ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '6px 16px', fontSize: 14, minHeight: 36 }}
            onClick={() => setOnglet(cle as Onglet)}
          >
            {libelle}
          </button>
        ))}
      </div>

      {/* --- Créer ou rejoindre -------------------------------------------- */}
      <section className="card" style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            style={{ flex: 1, minWidth: 200 }}
            placeholder={t('create')}
            aria-label={t('create')}
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
          <button className="btn-primary" onClick={creer} disabled={!nom.trim()}>
            {t('create')}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            style={{ flex: 1, minWidth: 200 }}
            placeholder={t('joinByCode')}
            aria-label={t('joinByCode')}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            // Le code d'invitation est toujours latin : le forcer en LTR évite
            // qu'il s'inverse à l'affichage en interface arabe.
            dir="ltr"
          />
          <button className="btn-ghost" onClick={rejoindre} disabled={!code.trim()}>
            {t('join')}
          </button>
        </div>
      </section>

      {/* --- État vide ------------------------------------------------------ */}
      {!chargement && affichees.length === 0 && onglet === 'miennes' && (
        <section
          className="sacred-card"
          style={{ display: 'grid', gap: 16, justifyItems: 'center', padding: 40, textAlign: 'center' }}
        >
          <MihrabArch style={{ width: 120 }} />
          <strong className="title-lg">{t('emptyTitle')}</strong>
          <p style={{ margin: 0, maxWidth: 460, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            {t('emptyBody')}
          </p>
          <button className="btn-ghost" onClick={() => setOnglet('decouvrir')}>
            {t('discover')}
          </button>
        </section>
      )}

      {/* --- Cartes de halaqa ----------------------------------------------- */}
      <div style={{ display: 'grid', gap: 12 }}>
        {affichees.map((h) => {
          const enseignant = h.creator?.displayName ?? h.creator?.username;
          const membres = h.memberCount ?? h.members?.length ?? 0;

          return (
            <Link key={h._id} to={`/halaqa/${h._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article className="card carte-lien" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Bandeau : motif à faible opacité sur fond profond. C'est le
                    seul endroit de la carte où la couleur porte. */}
                <div
                  style={{
                    position: 'relative',
                    background: 'var(--brand-sunken)',
                    color: 'var(--text-on-brand)',
                    padding: '16px 18px',
                    overflow: 'hidden',
                  }}
                >
                  <ZelligeField style={{ position: 'absolute', inset: 0, color: '#fff' }} opacity={0.04} />
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <IconeHalaqat size={22} />
                    <strong className="title-md" style={{ flex: 1 }}>{h.name}</strong>
                    <EtatSession halaqa={h} />
                  </div>
                </div>

                <div style={{ padding: '14px 18px', display: 'grid', gap: 10 }}>
                  {h.description && (
                    <p className="caption" style={{ margin: 0 }}>{h.description}</p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {enseignant && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <span
                          className="caption"
                          style={{
                            border: '1px solid var(--border-gold)',
                            color: 'var(--accent-text)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1px 8px',
                          }}
                        >
                          {t('teacher')}
                        </span>
                        <span className="caption">{enseignant}</span>
                      </span>
                    )}

                    <span className="caption">{t('members', { count: membres })}</span>

                    {h.totalVersesMemorized != null && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <HizbStar size={14} quarters={4} color="var(--accent)" />
                        <span className="caption">
                          {t('collective', { count: h.totalVersesMemorized })}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * État de session. Trois cas distincts, et « aucune session prévue » en fait
 * partie : le silence est une information, pas une absence d'information.
 */
function EtatSession({ halaqa }: { halaqa: Halaqa }) {
  const { t, i18n } = useTranslation('halaqat');

  if (halaqa.liveSession) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <span
          aria-hidden="true"
          style={{
            inlineSize: 8, blockSize: 8, borderRadius: 4,
            background: 'var(--accent-text)',
            animation: 'pulsation 1.6s ease-in-out infinite',
          }}
        />
        {t('liveNow')}
        <style>{`
          @keyframes pulsation { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
          @media (prefers-reduced-motion: reduce) {
            @keyframes pulsation { 0%,100% { opacity: 1 } }
          }
        `}</style>
      </span>
    );
  }

  if (halaqa.nextSessionAt) {
    const quand = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? 'fr', {
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(halaqa.nextSessionAt));
    return <span style={{ fontSize: 13, opacity: 0.9 }}>{t('nextSession', { when: quand })}</span>;
  }

  return <span style={{ fontSize: 13, opacity: 0.75 }}>{t('noSession')}</span>;
}
