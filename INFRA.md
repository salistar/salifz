# Infrastructure Salifz

Une seule commande démarre tout ce dont l'application a besoin, en local, sans
compte chez un fournisseur :

```bash
docker compose up -d
```

| Service | Rôle | Port |
|---|---|---|
| `salifz-mongo` | Base de données persistante | 27017 |
| `salifz-redis` | Cache, OTP, adaptateur Socket.IO multi-instance | 6379 |
| `salifz-coturn` | STUN et TURN pour les appels audio/vidéo | 3478 |
| `salifz-api` | Backend + serveur WebSocket | 8088 |
| `salifz-web` | Application web | 5173 |

## Ce que la pile change

**MongoDB remplace la base en mémoire.** Les comptes, la progression et les
récitations survivent maintenant aux redémarrages. Le serveur de développement
autonome (`npm run dev:standalone`) reste utile quand Docker n'est pas
disponible, mais ses données disparaissent à l'arrêt.

**Redis active le temps réel multi-instance.** Sans lui, deux utilisateurs
servis par deux instances du serveur ne se voyaient pas : présence, messages et
sessions de khatam vivaient dans la mémoire d'un seul processus. Le démarrage
affiche `Socket.IO : adaptateur Redis actif`.

**coturn rend les appels fiables.** STUN suffit à la majorité des connexions ;
TURN relaie le flux quand le direct échoue — NAT symétrique, réseau
d'entreprise, certains opérateurs mobiles. Sans TURN, une partie des appels
échoue sans message d'erreur.

## Premier démarrage

```bash
# 1. Générer les secrets (le serveur refuse de démarrer sans)
cp .env.example .env
node -e "['JWT_SECRET','JWT_REFRESH_SECRET','JWT_RESET_SECRET'].forEach(k=>console.log(k+'='+require('crypto').randomBytes(48).toString('base64url')))"

# 2. Démarrer
docker compose up -d --build

# 3. Créer le compte de démonstration
docker exec salifz-api node scripts/seed-test-user.js
#    → test@salifz.com / Salifz2026
```

Application web : <http://localhost:5173>
API : <http://localhost:8088/api/v1/health>

## Brancher l'application mobile

En USB, les ports de l'hôte sont exposés au téléphone :

```bash
adb reverse tcp:8088 tcp:8088 && adb reverse tcp:8081 tcp:8081
cd mobilev2 && npx expo start --localhost
```

Le mobile et le web parlent au **même** backend : un compte créé sur l'un
fonctionne sur l'autre, un message envoyé depuis le navigateur arrive sur le
téléphone.

Pour tester depuis un téléphone en Wi-Fi plutôt qu'en USB, renseigner l'IP de
la machine dans `.env` :

```
RTC_PUBLIC_HOST=192.168.x.x
CORS_ORIGINS=http://192.168.x.x:5173,http://localhost:5173
```

`RTC_PUBLIC_HOST` compte : les URL STUN/TURN sont consommées par le navigateur
ou le téléphone, pas par le conteneur. Un nom interne à Docker comme
`host.docker.internal` ne résout pas de leur côté, et les candidats TURN
échouent alors en silence. Sans cette variable, le serveur déduit l'hôte de
l'en-tête de la requête — ce qui suffit en local.

## À changer avant la production

- **coturn** : identifiants fixes en développement. Passer à
  `use-auth-secret` avec `TURN_STATIC_SECRET` — la route `/rtc/ice-servers`
  génère déjà des identifiants éphémères quand cette variable est présente.
  Un mot de passe TURN fixe distribué à tous les clients finit toujours par fuiter.
- **coturn TLS** : sans certificat, un navigateur sur une page HTTPS refusera
  le TURN. Renseigner `cert` et `pkey` dans `infra/coturn/turnserver.conf`.
- **Enregistrements de récitation** : stockés sur un volume local. Le disque
  d'une instance est éphémère — les basculer vers un stockage objet (S3, GCS).
- **`web`** : l'image lance le serveur de développement Vite. Pour la
  production, construire (`npm run build`) et servir `dist` derrière nginx.
- **Montage du code** : `./backendv2:/app` est pratique en développement mais
  n'a pas sa place dans une image de production, qui doit être figée.

## Appels de groupe

Topologie en **maillage** : chaque participant est connecté à chaque autre.
C'est le bon choix pour une halaqa de quelques personnes — aucune
infrastructure de mélange à opérer. Au-delà d'environ six participants, le
débit montant devient limitant et il faut une SFU (mediasoup, LiveKit).
L'interface prévient l'utilisateur à ce seuil plutôt que de le laisser
découvrir la dégradation en séance.
