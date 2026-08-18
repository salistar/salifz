# Salifz en production

Déployé le 18 août 2026. Ce document décrit ce qui tourne, où, et ce qui
reste à faire.

## Ce qui est en ligne

| Élément | Emplacement | Accès |
|---|---|---|
| API + socket | srv3 `46.225.77.64` | `:8088`, et `/api/v1` + `/socket.io` par la même origine que le web |
| Web | srv3 | `:8091` |
| MongoDB | srv3 | **non publié** — réseau Docker uniquement |
| Redis | srv3 | **non publié** |
| MinIO | srv3 | **non publié** |
| TURN/STUN dédié | srv3 | `:3479`, relais 41000-41099 |
| TURN/STUN (préparé) | `turn.salistar.com` `84.8.218.36` | `:3479` — **bloqué**, voir plus bas |

Chemin sur le serveur : `/home/deploy/apps/salifz-stack`.
Projet Docker : `salifz`, distinct de `salorie-stack` et `sudoku`.

## Ne rien casser : ce qui a été vérifié

La machine héberge Salorie, Sudoku, plusieurs sites et un Caddy qui sert 19
blocs. Avant et après chaque étape :

- les 17 conteneurs préexistants tournent toujours, avec les mêmes uptimes ;
- `salorie.com`, `api.salorie.com`, `sallysudo.com` et `salorie.salistar.com`
  répondent 200 ;
- le TURN de Salorie répond toujours en STUN sur 3478 ;
- le Caddyfile a été **validé avant rechargement** — un fichier invalide
  aurait coupé tous les sites d'un coup ;
- une sauvegarde horodatée du Caddyfile et du `turnserver.conf` d'Oracle est
  conservée dans `/root/`.

Deux pièges évités, tous deux silencieux.

**Compose fusionne les listes de ports au lieu de les remplacer.** Le
`docker-compose.prod.yml` publie le port 80 et pose `ports: []` sur Mongo et
Redis en croyant les fermer — cela ne ferme rien. Sans `!override` et `!reset`
dans la surcouche, la composition aurait publié 80, donc pris le port de Caddy
et coupé les quatorze domaines qu'il sert, et exposé MongoDB et Redis en clair
sur Internet.

**Le coturn conteneurisé tourne en `nobody`.** Son fichier de configuration,
écrit en `600 root`, lui était illisible. coturn rapporte cela comme
« fichier introuvable », démarre avec ses réglages par défaut — donc sur le
mauvais port et sans secret — et se déclare actif. Seul un test STUN depuis
l'extérieur le révèle. Le fichier appartient maintenant à l'uid `65534`.

## Chaîne ICE servie aux clients

```
1. stun:46.225.77.64:3479          Salifz, instance dédiée
2. stun:46.225.77.64:3478          Salorie sur srv3, repli
3. stun:turn.salistar.com:3478     Salorie sur Oracle, repli
4. stun:stun.l.google.com:19302    dernier recours
5. turn:46.225.77.64:3479          Salifz, identifiants éphémères
```

Les replis sont du **STUN**, pas du TURN : STUN ne demande aucune
authentification, on peut donc s'appuyer sur le serveur d'une autre
application sans partager son secret. Un secret TURN partagé entre deux
produits fait qu'une fuite d'un côté ouvre le relais de l'autre — et un relais
ouvert est facturé à son propriétaire.

## Ce qui reste à faire — deux actions hors de ma portée

### 1. Créer l'enregistrement DNS

```
salifz.salistar.com    A    46.225.77.64
```

Chez Cloudflare, laisser le nuage **gris** (DNS only), comme `db.salorie.com` :
sinon Caddy ne peut pas obtenir son certificat Let's Encrypt.

Le bloc Caddy est déjà écrit et validé. Dès que le DNS résout, Caddy obtient le
certificat seul et `https://salifz.salistar.com` répond. En attendant, l'accès
direct par `:8091` fonctionne.

Ensuite, remplacer dans `.env` :
`CORS_ORIGINS=https://salifz.salistar.com` — en retirant l'adresse IP.

### 2. Ouvrir les ports sur Oracle Cloud

L'instance TURN dédiée est **installée et démarrée** sur `84.8.218.36`
(service systemd `coturn-salifz`, ports 3479/5350, relais 32768-40959, secret
propre, realm `salifz.salistar.com`). Elle répond en local mais pas depuis
Internet : `ufw` et `iptables` de la machine l'autorisent, c'est la **Security
List du VCN Oracle** qui bloque — un pare-feu réseau hors de portée de SSH.

À ajouter dans la console OCI, en règles d'entrée :

| Protocole | Ports |
|---|---|
| UDP | 3479 |
| TCP | 3479 |
| TCP et UDP | 5350 |
| UDP | 32768-40959 |

Tant que ce n'est pas fait, le TURN de srv3 assure le service — c'est lui qui
est en tête de la chaîne ICE.

## Secrets GitHub pour le déploiement automatisé

`.github/workflows/deploiement.yml` attend `DEPLOY_HOST`, `DEPLOY_USER`,
`DEPLOY_SSH_KEY` et `DEPLOY_PATH`.

Je ne les ai **pas** renseignés, délibérément. Déposer une clé SSH dans les
secrets GitHub donne à toute exécution du workflow un accès shell à une machine
qui héberge trois autres projets ; et comme le déploiement passe par Docker,
l'utilisateur doit appartenir au groupe `docker`, ce qui équivaut à root. C'est
une décision de sécurité qui vous revient, pas un détail de configuration.

Si vous la prenez, la façon la moins risquée est une clé dédiée à ce seul
dépôt, sans phrase de passe, autorisée pour un utilisateur unique, et révocable
indépendamment de vos autres clés.

## Sauvegardes prises avant modification

```
84.8.218.36   /root/sauvegardes-avant-salifz/turnserver.conf.<horodatage>
              /root/sauvegardes-avant-salifz/ufw-user.rules.<horodatage>
46.225.77.64  /root/Caddyfile.avant-salifz.<horodatage>
```

## Commandes utiles

Mettre à jour la production depuis le dépôt :

```bash
cd /home/deploy/apps/salifz-stack && git pull && docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.srv3.yml -p salifz up -d --build
```

Revenir en arrière sur le Caddyfile :

```bash
cp /root/Caddyfile.avant-salifz.<horodatage> /home/deploy/caddy/Caddyfile && docker exec caddy caddy reload --config /etc/caddy/Caddyfile
```
