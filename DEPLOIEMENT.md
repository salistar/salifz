# Où déployer Salifz

Relevé du 18 août 2026, en lecture seule, sur l'ensemble des serveurs
atteignables depuis cette machine. Les chiffres viennent des machines
elles-mêmes.

> **Ce document corrige une version précédente** qui ne portait que sur deux
> serveurs et recommandait de déployer un nouveau coturn. Il en existe déjà un,
> de production, avec son propre nom de domaine et un certificat valide —
> le déployer une seconde fois aurait été du travail perdu, et moins bien fait.

## Inventaire complet

Neuf clés SSH et `known_hosts` désignent six machines. Trois répondent.

| Adresse | Nom | Cœurs | RAM libre | Disque libre | Charge | Rôle actuel |
|---|---|---|---|---|---|---|
| `46.225.77.64` | salorie-sallysudo | **12** | 19 Go / 22 | **327 Go** / 451 | 0,10 | Salorie, Sudoku, Caddy |
| `88.198.90.182` | sallycourse-prod | 8 | 27 Go / 30 | 185 Go / 225 | 0,10 | SallyCourse, **Ollama** |
| `84.8.218.36` | turn-salistar | 1 | 5,0 Go / 5,9 | 37 Go / 45 | 0,00 | **coturn de production** |

Non atteignables : `88.198.205.229` et `91.99.70.43` (port 22 ouvert mais la
connexion expire — probablement filtrée par adresse source), et
`18.185.89.186` (aucune réponse). Si l'un des deux premiers est un serveur que
vous comptez utiliser, il faudra autoriser cette machine avant de le
comparer aux autres.

## Ce que Salifz consomme

Mesuré sur la pile locale complète, au repos :

| Conteneur | Mémoire |
|---|---|
| mongo | 178 Mo |
| minio | 131 Mo |
| web (nginx en production) | ~20 Mo |
| api | 65 Mo |
| redis | 9 Mo |
| coturn | 13 Mo |
| **Total** | **~420 Mo** |

La question n'est donc pas la capacité — les trois machines l'ont — mais le
voisinage et ce qui est déjà en place.

## Recommandation : répartir sur deux serveurs

Mettre tout au même endroit serait plus simple, mais ferait doublonner un
service déjà correctement installé ailleurs.

### 1. Backend, MongoDB, Redis, web, socket → `46.225.77.64` (srv3)

**Caddy y sert déjà 14 domaines** répartis en 19 blocs, dont
`api.salorie.com`, `app.salorie.com` et `db.sallysudo.com`. Ajouter Salifz
revient à écrire un bloc et laisser Caddy obtenir le certificat. Sur le
Hetzner, les ports 80 et 443 sont pris par SallyCourse sans qu'un proxy
partagé soit identifié : il faudrait d'abord décider comment les deux
applications se partagent l'entrée.

**Tous les ports nécessaires sont libres** : 8088 (API et WebSocket), 9000 et
9001 (MinIO), 27018 et 6380 si Mongo et Redis doivent être publiés — ce qui
n'est pas nécessaire, le réseau Docker suffit.

**Le disque suit la croissance.** Les récitations envoyées aux enseignants
s'accumulent dans MinIO : 327 Go libres contre 185 sur le Hetzner, sur une
machine qui a aussi plus de cœurs (12 contre 8).

**Ollama n'y tourne pas.** C'est le vrai facteur discriminant contre le
Hetzner. Sa charge est à 0,10 au moment du relevé, mais c'est la charge
*entre* deux inférences : quand un modèle se charge, la consommation mémoire
monte brutalement. Mongo et Redis n'aiment pas partager une machine avec un
voisin qui réclame plusieurs gigaoctets d'un coup.

**Outillage à jour** : Docker 29.5.3, Compose v5.1.4 — les fichiers
`docker-compose.yml` du dépôt s'y appliquent sans adaptation.

Chemin d'installation, par cohérence avec les applications déjà présentes :
`/home/deploy/apps/salifz-stack`.

### 2. TURN et STUN → `turn.salistar.com` (`84.8.218.36`), sans rien déployer

Ce serveur fait déjà exactement ce dont Salifz a besoin, et mieux que ce qu'un
nouveau déploiement donnerait :

