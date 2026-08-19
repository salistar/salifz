# -*- coding: utf-8 -*-
"""
Tests du suivi de récitation — Salifz.

Ces tests ne chargent aucun modèle : ils vérifient la seule partie qui peut
être fausse **silencieusement**. Un moteur de reconnaissance qui tombe se voit
tout de suite ; un alignement qui décale d'un mot affiche une faute là où le
récitant n'en a pas commis, et se tait.

Texte de référence : sourate al-Fatiha, verset 2, dans les deux graphies que
le système doit réconcilier.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.recitation.alignement import aligner  # noqa: E402
from src.recitation.normalisation import squelette  # noqa: E402

UTHMANI = "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ"
NU = "الحمد لله رب العالمين"


def etats(resultat):
    return [mot["etat"] for mot in resultat["mots"]]


def test_les_deux_graphies_se_rejoignent():
    """Le rasm uthmani vocalisé et l'arabe nu doivent donner le même squelette.

    Mot à mot : c'est la comparaison que fait l'alignement.
    """
    assert [squelette(m) for m in UTHMANI.split()] == [squelette(m) for m in NU.split()]


def test_recitation_parfaite():
    resultat = aligner(UTHMANI, NU)
    assert etats(resultat) == ["juste"] * 4
    assert resultat["exactitude"] == 100.0
    assert resultat["position"] == 4
    assert resultat["termine"] is True


def test_mot_saute_ne_decale_pas_les_suivants():
    """Le vrai piège : « لله » sauté ne doit coûter qu'une faute, pas quatre."""
    resultat = aligner(UTHMANI, "الحمد رب العالمين")
    assert etats(resultat) == ["juste", "oublie", "juste", "juste"]
    assert resultat["exactitude"] == 75.0


def test_mot_deforme_reste_une_seule_faute():
    """« العالمون » au lieu de « العالمين » : un mot touché, pas deux."""
    resultat = aligner(UTHMANI, "الحمد لله رب العالمون")
    assert etats(resultat) == ["juste", "juste", "juste", "approximatif"]
    assert resultat["mots"][3]["similarite"] > 0.8


def test_mot_ajoute_ne_penalise_pas_le_texte_attendu():
    """L'isti'adha prononcée avant le verset ne doit rien casser."""
    resultat = aligner(UTHMANI, "أعوذ بالله " + NU)
    assert etats(resultat) == ["juste"] * 4
    assert len(resultat["ajouts"]) == 2
    assert resultat["exactitude"] == 100.0


def test_recitation_en_cours_ne_reproche_rien():
    """Mode direct : ce qui n'est pas encore dit est « en attente », pas « oublié »."""
    resultat = aligner(UTHMANI, "الحمد لله", partiel=True)
    assert etats(resultat) == ["juste", "juste", "en_attente", "en_attente"]
    assert resultat["position"] == 2
    assert resultat["termine"] is False
    assert resultat["exactitude"] == 100.0


def test_la_meme_entree_jugee_complete_compte_les_oublis():
    """Hors mode direct, s'arrêter au milieu est bien un oubli."""
    resultat = aligner(UTHMANI, "الحمد لله")
    assert etats(resultat) == ["juste", "juste", "oublie", "oublie"]
    assert resultat["exactitude"] == 50.0


def test_rien_entendu_n_invente_aucune_note():
    """Le point de principe du projet : pas de score fabriqué."""
    resultat = aligner(UTHMANI, "", partiel=True)
    assert resultat["exactitude"] is None
    assert resultat["position"] == 0
    assert etats(resultat) == ["en_attente"] * 4


def test_autre_verset_entierement_signale():
    """Réciter un tout autre verset ne doit pas passer pour « approximatif »."""
    resultat = aligner(UTHMANI, "قل هو الله أحد")
    assert "juste" not in etats(resultat)


def test_repetition_du_debut_toleree():
    """Reprendre son souffle et redire les deux premiers mots reste correct."""
    resultat = aligner(UTHMANI, "الحمد لله الحمد لله رب العالمين")
    assert etats(resultat) == ["juste"] * 4
    assert len(resultat["ajouts"]) == 2


def test_verset_long_reste_rapide():
    """Le verset du Trône : la matrice doit rester d'un coût négligeable."""
    ayat_al_kursi = (
        "ٱللَّهُ لَآ إِلَٰهَ إِلَّا هُوَ ٱلْحَىُّ ٱلْقَيُّومُ لَا تَأْخُذُهُۥ سِنَةٌ وَلَا نَوْمٌ "
        "لَّهُۥ مَا فِى ٱلسَّمَٰوَٰتِ وَمَا فِى ٱلْأَرْضِ"
    )
    resultat = aligner(ayat_al_kursi, ayat_al_kursi)
    assert resultat["exactitude"] == 100.0
    assert resultat["total"] == 19


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
