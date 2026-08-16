#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    Salifz AI - Data Download Script (FULL)                 ║
║                                                                               ║
║  Ce script télécharge TOUTES les données nécessaires pour l'entraînement:    ║
║  - Texte du Coran complet (114 sourates)                                      ║
║  - Audio de TOUTES les sourates (114) pour plusieurs récitateurs             ║
║  - Annotations de Tajwid détaillées                                           ║
║  - Dataset de conversations enrichi                                           ║
║  - Traductions en plusieurs langues                                           ║
║  - Tafsir (exégèse)                                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

Usage:
    python download_data_full.py --type all                    # Tout télécharger
    python download_data_full.py --type audio --surahs 1-114   # Audio complet
    python download_data_full.py --type text                   # Texte seulement
    python download_data_full.py --reciter alafasy,husary      # Plusieurs récitateurs
"""

import os
import sys
import json
import time
import hashlib
import requests
import argparse
from pathlib import Path
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime

# Barre de progression
try:
    from tqdm import tqdm
    TQDM_AVAILABLE = True
except ImportError:
    TQDM_AVAILABLE = False
    class tqdm:
        def __init__(self, iterable=None, total=None, desc="", **kwargs):
            self.iterable = iterable
            self.total = total or (len(iterable) if iterable else 0)
            self.desc = desc
            self.n = 0
        def __iter__(self):
            for item in self.iterable:
                yield item
                self.n += 1
                print(f"\r{self.desc}: {self.n}/{self.total} ({self.n/self.total*100:.1f}%)", end="")
            print()
        def update(self, n=1): self.n += n
        def set_postfix(self, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass

# ============================================
# Configuration Globale
# ============================================

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"
LOG_FILE = BASE_DIR / "logs" / "download.log"

# APIs
APIS = {
    "quran_cloud": "https://api.alquran.cloud/v1",
    "audio_everyayah": "https://everyayah.com/data",
}

# Récitateurs disponibles
RECITERS = {
    "alafasy": {"name": "Mishary Rashid Alafasy", "folder": "Alafasy_128kbps", "format": "mp3"},
    "husary": {"name": "Mahmoud Khalil Al-Husary", "folder": "Husary_128kbps", "format": "mp3"},
    "minshawi": {"name": "Mohamed Siddiq El-Minshawi", "folder": "Minshawi_Murattal_128kbps", "format": "mp3"},
    "abdulbasit": {"name": "Abdul Basit Abdul Samad", "folder": "Abdul_Basit_Murattal_192kbps", "format": "mp3"},
    "sudais": {"name": "Abdul Rahman Al-Sudais", "folder": "Sudais_128kbps", "format": "mp3"},
    "shuraym": {"name": "Saud Al-Shuraym", "folder": "Shuraym_128kbps", "format": "mp3"},
}

# Nombre de versets par sourate (1-114)
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
    13: ("الرعد", "Ar-Ra'd"), 14: ("إبراهيم", "Ibrahim"), 15: ("الحجر", "Al-Hijr"),
    16: ("النحل", "An-Nahl"), 17: ("الإسراء", "Al-Isra"), 18: ("الكهف", "Al-Kahf"),
    19: ("مريم", "Maryam"), 20: ("طه", "Ta-Ha"), 21: ("الأنبياء", "Al-Anbiya"),
    22: ("الحج", "Al-Hajj"), 23: ("المؤمنون", "Al-Mu'minun"), 24: ("النور", "An-Nur"),
    25: ("الفرقان", "Al-Furqan"), 26: ("الشعراء", "Ash-Shu'ara"), 27: ("النمل", "An-Naml"),
    28: ("القصص", "Al-Qasas"), 29: ("العنكبوت", "Al-Ankabut"), 30: ("الروم", "Ar-Rum"),
    31: ("لقمان", "Luqman"), 32: ("السجدة", "As-Sajdah"), 33: ("الأحزاب", "Al-Ahzab"),
    34: ("سبأ", "Saba"), 35: ("فاطر", "Fatir"), 36: ("يس", "Ya-Sin"),
    37: ("الصافات", "As-Saffat"), 38: ("ص", "Sad"), 39: ("الزمر", "Az-Zumar"),
    40: ("غافر", "Ghafir"), 41: ("فصلت", "Fussilat"), 42: ("الشورى", "Ash-Shura"),
    43: ("الزخرف", "Az-Zukhruf"), 44: ("الدخان", "Ad-Dukhan"), 45: ("الجاثية", "Al-Jathiyah"),
    46: ("الأحقاف", "Al-Ahqaf"), 47: ("محمد", "Muhammad"), 48: ("الفتح", "Al-Fath"),
    49: ("الحجرات", "Al-Hujurat"), 50: ("ق", "Qaf"), 51: ("الذاريات", "Adh-Dhariyat"),
    52: ("الطور", "At-Tur"), 53: ("النجم", "An-Najm"), 54: ("القمر", "Al-Qamar"),
    55: ("الرحمن", "Ar-Rahman"), 56: ("الواقعة", "Al-Waqi'ah"), 57: ("الحديد", "Al-Hadid"),
    58: ("المجادلة", "Al-Mujadila"), 59: ("الحشر", "Al-Hashr"), 60: ("الممتحنة", "Al-Mumtahina"),
    61: ("الصف", "As-Saff"), 62: ("الجمعة", "Al-Jumu'ah"), 63: ("المنافقون", "Al-Munafiqun"),
    64: ("التغابن", "At-Taghabun"), 65: ("الطلاق", "At-Talaq"), 66: ("التحريم", "At-Tahrim"),
    67: ("الملك", "Al-Mulk"), 68: ("القلم", "Al-Qalam"), 69: ("الحاقة", "Al-Haqqah"),
    70: ("المعارج", "Al-Ma'arij"), 71: ("نوح", "Nuh"), 72: ("الجن", "Al-Jinn"),
    73: ("المزمل", "Al-Muzzammil"), 74: ("المدثر", "Al-Muddathir"), 75: ("القيامة", "Al-Qiyamah"),
    76: ("الإنسان", "Al-Insan"), 77: ("المرسلات", "Al-Mursalat"), 78: ("النبأ", "An-Naba"),
    79: ("النازعات", "An-Nazi'at"), 80: ("عبس", "Abasa"), 81: ("التكوير", "At-Takwir"),
    82: ("الانفطار", "Al-Infitar"), 83: ("المطففين", "Al-Mutaffifin"), 84: ("الانشقاق", "Al-Inshiqaq"),
    85: ("البروج", "Al-Buruj"), 86: ("الطارق", "At-Tariq"), 87: ("الأعلى", "Al-A'la"),
    88: ("الغاشية", "Al-Ghashiyah"), 89: ("الفجر", "Al-Fajr"), 90: ("البلد", "Al-Balad"),
    91: ("الشمس", "Ash-Shams"), 92: ("الليل", "Al-Layl"), 93: ("الضحى", "Ad-Duha"),
    94: ("الشرح", "Ash-Sharh"), 95: ("التين", "At-Tin"), 96: ("العلق", "Al-Alaq"),
    97: ("القدر", "Al-Qadr"), 98: ("البينة", "Al-Bayyinah"), 99: ("الزلزلة", "Az-Zalzalah"),
    100: ("العاديات", "Al-Adiyat"), 101: ("القارعة", "Al-Qari'ah"), 102: ("التكاثر", "At-Takathur"),
    103: ("العصر", "Al-Asr"), 104: ("الهمزة", "Al-Humazah"), 105: ("الفيل", "Al-Fil"),
    106: ("قريش", "Quraysh"), 107: ("الماعون", "Al-Ma'un"), 108: ("الكوثر", "Al-Kawthar"),
    109: ("الكافرون", "Al-Kafirun"), 110: ("النصر", "An-Nasr"), 111: ("المسد", "Al-Masad"),
    112: ("الإخلاص", "Al-Ikhlas"), 113: ("الفلق", "Al-Falaq"), 114: ("الناس", "An-Nas"),
}


def log(message: str, level: str = "INFO"):
    """Logger simple avec couleurs"""
    colors = {"INFO": "\033[94m", "SUCCESS": "\033[92m", "WARNING": "\033[93m", "ERROR": "\033[91m", "RESET": "\033[0m"}
    emojis = {"INFO": "ℹ️", "SUCCESS": "✅", "WARNING": "⚠️", "ERROR": "❌"}
    print(f"{emojis.get(level, '')} {colors.get(level, '')}{message}{colors['RESET']}")


def create_directories():
    """Créer la structure de répertoires"""
    dirs = [
        DATA_DIR / "quran" / "text" / "translations",
        DATA_DIR / "quran" / "audio",
        DATA_DIR / "tajwid" / "annotations",
        DATA_DIR / "tajwid" / "rules",
        DATA_DIR / "conversations",
        DATA_DIR / "metadata",
        BASE_DIR / "logs",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
    log("Structure de répertoires créée", "SUCCESS")


def download_with_retry(url: str, output_path: Path, max_retries: int = 3) -> bool:
    """Télécharger avec retry"""
    for attempt in range(max_retries):
        try:
            if output_path.exists():
                return True
            response = requests.get(url, timeout=30, stream=True)
            response.raise_for_status()
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            return True
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                return False
    return False


# ============================================
# Téléchargement du Texte
# ============================================

def download_quran_text():
    """Télécharger le texte complet du Coran"""
    log("Téléchargement du Texte Coranique Complet", "INFO")
    print("=" * 60)
    
    output_dir = DATA_DIR / "quran" / "text"
    
    editions = [
        ("quran-uthmani", "uthmani", "Texte Uthmani"),
        ("quran-simple", "simple", "Texte simplifié"),
    ]
    
    for edition_id, filename, description in editions:
        url = f"{APIS['quran_cloud']}/quran/{edition_id}"
        try:
            log(f"  → {description}...", "INFO")
            response = requests.get(url, timeout=120)
            response.raise_for_status()
            data = response.json()
            
            if data["code"] == 200:
                quran_data = data["data"]["surahs"]
                with open(output_dir / f"quran_{filename}.json", "w", encoding="utf-8") as f:
                    json.dump(quran_data, f, ensure_ascii=False, indent=2)
                
                # Sauvegarder chaque sourate
                for surah in tqdm(quran_data, desc=f"  Saving {filename}"):
                    surah_file = output_dir / f"surah_{surah['number']:03d}.json"
                    with open(surah_file, "w", encoding="utf-8") as f:
                        json.dump(surah, f, ensure_ascii=False, indent=2)
                
                log(f"  ✓ {filename}: {len(quran_data)} sourates", "SUCCESS")
        except Exception as e:
            log(f"  ✗ Erreur: {e}", "ERROR")
    
    # Métadonnées
    metadata = {
        "total_surahs": 114,
        "total_verses": sum(SURAH_VERSES),
        "surahs": [{"number": i+1, "name_ar": SURAH_NAMES[i+1][0], "name_en": SURAH_NAMES[i+1][1], "verses": SURAH_VERSES[i]} for i in range(114)],
        "downloaded_at": datetime.now().isoformat()
    }
    with open(DATA_DIR / "metadata" / "quran_metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)
    
    log(f"Texte téléchargé: 114 sourates, {sum(SURAH_VERSES)} versets", "SUCCESS")


def download_translations():
    """Télécharger les traductions"""
    log("Téléchargement des Traductions", "INFO")
    print("=" * 60)
    
    output_dir = DATA_DIR / "quran" / "text" / "translations"
    
    translations = [
        ("fr.hamidullah", "french"),
        ("en.sahih", "english"),
        ("es.cortes", "spanish"),
        ("de.bubenheim", "german"),
        ("tr.diyanet", "turkish"),
    ]
    
    for edition_id, lang in translations:
        url = f"{APIS['quran_cloud']}/quran/{edition_id}"
        try:
            log(f"  → {lang}...", "INFO")
            response = requests.get(url, timeout=120)
            if response.status_code == 200:
                data = response.json()
                with open(output_dir / f"translation_{lang}.json", "w", encoding="utf-8") as f:
                    json.dump(data.get("data", {}), f, ensure_ascii=False, indent=2)
                log(f"  ✓ {lang}", "SUCCESS")
        except:
            log(f"  ✗ {lang}", "WARNING")


# ============================================
# Téléchargement Audio
# ============================================

def download_quran_audio(reciters: List[str] = None, surahs: List[int] = None):
    """Télécharger l'audio complet du Coran"""
    log("Téléchargement Audio du Coran", "INFO")
    print("=" * 60)
    
    if reciters is None:
        reciters = ["alafasy"]
    if surahs is None:
        surahs = list(range(1, 115))  # 1-114
    
    # Valider récitateurs
    valid_reciters = [r for r in reciters if r in RECITERS]
    if not valid_reciters:
        log(f"Aucun récitateur valide. Disponibles: {list(RECITERS.keys())}", "ERROR")
        return
    
    total_verses = sum(SURAH_VERSES[s-1] for s in surahs)
    log(f"Configuration:", "INFO")
    log(f"  • Récitateurs: {', '.join(valid_reciters)}", "INFO")
    log(f"  • Sourates: {len(surahs)} ({min(surahs)}-{max(surahs)})", "INFO")
    log(f"  • Versets: {total_verses}", "INFO")
    log(f"  • Estimation: ~{total_verses * len(valid_reciters) * 0.1:.0f} MB", "INFO")
    
    global_stats = {"downloaded": 0, "skipped": 0, "failed": 0}
    
    for reciter in valid_reciters:
        reciter_info = RECITERS[reciter]
        log(f"\n🎤 Récitateur: {reciter_info['name']}", "INFO")
        
        output_dir = DATA_DIR / "quran" / "audio" / reciter
        output_dir.mkdir(parents=True, exist_ok=True)
        
        stats = {"downloaded": 0, "skipped": 0, "failed": 0}
        
        with tqdm(total=total_verses, desc=f"  {reciter}") as pbar:
            for surah_num in surahs:
                num_verses = SURAH_VERSES[surah_num - 1]
                surah_dir = output_dir / f"surah_{surah_num:03d}"
                surah_dir.mkdir(exist_ok=True)
                
                for ayah in range(1, num_verses + 1):
                    filename = f"{surah_num:03d}{ayah:03d}.mp3"
                    url = f"{APIS['audio_everyayah']}/{reciter_info['folder']}/{filename}"
                    output_path = surah_dir / filename
                    
                    if output_path.exists():
                        stats["skipped"] += 1
                    elif download_with_retry(url, output_path):
                        stats["downloaded"] += 1
                    else:
                        stats["failed"] += 1
                    
                    pbar.update(1)
                    pbar.set_postfix(dl=stats["downloaded"], skip=stats["skipped"], fail=stats["failed"])
        
        log(f"  ✓ {reciter}: {stats['downloaded']} téléchargés, {stats['skipped']} existants, {stats['failed']} échecs", "SUCCESS")
        
        for k in global_stats:
            global_stats[k] += stats[k]
    
    log(f"\nRÉSUMÉ: {global_stats['downloaded']} téléchargés, {global_stats['skipped']} existants, {global_stats['failed']} échecs", "SUCCESS")


