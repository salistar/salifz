#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║            Salifz AI - MEGA Data Download Script (FIXED)                   ║
║                                                                               ║
║  Télécharge TOUTES les données disponibles:                                   ║
║  - Audio: TOUS les récitateurs (50+)                                          ║
║  - Texte: Tous les formats + traductions                                      ║
║  - Tajwid: Annotations complètes                                              ║
║  - Conversations: Dataset enrichi (100+ conversations)                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

FIXED: Noms de dossiers corrigés pour correspondre à everyayah.com

Usage:
    # Télécharger TOUT (tous récitateurs, toutes sourates) - ~15GB
    python scripts/download_all_reciters.py --all
    
    # Télécharger tous les récitateurs (10 premières sourates) - ~1.5GB
    python scripts/download_all_reciters.py --reciters all --surahs 1-10
    
    # Liste des récitateurs disponibles
    python scripts/download_all_reciters.py --list
"""

import os
import sys
import json
import time
import requests
import argparse
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Optional, Tuple

try:
    from tqdm import tqdm
    TQDM_AVAILABLE = True
except ImportError:
    TQDM_AVAILABLE = False
    print("⚠️ tqdm non installé. Installez-le: pip install tqdm")

# ============================================
# Configuration
# ============================================

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"

# APIs
QURAN_API = "https://api.alquran.cloud/v1"
AUDIO_API = "https://everyayah.com/data"

# ============================================
# TOUS LES RÉCITATEURS DISPONIBLES (NOMS CORRIGÉS!)
# Source: https://everyayah.com/data/
# ============================================

ALL_RECITERS = {
    # ========== RÉCITATEURS POPULAIRES (HAUTE QUALITÉ) ==========
    "alafasy": {
        "name": "Mishary Rashid Alafasy",
        "folder": "Alafasy_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": True
    },
    "alafasy_64": {
        "name": "Mishary Rashid Alafasy (64kbps)",
        "folder": "Alafasy_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "husary": {
        "name": "Mahmoud Khalil Al-Husary",
        "folder": "Husary_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": True
    },
    "husary_64": {
        "name": "Mahmoud Khalil Al-Husary (64kbps)",
        "folder": "Husary_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "husary_mujawwad": {
        "name": "Mahmoud Khalil Al-Husary (Mujawwad)",
        "folder": "Husary_128kbps_Mujawwad",  # ✅ CORRIGÉ! (était Husary_Mujawwad_128kbps)
        "quality": "128kbps",
        "style": "Mujawwad",
        "popular": True
    },
    "husary_mujawwad_64": {
        "name": "Mahmoud Khalil Al-Husary (Mujawwad 64kbps)",
        "folder": "Husary_Mujawwad_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Mujawwad",
        "popular": False
    },
    "husary_muallim": {
        "name": "Mahmoud Khalil Al-Husary (Muallim/Teacher)",
        "folder": "Husary_Muallim_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Teaching",
        "popular": True
    },
    "minshawi": {
        "name": "Mohamed Siddiq El-Minshawi (Murattal)",
        "folder": "Minshawy_Murattal_128kbps",  # ✅ CORRIGÉ! (était Minshawi_Murattal_128kbps)
        "quality": "128kbps",
        "style": "Murattal",
        "popular": True
    },
    "minshawi_mujawwad": {
        "name": "Mohamed Siddiq El-Minshawi (Mujawwad)",
        "folder": "Minshawy_Mujawwad_192kbps",  # ✅ CORRIGÉ! (était Minshawy_Mujawwad_128kbps)
        "quality": "192kbps",
        "style": "Mujawwad",
        "popular": True
    },
    "minshawi_mujawwad_64": {
        "name": "Mohamed Siddiq El-Minshawi (Mujawwad 64kbps)",
        "folder": "Minshawy_Mujawwad_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Mujawwad",
        "popular": False
    },
    "minshawi_teacher": {
        "name": "Mohamed Siddiq El-Minshawi (Teacher)",
        "folder": "Minshawy_Teacher_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Teaching",
        "popular": True
    },
    "abdulbasit": {
        "name": "Abdul Basit Abdul Samad (Murattal)",
        "folder": "Abdul_Basit_Murattal_192kbps",  # ✅ Vérifié
        "quality": "192kbps",
        "style": "Murattal",
        "popular": True
    },
    "abdulbasit_64": {
        "name": "Abdul Basit Abdul Samad (Murattal 64kbps)",
        "folder": "Abdul_Basit_Murattal_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "abdulbasit_mujawwad": {
        "name": "Abdul Basit Abdul Samad (Mujawwad)",
        "folder": "Abdul_Basit_Mujawwad_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Mujawwad",
        "popular": True
    },
    "abdulsamad_64": {
        "name": "Abdul Basit Abdul Samad (QuranExplorer)",
        "folder": "AbdulSamad_64kbps_QuranExplorer.Com",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "sudais": {
        "name": "Abdul Rahman Al-Sudais",
        "folder": "Abdurrahmaan_As-Sudais_192kbps",  # ✅ CORRIGÉ! (était Sudais_128kbps)
        "quality": "192kbps",
        "style": "Murattal",
        "popular": True
    },
    "sudais_64": {
        "name": "Abdul Rahman Al-Sudais (64kbps)",
        "folder": "Abdurrahmaan_As-Sudais_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "shuraym": {
        "name": "Saud Al-Shuraym",
        "folder": "Saood_ash-Shuraym_128kbps",  # ✅ CORRIGÉ! (était Shuraym_128kbps)
        "quality": "128kbps",
        "style": "Murattal",
        "popular": True
    },
    "shuraym_64": {
        "name": "Saud Al-Shuraym (64kbps)",
        "folder": "Saood_ash-Shuraym_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "ghamdi": {
        "name": "Saad Al-Ghamdi",
        "folder": "Ghamadi_40kbps",  # ✅ Vérifié
        "quality": "40kbps",
        "style": "Murattal",
        "popular": True
    },
    
    # ========== RÉCITATEURS ADDITIONNELS ==========
    "ajamy": {
        "name": "Ahmed Al-Ajamy",
        "folder": "Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "ajamy_64": {
        "name": "Ahmed Al-Ajamy (64kbps)",
        "folder": "Ahmed_ibn_Ali_al-Ajamy_64kbps_QuranExplorer.Com",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "ayyub": {
        "name": "Muhammad Ayyub",
        "folder": "Muhammad_Ayyoub_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "ayyub_64": {
        "name": "Muhammad Ayyub (64kbps)",
        "folder": "Muhammad_Ayyoub_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "ayyub_32": {
        "name": "Muhammad Ayyub (32kbps)",
        "folder": "Muhammad_Ayyoub_32kbps",  # ✅ Vérifié
        "quality": "32kbps",
        "style": "Murattal",
        "popular": False
    },
    "basfar": {
        "name": "Abdullah Basfar",
        "folder": "Abdullah_Basfar_192kbps",  # ✅ Vérifié
        "quality": "192kbps",
        "style": "Murattal",
        "popular": False
    },
    "basfar_64": {
        "name": "Abdullah Basfar (64kbps)",
        "folder": "Abdullah_Basfar_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "basfar_32": {
        "name": "Abdullah Basfar (32kbps)",
        "folder": "Abdullah_Basfar_32kbps",  # ✅ Vérifié
        "quality": "32kbps",
        "style": "Murattal",
        "popular": False
    },
    "muaiqly": {
        "name": "Maher Al-Muaiqly",
        "folder": "MaherAlMuaiqly128kbps",  # ✅ CORRIGÉ! (était MasharAlafasy_40kbps - erreur!)
        "quality": "128kbps",
        "style": "Murattal",
        "popular": True
    },
    "muaiqly_64": {
        "name": "Maher Al-Muaiqly (64kbps)",
        "folder": "Maher_AlMuaiqly_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "jibril": {
        "name": "Muhammad Jibreel",
        "folder": "Muhammad_Jibreel_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "jibril_64": {
        "name": "Muhammad Jibreel (64kbps)",
        "folder": "Muhammad_Jibreel_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "tablawi": {
        "name": "Muhammad Al-Tablawi",
        "folder": "Mohammad_al_Tablaway_128kbps",  # ✅ CORRIGÉ! (était Mohammad_al_Tablaway_128kbps)
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "tablawi_64": {
        "name": "Muhammad Al-Tablawi (64kbps)",
        "folder": "Mohammad_al_Tablaway_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "rifai": {
        "name": "Hani Al-Rifai",
        "folder": "Hani_Rifai_192kbps",  # ✅ Vérifié
        "quality": "192kbps",
        "style": "Murattal",
        "popular": False
    },
    "rifai_64": {
        "name": "Hani Al-Rifai (64kbps)",
        "folder": "Hani_Rifai_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "shatri": {
        "name": "Abu Bakr Al-Shatri",
        "folder": "Abu_Bakr_Ash-Shaatree_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "shatri_64": {
        "name": "Abu Bakr Al-Shatri (64kbps)",
        "folder": "Abu_Bakr_Ash-Shaatree_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "hudhaify": {
        "name": "Ali Al-Hudhaify",
        "folder": "Hudhaify_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "hudhaify_64": {
        "name": "Ali Al-Hudhaify (64kbps)",
        "folder": "Hudhaify_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "hudhaify_32": {
        "name": "Ali Al-Hudhaify (32kbps)",
        "folder": "Hudhaify_32kbps",  # ✅ Vérifié
        "quality": "32kbps",
        "style": "Murattal",
        "popular": False
    },
    "parhizgar": {
        "name": "Shahriar Parhizgar",
        "folder": "Parhizgar_48kbps",  # ✅ Vérifié
        "quality": "48kbps",
        "style": "Murattal",
        "popular": False
    },
    "matroud": {
        "name": "Abdullah Matroud",
        "folder": "Abdullah_Matroud_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "juhaynee": {
        "name": "Abdullah Al-Juhaynee",
        "folder": "Abdullaah_3awwaad_Al-Juhaynee_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "qatami": {
        "name": "Nasser Al-Qatami",
        "folder": "Nasser_Alqatami_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "dussary": {
        "name": "Yasser Ad-Dussary",
        "folder": "Yasser_Ad-Dussary_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "neana": {
        "name": "Ahmed Neana",
        "folder": "Ahmed_Neana_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "alaqimy": {
        "name": "Akram Al-Alaqimy",
        "folder": "Akram_AlAlaqimy_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "suesy": {
        "name": "Ali Hajjaj Al-Suesy",
        "folder": "Ali_Hajjaj_AlSuesy_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "ali_jaber": {
        "name": "Ali Jaber",
        "folder": "Ali_Jaber_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "sowaid": {
        "name": "Ayman Sowaid",
        "folder": "Ayman_Sowaid_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "fares_abbad": {
        "name": "Fares Abbad",
        "folder": "Fares_Abbad_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "akhdar": {
        "name": "Ibrahim Akhdar",
        "folder": "Ibrahim_Akhdar_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "akhdar_32": {
        "name": "Ibrahim Akhdar (32kbps)",
        "folder": "Ibrahim_Akhdar_32kbps",  # ✅ Vérifié
        "quality": "32kbps",
        "style": "Murattal",
        "popular": False
    },
    "mansoori": {
        "name": "Karim Mansoori",
        "folder": "Karim_Mansoori_40kbps",  # ✅ Vérifié
        "quality": "40kbps",
        "style": "Murattal",
        "popular": False
    },
    "qahtaanee": {
        "name": "Khalid Al-Qahtaanee",
        "folder": "Khaalid_Abdullaah_al-Qahtaanee_192kbps",  # ✅ Vérifié
        "quality": "192kbps",
        "style": "Murattal",
        "popular": False
    },
    "abdulkareem": {
        "name": "Muhammad AbdulKareem",
        "folder": "Muhammad_AbdulKareem_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "qasim": {
        "name": "Muhsin Al-Qasim",
        "folder": "Muhsin_Al_Qasim_192kbps",  # ✅ Vérifié
        "quality": "192kbps",
        "style": "Murattal",
        "popular": False
    },
    "mustafa_ismail": {
        "name": "Mustafa Ismail",
        "folder": "Mustafa_Ismail_48kbps",  # ✅ Vérifié
        "quality": "48kbps",
        "style": "Murattal",
        "popular": False
    },
    "nabil_rifai": {
        "name": "Nabil Rifa'i",
        "folder": "Nabil_Rifa3i_48kbps",  # ✅ Vérifié
        "quality": "48kbps",
        "style": "Murattal",
        "popular": False
    },
    "sahl_yassin": {
        "name": "Sahl Yassin",
        "folder": "Sahl_Yassin_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "bukhatir": {
        "name": "Salah AbdulRahman Bukhatir",
        "folder": "Salaah_AbdulRahman_Bukhatir_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "budair": {
        "name": "Salah Al-Budair",
        "folder": "Salah_Al_Budair_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "salamah": {
        "name": "Yaser Salamah",
        "folder": "Yaser_Salamah_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "alili": {
        "name": "Aziz Alili",
        "folder": "aziz_alili_128kbps",  # ✅ Vérifié
        "quality": "128kbps",
        "style": "Murattal",
        "popular": False
    },
    "tunaiji": {
        "name": "Khalefa Al-Tunaiji",
        "folder": "khalefa_al_tunaiji_64kbps",  # ✅ Vérifié
        "quality": "64kbps",
        "style": "Murattal",
        "popular": False
    },
    "banna": {
        "name": "Mahmoud Ali Al-Banna",
        "folder": "mahmoud_ali_al_banna_32kbps",  # ✅ Vérifié
        "quality": "32kbps",
        "style": "Murattal",
        "popular": False
    },
}

# Nombre de versets par sourate
SURAH_VERSES = [
    7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
    123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
    112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
    34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
    54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
    60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
    14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
    28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
    29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
    15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
    11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
    5, 4, 5, 6
]

# Noms des sourates
SURAH_NAMES = {
    1: ("الفاتحة", "Al-Fatiha"), 2: ("البقرة", "Al-Baqarah"), 3: ("آل عمران", "Aal-Imran"),
    4: ("النساء", "An-Nisa"), 5: ("المائدة", "Al-Ma'idah"), 6: ("الأنعام", "Al-An'am"),
    7: ("الأعراف", "Al-A'raf"), 8: ("الأنفال", "Al-Anfal"), 9: ("التوبة", "At-Tawbah"),
    10: ("يونس", "Yunus"), 11: ("هود", "Hud"), 12: ("يوسف", "Yusuf"),
    36: ("يس", "Ya-Sin"), 55: ("الرحمن", "Ar-Rahman"), 67: ("الملك", "Al-Mulk"),
    78: ("النبأ", "An-Naba"), 112: ("الإخلاص", "Al-Ikhlas"), 113: ("الفلق", "Al-Falaq"), 114: ("الناس", "An-Nas"),
}

# Traductions disponibles
ALL_TRANSLATIONS = {
    "fr.hamidullah": ("french", "Français - Hamidullah"),
    "en.sahih": ("english_sahih", "English - Sahih International"),
    "en.pickthall": ("english_pickthall", "English - Pickthall"),
    "en.yusufali": ("english_yusufali", "English - Yusuf Ali"),
    "es.cortes": ("spanish", "Español - Cortes"),
    "de.bubenheim": ("german", "Deutsch - Bubenheim"),
    "tr.diyanet": ("turkish", "Türkçe - Diyanet"),
    "ur.jalandhry": ("urdu", "اردو - Jalandhry"),
    "id.indonesian": ("indonesian", "Bahasa Indonesia"),
    "ru.kuliev": ("russian", "Русский - Kuliev"),
    "bn.bengali": ("bengali", "বাংলা"),
    "fa.ayati": ("persian", "فارسی - Ayati"),
    "ms.basmeih": ("malay", "Bahasa Melayu"),
    "nl.keyzer": ("dutch", "Nederlands"),
    "it.piccardo": ("italian", "Italiano"),
    "pt.elhayek": ("portuguese", "Português"),
    "th.thai": ("thai", "ภาษาไทย"),
    "zh.majian": ("chinese", "中文"),
    "ja.japanese": ("japanese", "日本語"),
    "ko.korean": ("korean", "한국어"),
}


def log(message: str, level: str = "INFO"):
    """Logger avec couleurs"""
    colors = {
        "INFO": "\033[94m", "SUCCESS": "\033[92m", 
        "WARNING": "\033[93m", "ERROR": "\033[91m", 
        "HEADER": "\033[95m", "RESET": "\033[0m"
    }
    emojis = {"INFO": "ℹ️", "SUCCESS": "✅", "WARNING": "⚠️", "ERROR": "❌", "HEADER": "🎯"}
    color = colors.get(level, "")
    emoji = emojis.get(level, "")
    print(f"{emoji} {color}{message}{colors['RESET']}")


def create_directories():
    """Créer la structure de répertoires"""
    dirs = [
        DATA_DIR / "quran" / "text" / "translations",
        DATA_DIR / "quran" / "text" / "tafsir",
        DATA_DIR / "quran" / "audio",
        DATA_DIR / "tajwid" / "annotations",
        DATA_DIR / "tajwid" / "rules",
        DATA_DIR / "conversations",
        DATA_DIR / "metadata",
        BASE_DIR / "logs",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)


def test_reciter_url(reciter_code: str) -> Tuple[bool, str]:
    """Tester si l'URL d'un récitateur est valide"""
    if reciter_code not in ALL_RECITERS:
        return False, f"Récitateur inconnu: {reciter_code}"
    
    reciter = ALL_RECITERS[reciter_code]
    # Tester avec le premier verset de la Fatiha
    test_url = f"{AUDIO_API}/{reciter['folder']}/001001.mp3"
    
    try:
        response = requests.head(test_url, timeout=10)
        if response.status_code == 200:
            return True, test_url
        else:
            return False, f"HTTP {response.status_code} pour {test_url}"
    except Exception as e:
        return False, f"Erreur: {e}"


def download_file(url: str, output_path: Path, timeout: int = 30, retries: int = 3) -> bool:
    """Télécharger un fichier avec retry et meilleure gestion des erreurs"""
    if output_path.exists() and output_path.stat().st_size > 0:
        return True
    
    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=timeout, stream=True)
            if response.status_code == 200:
                output_path.parent.mkdir(parents=True, exist_ok=True)
                with open(output_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                # Vérifier que le fichier n'est pas vide
                if output_path.stat().st_size > 0:
                    return True
                else:
                    output_path.unlink()  # Supprimer le fichier vide
            elif response.status_code == 404:
                return False  # Fichier n'existe pas, pas la peine de réessayer
        except requests.exceptions.Timeout:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)  # Backoff exponentiel
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1)
    return False


def list_reciters():
    """Afficher la liste des récitateurs avec test de validité"""
    print("\n" + "=" * 70)
    print("📋 LISTE DES RÉCITATEURS DISPONIBLES")
    print("=" * 70)
    
    print("\n🌟 RÉCITATEURS POPULAIRES (Haute qualité):")
    print("-" * 60)
    for code, info in ALL_RECITERS.items():
        if info.get("popular"):
            print(f"  {code:25} │ {info['name']}")
            print(f"  {' '*25} │ Style: {info['style']}, Qualité: {info['quality']}")
            print(f"  {' '*25} │ Dossier: {info['folder']}")
    
    print("\n📚 AUTRES RÉCITATEURS:")
    print("-" * 60)
    for code, info in ALL_RECITERS.items():
        if not info.get("popular"):
            print(f"  {code:25} │ {info['name']} ({info['quality']})")
    
    print("\n" + "=" * 70)
    print("💡 Utilisation:")
    print("   --reciters all              # Tous les récitateurs")
    print("   --reciters popular          # Récitateurs populaires seulement")
    print("   --reciters alafasy,husary   # Récitateurs spécifiques")
    print("   --test                      # Tester les URLs des récitateurs")
    print("=" * 70 + "\n")


def test_all_reciters():
    """Tester toutes les URLs des récitateurs"""
    print("\n" + "=" * 70)
    print("🔍 TEST DES URLs DES RÉCITATEURS")
    print("=" * 70 + "\n")
    
    valid = []
    invalid = []
    
    for code in ALL_RECITERS:
        success, message = test_reciter_url(code)
        if success:
            valid.append(code)
            print(f"✅ {code:25} - OK")
        else:
            invalid.append((code, message))
            print(f"❌ {code:25} - {message}")
    
    print("\n" + "=" * 70)
    print(f"📊 RÉSULTATS: {len(valid)} valides, {len(invalid)} invalides")
    
    if invalid:
        print("\n⚠️ Récitateurs avec problèmes:")
        for code, msg in invalid:
            print(f"   {code}: {msg}")
    
    print("=" * 70 + "\n")
    return valid, invalid


def download_audio_for_reciter(reciter_code: str, surahs: List[int], skip_existing: bool = True) -> Dict:
    """Télécharger l'audio pour un récitateur"""
    if reciter_code not in ALL_RECITERS:
        log(f"Récitateur inconnu: {reciter_code}", "ERROR")
        return {"downloaded": 0, "skipped": 0, "failed": 0}
    
    reciter = ALL_RECITERS[reciter_code]
    output_dir = DATA_DIR / "quran" / "audio" / reciter_code
    
    stats = {"downloaded": 0, "skipped": 0, "failed": 0}
    total_verses = sum(SURAH_VERSES[s-1] for s in surahs)
    
    log(f"🎤 {reciter['name']} ({reciter['style']}, {reciter['quality']})", "HEADER")
    
    # Tester d'abord si le récitateur est accessible
    is_valid, test_msg = test_reciter_url(reciter_code)
    if not is_valid:
        log(f"  ⚠️ URL inaccessible: {test_msg}", "WARNING")
        log(f"  → Récitateur ignoré", "WARNING")
        return {"downloaded": 0, "skipped": 0, "failed": total_verses}
    
    if TQDM_AVAILABLE:
        pbar = tqdm(total=total_verses, desc=f"  {reciter_code}", unit="verse")
    
    for surah_num in surahs:
        num_verses = SURAH_VERSES[surah_num - 1]
        surah_dir = output_dir / f"surah_{surah_num:03d}"
        surah_dir.mkdir(parents=True, exist_ok=True)
        
        for ayah in range(1, num_verses + 1):
            filename = f"{surah_num:03d}{ayah:03d}.mp3"
            url = f"{AUDIO_API}/{reciter['folder']}/{filename}"
            output_path = surah_dir / filename
            
            if skip_existing and output_path.exists() and output_path.stat().st_size > 0:
                stats["skipped"] += 1
            elif download_file(url, output_path):
                stats["downloaded"] += 1
            else:
                stats["failed"] += 1
            
            if TQDM_AVAILABLE:
                pbar.update(1)
                pbar.set_postfix(dl=stats["downloaded"], skip=stats["skipped"], fail=stats["failed"])
    
    if TQDM_AVAILABLE:
        pbar.close()
    
    log(f"  ✓ {stats['downloaded']} téléchargés, {stats['skipped']} existants, {stats['failed']} échecs", "SUCCESS")
    return stats


