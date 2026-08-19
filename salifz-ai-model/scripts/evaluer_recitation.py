# -*- coding: utf-8 -*-
"""
Évaluation du suivi de récitation sur de l'audio réel — Salifz.

Fait tourner la chaîne complète (décodage, transcription, alignement) sur les
récitations de `data/raw/quran/audio/`, dont le texte attendu est connu. C'est
la seule mesure qui dise ce que l'utilisateur verra : les tests unitaires
valident l'alignement, pas la qualité de la transcription.

    python scripts/evaluer_recitation.py --recitateur husary --sourates 112 114 --limite 8

Le mode hors ligne est forcé : l'évaluation ne doit jamais déclencher un
téléchargement de modèle à l'insu de celui qui la lance.
"""

import argparse
import io
import json
import os
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


def charger_versets():
    with io.open(TEXTES, encoding="utf-8") as fichier:
        sourates = json.load(fichier)
    table = {}
    for sourate in sourates:
        for ayah in sourate["ayahs"]:
            numero = ayah["numberInSurah"]
            table[(sourate["number"], numero)] = retirer_basmala(
                ayah["text"], sourate["number"], numero
            )
    return table


def principal():
    analyseur = argparse.ArgumentParser(description="Évalue le suivi de récitation")
    analyseur.add_argument("--recitateur", default="husary")
    analyseur.add_argument("--sourates", nargs="+", type=int, default=[112, 113, 114])
    analyseur.add_argument("--limite", type=int, default=12, help="versets au maximum")
    options = analyseur.parse_args()

    versets = charger_versets()
    dossier = os.path.join(AUDIO, options.recitateur)
    if not os.path.isdir(dossier):
        print("Récitateur introuvable : " + dossier)
        return 1

    print("Modèle : " + nom_du_modele())
    print("Récitateur : " + options.recitateur)
    print("")

    total_mots = 0
    total_justes = 0
    total_secondes = 0.0
    total_audio = 0.0
    traites = 0

    for sourate in options.sourates:
        chemin_sourate = os.path.join(dossier, "surah_%03d" % sourate)
        if not os.path.isdir(chemin_sourate):
            continue
        for fichier in sorted(os.listdir(chemin_sourate)):
            if traites >= options.limite:
                break
            if not fichier.endswith(".mp3"):
                continue
            verset = int(fichier[3:6])
            attendu = versets.get((sourate, verset))
            if not attendu:
                continue

            with open(os.path.join(chemin_sourate, fichier), "rb") as flux:
                donnees = flux.read()

            depart = time.time()
            try:
                resultat = suivre(attendu, donnees)
            except MoteurIndisponible as erreur:
                print("Moteur indisponible : " + str(erreur))
                return 2
            ecoule = time.time() - depart

            justes = sum(1 for m in resultat["mots"] if m["etat"] == "juste")
            total_mots += resultat["total"]
            total_justes += justes
            total_secondes += ecoule
            total_audio += resultat.get("duree") or 0.0
            traites += 1

            fautes = [m for m in resultat["mots"] if m["etat"] not in ("juste",)]
            print("%d:%-3d  %2d/%-2d mots  conf %-5s  %4.1fs audio  %4.1fs calcul" % (
                sourate, verset, justes, resultat["total"],
                resultat.get("confiance"), resultat.get("duree") or 0.0, ecoule))
            if fautes:
                apercu = ", ".join(
                    "%s->%s(%s)" % (m["attendu"], m["entendu"], m["etat"]) for m in fautes[:4]
                )
                print("        " + apercu)

    print("")
    if total_mots:
        print("mots justes    : %d / %d = %.1f%%" % (
            total_justes, total_mots, 100.0 * total_justes / total_mots))
    if total_audio:
        print("temps de calcul: %.1fs pour %.1fs d'audio (facteur %.2fx)" % (
            total_secondes, total_audio, total_secondes / total_audio))
    return 0


if __name__ == "__main__":
    sys.exit(principal())
