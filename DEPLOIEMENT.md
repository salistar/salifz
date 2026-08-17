# Où déployer Salifz

Relevé fait le 17 août 2026, en lecture seule, sur les deux serveurs déjà en
service. Les chiffres viennent des machines, pas d'une estimation.

## Ce que Salifz consomme réellement

Mesuré sur la pile locale complète (six conteneurs) au repos :

| Conteneur | Mémoire |
|---|---|
| mongo | 178 Mo |
| minio | 131 Mo |
| web (serveur Vite de développement) | 128 Mo |
| api | 65 Mo |
| coturn | 13 Mo |
| redis | 9 Mo |
| **Total** | **~520 Mo** |

En production le web passe par nginx au lieu du serveur de développement, ce
qui ramène l'ensemble sous 400 Mo au repos. Salifz est une petite charge : la
question n'est pas la capacité, mais le voisinage.

## Les deux candidats

| | Hetzner `88.198.90.182` | srv3 `46.225.77.64` |
|---|---|---|
| Projet hébergé | SallyCourse | Salorie, Sudoku, Salorie-landing |
| Cœurs | 8 | 12 |
| RAM | 30 Go (27 libres) | 22 Go (19 libres) |
| Disque libre | 185 Go | 333 Go |
| Charge (1 min) | 0,26 | 0,09 |
| Uptime | 21 jours | 70 jours |
| Conteneurs | 6 | 12 |
| Reverse proxy | — | Caddy, déjà en place |
| coturn | absent | **présent et fonctionnel** |

## Recommandation : srv3 (`46.225.77.64`)

Quatre raisons, par ordre d'importance.

**1. TURN y fonctionne déjà, vérifié.** C'est la pièce la plus difficile de
Salifz : sans relais TURN joignable, les appels de groupe échouent dès qu'un
participant est derrière un NAT symétrique. Une requête STUN Binding envoyée
depuis l'extérieur vers `46.225.77.64:3478/udp` reçoit une réponse — le relais
répond réellement. Ce point méritait d'être testé plutôt que supposé : `ufw`
n'a **aucune** règle UDP sur cette machine, et on pouvait croire le port
fermé. Docker insère ses propres règles iptables en amont d'ufw, ce qui laisse
passer les ports publiés. Sur Hetzner, tout serait à monter et à prouver.

**2. Caddy y sert déjà de reverse proxy.** Ajouter Salifz revient à écrire un
bloc de configuration et à laisser Caddy obtenir le certificat. Sur Hetzner,
les ports 80 et 443 sont pris par SallyCourse sans qu'un proxy partagé soit
identifié : il faudrait d'abord décider comment les deux applications se
partagent l'entrée.

**3. Ollama tourne sur Hetzner.** C'est le vrai facteur discriminant. La
charge y est à 0,26 au moment du relevé, mais c'est la charge *entre* deux
inférences : quand un modèle se charge, la consommation mémoire monte
brutalement. Mongo et Redis n'aiment pas partager une machine avec un voisin
qui réclame plusieurs gigaoctets d'un coup. srv3 n'a pas ce profil.

**4. Le disque suit la croissance.** Salifz stocke les récitations envoyées
aux enseignants dans MinIO : ce volume ne fait que croître. 333 Go libres
contre 185 Go, sur une machine qui a aussi plus de cœurs.

## Ce qu'il reste à trancher avant de déployer

**Le port 3478 est déjà pris par le coturn de Salorie.** Deux options :

- *Réutiliser* le coturn existant, avec un `realm` distinct pour Salifz.
  Économe, mais les deux applications partagent alors le même
  `static-auth-secret` : une fuite côté Salorie compromet le relais de Salifz,
  et inversement.
- *Déployer un second coturn* sur d'autres ports (par exemple 3479 / 5350).
  Une centaine de mégaoctets de plus et deux services à maintenir, mais les
  secrets restent séparés.

Recommandation : le second coturn. Un relais TURN dont le secret fuite devient
un proxy ouvert facturé au propriétaire, et cloisonner deux applications
distinctes vaut les 13 Mo que coûte le conteneur.

**Les autres ports sont libres** sur srv3 : 8088 (api), 9000 et 9001 (MinIO),
5349 (TURN sur TLS). Mongo et Redis restent internes au réseau Docker et n'ont
pas besoin d'être publiés.

**Convention de chemin.** Les applications suivent déjà
`/home/deploy/apps/<nom>` sur cette machine. Salifz s'installe donc dans
`/home/deploy/apps/salifz-stack`, ce qui correspond au `DEPLOY_PATH` attendu
par `.github/workflows/deploiement.yml`.

## Secrets à créer sur GitHub avant le premier déploiement

Le workflow échoue à la connexion sans eux :

| Secret | Valeur |
|---|---|
| `DEPLOY_HOST` | `46.225.77.64` |
| `DEPLOY_USER` | un utilisateur non-root dédié |
| `DEPLOY_SSH_KEY` | clé privée sans phrase de passe |
| `DEPLOY_PATH` | `/home/deploy/apps/salifz-stack` |

Le relevé s'est fait en `root` faute d'un compte dédié accessible. Le
déploiement automatisé ne devrait pas s'exécuter en `root` : une CI compromise
disposerait alors de la machine entière, avec Salorie et Sudoku dessus.

## Ce que ce document ne dit pas

Aucun déploiement n'a été effectué. Les serveurs ont seulement été interrogés
en lecture (capacité, conteneurs, ports, pare-feu) et testés par une requête
STUN. Rien n'a été installé, modifié ni arrêté sur l'une ou l'autre machine.
