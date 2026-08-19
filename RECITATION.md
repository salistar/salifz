# Suivi de récitation — Salifz

> L'utilisateur récite un verset, le serveur transcrit et compare : chaque mot
> ressort **juste**, **approximatif**, **erroné** ou **oublié**.

Le §6 de l'audit désignait la reconnaissance de récitation comme le seul
manque véritablement structurant face à Tarteel. Ce document décrit ce qui a
été construit, ce qui a été **mesuré**, et ce que le système ne sait pas faire.

---

## 1. Ce que ce n'est pas

**Ce n'est pas une analyse du tajwid.** Le système constate quels mots ont été
prononcés ; il ne juge pas la manière de les prononcer. La distinction n'est
pas une précaution de langage : l'ancienne route `/tajwid/analyze` renvoyait
`75 + Math.random() * 20`, et afficher une exactitude de mots sous le nom de
tajwid reproduirait la même tromperie sous une forme plus crédible.

Les deux vivent séparément et le restent :

| Route | Question | État |
|---|---|---|
| `/api/v1/tajwid/analyze` | Comment les mots sont-ils prononcés ? | Aucun moteur — répond 503 |
| `/api/v1/recitation-live/suivre` | Quels mots ont été prononcés ? | **Opérationnel** |

Le champ `recitationScores` du schéma de progression est lui aussi distinct de
`tajwidScores`, pour la même raison.

---

## 2. Ce qui a été mesuré

### Reconnaissance sur audio réel

Chaîne complète — décodage, transcription, alignement — sur les récitations
d'al-Husary livrées dans `data/raw/quran/audio/`, dont le texte attendu est
connu.

    python scripts/evaluer_recitation.py --recitateur husary --sourates 1 112 113 114 --limite 22

