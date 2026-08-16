#!/usr/bin/env python3
"""
Salifz AI - Data Download Script
Télécharge les datasets nécessaires pour l'entraînement
"""

import os
import json
import requests
import argparse
from pathlib import Path
from typing import Optional, List
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import yaml

# ============================================
# Configuration
# ============================================

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "raw"
CONFIG_PATH = BASE_DIR / "config" / "config.yaml"

# APIs
QURAN_API = "https://api.alquran.cloud/v1"
AUDIO_API = "https://everyayah.com/data"
TANZIL_API = "https://tanzil.net/trans"

# Reciters avec leurs identifiants
RECITERS = {
    "alafasy": {
        "name": "Mishary Rashid Alafasy",
        "folder": "Alafasy_128kbps",
        "format": "mp3"
    },
    "husary": {
        "name": "Mahmoud Khalil Al-Husary",
        "folder": "Husary_128kbps",
        "format": "mp3"
    },
    "minshawi": {
        "name": "Mohamed Siddiq El-Minshawi",
        "folder": "Minshawi_Murattal_128kbps",
        "format": "mp3"
    },
    "abdulbasit": {
        "name": "Abdul Basit Abdul Samad",
        "folder": "Abdul_Basit_Murattal_192kbps",
        "format": "mp3"
    },
    "sudais": {
        "name": "Abdul Rahman Al-Sudais",
        "folder": "Sudais_128kbps",
        "format": "mp3"
    }
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


def load_config():
    """Charger la configuration"""
    if CONFIG_PATH.exists():
        with open(CONFIG_PATH) as f:
            return yaml.safe_load(f)
    return {}


def create_directories():
    """Créer la structure de répertoires"""
    dirs = [
        DATA_DIR / "quran" / "text",
        DATA_DIR / "quran" / "audio",
        DATA_DIR / "tajwid",
        DATA_DIR / "conversations",
    ]
    for d in dirs:
        d.mkdir(parents=True, exist_ok=True)
    print("✅ Répertoires créés")


# ============================================
# Téléchargement du texte coranique
# ============================================

def download_quran_text():
    """Télécharger le texte du Coran en arabe"""
    print("\n📖 Téléchargement du texte coranique...")
    
    output_dir = DATA_DIR / "quran" / "text"
    
    # Télécharger tout le Coran
    url = f"{QURAN_API}/quran/ar.alafasy"
    
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        if data["code"] == 200:
            quran_data = data["data"]["surahs"]
            
            # Sauvegarder tout le Coran
            with open(output_dir / "quran_full.json", "w", encoding="utf-8") as f:
                json.dump(quran_data, f, ensure_ascii=False, indent=2)
            
            # Sauvegarder chaque sourate séparément
            for surah in tqdm(quran_data, desc="Saving surahs"):
                surah_file = output_dir / f"surah_{surah['number']:03d}.json"
                with open(surah_file, "w", encoding="utf-8") as f:
                    json.dump(surah, f, ensure_ascii=False, indent=2)
            
            print(f"✅ {len(quran_data)} sourates téléchargées")
            return True
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


def download_quran_with_tajwid():
    """Télécharger le Coran avec annotations de Tajwid"""
    print("\n📖 Téléchargement du Coran avec Tajwid...")
    
    output_dir = DATA_DIR / "tajwid"
    
    # API avec tajwid
    url = f"{QURAN_API}/quran/quran-tajweed"
    
    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()
        data = response.json()
        
        if data["code"] == 200:
            with open(output_dir / "quran_tajwid.json", "w", encoding="utf-8") as f:
                json.dump(data["data"], f, ensure_ascii=False, indent=2)
            
            print("✅ Coran avec Tajwid téléchargé")
            return True
            
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False


# ============================================
# Téléchargement de l'audio
# ============================================

def get_audio_url(reciter: str, surah: int, ayah: int) -> str:
    """Construire l'URL de l'audio"""
    reciter_info = RECITERS.get(reciter, RECITERS["alafasy"])
    # Format: 001001.mp3 (surah 3 digits + ayah 3 digits)
    filename = f"{surah:03d}{ayah:03d}.{reciter_info['format']}"
    return f"{AUDIO_API}/{reciter_info['folder']}/{filename}"


def download_audio_file(url: str, output_path: Path) -> bool:
    """Télécharger un fichier audio"""
    try:
        if output_path.exists():
            return True
            
        response = requests.get(url, timeout=30, stream=True)
        response.raise_for_status()
        
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
        
    except Exception:
        return False


def download_surah_audio(reciter: str, surah_num: int, output_dir: Path) -> int:
    """Télécharger tous les versets d'une sourate"""
    num_verses = SURAH_VERSES[surah_num - 1]
    downloaded = 0
    
    surah_dir = output_dir / f"surah_{surah_num:03d}"
    surah_dir.mkdir(exist_ok=True)
    
    for ayah in range(1, num_verses + 1):
        url = get_audio_url(reciter, surah_num, ayah)
        output_path = surah_dir / f"{surah_num:03d}{ayah:03d}.mp3"
        
        if download_audio_file(url, output_path):
            downloaded += 1
    
    return downloaded


def download_quran_audio(
    reciter: str = "alafasy",
    surahs: Optional[List[int]] = None,
    max_workers: int = 5
):
    """Télécharger l'audio du Coran"""
    print(f"\n🎙️ Téléchargement audio - Récitateur: {RECITERS[reciter]['name']}")
    
    output_dir = DATA_DIR / "quran" / "audio" / reciter
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Par défaut, télécharger les 10 premières sourates pour le test
    if surahs is None:
        surahs = list(range(1, 11))  # Sourates 1-10
    
    total_verses = sum(SURAH_VERSES[s-1] for s in surahs)
    print(f"📊 {len(surahs)} sourates, {total_verses} versets à télécharger")
    
    downloaded_total = 0
    
    with tqdm(total=len(surahs), desc="Downloading surahs") as pbar:
        for surah_num in surahs:
            downloaded = download_surah_audio(reciter, surah_num, output_dir)
            downloaded_total += downloaded
            pbar.update(1)
            pbar.set_postfix({"verses": downloaded_total})
    
    print(f"✅ {downloaded_total} fichiers audio téléchargés")
    return downloaded_total


# ============================================
# Génération des données de conversation
# ============================================

def generate_conversation_dataset():
    """Générer un dataset de conversations pour le chatbot"""
    print("\n💬 Génération du dataset de conversations...")
    
    output_dir = DATA_DIR / "conversations"
    
    # Exemples de conversations Q&A islamiques
    conversations = [
        # Questions générales sur le Coran
        {
            "context": "general",
            "conversations": [
                {"user": "كم عدد سور القرآن الكريم؟", "assistant": "عدد سور القرآن الكريم 114 سورة، منها 86 سورة مكية و28 سورة مدنية."},
                {"user": "كم عدد آيات القرآن الكريم؟", "assistant": "عدد آيات القرآن الكريم 6236 آية حسب العد الكوفي."},
                {"user": "ما أطول سورة في القرآن؟", "assistant": "أطول سورة في القرآن هي سورة البقرة، وتتكون من 286 آية."},
                {"user": "ما أقصر سورة في القرآن؟", "assistant": "أقصر سورة في القرآن هي سورة الكوثر، وتتكون من 3 آيات."},
            ]
        },
        # نصائح الحفظ
        {
            "context": "memorization",
            "conversations": [
                {"user": "كيف أحفظ القرآن بسرعة؟", "assistant": "إليك بعض النصائح للحفظ السريع:\n1. اختر وقت الفجر للحفظ فهو أفضل الأوقات\n2. كرر الآية 20 مرة قبل الانتقال للتالية\n3. اربط الآيات ببعضها\n4. راجع ما حفظت قبل النوم\n5. استمع للتلاوة بكثرة"},
                {"user": "ما أفضل طريقة لتثبيت الحفظ؟", "assistant": "أفضل طريقة لتثبيت الحفظ هي المراجعة المستمرة:\n1. راجع كل يوم ما حفظته بالأمس\n2. راجع أسبوعياً ما حفظته في الأسبوع\n3. صلِّ بما تحفظ\n4. اقرأ في ورد يومي ثابت"},
                {"user": "كم آية يجب أن أحفظ يومياً؟", "assistant": "يعتمد ذلك على قدرتك ووقتك المتاح:\n- للمبتدئين: 3-5 آيات يومياً\n- للمتوسطين: 5-10 آيات يومياً\n- للمتقدمين: صفحة أو أكثر يومياً\nالأهم هو الاستمرار والمراجعة."},
            ]
        },
        # أحكام التجويد
        {
            "context": "tajwid",
            "conversations": [
                {"user": "ما هو الإدغام؟", "assistant": "الإدغام هو إدخال حرف ساكن في حرف متحرك بحيث يصيران حرفاً واحداً مشدداً. وينقسم إلى:\n1. إدغام بغنة: في حروف (ينمو) - يَنْمُو\n2. إدغام بغير غنة: في حرفي (ل، ر)"},
                {"user": "ما هو الإخفاء؟", "assistant": "الإخفاء هو النطق بالنون الساكنة أو التنوين بحالة بين الإظهار والإدغام مع بقاء الغنة. حروفه 15 حرفاً مجموعة في: (صف ذا ثنا كم جاد شخص قد سما دم طيباً زد في تقى ضع ظالماً)"},
                {"user": "ما هي أنواع المد؟", "assistant": "أنواع المد الرئيسية:\n1. المد الطبيعي: مقدار حركتين\n2. المد المتصل: 4-5 حركات (الهمزة بعد حرف المد في كلمة واحدة)\n3. المد المنفصل: 4-5 حركات (الهمزة في كلمة أخرى)\n4. المد العارض للسكون: 2-4-6 حركات\n5. المد اللازم: 6 حركات"},
            ]
        },
        # تشجيع ودعم
        {
            "context": "motivation",
            "conversations": [
                {"user": "أشعر بصعوبة في الحفظ", "assistant": "لا تقلق، هذا طبيعي في البداية! تذكر أن:\n- كل حافظ للقرآن مر بهذه المرحلة\n- الصبر والمثابرة هما المفتاح\n- ابدأ بالسور القصيرة لبناء الثقة\n- اجعل لك ورداً يومياً ولو قليلاً\nأنت تستطيع! 💪"},
                {"user": "نسيت ما حفظته", "assistant": "النسيان أمر طبيعي، والحل في المراجعة المستمرة:\n1. راجع يومياً ولو 10 دقائق\n2. صلِّ بما تحفظ\n3. استمع للتلاوة أثناء التنقل\n4. اقرأ في المصحف بانتظام\nتذكر: من ترك المراجعة أسبوعاً فاته الكثير!"},
            ]
        },
    ]
    
    # Sauvegarder le dataset
    with open(output_dir / "conversations.json", "w", encoding="utf-8") as f:
        json.dump(conversations, f, ensure_ascii=False, indent=2)
    
    # Créer format d'entraînement
    training_data = []
    for category in conversations:
        for conv in category["conversations"]:
            training_data.append({
                "instruction": conv["user"],
                "input": "",
                "output": conv["assistant"],
                "context": category["context"]
            })
    
    with open(output_dir / "training_data.json", "w", encoding="utf-8") as f:
        json.dump(training_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(training_data)} conversations générées")
    return len(training_data)


# ============================================
# Génération des annotations Tajwid
# ============================================

def generate_tajwid_annotations():
    """Générer des annotations de Tajwid pour l'entraînement"""
    print("\n📝 Génération des annotations Tajwid...")
    
    output_dir = DATA_DIR / "tajwid"
    
    # Exemples d'annotations (format BIO)
    annotations = [
        {
            "text": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
            "tokens": ["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ"],
            "labels": ["O", "IDGHAM", "MADD_TABII", "MADD_TABII"],
            "surah": 1,
            "ayah": 1
        },
        {
            "text": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
            "tokens": ["الْحَمْدُ", "لِلَّهِ", "رَبِّ", "الْعَالَمِينَ"],
            "labels": ["QALQALA", "IDGHAM", "O", "MADD_TABII"],
            "surah": 1,
            "ayah": 2
        },
        {
            "text": "الرَّحْمَٰنِ الرَّحِيمِ",
            "tokens": ["الرَّحْمَٰنِ", "الرَّحِيمِ"],
            "labels": ["MADD_TABII", "MADD_TABII"],
            "surah": 1,
            "ayah": 3
        },
        {
            "text": "مَالِكِ يَوْمِ الدِّينِ",
            "tokens": ["مَالِكِ", "يَوْمِ", "الدِّينِ"],
            "labels": ["MADD_TABII", "O", "MADD_TABII"],
            "surah": 1,
            "ayah": 4
        },
        {
            "text": "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
            "tokens": ["إِيَّاكَ", "نَعْبُدُ", "وَإِيَّاكَ", "نَسْتَعِينُ"],
            "labels": ["MADD_TABII", "QALQALA", "MADD_TABII", "MADD_TABII"],
            "surah": 1,
            "ayah": 5
        },
    ]
    
    # Règles de Tajwid avec descriptions
    tajwid_rules = {
        "IDGHAM": {
            "name_ar": "إدغام",
            "name_en": "Idgham",
            "description": "Merging of a non-voweled letter into a voweled letter",
            "color": "#FF6B6B"
        },
        "IKHFA": {
            "name_ar": "إخفاء",
            "name_en": "Ikhfa",
            "description": "Hiding the noon sakinah or tanween",
            "color": "#4ECDC4"
        },
        "IQLAB": {
            "name_ar": "إقلاب",
            "name_en": "Iqlab",
            "description": "Changing noon sakinah to meem",
            "color": "#45B7D1"
        },
        "IZHAR": {
            "name_ar": "إظهار",
            "name_en": "Izhar",
            "description": "Clear pronunciation of noon sakinah",
            "color": "#96CEB4"
        },
        "GHUNNA": {
            "name_ar": "غنة",
            "name_en": "Ghunna",
            "description": "Nasalization sound",
            "color": "#FFEAA7"
        },
        "QALQALA": {
            "name_ar": "قلقلة",
            "name_en": "Qalqala",
            "description": "Echoing sound on certain letters",
            "color": "#DDA0DD"
        },
        "MADD_TABII": {
            "name_ar": "مد طبيعي",
            "name_en": "Natural Madd",
            "description": "Natural prolongation of 2 counts",
            "color": "#98D8C8"
        },
        "MADD_MUTTASIL": {
            "name_ar": "مد متصل",
            "name_en": "Connected Madd",
            "description": "Prolongation when hamza follows in same word",
            "color": "#F7DC6F"
        },
        "MADD_MUNFASIL": {
            "name_ar": "مد منفصل",
            "name_en": "Separated Madd",
            "description": "Prolongation when hamza is in next word",
            "color": "#BB8FCE"
        },
    }
    
    # Sauvegarder
    with open(output_dir / "annotations.json", "w", encoding="utf-8") as f:
        json.dump(annotations, f, ensure_ascii=False, indent=2)
    
    with open(output_dir / "tajwid_rules.json", "w", encoding="utf-8") as f:
        json.dump(tajwid_rules, f, ensure_ascii=False, indent=2)
    
    print(f"✅ {len(annotations)} annotations générées")
    print(f"✅ {len(tajwid_rules)} règles de Tajwid définies")


# ============================================
# Main
# ============================================

def main():
    parser = argparse.ArgumentParser(description="Download Salifz AI datasets")
    parser.add_argument("--type", choices=["all", "text", "audio", "tajwid", "conversations"],
                        default="all", help="Type of data to download")
    parser.add_argument("--reciter", default="alafasy", choices=list(RECITERS.keys()),
                        help="Reciter for audio download")
    parser.add_argument("--surahs", type=str, default="1-10",
                        help="Surahs to download (e.g., '1-10' or '1,2,3')")
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("🚀 Salifz AI - Data Download")
    print("=" * 50)
    
    # Créer les répertoires
    create_directories()
    
    # Parser les sourates
    if "-" in args.surahs:
        start, end = map(int, args.surahs.split("-"))
        surahs = list(range(start, end + 1))
    else:
        surahs = [int(s) for s in args.surahs.split(",")]
    
    # Télécharger selon le type
    if args.type in ["all", "text"]:
        download_quran_text()
    
    if args.type in ["all", "audio"]:
        download_quran_audio(reciter=args.reciter, surahs=surahs)
    
    if args.type in ["all", "tajwid"]:
        download_quran_with_tajwid()
        generate_tajwid_annotations()
    
    if args.type in ["all", "conversations"]:
        generate_conversation_dataset()
    
    print("\n" + "=" * 50)
    print("✅ Téléchargement terminé!")
    print("=" * 50)


if __name__ == "__main__":
    main()
