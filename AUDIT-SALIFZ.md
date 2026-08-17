# Audit Salifz — 16 août 2026

> ## ✅ État au 16 août 2026, 17h00
>
> **Corrigé et vérifié en conditions réelles** : les 7 failles critiques (S1–S7),
> les failles élevées S8–S17, la conformité S18–S19, les 9 fonctionnalités
> simulées du §2, les valeurs en dur du §4, le code mort du §5 et le design du §3.
>
> Sur le design : le thème est désormais câblé dans **53 fichiers** (0 auparavant),
> les couleurs en dur passent de **1 586 à 135**, le mode sombre fonctionne
> réellement, et **289 zones tactiles** ont reçu un rôle d'accessibilité.
>
> **Reste à faire** : les manques concurrentiels du §6 (vue Mushaf, masquage
> progressif, audio hors ligne, validation par un enseignant), et les 135
> couleurs restantes — des dégradés décoratifs délibérés, à trancher au cas par cas.
>
> Le détail ci-dessous décrit l'état **avant** correction : il est conservé
> comme trace de ce qui a été trouvé et pourquoi.

Périmètre : `C:\Users\21266\Desktop\sdk52\salifz`
Cible de l'audit : **v2** (`backendv2` + `mobilev2`), la génération active (dernière modif 15/05/2026).
Volume : ~48 000 lignes de code, ~33 Go sur disque, **aucun dépôt git**.

---

## 0. Renommage effectué

| Élément | Avant | Après |
|---|---|---|
| Dossier racine | `sallyHifz` | `salifz` |
| Sous-projet IA | `hifzsally-ai-model` | `salifz-ai-model` |
| Bundle iOS/Android | `com.sally.hifz` | `com.salifz.app` |
| Slug Expo | `hifzsally` | `salifz` |
| Paquets npm | `hifzsally-mobile` / `hifzsally-backend` | `salifz-mobile` / `salifz-backend` |
| Domaines | `*.hifzsally.com` | `*.salifz.com` |
| Offres | `sally_plus` / `sally_family` | `salifz_plus` / `salifz_family` |

152 occurrences remplacées dans 92 fichiers. L'attribut « lecture seule » a été levé sur 92 fichiers (héritage des zips).

**Non renommé volontairement** : le chatbot s'appelle « Sally » dans `salifz-ai-model/api/app.py` et `scripts/train_model.py`. C'est un nom de personnage, pas le nom du projet — à trancher.

**Effet de bord** : `salifz-ai-model/venv_hifz` contient des chemins absolus vers l'ancien dossier. Le venv est cassé, à recréer :

```bash
cd salifz-ai-model && python -m venv venv && .\venv\Scripts\activate && pip install -r requirements.txt
```

---

## 1. Sécurité

### 🔴 Critique

**S1 — Premium à vie gratuit.** `backendv2/routes/combined.js:118`
`POST /api/v1/subscriptions/subscribe` écrit `req.user.subscription = { plan: planId, status:'active' }` avec le `planId` envoyé par le client. Aucun paiement, aucun reçu, aucun webhook. N'importe quel compte authentifié envoie `{"planId":"lifetime"}` et obtient l'accès à vie. Le commentaire dit « In production, integrate with Stripe/RevenueCat » — ce n'est pas fait.

**S2 — Le jeton de réinitialisation de mot de passe est un jeton d'accès complet.** `routes/auth.js:245` + `middleware/auth.js:32`
Les trois jetons (accès, refresh, reset) sont signés avec le **même secret** et le middleware d'auth **ne vérifie jamais le champ `type`**. Conséquences : un refresh token (30 jours) sert de jeton d'accès, et un jeton de reset envoyé par email ouvre toute l'API.

**S3 — Prise de contrôle de n'importe quel compte.** `routes/auth.js:262`
`POST /auth/forgot-password` renvoie `resetToken` dans la réponse HTTP dès que `NODE_ENV !== 'production'`. Or `backendv2/.env` contient `NODE_ENV=development`. Chaîné avec S2 : attaquant → POST avec l'email de la victime → reçoit un jeton → accès total au compte. Sans email, sans SMS.