Trois configurations, même échantillon (22 versets, 155 s d'audio), même
machine (portable 8 cœurs, 4 fils) :

| Modèle | Mots justes | Vitesse | Taille | Confiance |
|---|---|---|---|---|
| `Systran/faster-whisper-small` (int8) | 77 / 87 = 88,5 % | 1,72× | 464 Mo | 0,42 – 0,76 |
| `tarteel-ai/whisper-base-ar-quran` (transformers) | 87 / 87 = **100 %** | 2,54× | 277 Mo | 1,0 partout |
| **le même, converti en CTranslate2** | 87 / 87 = **100 %** | **0,80×** | **76 Mo** | 0,97 – 0,998 |

Le modèle affiné sur la récitation coranique ne se trompe sur **aucun** mot,
alors qu'il est plus petit que le généraliste. L'écart ne tient pas à la taille
mais à l'entraînement : il a appris ce texte-là.

**La conversion change la nature du produit.** À 0,80×, la transcription va
plus vite que l'audio lui-même : une minute de récitation se traite en
48 secondes. Le suivi en quasi-direct — extraits successifs, surlignage qui
avance avec quelques secondes de retard — redevient possible, alors qu'il ne
l'était pas à 1,72×. `scripts/convertir_modele_ct2.py` produit ce modèle ;
`docker/Dockerfile.recitation` le fabrique à la construction de l'image, de
sorte que torch n'entre jamais dans l'image finale.

**Une réserve demeure : la confiance de ce modèle ne mesure rien
d'exploitable.** Entre 0,97 et 0,998 sur les versets justes, et **0,893 sur une
sinusoïde de 440 Hz** — où il invente `وَالْمُؤْمِنِينَ`. Le seuil de fiabilité
ne se déclencherait donc jamais. Ce qui protège réellement de l'invention est
le test d'énergie de `audio.est_silencieux()`, vérifié sur un fichier muet :
silence reconnu, aucun texte produit.

### En production, sur srv3

Le serveur va nettement plus vite que la machine de mesure : douze cœurs au
lieu de huit, et Linux plutôt que Docker Desktop.

| Verset | Audio | Réponse complète | Facteur | Mots |
|---|---|---|---|---|
| 1:7 | 14,9 s | 2,05 s | **0,14×** | 9 / 9 |
| 112:4 | 8,1 s | 1,31 s | 0,16× | 5 / 5 |
| 114:5 | 10,5 s | 1,82 s | 0,17× | 5 / 5 |

Ces durées sont mesurées **de bout en bout depuis un poste distant** : elles
incluent le trajet réseau, Caddy, le backend Node et le service Python. Six
fois plus rapide que l'audio lui-même laisse toute la marge nécessaire au
suivi par extraits.

### Les deux modes de l'écran

**Bilan complet** — un seul enregistrement du début à la fin, puis le verdict
avec les fautes. Le mode de référence.

**Suivi en direct** — des extraits de six secondes envoyés au fil de la
récitation, le surlignage avance à mesure. Mesuré sur al-Fatiha 1:7 découpée
comme le ferait le téléphone :

    extrait 1/3  depuis 0  →  position 6  (+6 mots)
    extrait 2/3  depuis 6  →  position 9  (+3 mots)
    extrait 3/3  depuis 9  →  position 9  (+0 mots)

    mots couverts              : 9 / 9 = 100 %
    mots jugés avant leur tour : 0

    python scripts/evaluer_extraits.py --sourate 1 --verset 7

**Le mode suivi n'affiche jamais de faute, et c'est délibéré.** Couper puis
relancer l'enregistrement laisse un trou de quelques centaines de
millisecondes, qui peut hacher un mot — la transcription du deuxième extrait
ci-dessus commence par un `وَبِ` parasite et finit sur un mot tronqué. Seuls
les mots **reconnus** avancent le curseur ; un mot haché par une couture reste
simplement en attente, et l'extrait suivant le rattrape. Le jugement appartient
au mode bilan, qui tient l'enregistrement entier.

### Normalisation de l'arabe

`quran_uthmani.json` et `quran_simple.json` portent le même texte dans deux
orthographes — la meilleure approximation disponible de l'écart entre le texte
de référence et ce qu'un moteur de reconnaissance rendra. 74 917 mots
comparables.

| Règle ajoutée | Concordance |
|---|---|
| Alif neutralisé (règles minimales) | 97,1 % |
| + hamza ramené à l'alif | 98,7 % |
| + lettres redoublées fondues | 99,2 % |
| + waw long de `ٱلصَّلَوٰة` | 99,4 % |
| + alif maqsura médian | **99,5 %** |

Aucune de ces règles n'a été devinée. Deux d'entre elles paraissaient
évidentes et se sont révélées fausses à la mesure : ramener l'alif maqsura
final à l'alif **dégrade** de 4 points, et neutraliser tous les alifs faisait
passer `لله` pour `الله`.

Contrepartie mesurée : sur 14 820 formes distinctes, les règles minimales en
fondent déjà 1 703 ; les trois dernières en ajoutent 339. Le compromis est
assumé dans ce sens — signaler une faute à quelqu'un qui a bien récité coûte
plus cher que de laisser passer une quasi-homographie qu'un moteur de
reconnaissance ne distinguerait pas davantage.

Le test `tests/test_corpus.py` fige ce niveau.

---

## 3. Les pièges rencontrés

### Dans la reconnaissance

**La basmala.** Les jeux de données préfixent le verset 1 de chaque sourate par
`بسم الله الرحمن الرحيم` — sauf la 1re, où elle *est* le verset, et la 9e, qui
n'en a pas. Mais le récitant la dit ou ne la dit pas. Non traitée, elle
affichait quatre mots oubliés à chaque premier verset : **8 des 12 fautes de la
première mesure, toutes fausses**. La corriger a fait passer le taux de 65,7 %
à 88,5 %. Elle est retirée du texte attendu ; prononcée, elle ressort en mots
ajoutés, qui ne pénalisent rien.

**Le silence.** Sur un signal muet, Whisper ne rend pas une chaîne vide : il
produit une phrase plausible, souvent une formule pieuse — la plus entendue à
l'entraînement. Sans le test d'énergie de `audio.est_silencieux()`, un micro
coupé afficherait une récitation juste.

**Le point de départ.** En mode par extraits, le deuxième extrait ne contient
que la suite du verset. L'aligner sur le texte entier ferait passer tout le
début pour oublié — le récitant verrait rougir des mots qu'il vient de dire
correctement. D'où le paramètre `depuis`.

### À la mise en production

Les deux se ressemblent : quelque chose existait sur la machine de
développement sans exister ailleurs, et rien ne le signalait avant srv3.

**`quran_uthmani.json` n'était pas dans le dépôt.** La règle qui écarte les
29 Go d'audio l'emportait aussi. Le fichier vivait donc sur un seul disque au
monde, et la construction de l'image échouait sur srv3 en réussissant en
local. Ce n'est pas un jeu de données d'entraînement mais un actif du service :
c'est lui qui définit le verset attendu. Il est versionné, 2,8 Mo.

**`huggingface_hub` 1.0 a retiré `requests`.** faster-whisper 1.0.3 l'importe
encore ; sans plafond, pip installait le hub 1.x et l'import échouait. Le
service se rabattait alors sur transformers et annonçait « No module named
'torch' » — un message qui désigne le mauvais coupable et envoie chercher au
mauvais endroit.

L'asymétrie a livré la cause : l'étape de conversion fonctionnait, parce que
`transformers` y tire `requests` avec lui. Seule l'image finale, qui n'a ni
torch ni transformers, en manquait.

**La leçon vaut plus que le correctif** : `_backend_retenu()` avalait
l'exception d'import du moteur préféré. Un repli silencieux transforme une
cause précise en symptôme trompeur. Elle est désormais conservée, jointe au
message d'erreur et exposée par `/recitation/etat` — et le filet attrape
`Exception`, pas seulement `ImportError`, une bibliothèque native mal appariée
levant tout autre chose.

---

## 4. Ce que le système ne sait pas faire

- **Distinguer `قال` de `قل`.** La neutralisation de l'alif long les confond.
  C'est délibéré : un Whisper généraliste ne transcrit pas la durée vocalique
  de façon fiable, et signaler cette faute annoncerait une précision que le
  moteur n'a pas.
- **Suivre mot à mot, à l'instant où le mot est dit.** Le suivi avance par
  extraits de six secondes, donc avec ce retard-là. C'est un surlignage qui
  rattrape le récitant, pas qui le suit syllabe à syllabe comme Tarteel.
- **Signaler une faute pendant la récitation.** Le mode suivi ne montre que ce
  qu'il a reconnu : les coutures entre extraits hachent parfois un mot, et une
  faute affichée à tort pendant qu'on récite est plus coûteuse qu'un verdict
  qui attend la fin.
- **Noter le tajwid.** Voir le §1.
- **Se fier à la confiance du modèle affiné.** Voir plus haut : 0,893 sur une
  sinusoïde. Avec ce modèle, le garde-fou repose entièrement sur le test
  d'énergie.

Quand le moteur doute de lui-même (confiance sous 0,30), le résultat est rendu
avec `fiable: false` et l'écran n'affiche **aucun mot en faute** : « je n'ai
pas bien entendu » et « tu t'es trompé » ne doivent pas se confondre.

Le seuil de 0,30 est mesuré, pas choisi : avec `faster-whisper-small`, les
récitations justes d'al-Husary ressortent entre 0,42 et 0,76. La psalmodie —
voyelles tenues, débit lent, mélodie — fait toujours descendre le score d'un
modèle entraîné sur de la parole ordinaire. Le seuil initial de 0,45 aurait
déclaré douteuse la moitié des récitations correctes.

**Ce seuil ne veut rien dire pour le modèle coranique, qui est désormais celui
de l'image.** Ses scores sont écrasés entre 0,97 et 0,998, y compris sur du
bruit : `fiable` y vaut toujours vrai, et le message « je n'ai pas bien
entendu » ne s'affichera jamais. Seul le test d'énergie protège.

Le rendre dépendant du modèle est la correction qui s'impose. Elle demande
d'abord de mesurer ce que ce modèle rend sur de la récitation réellement
hésitante — un enregistrement de débutant, pas une sinusoïde — faute de quoi on
remplacerait un seuil inopérant par un seuil inventé.

---

## 5. Architecture

```
mobile  RecitationLiveScreen ──┐
                               │  multipart : audio + sourate + verset
                               ▼
node    /api/v1/recitation-live/suivre     routes/recitationLive.js
                               │            · 503 honnête sans AI_SERVICE_URL
                               │            · conserve le verdict final seul
                               ▼
python  /recitation/suivre                 salifz-ai-model/api/app.py
                               │
                   ┌───────────┴───────────┐
                   ▼                       ▼
            moteur.py                 alignement.py
            décode (ffmpeg)           Needleman-Wunsch
            transcrit (Whisper)       normalisation.py
```

Le texte attendu vient **du serveur**, jamais du téléphone : c'est lui qui
définit ce qui est juste.

### Deux moteurs d'inférence

`BACKEND_RECITATION` vaut `auto` (défaut), `faster-whisper` ou `transformers`.

- **faster-whisper** — CTranslate2, int8. Le défaut, et le seul utilisé en
  production : aucune dépendance à torch, image sous 400 Mo au lieu de 3 Go.
- **transformers** — utile pour essayer un Whisper affiné publié au format
  PyTorch sans le convertir d'abord. Demande d'ajouter torch et transformers à
  `requirements-recitation.txt`, et coûte trois fois la vitesse. À réserver à
  l'expérimentation.

### Convertir un modèle affiné

    python scripts/convertir_modele_ct2.py --telecharger

Deux obstacles y sont traités, et se reposeront pour tout point de contrôle
publié avant 2023 :

1. `ctranslate2` 4.8 passe `dtype=` à `from_pretrained` ; `transformers` 4.43
   ne connaît que `torch_dtype`. Le script redéfinit `load_model` pour traduire
   l'argument, plutôt que de contraindre les versions — les figer casserait le
   reste du projet.
2. Le dépôt Tarteel n'a pas de `tokenizer.json` : il porte `vocab.json`,
   `merges.txt` et `added_tokens.json`. Sans ce fichier, faster-whisper retombe
   **silencieusement** sur le vocabulaire de `whisper-tiny` — celui d'un autre
   modèle. Le script le fabrique depuis le tokenizer rapide et vérifie ensuite
   que le modèle se recharge (50 364 jetons) et transcrit correctement.

---

## 6. Mise en service

Le service est déclaré dans `docker-compose.yml` sous le nom `recitation`.
Aucun port publié : seule l'API Node le joint, par le réseau interne.

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.srv3.yml --project-name salifz up -d recitation
```

L'image se construit en deux temps : une étape jetable installe torch et
convertit le modèle coranique, l'étape finale n'en garde que 76 Mo de poids.
Compter un rapatriement d'environ 500 Mo à la construction — torch et le
modèle — et rien à l'exécution. `--target leger` produit l'image sans modèle
embarqué, pour une machine sans accès à HuggingFace au moment du build.

Points d'attention :

- **`.dockerignore` est indispensable.** Sans lui, le contexte de construction
  fait 33 Go — Docker les transmet au démon avant de lire la première
  instruction, et la construction paraît figée sans message.
- **Le modèle embarqué vit hors de `/modeles`**, qui est un point de montage :
  un volume monté par-dessus le masquerait, et le service repartirait chercher
  des poids sur le réseau alors qu'il en a sous la main. Le volume
  `recitation-modeles` ne sert qu'aux modèles rapatriés à l'exécution.
- **`.dockerignore` exclut `scripts/` sauf la conversion**, dont la première
  étape de construction a besoin. L'exclure entièrement ferait échouer le build
  sur un « fichier introuvable » sans rapport apparent avec la cause.
- **`ffmpeg` doit être dans l'image.** Sans lui le service démarre et rejette
  chaque extrait. `/recitation/etat` le vérifie et le signale.
- **La sonde de santé n'appelle pas `?charger=1`.** Forcer le chargement du
  modèle ferait échouer chaque vérification pendant le premier téléchargement,
  et Docker déclarerait mort un conteneur qui s'installe.

Variables :

| Variable | Défaut | Rôle |
|---|---|---|
| `AI_SERVICE_URL` | `http://recitation:8000` | Côté Node. Vide → 503 explicite |
| `BACKEND_RECITATION` | `auto` | Moteur d'inférence |
| `MODELE_RECITATION` | `/opt/salifz/modele` | Modèle. Vide, l'image embarquée s'applique |
| `RECITATION_FILS` | `4` | Fils laissés au modèle |

---

## 7. Tests

    python tests/test_alignement.py     # 11 — mot sauté, déformé, ajouté, récitation en cours
    python tests/test_suivi.py          #  8 — silence, doute, point de départ
    python tests/test_reference.py      #  7 — basmala, sur le corpus réel
    python tests/test_corpus.py         #  1 — les 6 236 versets, seuil à 99,4 %

Ces tests ne chargent aucun modèle. Ils couvrent la partie qui peut être fausse
**silencieusement** : un moteur qui tombe se voit tout de suite, un alignement
décalé d'un mot affiche une faute là où le récitant n'en a pas commis, et se
tait.
