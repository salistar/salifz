# -*- coding: utf-8 -*-
"""Remplace les douze derniers emojis de l'interface par des icones dessinees.

Un emoji se rend differemment sur chaque systeme, ne porte aucune identite, et
un lecteur d'ecran l'annonce par son nom Unicode — « casque audio » n'aide
personne a comprendre qu'il s'agit de lancer un appel dans une halaqa.

Le script est idempotent : il verifie que chaque remplacement a bien eu lieu et
s'arrete au premier qui n'a pas trouve sa cible.
"""
import io
import os
import sys

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

REMPLACEMENTS = [
    # --- Bascule de theme dans la coquille publique -----------------------
    ('components/PublicShell.tsx',
     u"            {theme === 'light' ? '\U0001F319' : '☀️'}\n",
     u"            {theme === 'light' ? <IconeLune size={18} /> : <IconeSoleil size={18} />}\n"),

    # Le hamburger : trois traits dessines valent mieux qu'un caractere de
    # dessin de boite, dont la graisse varie d'une police a l'autre.
    ('components/PublicShell.tsx',
     u"            ☰\n",
     u"            <svg viewBox=\"0 0 24 24\" width={18} height={18} fill=\"none\" stroke=\"currentColor\"\n"
     u"                 strokeWidth={1.5} strokeLinecap=\"round\" aria-hidden=\"true\">\n"
     u"              <path d=\"M4 7h16M4 12h16M4 17h16\" />\n"
     u"            </svg>\n"),

    # --- Qibla ------------------------------------------------------------
    # La Kaaba en emoji devenait un carre noir sur la moitie des systemes ;
    # l'icone de qibla existe deja et tourne aussi bien.
    ('pages/PrayerPage.tsx',
     u"              \U0001F54B\n",
     u"              <IconeQibla size={52} />\n"),

    # --- Recitations ------------------------------------------------------
    ('pages/RecitationsPage.tsx',
     u"            {recording ? '⏹ Arrêter' : '\U0001F399 Enregistrer'}\n",
     u"            {recording ? <IconeArret size={16} /> : <IconeEnregistrer size={16} />}\n"
     u"            <span>{recording ? 'Arrêter' : 'Enregistrer'}</span>\n"),

    # --- Salle de halaqa --------------------------------------------------
    ('pages/HalaqaRoomPage.tsx',
     u"              \U0001F3A7 Appel audio\n",
     u"              <IconeAppel size={16} /> Appel audio\n"),
    ('pages/HalaqaRoomPage.tsx',
     u"              \U0001F4F9 Appel vidéo\n",
     u"              <IconeVideo size={16} /> Appel vidéo\n"),
    ('pages/HalaqaRoomPage.tsx',
     u"              {micOn ? '\U0001F50A Micro' : '\U0001F507 Muet'}\n",
     u"              {micOn ? <IconeMicro size={16} /> : <IconeMicroCoupe size={16} />}\n"
     u"              <span>{micOn ? 'Micro' : 'Muet'}</span>\n"),
    ('pages/HalaqaRoomPage.tsx',
     u"              {camOn ? '\U0001F4F9 Caméra' : '\U0001F6AB Caméra'}\n",
     u"              {camOn ? <IconeVideo size={16} /> : <IconeVideoCoupee size={16} />}\n"
     u"              <span>Caméra</span>\n"),
]

IMPORTS = {
    'components/PublicShell.tsx': u"import { IconeLune, IconeSoleil } from './Icones';\n",
    'pages/PrayerPage.tsx': u"import { IconeQibla } from '../components/Icones';\n",
    'pages/RecitationsPage.tsx': u"import { IconeArret, IconeEnregistrer } from '../components/Icones';\n",
    'pages/HalaqaRoomPage.tsx':
        u"import {\n"
        u"  IconeAppel,\n"
        u"  IconeVideo,\n"
        u"  IconeVideoCoupee,\n"
        u"  IconeMicro,\n"
        u"  IconeMicroCoupe,\n"
        u"} from '../components/Icones';\n",
}


def lire(rel):
    with io.open(os.path.join(RACINE, rel), encoding='utf-8') as f:
        return f.read()


def ecrire(rel, contenu):
    with io.open(os.path.join(RACINE, rel), 'w', encoding='utf-8') as f:
        f.write(contenu)


def main():
    touches = set()

    for rel, avant, apres in REMPLACEMENTS:
        src = lire(rel)
        if apres in src and avant not in src:
            continue  # deja applique
        if avant not in src:
            sys.exit(u'cible introuvable dans %s' % rel)
        ecrire(rel, src.replace(avant, apres, 1))
        touches.add(rel)

    for rel, ligne in IMPORTS.items():
        src = lire(rel)
        if ligne in src:
            continue
        # On insere apres le dernier import du fichier.
        lignes = src.split(u'\n')
        dernier = max(i for i, l in enumerate(lignes) if l.startswith(u'import ') or l.startswith(u'} from '))
        lignes.insert(dernier + 1, ligne.rstrip(u'\n'))
        ecrire(rel, u'\n'.join(lignes))
        touches.add(rel)

    for rel in sorted(touches):
        print(u'%s' % rel)
    print(u'%d fichiers modifies' % len(touches))


if __name__ == '__main__':
    main()