**S4 — Socket.IO sans autorisation.** `backendv2/index.js:157-181`, `:212`, `:241`, `:275`, `:335`
Une connexion sans jeton valide est acceptée (`socket.user = null; next()`). Ensuite **aucun handler ne vérifie l'appartenance** : `join-room`, `joinHalaqa`, `joinKhatam` acceptent n'importe quel identifiant. Un client anonyme peut rejoindre et lire n'importe quelle conversation privée, halaqa ou session de khatam. Pire, `send-message:245` fait `senderId: userId || data.senderId` : l'expéditeur est contrôlé par le client → usurpation d'identité dans les messages.

**S5 — Élévation de privilège par le client.** `backendv2/index.js:541`
`if (session.startedBy === userId || data.isAdmin)` — `data.isAdmin` vient du payload envoyé par le client. Il suffit de l'envoyer à `true` pour terminer la session de khatam de n'importe qui.

**S6 — Notifications usurpables.** `backendv2/index.js:738`
L'événement `sendNotification` n'a aucun contrôle : n'importe quel socket connecté envoie une notification arbitraire à n'importe quel utilisateur.

**S7 — Secret JWT de repli en dur.** `backendv2/routes/index.js:17` et `:35`
`jwt.verify(token, process.env.JWT_SECRET || 'salifz_secret_2024')`. Si la variable d'env manque au déploiement, le secret est public et la forge de jetons est triviale. Un secret ne doit jamais avoir de valeur de repli — le serveur doit refuser de démarrer.

### 🟠 Élevé

**S8 — Aucun rate limiting.** `express-rate-limit` figure dans les dépendances de la v1 mais **a disparu de la v2**, et aucun middleware équivalent n'existe. `/auth/login`, `/auth/register`, `/auth/forgot-password` et la vérification OTP sont ouverts au bourrinage.

**S9 — CORS ouvert.** `index.js:36` `app.use(cors())` sans origine. Socket.IO : `origin: '*'` avec `credentials: true` (`index.js:24`) — combinaison invalide et permissive.

**S10 — Un banni garde l'accès.** Deux middlewares d'auth coexistent. Celui de `middleware/auth.js:55` vérifie `status === 'banned'`, mais c'est celui de `routes/index.js:12` (sans ce contrôle) qui protège **25 des 28 routes**. Bannir un utilisateur ne le bloque donc quasiment nulle part.

**S11 — Jeton en clair sur le téléphone.** `mobilev2/src/services/api.ts:73,149` — jeton et refresh token en `AsyncStorage`, non chiffré, alors que `expo-secure-store` est installé et **jamais importé**.

**S12 — Fuite d'erreurs internes.** `index.js:89` renvoie `err.message` brut au client (messages Mongoose, chemins, contraintes).

**S13 — Contrôle parental non appliqué.** `routes/parental.js:37` écrit `contentRestrictions: ['chat','video_call']` et `dailyTimeLimit`, mais **aucune route ni aucun handler socket ne les lit jamais**. Un compte enfant peut discuter et passer des appels vidéo sans restriction. Bloquant pour Google Play Families et l'App Store.

**S14 — OTP de simulation.** `.env` : `SIMULATION_OTP=123456`, `MOCK_SMS=true`, `MOCK_EMAIL=true`. À ne pas laisser partir en production.

**S15 — Politique de mot de passe faible.** Minimum 6 caractères, aucune complexité, aucune vérification d'email obligatoire avant activation du compte.

**S16 — État en mémoire.** `activeUsers` / `khatamSessions` sont des `Map` locales (`index.js:100-104`). Redis est en dépendance mais **aucun adaptateur Socket.IO** n'est branché : présence, appels et sessions live cassent dès la 2ᵉ instance, et fuient en mémoire.

**S17 — `express.json({ limit: '10mb' })`** appliqué à toutes les routes, y compris `/auth/login`.

### ⚖️ Conformité

**S18 — Biométrie faciale.** La détection de genre traite une donnée biométrique (RGPD art. 9, catégorie particulière) dans une application à finalité religieuse. Aucun consentement explicite, aucune durée de conservation, aucune AIPD. Sous le règlement IA européen, la catégorisation biométrique est au minimum à haut risque. Et en pratique, Apple (5.1.2) et le formulaire Google Play Data Safety refuseront la fonctionnalité en l'état. **Recommandation : la supprimer et la remplacer par un choix déclaratif à l'inscription + modération.** C'est plus fiable que l'existant (voir F5), plus rapide, et ça débloque la soumission aux stores.

**S19** — Aucun `LICENSE`, aucune politique de confidentialité, aucun parcours de suppression de compte (exigé par Apple et Google), comptes enfants sans conformité COPPA.

