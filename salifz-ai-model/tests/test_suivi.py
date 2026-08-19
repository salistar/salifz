# -*- coding: utf-8 -*-
"""
Tests de la chaîne complète — Salifz.

Le transcripteur est remplacé par une fonction qui rend ce qu'on lui dit :
c'est le comportement de la chaîne autour du modèle qui est vérifié ici, pas
le modèle. Les cas couverts sont ceux où un raccourci d'implémentation
produirait un mensonge à l'écran — le silence pris pour une récitation, une
transcription incomprise présentée comme une faute.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.recitation.suivi import suivre  # noqa: E402

UTHMANI = "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ"


def faux_transcripteur(texte, confiance=0.9, silence=False):
    def transcrire(_donnees):
        return {"texte": texte, "duree": 3.0, "confiance": confiance, "silence": silence}
    return transcrire


def test_recitation_juste_de_bout_en_bout():
    resultat = suivre(UTHMANI, b"...", transcripteur=faux_transcripteur("الحمد لله رب العالمين"))
    assert resultat["exactitude"] == 100.0
    assert resultat["fiable"] is True
    assert resultat["silence"] is False
    assert resultat["transcription"] == "الحمد لله رب العالمين"


def test_silence_ne_vaut_ni_reussite_ni_faute():
    """Micro coupé : aucun mot validé, aucun mot reproché."""
    resultat = suivre(UTHMANI, b"...", transcripteur=faux_transcripteur("", silence=True))
    assert resultat["exactitude"] is None
    assert resultat["fiable"] is False
    assert resultat["silence"] is True
    assert [m["etat"] for m in resultat["mots"]] == ["en_attente"] * 4


def test_transcription_incomprise_est_signalee_comme_telle():
    """Confiance basse : le résultat existe mais se déclare peu sûr.

    C'est la distinction qui compte à l'écran entre « je n'ai pas bien
    entendu » et « tu t'es trompé ».
    """
    resultat = suivre(
        UTHMANI, b"...",
        transcripteur=faux_transcripteur("الحمد لله رب العالمين", confiance=0.2),
    )
    assert resultat["fiable"] is False
    assert resultat["exactitude"] == 100.0


def test_confiance_absente_ne_disqualifie_pas():
    """Un modèle qui n'expose pas de score n'est pas un modèle défaillant."""
    resultat = suivre(
        UTHMANI, b"...",
        transcripteur=faux_transcripteur("الحمد لله رب العالمين", confiance=None),
    )
    assert resultat["confiance"] is None
    assert resultat["fiable"] is True


def test_mode_direct_transmis_a_l_alignement():
    resultat = suivre(
        UTHMANI, b"...", partiel=True,
        transcripteur=faux_transcripteur("الحمد لله"),
    )
    assert resultat["position"] == 2
    assert resultat["termine"] is False
    assert [m["etat"] for m in resultat["mots"]][2:] == ["en_attente", "en_attente"]


def test_extrait_du_milieu_ne_reproche_pas_le_debut():
    """Le piege du mode par extraits.

    Le deuxieme extrait ne contient que la suite du verset. Sans point de
    depart, l'alignement compterait tout le debut comme oublie — le recitant
    verrait rougir des mots qu'il vient de dire correctement.
    """
    resultat = suivre(
        UTHMANI, b"...", partiel=True, depuis=2,
        transcripteur=faux_transcripteur("رب العالمين"),
    )
    etats = {m["index"]: m["etat"] for m in resultat["mots"]}
    assert etats == {2: "juste", 3: "juste"}
    assert resultat["position"] == 4
    assert resultat["total"] == 4


def test_les_indices_restent_absolus():
    """Le client affiche le verset entier : il lui faut des indices du verset."""
    resultat = suivre(
        UTHMANI, b"...", partiel=True, depuis=3,
        transcripteur=faux_transcripteur("العالمين"),
    )
    assert [m["index"] for m in resultat["mots"]] == [3]
    assert resultat["mots"][0]["etat"] == "juste"


def test_depuis_au_dela_du_verset_ne_plante_pas():
    """Un client qui se desynchronise ne doit pas provoquer une erreur 500."""
    resultat = suivre(
        UTHMANI, b"...", partiel=True, depuis=9,
        transcripteur=faux_transcripteur("العالمين"),
    )
    assert resultat["mots"] == []
    assert resultat["exactitude"] is None


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
