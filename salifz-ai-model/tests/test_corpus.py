# -*- coding: utf-8 -*-
"""
Garde-fou sur corpus réel — Salifz.

`quran_uthmani.json` et `quran_simple.json` portent le même texte dans deux
orthographes. C'est la meilleure approximation disponible de l'écart entre le
texte de référence et ce qu'un moteur de reconnaissance rendra.

Ce test fige le niveau atteint. Il n'est pas décoratif : les règles de
`squelette()` ont été choisies sur cette mesure, et une modification qui
paraît anodine — retirer la fusion des lettres redoublées, par exemple — fait
chuter le taux de plusieurs dixièmes, soit des centaines de mots justes
affichés comme fautifs.
"""

import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.recitation.normalisation import squelette  # noqa: E402

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXTES = os.path.join(RACINE, "data", "raw", "quran", "text")

# Mesuré le 19/08/2026 : 74 561 mots sur 74 917. Le seuil est posé juste en
# dessous pour tolérer une correction de données, pas une régression de règle.
TAUX_ATTENDU = 99.4


def _charger(nom):
    chemin = os.path.join(TEXTES, nom)
    if not os.path.exists(chemin):
        return None
    with io.open(chemin, encoding="utf-8") as fichier:
        return json.load(fichier)


def test_les_deux_orthographes_du_coran_se_rejoignent():
    uthmani = _charger("quran_uthmani.json")
    simple = _charger("quran_simple.json")
    if uthmani is None or simple is None:
        print("     (corpus absent — test ignoré)")
        return

    comparables = 0
    concordants = 0
    for sourate_u, sourate_s in zip(uthmani, simple):
        for verset_u, verset_s in zip(sourate_u["ayahs"], sourate_s["ayahs"]):
            mots_u = verset_u["text"].split()
            mots_s = verset_s["text"].split()
            # Les 363 versets où le découpage diffère (`يَٰٓأَيُّهَا` contre
            # `يَا أَيُّهَا`) relèvent de l'alignement, pas de la normalisation.
            if len(mots_u) != len(mots_s):
                continue
            for mot_u, mot_s in zip(mots_u, mots_s):
                comparables += 1
                if squelette(mot_u) == squelette(mot_s):
                    concordants += 1

    taux = 100.0 * concordants / comparables
    print("     %d / %d mots concordants = %.3f%%" % (concordants, comparables, taux))
    assert taux >= TAUX_ATTENDU, "taux tombé à %.3f%% (seuil %.1f%%)" % (taux, TAUX_ATTENDU)


if __name__ == "__main__":
    echecs = 0
    for nom, fonction in sorted(globals().items()):
        if not nom.startswith("test_"):
            continue
        try:
            fonction()
            print("  ok   " + nom)
        except AssertionError as erreur:
            echecs += 1
            print("  ECHEC " + nom + " : " + str(erreur))
    print("")
    print("Echecs : " + str(echecs))
    sys.exit(1 if echecs else 0)
