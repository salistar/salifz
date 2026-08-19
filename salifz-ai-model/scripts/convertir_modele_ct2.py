# -*- coding: utf-8 -*-
"""
Conversion d'un Whisper affiné vers CTranslate2 — Salifz.

Pourquoi cette étape : `tarteel-ai/whisper-base-ar-quran` transcrit la
récitation coranique sans faute sur l'échantillon de mesure, mais il est publié
au format PyTorch. L'exécuter ainsi impose `transformers` et `torch` — trois
gigaoctets d'image — pour une vitesse de 2,54× le temps réel. Converti, il
tourne sous CTranslate2 comme les autres, sans torch et bien plus vite.

    python scripts/convertir_modele_ct2.py

Deux obstacles sont traités ici, tous deux dus à l'âge du point de contrôle
(décembre 2022) ou à celui des bibliothèques installées.
"""

import argparse
import os
import shutil
import sys

# transformers sonde TensorFlow au chargement ; l'installation locale casse
# sous Python 3.9. La conversion n'a que faire de TensorFlow.
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("TRANSFORMERS_NO_TF", "1")

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, RACINE)

MODELE_PAR_DEFAUT = "tarteel-ai/whisper-base-ar-quran"
SORTIE_PAR_DEFAUT = os.path.join(RACINE, "models", "recitation", "tarteel-base-ct2")

# Ce que faster-whisper cherche dans le dossier du modèle, en plus de ce que
# produit le convertisseur. Sans `tokenizer.json`, il retombe silencieusement
# sur le vocabulaire de `whisper-tiny` — celui d'un autre modèle.
FICHIERS_REQUIS = ("tokenizer.json", "preprocessor_config.json")


def convertisseur_compatible():
    """Le convertisseur de CTranslate2, réconcilié avec transformers installé.

    `ctranslate2` 4.8 passe `dtype=` à `from_pretrained`. transformers ne
    connaît cet argument que depuis la 4.56 ; avant, il s'appelle
    `torch_dtype`. La conversion échoue donc sur un `TypeError` qui ne dit rien
    du modèle.

    `load_model` existe précisément pour être redéfinie : on traduit l'argument
    au passage plutôt que de contraindre les versions installées, ce qui
    casserait le reste du projet.
    """
    from ctranslate2.converters import TransformersConverter

    class Convertisseur(TransformersConverter):
        def load_model(self, model_class, model_name_or_path, **kwargs):
            try:
                return model_class.from_pretrained(model_name_or_path, **kwargs)
            except TypeError as erreur:
                if "dtype" not in str(erreur) or "dtype" not in kwargs:
                    raise
                kwargs["torch_dtype"] = kwargs.pop("dtype")
                return model_class.from_pretrained(model_name_or_path, **kwargs)

    return Convertisseur


def source_locale(nom, telecharger=False):
    """Chemin du modèle sur le disque.

    `telecharger` est faux par défaut : lancé à la main, ce script ne doit pas
    faire descendre 277 Mo à l'insu de celui qui l'exécute. La construction de
    l'image, elle, le passe à vrai — c'est son travail.
    """
    if os.path.isdir(nom):
        return nom
    from huggingface_hub import snapshot_download

    return snapshot_download(
        nom,
        allow_patterns=["*.json", "*.txt", "pytorch_model.bin"],
        local_files_only=not telecharger,
    )


def completer_dossier(source, sortie):
    """Ajoute au dossier converti ce que faster-whisper attend en plus.

    `tokenizer.json` n'existe pas dans les dépôts publiés avant l'usage
    généralisé des tokenizers rapides : le dépôt Tarteel porte `vocab.json`,
    `merges.txt` et `added_tokens.json`. On le fabrique depuis le tokenizer
    rapide, ce qui préserve les jetons ajoutés — les ignorer donnerait un
    vocabulaire décalé et une transcription méconnaissable.
    """
    from transformers import WhisperTokenizerFast

    chemin_tokenizer = os.path.join(sortie, "tokenizer.json")
    if not os.path.exists(chemin_tokenizer):
        tokenizer = WhisperTokenizerFast.from_pretrained(source)
        tokenizer.backend_tokenizer.save(chemin_tokenizer)
        print("  tokenizer.json fabriqué depuis le tokenizer rapide")

    chemin_preproc = os.path.join(sortie, "preprocessor_config.json")
    if not os.path.exists(chemin_preproc):
        origine = os.path.join(source, "preprocessor_config.json")
        if os.path.exists(origine):
            shutil.copyfile(origine, chemin_preproc)
            print("  preprocessor_config.json copié")

    manquants = [f for f in FICHIERS_REQUIS if not os.path.exists(os.path.join(sortie, f))]
    if manquants:
        raise RuntimeError("fichiers manquants après conversion : %s" % ", ".join(manquants))


def verifier(sortie):
    """Charge le modèle converti et transcrit un verset connu.

    Une conversion qui produit des fichiers n'est pas une conversion réussie :
    un vocabulaire décalé rend du texte, simplement pas le bon.
    """
    from faster_whisper import WhisperModel

    # Charger suffit déjà à écarter les deux ratés silencieux : des poids
    # illisibles, et un tokenizer que faster-whisper remplacerait par celui de
    # `whisper-tiny` sans rien dire.
    modele = WhisperModel(sortie, device="cpu", compute_type="int8", cpu_threads=4)
    print("  modèle rechargé, vocabulaire de %d jetons" % modele.hf_tokenizer.get_vocab_size())

    echantillon = os.path.join(
        RACINE, "data", "raw", "quran", "audio", "husary", "surah_112", "112003.mp3"
    )
    if not os.path.exists(echantillon):
        # Cas de la construction d'image : l'audio de référence en est exclu.
        print("  (pas d'audio de référence ici — transcription non vérifiée)")
        return

    segments, _ = modele.transcribe(echantillon, language="ar", beam_size=1, temperature=0.0)
    texte = " ".join(s.text.strip() for s in segments).strip()
    print("  transcription de 112:3 → %s" % texte)


def principal():
    analyseur = argparse.ArgumentParser(description="Convertit un Whisper vers CTranslate2")
    analyseur.add_argument("--modele", default=MODELE_PAR_DEFAUT)
    analyseur.add_argument("--sortie", default=SORTIE_PAR_DEFAUT)
    analyseur.add_argument("--quantification", default="int8")
    analyseur.add_argument(
        "--telecharger", action="store_true",
        help="autorise le rapatriement du modele depuis HuggingFace",
    )
    options = analyseur.parse_args()

    source = source_locale(options.modele, telecharger=options.telecharger)
    print("source     : %s" % source)
    print("sortie     : %s" % options.sortie)
    print("")

    Convertisseur = convertisseur_compatible()
    Convertisseur(source).convert(
        options.sortie, quantization=options.quantification, force=True
    )
    print("  poids convertis (%s)" % options.quantification)

    completer_dossier(source, options.sortie)
    verifier(options.sortie)

    total = sum(
        os.path.getsize(os.path.join(options.sortie, f))
        for f in os.listdir(options.sortie)
    )
    print("")
    print("dossier converti : %.0f Mo" % (total / 1024.0 / 1024.0))
    return 0


if __name__ == "__main__":
    sys.exit(principal())