---

## 2. Fonctionnalités annoncées qui n'existent pas

C'est le point le plus lourd du projet : le README promet 60 fonctionnalités, et les plus différenciantes sont des coquilles.

| Fonctionnalité annoncée | Réalité dans le code | Emplacement |
|---|---|---|
| **Analyse du Tajwid par IA** | L'audio est reçu **puis jeté**. Score global = `75 + random(20)`. Les 4 scores par règle sont des constantes identiques pour tous. | `routes/tajwid.js:28-34` |
| **Progression Tajwid** | Les 6 scores par règle, les points faibles et les points forts sont en dur — mêmes valeurs pour chaque utilisateur. | `routes/tajwid.js:71-80` |
| **Insights IA** | `calculateStats` renvoie `Math.random()` pour versets de la semaine, révisions, temps passé et précision. **L'utilisateur voit des statistiques inventées sur sa propre progression.** | `services/aiService.js:291-297` |
| **Meilleur moment d'apprentissage** | `times[Math.floor(Math.random()*3)]` | `services/aiService.js:302` |
| **Tafsir / explication de verset** | Renvoie littéralement « Brief explanation of the verse » pour les 6 236 versets. | `services/aiService.js:216` |
| **Détection homme/femme** | `Math.random() > 0.5`. L'espace femmes n'est donc protégé par **rien**. | `routes/face.js:16` |
| **Vérification d'identité faciale** | `Math.random() > 0.2` | `routes/face.js:58` |
| **Notifications push** | `expo-notifications` installé, **jamais importé** dans les 82 fichiers source. | — |
| **Modèles IA entraînés** | 937 Mo de modèles (chatbot 522 Mo, tajwid 415 Mo) + une API FastAPI complète : **jamais appelés**. Zéro référence au service Python dans tout le backend. | `salifz-ai-model/` |

Le plan personnalisé et la révision espacée, eux, sont réellement implémentés (`aiService.js:173-206`, tri par priorité et échéance) — c'est la seule brique « intelligente » qui fonctionne, et elle ne nécessite aucune IA.

---

## 3. Design

**D1 — Le thème est du code mort.** `mobilev2/src/contexts/ThemeContext.tsx` : 164 lignes, palette claire + palette sombre complètes, détection du thème système. **0 des 40 écrans ne l'importe.** Le sélecteur clair / sombre / auto de l'écran Réglages (`SettingsScreen.tsx:58-61`) écrit bien dans le store, mais **rien ne change à l'écran**. Promesse visible et non tenue.

**D2 — 1 586 couleurs hexadécimales en dur** réparties dans 57 fichiers (81 dans `HalaqaDetailScreen`, 65 dans `HalaqaScreen`, 64 dans `HomeScreen`). Conséquence directe de D1 : impossible de changer l'identité visuelle ou d'ajouter un mode sombre sans repasser sur tous les écrans.

**D3 — Accessibilité : zéro.** Aucun `accessibilityLabel`, `accessibilityRole` ni `accessible` sur l'ensemble de l'application. Ni lecteur d'écran, ni navigation au clavier, ni tailles de police dynamiques.

**D4 — Pas de police arabe embarquée.** `expo-font` installé, jamais importé. Le texte coranique s'affiche avec la police système, qui varie selon l'appareil — pour une app de mémorisation, la stabilité visuelle de la page est structurante (les hafiz mémorisent la *position* des mots).

**D5 — RTL partiellement traité.** `I18nManager.allowRTL/forceRTL` sont bien appelés (`services/i18n.ts:56-58, 98-100`), mais `forceRTL` n'a d'effet qu'après redémarrage complet de l'app — à vérifier sur appareil, avec un écran de transition.

**D6 — L'i18n est le point fort du projet.** 1 322 clés, **parfaitement alignées** entre `fr`, `en` et `ar`, 877 appels `t()` dans les écrans. C'est propre et rare.

---

## 4. Valeurs en dur

