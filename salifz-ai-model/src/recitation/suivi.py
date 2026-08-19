# -*- coding: utf-8 -*-
"""
Suivi d'une récitation, du son au verdict — Salifz.

Assemble les trois pièces : décoder l'audio, le transcrire, aligner la
transcription sur le verset attendu.

Le `transcripteur` est injectable pour que la chaîne complète soit testable
sans charger un modèle de plusieurs centaines de mégaoctets.
"""

from .alignement import aligner, decouper_avec_original
from .moteur import transcrire as transcrire_par_defaut

# En dessous, le modèle n'a pas compris ce qu'il a entendu. On rend alors
# l'alignement en signalant qu'il n'est pas fiable, plutôt que d'annoncer des
# fautes au récitant : « je n'ai pas bien entendu » et « tu t'es trompé » ne
# doivent pas se confondre à l'écran.
#
# Valeur mesurée, pas choisie : sur les récitations d'al-Husary, des
# transcriptions justes ressortent entre 0,42 et 0,76 de confiance. La
# récitation psalmodiée — voyelles tenues, débit lent, mélodie — fait toujours
# descendre le score d'un Whisper entraîné sur de la parole ordinaire. Un seuil
# à 0,45 aurait déclaré douteuse la moitié des récitations correctes.
SEUIL_FIABILITE = 0.30


def suivre(texte_attendu, donnees_audio, partiel=False, depuis=0, transcripteur=None):
    """Compare une récitation enregistrée au verset attendu.

    `partiel=True` pendant la récitation ; `False` pour le verdict final.

    `depuis` est l'indice du premier mot que cet extrait est censé couvrir.
    Il est indispensable au mode par extraits : le deuxième extrait ne contient
    que la suite du verset, et l'aligner sur le texte entier ferait passer tout
    le début pour oublié. Les indices rendus restent absolus — le client n'a
    pas à les recaler.
    """
    transcripteur = transcripteur or transcrire_par_defaut
    transcription = transcripteur(donnees_audio)

    attendu_restant, decalage = _tronquer(texte_attendu, depuis)

    if transcription.get("silence"):
        # Aucun son exploitable : rien n'est reproché, rien n'est validé.
        resultat = aligner(attendu_restant, "", partiel=True)
        _decaler(resultat, decalage)
        resultat.update({
            "transcription": "",
            "confiance": None,
            "fiable": False,
            "silence": True,
            "duree": transcription.get("duree"),
        })
        return resultat

    resultat = aligner(attendu_restant, transcription.get("texte", ""), partiel=partiel)
    _decaler(resultat, decalage)

    confiance = transcription.get("confiance")
    resultat.update({
        "transcription": transcription.get("texte", ""),
        "confiance": confiance,
        "fiable": confiance is None or confiance >= SEUIL_FIABILITE,
        "silence": False,
        "duree": transcription.get("duree"),
    })
    return resultat


def _tronquer(texte_attendu, depuis):
    """Ne garde du verset que ce qui reste à réciter.

    Le découpage passe par `decouper_avec_original` pour compter les mots
    exactement comme l'alignement : un signe de fin de verset isolé disparaît
    des deux côtés, sinon le décalage glisserait d'un cran.
    """
    if not depuis or depuis < 1:
        return texte_attendu, 0

    mots = [brut for brut, _ in decouper_avec_original(texte_attendu)]
    if depuis >= len(mots):
        return "", len(mots)
    return " ".join(mots[depuis:]), depuis


def _decaler(resultat, decalage):
    """Ramène les indices en position absolue dans le verset."""
    if not decalage:
        return
    for mot in resultat["mots"]:
        mot["index"] += decalage
    for ajout in resultat["ajouts"]:
        ajout["apres"] += decalage
    resultat["position"] += decalage
    resultat["total"] += decalage
