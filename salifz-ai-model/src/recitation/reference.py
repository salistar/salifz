# -*- coding: utf-8 -*-
"""
Texte de référence attendu pour un verset — Salifz.

Le texte vient du serveur et non du téléphone : c'est lui qui définit ce qui
est juste, et le faire remonter du client reviendrait à laisser l'application
noter sa propre copie.

Reste une question que les données ne tranchent pas : la basmala.
"""

from .normalisation import squelette

# « بسم الله الرحمن الرحيم », sous la forme comparée.
#
# Dérivée par `squelette()` plutôt que recopiée à la main : la fonction fond
# les lettres redoublées, si bien que الله s'y réduit à اله. Une constante
# écrite en clair ne correspondrait donc à rien, et la basmala resterait dans
# le texte attendu sans que rien ne le signale.
_BASMALA = tuple(squelette(mot) for mot in "بسم الله الرحمن الرحيم".split())


def retirer_basmala(texte, sourate, verset):
    """Retire la basmala du premier verset, sauf là où elle est le verset.

    Les jeux de données coraniques préfixent le verset 1 de chaque sourate par
    la basmala — sauf la 1re, où elle **est** le verset 1, et la 9e, qui n'en a
    pas. Mais le récitant, lui, la dit ou ne la dit pas : c'est une formule
    d'ouverture, pas une partie du verset.

    La laisser dans le texte attendu affichait quatre mots oubliés à chaque
    fois que quelqu'un enchaînait directement — soit, sur les récitations
    d'al-Husary servant de mesure, 8 des 12 fautes relevées, toutes fausses.

    Elle est donc retirée du texte attendu. Si le récitant la prononce, elle
    ressort comme mots ajoutés, ce qui ne pénalise rien.
    """
    if sourate in (1, 9) or verset != 1:
        return texte

    mots = (texte or "").split()
    if len(mots) <= len(_BASMALA):
        return texte
    if tuple(squelette(mot) for mot in mots[: len(_BASMALA)]) != _BASMALA:
        return texte

    return " ".join(mots[len(_BASMALA):])