# ============================================
# Tajwid
# ============================================

def download_tajwid():
    """Télécharger le Coran avec Tajwid"""
    log("Téléchargement Tajwid", "INFO")
    print("=" * 60)
    
    output_dir = DATA_DIR / "tajwid"
    
    url = f"{APIS['quran_cloud']}/quran/quran-tajweed"
    try:
        response = requests.get(url, timeout=120)
        if response.status_code == 200:
            data = response.json()
            with open(output_dir / "quran_tajwid.json", "w", encoding="utf-8") as f:
                json.dump(data.get("data", {}), f, ensure_ascii=False, indent=2)
            log("Coran avec Tajwid téléchargé", "SUCCESS")
    except Exception as e:
        log(f"Erreur: {e}", "ERROR")
    
    # Règles de Tajwid
    tajwid_rules = {
        "IZHAR": {"name_ar": "إظهار", "letters": ["ء", "ه", "ع", "ح", "غ", "خ"], "color": "#4CAF50"},
        "IDGHAM_GHUNNAH": {"name_ar": "إدغام بغنة", "letters": ["ي", "ن", "م", "و"], "color": "#2196F3"},
        "IDGHAM_BILA": {"name_ar": "إدغام بلا غنة", "letters": ["ل", "ر"], "color": "#9C27B0"},
        "IKHFA": {"name_ar": "إخفاء", "letters": ["ت", "ث", "ج", "د", "ذ", "ز", "س", "ش", "ص", "ض", "ط", "ظ", "ف", "ق", "ك"], "color": "#FF9800"},
        "IQLAB": {"name_ar": "إقلاب", "letters": ["ب"], "color": "#E91E63"},
        "QALQALA": {"name_ar": "قلقلة", "letters": ["ق", "ط", "ب", "ج", "د"], "color": "#795548"},
        "GHUNNAH": {"name_ar": "غنة", "letters": ["ن", "م"], "color": "#673AB7"},
        "MADD_TABII": {"name_ar": "مد طبيعي", "duration": 2, "color": "#8BC34A"},
        "MADD_MUTTASIL": {"name_ar": "مد متصل", "duration": "4-5", "color": "#FFEB3B"},
        "MADD_MUNFASIL": {"name_ar": "مد منفصل", "duration": "4-5", "color": "#FFC107"},
        "MADD_LAZIM": {"name_ar": "مد لازم", "duration": 6, "color": "#FF5722"},
    }
    
    with open(output_dir / "rules" / "tajwid_rules.json", "w", encoding="utf-8") as f:
        json.dump(tajwid_rules, f, ensure_ascii=False, indent=2)
    
    log(f"{len(tajwid_rules)} règles de Tajwid définies", "SUCCESS")


