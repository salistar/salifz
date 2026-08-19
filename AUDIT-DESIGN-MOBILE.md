# Audit design mobile — 19 août 2026, soir

> Déclenché par la première installation de l'APK release sur un appareil réel
> (SM-A075F, Android, navigation 3 boutons, système en français). Chaque
> constat vient d'une capture d'écran, chaque cause a été vérifiée dans le
> code avant correction. Les captures sont dans `Desktop/Salifz Captures/`.

## Constats, causes, corrections

### 1. Quatre écrans ignoraient la langue choisie — et le français n'existait pas

**Vu à l'écran** : Khatam, Horaires de prière, Qibla et Détail du khatam
s'affichent en anglais sur un téléphone en français, dans une app par ailleurs
en arabe.

**Cause** : ces écrans n'importaient pas le système de traduction. Chaque
texte était un ternaire `isRTL ? 'عربي' : 'English'` — un interrupteur binaire
où le français n'existe pas et où le choix de langue des réglages n'a aucun
effet. 66 textes concernés sur les quatre écrans.

**Correction** : les 66 ternaires de texte remplacés par `t('…')`, clés
ajoutées aux trois locales. Les ternaires restants ne portent que la mise en
page (sens des flèches, alignement), ce qui est le rôle légitime de `isRTL`.

### 2. Premier lancement toujours en arabe

**Cause** : `i18n.ts` initialisait `currentLocale = 'ar'` et ne consultait
jamais la langue de l'appareil. Le sélecteur existe (Réglages), mais rien ne
signale son existence à un utilisateur qui ne lit pas l'arabe.

**Correction** : au premier lancement, la langue du téléphone si elle est
couverte (ar/fr/en), sinon l'anglais. Le choix explicite des réglages reste
prioritaire et persistant.

### 3. L'écran Série affichait 0 à un compte qui a une série de 6

**Vu à l'écran** : accueil « السلسلة 6 », écran Série « 0 يوم متتالي »,
plus longue série 0, 2 gels — pour le même compte au même moment.

**Cause** : l'écran appelait `streakStore.fetchStreak`. La méthode du store
s'appelle `loadStreak`. Le garde `typeof === 'function'` transformait la
faute de frappe en silence : rien n'était jamais chargé et l'écran affichait
les valeurs par défaut du store — qui sont exactement 0, 0 et 2. Le calendrier
des 30 jours, généré à partir de cette valeur jamais chargée, sortait vide.

**Correction** : appel de la vraie méthode, et régénération du calendrier
quand la donnée arrive (au montage, elle vaut encore 0).

**Leçon** : `store as any` + garde `typeof` = les fautes de nom deviennent
des écrans qui mentent sans erreur. Même famille que le repli silencieux de
moteur trouvé en production le même jour.

### 4. Le badge gemmes des leçons affichait `ayahs × 10`

**Vu à l'écran** : accueil 240 gemmes, écran leçons 0 gemme.

**Cause** : `{stats.ayahs * 10}` dans un badge en forme de gemme. Un compte à
240 gemmes en voyait 0 ; un compte à 100 versets aurait vu 1 000 gemmes qui
n'existent pas.

**Correction** : le badge lit `gems` du store de gamification.

### 5. Les statistiques de révision étaient inventées

**Vu à l'écran** : « 12 révisions aujourd'hui, 85 % de précision,
156 révisions au total » — sur un compte qui n'a **aucun verset** en révision.

**Cause** : les quatre chiffres étaient des littéraux dans le JSX. C'est la
catégorie de faute que l'audit d'août avait désignée comme le risque de
réputation n° 1 du projet (`75 + Math.random() * 20`) ; celle-ci avait
survécu au nettoyage.

**Correction** : la carte affiche les données que l'écran charge déjà
réellement — versets à réviser (file réelle), points faibles, jours
consécutifs (store de série), XP estimé de la session.

### 6. « Prochaine prière : Isha dans 23 h 28 » à 22 h 10

**Cause double.** Le backend comparait les horaires au fuseau **du serveur**
(UTC sur srv3) : à 22 h 10 marocaines il croyait 21 h 10, jugeait l'Isha de
21 h 39 encore à venir. Et le client, voyant l'heure passée, enroulait le
compte à rebours sur +24 h au lieu de rebasculer sur le Fajr.

**Correction** : le backend calcule dans le fuseau du lieu demandé (fourni
par Aladhan) via `Intl.DateTimeFormat` ; le client recalcule localement la
prochaine prière quand l'heure affichée est dépassée.

### 7. La barre d'onglets partageait ses pixels avec les boutons Android

**Vécu pendant les captures** : taper l'onglet « حسابي » déclenchait le
bouton Retour système ; « التواصل » tombait sur le bouton Accueil.

**Cause** : `tabBarStyle` à hauteur fixe (65) sans safe-area. En navigation
3 boutons, la barre système (~48 dp) recouvre le bas de l'app.

**Correction** : `insets.bottom` ajouté à la hauteur et au padding.

## Constat non corrigé, à traiter

- **La session ne survit pas au redémarrage de l'app** : le jeton vit en
  mémoire (`api.ts` : « Token en mémoire ») ; tuer l'app ramène à l'écran de
  connexion. Il faut un refresh token en SecureStore et une reconnexion
  silencieuse au démarrage. C'est un chantier en soi (stockage sûr,
  expiration, invalidation) — pas un correctif d'audit.
- **Dates du calendrier de prière** : les noms de mois du repli restent
  anglais quand l'API ne fournit pas la date. Mineur, visible seulement en
  panne d'Aladhan.

## Vérification

- `tsc --noEmit` : propre sur tout le projet.
- `routes/prayer.js` se charge, sa logique de fuseau testée à la main.
- Les corrections visuelles (tab bar, écrans traduits, vraies stats) se
  vérifient sur l'appareil après reconstruction de l'APK.
