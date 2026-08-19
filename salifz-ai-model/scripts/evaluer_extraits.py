# -*- coding: utf-8 -*-
"""
Évaluation du mode par extraits — Salifz.

Le mode « suivi en direct » découpe la récitation en extraits successifs. Ce
script reproduit ce découpage sur les récitations de référence : il tranche le
fichier en morceaux de quelques secondes et les envoie l'un après l'autre, en
transmettant la position atteinte.

Ce qu'il vérifie, et qui ne se voit pas autrement :

- le curseur **avance** d'un extrait à l'autre ;
- aucun extrait ne reproche les mots déjà récités — le piège que le paramètre
  `depuis` existe pour éviter ;
- ce que coûte réellement la couture entre deux extraits, en mots perdus.

    python scripts/evaluer_extraits.py --sourate 1 --verset 7

Le mode hors ligne est forcé : l'évaluation ne déclenche aucun téléchargement.
"""

import argparse
import io
import json
import os
import subprocess
import sys
import time

os.environ.setdefault("HF_HUB_OFFLINE", "1")

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RACINE)

from src.recitation.moteur import MoteurIndisponible, nom_du_modele  # noqa: E402
from src.recitation.reference import retirer_basmala  # noqa: E402
from src.recitation.suivi import suivre  # noqa: E402

TEXTES = os.path.join(RACINE, "data", "raw", "quran", "text", "quran_uthmani.json")
AUDIO = os.path.join(RACINE, "data", "raw", "quran", "audio")

# Doit rester aligné sur DUREE_EXTRAIT_MS de l'écran mobile.
DUREE_EXTRAIT = 6.0


def texte_attendu(sourate, verset):
    with io.open(TEXTES, encoding="utf-8") as fichier:
        sourates = json.load(fichier)
    for s in sourates:
        if s["number"] != sourate:
            continue
        for ayah in s["ayahs"]:
            if ayah["numberInSurah"] == verset:
                return retirer_basmala(ayah["text"], sourate, verset)
    return None


def decouper(chemin, duree):
    """Tranche le fichier en extraits, comme le ferait le téléphone.

    Chaque extrait est ré-encodé séparément : c'est bien ce que produit un
    enregistrement redémarré, et non une découpe d'un flux continu.
    """
    extraits = []
    debut = 0.0
    while True:
        sortie = subprocess.run(
            ["ffmpeg", "-hide_banner", "-loglevel", "error",
             "-ss", "%.3f" % debut, "-t", "%.3f" % duree, "-i", chemin,
             "-f", "mp4", "-c:a", "aac", "-movflags", "frag_keyframe+empty_moov",
             "pipe:1"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        )
        # Un extrait au-delà de la fin du fichier revient quasi vide : c'est le
        # signal d'arrêt, ffmpeg ne renvoyant pas d'erreur pour autant.
        if sortie.returncode != 0 or len(sortie.stdout) < 2000:
            break
        extraits.append(sortie.stdout)
        debut += duree
        if len(extraits) > 40:
            break
    return extraits


def principal():
    analyseur = argparse.ArgumentParser(description="Évalue le suivi par extraits")
    analyseur.add_argument("--recitateur", default="husary")
    analyseur.add_argument("--sourate", type=int, default=1)
    analyseur.add_argument("--verset", type=int, default=7)
    analyseur.add_argument("--duree", type=float, default=DUREE_EXTRAIT)
    options = analyseur.parse_args()

    attendu = texte_attendu(options.sourate, options.verset)
    if not attendu:
        print("Verset introuvable.")
        return 1

    chemin = os.path.join(
        AUDIO, options.recitateur,
        "surah_%03d" % options.sourate,
        "%03d%03d.mp3" % (options.sourate, options.verset),
    )
    if not os.path.exists(chemin):
        print("Audio introuvable : " + chemin)
        return 1

    mots_attendus = attendu.split()
    print("Modèle  : " + nom_du_modele())
    print("Verset  : %d:%d — %d mots" % (options.sourate, options.verset, len(mots_attendus)))
    print("Extraits: %.0f s" % options.duree)
    print("")

    extraits = decouper(chemin, options.duree)
    if not extraits:
        print("Le découpage n'a produit aucun extrait.")
        return 1

    position = 0
    acquis = {}
    reproches = 0
    debut_total = time.time()

    for numero, donnees in enumerate(extraits, start=1):
        dernier = numero == len(extraits)
        depart = time.time()
        try:
            resultat = suivre(attendu, donnees, partiel=not dernier, depuis=position)
        except MoteurIndisponible as erreur:
            print("Moteur indisponible : " + str(erreur))
            return 2
        ecoule = time.time() - depart

        # Le point vérifié : aucun extrait ne doit se prononcer sur un mot
        # situé avant sa position de départ.
        avant_position = [m for m in resultat["mots"] if m["index"] < depuis_sur(position)]
        reproches += len(avant_position)

        nouveaux = 0
        for mot in resultat["mots"]:
            if mot["etat"] in ("juste", "approximatif") and mot["index"] not in acquis:
                acquis[mot["index"]] = mot["etat"]
                nouveaux += 1

        print("extrait %d/%d  depuis %2d  →  position %2d  (+%d mots)  %.1fs  « %s »" % (
            numero, len(extraits), position, resultat["position"], nouveaux, ecoule,
            (resultat.get("transcription") or "")[:44]))

        position = max(position, resultat["position"])

    total = time.time() - debut_total
    couverts = len(acquis)

    print("")
    print("mots couverts par le suivi : %d / %d = %.1f%%" % (
        couverts, len(mots_attendus), 100.0 * couverts / len(mots_attendus)))
    print("mots jugés avant leur tour : %d  (doit valoir 0)" % reproches)
    print("temps total                : %.1fs" % total)

    manquants = [
        mots_attendus[i] for i in range(len(mots_attendus)) if i not in acquis
    ]
    if manquants:
        print("non couverts (coutures)    : " + " ".join(manquants))

    return 0 if reproches == 0 else 3


def depuis_sur(position):
    """Position de départ de l'extrait courant."""
    return position


if __name__ == "__main__":
    sys.exit(principal())