# ============================================
# Conversations
# ============================================

def generate_conversations():
    """Générer le dataset de conversations"""
    log("Génération du Dataset de Conversations", "INFO")
    print("=" * 60)
    
    output_dir = DATA_DIR / "conversations"
    
    conversations = [
        # Général
        {"instruction": "كم عدد سور القرآن الكريم؟", "output": "عدد سور القرآن الكريم 114 سورة، منها 86 مكية و28 مدنية. 📖", "context": "general"},
        {"instruction": "كم عدد آيات القرآن الكريم؟", "output": "عدد آيات القرآن الكريم 6236 آية حسب العد الكوفي.", "context": "general"},
        {"instruction": "ما أطول سورة في القرآن؟", "output": "أطول سورة هي سورة البقرة (286 آية).", "context": "general"},
        {"instruction": "ما أقصر سورة في القرآن؟", "output": "أقصر سورة هي سورة الكوثر (3 آيات).", "context": "general"},
        
        # حفظ
        {"instruction": "كيف أحفظ القرآن بسرعة؟", "output": "نصائح للحفظ:\n1️⃣ اختر وقت الفجر\n2️⃣ كرر الآية 20 مرة\n3️⃣ افهم المعنى\n4️⃣ راجع قبل النوم\n5️⃣ استمع كثيراً\n\nالاستمرارية أهم من السرعة! 💪", "context": "memorization"},
        {"instruction": "كم آية أحفظ يومياً؟", "output": "للمبتدئين: 3-5 آيات\nللمتوسطين: 5-10 آيات\nللمتقدمين: صفحة أو أكثر\n\n⭐ القليل الدائم خير من الكثير المنقطع", "context": "memorization"},
        {"instruction": "أفضل طريقة للمراجعة؟", "output": "المراجعة أهم من الحفظ!\n\n🔄 يومياً: راجع ما حفظت بالأمس\n📅 أسبوعياً: راجع ما حفظت هذا الأسبوع\n📖 صلِّ بما تحفظ\n🎧 استمع أثناء التنقل", "context": "memorization"},
        
        # تجويد
        {"instruction": "ما هو الإدغام؟", "output": "الإدغام: إدخال حرف ساكن في متحرك ليصيرا حرفاً مشدداً.\n\n1️⃣ بغنة: في (ينمو)\n2️⃣ بلا غنة: في (ل، ر)\n\nمثال: \"مَن يَعْمَلْ\" ← \"مَيَّعْمَلْ\"", "context": "tajwid"},
        {"instruction": "ما هو الإخفاء؟", "output": "الإخفاء: النطق بالنون الساكنة بين الإظهار والإدغام مع الغنة.\n\nحروفه 15 في: \"صف ذا ثنا كم جاد شخص قد سما دم طيباً زد في تقى ضع ظالماً\"", "context": "tajwid"},
        {"instruction": "ما هي القلقلة؟", "output": "القلقلة: اضطراب صوتي عند نطق حروف (قطب جد) ساكنة.\n\n• صغرى: وسط الكلمة\n• كبرى: آخر الكلمة عند الوقف", "context": "tajwid"},
        {"instruction": "أنواع المد؟", "output": "أنواع المد:\n\n1️⃣ طبيعي: حركتان\n2️⃣ متصل: 4-5 حركات\n3️⃣ منفصل: 4-5 حركات\n4️⃣ عارض للسكون: 2-4-6\n5️⃣ لازم: 6 حركات", "context": "tajwid"},
        
        # تحفيز
        {"instruction": "أشعر بصعوبة في الحفظ", "output": "لا تقلق! هذا طبيعي 💚\n\n🌟 تذكر:\n• كل حافظ مر بهذه المرحلة\n• القرآن ميسر للذكر\n• ابدأ بآية واحدة يومياً\n• الصبر مفتاح النجاح\n\nأنت قادر! 💪", "context": "motivation"},
        {"instruction": "نسيت ما حفظته", "output": "النسيان طبيعي!\n\n🔄 الحل: المراجعة\n• يومياً: آخر ما حفظت\n• أسبوعياً: ما حفظت هذا الأسبوع\n• صلِّ بالمحفوظ\n\nما نسيته يمكن استرجاعه بإذن الله! 💪", "context": "motivation"},
        {"instruction": "شكراً سالي", "output": "العفو! سعيدة بمساعدتك 😊💚\n\nبالتوفيق في رحلتك مع القرآن!\n\n🤲 اللهم اجعل القرآن ربيع قلبه ونور صدره", "context": "general"},
    ]
    
    # Format Alpaca
    training_data = [{"instruction": c["instruction"], "input": "", "output": c["output"], "context": c["context"]} for c in conversations]
    with open(output_dir / "training_data.json", "w", encoding="utf-8") as f:
        json.dump(training_data, f, ensure_ascii=False, indent=2)
    
    # Format ShareGPT
    system_prompt = "أنت سالي، مساعدة ذكية لتعليم القرآن والتجويد. كوني ودودة ومشجعة."
    sharegpt = [{"conversations": [{"from": "system", "value": system_prompt}, {"from": "human", "value": c["instruction"]}, {"from": "gpt", "value": c["output"]}]} for c in conversations]
    with open(output_dir / "training_data_sharegpt.json", "w", encoding="utf-8") as f:
        json.dump(sharegpt, f, ensure_ascii=False, indent=2)
    
    log(f"{len(training_data)} conversations générées", "SUCCESS")