| Point | turn.salistar.com | coturn conteneurisé de srv3 |
|---|---|---|
| Authentification | `use-auth-secret` (éphémère) | `use-auth-secret` |
| Ports de relais | **16 384** (49152–65535) | 21 (49160–49180) |
| TLS sur 5349 | Let's Encrypt, **vérification OK** | certificat auto-signé |
| Durcissement | `no-tcp-relay`, plages privées refusées | — |
| Nom de domaine | `turn.salistar.com` | aucun |
| Uptime | 15 semaines | — |
| Charge | 0,00 | — |

`use-auth-secret` est précisément le mode que `routes/rtc.js` attend : l'API
dérive un couple identifiant/mot de passe temporaire par HMAC. Il n'y a donc
rien à modifier côté application — seulement `TURN_HOST`, `TURN_STATIC_SECRET`
et le port TLS à renseigner.

Le nombre de ports de relais n'est pas un détail : chaque flux relayé en
consomme un. Vingt-et-un ports plafonnent les appels de groupe à une poignée
de participants simultanés sur toute l'instance, ce qui est précisément le
cas d'usage des halaqat.

Le refus des plages privées (`10.0.0.0/8`, `172.16.0.0/12`) empêche qu'un
client se serve du relais pour atteindre le réseau interne du serveur. Ce
durcissement manque au coturn de srv3.

**Ne pas y mettre le reste** : 1 cœur et 45 Go de disque. Cette machine est
dimensionnée pour relayer des paquets, pas pour héberger Mongo, l'API et le
web.

## La décision qui reste à prendre

`turn.salistar.com` sert aujourd'hui Salorie avec le realm `salistar.com`.
Deux façons d'y ajouter Salifz :

**a) Partager l'instance et son `static-auth-secret`.** Rien à installer ;
Salifz renseigne le même secret. Mais une fuite du secret côté Salorie
compromet le relais de Salifz, et inversement — et un relais TURN dont le
secret fuite devient un proxy ouvert facturé au propriétaire. Ce dépôt a déjà
connu une fuite de secret TURN, poussée en clair puis rotationnée.

**b) Ajouter une seconde instance coturn sur la même machine**, sur d'autres
ports (3479 et 5350), avec son propre secret et son propre realm. Le
certificat existant couvre déjà `turn.salistar.com`, donc rien à obtenir. Coût
réel : une quinzaine de mégaoctets et un service de plus à maintenir.

**Recommandation : (b).** La machine est à 0,00 de charge avec 5 Go de RAM
libres — la seconde instance ne coûte rien de mesurable, et cloisonner deux
applications distinctes vaut largement ce prix. L'option (a) reste
défendable si vous préférez un seul service à surveiller ; c'est un choix de
compromis, pas une erreur.

## Secrets à créer sur GitHub avant le premier déploiement

`.github/workflows/deploiement.yml` échoue à la connexion sans eux :

| Secret | Valeur |
|---|---|
| `DEPLOY_HOST` | `46.225.77.64` |
| `DEPLOY_USER` | un utilisateur **non-root** dédié |
| `DEPLOY_SSH_KEY` | clé privée sans phrase de passe |
| `DEPLOY_PATH` | `/home/deploy/apps/salifz-stack` |

Le relevé s'est fait en `root`, faute d'un compte dédié accessible. Le
déploiement automatisé ne devrait pas s'exécuter en `root` : une CI compromise
disposerait alors de la machine entière, avec Salorie et Sudoku dessus.

Variables d'environnement liées au TURN, à renseigner dans le `.env` du
serveur et non dans le dépôt :

```
TURN_HOST=turn.salistar.com
TURN_PORT=3479            # ou 3478 si vous retenez l'option (a)
TURN_TLS_PORT=5350        # ou 5349
TURN_STATIC_SECRET=...    # jamais versionné
```

## Ce que ce document ne dit pas

Aucun déploiement n'a été effectué. Les serveurs ont seulement été interrogés
en lecture — capacité, conteneurs, ports en écoute, configuration coturn,
règles de pare-feu — et testés par une requête STUN et une poignée de main
TLS. Rien n'a été installé, modifié ni arrêté sur aucune machine.
