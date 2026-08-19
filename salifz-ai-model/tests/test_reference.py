# -*- coding: utf-8 -*-
"""
Tests du texte de référence — Salifz.

La basmala est le piège le plus coûteux de ce jeu de données : elle préfixe le
verset 1 de presque chaque sourate, mais le récitant l'enchaîne ou non. Non
traitée, elle affichait quatre mots oubliés à chaque premier verset — mesuré
sur al-Husary : 8 des 12 fautes relevées, toutes fausses.
"""

import io
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.recitation.alignement import aligner  # noqa: E402
from src.recitation.reference import retirer_basmala  # noqa: E402

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORPUS = os.path.join(RACINE, "data", "raw", "quran", "text", "quran_uthmani.json")

BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
IKHLAS_1 = BASMALA + " قُلْ هُوَ ٱللَّهُ أَحَدٌ"


def test_la_basmala_part_du_premier_verset():
    assert retirer_basmala(IKHLAS_1, 112, 1) == "قُلْ هُوَ ٱللَّهُ أَحَدٌ"


def test_la_fatiha_garde_sa_basmala():
    """Sourate 1 : la basmala **est** le verset 1, la retirer le viderait."""
    assert retirer_basmala(BASMALA, 1, 1) == BASMALA


def test_la_neuvieme_sourate_est_laissee_telle_quelle():
    """At-Tawba n'a pas de basmala : rien ne doit y ressembler à un préfixe."""
    texte = "بَرَآءَةٌۭ مِّنَ ٱللَّهِ وَرَسُولِهِۦٓ"
    assert retirer_basmala(texte, 9, 1) == texte


def test_les_versets_suivants_sont_intacts():
    texte = "ٱللَّهُ ٱلصَّمَدُ"
    assert retirer_basmala(texte, 112, 2) == texte


def test_un_verset_qui_commence_par_bism_sans_etre_la_basmala_est_preserve():
    """« ٱقْرَأْ بِٱسْمِ رَبِّكَ » ne doit pas perdre ses mots."""
    texte = "ٱقْرَأْ بِٱسْمِ رَبِّكَ ٱلَّذِى خَلَقَ"
    assert retirer_basmala(texte, 96, 1) == texte


def test_reciter_la_basmala_reste_sans_penalite():
    """Le récitant qui l'enchaîne ne doit pas être compté en faute.

    Elle ressort en mots ajoutés, que l'alignement ne pénalise pas.
    """
    attendu = retirer_basmala(IKHLAS_1, 112, 1)
    resultat = aligner(attendu, "بسم الله الرحمن الرحيم قل هو الله أحد")
    assert [m["etat"] for m in resultat["mots"]] == ["juste"] * 4
    assert len(resultat["ajouts"]) == 4
    assert resultat["exactitude"] == 100.0


def test_sur_le_corpus_reel_chaque_premier_verset_perd_sa_basmala():
    """112 sourates concernées, 2 exceptions. Vérifié sur les données livrées."""
    if not os.path.exists(CORPUS):
        print("     (corpus absent — test ignoré)")
        return

    with io.open(CORPUS, encoding="utf-8") as fichier:
        sourates = json.load(fichier)

    retires = 0
    for sourate in sourates:
        numero = sourate["number"]
        texte = sourate["ayahs"][0]["text"]
        if retirer_basmala(texte, numero, 1) != texte:
            retires += 1

    assert retires == 112, "basmala retirée sur %d sourates au lieu de 112" % retires


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
