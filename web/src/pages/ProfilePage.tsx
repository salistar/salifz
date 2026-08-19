/**
 * Profil — qui je suis dans le produit.
 *
 * L'écran cumulait trois pages en une : le profil, les réglages et les
 * notifications, alors que chacune existe déjà par ailleurs. Résultat, aucun
 * des trois n'était traité correctement, et deux versions des mêmes réglages
 * cohabitaient — celle-ci écrivait `dailyGoal` à la racine, la page Réglages
 * l'écrivait dans `learning`, si bien que modifier l'un ne se voyait pas dans
 * l'autre.
 *
 * Le profil ne garde donc que ce qui lui appartient : l'identité, le niveau,
 * la mémorisation, les succès et les cercles. L'export et la suppression du
 * compte rejoignent les Réglages, où vit déjà la section « Données ».
 */

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, halaqaAPI, badgesAPI, progressAPI, API_URL } from '../services/api';
import { useResource, asList, unwrap } from '../components/useResource';
import { useAuth } from '../store';
import { useLabel } from '../services/i18n';
import { HizbStar, MihrabArch, SeparateurSection, ZelligeField } from '../components/Ornements';
import {
  IconeGemmes,
  IconeCoeurs,
  IconeSerie,
  IconeStatistiques,
  IconeReglages,
  IconeHalaqat,
} from '../components/Icones';
import { structuralNumber } from '../i18n/nombres';
import { formaterDate } from '../i18n';

