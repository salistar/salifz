# -*- coding: utf-8 -*-
"""
Alignement d'une récitation sur le texte attendu — Salifz.

Le moteur de reconnaissance rend une suite de mots ; le verset en attend une
autre. Les comparer position par position ne marche pas : dès qu'un mot est
oublié, tout ce qui suit se décale et se retrouve compté faux.

On aligne donc les deux suites (Needleman-Wunsch), ce qui distingue les quatre
accidents réels d'une récitation : le mot juste, le mot déformé, le mot sauté,
le mot ajouté.

**Ce module ne note pas le tajwid.** Il constate quels mots ont été prononcés,
pas comment. L'`exactitude` renvoyée est une part mesurée de mots reconnus,
jamais une appréciation.
"""

from .normalisation import similarite, squelette

JUSTE = "juste"
APPROXIMATIF = "approximatif"
ERRONE = "errone"
OUBLIE = "oublie"
EN_ATTENTE = "en_attente"

# Coût d'un trou. Choisi sous le coût de deux substitutions quelconques (2.0)
# pour qu'un mot sauté reste un trou, et au-dessus du coût d'une substitution
# proche pour qu'un mot simplement déformé ne soit pas lu comme
# « oublié puis ajouté » — ce que l'utilisateur verrait comme deux fautes
# là où il n'en a commis qu'une.
COUT_TROU = 0.8

# Au-dessus : le mot est reconnaissable, la différence tient à la transcription
# (voyelle rendue autrement, liaison). En dessous : ce n'est pas le même mot.
SEUIL_APPROXIMATIF = 0.7


def decouper_avec_original(texte):
    """Découpe en (forme affichée, forme comparée).

    Le découpage se fait sur le texte **d'origine** pour que chaque entrée
    garde sa graphie uthmanie à l'écran. Les jetons qui ne laissent rien après
    normalisation — un signe de fin de verset isolé, un numéro — disparaissent.
    """
    paires = []
    for brut in (texte or "").split():
        compare = squelette(brut)
        if compare:
            paires.append((brut, compare))
    return paires


def aligner(texte_attendu, texte_entendu, partiel=False):
    """Aligne ce qui a été entendu sur ce qui était attendu.

    `partiel=True` pour une récitation en cours : les mots situés après le
    dernier mot reconnu sont marqués « en attente » et non « oubliés ».
    Sans cela, le tout premier extrait audio afficherait le verset entier en
    rouge — un reproche adressé au récitant pour n'avoir pas encore parlé.
    """
    attendu = decouper_avec_original(texte_attendu)
    entendu = [n for _, n in decouper_avec_original(texte_entendu)]

    n, m = len(attendu), len(entendu)
    if n == 0:
        return _resultat_vide()

    couts, choix = _matrice(attendu, entendu, n, m)

    # En mode partiel, la récitation peut s'arrêter en cours de verset : on
    # choisit la ligne de fin la moins coûteuse au lieu d'imposer la dernière.
    fin_i = n
    if partiel:
        fin_i = min(range(n + 1), key=lambda i: couts[i][m])

    mots, ajouts = _remonter(attendu, entendu, choix, fin_i, m)

    for index in range(fin_i, n):
        brut, _ = attendu[index]
        mots.append({
            "index": index,
            "attendu": brut,
            "entendu": None,
            "etat": EN_ATTENTE if partiel else OUBLIE,
            "similarite": 0.0,
        })

    mots.sort(key=lambda mot: mot["index"])
    return _resumer(mots, ajouts, n, partiel)


def _matrice(attendu, entendu, n, m):
    """Programmation dynamique : coût minimal et décision retenue par case."""
    couts = [[0.0] * (m + 1) for _ in range(n + 1)]
    choix = [[None] * (m + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        couts[i][0] = i * COUT_TROU
        choix[i][0] = "oubli"
    for j in range(1, m + 1):
        couts[0][j] = j * COUT_TROU
        choix[0][j] = "ajout"

    for i in range(1, n + 1):
        compare_attendu = attendu[i - 1][1]
        for j in range(1, m + 1):
            ressemblance = similarite(compare_attendu, entendu[j - 1])
            # Une substitution coûte au minimum 0.35 même quand les mots se
            # ressemblent beaucoup : sans ce plancher, enchaîner des
            # quasi-correspondances deviendrait moins cher que reconnaître un
            # trou, et un mot sauté passerait inaperçu.
            cout_sub = 0.0 if ressemblance == 1.0 else 0.35 + 0.65 * (1.0 - ressemblance)

            candidats = (
                (couts[i - 1][j - 1] + cout_sub, "paire"),
                (couts[i - 1][j] + COUT_TROU, "oubli"),
                (couts[i][j - 1] + COUT_TROU, "ajout"),
            )
            couts[i][j], choix[i][j] = min(candidats, key=lambda c: c[0])

    return couts, choix


def _remonter(attendu, entendu, choix, i, j):
    """Reconstruit l'alignement en remontant les décisions."""
    mots, ajouts = [], []

    while i > 0 or j > 0:
        decision = choix[i][j]
        if decision == "paire":
            brut, compare = attendu[i - 1]
            entendu_mot = entendu[j - 1]
            ressemblance = similarite(compare, entendu_mot)
            if ressemblance == 1.0:
                etat = JUSTE
            elif ressemblance >= SEUIL_APPROXIMATIF:
                etat = APPROXIMATIF
            else:
                etat = ERRONE
            mots.append({
                "index": i - 1,
                "attendu": brut,
                "entendu": entendu_mot,
                "etat": etat,
                "similarite": round(ressemblance, 3),
            })
            i, j = i - 1, j - 1
        elif decision == "oubli":
            brut, _ = attendu[i - 1]
            mots.append({
                "index": i - 1,
                "attendu": brut,
                "entendu": None,
                "etat": OUBLIE,
                "similarite": 0.0,
            })
            i -= 1
        else:
            ajouts.append({"apres": i - 1, "entendu": entendu[j - 1]})
            j -= 1

    ajouts.reverse()
    return mots, ajouts


def _resumer(mots, ajouts, total, partiel):
    """Assemble le retour rendu au mobile."""
    juges = [mot for mot in mots if mot["etat"] != EN_ATTENTE]
    justes = sum(1 for mot in juges if mot["etat"] == JUSTE)

    # Le curseur s'arrête au dernier mot effectivement reconnu : c'est lui qui
    # fait avancer le surlignage à l'écran.
    position = 0
    for mot in mots:
        if mot["etat"] in (JUSTE, APPROXIMATIF):
            position = mot["index"] + 1

    return {
        "mots": mots,
        "ajouts": ajouts,
        "position": position,
        "total": total,
        "reconnus": len(juges),
        # Part mesurée de mots rendus tels quels, sur ce qui a été récité.
        # Vaut None tant que rien n'a été reconnu : aucune valeur inventée.
        "exactitude": round(100.0 * justes / len(juges), 1) if juges else None,
        "termine": (not partiel) or position >= total,
    }


def _resultat_vide():
    return {
        "mots": [],
        "ajouts": [],
        "position": 0,
        "total": 0,
        "reconnus": 0,
        "exactitude": None,
        "termine": False,
    }
