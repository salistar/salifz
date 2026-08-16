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
| `salifz-coturn` | STUN et TURN pour les appels audio/vidéo | 3478 / 5349 (TLS) |
| `salifz-minio` | Stockage objet compatible S3 (récitations) | 9000 / 9001 |
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

## Passer en production

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

La surcouche de production corrige ce qui ne doit pas sortir du poste de
développement :

| Point | Développement | Production |
|---|---|---|
| Code de l'API | monté depuis l'hôte | figé dans l'image |
| Application web | serveur Vite | build statique derrière nginx, port 80 |
| Mongo, Redis, MinIO | ports publiés sur l'hôte | fermés, réseau interne seulement |
| `NODE_ENV` | development | production |

**Ce qui reste à votre charge :**

- **Certificat TURN réel.** Le certificat monté est auto-signé : suffisant en
  HTTP local, refusé par un navigateur sur une page HTTPS. Remplacer
  `infra/coturn/certs/turn.crt` et `turn.key` par un certificat Let's Encrypt.
- **Stockage objet distant.** MinIO tourne ici dans la pile ; en production,
  pointer `S3_ENDPOINT`, `S3_BUCKET` et les clés vers S3, R2 ou GCS. Le code
  ne change pas — c'est le même protocole.
- **`CORS_ORIGINS`** doit lister vos domaines réels : le serveur refuse de
  démarrer en production sans cette variable.
- **Secrets.** Ceux de `.env` sont générés localement. En production, les
  fournir par le gestionnaire de secrets de la plateforme, jamais par un
  fichier versionné.

## Sécurité des appels et du stockage

**Identifiants TURN éphémères.** coturn est configuré en `use-auth-secret` :
l'API dérive un couple identifiant/mot de passe valable 12 heures à partir de
`TURN_STATIC_SECRET`, par utilisateur. Un identifiant qui fuite cesse de
fonctionner de lui-même — contrairement à un mot de passe fixe compilé dans
l'application, qui est de fait public et transforme le relais en proxy gratuit.

Vérification :

```bash
curl -s localhost:8088/api/v1/rtc/ice-servers -H "Authorization: Bearer <jeton>"
# → "mode": "ephemeral", username "1786961955:<userId>", expire dans 12 h
```

**Le secret TURN n'est pas versionné.** `static-auth-secret` n'apparaît pas
dans `infra/coturn/turnserver.conf`, qui est suivi par git : il est passé au
démarrage par docker-compose depuis `.env`. Un secret dans un fichier suivi
est un secret public, et un relais TURN dont le secret fuite devient un proxy
gratuit pour n'importe qui. Les certificats sont eux aussi générés localement
et exclus du dépôt.

**Clé privée TURN.** Une clé lisible par tous n'est plus une clé. coturn
tourne en `nobody` : un conteneur d'initialisation recopie les certificats
dans un volume avec `chown nobody:nogroup` et `chmod 640`, plutôt que d'ouvrir
la clé ou de faire tourner coturn en root.

**URL de récitation signées.** Les enregistrements ne sont pas publics : l'API
génère une URL signée à durée limitée à chaque lecture. Une URL dont la
signature est altérée reçoit un `403`. C'est aussi la raison pour laquelle
`storageKey` est enregistré en base à côté d'`audioUrl` : c'est la clé qui
identifie le fichier de façon durable, l'URL n'étant qu'un laissez-passer
temporaire.

## Appels de groupe

Topologie en **maillage** : chaque participant est connecté à chaque autre.
C'est le bon choix pour une halaqa de quelques personnes — aucune
infrastructure de mélange à opérer. Au-delà d'environ six participants, le
débit montant devient limitant et il faut une SFU (mediasoup, LiveKit).
L'interface prévient l'utilisateur à ce seuil plutôt que de le laisser
découvrir la dégradation en séance.