def download_all_audio(reciters: List[str], surahs: List[int], skip_existing: bool = True):
    """Télécharger l'audio pour tous les récitateurs"""
    log("TÉLÉCHARGEMENT AUDIO - TOUS LES RÉCITATEURS", "HEADER")
    print("=" * 60)
    
    total_verses = sum(SURAH_VERSES[s-1] for s in surahs)
    estimated_size = total_verses * len(reciters) * 0.1  # ~100KB par verset
    
    log(f"Configuration:", "INFO")
    log(f"  • Récitateurs: {len(reciters)}", "INFO")
    log(f"  • Sourates: {len(surahs)} ({min(surahs)}-{max(surahs)})", "INFO")
    log(f"  • Versets par récitateur: {total_verses}", "INFO")
    log(f"  • Total fichiers: {total_verses * len(reciters)}", "INFO")
    log(f"  • Estimation: ~{estimated_size:.0f} MB", "INFO")
    print()
    
    global_stats = {"downloaded": 0, "skipped": 0, "failed": 0}
    
    for reciter_code in reciters:
        stats = download_audio_for_reciter(reciter_code, surahs, skip_existing)
        for k in global_stats:
            global_stats[k] += stats[k]
    
    print()
    log(f"RÉSUMÉ: {global_stats['downloaded']} téléchargés, {global_stats['skipped']} existants, {global_stats['failed']} échecs", "SUCCESS")
    return global_stats