# ============================================
# Main
# ============================================

def main():
    parser = argparse.ArgumentParser(description="Salifz AI - Téléchargement des données")
    parser.add_argument("--type", choices=["all", "text", "audio", "tajwid", "conversations", "translations"], default="all")
    parser.add_argument("--reciter", default="alafasy", help="Récitateur(s) séparés par virgule")
    parser.add_argument("--surahs", default="1-114", help="Sourates (ex: 1-114 ou 1,2,36)")
    
    args = parser.parse_args()
    
    print("\n" + "=" * 70)
    print("🚀 Salifz AI - Téléchargement des Données")
    print("=" * 70)
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📋 Type: {args.type}")
    print("=" * 70 + "\n")
    
    create_directories()
    
    # Parser sourates
    if "-" in args.surahs:
        start, end = map(int, args.surahs.split("-"))
        surahs = list(range(start, end + 1))
    else:
        surahs = [int(s) for s in args.surahs.split(",")]
    
    # Parser récitateurs
    reciters = [r.strip() for r in args.reciter.split(",")]
    
    start_time = datetime.now()
    
    if args.type in ["all", "text"]:
        download_quran_text()
    
    if args.type in ["all", "translations"]:
        download_translations()
    
    if args.type in ["all", "audio"]:
        download_quran_audio(reciters=reciters, surahs=surahs)
    
    if args.type in ["all", "tajwid"]:
        download_tajwid()
    
    if args.type in ["all", "conversations"]:
        generate_conversations()
    
    duration = datetime.now() - start_time
    
    print("\n" + "=" * 70)
    print("✅ Téléchargement Terminé!")
    print(f"⏱️  Durée: {duration}")
    print(f"📂 Données: {DATA_DIR}")
    print("=" * 70)
    print("\n🎯 Prochaines étapes:")
    print("   1. python src/data/preprocessor.py --type all")
    print("   2. python scripts/train_model.py --model chatbot")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()