| Où | Quoi |
|---|---|
| `backendv2/.env` | `JWT_SECRET=salifz_super_secret_key_change_in_production_2024`, `SESSION_SECRET`, `SIMULATION_OTP=123456` — versionnés, prêts à partir en prod tels quels |
| `routes/index.js:17,35` | Secret JWT de repli `'salifz_secret_2024'` |
| `backendv2/.env` vs `mobilev2/.env` | `192.168.1.4:8088` d'un côté, `10.46.202.130:8088` de l'autre — deux IP de LAN incohérentes |
| `mobilev2/app.json` | `eas.projectId: "your-project-id"` — aucun build EAS possible |
| `combined.js:104-108` | Prix des 4 offres en dur côté serveur **et** dupliqués dans `SubscriptionsScreen.tsx` |
| `mobilev2/.env` | `XP_PER_VERSE`, `MAX_HEARTS`, `HEART_REFILL_HOURS` dupliqués avec les valeurs du backend — deux sources de vérité pour l'économie du jeu |
| `routes/tajwid.js`, `aiService.js` | Tous les barèmes pédagogiques (voir §2) |

---

## 5. Code mort

| Élément | Poids | Verdict |
|---|---|---|
| `mobile/` + `backend/` (v1 complète) | 146 fichiers, **28 111 lignes** | Doublon intégral de la v2. À supprimer après un commit git initial. |
| `data/raw/quran` | **29,3 Go** d'audio téléchargé | N'a pas sa place dans un projet. À déplacer hors du dossier ou régénérer via `scripts/download_data.py`. |
| `venv_hifz` | **2,6 Go** | Environnement virtuel versionné, désormais cassé. À supprimer et recréer. |
| Archives `.zip` à la racine | **162 Mo** | Snapshots manuels — remplacés par git. |
| `ThemeContext.tsx` + palette sombre | 164 lignes | Jamais importé (voir D1). |
| 11 dépendances mobiles | — | `expo-notifications`, `expo-secure-store`, `expo-font`, `expo-image-picker`, `expo-file-system`, `expo-asset`, `expo-localization`, `i18next`, `react-native-svg`, `react-native-screens`, `react-native-reanimated` : déclarées, jamais importées. |
| Double montage de routes | `index.js:55-84` | `/chat`, `/khatam`, `/verification` montés une 2ᵉ fois, après `routes/index.js` qui les monte déjà. Mort, et sans middleware d'auth. |
| `safeRequire` | `routes/index.js:64-71` | Avale silencieusement les routes manquantes et renvoie un routeur vide → une route absente ressemble à une route vide. Masque les erreurs de déploiement. |
| Deux middlewares d'auth | `middleware/auth.js` vs `routes/index.js:12` | Divergents (voir S10). |
| Absence de git | — | 48 000 lignes sans historique. |

**Bilan disque : ~33 Go pour ~48 000 lignes de code.** Le code utile pèse 2,4 Mo.

---

## 6. Concurrence : ce qui manque

Concurrents de référence : **Tarteel AI** (récitation), **Quran Companion** (hifz gamifié), **Quran.com / Ayah** (lecture), **Muslim Pro** (généraliste), **Elmohafez**, **Hafizi Quran**.

### Manques structurants

1. **Reconnaissance de récitation en temps réel.** C'est *le* produit de Tarteel : l'app écoute, suit le verset mot à mot et signale l'erreur à l'instant où elle est commise. Sans ça, il n'y a aucun différenciateur IA — et l'analyse Tajwid actuelle est une simulation (§2).
2. **Vue Mushaf page par page** (Madani, 604 pages). Absente : `mushaf` n'apparaît nulle part dans le code. C'est la vue par défaut de tous les concurrents et le repère mental des hafiz, qui mémorisent la position des mots sur la page. Les données sont pourtant là (`QuranData.ts` porte déjà un champ `page`).
3. **Masquage progressif du texte** (faire disparaître les mots peu à peu pour tester la mémoire). Technique de hifz centrale, présente chez Quran Companion et Elmohafez, absente ici.
4. **Audio hors ligne téléchargeable.** `expo-file-system` inutilisé, un seul `download` dans tout le code mobile. Or le public cible récite dans les transports et à la mosquée.
5. **Tafsir et traduction mot-à-mot réels.** Annoncés au README, `0` occurrence dans le code.
6. **Validation par un enseignant (sanad).** Les Halaqat existent, mais aucun parcours « l'enseignant écoute la récitation et valide le hizb ». C'est le cœur de l'apprentissage traditionnel et un axe payant évident.
7. **Paiement réel.** Ni RevenueCat, ni StoreKit, ni Play Billing (§S1).
8. **Widgets, Apple Watch, Wear OS.** Muslim Pro et Quran.com en ont ; c'est un moteur de rétention quotidienne.
9. **Accessibilité** (§D3) — pénalisant aux revues store et excluant une partie du public.