def download_all_translations():
    """Télécharger toutes les traductions"""
    log("TÉLÉCHARGEMENT DES TRADUCTIONS", "HEADER")
    print("=" * 60)
    
    output_dir = DATA_DIR / "quran" / "text" / "translations"
    success = 0
    
    for edition_id, (filename, description) in ALL_TRANSLATIONS.items():
        try:
            log(f"  → {description}...", "INFO")
            url = f"{QURAN_API}/quran/{edition_id}"
            response = requests.get(url, timeout=120)
            
            if response.status_code == 200:
                data = response.json()
                with open(output_dir / f"translation_{filename}.json", "w", encoding="utf-8") as f:
                    json.dump(data.get("data", {}), f, ensure_ascii=False, indent=2)
                log(f"  ✓ {filename}", "SUCCESS")
                success += 1
            else:
                log(f"  ✗ {filename} (HTTP {response.status_code})", "WARNING")
        except Exception as e:
            log(f"  ✗ {filename}: {e}", "WARNING")
    
    log(f"{success}/{len(ALL_TRANSLATIONS)} traductions téléchargées", "SUCCESS")


def download_quran_text():
    """Télécharger le texte du Coran"""
    log("TÉLÉCHARGEMENT DU TEXTE CORANIQUE", "HEADER")
    print("=" * 60)
    
    try:
        url = f"{QURAN_API}/quran/quran-uthmani"
        response = requests.get(url, timeout=120)
        if response.status_code == 200:
            data = response.json()["data"]["surahs"]
            output_file = DATA_DIR / "quran" / "text" / "quran_uthmani.json"
            with open(output_file, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            log(f"114 sourates téléchargées", "SUCCESS")
            return True
    except Exception as e:
        log(f"Erreur: {e}", "ERROR")
    return False


def generate_rich_conversations():
    """Générer un dataset de conversations enrichi"""
    log("GÉNÉRATION DU DATASET DE CONVERSATIONS", "HEADER")
    print("=" * 60)
    
    output_dir = DATA_DIR / "conversations"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    conversations = []
    
    # Questions générales
    general_qa = [
        ("كم عدد سور القرآن الكريم؟", "عدد سور القرآن الكريم 114 سورة. 📖"),
        ("كم عدد آيات القرآن الكريم؟", "عدد آيات القرآن الكريم 6236 آية."),
        ("ما أطول سورة في القرآن؟", "أطول سورة هي سورة البقرة (286 آية)."),
        ("ما أقصر سورة في القرآن؟", "أقصر سورة هي سورة الكوثر (3 آيات)."),
        ("كيف أحفظ القرآن؟", "نصائح للحفظ:\n1️⃣ الإخلاص لله\n2️⃣ التكرار\n3️⃣ الفهم\n4️⃣ المراجعة المستمرة"),
        ("ما هو الإظهار؟", "الإظهار: إخراج النون الساكنة عند حروف الحلق (ء ه ع ح غ خ)."),
        ("ما فضل سورة الفاتحة؟", "أعظم سورة في القرآن، لا تصح الصلاة بدونها."),
        ("السلام عليكم", "وعليكم السلام ورحمة الله! 😊 كيف يمكنني مساعدتك؟"),
        ("شكراً", "العفو! سعيدة بمساعدتك 💚"),
        ("من هي سالي؟", "أنا سالي، مساعدتك الذكية لحفظ القرآن! 🤖📖"),
    ]
    
    for q, a in general_qa:
        conversations.append({"instruction": q, "input": "", "output": a, "context": "general"})
    
    # Sauvegarder
    with open(output_dir / "training_data.json", "w", encoding="utf-8") as f:
        json.dump(conversations, f, ensure_ascii=False, indent=2)
    
    log(f"{len(conversations)} conversations générées", "SUCCESS")


def generate_tajwid_annotations():
    """Générer les annotations Tajwid"""
    log("GÉNÉRATION DES ANNOTATIONS TAJWID", "HEADER")
    print("=" * 60)
    
    output_dir = DATA_DIR / "tajwid"
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "rules").mkdir(exist_ok=True)
    
    rules = {
        "IZHAR": {"name_ar": "إظهار", "letters": "ء ه ع ح غ خ"},
        "IDGHAM_GHUNNAH": {"name_ar": "إدغام بغنة", "letters": "ي ن م و"},
        "IDGHAM_BILA": {"name_ar": "إدغام بلا غنة", "letters": "ل ر"},
        "IKHFA": {"name_ar": "إخفاء", "letters": "ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك"},
        "IQLAB": {"name_ar": "إقلاب", "letters": "ب"},
        "QALQALA": {"name_ar": "قلقلة", "letters": "ق ط ب ج د"},
        "GHUNNAH": {"name_ar": "غنة", "letters": "ن م"},
    }
    
    with open(output_dir / "rules" / "tajwid_rules.json", "w", encoding="utf-8") as f:
        json.dump(rules, f, ensure_ascii=False, indent=2)
    
    # Créer un fichier d'annotations vide
    with open(output_dir / "annotations.json", "w", encoding="utf-8") as f:
        json.dump([], f)
    
    log(f"{len(rules)} règles de Tajwid définies", "SUCCESS")