export default function ProfilePage() {
  const label = useLabel();
  const { t, i18n } = useTranslation(['profile', 'common', 'nav']);
  const locale = i18n.resolvedLanguage ?? 'fr';
  const { user, logout } = useAuth();

  const halaqat = useResource<any>(() => halaqaAPI.mine(), []);
  const succes = useResource<any>(() => badgesAPI.all(), []);
  const avancement = useResource<any>(() => progressAPI.overview(), []);

  const g: any = user?.gamification ?? {};
  const mesHalaqat = asList(halaqat.data, 'halaqat', 'items');
  const obtenus = asList(succes.data, 'badges', 'items').filter(
    (b: any) => b.unlocked ?? b.isUnlocked
  );

  const qp = unwrap(avancement.data)?.quranProgress ?? {};
  const versets = qp.totalVersesMemorized ?? user?.quranProgress?.totalVersesMemorized ?? 0;
  // 6 236 versets dans le mushaf ; le pourcentage vient du serveur quand il
  // le calcule, sinon on le dérive plutôt que d'afficher un tiret.
  const pourcent = qp.percentComplete ?? ((versets / 6236) * 100).toFixed(1);

  const nom = user?.displayName ?? user?.username ?? '';
  const initiale = nom ? nom[0].toUpperCase() : '';

  // Photo de profil. Même contrat que le mobile : POST /users/avatar, lecture
  // publique sur /avatar/:id, horodatage dans l'URL pour contourner le cache.
  const fichierRef = useRef<HTMLInputElement>(null);
  const [envoiPhoto, setEnvoiPhoto] = useState(false);
  const idUtilisateur = String((user as any)?.id ?? (user as any)?._id ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    (user as any)?.avatar && String((user as any).avatar).startsWith('avatars/')
      ? `${API_URL}/avatar/${idUtilisateur}?v=${Date.now()}`
      : null
  );

  const televerserPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;
    const form = new FormData();
    form.append('avatar', fichier);
    setEnvoiPhoto(true);
    try {
      await api.post('/users/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPhotoUrl(`${API_URL}/avatar/${idUtilisateur}?v=${Date.now()}`);
    } finally {
      setEnvoiPhoto(false);
      e.target.value = '';
    }
  };


  return (
    <div style={{ display: 'grid', gap: 22 }}>
      {/* --- Identité ------------------------------------------------------- */}
      <section
        className="sacred-card"
        style={{ position: 'relative', overflow: 'hidden', display: 'grid', gap: 18 }}
      >
        <ZelligeField style={{ position: 'absolute', inset: 0, color: 'var(--accent)' }} opacity={0.035} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          {/* L'arche encadre l'initiale : le même motif que l'accueil, à la
              taille d'un portrait. */}
          <button
            type="button"
            onClick={() => fichierRef.current?.click()}
            title={t('changerPhoto', { defaultValue: 'Changer la photo de profil' })}
            style={{
              position: 'relative', inlineSize: 76, blockSize: 76, flexShrink: 0,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            }}
          >
            <MihrabArch style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={nom}
                onError={() => setPhotoUrl(null)}
                style={{
                  position: 'absolute', inset: 6, width: 'calc(100% - 12px)',
                  height: 'calc(100% - 12px)', borderRadius: '50%', objectFit: 'cover',
                }}
              />
            ) : (
              <span
                className="display-md"
                style={{
                  position: 'absolute', inset: 0, display: 'grid',
                  placeItems: 'center', color: 'var(--brand)', paddingBlockStart: 8,
                }}
              >
                {envoiPhoto ? '…' : initiale}
              </span>
            )}
            <input
              ref={fichierRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={televerserPhoto}
              style={{ display: 'none' }}
            />
          </button>

          <div style={{ flex: 1, minInlineSize: 180 }}>
            <h1 className="display-md" style={{ margin: '0 0 4px' }}>{nom}</h1>
            <p className="caption" style={{ margin: 0 }}>{user?.email}</p>
            {user?.createdAt && (
              <p className="caption" style={{ margin: '2px 0 0' }}>
                {t('joined', { date: formaterDate(user.createdAt, locale) })}
              </p>
            )}
          </div>

          <div style={{ textAlign: 'center' }}>
            <div className="data-xl" style={{ fontSize: 30, color: 'var(--accent-text)' }}>
              {structuralNumber(g.level ?? 1, locale)}
            </div>
            <div className="overline">{t('level')}</div>
          </div>
        </div>

        {/* La mémorisation, en une phrase et une barre : c'est la mesure qui
            définit le profil, pas les XP. */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span className="data" style={{ fontSize: 20 }}>{structuralNumber(versets, locale)}</span>
            <span className="caption">{t('verses')}</span>
            <span style={{ flex: 1 }} />
            <span className="caption">{pourcent} % {t('ofQuran')}</span>
          </div>
          <div style={{ blockSize: 6, borderRadius: 3, background: 'var(--surface-sunken)', overflow: 'hidden' }}>
            <div
              style={{
                inlineSize: `${Math.min(100, Number(pourcent))}%`,
                blockSize: '100%',
                background: 'var(--accent)',
              }}
            />
          </div>
        </div>
      </section>

      {/* --- Chiffres ------------------------------------------------------- */}
      <section style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(126px, 1fr))' }}>
        <Mesure icone={<IconeSerie size={16} />} valeur={g.currentStreak ?? 0} libelle={t('streak')} lien="/serie" locale={locale} />
        <Mesure icone={<HizbStar size={14} quarters={4} color="var(--accent)" />} valeur={g.totalXP ?? 0} libelle={t('xp')} locale={locale} />
        <Mesure icone={<IconeGemmes size={16} />} valeur={g.gems ?? 0} libelle={t('gems')} lien="/boutique" locale={locale} />
        <Mesure
          icone={<IconeCoeurs size={16} />}
          valeur={`${structuralNumber(g.hearts?.current ?? 0, locale)}/${structuralNumber(g.hearts?.max ?? 5, locale)}`}
          libelle={t('hearts')}
          locale={locale}
        />
      </section>

      <SeparateurSection />

      {/* --- Succès --------------------------------------------------------- */}
      <section style={{ display: 'grid', gap: 12 }}>
        <h2 className="title-md" style={{ margin: 0 }}>{t('recentAchievements')}</h2>

        {obtenus.length === 0 ? (
          <p className="caption" style={{ margin: 0, lineHeight: 1.7 }}>{t('noAchievements')}</p>
        ) : (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {obtenus.slice(0, 8).map((b: any, i: number) => (
              <div
                key={b._id ?? b.id ?? i}
                title={label(b.description) || undefined}
                className="card"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderColor: 'var(--border-gold)',
                }}
              >
                <HizbStar size={16} quarters={4} color="var(--accent)" />
                <span style={{ fontSize: 14 }}>{label(b.name ?? b.title)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- Cercles -------------------------------------------------------- */}
      <section style={{ display: 'grid', gap: 12 }}>
        <h2 className="title-md" style={{ margin: 0 }}>{t('myHalaqat')}</h2>

        {mesHalaqat.length === 0 ? (
          <p className="caption" style={{ margin: 0, lineHeight: 1.7 }}>{t('noHalaqat')}</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {mesHalaqat.map((h: any) => (
              <Link key={h._id} to={`/halaqa/${h._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div
                  className="card carte-lien"
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}
                >
                  <span style={{ color: 'var(--brand)' }} aria-hidden="true">
                    <IconeHalaqat size={18} />
                  </span>
                  <strong style={{ flex: 1 }}>{h.name}</strong>
                  {/* Le rôle est porté par la halaqa, pas par le compte : on
                      est enseignant ici et élève ailleurs. */}
                  <span className="caption">
                    {String(h.creator?._id ?? h.creator) === String(user?._id ?? user?.id)
                      ? t('roleTeacher')
                      : t('roleMember')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <SeparateurSection />

      {/* --- Sorties -------------------------------------------------------- */}
      <section style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link to="/statistiques" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <IconeStatistiques size={16} />
          {t('viewStats')}
        </Link>
        <Link to="/reglages" className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <IconeReglages size={16} />
          {t('goToSettings')}
        </Link>
        <span style={{ flex: 1 }} />
        <button className="btn-ghost" onClick={logout}>{t('signOut')}</button>
      </section>
    </div>
  );
}

function Mesure({
  icone,
  valeur,
  libelle,
  lien,
  locale,
}: {
  icone: React.ReactNode;
  valeur: number | string;
  libelle: string;
  lien?: string;
  locale: string;
}) {
  const contenu = (
    <div className="card" style={{ display: 'grid', justifyItems: 'center', gap: 4, padding: 14 }}>
      <span style={{ color: 'var(--text-muted)' }} aria-hidden="true">{icone}</span>
      <span className="data" style={{ fontSize: 21 }}>
        {typeof valeur === 'number' ? structuralNumber(valeur, locale) : valeur}
      </span>
      <span className="overline">{libelle}</span>
    </div>
  );

  return lien ? (
    <Link to={lien} style={{ textDecoration: 'none', color: 'inherit' }}>{contenu}</Link>
  ) : (
    contenu
  );
}
