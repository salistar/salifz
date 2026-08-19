# -*- coding: utf-8 -*-
"""
Normalisation du texte arabe pour la comparaison — Salifz.

Le texte de référence est en rasm uthmani : voyelles, signes de pause, numéros
de verset, annotations de récitation. Un moteur de reconnaissance vocale rend
de l'arabe moderne dépouillé. Comparer les deux tels quels ferait échouer
presque chaque mot.

Deux formes sont produites :

- `normaliser()` — forme fidèle, débarrassée de ce qui ne s'entend pas.
- `squelette()`  — forme de **comparaison**, où les variantes d'orthographe
  entre rasm et arabe moderne sont neutralisées.

Les règles du squelette n'ont pas été devinées : chacune a été mesurée sur les
6 236 versets, en confrontant `quran_uthmani.json` à `quran_simple.json` —
le même texte dans les deux orthographes, soit 74 917 mots comparables.

    règles minimales (alif neutralisé)      97,1 %
    + hamza ramené à l'alif                 98,7 %
    + lettres redoublées fondues            99,2 %
    + waw long de ٱلصَّلَوٰة                    99,4 %
    + alif maqsura médian                   99,5 %

Contrepartie mesurée : sur 14 820 formes distinctes, les règles minimales en
fondent déjà 1 703 ; les trois dernières en ajoutent 339. Le compromis est
assumé dans ce sens-là — signaler une faute à quelqu'un qui a bien récité coûte
plus cher que de laisser passer une quasi-homographie qu'un moteur de
reconnaissance ne distinguerait pas davantage.
"""

import re
import unicodedata

# Diacritiques et marques : tout ce qui décore la consonne sans s'entendre
# comme un phonème à part entière dans une transcription non vocalisée.
# L'alif suscrit (U+0670) en est délibérément absent : il porte un son.
_MARQUES = (
    "ؐ-ؚ"  # signes honorifiques
    "ً-ٟ"  # tanwin, voyelles brèves, chadda, soukoun
    "ۖ-ۭ"  # annotations coraniques, fin de verset, signes de pause
    "࣓-ࣿ"  # extensions arabes récentes
    "ـ"         # tatweel (allongement purement typographique)
    "​-‏"  # espaces de largeur nulle et marques de direction
    "﻿"         # BOM : le verset 1:1 du jeu de donnees en porte un
)
_RE_MARQUES = re.compile("[" + _MARQUES + "]")

# Variantes d'alif : أ إ آ ٱ se prononcent toutes sur le même support.
_ALIFS = "آأإٱٲٳٵ"

_RE_PONCTUATION = re.compile(
    "[،؛؟٪-٭۔"      # ponctuation arabe
    "٠-٩۰-۹"                  # chiffres indo-arabes (numéros de verset)
    r"\.,;:!\?\-–—_\"'`«»\(\)\[\]\{\}/\0-9]"
)

_RE_ESPACES = re.compile(r"\s+")
_RE_WAW_LONG = re.compile("و(?=ا?ه$)")
_RE_REDOUBLEE = re.compile(r"(.)\1+")

_FINS_DE_MOT = " \n\t\r"


def normaliser(texte):
    """Ramène un texte arabe à sa forme fidèle comparable.

    >>> normaliser("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ")
    'بسم الله الرحمان'
    """
    if not texte:
        return ""

    # NFC d'abord : sans cela, un alif décomposé (ا + hamza combinante)
    # survivrait au filtre des marques et compterait comme une différence
    # invisible à l'œil.
    texte = unicodedata.normalize("NFC", texte)
    texte = _RE_MARQUES.sub("", texte)
    texte = _RE_PONCTUATION.sub(" ", texte)

    caracteres = []
    for position, c in enumerate(texte):
        if c == "ٰ" or c in _ALIFS:
            # Alif suscrit : une voyelle longue, pas un ornement.
            caracteres.append("ا")
        elif c == "ء":
            # Le rasm écrit ءَامَنُوا۟ là où l'arabe moderne écrit آمنوا : le
            # hamza isolé y tient la place de l'alif.
            caracteres.append("ا")
        elif c == "ى":
            suivant = texte[position + 1] if position + 1 < len(texte) else " "
            # En fin de mot, l'alif maqsura est écrit ى des deux côtés et se
            # confond avec ي à la frappe. Au milieu (أَدْرَىٰكَ / أدراك), il
            # transcrit un alif.
            caracteres.append("ي" if suivant in _FINS_DE_MOT else "ا")
        elif c == "ة":
            caracteres.append("ه")
        elif c == "ؤ":
            caracteres.append("و")
        elif c == "ئ":
            caracteres.append("ي")
        else:
            caracteres.append(c)

    return _RE_ESPACES.sub(" ", "".join(caracteres)).strip()


def squelette(mot):
    """Forme servant à la **comparaison**, variantes d'orthographe neutralisées.

    Trois neutralisations, dans cet ordre :

    1. Le waw long de ٱلصَّلَوٰة, ٱلزَّكَوٰة, ٱلْحَيَوٰة — écrit و dans le rasm,
       ا dans l'arabe moderne (الصلاة).
    2. L'alif, sauf en tête de mot. L'alif suscrit correspond tantôt à un alif
       écrit (`ٱلْعَٰلَمِينَ` → `العالمين`), tantôt à rien (`ٱلرَّحْمَٰنِ` →
       `الرحمن`) : le même signe, deux orthographes, aucune règle ne satisfait
       les deux. L'alif **initial** est préservé, lui seul distinguant des mots
       entiers — sans cette réserve, `لله` et `الله` deviendraient un seul
       jeton et réciter un autre verset laisserait des mots comptés justes.
    3. Les lettres redoublées (`دوود` → `دود`, `ٱلنَّبِيِّۧنَ` → `النبين`).

    **Limite assumée** : `قال` et `قل` partagent ce squelette. Confondre une
    voyelle longue et une brève n'est donc pas détecté. C'est délibéré — un
    Whisper généraliste ne transcrit pas la durée vocalique de façon fiable, et
    signaler cette faute annoncerait une précision que le moteur n'a pas.
    """
    forme = normaliser(mot).replace(" ", "")
    if not forme:
        return ""

    forme = _RE_WAW_LONG.sub("", forme)
    sans_alif = forme[:1] + forme[1:].replace("ا", "")
    sans_redoublement = _RE_REDOUBLEE.sub(r"\1", sans_alif)

    # Un mot réduit à néant (« ا » seul) resterait comparable à tout : on
    # conserve alors la forme pleine.
    return sans_redoublement or forme


def decouper_en_mots(texte):
    """Découpe en mots après normalisation. Les vides sont écartés."""
    return [mot for mot in normaliser(texte).split(" ") if mot]


def distance_edition(a, b):
    """Distance de Levenshtein entre deux chaînes.

    Une seule ligne de travail : les mots comparés font quelques caractères,
    allouer la matrice complète serait du gâchis.
    """
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)

    precedente = list(range(len(b) + 1))
    for i, ca in enumerate(a, start=1):
        courante = [i]
        for j, cb in enumerate(b, start=1):
            courante.append(min(
                precedente[j] + 1,                          # suppression
                courante[j - 1] + 1,                        # insertion
                precedente[j - 1] + (0 if ca == cb else 1)  # substitution
            ))
        precedente = courante
    return precedente[-1]


def similarite(a, b):
    """Ressemblance de deux mots entre 0.0 et 1.0."""
    if not a and not b:
        return 1.0
    plus_long = max(len(a), len(b))
    if plus_long == 0:
        return 1.0
    return 1.0 - (distance_edition(a, b) / float(plus_long))
