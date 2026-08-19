# -*- coding: utf-8 -*-
"""
Transcription de la récitation — Salifz.

Deux implémentations, choisies à l'exécution :

- **faster-whisper** (CTranslate2, quantifié en int8). Sur un serveur sans
  carte graphique — celui de production en est un — il transcrit plusieurs fois
  plus vite que la version de référence, à qualité comparable. C'est le défaut.
- **transformers**. Plus lent, mais seul chemin pour un Whisper affiné publié
  au format PyTorch, dont `tarteel-ai/whisper-base-ar-quran`, entraîné sur de
  la récitation coranique.

Le modèle est chargé **paresseusement** : l'API doit démarrer et répondre même
sans poids sur le disque, sinon un réseau lent devient une panne.

Quand rien n'est chargeable, ce module lève `MoteurIndisponible`. Il ne rend
jamais de transcription approchée, de texte attendu recopié ni de note de
repli : c'est exactement la faute relevée par l'audit sur l'ancienne analyse de
tajwid, qui renvoyait `75 + Math.random() * 20`.
"""

import logging
import math
import os
import threading

# transformers sonde TensorFlow pour identifier le type des tenseurs reçus, ce
# qui déclenche son import complet. Ce service n'utilise que PyTorch, et cet
# import est au mieux inutile — au pire fatal : une installation TensorFlow
# incompatible avec la version de Python fait échouer la transcription sur une
# erreur de typage sans aucun rapport avec l'audio.
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")

from . import audio  # noqa: E402

LOGGER = logging.getLogger("salifz.recitation")

FASTER_WHISPER = "faster-whisper"
TRANSFORMERS = "transformers"

# « small » suffit pour de la récitation : le texte est connu à l'avance et
# l'alignement rattrape les écarts d'orthographe. Monter en taille coûte du
# temps de calcul pour un gain que le comparateur absorbe déjà.
MODELE_FASTER_DEFAUT = "small"
MODELE_TRANSFORMERS_DEFAUT = "tarteel-ai/whisper-base-ar-quran"

_verrou = threading.Lock()
_etat = {
    "backend": None,
    "modele": None,
    "processeur": None,
    "torch": None,
    "erreur": None,
    # None tant que la convention de génération du modèle est inconnue ;
    # False si `language=` suffit, sinon les jetons de décodeur à forcer.
    "jetons_forces": None,
}


class MoteurIndisponible(Exception):
    """Le moteur ne peut pas transcrire, et le dit."""


def backend_demande():
    return os.environ.get("BACKEND_RECITATION", "auto").strip().lower()


def _backend_retenu():
    """Tranche entre les deux implémentations."""
    demande = backend_demande()
    if demande in (FASTER_WHISPER, TRANSFORMERS):
        return demande
    try:
        import faster_whisper  # noqa: F401
        return FASTER_WHISPER
    except ImportError:
        return TRANSFORMERS


def nom_du_modele():
    defaut = (MODELE_FASTER_DEFAUT if _backend_retenu() == FASTER_WHISPER
              else MODELE_TRANSFORMERS_DEFAUT)
    return os.environ.get("MODELE_RECITATION", defaut)


def _fils():
    """Nombre de fils laissés au modèle.

    Borné : sur le serveur de production, les mêmes cœurs servent l'API Node,
    Mongo et Redis. Un Whisper qui prend tout fait passer le reste pour lent.
    """
    return max(1, int(os.environ.get("RECITATION_FILS", "4")))


def charger():
    """Charge le modèle une fois, sous verrou.

    Le verrou n'est pas un ornement : deux requêtes arrivant ensemble au
    démarrage chargeraient chacune leur copie des poids et doubleraient la
    mémoire occupée.
    """
    if _etat["modele"] is not None:
        return _etat
    if _etat["erreur"] is not None:
        raise MoteurIndisponible(_etat["erreur"])

    with _verrou:
        if _etat["modele"] is not None:
            return _etat
        if _etat["erreur"] is not None:
            raise MoteurIndisponible(_etat["erreur"])

        backend = _backend_retenu()
        nom = nom_du_modele()
        try:
            if backend == FASTER_WHISPER:
                _charger_faster(nom)
            else:
                _charger_transformers(nom)
            _etat["backend"] = backend
            LOGGER.info("Moteur de récitation prêt : %s / %s", backend, nom)
            return _etat
        except Exception as erreur:  # pragma: no cover - dépend de l'environnement
            _etat["erreur"] = "Modèle %s indisponible via %s : %s" % (nom, backend, erreur)
            LOGGER.warning(_etat["erreur"])
            raise MoteurIndisponible(_etat["erreur"])


def _charger_faster(nom):
    from faster_whisper import WhisperModel
    _etat["modele"] = WhisperModel(
        nom,
        device="cpu",
        # int8 : moitié moins de mémoire, pas de perte audible sur de la
        # récitation, et le serveur n'a pas de carte graphique de toute façon.
        compute_type="int8",
        cpu_threads=_fils(),
    )


