# -*- coding: utf-8 -*-
"""
Préparation de l'audio reçu du mobile — Salifz.

Le téléphone envoie du m4a (Android) ou du webm/opus (web). Whisper attend du
PCM 16 kHz mono. On passe par ffmpeg plutôt que par librosa : les codecs
propriétaires ne sont pas décodables en Python pur, et un décodeur qui échoue
silencieusement rendrait un signal vide — que Whisper remplirait d'une phrase
inventée.
"""

import math
import os
import shutil
import struct
import subprocess
import tempfile

FREQUENCE = 16000

# En dessous, il n'y a pas de voix. Seuil sur l'amplitude efficace d'un signal
# normalisé entre -1 et 1 : le souffle d'un micro de téléphone tourne autour de
# 0.002, une récitation même lointaine dépasse 0.01.
SEUIL_SILENCE = 0.005


class AudioIllisible(Exception):
    """L'extrait n'a pas pu être décodé."""


def ffmpeg_disponible():
    return shutil.which("ffmpeg") is not None


def decoder(donnees):
    """Décode un extrait encodé en signal mono 16 kHz, échantillons flottants."""
    if not donnees:
        raise AudioIllisible("Extrait audio vide.")
    if not ffmpeg_disponible():
        raise AudioIllisible("ffmpeg est absent de l'image.")

    # Fichier temporaire, PAS un pipe. Le conteneur MP4/M4A — celui
    # qu'enregistrent les téléphones — range son index (l'atome moov) à la
    # FIN du fichier ; en lecture de flux, ffmpeg ne peut pas revenir le
    # chercher et échoue en « Invalid data found ». Les MP3 de test, eux,
    # se lisent en flux : le défaut est resté invisible jusqu'au premier
    # enregistrement réel envoyé par un téléphone.
    temporaire = tempfile.NamedTemporaryFile(suffix=".audio", delete=False)
    try:
        temporaire.write(donnees)
        temporaire.close()

        commande = [
            "ffmpeg", "-hide_banner", "-loglevel", "error",
            "-i", temporaire.name,
            "-f", "s16le", "-acodec", "pcm_s16le",
            "-ac", "1", "-ar", str(FREQUENCE),
            "pipe:1",
        ]
        processus = subprocess.Popen(
            commande, stdout=subprocess.PIPE, stderr=subprocess.PIPE
        )
        brut, erreur = processus.communicate()

        if processus.returncode != 0 or not brut:
            detail = (erreur or b"").decode("utf-8", "replace").strip().splitlines()
            raise AudioIllisible(detail[-1] if detail else "ffmpeg n'a rien produit.")
    finally:
        os.unlink(temporaire.name)

    # s16le -> flottants entre -1 et 1.
    nombre = len(brut) // 2
    entiers = struct.unpack("<%dh" % nombre, brut[: nombre * 2])
    return [e / 32768.0 for e in entiers]


def energie(signal):
    """Amplitude efficace du signal."""
    if not signal:
        return 0.0
    return math.sqrt(sum(e * e for e in signal) / len(signal))


def est_silencieux(signal, seuil=SEUIL_SILENCE):
    """Vrai si l'extrait ne contient pas de voix.

    Garde-fou indispensable : sur un signal muet, Whisper ne rend pas une
    chaîne vide, il produit une phrase plausible — souvent une formule pieuse,
    parce que c'est ce qu'il a le plus entendu à l'entraînement. Sans ce test,
    un micro coupé afficherait une récitation juste.
    """
    return energie(signal) < seuil


def duree(signal):
    return len(signal) / float(FREQUENCE)
