/**
 * Classement — la ligue de la semaine.
 *
 * C'était une liste plate de lignes numérotées : rien ne disait ce qu'est une
 * ligue, ce qu'on y gagne, ni quand elle se termine. Trois ajouts :
 *
 * **Le bandeau de ligue.** Le nom, le métal, le nombre de participants et le
 * décompte avant remise à zéro. Sans échéance, un classement n'a pas d'enjeu.
 *
 * **Les zones.** Promotion et relégation sont matérialisées par un filet doré
 * et un filet rouge entre les lignes, à la position renvoyée par le serveur.
 * On voit d'un coup d'œil de quel côté de la ligne on se trouve.
 *
 * **La base du classement est dite.** Il suit les XP de la semaine, pas les
 * versets mémorisés — un débutant assidu peut y devancer un hafiz inactif, et
 * c'est voulu. Le dire évite qu'on le prenne pour un palmarès de mémorisation.
 *
 * Les couleurs des métaux restent fixes dans les deux thèmes : inverser un
 * bronze le rendrait méconnaissable.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { leaguesAPI, badgesAPI } from '../services/api';
import { useResource, asList, unwrap, StateBlock } from '../components/useResource';
import { useAuth } from '../store';
import { useLabel } from '../services/i18n';
import { HizbStar, SeparateurSection, ZelligeField } from '../components/Ornements';
import { IconeClassement, IconeRecompense } from '../components/Icones';
import { structuralNumber } from '../i18n/nombres';

const METAUX: Record<string, string> = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#D9A441',
  platinum: '#C9CBC8',
  diamond: '#8FD3E8',
  master: '#8E6BB5',
};

type Onglet = 'ligue' | 'global' | 'succes';

export default function LeaderboardPage() {
  const label = useLabel();
  const { t, i18n } = useTranslation(['leaderboard', 'common']);
  const locale = i18n.resolvedLanguage ?? 'fr';

  const [onglet, setOnglet] = useState<Onglet>('ligue');
  const user = useAuth((s) => s.user);
  const monId = user?._id ?? user?.id;

  const ligue = useResource<any>(() => leaguesAPI.leaderboard(), []);
  const global = useResource<any>(() => leaguesAPI.global(), []);
  const succes = useResource<any>(() => badgesAPI.all(), []);

  const actif = onglet === 'succes' ? succes : onglet === 'global' ? global : ligue;
  const lignes = asList(actif.data, 'leaderboard', 'users', 'badges', 'items');

  const infoLigue = unwrap(ligue.data) ?? {};
  const metal = String(infoLigue.league?.id ?? user?.gamification?.league ?? '').toLowerCase();
  const zonePromotion: number = infoLigue.promotionZone ?? 0;
  const zoneRelegation: number = infoLigue.demotionZone ?? 0;
  const participants: number = infoLigue.totalParticipants ?? 0;
  const joursRestants: number | null = infoLigue.daysUntilReset ?? null;

  // Le rang de l'utilisateur peut se situer hors du top renvoyé.
  const moi = infoLigue.currentUser;
  const dansListe = lignes.some((r: any) => String(r.userId ?? r._id ?? r.id) === String(monId));

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <h1 className="display-md" style={{ margin: 0 }}>{t('title')}</h1>

      <div role="tablist" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {([
          ['ligue', t('myLeague')],
          ['global', t('global')],
          ['succes', t('achievements')],
        ] as const).map(([cle, libelle]) => (
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

      {/* --- Bandeau de ligue ---------------------------------------------- */}
      {onglet === 'ligue' && metal && (
        <section
          className="sacred-card"
          style={{
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <ZelligeField
            style={{ position: 'absolute', inset: 0, color: METAUX[metal] ?? 'var(--accent)' }}
            opacity={0.05}
          />

          <div
            aria-hidden="true"
            style={{
              position: 'relative',
              inlineSize: 54,
              blockSize: 54,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              border: `2px solid ${METAUX[metal] ?? 'var(--border-gold)'}`,
              flexShrink: 0,
            }}
          >
            <IconeClassement size={26} color={METAUX[metal] ?? 'var(--accent)'} />
          </div>

          <div style={{ position: 'relative', flex: 1, minInlineSize: 160 }}>
            <div className="title-lg" style={{ textTransform: 'capitalize' }}>
              {infoLigue.league?.name ?? metal}
            </div>
            <div className="caption">
              {participants > 0 && t('participants', { count: participants })}
              {joursRestants != null && participants > 0 && ' · '}
              {joursRestants != null && t('resetIn', { count: joursRestants })}
            </div>
          </div>

          {moi && (
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div className="data-xl" style={{ fontSize: 28, color: 'var(--accent-text)' }}>
                {structuralNumber(moi.rank, locale)}
              </div>
              <div className="overline">{t('you')}</div>
            </div>
          )}
        </section>
      )}

      {onglet === 'ligue' && <p className="caption" style={{ margin: 0, lineHeight: 1.7 }}>{t('basis')}</p>}

      <StateBlock
        loading={actif.loading}
        error={actif.error}
        empty={!actif.loading && lignes.length === 0}
        emptyText={onglet === 'succes' ? t('emptyBadges') : t('emptyRanking')}
        onRetry={actif.reload}
      />

      {onglet === 'succes' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(158px, 1fr))', gap: 12 }}>
          {lignes.map((b: any, i: number) => {
            const obtenu = b.unlocked ?? b.isUnlocked ?? false;
            return (
              <div
                key={b._id ?? b.id ?? i}
                className="card"
                style={{
                  display: 'grid',
                  justifyItems: 'center',
                  gap: 8,
                  textAlign: 'center',
                  borderColor: obtenu ? 'var(--border-gold)' : 'var(--border)',
                }}
              >
                {/* L'étoile de hizb remplace l'émoji de médaille : c'est la même
                    unité visuelle que partout ailleurs, et elle distingue
                    obtenu / non obtenu sans recourir à l'opacité seule. */}
                <HizbStar
                  size={34}
                  quarters={obtenu ? 4 : 0}
                  color={obtenu ? 'var(--accent)' : 'var(--border-strong)'}
                />
                <strong style={{ fontSize: 14, color: obtenu ? 'var(--text)' : 'var(--text-muted)' }}>
                  {label(b.name ?? b.title) || t('badge')}
                </strong>
                <span className="caption">
                  {label(b.description) || (obtenu ? t('unlocked') : t('toUnlock'))}
                </span>
                {!obtenu && (
                  <span className="overline" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <IconeRecompense size={12} />
                    {t('locked')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 4 }}>
          {lignes.map((ligne: any, index: number) => {
            const id = ligne._id ?? ligne.userId ?? ligne.id;
            const cestMoi = monId != null && String(id) === String(monId);
            const rang = ligne.rank ?? index + 1;
            const metalLigne = String(ligne.league ?? '').toLowerCase();

            // Les séparateurs de zone n'existent que dans l'onglet ligue : le
            // classement global n'a ni promotion ni relégation.
            const finPromotion = onglet === 'ligue' && zonePromotion > 0 && rang === zonePromotion;
            const debutRelegation =
              onglet === 'ligue' &&
              zoneRelegation > 0 &&
              participants > 0 &&
              rang === participants - zoneRelegation + 1;

            return (
              <div key={id ?? index}>
                {debutRelegation && (
                  <Frontiere libelle={t('relegationZone')} couleur="var(--danger)" />
                )}

                <div
                  className="card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '10px 14px',
                    borderColor: cestMoi ? 'var(--border-gold)' : 'var(--border)',
                    background: cestMoi ? 'var(--accent-wash)' : 'var(--surface)',
                  }}
                >
                  <span
                    className="data"
                    style={{
                      inlineSize: 30,
                      textAlign: 'center',
                      color: rang <= 3 ? 'var(--accent-text)' : 'var(--text-muted)',
                      fontSize: rang <= 3 ? 18 : 15,
                    }}
                  >
                    {structuralNumber(rang, locale)}
                  </span>

                  <span style={{ flex: 1, minInlineSize: 0, fontWeight: cestMoi ? 600 : 400 }}>
                    {label(ligne.displayName ?? ligne.username) || t('member')}
                    {cestMoi && <span style={{ color: 'var(--accent-text)' }}> — {t('you')}</span>}
                    {ligne.level != null && (
                      <span className="caption" style={{ display: 'block' }}>
                        {t('level', { n: ligne.level })}
                      </span>
                    )}
                  </span>

                  {metalLigne && (
                    <span
                      aria-label={metalLigne}
                      title={metalLigne}
                      style={{
                        inlineSize: 10,
                        blockSize: 10,
                        borderRadius: 5,
                        background: METAUX[metalLigne] ?? 'var(--text-muted)',
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <strong className="data" style={{ color: 'var(--brand)' }}>
                    {structuralNumber(ligne.weeklyXP ?? ligne.totalXP ?? ligne.xp ?? 0, locale)} XP
                  </strong>
                </div>

                {finPromotion && (
                  <Frontiere libelle={t('promotionZone')} couleur="var(--accent)" />
                )}
              </div>
            );
          })}

          {/* Hors du top : sa propre ligne reste accessible en bas. */}
          {onglet === 'ligue' && moi && !dansListe && (
            <>
              <SeparateurSection />
              <div
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 14px',
                  borderColor: 'var(--border-gold)',
                  background: 'var(--accent-wash)',
                }}
              >
                <span className="data" style={{ inlineSize: 30, textAlign: 'center' }}>
                  {structuralNumber(moi.rank, locale)}
                </span>
                <span style={{ flex: 1, fontWeight: 600 }}>{t('you')}</span>
                <strong className="data" style={{ color: 'var(--brand)' }}>
                  {structuralNumber(moi.weeklyXP ?? 0, locale)} XP
                </strong>
              </div>
            </>
          )}

          {onglet === 'ligue' && !moi && !actif.loading && lignes.length > 0 && (
            <p className="caption" style={{ margin: '8px 0 0' }}>{t('notRanked')}</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Frontière de zone. Un filet et une étiquette entre deux lignes — assez pour
 * qu'on sache de quel côté on est, sans peindre des lignes entières en
 * couleur, ce qui rendrait le classement illisible.
 */
function Frontiere({ libelle, couleur }: { libelle: string; couleur: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        margin: '8px 0',
      }}
    >
      <span style={{ flex: 1, blockSize: 1, background: couleur, opacity: 0.5 }} />
      <span className="overline" style={{ color: couleur }}>{libelle}</span>
      <span style={{ flex: 1, blockSize: 1, background: couleur, opacity: 0.5 }} />
    </div>
  );
}