def _charger_transformers(nom):
    import torch
    from transformers import WhisperForConditionalGeneration, WhisperProcessor

    processeur = WhisperProcessor.from_pretrained(nom)
    modele = WhisperForConditionalGeneration.from_pretrained(nom)
    modele.eval()
    torch.set_num_threads(_fils())

    _etat["modele"] = modele
    _etat["processeur"] = processeur
    _etat["torch"] = torch


def disponible():
    """Vrai si une transcription est possible ici et maintenant."""
    if not audio.ffmpeg_disponible():
        return False
    try:
        charger()
        return True
    except MoteurIndisponible:
        return False


def transcrire(donnees):
    """Transcrit un extrait audio encodé.

    Renvoie `texte`, `duree`, `confiance` (probabilité moyenne des jetons
    produits, ou None si le moteur ne l'expose pas) et `silence`.
    """
    signal = audio.decoder(donnees)
    secondes = audio.duree(signal)

    if audio.est_silencieux(signal):
        # On rend le silence pour ce qu'il est. Passé au modèle, il produirait
        # une phrase inventée — souvent une formule pieuse, la plus entendue à
        # l'entraînement — qui serait ensuite comptée comme une récitation.
        return {"texte": "", "duree": secondes, "confiance": None, "silence": True}

    etat = charger()
    if etat["backend"] == FASTER_WHISPER:
        texte, confiance = _transcrire_faster(etat["modele"], signal)
    else:
        texte, confiance = _transcrire_transformers(etat, signal)

    return {"texte": texte, "duree": secondes, "confiance": confiance, "silence": False}


def _transcrire_faster(modele, signal):
    import numpy

    segments, _info = modele.transcribe(
        numpy.asarray(signal, dtype=numpy.float32),
        language="ar",
        task="transcribe",
        # Recherche gloutonne et température nulle : sur un texte connu par
        # cœur, l'invention est un défaut, pas une qualité.
        beam_size=1,
        temperature=0.0,
        condition_on_previous_text=False,
    )

    morceaux, logprobs = [], []
    for segment in segments:
        morceaux.append(segment.text.strip())
        if segment.avg_logprob is not None:
            logprobs.append(segment.avg_logprob)

    confiance = None
    if logprobs:
        confiance = round(math.exp(sum(logprobs) / len(logprobs)), 3)

    return " ".join(m for m in morceaux if m).strip(), confiance


def _transcrire_transformers(etat, signal):
    import numpy

    modele, processeur, torch = etat["modele"], etat["processeur"], etat["torch"]

    # Tableau numpy plutôt que liste Python : l'extracteur de caractéristiques
    # convertirait de toute façon, en parcourant les 80 000 échantillons un par
    # un pour deviner leur type.
    entrees = processeur(
        numpy.asarray(signal, dtype=numpy.float32),
        sampling_rate=audio.FREQUENCE,
        return_tensors="pt",
    ).input_features

    commun = dict(
        do_sample=False,
        num_beams=1,
        return_dict_in_generate=True,
        output_scores=True,
    )

    with torch.no_grad():
        if etat.get("jetons_forces") is None:
            try:
                sortie = modele.generate(entrees, language="ar", task="transcribe", **commun)
                etat["jetons_forces"] = False
            except ValueError:
                # Les points de contrôle publiés avant 2023 — dont le Whisper
                # affiné sur la récitation coranique — portent une
                # configuration de génération que transformers refuse
                # d'associer à l'argument `language`. La langue se pose alors
                # par les jetons de départ du décodeur, ce que la même
                # bibliothèque sait toujours faire.
                etat["jetons_forces"] = processeur.get_decoder_prompt_ids(
                    language="ar", task="transcribe"
                )
                sortie = modele.generate(
                    entrees, forced_decoder_ids=etat["jetons_forces"], **commun
                )
        elif etat["jetons_forces"] is False:
            sortie = modele.generate(entrees, language="ar", task="transcribe", **commun)
        else:
            sortie = modele.generate(
                entrees, forced_decoder_ids=etat["jetons_forces"], **commun
            )

    texte = processeur.batch_decode(sortie.sequences, skip_special_tokens=True)[0].strip()
    return texte, _confiance_transformers(modele, sortie, torch)


def _confiance_transformers(modele, sortie, torch):
    """Probabilité moyenne des jetons retenus, entre 0 et 1.

    Mesure issue du modèle, pas une estimation. None si la version installée
    n'expose pas les scores — mieux vaut l'absence de chiffre qu'un chiffre
    décoratif.
    """
    try:
        scores = modele.compute_transition_scores(
            sortie.sequences, sortie.scores, normalize_logits=True
        )
        valeurs = scores[0]
        valeurs = valeurs[torch.isfinite(valeurs)]
        if valeurs.numel() == 0:
            return None
        return round(float(torch.exp(valeurs.mean())), 3)
    except Exception:  # pragma: no cover - dépend de la version installée
        return None