### Ce que Salifz a déjà et qu'aucun concurrent ne fait bien

Le **Khatam collaboratif en temps réel** — répartition des 60 hizb entre les membres, session de lecture live synchronisée, vérification croisée, suivi du nombre de khatam du groupe (`index.js:331-583`, `routes/khatam.js`). C'est réellement développé, c'est social, c'est saisonnier (Ramadan), et c'est un angle produit que ni Tarteel ni Quran Companion n'occupent.

**Recommandation stratégique :** viser Tarteel sur l'IA de récitation demande un ordre de grandeur d'effort supplémentaire pour un rattrapage. Le Khatam collaboratif + les Halaqat avec validation par l'enseignant sont déjà à 60 % faits, ne dépendent d'aucun modèle ML, et adressent un besoin communautaire que personne ne sert. C'est là qu'est la place.

---

## 7. Ordre de traitement conseillé

**Avant toute autre chose** — `git init` + premier commit. 48 000 lignes sans historique, et l'audit qui suit implique des suppressions.

**Étape 1 — Rendre le projet sûr (avant tout déploiement)**
S1 (paiement), S2+S3 (prise de contrôle de compte), S4+S5+S6 (sockets), S7 (secret de repli), S8 (rate limiting), S9 (CORS).

**Étape 2 — Aligner le discours et le produit**
Décider, pour chacune des 9 fonctionnalités simulées du §2 : on l'implémente, ou on la retire de l'interface et du README. Laisser une statistique inventée s'afficher comme la progression réelle d'un utilisateur est le risque de réputation le plus direct du projet.

**Étape 3 — Débloquer les stores**
S18 (retirer la biométrie), S13 (appliquer le contrôle parental), S19 (politique de confidentialité, suppression de compte, licence), `eas.json` + `projectId`.

**Étape 4 — Nettoyer**
Supprimer la v1, les zips, le venv, sortir les 29 Go d'audio. Câbler le ThemeContext ou le supprimer.

**Étape 5 — Produit**
Vue Mushaf, masquage progressif, audio hors ligne, puis validation par l'enseignant sur les Halaqat.

---

## Modèles d'IA entraînés mais jamais chargés (constaté le 17/08/2026)

`salifz-ai-model/` occupe **32,2 Go**, soit 98 % du projet sur le disque.
Correctement exclu de git (seuls 17 Mo de sources et de jeux de données y sont
suivis), donc sans effet sur le dépôt — mais le contenu mérite une décision.

Le dossier contient deux modèles entraînés :

- `models/tajwid/final/model.safetensors` — 0,4 Go
- `models/chatbot/final/model.safetensors` — 0,5 Go

**Aucun des deux n'est chargé par quoi que ce soit.** `api/app.py` ne contient
ni `from_pretrained`, ni import de `torch`, ni référence à un `.safetensors` :

- `POST /tajwid/analyze` appelle `analyze_tajwid_simple()`, dont la
  documentation indique explicitement « sans modèle ML ». C'est un annotateur
  de règles écrit à la main, qui prend **du texte** en entrée.
- `POST /chat` appelle `get_sally_response()`, une table de réponses.

Deux conséquences.

**La notation du tajwid depuis l'audio n'existe nulle part.** Le backend Node
envoie un enregistrement à `AI_SERVICE_URL` ; le service Python attend une
chaîne de caractères. Brancher `AI_SERVICE_URL` sur ce service ne rendrait donc
pas la fonctionnalité — cela livrerait une annotation de texte sous un nom qui
promet une analyse de récitation. La route Node a le bon comportement
aujourd'hui : elle déclare la fonctionnalité indisponible plutôt que d'inventer
une note.

**Les 30 Go restants sont un environnement virtuel Python** (`venv_hifz`,
essentiellement torch), utile aux scripts d'entraînement de `scripts/` mais
inutile à l'exécution. Rien n'a été supprimé.

Trois suites possibles, à trancher :

1. Écrire un service de reconnaissance de récitation qui prenne réellement
   l'audio — c'est un projet en soi, pas un branchement.
2. Assumer l'annotateur de texte comme fonctionnalité à part entière, sous un
   nom qui ne promet pas une analyse de la voix.
3. Archiver le sous-projet hors du dossier de travail et récupérer les 32 Go.