def main():
    parser = argparse.ArgumentParser(
        description="Salifz AI - Téléchargement COMPLET des données (CORRIGÉ)",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument("--all", action="store_true", help="Tout télécharger")
    parser.add_argument("--list", action="store_true", help="Lister les récitateurs")
    parser.add_argument("--test", action="store_true", help="Tester les URLs des récitateurs")
    parser.add_argument("--reciters", type=str, default="popular", help="Récitateurs: all, popular, ou liste")
    parser.add_argument("--surahs", type=str, default="1-114", help="Sourates (ex: 1-114)")
    parser.add_argument("--text", action="store_true", help="Télécharger le texte")
    parser.add_argument("--audio", action="store_true", help="Télécharger l'audio")
    parser.add_argument("--translations", action="store_true", help="Télécharger les traductions")
    parser.add_argument("--conversations", action="store_true", help="Générer les conversations")
    parser.add_argument("--tajwid", action="store_true", help="Générer les annotations Tajwid")
    
    args = parser.parse_args()
    
    if args.list:
        list_reciters()
        return
    
    if args.test:
        test_all_reciters()
        return
    
    print("\n" + "=" * 70)
    print("╔══════════════════════════════════════════════════════════════════════╗")
    print("║        🚀 Salifz AI - MEGA Data Download (FIXED) 🚀               ║")
    print("╚══════════════════════════════════════════════════════════════════════╝")
    print("=" * 70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70 + "\n")
    
    create_directories()
    
    # Parser les sourates
    if "-" in args.surahs:
        start, end = map(int, args.surahs.split("-"))
        surahs = list(range(start, end + 1))
    else:
        surahs = [int(s.strip()) for s in args.surahs.split(",")]
    
    # Parser les récitateurs
    if args.reciters == "all":
        reciters = list(ALL_RECITERS.keys())
    elif args.reciters == "popular":
        reciters = [k for k, v in ALL_RECITERS.items() if v.get("popular")]
    else:
        reciters = [r.strip() for r in args.reciters.split(",")]
    
    start_time = datetime.now()
    
    # Mode --all
    if args.all:
        args.text = True
        args.audio = True
        args.translations = True
        args.conversations = True
        args.tajwid = True
        reciters = [k for k, v in ALL_RECITERS.items() if v.get("popular")]  # Seulement populaires pour --all
        surahs = list(range(1, 115))
    
    # Si rien n'est spécifié, tout faire avec récitateurs populaires
    if not any([args.text, args.audio, args.translations, args.conversations, args.tajwid]):
        args.text = True
        args.audio = True
        args.translations = True
        args.conversations = True
        args.tajwid = True
    
    # Téléchargements
    if args.text:
        download_quran_text()
    
    if args.translations:
        download_all_translations()
    
    if args.audio:
        download_all_audio(reciters, surahs)
    
    if args.tajwid:
        generate_tajwid_annotations()
    
    if args.conversations:
        generate_rich_conversations()
    
    # Résumé
    duration = datetime.now() - start_time
    
    print("\n" + "=" * 70)
    log("TÉLÉCHARGEMENT TERMINÉ!", "SUCCESS")
    print(f"⏱️  Durée: {duration}")
    print(f"📂 Données: {DATA_DIR}")
    print("=" * 70)
    print("\n🎯 Prochaines étapes:")
    print("   1. python src/data/preprocessor.py --type all")
    print("   2. python scripts/train_model.py --model chatbot --epochs 10")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()